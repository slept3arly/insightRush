from backend.storage.db import db_manager
from backend.engine.validator import Validator


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

    @staticmethod
    def purge_sample_tables(base_table: str = None) -> int:
        conn = db_manager.get_connection()
        tables = conn.execute("SHOW TABLES").fetchall()

        dropped_count = 0
        for (t_name,) in tables:
            if Sampler.is_sample_table(t_name):
                if base_table is None or t_name.startswith(f"{base_table}__sample_"):
                    conn.execute(f"DROP TABLE IF EXISTS {t_name}")
                    dropped_count += 1

        if dropped_count > 0:
            Validator.invalidate_cache()

        return dropped_count

