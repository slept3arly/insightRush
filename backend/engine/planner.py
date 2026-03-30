class Planner:

    @staticmethod
    def choose_plan(table_size: int, query_type: str, target_error: float):

        if table_size < 100_000:
            return {"mode": "exact"}

        if target_error <= 0.01:
            fraction = 0.1
        elif target_error <= 0.05:
            fraction = 0.05
        else:
            fraction = 0.01

        return {
            "mode": "approx",
            "fraction": fraction
        }