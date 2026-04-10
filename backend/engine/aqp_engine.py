from .planner import Planner
from .executor import Executor
from .estimator import (
    estimate_count,
    estimate_sum_from_stats,
    estimate_avg_from_stats,
)
from .sampler import Sampler


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

    def _grouped_result_map(self, rows, value_key: str, scale_factor: float = 1.0):
        results = {}

        for row in rows:
            value = row[value_key]
            results[row["grp"]] = float(value) * scale_factor if value is not None else 0.0

        return results

    def _finalize_result(self, result, mode: str, sample_fraction: float, include_execution: bool):
        if include_execution:
            return {
                "mode": mode,
                "sample_fraction": sample_fraction,
                "result": result,
            }

        return result

    def run_query(
        self,
        table,
        column,
        query_type,
        target_error,
        group_by=None,
        confidence=0.95,
        include_execution=False,
    ):

        table = self._safe_identifier(table)
        if column:
            column = self._safe_identifier(column)
        if group_by:
            group_by = self._safe_identifier(group_by)

        size_result = Executor.run(f"SELECT COUNT(*) as c FROM {table}")
        size = size_result["c"]

        plan = Planner.choose_plan(size, query_type, target_error)
        mode = plan["mode"]
        sample_fraction = 1.0 if mode == "exact" else plan["fraction"]

        if mode == "exact":

            if group_by:
                agg_expr = {
                    "SUM": f"SUM({column})",
                    "COUNT": "COUNT(*)",
                    "AVG": f"AVG({column})",
                    "COUNT_DISTINCT": f"COUNT(DISTINCT {column})",
                }[query_type]

                sql = f"""
                    SELECT {group_by} as grp, {agg_expr} as result
                    FROM {table}
                    GROUP BY {group_by}
                """

                rows = Executor.run(sql)
                result = self._grouped_result_map(rows, "result")
                return self._finalize_result(result, mode, sample_fraction, include_execution)

            sql_map = {
                "COUNT": "COUNT(*)",
                "COUNT_DISTINCT": f"COUNT(DISTINCT {column})",
                "SUM": f"SUM({column})",
                "AVG": f"AVG({column})",
            }

            sql = f"SELECT {sql_map[query_type]} as result FROM {table}"
            result = Executor.run(sql)

            payload = {
                "estimate": float(result["result"] or 0),
                "error_margin": 0,
                "confidence": 1.0,
            }
            return self._finalize_result(payload, mode, sample_fraction, include_execution)

        p = plan["fraction"]

        if query_type == "COUNT_DISTINCT":
            if group_by:
                sql = f"""
                    SELECT
                        {group_by} as grp,
                        APPROX_COUNT_DISTINCT({column}) as agg
                    FROM {table}
                    GROUP BY {group_by}
                """
                rows = Executor.run(sql)
                result = self._grouped_result_map(rows, "agg")
                return self._finalize_result(result, mode, 1.0, include_execution)

            sql = f"""
                SELECT APPROX_COUNT_DISTINCT({column}) as estimate
                FROM {table}
            """
            result = Executor.run(sql)

            payload = {
                "estimate": float(result["estimate"]),
                "error_margin": None,
                "confidence": None,
                "note": "Point estimate only",
            }
            return self._finalize_result(payload, mode, 1.0, include_execution)

        sample_table = Sampler.materialize_sample(table, p)

        if group_by:
            agg_expr = {
                "SUM": f"SUM({column})",
                "COUNT": "COUNT(*)",
                "AVG": f"AVG({column})",
            }[query_type]

            sql = f"""
                SELECT
                    {group_by} as grp,
                    {agg_expr} as agg
                FROM {sample_table}
                GROUP BY {group_by}
            """

            rows = Executor.run(sql)
            scale_factor = 1 / p if query_type in ["SUM", "COUNT"] else 1.0
            result = self._grouped_result_map(rows, "agg", scale_factor)
            return self._finalize_result(result, mode, sample_fraction, include_execution)

        if query_type == "COUNT":
            sql = f"""
                SELECT COUNT(*) as n
                FROM {sample_table}
            """
            result = Executor.run(sql)
            payload = estimate_count(result["n"], p, confidence)
            return self._finalize_result(payload, mode, sample_fraction, include_execution)

        if query_type == "SUM":
            sql = f"""
                SELECT
                    COUNT(*) as n,
                    AVG({column}) as mean,
                    VAR_SAMP({column}) as var
                FROM {sample_table}
            """

            stats = Executor.run(sql)
            if isinstance(stats, list):
                stats = stats[0]

            payload = estimate_sum_from_stats(
                n=stats["n"],
                mean=stats["mean"],
                var=stats["var"],
                p=p,
                confidence=confidence,
            )
            return self._finalize_result(payload, mode, sample_fraction, include_execution)

        if query_type == "AVG":
            sql = f"""
                SELECT
                    COUNT(*) as n,
                    AVG({column}) as mean,
                    VAR_SAMP({column}) as var
                FROM {sample_table}
            """

            stats = Executor.run(sql)
            if isinstance(stats, list):
                stats = stats[0]

            payload = estimate_avg_from_stats(
                n=stats["n"],
                mean=stats["mean"],
                var=stats["var"],
                confidence=confidence,
                fraction=p,
            )
            return self._finalize_result(payload, mode, sample_fraction, include_execution)

        raise ValueError(f"Unsupported query type: {query_type}")
