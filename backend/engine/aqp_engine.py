from .planner import Planner
from .executor import Executor
from .sampler import Sampler
from .estimator import (
    estimate_sum,
    estimate_count,
    estimate_avg,
    estimate_groupby
)


class AQPEngine:

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
        # STEP 1: table size
        # -------------------------
        size = Executor.run(f"SELECT COUNT(*) as c FROM {table}")["c"][0]

        plan = Planner.choose_plan(size, query_type, target_error)

        # -------------------------
        # EXACT PATH
        # -------------------------
        if plan["mode"] == "exact":

            if group_by:
                agg_expr = {
                    "SUM": f"SUM({column})",
                    "COUNT": "COUNT(*)",
                    "AVG": f"AVG({column})"
                }[query_type]

                sql = f"""
                    SELECT {group_by} as grp, {agg_expr} as result
                    FROM {table}
                    GROUP BY grp
                """

                return Executor.run(sql)

            if query_type == "COUNT":
                return Executor.run(f"SELECT COUNT(*) as result FROM {table}")

            elif query_type == "SUM":
                return Executor.run(f"SELECT SUM({column}) as result FROM {table}")

            elif query_type == "AVG":
                return Executor.run(f"SELECT AVG({column}) as result FROM {table}")

        # -------------------------
        # APPROX PATH
        # -------------------------

        # =========================
        # GROUP BY
        # =========================
        if group_by:

            sampled = Sampler.apply_stratified_sampling(
                table=table,
                group_by=group_by,
                fraction=plan["fraction"]
            )

            agg_expr = {
                "SUM": f"SUM({column})",
                "COUNT": "COUNT(*)",
                "AVG": f"AVG({column})"
            }[query_type]

            sql = f"""
                SELECT 
                    {group_by} as grp,
                    {agg_expr} as agg_value,
                    COUNT(*) as sample_count
                FROM ({sampled})
                GROUP BY grp
            """

            df = Executor.run(sql)
            rows = df.to_dict(orient="records")

            return estimate_groupby(
                rows,
                plan["fraction"],
                query_type,
                confidence
            )

        # =========================
        # NON GROUP
        # =========================

        base_query = f"SELECT {column} FROM {table}" if column else f"SELECT * FROM {table}"

        sampled_query = Sampler.apply_sampling(base_query, plan["fraction"])

        # ---- COUNT ----
        if query_type == "COUNT":
            sql = f"SELECT COUNT(*) as c FROM ({sampled_query})"
            df = Executor.run(sql)
            sample_count = df["c"][0]

            return estimate_count(sample_count, plan["fraction"], confidence)

        # ---- SUM / AVG ----
        df = Executor.run(sampled_query)

        values = df[column].dropna().tolist()

        if query_type == "SUM":
            return estimate_sum(values, plan["fraction"], confidence)

        elif query_type == "AVG":
            return estimate_avg(values, confidence)