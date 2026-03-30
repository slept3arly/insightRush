from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
import io
import hashlib
import duckdb

from backend.utils import compute_exact, compute_approx, calculate_error, get_fraction

app = FastAPI(title="InsightRush AQP Engine")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -------------------------
# GLOBAL CACHES
# -------------------------
TABLE_CACHE = {}   # file_hash -> table_name
DF_CACHE = {}      # file_hash -> df (for validation only)

from backend.db import conn


# -------------------------
# HASHING
# -------------------------
def get_file_hash(contents: bytes):
    return hashlib.md5(contents).hexdigest()


# -------------------------
# COLUMN RESOLUTION
# -------------------------
def resolve_column(df, col_name: str):
    if not col_name:
        return None

    col_name = col_name.strip()
    matches = [c for c in df.columns if c.lower() == col_name.lower()]

    if not matches:
        raise HTTPException(status_code=400, detail=f"Column '{col_name}' not found")

    return matches[0]


# -------------------------
# LOAD + CACHE TABLE
# -------------------------
def get_or_create_table(contents: bytes):
    file_hash = get_file_hash(contents)

    # Already cached
    if file_hash in TABLE_CACHE:
        return TABLE_CACHE[file_hash], DF_CACHE[file_hash]

    # Load dataframe once
    df = pd.read_csv(io.BytesIO(contents), low_memory=False)

    table_name = f"table_{file_hash}"

    # Create persistent DuckDB table (FAST REUSE)
    conn.execute(f"CREATE OR REPLACE TABLE {table_name} AS SELECT * FROM df")

    # Cache both
    TABLE_CACHE[file_hash] = table_name
    DF_CACHE[file_hash] = df

    return table_name, df


# -------------------------
# QUERY ENDPOINT
# -------------------------
@app.post("/query")
async def process_query(
    file: UploadFile = File(...),
    accuracy: int = Form(95),
    query_type: str = Form("COUNT"),
    column: str = Form(None),
    group_by: str = Form(None)
):
    try:
        contents = await file.read()

        table_name, df = get_or_create_table(contents)

        fraction = get_fraction(accuracy)

        # VALIDATION (use df, not DuckDB)
        if query_type in ["SUM", "AVG", "GROUP_BY_SUM"]:
            if not column:
                raise HTTPException(status_code=400, detail="Column is required")

            column = resolve_column(df, column)

            if not pd.api.types.is_numeric_dtype(df[column]):
                raise HTTPException(
                    status_code=400,
                    detail=f"Column '{column}' must be numeric"
                )

        if query_type == "GROUP_BY_SUM":
            if not group_by:
                raise HTTPException(status_code=400, detail="group_by is required")

            group_by = resolve_column(df, group_by)

        # EXECUTION (DuckDB table-based)
        exact_val, exact_time = compute_exact(table_name, query_type, column, group_by)
        approx_val, approx_time = compute_approx(table_name, query_type, fraction, column, group_by)

        error = calculate_error(exact_val, approx_val)

        return {
            "query": {
                "type": query_type,
                "column": column,
                "group_by": group_by,
                "accuracy_target": accuracy
            },
            "exact": {
                "value": exact_val,
                "time_ms": exact_time * 1000
            },
            "approximate": {
                "value": approx_val,
                "time_ms": approx_time * 1000
            },
            "metrics": {
                "error_percent": error,
                "speedup": (exact_time / approx_time) if approx_time > 0 else 0,
                "fraction_used": fraction
            }
        }

    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=str(e))


# -------------------------
# BENCHMARK ENDPOINT
# -------------------------
@app.post("/benchmark")
async def benchmark_query(
    file: UploadFile = File(...),
    query_type: str = Form("COUNT"),
    column: str = Form(None),
    group_by: str = Form(None)
):
    try:
        contents = await file.read()

        table_name, df = get_or_create_table(contents)

        # VALIDATION
        if query_type in ["SUM", "AVG", "GROUP_BY_SUM"]:
            if not column:
                raise HTTPException(status_code=400, detail="Column is required")

            column = resolve_column(df, column)

            if not pd.api.types.is_numeric_dtype(df[column]):
                raise HTTPException(
                    status_code=400,
                    detail=f"Column '{column}' must be numeric"
                )

        if query_type == "GROUP_BY_SUM":
            if not group_by:
                raise HTTPException(status_code=400, detail="group_by is required")

            group_by = resolve_column(df, group_by)

        fractions = [0.05, 0.1, 0.25]
        results = []

        exact_val, exact_time = compute_exact(table_name, query_type, column, group_by)

        for fraction in fractions:
            approx_val, approx_time = compute_approx(table_name, query_type, fraction, column, group_by)
            error = calculate_error(exact_val, approx_val)

            results.append({
                "fraction": fraction,
                "approx": approx_val,
                "error_percent": error,
                "time_ms": approx_time * 1000,
                "speedup": (exact_time / approx_time) if approx_time > 0 else 0
            })

        return {"benchmark": results}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))