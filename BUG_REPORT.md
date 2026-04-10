# BUG REPORT

## 1. UI/UX Issues

### Query state reused across different uploads
- File: `src/app/page.tsx`
- Problem: Uploading a new CSV could still query the previous backend table.
- Root Cause: `activeTable` was preserved when `file` changed.
- Fix: Reset `activeTable` when a new file is selected.
- Before -> After: New upload reused stale table name -> new upload forces a fresh `/upload` and correct table mapping.

### Group-by input was unreachable
- File: `src/components/QueryWorkbenchView.tsx`
- Problem: Users could not enter a group-by column unless `groupBy` already had a value.
- Root Cause: The input only rendered when `groupBy` was truthy.
- Fix: Always render the group-by field and mark it optional.
- Before -> After: Grouped queries were effectively impossible from the UI -> grouped queries can now be entered normally.

### Result views showed incorrect sample/error information
- Files: `src/app/page.tsx`, `src/components/QueryWorkbenchView.tsx`, `src/components/ComparisonView.tsx`, `src/components/DashboardView.tsx`
- Problem: The UI displayed requested accuracy as sample fraction, hard-coded confidence, misleading health status, and `NaN`/`0` for grouped results.
- Root Cause: Frontend logic inferred metrics locally instead of using real API metadata, and grouped result objects were parsed like scalar estimates.
- Fix: Preserve grouped result maps, use API `sample_fraction`, compute real scalar error percentages, surface actual confidence, and treat any non-`OFFLINE` engine status as healthy.
- Before -> After: Placeholder metrics and broken grouped displays -> stable, response-driven metrics and valid grouped result rendering.

## 2. API / Integration Issues

### Query endpoint always reported `approx`
- Endpoint: `POST /query`
- Problem: Exact execution paths were returned with `mode: "approx"`.
- Root Cause: The route hard-coded the mode instead of returning the engine decision.
- Fix: Return execution metadata from the engine and pass the real `mode` through the API response.
- Before -> After: Small-table exact runs looked approximate -> API now reports `exact` or `approx` truthfully.

### Sample fraction was not exposed to the frontend
- Endpoint: `POST /query`
- Problem: The UI had no reliable way to know how much data was actually sampled.
- Root Cause: Planner output stayed internal to the backend.
- Fix: Add `meta.sample_fraction` to query responses.
- Before -> After: UI guessed sample fraction from the slider -> UI now uses the actual planner/execution fraction.

### Benchmark view used placeholder speed/error values
- Files: `src/app/page.tsx`, `src/types/index.ts`
- Problem: Benchmarks showed a fixed `5.0x` speedup and converted absolute error margins directly into percentages.
- Root Cause: Benchmark logic did not measure an exact baseline and misinterpreted API error units.
- Fix: Run one exact baseline per benchmark set, compute real speedup, and compute relative error percent from exact results when available.
- Before -> After: Benchmark rows contained placeholders/mis-scaled errors -> benchmark rows now reflect measured latency and relative error.

## 3. Backend / Math Issues

### CSV ingestion inflated datasets by 2048x
- File: `backend/storage/ingestion.py`
- Query / Logic: Repeated `INSERT INTO table SELECT * FROM table`
- Problem: Counts and sums were massively incorrect immediately after upload.
- Root Cause: Temporary load-testing duplication code was left enabled in production ingestion.
- Fix: Remove the duplicate insert loop.
- Before -> After: Uploaded `sample.csv` became 16,384 rows -> uploaded data now keeps its original row count of 8.

### Grouped aggregations crashed on exact execution
- File: `backend/engine/aqp_engine.py`
- Query / Logic: Grouped exact aggregation result handling
- Problem: Exact grouped queries raised `'list' object has no attribute 'iterrows'`.
- Root Cause: `Executor.run()` returns `list[dict]`, but the engine treated it like a pandas DataFrame.
- Fix: Iterate over returned row dictionaries directly.
- Before -> After: Exact `GROUP BY` queries crashed -> grouped exact results now return correct maps.

### Approximate grouped aggregations generated invalid DuckDB SQL
- File: `backend/engine/aqp_engine.py`
- Query / Logic: `FROM table USING SAMPLE ... GROUP BY ...`
- Problem: Approximate grouped queries failed with a DuckDB parser error near `GROUP`.
- Root Cause: The sampling syntax used for grouped queries was invalid for DuckDB.
- Fix: Switch grouped approximate queries to `TABLESAMPLE BERNOULLI (...)`.
- Before -> After: Approximate `GROUP BY` queries failed to parse -> grouped approximate queries execute successfully.

### Scalar estimators assumed Bernoulli sampling but used DuckDB default sampling
- File: `backend/engine/aqp_engine.py`
- Query / Logic: COUNT / SUM / AVG approximate queries
- Problem: Approximate count and sum estimates were unstable and could deviate far beyond the reported margin.
- Root Cause: The estimator formulas assume Bernoulli row sampling, but the SQL used DuckDB's default sampling mode.
- Fix: Use `TABLESAMPLE BERNOULLI (...)` consistently for sampled scalar queries.
- Before -> After: Count/sum estimates could drift badly from truth -> approximate scalar results are now statistically aligned with the estimator formulas.

### Approximate count distinct double-sampled cardinality
- File: `backend/engine/aqp_engine.py`
- Query / Logic: `APPROX_COUNT_DISTINCT` on a sampled subset
- Problem: Distinct estimates were biased low because sampling and approximation were stacked.
- Root Cause: The engine applied `APPROX_COUNT_DISTINCT` after sampling instead of over the full relation.
- Fix: Run `APPROX_COUNT_DISTINCT` on the full table and keep it as a point estimate without a confidence interval.
- Before -> After: Distinct counts were doubly approximate and unstable -> distinct counts now use DuckDB's native approximate cardinality directly.

## Validation

- `python -m unittest backend.tests.test_aqp_regressions`
- `npm run lint`

## Remaining Risks

- `COUNT_DISTINCT` is still a point estimate only; the project still does not provide a statistically derived error bound for approximate cardinality.
- DuckDB storage is still configured with a hard-coded absolute path in `backend/storage/db.py`; I left it unchanged because correcting that touches deployment assumptions rather than query correctness.
