from storage.db import db_manager


class Validator:

    @staticmethod
    def table_exists(table_name: str):
        conn = db_manager.get_connection()
        result = conn.execute(f"""
            SELECT COUNT(*) 
            FROM information_schema.tables 
            WHERE table_name = '{table_name}'
        """).fetchone()[0]

        if result == 0:
            raise ValueError(f"Table '{table_name}' does not exist")

    @staticmethod
    def column_exists(table_name: str, column: str):
        conn = db_manager.get_connection()

        result = conn.execute(f"""
            SELECT COUNT(*)
            FROM information_schema.columns
            WHERE table_name = '{table_name}'
            AND column_name = '{column}'
        """).fetchone()[0]

        if result == 0:
            raise ValueError(f"Column '{column}' does not exist in '{table_name}'")

    @staticmethod
    def validate_query(req):
        Validator.table_exists(req.table_name)

        if req.query_type in ["SUM", "AVG"]:
            if not req.column:
                raise ValueError(f"{req.query_type} requires a column")

            Validator.column_exists(req.table_name, req.column)

        if req.group_by:
            Validator.column_exists(req.table_name, req.group_by)