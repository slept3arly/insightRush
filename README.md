````markdown
# InsightRush | Approximate Query Processing Engine

High-performance approximate query processing (AQP) platform for interactive analytics on large datasets with configurable accuracy.

---

## Overview

InsightRush is a local-first analytics system that enables fast query execution on large CSV datasets using statistical sampling techniques. It supports both exact and approximate execution paths, allowing users to trade accuracy for performance with measurable confidence.

The system is designed for experimentation, benchmarking, and understanding query-performance tradeoffs rather than production deployment.

---

## Key Features

- **Approximate Query Processing (AQP)**  
  Execute `SUM`, `AVG`, `COUNT`, `MIN`, `MAX` with configurable error bounds and confidence levels

- **Exact vs Approximate Comparison**  
  Side-by-side execution to evaluate speed vs accuracy tradeoffs

- **CSV Data Ingestion Pipeline**  
  Upload and process large datasets into DuckDB

- **Interactive Query Workbench**  
  UI-driven query building with execution metadata

- **Statistical Estimation Engine**  
  Sampling + estimators with confidence-aware outputs

- **System Monitoring**  
  Track execution time, sampling rate, and engine behavior

---

## Tech Stack

### Backend

- FastAPI (API layer)
- DuckDB (analytical database)
- Pandas (data ingestion)
- Uvicorn (ASGI server)

### Frontend

- Next.js (App Router)
- React
- Tailwind CSS
- Recharts (visualizations)

---

## Architecture

The AQP engine follows a layered execution model:

1. **Ingestion Layer**  
   Parses and loads CSV datasets into DuckDB

2. **Validation Layer**  
   Validates schema, columns, and query parameters

3. **Sampling Layer**  
   Generates sampled subsets based on accuracy targets

4. **Estimation Layer**  
   Computes aggregates with statistical guarantees

5. **Execution Layer**  
   Chooses between exact and approximate execution

---

## Project Structure

```bash
insightRush/
├── backend/
│   ├── api/           # FastAPI routes
│   ├── engine/        # AQP engine (sampler, estimator, executor)
│   ├── storage/       # Ingestion + DB handling
│   └── main.py
├── src/               # Next.js frontend
├── data/              # Sample datasets
├── tmp_uploads/       # Uploaded CSVs
└── generate_data.py   # Synthetic dataset generator
````

---

## Running Locally

### Backend

```bash
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
uvicorn backend.main:app --reload --port 8000
```

### Frontend

```bash
npm install
npm run dev
```

App runs on:

* Frontend: http://localhost:3000
* Backend: http://localhost:8000

---

## Usage

1. Upload a CSV dataset
2. Select aggregation type (`SUM / AVG / COUNT`)
3. Configure accuracy target
4. Execute query
5. Compare approximate vs exact results

---

## Benchmarking & Scale

* Designed for **local experimentation with large datasets**
* Supports testing with **synthetic data via `generate_data.py`**
* Performance depends on:

  * dataset size
  * sampling rate
  * system memory and CPU

This project focuses on **query performance tradeoffs**, not production-scale distributed systems.

---

## Security Notes

* Input validation is implemented for schema and query parameters
* Not production-hardened:

  * No authentication
  * No rate limiting
  * Open local usage model

---

## Limitations

* Local deployment only (not hosted)
* Single-node execution (DuckDB)
* No persistent multi-user data isolation
* Limited query types (aggregations only)

---

## Future Improvements

* Add authentication and dataset isolation
* Introduce query caching
* Add benchmarking scripts with reproducible results
* Improve validation and query safety controls
* Extend to additional query types and joins

---

## License

MIT License

```
```
