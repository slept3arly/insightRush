class Planner:

    SMALL_TABLE_THRESHOLDS = {
        "COUNT": 10 ** 18,
        "COUNT_DISTINCT": 100_000,
        "SUM": 25_000,
        "AVG": 25_000,
    }
    MIN_FRACTION = 0.01
    MAX_FRACTION = 0.25
    SAMPLE_SIZE_FACTOR = 1_000

    @staticmethod
    def choose_plan(table_size: int, query_type: str, target_error: float):
        """
        Uses a light-touch planner tuned for latency:
        - COUNT/COUNT_DISTINCT stay exact longer because DuckDB handles them very efficiently.
        - SUM/AVG can switch to approximate earlier on medium-sized tables.
        """

        if target_error == 0:
            return {"mode": "exact"}

        exact_threshold = Planner.SMALL_TABLE_THRESHOLDS.get(query_type, 100_000)
        if table_size < exact_threshold:
            return {"mode": "exact"}

        target_error = max(0.05, min(0.5, target_error))

        required_sample_size = Planner.SAMPLE_SIZE_FACTOR / (target_error ** 2)
        fraction = required_sample_size / table_size
        fraction = max(Planner.MIN_FRACTION, min(Planner.MAX_FRACTION, fraction))

        return {
            "mode": "approx",
            "fraction": fraction,
        }
