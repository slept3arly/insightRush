import duckdb
import os


class DuckDBManager:
    def __init__(self):
        # -------------------------
        # ABSOLUTE PATH (FIXED)
        # -------------------------
        DB_DIR = r"C:\Development\Projects\insightRushDB\db_data"

        os.makedirs(DB_DIR, exist_ok=True)

        db_path = os.path.join(DB_DIR, "insightRush.db")

        self.conn = duckdb.connect(db_path)
        self._configure()

    def _configure(self):
        self.conn.execute("PRAGMA memory_limit='2GB'")
        self.conn.execute("PRAGMA threads=4")

    def get_connection(self):
        return self.conn


db_manager = DuckDBManager()