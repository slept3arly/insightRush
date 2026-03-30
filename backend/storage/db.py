import duckdb

class DuckDBManager:
    def __init__(self, db_path="insightrush.db"):
        self.conn = duckdb.connect(db_path)
        self._configure()

    def _configure(self):
        self.conn.execute("PRAGMA memory_limit='2GB'")
        self.conn.execute("PRAGMA threads=4")

    def get_connection(self):
        return self.conn


db_manager = DuckDBManager()