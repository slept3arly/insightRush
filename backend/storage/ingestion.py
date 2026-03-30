import os
import uuid

from .db import db_manager

TMP_DIR = "tmp_uploads"
os.makedirs(TMP_DIR, exist_ok=True)


def ingest_csv(file_bytes, filename):
    table_id = str(uuid.uuid4()).replace("-", "_")
    table_name = f"table_{table_id}"

    path = os.path.join(TMP_DIR, f"{table_name}.csv")

    with open(path, "wb") as f:
        f.write(file_bytes)

    conn = db_manager.get_connection()

    conn.execute(f"""
        CREATE TABLE {table_name} AS
        SELECT * FROM read_csv_auto('{path}')
    """)

    return table_name