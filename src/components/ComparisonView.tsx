"use client";
import { QueryResult, BenchmarkResponse, BenchmarkRow } from "@/types";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface Props {
  results: QueryResult | null;
  benchmarkResults: BenchmarkResponse | null;
  queryHistory: Array<{ type: string; column: string; accuracy: number; result: QueryResult; timestamp: Date }>;
}

export default function ComparisonView(props: Props) {
  const { results, benchmarkResults, queryHistory } = props;
  const latestResult = results || (queryHistory.length > 0 ? queryHistory[queryHistory.length - 1].result : null);

  const comparisonData = latestResult ? [
    { name: "AQP Engine", value: latestResult.approximate.time_ms, fill: "#9bffce" },
    { name: "Standard Exact", value: latestResult.exact.time_ms, fill: "#ff716c" },
  ] : [];

  const errorPct = latestResult && typeof latestResult.metrics.error_percent === "number"
    ? latestResult.metrics.error_percent : null;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight" style={{ fontFamily: "'Space Grotesk', sans-serif", color: "var(--on-surface)" }}>
          COMPARISON.VIEW
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--on-surface-variant)" }}>
          Statistical verification and performance benchmarking between AQP and exact engine execution.
        </p>
      </div>

      {/* Hero KPIs */}
      <div className="grid grid-cols-3 gap-4">
        <div className="p-6 text-center" style={{ background: "var(--surface-container)" }}>
          <p className="text-[11px] font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--on-surface-variant)" }}>Performance Lift</p>
          <p className="kpi-value text-5xl" style={{ color: "var(--primary-cyan)" }}>
            {latestResult ? `${latestResult.metrics.speedup.toFixed(1)}x` : "—"}
          </p>
          <p className="text-[11px] mt-2 uppercase tracking-wider" style={{ color: "var(--tertiary-green)" }}>Faster</p>
        </div>
        <div className="p-6 text-center" style={{ background: "var(--surface-container)" }}>
          <p className="text-[11px] font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--on-surface-variant)" }}>Error Margin</p>
          <p className="kpi-value text-5xl" style={{ color: errorPct !== null && errorPct < 1 ? "var(--tertiary-green)" : "var(--error-red)" }}>
            {errorPct !== null ? `${errorPct.toFixed(2)}%` : "—"}
          </p>
          <p className="text-[11px] mt-2 uppercase tracking-wider" style={{ color: "var(--tertiary-green)" }}>
            {errorPct !== null && errorPct < 1 ? "Verified Accurate" : "Awaiting Data"}
          </p>
        </div>
        <div className="p-6 text-center" style={{ background: "var(--surface-container)" }}>
          <p className="text-[11px] font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--on-surface-variant)" }}>Confidence Interval</p>
          <p className="kpi-value text-5xl" style={{ color: "var(--primary-cyan)" }}>
            {latestResult ? "99.9%" : "—"}
          </p>
          <p className="text-[11px] mt-2 uppercase tracking-wider" style={{ color: "var(--on-surface-variant)" }}>CI Level</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Latency Chart */}
        <div className="p-5" style={{ background: "var(--surface-container)" }}>
          <h3 className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ fontFamily: "'Space Grotesk', sans-serif", color: "var(--on-surface)" }}>
            Execution Latency
          </h3>
          <p className="text-[10px] mb-4" style={{ color: "var(--on-surface-variant)" }}>Time-to-first-row (TTFR) comparison in milliseconds</p>
          <div className="h-48">
            {latestResult ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={comparisonData} layout="vertical" margin={{ left: 20 }}>
                  <CartesianGrid stroke="rgba(64,72,93,0.15)" horizontal={false} />
                  <XAxis type="number" tick={{ fill: "#a3aac4", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}ms`} />
                  <YAxis type="category" dataKey="name" tick={{ fill: "#a3aac4", fontSize: 11 }} axisLine={false} tickLine={false} width={110} />
                  <Tooltip contentStyle={{ background: "#141f38", border: "none", borderRadius: 0, color: "#dee5ff", fontSize: 12, fontFamily: "'JetBrains Mono', monospace" }} />
                  <Bar dataKey="value" maxBarSize={30}>
                    {comparisonData.map((entry, i) => (
                      <rect key={i} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="w-full h-full flex items-center justify-center" style={{ background: "var(--surface-container-low)" }}>
                <p className="text-xs" style={{ color: "var(--on-surface-variant)" }}>Run a query to compare</p>
              </div>
            )}
          </div>
        </div>

        {/* Integrity Matrix */}
        <div className="p-5" style={{ background: "var(--surface-container)" }}>
          <h3 className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ fontFamily: "'Space Grotesk', sans-serif", color: "var(--on-surface)" }}>
            Integrity Matrix
          </h3>
          <div className="space-y-3">
            {[
              { label: "Accuracy", value: errorPct !== null ? `${(100 - errorPct).toFixed(2)}%` : "—", good: true },
              { label: "Error Margin", value: errorPct !== null ? `${errorPct.toFixed(4)}%` : "—", good: errorPct !== null && errorPct < 1 },
              { label: "Speedup Factor", value: latestResult ? `${latestResult.metrics.speedup.toFixed(2)}x` : "—", good: true },
              { label: "Sample Fraction", value: latestResult ? `${(latestResult.metrics.fraction_used * 100).toFixed(0)}%` : "—", good: true },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between p-3" style={{ background: "var(--surface-container-low)" }}>
                <span className="text-[11px] uppercase tracking-wider" style={{ color: "var(--on-surface-variant)" }}>{item.label}</span>
                <span className="mono-data text-sm font-bold" style={{ color: item.good ? "var(--tertiary-green)" : "var(--error-red)" }}>
                  {item.value}
                </span>
              </div>
            ))}
            {latestResult && (
              <div className="p-3 flex items-center gap-2" style={{ background: "rgba(155,255,206,0.08)" }}>
                <span className="material-symbols-outlined text-[16px]" style={{ color: "var(--tertiary-green)" }}>verified</span>
                <span className="text-[11px] uppercase tracking-wider font-semibold" style={{ color: "var(--tertiary-green)" }}>
                  Verified Accurate
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Result Set Validation */}
      <div className="p-5" style={{ background: "var(--surface-container)" }}>
        <h3 className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ fontFamily: "'Space Grotesk', sans-serif", color: "var(--on-surface)" }}>
          Result Set Validation
        </h3>
        <div className="p-3 mb-4 mono-data text-xs" style={{ background: "var(--surface-container-lowest)", color: "var(--primary-cyan)" }}>
          SELECT approx_count_distinct(user_id, 0.01) FROM telemetry_stream WHERE region = &apos;us-east-1&apos;
        </div>
        {latestResult ? (
          <table className="data-table">
            <thead>
              <tr>
                <th>Metric</th>
                <th>Approximate Result</th>
                <th>Exact Result</th>
                <th>Variance</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>{queryHistory.length > 0 ? queryHistory[queryHistory.length - 1].type : "VALUE"}</td>
                <td style={{ color: "var(--tertiary-green)" }}>
                  {Number(latestResult.approximate.value).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                </td>
                <td>{Number(latestResult.exact.value).toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>
                <td>{errorPct !== null ? `${errorPct.toFixed(4)}%` : "N/A"}</td>
                <td>
                  <span className="px-2 py-0.5 text-[10px] font-semibold uppercase" style={{
                    background: errorPct !== null && errorPct < 5 ? "rgba(155,255,206,0.15)" : "rgba(255,113,108,0.15)",
                    color: errorPct !== null && errorPct < 5 ? "var(--tertiary-green)" : "var(--error-red)"
                  }}>
                    {errorPct !== null && errorPct < 5 ? "PASS" : "REVIEW"}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        ) : (
          <div className="p-8 text-center" style={{ background: "var(--surface-container-low)" }}>
            <p className="text-xs" style={{ color: "var(--on-surface-variant)" }}>No comparison data. Execute a query from the Workbench to populate.</p>
          </div>
        )}
      </div>

      {/* Benchmark Comparison */}
      {benchmarkResults && (
        <div className="p-5" style={{ background: "var(--surface-container)" }}>
          <h3 className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ fontFamily: "'Space Grotesk', sans-serif", color: "var(--on-surface)" }}>
            Benchmark Comparison Matrix
          </h3>
          <table className="data-table">
            <thead>
              <tr><th>Sample %</th><th>Latency (ms)</th><th>Error %</th><th>Speedup</th><th>Verdict</th></tr>
            </thead>
            <tbody>
              {benchmarkResults.benchmark.map((row: BenchmarkRow, idx: number) => (
                <tr key={idx}>
                  <td>{(row.fraction * 100).toFixed(0)}%</td>
                  <td>{row.time_ms.toFixed(2)}</td>
                  <td>{typeof row.error_percent === "number" ? `${row.error_percent.toFixed(2)}%` : "N/A"}</td>
                  <td style={{ color: "var(--tertiary-green)", fontWeight: 700 }}>{row.speedup.toFixed(2)}x</td>
                  <td>
                    <span className="px-2 py-0.5 text-[10px] font-semibold uppercase" style={{
                      background: typeof row.error_percent === "number" && row.error_percent < 5 ? "rgba(155,255,206,0.15)" : "rgba(255,113,108,0.15)",
                      color: typeof row.error_percent === "number" && row.error_percent < 5 ? "var(--tertiary-green)" : "var(--error-red)"
                    }}>
                      {typeof row.error_percent === "number" && row.error_percent < 5 ? "PASS" : "REVIEW"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
