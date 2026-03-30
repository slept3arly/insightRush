class Sampler:

    @staticmethod
    def apply_sampling(base_query: str, fraction: float):
        # default (non-group)
        return f"""
            SELECT * FROM ({base_query})
            USING SAMPLE {fraction * 100}% (BERNOULLI)
        """

    @staticmethod
    def apply_stratified_sampling(table: str, group_by: str, fraction: float):
        """
        Ensures each group contributes rows.
        Uses row_number trick per group.
        """

        return f"""
            SELECT *
            FROM (
                SELECT *,
                       ROW_NUMBER() OVER (PARTITION BY {group_by}) as rn,
                       COUNT(*) OVER (PARTITION BY {group_by}) as grp_size
                FROM {table}
            )
            WHERE rn <= GREATEST(1, CAST(grp_size * {fraction} AS INTEGER))
        """