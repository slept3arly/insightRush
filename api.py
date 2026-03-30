from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
import io
import time

app = FastAPI(title="InsightRush AQP Engine")

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
    start_exact = time.perf_counter()
    
    contents = await file.read()
    df = pd.read_csv(io.BytesIO(contents))
    
    # Exact Calculation
    exact_val = 0
    if query_type == "COUNT":
        exact_val = len(df)
    elif query_type == "SUM":
        if column and column in df.columns:
            exact_val = df[column].sum()
    elif query_type == "AVG":
        if column and column in df.columns:
            exact_val = df[column].mean()
            
    end_exact = time.perf_counter()
    exact_time = end_exact - start_exact

    # Approximate Calculation
    start_approx = time.perf_counter()
    
    sample_df = df.sample(frac=fraction)
    
    approx_val = 0
    if query_type == "COUNT":
        approx_val = len(sample_df) / fraction
    elif query_type == "SUM":
        if column and column in df.columns:
            approx_val = sample_df[column].sum() / fraction
    elif query_type == "AVG":
        if column and column in df.columns:
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
