"use client";
import { useState } from "react";

export default function ConfigurationView() {
  const [bernoulliEnabled, setBernoulliEnabled] = useState(true);
  const [stratifiedEnabled, setStratifiedEnabled] = useState(false);
  const [sketchEnabled, setSketchEnabled] = useState(true);
  const [bernoulliRate, setBernoulliRate] = useState(15);
  const [stratifiedRate, setStratifiedRate] = useState(25);
  const [sketchPrecision, setSketchPrecision] = useState(14);

  const logs = [
    { time: "15:32:01", level: "INFO", msg: "ENGINE OPERATIONAL — Kernel v4.2.1 initialized" },
    { time: "15:32:02", level: "PROC", msg: "Bernoulli sampler attached to stream [global_fin_streams]" },
    { time: "15:32:03", level: "INFO", msg: "HyperLogLog sketch initialized — precision: 14 bits" },
    { time: "15:32:04", level: "WARN", msg: "Stratified sampler disabled — enable in configuration" },
    { time: "15:32:05", level: "INFO", msg: "Query cache warmed — 2,847 entries loaded" },
    { time: "15:32:06", level: "PROC", msg: "Worker pool scaled to 32 threads" },
  ];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight" style={{ fontFamily: "'Space Grotesk', sans-serif", color: "var(--on-surface)" }}>
          SAMPLING.ARCHITECTURE
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--on-surface-variant)" }}>
          Configure high-fidelity approximation algorithms. Adjust sampling constraints and probabilistic sketch parameters.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {/* Bernoulli */}
        <div className="p-5" style={{ background: "var(--surface-container)" }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider" style={{ fontFamily: "'Space Grotesk', sans-serif", color: "var(--on-surface)" }}>
              Bernoulli Sampling
            </h3>
            <button onClick={() => setBernoulliEnabled(!bernoulliEnabled)} className="w-10 h-5 relative transition-colors" style={{
              background: bernoulliEnabled ? "var(--primary-cyan)" : "var(--outline-variant)"
            }}>
              <div className="absolute top-0.5 w-4 h-4 transition-all" style={{
                background: bernoulliEnabled ? "var(--primary-foreground)" : "var(--on-surface-variant)",
                left: bernoulliEnabled ? "calc(100% - 18px)" : "2px"
              }} />
            </button>
          </div>
          <p className="text-[11px] mb-4" style={{ color: "var(--on-surface-variant)" }}>
            Each row is independently included with probability p. Unbiased estimator for aggregates.
          </p>
          <div className="p-3 mb-4 mono-data text-[11px]" style={{ background: "var(--surface-container-lowest)", color: "var(--on-surface-variant)" }}>
            <span style={{ color: "var(--primary-cyan)" }}>w(x)</span> = 1/p · f(x)
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-[11px] uppercase tracking-wider" style={{ color: "var(--on-surface-variant)" }}>Sample Rate</span>
              <span className="mono-data text-sm font-bold" style={{ color: "var(--primary-cyan)" }}>{bernoulliRate}%</span>
            </div>
            <input type="range" min={1} max={50} value={bernoulliRate} onChange={(e) => setBernoulliRate(Number(e.target.value))}
              className="w-full h-1.5 appearance-none cursor-pointer"
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
            <button onClick={() => setStratifiedEnabled(!stratifiedEnabled)} className="w-10 h-5 relative transition-colors" style={{
              background: stratifiedEnabled ? "var(--primary-cyan)" : "var(--outline-variant)"
            }}>
              <div className="absolute top-0.5 w-4 h-4 transition-all" style={{
                background: stratifiedEnabled ? "var(--primary-foreground)" : "var(--on-surface-variant)",
                left: stratifiedEnabled ? "calc(100% - 18px)" : "2px"
              }} />
            </button>
          </div>
          <p className="text-[11px] mb-4" style={{ color: "var(--on-surface-variant)" }}>
            Data partitioned into strata. Each stratum sampled proportionally for reduced variance.
          </p>
          <div className="p-3 mb-4 mono-data text-[11px]" style={{ background: "var(--surface-container-lowest)", color: "var(--on-surface-variant)" }}>
            <span style={{ color: "var(--primary-cyan)" }}>Ŷ</span> = Σ Nₕ · ȳₕ
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-[11px] uppercase tracking-wider" style={{ color: "var(--on-surface-variant)" }}>Sample Rate</span>
              <span className="mono-data text-sm font-bold" style={{ color: stratifiedEnabled ? "var(--primary-cyan)" : "var(--outline)" }}>{stratifiedRate}%</span>
            </div>
            <input type="range" min={1} max={50} value={stratifiedRate} onChange={(e) => setStratifiedRate(Number(e.target.value))}
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
            <button onClick={() => setSketchEnabled(!sketchEnabled)} className="w-10 h-5 relative transition-colors" style={{
              background: sketchEnabled ? "var(--primary-cyan)" : "var(--outline-variant)"
            }}>
              <div className="absolute top-0.5 w-4 h-4 transition-all" style={{
                background: sketchEnabled ? "var(--primary-foreground)" : "var(--on-surface-variant)",
                left: sketchEnabled ? "calc(100% - 18px)" : "2px"
              }} />
            </button>
          </div>
          <p className="text-[11px] mb-4" style={{ color: "var(--on-surface-variant)" }}>
            HyperLogLog for cardinality, Count-Min Sketch for frequency. Sub-linear memory.
          </p>
          <div className="p-3 mb-4 mono-data text-[11px]" style={{ background: "var(--surface-container-lowest)", color: "var(--on-surface-variant)" }}>
            <span style={{ color: "var(--primary-cyan)" }}>HLL</span> precision: 2^p registers
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-[11px] uppercase tracking-wider" style={{ color: "var(--on-surface-variant)" }}>Precision (bits)</span>
              <span className="mono-data text-sm font-bold" style={{ color: "var(--primary-cyan)" }}>{sketchPrecision}</span>
            </div>
            <input type="range" min={4} max={18} value={sketchPrecision} onChange={(e) => setSketchPrecision(Number(e.target.value))}
              className="w-full h-1.5 appearance-none cursor-pointer"
              style={{ background: `linear-gradient(to right, var(--primary-cyan) 0%, var(--primary-cyan) ${((sketchPrecision - 4) / 14) * 100}%, var(--surface-container-lowest) ${((sketchPrecision - 4) / 14) * 100}%, var(--surface-container-lowest) 100%)` }}
            />
          </div>
        </div>
      </div>

      {/* System Logs */}
      <div className="p-5" style={{ background: "var(--surface-container)" }}>
        <h3 className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ fontFamily: "'Space Grotesk', sans-serif", color: "var(--on-surface)" }}>
          System Logs
        </h3>
        <div className="p-4 space-y-2 mono-data text-xs" style={{ background: "var(--surface-container-lowest)" }}>
          {logs.map((log, i) => (
            <div key={i} className="flex gap-3">
              <span style={{ color: "var(--outline)" }}>{log.time}</span>
              <span className="font-semibold w-12" style={{
                color: log.level === "WARN" ? "#fbbf24" : log.level === "PROC" ? "var(--primary-cyan)" : "var(--tertiary-green)"
              }}>
                [{log.level}]
              </span>
              <span style={{ color: "var(--on-surface-variant)" }}>{log.msg}</span>
            </div>
          ))}
          <div className="flex items-center gap-2 mt-2 pt-2" style={{ borderTop: "1px solid var(--border)" }}>
            <div className="pulse-indicator" />
            <span style={{ color: "var(--on-surface-variant)" }}>Listening for events...</span>
          </div>
        </div>
      </div>
    </div>
  );
}
