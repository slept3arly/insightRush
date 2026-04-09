class Sampler:

    @staticmethod
    def apply_sampling(table: str, fraction: float):
        return f"""
            SELECT *
            FROM {table}
            USING SAMPLE {fraction * 100} PERCENT (BERNOULLI)
        """

    @staticmethod
    def apply_stratified_sampling(table: str, group_by: str, fraction: float):
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