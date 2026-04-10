from fastapi import APIRouter, UploadFile, File, HTTPException

from backend.models.schemas import QueryRequest, QueryResponse
from backend.storage.ingestion import ingest_csv
from backend.engine.aqp_engine import AQPEngine
from backend.engine.sampler import Sampler
from backend.engine.validator import Validator

router = APIRouter()
engine = AQPEngine()


# -------------------------
# Upload
# -------------------------
@router.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    try:
        contents = await file.read()
        table_name = ingest_csv(contents, file.filename)
        return {"table_name": table_name}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# -------------------------
# Query
# -------------------------
@router.post("/query", response_model=QueryResponse)
async def query(req: QueryRequest):
    try:
        Validator.validate_query(req)

        execution = engine.run_query(
            table=req.table_name,
            column=req.column,
            query_type=req.query_type,
            target_error=req.target_error,
            group_by=req.group_by,
            confidence=req.confidence,
            include_execution=True,
        )
        result = execution["result"]

        if req.group_by:
            return {
                "mode": execution["mode"],
                "result": result,
                "meta": {
                    "table": req.table_name,
                    "query_type": req.query_type,
                    "group_by": req.group_by,
                    "type": "group_by",
                    "sample_fraction": execution["sample_fraction"],
                }
            }

        return {
            "mode": execution["mode"],
            "result": result,
            "error_margin": result.get("error_margin"),
            "confidence": result.get("confidence"),
            "meta": {
                "table": req.table_name,
                "query_type": req.query_type,
                "type": "scalar",
                "sample_fraction": execution["sample_fraction"],
            }
        }

    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# -------------------------
# Stats
# -------------------------
@router.get("/stats")
async def get_system_stats():
    import os
    import psutil
    from backend.storage.db import db_manager

    try:
        process = psutil.Process(os.getpid())
        mem_info = process.memory_info()

        conn = db_manager.get_connection()
        tables = conn.execute("SHOW TABLES").fetchall()
        base_tables = [table for table in tables if not Sampler.is_sample_table(table[0])]
        sample_tables = [table for table in tables if Sampler.is_sample_table(table[0])]
        total_cached_rows = 0

        for (sample_table,) in sample_tables:
            total_cached_rows += conn.execute(f"SELECT COUNT(*) FROM {sample_table}").fetchone()[0]

        return {
            "active_tables": len(base_tables),
            "memory_usage_mb": round(mem_info.rss / (1024 * 1024), 2),
            "engine_status": "AQP_OPTIMIZED",
            "total_cached_rows": total_cached_rows
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
