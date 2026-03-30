export interface QueryResult {
  exact: { value: number; time_ms: number };
  approximate: { value: number; time_ms: number };
  metrics: {
    speedup: number;
    error_percent: number | object;
    fraction_used: number;
  };
}

export interface BenchmarkRow {
  fraction: number;
  time_ms: number;
  error_percent: number | object;
  speedup: number;
  approx?: number;
}

export interface BenchmarkResponse {
  benchmark: BenchmarkRow[];
}

export type ViewType = "dashboard" | "workbench" | "comparison" | "configuration";
