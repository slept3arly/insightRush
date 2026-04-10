from backend.storage.db import db_manager


class Sampler:
    @staticmethod
    def _sample_table_name(table: str, fraction: float):
        fraction_key = int(round(fraction * 10_000))
        return f"{table}__sample_{fraction_key}"

    @staticmethod
    def materialize_sample(table: str, fraction: float):
        sample_table = Sampler._sample_table_name(table, fraction)
        conn = db_manager.get_connection()

        conn.execute(f"""
            CREATE TABLE IF NOT EXISTS {sample_table} AS
            SELECT *
            FROM {table}
            TABLESAMPLE BERNOULLI ({fraction * 100} PERCENT)
        """)

        return sample_table

    @staticmethod
    def is_sample_table(table_name: str):
        return "__sample_" in table_name
