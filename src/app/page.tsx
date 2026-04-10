"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import Sidebar from "@/components/Sidebar";
import DashboardView from "@/components/DashboardView";
import QueryWorkbenchView from "@/components/QueryWorkbenchView";
import ComparisonView from "@/components/ComparisonView";
import ConfigurationView from "@/components/ConfigurationView";
import { BenchmarkResponse, QueryResult, SystemStats, ViewType } from "@/types";

function extractResultValue(result: unknown): number | Record<string, number> {
  if (typeof result === "object" && result !== null) {
    if ("estimate" in result && typeof result.estimate === "number") {
      return result.estimate;
    }

    return result as Record<string, number>;
  }

  return typeof result === "number" ? result : 0;
}

function extractErrorMargin(result: unknown, topLevelErrorMargin: number | null | undefined) {
  if (typeof topLevelErrorMargin === "number") {
    return topLevelErrorMargin;
  }

  if (typeof result === "object" && result !== null && "error_margin" in result) {
    return typeof result.error_margin === "number" ? result.error_margin : null;
  }

  return null;
}

function calculateErrorPercent(params: {
  approximate: number | Record<string, number>;
  exact?: number | Record<string, number>;
  errorMargin?: number | null;
}) {
  const { approximate, exact, errorMargin } = params;

  if (typeof approximate === "number" && typeof exact === "number") {
    if (exact === 0) {
      return approximate === 0 ? 0 : null;
    }

    return (Math.abs(approximate - exact) / Math.abs(exact)) * 100;
  }

  if (typeof approximate === "number" && typeof errorMargin === "number" && approximate !== 0) {
    return (Math.abs(errorMargin) / Math.abs(approximate)) * 100;
  }

  return null;
}

function calculateSpeedup(exactTimeMs: number, approxTimeMs: number) {
  if (approxTimeMs <= 0) {
    return 0;
  }

  return exactTimeMs / approxTimeMs;
}

function getApiErrorMessage(error: unknown, fallback: string) {
  if (axios.isAxiosError(error)) {
    return error.response?.data?.detail || fallback;
  }

  return fallback;
}

function buildApproximationNote(mode: "exact" | "approx", sampleFraction: number, queryType: string) {
  if (mode === "exact") {
    if (queryType === "COUNT") {
      return "Planner kept COUNT on the exact path because DuckDB already executes it faster than sampled AQP.";
    }

    return `Planner selected exact fallback for this ${queryType} query and dataset size.`;
  }

  return `Approximation is using a cached ${(sampleFraction * 100).toFixed(0)}% sample.`;
}

export default function Home() {
  const [activeView, setActiveView] = useState<ViewType>("dashboard");
  const [file, setFile] = useState<File | null>(null);
  const [queryType, setQueryType] = useState("COUNT");
  const [column, setColumn] = useState("");
  const [accuracyLevel, setAccuracyLevel] = useState(10);
  const [results, setResults] = useState<QueryResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTable, setActiveTable] = useState<string | null>(null);
  const [benchmarkResults, setBenchmarkResults] = useState<BenchmarkResponse | null>(null);
  const [groupBy, setGroupBy] = useState("");
  const [systemStats, setSystemStats] = useState<SystemStats | null>(null);
  const [queryHistory, setQueryHistory] = useState<Array<{
    type: string; column: string; group_by: string; accuracy: number;
    result: QueryResult; timestamp: Date;
  }>>([]);

  const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await axios.get(`${API_BASE}/stats`);
        setSystemStats(res.data);
      } catch {
        setSystemStats({
          active_tables: 0,
          memory_usage_mb: 0,
          engine_status: "OFFLINE",
          total_cached_rows: 0,
        });
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 5000);
    return () => clearInterval(interval);
  }, [API_BASE]);

  useEffect(() => {
    setResults(null);
    setBenchmarkResults(null);
    setActiveTable(null);
  }, [file]);

  const runBenchmark = async () => {
    if (!file) return alert("Please upload a CSV file");
    setLoading(true);

    let currentTable = activeTable;

    try {
      if (!currentTable) {
        const formData = new FormData();
        formData.append("file", file);
        const uploadRes = await axios.post(`${API_BASE}/upload`, formData);
        currentTable = uploadRes.data.table_name;
        setActiveTable(currentTable);
      }

      const exactPayload = {
        table_name: currentTable,
        query_type: queryType,
        column: column || null,
        group_by: groupBy || null,
        target_error: 0,
      };

      await axios.post(`${API_BASE}/query`, exactPayload);
      const exactStart = performance.now();
      const exactRes = await axios.post(`${API_BASE}/query`, exactPayload);
      const exactEnd = performance.now();
      const exactValue = extractResultValue(exactRes.data.result);
      const exactTimeMs = exactEnd - exactStart;

      const targetErrors = [0.05, 0.1, 0.25];
      const nextBenchmarkResults = [];

      for (const targetError of targetErrors) {
        const payload = {
          table_name: currentTable,
          query_type: queryType,
          column: column || null,
          group_by: groupBy || null,
          target_error: targetError,
        };

        await axios.post(`${API_BASE}/query`, payload);
        const tsStart = performance.now();
        const res = await axios.post(`${API_BASE}/query`, payload);
        const tsEnd = performance.now();

        const estimateValue = extractResultValue(res.data.result);
        const errorMargin = extractErrorMargin(res.data.result, res.data.error_margin);
        const errorPercent = calculateErrorPercent({
          approximate: estimateValue,
          exact: exactValue,
          errorMargin,
        });
        const sampleFraction =
          typeof res.data.meta?.sample_fraction === "number"
            ? res.data.meta.sample_fraction
            : 1;

        nextBenchmarkResults.push({
          fraction: sampleFraction,
          approx: typeof estimateValue === "number" ? estimateValue : undefined,
          error_percent: errorPercent,
          time_ms: Math.round(tsEnd - tsStart),
          speedup: calculateSpeedup(exactTimeMs, tsEnd - tsStart),
        });
      }

      setBenchmarkResults({ benchmark: nextBenchmarkResults });
      setResults(null);
    } catch (error: unknown) {
      toast.error(getApiErrorMessage(error, "Benchmark failed."));
    } finally {
      setLoading(false);
    }
  };

  const runQuery = async () => {
    if (!file) return alert("Please upload a CSV file");
    setLoading(true);
    let currentTable = activeTable;

    try {
      if (!currentTable) {
        const formData = new FormData();
        formData.append("file", file);
        const uploadRes = await axios.post(`${API_BASE}/upload`, formData);
        currentTable = uploadRes.data.table_name;
        setActiveTable(currentTable);
      }

      const targetError = (100 - accuracyLevel) / 100;

      const payload = {
        table_name: currentTable,
        query_type: queryType,
        column: column || null,
        group_by: groupBy || null,
        target_error: targetError,
      };

      const exactPayload = {
        table_name: currentTable,
        query_type: queryType,
        column: column || null,
        group_by: groupBy || null,
        target_error: 0,
      };

      await axios.post(`${API_BASE}/query`, payload);
      await axios.post(`${API_BASE}/query`, exactPayload);

      const approxStart = performance.now();
      const res = await axios.post(`${API_BASE}/query`, payload);
      const approxEnd = performance.now();

      const exactStart = performance.now();
      const exactRes = await axios.post(`${API_BASE}/query`, exactPayload);
      const exactEnd = performance.now();

      const estimateValue = extractResultValue(res.data.result);
      const exactValue = extractResultValue(exactRes.data.result);
      const errorMargin = extractErrorMargin(res.data.result, res.data.error_margin);
      const confidenceLevel =
        typeof res.data.confidence === "number"
          ? res.data.confidence
          : typeof res.data.result?.confidence === "number"
            ? res.data.result.confidence
            : null;
      const sampleFraction =
        typeof res.data.meta?.sample_fraction === "number"
          ? res.data.meta.sample_fraction
          : 1;
      const approximationNote = buildApproximationNote(res.data.mode, sampleFraction, queryType);
      const errorPercent = calculateErrorPercent({
        approximate: estimateValue,
        exact: exactValue,
        errorMargin,
      });

      const mappedResult: QueryResult = {
        query: {
          type: res.data.meta?.query_type || queryType,
          column,
          group_by: res.data.meta?.group_by || "",
          accuracy_target: accuracyLevel,
          approximation_note: approximationNote,
        },
        approximate: {
          value: estimateValue,
          time_ms: Math.round(approxEnd - approxStart),
          mode: res.data.mode,
        },
        exact: {
          value: exactValue,
          time_ms: Math.round(exactEnd - exactStart),
          mode: exactRes.data.mode,
        },
        metrics: {
          error_percent: errorPercent,
          speedup: calculateSpeedup(exactEnd - exactStart, approxEnd - approxStart),
          fraction_used: sampleFraction,
          confidence_level: confidenceLevel,
        },
      };

      setResults(mappedResult);
      setBenchmarkResults(null);

      setQueryHistory((prev) => [
        ...prev,
        {
          type: queryType,
          column,
          group_by: groupBy,
          accuracy: accuracyLevel,
          result: mappedResult,
          timestamp: new Date(),
        },
      ]);
    } catch (error: unknown) {
      toast.error(getApiErrorMessage(error, "Make sure the backend API is running."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "var(--surface)" }}>
      <Sidebar activeView={activeView} setActiveView={setActiveView} />
      <main className="flex-1 overflow-y-auto" style={{ background: "var(--surface)" }}>
        {activeView === "dashboard" && (
          <DashboardView
            results={results}
            benchmarkResults={benchmarkResults}
            queryHistory={queryHistory}
            systemStats={systemStats}
          />
        )}

        {activeView === "workbench" && (
          <QueryWorkbenchView
            file={file}
            setFile={setFile}
            queryType={queryType}
            setQueryType={setQueryType}
            column={column}
            setColumn={setColumn}
            groupBy={groupBy}
            setGroupBy={setGroupBy}
            accuracyLevel={accuracyLevel}
            setAccuracyLevel={setAccuracyLevel}
            results={results}
            loading={loading}
            benchmarkResults={benchmarkResults}
            runQuery={runQuery}
            runBenchmark={runBenchmark}
          />
        )}

        {activeView === "comparison" && (
          <ComparisonView
            results={results}
            benchmarkResults={benchmarkResults}
            queryHistory={queryHistory}
          />
        )}

        {activeView === "configuration" && <ConfigurationView />}
      </main>
    </div>
  );
}
