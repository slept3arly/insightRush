# InsightRush | AQP Engine

**High-Performance Approximate Query Processing Engine** — Real-time analytical throughput with configurable accuracy.

[![FastAPI](https://img.shields.io/badge/FastAPI-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![Next.js](https://img.shields.io/badge/Next.js-000000?logo=next.js&logoColor=white)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![DuckDB](https://img.shields.io/badge/DuckDB-FFF000?logo=duckdb&logoColor=black)](https://duckdb.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)

---

## Overview

InsightRush is a modern approximate query processing (AQP) platform that enables fast analytical queries on large datasets with configurable accuracy trade-offs. Built with **FastAPI** and **DuckDB** on the backend and **Next.js 16** with **React 19** on the frontend, it delivers real-time insights with statistical guarantees.

### Key Features

- **Approximate Query Processing** — Execute aggregations (SUM, AVG, COUNT, MIN, MAX) with configurable error margins and confidence levels
- **CSV Data Ingestion** — Upload and automatically ingest CSV files into DuckDB
- **Group-By Analytics** — Perform grouped aggregations with visual feedback
- **Interactive Query Workbench** — Build and execute queries through an intuitive UI
- **Real-Time Visualizations** — Charts and dashboards powered by Recharts
- **System Monitoring** — Track memory usage, active tables, and engine status

---

## Tech Stack

### Backend
| Technology | Purpose |
|------------|---------|
| FastAPI | High-performance Python web framework |
| DuckDB | In-process analytical database |
| Pandas | Data manipulation and ingestion |
| Uvicorn | ASGI server |
| psutil | System resource monitoring |

### Frontend
| Technology | Purpose |
|------------|---------|
| Next.js 16 | React framework with App Router |
| React 19 | UI library |
| Tailwind CSS 4 | Utility-first styling |
| Recharts | Data visualization |
| shadcn/ui | Component library |
| Lucide React | Icon library |
| Sonner | Toast notifications |

---

## Project Structure

```
insightRush/
├── backend/                  # FastAPI backend
│   ├── api/
│   │   └── routes.py        # API endpoints
│   ├── core/
│   │   └── config.py        # Configuration
│   ├── engine/
│   │   ├── aqp_engine.py    # AQP query engine
│   │   ├── estimator.py     # Statistical estimation
│   │   ├── executor.py      # Query execution
│   │   ├── sampler.py       # Data sampling
│   │   └── validator.py     # Query validation
│   ├── models/
│   │   └── schemas.py       # Pydantic models
│   ├── storage/
│   │   ├── db.py           # Database manager
│   │   └── ingestion.py    # CSV ingestion
│   └── main.py             # Application entry
├── src/                     # Next.js frontend
│   ├── app/                # App Router pages
│   │   ├── page.tsx        # Main dashboard
│   │   ├── layout.tsx      # Root layout
│   │   └── globals.css     # Global styles
│   ├── components/         # React components
│   │   ├── DashboardView.tsx
│   │   ├── QueryWorkbenchView.tsx
│   │   ├── ConfigurationView.tsx
│   │   ├── ComparisonView.tsx
│   │   ├── Sidebar.tsx
│   │   └── ui/            # shadcn/ui components
│   ├── lib/
│   │   └── utils.ts       # Utility functions
│   └── types/
│       └── index.ts       # TypeScript types
├── data/                   # Sample datasets
├── tmp_uploads/           # Temporary upload storage
├── requirements.txt       # Python dependencies
└── package.json          # Node.js dependencies
```

---

## Quick Start

### Prerequisites

- Python 3.11+
- Node.js 20+
- npm or yarn

### Backend Setup

```bash
# Create virtual environment
python -m venv venv

# Activate (Windows)
venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Start the server
uvicorn backend.main:app --reload --port 8000
```

### Frontend Setup

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

The application will be available at `http://localhost:3000` with the backend API running on `http://localhost:8000`.

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/upload` | Upload CSV file |
| POST | `/query` | Execute approximate query |
| GET | `/stats` | Get system statistics |

### Query Request Format

```json
{
  "table_name": "table_abc123",
  "column": "sales",
  "query_type": "SUM",
  "target_error": 0.05,
  "confidence": 0.95,
  "group_by": "region"
}
```

---

## Usage

1. **Upload Data** — Drag and drop or select a CSV file to ingest
2. **Configure Query** — Select table, column, aggregation type, and accuracy parameters
3. **Execute** — Run approximate or exact queries
4. **Visualize** — View results with error margins and confidence intervals
5. **Compare** — Side-by-side comparison of approximate vs exact results

---

## Architecture

The AQP engine uses statistical sampling techniques to provide approximate results with bounded error:

1. **Sampling Layer** — Stratified/random sampling of large datasets
2. **Estimation Layer** — Statistical estimators for aggregates with confidence intervals
3. **Execution Layer** — Optimized query execution against samples
4. **Validation Layer** — Query syntax and parameter validation

---

## Development

### Running Tests

```bash
# Backend tests
pytest backend/

# Frontend linting
npm run lint
```

### Building for Production

```bash
# Build frontend
npm run build

# Production backend
uvicorn backend.main:app --host 0.0.0.0 --port 8000
```

---

## License

MIT License — see [LICENSE](LICENSE) for details.

---

## Acknowledgments

- DataSet can be produced by running generate_data.py script.
- Built with [FastAPI](https://fastapi.tiangolo.com/) and [Next.js](https://nextjs.org/)
- Powered by [DuckDB](https://duckdb.org/) for analytical processing
- UI components from [shadcn/ui](https://ui.shadcn.com/)
