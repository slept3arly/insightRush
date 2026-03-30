"use client";

import { useState } from "react";
import axios from "axios";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ShieldAlert, ShieldCheck, Zap, Database, Clock, Upload, ListFilter, BarChart as BarChartIcon } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from "recharts";

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [queryType, setQueryType] = useState("COUNT");
  const [column, setColumn] = useState("");
  const [accuracyLevel, setAccuracyLevel] = useState([10]); // Slider uses array
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const runQuery = async () => {
    if (!file) return alert("Please upload a CSV file");
    setLoading(true);
    
    const formData = new FormData();
    formData.append("file", file);
    formData.append("fraction", (accuracyLevel[0] / 100).toString());
    formData.append("query_type", queryType);
    if (column) formData.append("column", column);

    try {
      const res = await axios.post("http://localhost:8000/query", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      setResults(res.data);
    } catch (error) {
      console.error("Error executing query", error);
      alert("Failed to run query. Make sure the backend API is running.");
    }
    setLoading(false);
  };

  const chartData = results ? [
    {
      name: "Execution Time",
      Exact: Number(results.exact.time_ms.toFixed(2)),
      Approximate: Number(results.approximate.time_ms.toFixed(2)),
    }
  ] : [];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight flex items-center gap-3">
              <Zap className="text-amber-500 h-8 w-8" />
              InsightRush AQP
            </h1>
            <p className="text-slate-500 text-lg mt-2 font-medium">Approximate Query Processing Engine</p>
          </div>
          <Badge variant="outline" className="text-sm px-4 py-1 bg-white shadow-sm border-slate-200">
            Speed vs 100% Accuracy
          </Badge>
        </div>

        <Tabs defaultValue="query" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="query">Query Dashboard</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>
          
          <TabsContent value="query">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              
              {/* Configuration Panel */}
              <div className="lg:col-span-4 space-y-6">
                <Card className="shadow-lg border-0">
                  <CardHeader className="bg-slate-100/50 pb-4 border-b">
                    <CardTitle className="flex items-center gap-2">
                      <Database className="h-5 w-5 text-indigo-500" />
                      Dataset & Query
                    </CardTitle>
                    <CardDescription>Configure your analytical task</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-6 space-y-6">
                    
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2"><Upload className="h-4 w-4" /> Upload CSV Dataset</Label>
                      <Input 
                        type="file" 
                        accept=".csv"
                        onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)}
                        className="cursor-pointer bg-white file:bg-slate-100 file:border-0 file:rounded-md file:px-4 file:py-1 file:mr-4 file:text-slate-700 hover:file:bg-slate-200"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="flex items-center gap-2"><ListFilter className="h-4 w-4" /> Query Type</Label>
                      <Select value={queryType} onValueChange={(val) => setQueryType(val || "COUNT")}>
                        <SelectTrigger className="w-full bg-white">
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="COUNT">COUNT</SelectItem>
                          <SelectItem value="SUM">SUM</SelectItem>
                          <SelectItem value="AVG">AVG</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Target Column <span className="text-slate-400 text-xs font-normal">(for SUM/AVG)</span></Label>
                      <Input 
                        placeholder="e.g. amount, price..."
                        value={column}
                        onChange={(e) => setColumn(e.target.value)}
                        disabled={queryType === "COUNT"}
                        className="bg-white"
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card className="shadow-lg border-0">
                  <CardHeader className="bg-slate-100/50 pb-4 border-b">
                    <CardTitle className="flex items-center gap-2">
                      <ShieldAlert className="h-5 w-5 text-amber-500" />
                      Accuracy Target
                    </CardTitle>
                    <CardDescription>Set sampling fraction</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-6 space-y-6">
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <Label>Sample Size (%)</Label>
                        <Badge variant="secondary" className="font-mono text-sm bg-slate-100">{accuracyLevel[0]}%</Badge>
                      </div>
                      <Slider 
                        defaultValue={[10]} 
                        max={100} 
                        min={1} 
                        step={1}
                        value={accuracyLevel}
                        onValueChange={setAccuracyLevel}
                        className="py-4 cursor-pointer"
                      />
                      <p className="text-xs text-slate-500 leading-tight">
                        Lower percentages provide exponentially faster results by estimating totals based on a random sample.
                      </p>
                    </div>
                  </CardContent>
                  <CardFooter className="pt-0">
                    <Button 
                      onClick={runQuery} 
                      disabled={loading || !file}
                      className="w-full h-12 text-md font-semibold bg-indigo-600 hover:bg-indigo-700 transition"
                    >
                      {loading ? (
                        <div className="flex items-center gap-2">
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Processing...
                        </div>
                      ) : "Run Query Comparison"}
                    </Button>
                  </CardFooter>
                </Card>
              </div>

              {/* Results Panel */}
              <div className="lg:col-span-8 space-y-6">
                
                {/* Result Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* Approximate Card */}
                  <Card className="shadow-lg border-2 border-emerald-100 bg-emerald-50/20 relative overflow-hidden transition-all duration-500">
                    {results?.speedup > 1 && (
                      <div className="absolute top-4 right-4 bg-emerald-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-sm flex items-center gap-1">
                        <Zap className="h-3 w-3 fill-white" />
                        {results.speedup.toFixed(1)}x Faster
                      </div>
                    )}
                    <CardHeader>
                      <CardTitle className="text-emerald-700 flex items-center gap-2">
                        <ShieldAlert className="h-5 w-5" />
                        Approximate Engine
                      </CardTitle>
                      <CardDescription>Using {accuracyLevel[0]}% sampled data</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {results ? (
                        <div className="space-y-4">
                          <div>
                            <div className="text-sm text-slate-500 font-medium mb-1">Estimated Value</div>
                            <div className="text-5xl font-black text-slate-800 tracking-tight">
                              ~{Number(results.approximate.value).toLocaleString(undefined, {maximumFractionDigits: 2})}
                            </div>
                          </div>
                          
                          <div className="bg-white/60 p-3 rounded-lg border border-emerald-100 flex items-center justify-between">
                            <span className="flex items-center gap-2 text-slate-600 text-sm font-medium">
                              <Clock className="w-4 h-4" /> Execution Time
                            </span>
                            <span className="font-mono font-bold text-emerald-600">
                              {results.approximate.time_ms.toFixed(3)} ms
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="h-[120px] flex items-center justify-center text-slate-400 italic">
                          Awaiting execution...
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Exact Card */}
                  <Card className="shadow-lg border-2 border-rose-100 bg-rose-50/20">
                    <CardHeader>
                      <CardTitle className="text-rose-700 flex items-center gap-2">
                        <ShieldCheck className="h-5 w-5" />
                        Exact Engine
                      </CardTitle>
                      <CardDescription>Scanning 100% of data</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {results ? (
                         <div className="space-y-4">
                         <div>
                           <div className="text-sm text-slate-500 font-medium mb-1">True Value</div>
                           <div className="text-5xl font-black text-slate-800 tracking-tight">
                             {Number(results.exact.value).toLocaleString(undefined, {maximumFractionDigits: 2})}
                           </div>
                         </div>
                         
                         <div className="bg-white/60 p-3 rounded-lg border border-rose-100 flex items-center justify-between">
                           <span className="flex items-center gap-2 text-slate-600 text-sm font-medium">
                             <Clock className="w-4 h-4" /> Execution Time
                           </span>
                           <span className="font-mono font-bold text-rose-600">
                             {results.exact.time_ms.toFixed(3)} ms
                           </span>
                         </div>
                       </div>
                      ) : (
                        <div className="h-[120px] flex items-center justify-center text-slate-400 italic">
                          Awaiting execution...
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Performance Chart */}
                <Card className="shadow-lg border-0 h-96">
                  <CardHeader>
                    <CardTitle className="text-slate-700">Performance Benchmark</CardTitle>
                    <CardDescription>Time required to process the query (lower is better)</CardDescription>
                  </CardHeader>
                  <CardContent className="h-72">
                    {results ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={chartData}
                          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.5} />
                          <XAxis dataKey="name" axisLine={false} tickLine={false} />
                          <YAxis 
                            axisLine={false} 
                            tickLine={false} 
                            tickFormatter={(value) => `${value}ms`}
                            width={80}
                          />
                          <Tooltip 
                            cursor={{fill: 'rgba(0,0,0,0.05)'}}
                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                            formatter={(value: number) => [`${value} ms`]}
                          />
                          <Legend wrapperStyle={{ paddingTop: '20px' }} />
                          <Bar dataKey="Exact" fill="#f43f5e" radius={[4, 4, 0, 0]} maxBarSize={80} />
                          <Bar dataKey="Approximate" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={80} />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="w-[100%] h-full flex items-center justify-center border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                        <p className="text-slate-400 font-medium font-sm flex items-center gap-2">
                          <BarChartIcon className="h-5 w-5 opacity-50" />
                          Run a query to view performance metrics
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>

              </div>
            </div>
          </TabsContent>
          <TabsContent value="history">
            <Card className="shadow-lg border-0">
              <CardHeader>
                <CardTitle className="text-slate-700">Query History</CardTitle>
                <CardDescription>Previous executions and their benchmarks.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center text-slate-400 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                  <p>History feature coming soon!</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
