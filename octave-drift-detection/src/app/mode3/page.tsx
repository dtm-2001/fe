"use client";

import { useEffect, useState } from "react";
import Head from "next/head";
import D3ConfusionMatrix from "../../components/D3ConfusionMatrix";
import { AlertCircle, AlertTriangle, CheckCircle, RefreshCw, Info } from "lucide-react";
import { Chart, registerables } from "chart.js";
import {
  fetchData,
  type KPI,
  type PlotDataPoint,
  type TableDataPoint,
} from "../../services/backendService2";
import ReactMarkdown from "react-markdown";

Chart.register(...registerables);

interface DetailedMetric {
  total_samples: number;
  correct_predictions: { count: number; percentage: number };
  incorrect_predictions: { count: number; percentage: number };
  misclassifications: Record<string, { count: number; percentage: number }>;
}

export default function Mode3Page() {
  // --- FILTER STATES ---
  const [businessUnit, setBusinessUnit] = useState<string>("");
  const [useCase, setUseCase] = useState<string>("");
  const [shortCode, setShortCode] = useState<string>("");
  const [alertKeeperValue, setAlertKeeperValue] = useState<string>("");
  const [runtimeValue, setRuntimeValue] = useState<number>(1);

  // --- CORE DATA STATES ---
  const [kpis, setKpis] = useState<KPI[]>([]);
  const [errors, setErrors] = useState<{ plotData: PlotDataPoint[]; tableData: TableDataPoint[] }>({
    plotData: [],
    tableData: [],
  });
  const [referenceMatrix, setReferenceMatrix] = useState<number[][]>([]);
  const [currentMatrix, setCurrentMatrix] = useState<number[][]>([]);
  const [detailedMetrics, setDetailedMetrics] = useState<Record<string, DetailedMetric>>({});
  const [xaiExplanation, setXaiExplanation] = useState<string>("No explanation available");
  const [backendError, setBackendError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // --- CLASS ACCURACY STATE ---
  const [selectedClass, setSelectedClass] = useState<string>("");

  // --- HELPERS ---
  const makeLabels = (n: number) => Array.from({ length: n }, (_, i) => i.toString());
  const computeSquareSize = (grid: number[][]) => {
    const maxPx = 300;
    const rows = grid.length, cols = grid[0]?.length || 0;
    if (!rows || !cols) return maxPx;
    const cellSize = Math.min(maxPx / rows, maxPx / cols);
    return Math.max(rows, cols) * cellSize;
  };
  const getStatusIcon = (s?: string) => {
    if (!s) return <Info className="h-5 w-5 text-gray-400" />;
    switch (s.toLowerCase()) {
      case "warning": return <AlertTriangle className="h-5 w-5 text-amber-400" />;
      case "error":   return <AlertCircle   className="h-5 w-5 text-rose-500" />;
      case "success": return <CheckCircle    className="h-5 w-5 text-emerald-400" />;
      default:        return <Info           className="h-5 w-5 text-sky-400" />;
    }
  };
  const getStatusColor = (s?: string) => {
    if (!s) return "text-gray-400";
    switch (s.toLowerCase()) {
      case "warning": return "text-amber-400";
      case "error":   return "text-rose-500";
      case "success": return "text-emerald-400";
      default:        return "text-sky-400";
    }
  };

  // --- FETCH DATA ---
  const initData = async () => {
    setLoading(true);
    setBackendError(null);
    try {
      const {
        kpis: fetchedKpis,
        errors: fetchedErrors,
        referenceMatrix: fetchedRefM,
        currentMatrix: fetchedCurrM,
        detailedMetrics: fetchedDetailed,
        xaiExplanation: fetchedXai,
      } = await fetchData();

      setKpis(fetchedKpis);
      setErrors(fetchedErrors);
      setReferenceMatrix(fetchedRefM);
      setCurrentMatrix(fetchedCurrM);
      setDetailedMetrics(fetchedDetailed);
      setXaiExplanation(fetchedXai);

      const classes = Object.keys(fetchedDetailed);
      if (classes.length) setSelectedClass(classes[0]);
    } catch (err) {
      console.error(err);
      setBackendError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { initData(); }, []);

  // --- CHART RENDERING WITH DESTROY LOGIC ---
  useEffect(() => {
    if (loading) return;

    // Full status distribution
    const pieCanvas = document.getElementById("statusPieChart") as HTMLCanvasElement;
    if (pieCanvas) {
      const existing = Chart.getChart(pieCanvas);
      if (existing) existing.destroy();
      new Chart(pieCanvas, {
        type: "pie",
        data: {
          labels: ["Good", "Warning", "Error"],
          datasets: [{
            data: [
              kpis.filter(k => k.status === "success").length,
              kpis.filter(k => k.status === "warning").length,
              kpis.filter(k => k.status === "error").length,
            ],
            backgroundColor: [
              "rgba(52, 211, 153, 0.8)",
              "rgba(251, 191, 36, 0.8)",
              "rgba(239,  68, 68, 0.8)",
            ],
            borderColor: [
              "rgba(52, 211, 153, 1)",
              "rgba(251, 191, 36, 1)",
              "rgba(239,  68, 68, 1)",
            ],
            borderWidth: 1,
          }],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: "right",
              labels: {
                color: "#e5e7eb",
                font: { size: 14 },
                generateLabels: chart =>
                  chart.data.labels!.map((label, i) => ({
                    text: `${label}: ${chart.data.datasets![0].data[i]} pts`,
                    fillStyle: chart.data.datasets![0].backgroundColor![i] as string,
                    strokeStyle: chart.data.datasets![0].borderColor![i] as string,
                    lineWidth: 1,
                    hidden: false,
                    index: i,
                  })),
              },
            },
            tooltip: {
              callbacks: {
                label: ctx => `${ctx.label}: ${ctx.raw}`,
              },
            },
          },
        },
      });
    }

    // Per-class Correct vs Incorrect
    const classCanvas = document.getElementById("classAccuracyChart") as HTMLCanvasElement;
    if (classCanvas && selectedClass) {
      const existing2 = Chart.getChart(classCanvas);
      if (existing2) existing2.destroy();

      const dm = detailedMetrics[selectedClass];
      new Chart(classCanvas, {
        type: "pie",
        data: {
          labels: ["Correct", "Incorrect"],
          datasets: [{
            data: [dm.correct_predictions.count, dm.incorrect_predictions.count],
            backgroundColor: ["rgba(52,211,153,0.8)", "rgba(239,68,68,0.8)"],
            borderColor:   ["rgba(52,211,153,1)",   "rgba(239,68,68,1)"],
            borderWidth: 1,
          }],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: "right",
              labels: {
                color: "#e5e7eb",
                font: { size: 14 },
                generateLabels: chart =>
                  chart.data.labels!.map((label, i) => ({
                    text: `${label}: ${chart.data.datasets![0].data[i]}`,
                    fillStyle: chart.data.datasets![0].backgroundColor![i] as string,
                    strokeStyle: chart.data.datasets![0].borderColor![i] as string,
                    lineWidth: 1,
                    hidden: false,
                    index: i,
                  })),
              },
            },
          },
        },
      });
    }
  }, [loading, selectedClass, detailedMetrics, kpis]);

  return (
    <div className="bg-gradient-to-b from-gray-950 to-gray-900 min-h-screen">
      <Head><title>Mode 3 | CL Dashboard</title></Head>
      <main className="container mx-auto px-4 py-8">
        {/* Backend Error */}
        {backendError && (
          <div className="bg-rose-950/40 border border-rose-800/60 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-rose-400 mr-2" />
              <p className="text-rose-300 font-medium">{backendError}</p>
            </div>
            <button
              onClick={initData}
              className="mt-2 inline-flex items-center gap-2 px-4 py-2 bg-rose-800/50 text-white rounded text-sm"
            >
              <RefreshCw className="h-4 w-4" /> Retry
            </button>
          </div>
        )}

        {/* Header & Refresh */}
        <div className="flex flex-col md:flex-row justify-between mb-6">
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-sky-600">
            OCTAVE – CL Dashboard
          </h1>
          <button
            onClick={initData}
            className="mt-4 md:mt-0 inline-flex items-center gap-2 px-4 py-2 bg-sky-800/40 text-white rounded"
          >
            <RefreshCw className="h-4 w-4" /> Refresh
          </button>
        </div>

        {/* Top Filters & Runtime */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
          <div className="lg:col-span-2 bg-gradient-to-br from-sky-950/40 to-sky-900/20 p-6 rounded border border-sky-800/30">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-sky-300">Business Unit:</p>
                <p className="text-lg text-white">{loading ? "Loading…" : businessUnit || "N/A"}</p>
                <p className="mt-4 text-sm text-sky-300">Use Case:</p>
                <p className="text-lg text-white">{loading ? "Loading…" : useCase || "N/A"}</p>
              </div>
              <div>
                <p className="text-sm text-sky-300">Short Code:</p>
                <p className="text-lg text-white">{loading ? "Loading…" : shortCode || "N/A"}</p>
                <p className="mt-4 text-sm text-sky-300">Alert Keeper:</p>
                <p className="text-lg text-white">{loading ? "Loading…" : alertKeeperValue || "N/A"}</p>
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-sky-950/40 to-sky-900/20 p-6 rounded border border-sky-800/30">
            <p className="text-sm text-sky-300">Runtime</p>
            <select
              className="mt-1 w-full bg-gray-800/80 border border-sky-700/50 rounded p-2 text-white"
              value={runtimeValue}
              onChange={e => setRuntimeValue(Number(e.target.value))}
            >
              {[1,2,3,4].map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
        </div>

        {/* Confusion Matrices */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {[
            { title: "Reference Matrix", grid: referenceMatrix },
            { title: "Current Matrix",   grid: currentMatrix   },
          ].map(({ title, grid }, idx) => {
            const side = computeSquareSize(grid);
            return (
              <div key={idx} className="bg-gray-900/80 p-6 rounded border border-gray-700/50 text-center">
                <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-sky-600 mb-4">
                  {title}
                </h2>
                {!loading && grid.length ? (
                  <div style={{ width: side + 40, height: side + 40 }} className="mx-auto">
                    <D3ConfusionMatrix data={grid} labels={makeLabels(grid[0].length)} width={side} height={side} />
                  </div>
                ) : (
                  <div className="flex justify-center items-center h-48">
                    <RefreshCw className="animate-spin h-8 w-8 text-sky-500" />
                  </div>
                )}
              </div>
            );
          })}

          {/* Per-Class Accuracy */}
          <div className="bg-gradient-to-br from-sky-950/40 to-sky-900/20 p-6 rounded border border-sky-800/30">
            <p className="text-sm text-sky-300 mb-2">Select Class:</p>
            <select
              className="w-full bg-gray-800/80 border border-sky-700/50 rounded p-2 mb-4 text-white"
              value={selectedClass}
              onChange={e => setSelectedClass(e.target.value)}
            >
              {Object.keys(detailedMetrics).map(cls => (
                <option key={cls} value={cls}>{cls}</option>
              ))}
            </select>
            <div className="h-48">
              <canvas id="classAccuracyChart"></canvas>
            </div>
          </div>
        </div>

        {/* Detailed Metrics Table */}
        <div className="bg-gray-900/80 p-6 rounded border border-gray-700/50 mb-6 overflow-x-auto">
          <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-sky-600 mb-4">
            Detailed Metrics by Class
          </h2>
          {loading ? (
            <div className="flex justify-center py-12">
              <RefreshCw className="animate-spin h-8 w-8 text-sky-500" />
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-700/50">
              <thead className="bg-gray-800/60">
                <tr>
                  <th className="px-4 py-2 text-sky-300 text-left">Class</th>
                  <th className="px-4 py-2 text-sky-300 text-left">Total</th>
                  <th className="px-4 py-2 text-sky-300 text-left">Correct</th>
                  <th className="px-4 py-2 text-sky-300 text-left">Incorrect</th>
                  <th className="px-4 py-2 text-sky-300 text-left">Misclassifications</th>
                </tr>
              </thead>
              <tbody className="bg-gray-800/30 divide-y divide-gray-700/50">
                {Object.entries(detailedMetrics).map(([cls, dm]) => (
                  <tr key={cls} className="hover:bg-gray-700/30">
                    <td className="px-4 py-2 text-white">{cls}</td>
                    <td className="px-4 py-2">{dm.total_samples}</td>
                    <td className="px-4 py-2 text-emerald-400">
                      {dm.correct_predictions.count} ({dm.correct_predictions.percentage.toFixed(1)}%)
                    </td>
                    <td className="px-4 py-2 text-rose-400">
                      {dm.incorrect_predictions.count} ({dm.incorrect_predictions.percentage.toFixed(1)}%)
                    </td>
                    <td className="px-4 py-2 text-gray-300">
                      {Object.entries(dm.misclassifications)
                        .map(([p, m]) => `${p}: ${m.count} (${m.percentage.toFixed(1)}%)`)
                        .join(", ")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* KPI Section */}
        <div className="bg-gray-900/80 p-6 rounded border border-gray-700/50 mb-6">
          <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-sky-600 mb-4">
            Key Performance Indicators
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {kpis.map(kpi => (
              <div key={kpi.rowKey} className="bg-gradient-to-br from-sky-950/40 to-sky-900/20 p-4 rounded border border-sky-800/30">
                <p className="text-sky-300">{kpi.rowKey}</p>
                <div className="flex items-center mt-2">
                  <div className="w-8 h-8 flex items-center justify-center mr-2">
                    {getStatusIcon(kpi.status)}
                  </div>
                  <p className={`text-xl font-semibold ${getStatusColor(kpi.status)}`}>
                    {loading ? "…" : kpi.value}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* XAI Result */}
        <div className="bg-gray-900/80 p-6 rounded border border-gray-700/50 mb-6">
          <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-sky-600 mb-4">
            XAI Result
          </h2>
          {loading ? (
            <div className="flex justify-center py-8">
              <RefreshCw className="animate-spin h-8 w-8 text-sky-500" />
            </div>
          ) : (
            <div className="prose prose-invert prose-sky">
              <ReactMarkdown>{xaiExplanation}</ReactMarkdown>
            </div>
          )}
        </div>

        {/* Misclassified Table */}
        <div className="bg-gray-900/80 p-6 rounded border border-gray-700/50 max-h-96 overflow-y-auto">
          <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-sky-600 mb-4">
            Misclassified Table
          </h2>
          {loading ? (
            <div className="flex justify-center py-12">
              <RefreshCw className="animate-spin h-8 w-8 text-sky-500" />
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-700/50">
              <thead className="bg-gray-800/60">
                <tr>
                  <th className="px-4 py-2 text-sky-300 text-left">ID</th>
                  <th className="px-4 py-2 text-sky-300 text-left">True → Pred</th>
                </tr>
              </thead>
              <tbody className="bg-gray-800/30 divide-y divide-gray-700/50">
                {errors.tableData.length ? (
                  errors.tableData.map((r, i) => (
                    <tr key={i} className="hover:bg-rose-900/20">
                      <td className="px-4 py-2 text-white">{r.id}</td>
                      <td className="px-4 py-2 text-rose-300">{r.timePeriod}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={2} className="px-4 py-2 text-gray-400 text-center">
                      No misclassified data
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </main>
    </div>
  );
}
