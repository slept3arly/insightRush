from backend.storage.db import db_manager
import time


class Validator:

    _schema_cache = None
    _last_refresh = 0
    _ttl_seconds = 60  # refresh every 60s

    # -------------------------
    # LOAD SCHEMA (CACHED)
    # -------------------------
    @staticmethod
    def _load_schema():
        conn = db_manager.get_connection()

        rows = conn.execute("""
            SELECT table_name, column_name
            FROM information_schema.columns
        """).fetchall()

        schema = {}

        for table_name, column_name in rows:
            if table_name not in schema:
                schema[table_name] = set()

            schema[table_name].add(column_name)

        return schema

    @staticmethod
    def _get_schema():
        now = time.time()

        if (
            Validator._schema_cache is None
            or now - Validator._last_refresh > Validator._ttl_seconds
        ):
            Validator._schema_cache = Validator._load_schema()
            Validator._last_refresh = now

        return Validator._schema_cache

    # -------------------------
    # VALIDATION
    # -------------------------
    @staticmethod
    def validate_query(req):
        schema = Validator._get_schema()

        table = req.table_name
        column = req.column
        group_by = req.group_by
        query_type = req.query_type

        if table not in schema:
            raise ValueError(f"Table '{table}' does not exist")

        if query_type in ["SUM", "AVG", "COUNT_DISTINCT"]:
            if not column:
                raise ValueError(f"{query_type} requires a column")

            if column not in schema[table]:
                raise ValueError(f"Column '{column}' does not exist in '{table}'")

        if group_by:
            if group_by not in schema[table]:
                raise ValueError(f"Group by column '{group_by}' does not exist in '{table}'")

        if req.target_error is not None:
            if req.target_error < 0 or req.target_error >= 1:
                raise ValueError("target_error must be between 0 (exact) and < 1")

        return True