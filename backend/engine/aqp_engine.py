from .planner import Planner
from .executor import Executor
from .estimator import (
    estimate_count,
    estimate_sum_from_stats,
    estimate_avg_from_stats
)


class AQPEngine:

    def _safe_identifier(self, name: str) -> str:
        """
        VERY IMPORTANT:
        This is a minimal safeguard.
        Final protection must come from validator whitelist.
        """
        if not name.replace("_", "").isalnum():
            raise ValueError(f"Unsafe identifier: {name}")
        return name

    def run_query(
        self,
        table,
        column,
        query_type,
        target_error,
        group_by=None,
        confidence=0.95
    ):

        # -------------------------
        # SANITIZE IDENTIFIERS
        # -------------------------
        table = self._safe_identifier(table)
        if column:
            column = self._safe_identifier(column)
        if group_by:
            group_by = self._safe_identifier(group_by)

        # -------------------------
        # STEP 1: table size
        # -------------------------
        size_result = Executor.run(f"SELECT COUNT(*) as c FROM {table}")
        size = size_result["c"]

        plan = Planner.choose_plan(size, query_type, target_error)

        # =========================
        # EXACT PATH
        # =========================
        if plan["mode"] == "exact":

            if group_by:
                agg_expr = {
                    "SUM": f"SUM({column})",
                    "COUNT": "COUNT(*)",
                    "AVG": f"AVG({column})",
                    "COUNT_DISTINCT": f"COUNT(DISTINCT {column})"
                }[query_type]

                sql = f"""
                    SELECT {group_by} as grp, {agg_expr} as result
                    FROM {table}
                    GROUP BY {group_by}
                """

                df = Executor.run(sql)

                return {
                    row["grp"]: float(row["result"]) if row["result"] is not None else 0
                    for _, row in df.iterrows()
                }

            sql_map = {
                "COUNT": f"COUNT(*)",
                "COUNT_DISTINCT": f"COUNT(DISTINCT {column})",
                "SUM": f"SUM({column})",
                "AVG": f"AVG({column})"
            }

            sql = f"SELECT {sql_map[query_type]} as result FROM {table}"
            result = Executor.run(sql)

            return {
                "estimate": float(result["result"] or 0),
                "error_margin": 0,
                "confidence": 1.0
            }

        # =========================
        # APPROX PATH (FIXED CORE)
        # =========================

        p = plan["fraction"]
        fraction_percent = p * 100

        # =========================
        # GROUP BY (still basic but safe)
        # =========================
        if group_by:

            agg_expr = {
                "SUM": f"SUM({column})",
                "COUNT": "COUNT(*)",
                "AVG": f"AVG({column})",
                "COUNT_DISTINCT": f"APPROX_COUNT_DISTINCT({column})"
            }[query_type]

            sql = f"""
                SELECT 
                    {group_by} as grp,
                    COUNT(*) as n,
                    {agg_expr} as agg
                FROM {table}
                USING SAMPLE {fraction_percent} PERCENT
                GROUP BY {group_by}
            """

            df = Executor.run(sql)

            results = {}

            for _, row in df.iterrows():
                val = row["agg"]

                if query_type in ["SUM", "COUNT"]:
                    val = val / p

                results[row["grp"]] = float(val) if val is not None else 0

            return results

        # =========================
        # SCALAR — FULLY SQL-DRIVEN
        # =========================

        # ---- COUNT ----
        if query_type == "COUNT":

            sql = f"""
                SELECT COUNT(*) as n
                FROM {table}
                USING SAMPLE {fraction_percent} PERCENT
            """
            result = Executor.run(sql)

            return estimate_count(result["n"], p, confidence)

        # ---- SUM ----
        if query_type == "SUM":

            sql = f"""
                SELECT 
                    COUNT(*) as n,
                    AVG({column}) as mean,
                    VAR_SAMP({column}) as var
                FROM {table}
                USING SAMPLE {fraction_percent} PERCENT
            """

            stats = Executor.run(sql)
            if isinstance(stats, list):
                stats = stats[0]

            return estimate_sum_from_stats(
                n=stats["n"],
                mean=stats["mean"],
                var=stats["var"],
                p=p,
                confidence=confidence
            )

        # ---- AVG ----
        if query_type == "AVG":

            sql = f"""
                SELECT 
                    COUNT(*) as n,
                    AVG({column}) as mean,
                    VAR_SAMP({column}) as var
                FROM {table}
                USING SAMPLE {fraction_percent} PERCENT
            """

            stats = Executor.run(sql)
            if isinstance(stats, list):
                stats = stats[0]
                
            return estimate_avg_from_stats(
                n=stats["n"],
                mean=stats["mean"],
                var=stats["var"],
                confidence=confidence,
                fraction=p
            )

        # ---- COUNT DISTINCT ----
        if query_type == "COUNT_DISTINCT":

            sql = f"""
                SELECT APPROX_COUNT_DISTINCT({column}) as estimate
                FROM {table}
                USING SAMPLE {fraction_percent} PERCENT
            """

            result = Executor.run(sql)

            return {
                "estimate": float(result["estimate"]),
                "error_margin": None,
                "confidence": None,
                "note": "Point estimate only"
            }

        raise ValueError(f"Unsupported query type: {query_type}")