"use client";
import { QueryResult, BenchmarkResponse, BenchmarkRow } from "@/types";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer
} from "recharts";

interface Props {
  file: File | null;
  setFile: (f: File | null) => void;
  queryType: string;
  setQueryType: (v: string) => void;
  column: string;
  setColumn: (v: string) => void;
  accuracyLevel: number;
  setAccuracyLevel: (v: number) => void;
  results: QueryResult | null;
  loading: boolean;
  benchmarkResults: BenchmarkResponse | null;
  runQuery: () => void;
  runBenchmark: () => void;
}

export default function QueryWorkbenchView(props: Props) {
  const {
    file, setFile, queryType, setQueryType, column, setColumn,
    accuracyLevel, setAccuracyLevel, results, loading,
    benchmarkResults, runQuery, runBenchmark
  } = props;

  const chartData = results ? [{
    name: "Execution Time",
    Exact: Number(results.exact.time_ms.toFixed(2)),
    Approximate: Number(results.approximate.time_ms.toFixed(2)),
  }] : [];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ fontFamily: "'Space Grotesk', sans-serif", color: "var(--on-surface)" }}>
            QUERY.WORKBENCH
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--on-surface-variant)" }}>
            Interactive SQL Execution & Approximate Analysis
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5" style={{ background: "var(--surface-container)" }}>
          <div className="pulse-indicator" />
          <span className="text-[11px] font-medium uppercase tracking-wider" style={{ color: "var(--primary-cyan)" }}>
            Engine Ready
          </span>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Left: Config Panel */}
        <div className="col-span-4 space-y-4">
          {/* Data Source */}
          <div className="p-5" style={{ background: "var(--surface-container)" }}>
            <h3 className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ fontFamily: "'Space Grotesk', sans-serif", color: "var(--on-surface)" }}>
              <span className="material-symbols-outlined text-[16px] mr-2 align-middle" style={{ color: "var(--primary-cyan)" }}>database</span>
              Data Source
            </h3>
            <div className="space-y-4">
              <div>
                <label className="text-[11px] font-medium uppercase tracking-wider block mb-2" style={{ color: "var(--on-surface-variant)" }}>
                  Upload CSV Dataset
                </label>
                <label className="block cursor-pointer p-4 text-center border border-dashed transition-colors" style={{
                  borderColor: file ? "var(--primary-cyan)" : "var(--outline-variant)",
                  background: file ? "rgba(129,236,255,0.05)" : "var(--surface-container-low)"
                }}>
                  <span className="material-symbols-outlined text-[24px] block mb-1" style={{ color: file ? "var(--primary-cyan)" : "var(--on-surface-variant)" }}>
                    {file ? "check_circle" : "cloud_upload"}
                  </span>
                  <span className="text-xs block" style={{ color: file ? "var(--primary-cyan)" : "var(--on-surface-variant)" }}>
                    {file ? file.name : "Drop CSV or click to browse"}
                  </span>
                  <input type="file" accept=".csv" className="hidden" onChange={(e) => setFile(e.target.files?.[0] || null)} />
                </label>
              </div>

              <div>
                <label className="text-[11px] font-medium uppercase tracking-wider block mb-2" style={{ color: "var(--on-surface-variant)" }}>
                  Query Type
                </label>
                <select
                  value={queryType}
                  onChange={(e) => setQueryType(e.target.value)}
                  className="kinetic-input w-full text-sm"
                  style={{ background: "var(--surface-container-highest)" }}
                >
                  <option value="COUNT">COUNT</option>
                  <option value="SUM">SUM</option>
                  <option value="AVG">AVG</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-medium uppercase tracking-wider block mb-2" style={{ color: "var(--on-surface-variant)" }}>
                  Target Column <span style={{ color: "var(--outline)" }}>(SUM/AVG)</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. column_name, amount, price..."
                  value={column}
                  onChange={(e) => setColumn(e.target.value)}
                  className="kinetic-input w-full text-sm"
                  style={{ background: "var(--surface-container-highest)" }}
                />
              </div>
            </div>
          </div>

          {/* Sampling Control */}
          <div className="p-5" style={{ background: "var(--surface-container)" }}>
            <h3 className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ fontFamily: "'Space Grotesk', sans-serif", color: "var(--on-surface)" }}>
              <span className="material-symbols-outlined text-[16px] mr-2 align-middle" style={{ color: "var(--primary-cyan)" }}>tune</span>
              Sampling Control
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-[11px] uppercase tracking-wider" style={{ color: "var(--on-surface-variant)" }}>Sample Size</span>
                <span className="mono-data text-sm font-bold" style={{ color: "var(--primary-cyan)" }}>{accuracyLevel}%</span>
              </div>
              <input
                type="range" min={1} max={100} value={accuracyLevel}
                onChange={(e) => setAccuracyLevel(Number(e.target.value))}
                className="w-full h-1.5 appearance-none cursor-pointer"
                style={{ background: `linear-gradient(to right, var(--primary-cyan) 0%, var(--primary-cyan) ${accuracyLevel}%, var(--surface-container-lowest) ${accuracyLevel}%, var(--surface-container-lowest) 100%)` }}
              />
              <div className="flex justify-between">
                <span className="text-[10px]" style={{ color: "var(--on-surface-variant)" }}>Speed</span>
                <span className="text-[10px]" style={{ color: "var(--on-surface-variant)" }}>Accuracy</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2">
            <button onClick={runQuery} disabled={loading || !file} className="btn-kinetic w-full py-3 text-sm font-semibold uppercase tracking-wider disabled:opacity-40">
              {loading ? "Processing..." : "Execute Query"}
            </button>
            <button onClick={runBenchmark} disabled={loading || !file} className="btn-ghost-kinetic w-full py-3 text-sm font-semibold uppercase tracking-wider disabled:opacity-40">
              Run Benchmark Suite
            </button>
          </div>
        </div>

        {/* Right: Results */}
        <div className="col-span-8 space-y-4">
          {/* Execution Plan */}
          {results && (
            <div className="p-5" style={{ background: "var(--surface-container)" }}>
              <h3 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ fontFamily: "'Space Grotesk', sans-serif", color: "var(--on-surface)" }}>
                Execution Plan
              </h3>
              <div className="p-3 mono-data text-xs space-y-1" style={{ background: "var(--surface-container-lowest)", color: "var(--on-surface-variant)" }}>
                <div style={{ color: "var(--primary-cyan)" }}>AGGREGATE (Approximate)</div>
                <div className="pl-4">Cost: 0.00..{(results.approximate.time_ms * 100).toFixed(2)} | Rows: {file?.name || "dataset"}</div>
                <div className="pl-4" style={{ color: "var(--tertiary-green)" }}>PARALLEL SCAN uploaded_dataset</div>
                <div className="pl-8">Sample Rate: {(accuracyLevel / 100).toFixed(2)} | Workers: 32</div>
                <div className="pl-8" style={{ color: "var(--on-surface-variant)" }}>
                  FILTER ({queryType}({column || "*"}))
                </div>
              </div>
            </div>
          )}

          {/* Result Cards */}
          <div className="grid grid-cols-2 gap-4">
            {/* Approximate Engine */}
            <div className="p-5 relative status-ribbon status-ribbon-success" style={{ background: "var(--surface-container)" }}>
              {results && results.metrics.speedup > 1 && (
                <div className="absolute top-4 right-4 px-2 py-1 flex items-center gap-1" style={{ background: "rgba(155,255,206,0.15)" }}>
                  <span className="material-symbols-outlined text-[14px]" style={{ color: "var(--tertiary-green)" }}>bolt</span>
                  <span className="text-[11px] font-bold mono-data" style={{ color: "var(--tertiary-green)" }}>
                    {results.metrics.speedup.toFixed(1)}x
                  </span>
                </div>
              )}
              <h4 className="text-[11px] font-semibold uppercase tracking-wider mb-1" style={{ color: "var(--tertiary-green)" }}>
                Approximate Engine
              </h4>
              <p className="text-[10px] mb-4" style={{ color: "var(--on-surface-variant)" }}>
                Using {accuracyLevel}% sampled data
              </p>
              {results ? (
                <div className="space-y-3">
                  <div>
                    <p className="text-[10px] mb-1" style={{ color: "var(--on-surface-variant)" }}>Estimated Value</p>
                    <p className="kpi-value text-4xl" style={{ color: "var(--tertiary-green)" }}>
                      ~{Number(results.approximate.value).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div className="flex items-center justify-between p-3" style={{ background: "var(--surface-container-low)" }}>
                    <span className="text-[10px] uppercase tracking-wider" style={{ color: "var(--on-surface-variant)" }}>Execution Time</span>
                    <span className="mono-data text-sm font-bold" style={{ color: "var(--tertiary-green)" }}>{results.approximate.time_ms.toFixed(3)} ms</span>
                  </div>
                </div>
              ) : (
                <div className="h-24 flex items-center justify-center" style={{ background: "var(--surface-container-low)" }}>
                  <span className="text-xs" style={{ color: "var(--on-surface-variant)" }}>Awaiting execution...</span>
                </div>
              )}
            </div>

            {/* Exact Engine */}
            <div className="p-5 status-ribbon status-ribbon-error" style={{ background: "var(--surface-container)" }}>
              <h4 className="text-[11px] font-semibold uppercase tracking-wider mb-1" style={{ color: "var(--error-red)" }}>
                Exact Engine
              </h4>
              <p className="text-[10px] mb-4" style={{ color: "var(--on-surface-variant)" }}>Scanning 100% of data</p>
              {results ? (
                <div className="space-y-3">
                  <div>
                    <p className="text-[10px] mb-1" style={{ color: "var(--on-surface-variant)" }}>True Value</p>
                    <p className="kpi-value text-4xl" style={{ color: "var(--error-red)" }}>
                      {Number(results.exact.value).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div className="flex items-center justify-between p-3" style={{ background: "var(--surface-container-low)" }}>
                    <span className="text-[10px] uppercase tracking-wider" style={{ color: "var(--on-surface-variant)" }}>Execution Time</span>
                    <span className="mono-data text-sm font-bold" style={{ color: "var(--error-red)" }}>{results.exact.time_ms.toFixed(3)} ms</span>
                  </div>
                </div>
              ) : (
                <div className="h-24 flex items-center justify-center" style={{ background: "var(--surface-container-low)" }}>
                  <span className="text-xs" style={{ color: "var(--on-surface-variant)" }}>Awaiting execution...</span>
                </div>
              )}
            </div>
          </div>

          {/* Performance Chart */}
          <div className="p-5" style={{ background: "var(--surface-container)" }}>
            <h3 className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ fontFamily: "'Space Grotesk', sans-serif", color: "var(--on-surface)" }}>
              Performance Comparison
            </h3>
            <div className="h-56">
              {results ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
                    <CartesianGrid stroke="rgba(64,72,93,0.15)" vertical={false} />
                    <XAxis dataKey="name" tick={{ fill: "#a3aac4", fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: "#a3aac4", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}ms`} />
                    <Tooltip contentStyle={{ background: "#141f38", border: "none", borderRadius: 0, color: "#dee5ff", fontSize: 12, fontFamily: "'JetBrains Mono', monospace" }} />
                    <Bar dataKey="Exact" fill="#ff716c" maxBarSize={60} />
                    <Bar dataKey="Approximate" fill="#9bffce" maxBarSize={60} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="w-full h-full flex items-center justify-center" style={{ background: "var(--surface-container-low)" }}>
                  <div className="text-center">
                    <span className="material-symbols-outlined text-[32px] block mb-2" style={{ color: "var(--outline-variant)" }}>bar_chart</span>
                    <p className="text-xs" style={{ color: "var(--on-surface-variant)" }}>Execute a query to visualize results</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Benchmark Table */}
          {benchmarkResults && (
            <div className="p-5" style={{ background: "var(--surface-container)" }}>
              <h3 className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ fontFamily: "'Space Grotesk', sans-serif", color: "var(--on-surface)" }}>
                Benchmark Report
              </h3>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Sample %</th>
                    <th>Time (ms)</th>
                    <th>Error %</th>
                    <th>Speedup</th>
                  </tr>
                </thead>
                <tbody>
                  {benchmarkResults.benchmark.map((row: BenchmarkRow, idx: number) => (
                    <tr key={idx}>
                      <td>{(row.fraction * 100).toFixed(0)}%</td>
                      <td>{row.time_ms.toFixed(2)}</td>
                      <td>{typeof row.error_percent === "number" ? `${row.error_percent.toFixed(2)}%` : "N/A"}</td>
                      <td style={{ color: "var(--tertiary-green)", fontWeight: 700 }}>{row.speedup.toFixed(2)}x</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
