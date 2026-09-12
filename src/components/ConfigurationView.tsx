"use client";
import { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "sonner";
import { SystemStats } from "@/types";

interface ConfigurationViewProps {
  systemStats?: SystemStats | null;
}

interface LogEntry {
  time: string;
  level: "INFO" | "PROC" | "WARN" | "SUCCESS";
  msg: string;
}

export default function ConfigurationView({ systemStats }: ConfigurationViewProps) {
  const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  const [bernoulliEnabled, setBernoulliEnabled] = useState(true);
  const [stratifiedEnabled, setStratifiedEnabled] = useState(false);
  const [sketchEnabled, setSketchEnabled] = useState(true);
  const [bernoulliRate, setBernoulliRate] = useState(15);
  const [stratifiedRate, setStratifiedRate] = useState(25);
  const [sketchPrecision, setSketchPrecision] = useState(14);
  const [defaultConfidence, setDefaultConfidence] = useState("0.95");
  const [purging, setPurging] = useState(false);

  const [logs, setLogs] = useState<LogEntry[]>([
    { time: new Date().toLocaleTimeString(), level: "INFO", msg: "ENGINE OPERATIONAL — Fast AQP Engine initialized" },
    { time: new Date().toLocaleTimeString(), level: "PROC", msg: "Bernoulli sampler initialized with 1-25% dynamic adaptive fraction" },
    { time: new Date().toLocaleTimeString(), level: "INFO", msg: "HyperLogLog cardinality sketch initialized (precision: 14 bits)" },
  ]);

  const addLog = (level: LogEntry["level"], msg: string) => {
    setLogs((prev) => [
      ...prev,
      { time: new Date().toLocaleTimeString(), level, msg }
    ]);
  };

  useEffect(() => {
    if (systemStats) {
      addLog("INFO", `Engine telemetry updated — ${systemStats.active_tables} active table(s), ${systemStats.memory_usage_mb}MB RAM allocated`);
    }
  }, [systemStats?.active_tables, systemStats?.memory_usage_mb]);

  const handleToggleBernoulli = () => {
    const next = !bernoulliEnabled;
    setBernoulliEnabled(next);
    addLog(next ? "SUCCESS" : "WARN", `Bernoulli sampling engine ${next ? "ENABLED" : "DISABLED"}`);
    toast.success(`Bernoulli sampling ${next ? "enabled" : "disabled"}`);
  };

  const handleToggleStratified = () => {
    const next = !stratifiedEnabled;
    setStratifiedEnabled(next);
    addLog(next ? "SUCCESS" : "WARN", `Stratified sampling engine ${next ? "ENABLED" : "DISABLED"}`);
    toast.success(`Stratified sampling ${next ? "enabled" : "disabled"}`);
  };

  const handleToggleSketch = () => {
    const next = !sketchEnabled;
    setSketchEnabled(next);
    addLog(next ? "SUCCESS" : "WARN", `Probabilistic sketches (HLL) ${next ? "ENABLED" : "DISABLED"}`);
    toast.success(`Probabilistic sketches ${next ? "enabled" : "disabled"}`);
  };

  const handlePurgeCache = async () => {
    setPurging(true);
    try {
      const res = await axios.post(`${API_BASE}/cache/purge`);
      const purgedCount = res.data?.purged_sample_tables ?? 0;
      addLog("SUCCESS", `Materialized sample table cache purged — ${purgedCount} sample table(s) dropped from DuckDB`);
      toast.success(`Purged ${purgedCount} sample table(s) from database cache`);
    } catch (err) {
      addLog("WARN", "Failed to purge sample table cache — make sure backend is active");
      toast.error("Failed to purge sample table cache");
    } finally {
      setPurging(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ fontFamily: "'Space Grotesk', sans-serif", color: "var(--on-surface)" }}>
            SAMPLING.ARCHITECTURE
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--on-surface-variant)" }}>
            Configure approximation algorithms, statistical parameters, and database cache maintenance.
          </p>
        </div>

        <button
          onClick={handlePurgeCache}
          disabled={purging}
          className="btn-kinetic px-4 py-2 text-xs font-semibold uppercase tracking-wider disabled:opacity-40"
        >
          {purging ? "Purging Cache..." : "Purge Sample Cache"}
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {/* Bernoulli */}
        <div className="p-5" style={{ background: "var(--surface-container)" }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider" style={{ fontFamily: "'Space Grotesk', sans-serif", color: "var(--on-surface)" }}>
              Bernoulli Sampling
            </h3>
            <button onClick={handleToggleBernoulli} className="w-10 h-5 relative transition-colors cursor-pointer" style={{
              background: bernoulliEnabled ? "var(--primary-cyan)" : "var(--outline-variant)"
            }}>
              <div className="absolute top-0.5 w-4 h-4 transition-all" style={{
                background: bernoulliEnabled ? "var(--primary-foreground)" : "var(--on-surface-variant)",
                left: bernoulliEnabled ? "calc(100% - 18px)" : "2px"
              }} />
            </button>
          </div>
          <p className="text-[11px] mb-4" style={{ color: "var(--on-surface-variant)" }}>
            Each row is independently included with probability p. Unbiased estimator for aggregations.
          </p>
          <div className="p-3 mb-4 mono-data text-[11px]" style={{ background: "var(--surface-container-lowest)", color: "var(--on-surface-variant)" }}>
            <span style={{ color: "var(--primary-cyan)" }}>w(x)</span> = 1/p · f(x)
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-[11px] uppercase tracking-wider" style={{ color: "var(--on-surface-variant)" }}>Target Sample Rate</span>
              <span className="mono-data text-sm font-bold" style={{ color: "var(--primary-cyan)" }}>{bernoulliRate}%</span>
            </div>
            <input type="range" min={1} max={50} value={bernoulliRate}
              onChange={(e) => {
                const val = Number(e.target.value);
                setBernoulliRate(val);
                addLog("PROC", `Bernoulli target sample rate adjusted to ${val}%`);
              }}
              disabled={!bernoulliEnabled}
              className="w-full h-1.5 appearance-none cursor-pointer disabled:opacity-40"
              style={{ background: `linear-gradient(to right, var(--primary-cyan) 0%, var(--primary-cyan) ${bernoulliRate * 2}%, var(--surface-container-lowest) ${bernoulliRate * 2}%, var(--surface-container-lowest) 100%)` }}
            />
          </div>
        </div>

        {/* Stratified */}
        <div className="p-5" style={{ background: "var(--surface-container)" }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider" style={{ fontFamily: "'Space Grotesk', sans-serif", color: "var(--on-surface)" }}>
              Stratified Sampling
            </h3>
            <button onClick={handleToggleStratified} className="w-10 h-5 relative transition-colors cursor-pointer" style={{
              background: stratifiedEnabled ? "var(--primary-cyan)" : "var(--outline-variant)"
            }}>
              <div className="absolute top-0.5 w-4 h-4 transition-all" style={{
                background: stratifiedEnabled ? "var(--primary-foreground)" : "var(--on-surface-variant)",
                left: stratifiedEnabled ? "calc(100% - 18px)" : "2px"
              }} />
            </button>
          </div>
          <p className="text-[11px] mb-4" style={{ color: "var(--on-surface-variant)" }}>
            Data partitioned into strata. Each stratum sampled proportionally to reduce variance.
          </p>
          <div className="p-3 mb-4 mono-data text-[11px]" style={{ background: "var(--surface-container-lowest)", color: "var(--on-surface-variant)" }}>
            <span style={{ color: "var(--primary-cyan)" }}>Ŷ</span> = Σ Nₕ · ȳₕ
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-[11px] uppercase tracking-wider" style={{ color: "var(--on-surface-variant)" }}>Stratum Allocation</span>
              <span className="mono-data text-sm font-bold" style={{ color: stratifiedEnabled ? "var(--primary-cyan)" : "var(--outline)" }}>{stratifiedRate}%</span>
            </div>
            <input type="range" min={1} max={50} value={stratifiedRate}
              onChange={(e) => {
                const val = Number(e.target.value);
                setStratifiedRate(val);
                addLog("PROC", `Stratified rate adjusted to ${val}%`);
              }}
              disabled={!stratifiedEnabled}
              className="w-full h-1.5 appearance-none cursor-pointer disabled:opacity-40"
              style={{ background: `linear-gradient(to right, var(--primary-cyan) 0%, var(--primary-cyan) ${stratifiedRate * 2}%, var(--surface-container-lowest) ${stratifiedRate * 2}%, var(--surface-container-lowest) 100%)` }}
            />
          </div>
        </div>

        {/* Probabilistic Sketches */}
        <div className="p-5" style={{ background: "var(--surface-container)" }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider" style={{ fontFamily: "'Space Grotesk', sans-serif", color: "var(--on-surface)" }}>
              Probabilistic Sketches
            </h3>
            <button onClick={handleToggleSketch} className="w-10 h-5 relative transition-colors cursor-pointer" style={{
              background: sketchEnabled ? "var(--primary-cyan)" : "var(--outline-variant)"
            }}>
              <div className="absolute top-0.5 w-4 h-4 transition-all" style={{
                background: sketchEnabled ? "var(--primary-foreground)" : "var(--on-surface-variant)",
                left: sketchEnabled ? "calc(100% - 18px)" : "2px"
              }} />
            </button>
          </div>
          <p className="text-[11px] mb-4" style={{ color: "var(--on-surface-variant)" }}>
            HyperLogLog for cardinality estimation (COUNT DISTINCT). Constant sub-linear memory.
          </p>
          <div className="p-3 mb-4 mono-data text-[11px]" style={{ background: "var(--surface-container-lowest)", color: "var(--on-surface-variant)" }}>
            <span style={{ color: "var(--primary-cyan)" }}>HLL</span> precision: 2^{sketchPrecision} registers
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-[11px] uppercase tracking-wider" style={{ color: "var(--on-surface-variant)" }}>Precision (bits)</span>
              <span className="mono-data text-sm font-bold" style={{ color: sketchEnabled ? "var(--primary-cyan)" : "var(--outline)" }}>{sketchPrecision}</span>
            </div>
            <input type="range" min={4} max={18} value={sketchPrecision}
              onChange={(e) => {
                const val = Number(e.target.value);
                setSketchPrecision(val);
                addLog("PROC", `HyperLogLog precision updated to ${val} bits`);
              }}
              disabled={!sketchEnabled}
              className="w-full h-1.5 appearance-none cursor-pointer disabled:opacity-40"
              style={{ background: `linear-gradient(to right, var(--primary-cyan) 0%, var(--primary-cyan) ${((sketchPrecision - 4) / 14) * 100}%, var(--surface-container-lowest) ${((sketchPrecision - 4) / 14) * 100}%, var(--surface-container-lowest) 100%)` }}
            />
          </div>
        </div>
      </div>

      {/* Defaults & Confidence Level */}
      <div className="p-5 space-y-4" style={{ background: "var(--surface-container)" }}>
        <h3 className="text-xs font-semibold uppercase tracking-wider" style={{ fontFamily: "'Space Grotesk', sans-serif", color: "var(--on-surface)" }}>
          Statistical Bounds & Confidence Parameters
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-[11px] uppercase tracking-wider block mb-2" style={{ color: "var(--on-surface-variant)" }}>
              Default Confidence Level
            </label>
            <select
              value={defaultConfidence}
              onChange={(e) => {
                setDefaultConfidence(e.target.value);
                addLog("INFO", `Default confidence level changed to ${(Number(e.target.value) * 100).toFixed(0)}%`);
                toast.success(`Confidence level set to ${(Number(e.target.value) * 100).toFixed(0)}%`);
              }}
              className="w-full p-2.5 text-xs font-mono border-0 focus:outline-none cursor-pointer"
              style={{ background: "var(--surface-container-lowest)", color: "var(--on-surface)" }}
            >
              <option value="0.90">90% Confidence (Z = 1.645)</option>
              <option value="0.95">95% Confidence (Z = 1.960)</option>
              <option value="0.99">99% Confidence (Z = 2.576)</option>
            </select>
          </div>

          <div>
            <label className="text-[11px] uppercase tracking-wider block mb-2" style={{ color: "var(--on-surface-variant)" }}>
              Cache Purging Strategy
            </label>
            <div className="p-2.5 text-xs font-mono flex items-center justify-between" style={{ background: "var(--surface-container-lowest)", color: "var(--on-surface-variant)" }}>
              <span>Manual / API Triggered</span>
              <span className="text-[10px] font-bold px-2 py-0.5" style={{ background: "rgba(155,255,206,0.15)", color: "var(--tertiary-green)" }}>
                ACTIVE
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* System Logs */}
      <div className="p-5" style={{ background: "var(--surface-container)" }}>
        <h3 className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ fontFamily: "'Space Grotesk', sans-serif", color: "var(--on-surface)" }}>
          Live System Event Stream
        </h3>
        <div className="p-4 space-y-2 mono-data text-xs max-h-60 overflow-y-auto" style={{ background: "var(--surface-container-lowest)" }}>
          {logs.map((log, i) => (
            <div key={i} className="flex gap-3">
              <span style={{ color: "var(--outline)" }}>{log.time}</span>
              <span className="font-semibold w-16" style={{
                color: log.level === "WARN" ? "#fbbf24" : log.level === "PROC" ? "var(--primary-cyan)" : log.level === "SUCCESS" ? "var(--tertiary-green)" : "#81ecff"
              }}>
                [{log.level}]
              </span>
              <span style={{ color: "var(--on-surface-variant)" }}>{log.msg}</span>
            </div>
          ))}
          <div className="flex items-center gap-2 mt-2 pt-2" style={{ borderTop: "1px solid var(--border)" }}>
            <div className="pulse-indicator" />
            <span style={{ color: "var(--on-surface-variant)" }}>Listening for live events...</span>
          </div>
        </div>
      </div>
    </div>
  );
}
