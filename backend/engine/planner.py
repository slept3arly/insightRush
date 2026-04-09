class Planner:

    SMALL_TABLE_THRESHOLD = 100_000
    MIN_FRACTION = 0.005
    MAX_FRACTION = 0.5

    @staticmethod
    def choose_plan(table_size: int, query_type: str, target_error: float):
        """
        Improved planner:
        - Uses statistical relationship: n ∝ 1 / error²
        - Adapts fraction based on table size
        """

        # -------------------------
        # FORCE EXACT
        # -------------------------
        if target_error == 0:
            return {"mode": "exact"}

        # -------------------------
        # SMALL TABLE → EXACT
        # -------------------------
        if table_size < Planner.SMALL_TABLE_THRESHOLD:
            return {"mode": "exact"}

        # -------------------------
        # CLAMP ERROR
        # -------------------------
        target_error = max(0.01, min(0.5, target_error))

        # -------------------------
        # CORE IDEA:
        # sample size n ≈ k / error²
        # fraction = n / N
        # -------------------------

        # Tunable constant (controls aggressiveness)
        k = 10_000

        required_sample_size = k / (target_error ** 2)

        fraction = required_sample_size / table_size

        # -------------------------
        # CLAMP FRACTION
        # -------------------------
        fraction = max(Planner.MIN_FRACTION, min(Planner.MAX_FRACTION, fraction))

        return {
            "mode": "approx",
            "fraction": fraction
        }