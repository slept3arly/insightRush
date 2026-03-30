import duckdb
import time
from backend.db import conn


# -------------------------
# ACCURACY → FRACTION
# -------------------------
def get_fraction(accuracy: int):
    if accuracy >= 99:
        return 0.25
    elif accuracy >= 95:
        return 0.1
    elif accuracy >= 90:
        return 0.05
    return 0.1


# -------------------------
# INTERNAL: BUILD SQL
# -------------------------
def build_query(table_name, query_type, column=None, group_by=None, fraction=None):
    sample_clause = ""
    if fraction:
        percent = fraction * 100
        sample_clause = f"USING SAMPLE {percent}% (SYSTEM)"

    if query_type == "COUNT":
        return f"SELECT COUNT(*) FROM {table_name} {sample_clause}"

    elif query_type == "SUM":
        return f"SELECT SUM({column}) FROM {table_name} {sample_clause}"

    elif query_type == "AVG":
        return f"SELECT AVG({column}) FROM {table_name} {sample_clause}"

    elif query_type == "GROUP_BY_SUM":
        return f"""
            SELECT {group_by}, SUM({column})
            FROM {table_name} {sample_clause}
            GROUP BY {group_by}
        """

    else:
        raise ValueError("Unsupported query type")


# -------------------------
# EXACT QUERY
# -------------------------
def compute_exact(table_name, query_type, column=None, group_by=None):
    start = time.perf_counter()

    query = build_query(table_name, query_type, column, group_by)
    result = conn.execute(query).fetchall()

    if query_type == "GROUP_BY_SUM":
        result = {
            row[0]: (0 if row[1] is None else row[1])
            for row in result
        }
    else:
        value = result[0][0]
        if value is None:
            value = 0
        result = value

    end = time.perf_counter()
    return result, (end - start)


# -------------------------
# APPROX QUERY
# -------------------------
def compute_approx(table_name, query_type, fraction, column=None, group_by=None):
    start = time.perf_counter()

    query = build_query(table_name, query_type, column, group_by, fraction)
    result = conn.execute(query).fetchall()

    if query_type == "GROUP_BY_SUM":
        result = {
            row[0]: (0 if row[1] is None else row[1] / fraction)
            for row in result
        }

    elif query_type in ["COUNT", "SUM"]:
        value = result[0][0]
        if value is None:
            value = 0
        result = value / fraction

    else:  # AVG
        value = result[0][0]
        if value is None:
            value = 0
        result = value

    end = time.perf_counter()
    return result, (end - start)


# -------------------------
# ERROR CALCULATION
# -------------------------
def calculate_error(exact, approx):
    if isinstance(exact, dict):
        errors = {}
        for k in exact:
            exact_val = exact.get(k, 0)
            approx_val = approx.get(k, 0)

            if exact_val != 0:
                val = abs(exact_val - approx_val) / abs(exact_val) * 100
                errors[k] = float(val)
            else:
                errors[k] = 0.0

        return errors
    else:
        if exact == 0:
            return 0.0
        val = abs(exact - approx) / abs(exact) * 100
        return float(val)