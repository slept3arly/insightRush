"use client";
import { QueryResult, BenchmarkResponse } from "@/types";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, AreaChart, Area
} from "recharts";

interface Props {
  results: QueryResult | null;
  benchmarkResults: BenchmarkResponse | null;
  queryHistory: Array<{ type: string; column: string; accuracy: number; result: QueryResult; timestamp: Date }>;
}

const mockPerformanceData = [
  { time: "00:00", latency: 12, throughput: 84 },
  { time: "00:05", latency: 15, throughput: 78 },
  { time: "00:10", latency: 9, throughput: 92 },
  { time: "00:15", latency: 11, throughput: 88 },
  { time: "00:20", latency: 8, throughput: 95 },
  { time: "00:25", latency: 13, throughput: 82 },
  { time: "00:30", latency: 7, throughput: 97 },
];

export default function DashboardView(props: Props) {
  const { results, queryHistory } = props;
  const latestResult = results || (queryHistory.length > 0 ? queryHistory[queryHistory.length - 1].result : null);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ fontFamily: "'Space Grotesk', sans-serif", color: "var(--on-surface)" }}>
            SYSTEM.OVERVIEW
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--on-surface-variant)" }}>
            Operational Telemetry | Real-time Analysis
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1.5" style={{ background: "rgba(155, 255, 206, 0.1)" }}>
            <div className="pulse-indicator-green" />
            <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "var(--tertiary-green)" }}>
              Cluster Health Optimal
            </span>
          </div>
          <div className="flex items-center gap-3 px-3 py-1.5" style={{ background: "var(--surface-container)" }}>
            <span className="text-[11px] uppercase tracking-wider" style={{ color: "var(--on-surface-variant)" }}>Resources</span>
            <span className="text-[11px] uppercase tracking-wider" style={{ color: "var(--on-surface-variant)" }}>Logs</span>
          </div>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Active Nodes", value: "124", sub: "32 Workers", color: "var(--primary-cyan)" },
          { label: "Memory Allocation", value: "67%", sub: "12.4 GB / 18 GB", color: "var(--primary-cyan)" },
          { label: "Ingestion Rate", value: "2.4M", sub: "rows/sec", color: "var(--tertiary-green)" },
          { label: "Avg Latency", value: latestResult ? `${latestResult.approximate.time_ms.toFixed(1)}ms` : "4.2ms", sub: "p99: 12ms", color: "var(--primary-cyan)" },
        ].map((kpi, i) => (
          <div key={i} className="p-5 status-ribbon status-ribbon-active" style={{ background: "var(--surface-container)" }}>
            <p className="text-[11px] font-medium uppercase tracking-wider mb-3" style={{ color: "var(--on-surface-variant)" }}>
              {kpi.label}
            </p>
            <p className="kpi-value text-3xl" style={{ color: kpi.color }}>{kpi.value}</p>
            <p className="text-[11px] mt-2 mono-data" style={{ color: "var(--on-surface-variant)" }}>{kpi.sub}</p>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-12 gap-4">
        {/* Performance Analytics */}
        <div className="col-span-8 p-5" style={{ background: "var(--surface-container)" }}>
          <h3 className="text-sm font-semibold uppercase tracking-wider mb-4" style={{ fontFamily: "'Space Grotesk', sans-serif", color: "var(--on-surface)" }}>
            Performance Analytics
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={mockPerformanceData}>
                <defs>
                  <linearGradient id="latencyGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#81ecff" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#81ecff" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="throughputGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#9bffce" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#9bffce" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="rgba(64,72,93,0.15)" vertical={false} />
                <XAxis dataKey="time" tick={{ fill: "#a3aac4", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#a3aac4", fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: "#141f38", border: "none", borderRadius: 0, color: "#dee5ff", fontFamily: "'JetBrains Mono', monospace", fontSize: 12 }}
                />
                <Area type="monotone" dataKey="latency" stroke="#81ecff" fill="url(#latencyGrad)" strokeWidth={2} />
                <Area type="monotone" dataKey="throughput" stroke="#9bffce" fill="url(#throughputGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Live Data Streams */}
        <div className="col-span-4 p-5 flex flex-col gap-4" style={{ background: "var(--surface-container)" }}>
          <h3 className="text-sm font-semibold uppercase tracking-wider" style={{ fontFamily: "'Space Grotesk', sans-serif", color: "var(--on-surface)" }}>
            Live Data Streams
          </h3>
          {[
            { label: "Storage Engine", val: "92%", status: "green" },
            { label: "Query Cache", val: "78%", status: "cyan" },
            { label: "Index Buffer", val: "45%", status: "cyan" },
          ].map((s, i) => (
            <div key={i} className="p-3" style={{ background: "var(--surface-container-low)" }}>
              <div className="flex justify-between items-center mb-2">
                <span className="text-[11px] font-medium uppercase tracking-wider" style={{ color: "var(--on-surface-variant)" }}>{s.label}</span>
                <span className="mono-data text-xs font-semibold" style={{ color: s.status === "green" ? "var(--tertiary-green)" : "var(--primary-cyan)" }}>
                  {s.val}
                </span>
              </div>
              <div className="h-1.5 w-full" style={{ background: "var(--surface-container-lowest)" }}>
                <div className="h-full transition-all" style={{
                  width: s.val,
                  background: s.status === "green"
                    ? "linear-gradient(90deg, var(--tertiary-green-dim), var(--tertiary-green))"
                    : "linear-gradient(90deg, var(--primary-cyan-dim), var(--primary-cyan))"
                }} />
              </div>
            </div>
          ))}
          <div className="mt-auto p-3" style={{ background: "var(--surface-container-low)" }}>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] uppercase tracking-wider" style={{ color: "var(--on-surface-variant)" }}>Engine Load</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold mono-data" style={{ color: "var(--tertiary-green)" }}>OPTIMAL</span>
              <span className="text-xs mono-data" style={{ color: "var(--on-surface-variant)" }}>(12.4%)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Queries */}
      <div className="p-5" style={{ background: "var(--surface-container)" }}>
        <h3 className="text-sm font-semibold uppercase tracking-wider mb-4" style={{ fontFamily: "'Space Grotesk', sans-serif", color: "var(--on-surface)" }}>
          Recently Processed Queries
        </h3>
        <div className="space-y-2">
          {queryHistory.length > 0 ? (
            queryHistory.slice(-5).reverse().map((q, i) => (
              <div key={i} className="p-3 flex items-center justify-between status-ribbon status-ribbon-success" style={{ background: "var(--surface-container-low)" }}>
                <div className="flex-1 pl-3">
                  <code className="text-xs mono-data" style={{ color: "var(--primary-cyan)" }}>
                    SELECT {q.type.toLowerCase()}({q.column || "*"}) FROM uploaded_dataset
                  </code>
                  <p className="text-[10px] mt-1" style={{ color: "var(--on-surface-variant)" }}>
                    {q.timestamp.toLocaleTimeString()} — {typeof q.result.metrics.error_percent === "number" ? `Error: ${q.result.metrics.error_percent.toFixed(2)}%` : "N/A"} — Speedup: {q.result.metrics.speedup.toFixed(1)}x
                  </p>
                </div>
                <span className="text-[10px] font-semibold uppercase px-2 py-1" style={{ background: "rgba(155,255,206,0.1)", color: "var(--tertiary-green)" }}>
                  Completed
                </span>
              </div>
            ))
          ) : (
            <>
              <div className="p-3 flex items-center justify-between status-ribbon status-ribbon-active" style={{ background: "var(--surface-container-low)" }}>
                <div className="pl-3">
                  <code className="text-xs mono-data" style={{ color: "var(--primary-cyan)" }}>
                    SELECT avg(temp) FROM sensor_stream WHERE fleet_id = &apos;A9&apos; GROUP BY window(1m)...
                  </code>
                  <p className="text-[10px] mt-1" style={{ color: "var(--on-surface-variant)" }}>2.4ms — Error: 0.03% — Sample: 15%</p>
                </div>
                <span className="text-[10px] font-semibold uppercase px-2 py-1" style={{ background: "rgba(129,236,255,0.1)", color: "var(--primary-cyan)" }}>Processing</span>
              </div>
              <div className="p-3 flex items-center justify-between status-ribbon status-ribbon-success" style={{ background: "var(--surface-container-low)" }}>
                <div className="pl-3">
                  <code className="text-xs mono-data" style={{ color: "var(--primary-cyan)" }}>
                    SELECT count(*) FROM user_logs WHERE action = &apos;purchase&apos; AND region = &apos;emea&apos;...
                  </code>
                  <p className="text-[10px] mt-1" style={{ color: "var(--on-surface-variant)" }}>1.8ms — Error: 0.07% — Sample: 10%</p>
                </div>
                <span className="text-[10px] font-semibold uppercase px-2 py-1" style={{ background: "rgba(155,255,206,0.1)", color: "var(--tertiary-green)" }}>Completed</span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
