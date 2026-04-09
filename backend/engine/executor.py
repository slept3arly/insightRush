from backend.storage.db import db_manager


class Executor:

    @staticmethod
    def run(sql: str):
        conn = db_manager.get_connection()
        result = conn.execute(sql)

        columns = [desc[0] for desc in result.description]

        # single row result
        rows = result.fetchall()

        # scalar
        if len(rows) == 1 and len(columns) == 1:
            return {columns[0]: rows[0][0]}

        # multi-row result → return list of dicts (FASTER than pandas)
        return [
            {columns[i]: row[i] for i in range(len(columns))}
            for row in rows
        ]