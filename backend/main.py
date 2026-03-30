from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
import io
import time

app = FastAPI(title="InsightRush AQP Engine")

# CORS configuration for frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/query")
async def process_query(
    file: UploadFile = File(...),
    fraction: float = Form(0.1),
    query_type: str = Form("COUNT"),
    column: str = Form(None)
):
    try:
        contents = await file.read()
        df = pd.read_csv(io.BytesIO(contents))
        
        # Validate column if needed
        if query_type in ["SUM", "AVG"]:
            if not column:
                raise HTTPException(status_code=400, detail=f"Column is required for {query_type} query.")
            if column not in df.columns:
                raise HTTPException(status_code=400, detail=f"Column '{column}' not found in dataset.")
            if not pd.api.types.is_numeric_dtype(df[column]):
                 raise HTTPException(status_code=400, detail=f"Column '{column}' must be numeric for {query_type}.")

        start_exact = time.perf_counter()
        
        # Exact Calculation
        exact_val = 0
        if query_type == "COUNT":
            exact_val = len(df)
        elif query_type == "SUM":
            exact_val = df[column].sum()
        elif query_type == "AVG":
            exact_val = df[column].mean()
                
        end_exact = time.perf_counter()
        exact_time = end_exact - start_exact

        # Approximate Calculation (Sampling)
        start_approx = time.perf_counter()
        
        sample_df = df.sample(frac=fraction)
        
        approx_val = 0
        if query_type == "COUNT":
            approx_val = len(sample_df) / fraction
        elif query_type == "SUM":
            approx_val = sample_df[column].sum() / fraction
        elif query_type == "AVG":
            approx_val = sample_df[column].mean()  # AVG of sample is unbiased estimator

        end_approx = time.perf_counter()
        approx_time = end_approx - start_approx

        return {
            "exact": {
                "value": float(exact_val) if exact_val is not None else 0,
                "time_ms": exact_time * 1000
            },
            "approximate": {
                "value": float(approx_val) if approx_val is not None else 0,
                "time_ms": approx_time * 1000
            },
            "fraction": fraction,
            "speedup": (exact_time / approx_time) if approx_time > 0 else 0
        }
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=str(e))