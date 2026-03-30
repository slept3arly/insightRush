"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, LineChart, Line, AreaChart, Area
} from "recharts";
import Sidebar from "@/components/Sidebar";
import DashboardView from "@/components/DashboardView";
import QueryWorkbenchView from "@/components/QueryWorkbenchView";
import ComparisonView from "@/components/ComparisonView";
import ConfigurationView from "@/components/ConfigurationView";
import { QueryResult, BenchmarkResponse, ViewType } from "@/types";



export default function Home() {
  const [activeView, setActiveView] = useState<ViewType>("dashboard");
  const [file, setFile] = useState<File | null>(null);
  const [queryType, setQueryType] = useState("COUNT");
  const [column, setColumn] = useState("");
  const [accuracyLevel, setAccuracyLevel] = useState(10);
  const [results, setResults] = useState<QueryResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [benchmarkResults, setBenchmarkResults] = useState<BenchmarkResponse | null>(null);
  const [queryHistory, setQueryHistory] = useState<Array<{
    type: string; column: string; accuracy: number;
    result: QueryResult; timestamp: Date;
  }>>([]);

  useEffect(() => {
    setResults(null);
    setBenchmarkResults(null);
  }, [file]);

  const runBenchmark = async () => {
    if (!file) return alert("Please upload a CSV file");
    setLoading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("query_type", queryType);
    if (column) formData.append("column", column);
    try {
      const res = await axios.post("http://localhost:8000/benchmark", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      setBenchmarkResults(res.data);
      setResults(null);
    } catch (error: any) {
      alert(error.response?.data?.detail || "Benchmark failed. Is the backend running?");
    } finally {
      setLoading(false);
    }
  };

  const runQuery = async () => {
    if (!file) return alert("Please upload a CSV file");
    setLoading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("accuracy", accuracyLevel.toString());
    formData.append("query_type", queryType);
    if (column) formData.append("column", column);
    try {
      const res = await axios.post("http://localhost:8000/query", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      setResults(res.data);
      setBenchmarkResults(null);
      setQueryHistory(prev => [...prev, {
        type: queryType, column, accuracy: accuracyLevel,
        result: res.data, timestamp: new Date()
      }]);
    } catch (error: any) {
      alert(error.response?.data?.detail || "Make sure the backend API is running.");
    } finally {
      setLoading(false);
    }
  };

  const sharedProps = {
    file, setFile, queryType, setQueryType, column, setColumn,
    accuracyLevel, setAccuracyLevel, results, loading,
    benchmarkResults, runQuery, runBenchmark, queryHistory
  };

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "var(--surface)" }}>
      <Sidebar activeView={activeView} setActiveView={setActiveView} />
      <main className="flex-1 overflow-y-auto" style={{ background: "var(--surface)" }}>
        {activeView === "dashboard" && <DashboardView results={results} benchmarkResults={benchmarkResults} queryHistory={queryHistory} />}
        {activeView === "workbench" && <QueryWorkbenchView 
          file={file} setFile={setFile} queryType={queryType} setQueryType={setQueryType} 
          column={column} setColumn={setColumn} accuracyLevel={accuracyLevel} 
          setAccuracyLevel={setAccuracyLevel} results={results} loading={loading} 
          benchmarkResults={benchmarkResults} runQuery={runQuery} runBenchmark={runBenchmark} 
        />}
        {activeView === "comparison" && <ComparisonView results={results} benchmarkResults={benchmarkResults} queryHistory={queryHistory} />}
        {activeView === "configuration" && <ConfigurationView />}
      </main>
    </div>
  );
}