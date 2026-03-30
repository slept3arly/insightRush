from storage.db import db_manager

class Executor:

    @staticmethod
    def run(sql: str):
        conn = db_manager.get_connection()
        return conn.execute(sql).fetchdf()