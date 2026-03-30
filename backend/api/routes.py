from fastapi import APIRouter, UploadFile, File, HTTPException

from models.schemas import QueryRequest, QueryResponse
from storage.ingestion import ingest_csv
from engine.aqp_engine import AQPEngine
from engine.validator import Validator

router = APIRouter()
engine = AQPEngine()


# -------------------------
# Upload Endpoint
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
# Query Endpoint (AQP)
# -------------------------
@router.post("/query", response_model=QueryResponse)
async def query(req: QueryRequest):
    try:
        # -------------------------
        # Validation
        # -------------------------
        Validator.validate_query(req)

        # -------------------------
        # Engine Execution
        # -------------------------
        result = engine.run_query(
            table=req.table_name,
            column=req.column,
            query_type=req.query_type,
            target_error=req.target_error,
            group_by=req.group_by,
            confidence=req.confidence
        )

        # -------------------------
        # GROUP BY RESPONSE
        # -------------------------
        if req.group_by:
            return {
                "mode": "approx",
                "result": result,
                "error_margin": None,
                "confidence": req.confidence,
                "meta": {
                    "table": req.table_name,
                    "query_type": req.query_type,
                    "group_by": req.group_by,
                    "type": "group_by"
                }
            }

        # -------------------------
        # SCALAR RESPONSE
        # -------------------------
        return {
            "mode": "approx",
            "result": result.get("estimate"),
            "error_margin": result.get("error_margin"),
            "confidence": result.get("confidence"),
            "meta": {
                "table": req.table_name,
                "query_type": req.query_type,
                "type": "scalar"
            }
        }

    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))