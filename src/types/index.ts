export interface QueryResult {
  exact: { value: number | Record<string, number>; time_ms: number };
  approximate: { value: number | Record<string, number>; time_ms: number };
  metrics: {
    speedup: number;
    error_percent: number;
    fraction_used: number;
  };
  query?: {
    type: string;
    column: string;
    group_by: string | null;
    accuracy_target: number;
  };
}

export interface BenchmarkRow {
  fraction: number;
  time_ms: number;
  error_percent: number;
  speedup: number;
  approx?: number;
}

export interface BenchmarkResponse {
  benchmark: BenchmarkRow[];
}

export interface SystemStats {
  active_tables: number;
  memory_usage_mb: number;
  engine_status: string;
  total_cached_rows: number;
}

export type ViewType = "dashboard" | "workbench" | "comparison" | "configuration";
