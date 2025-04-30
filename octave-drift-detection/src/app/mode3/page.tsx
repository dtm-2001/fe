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
  // --- FILTER STATES (for dashboard) ---
  const [businessUnit, setBusinessUnit] = useState<string>("");
  const [useCase, setUseCase] = useState<string>("");
  const [shortCode, setShortCode] = useState<string>("");
  const [alertKeeperValue, setAlertKeeperValue] = useState<string>("");
  const [runtimeValue, setRuntimeValue] = useState<number>(1);

  // Stubbed keeper list (or fetch from your backend)
  const [availableAlertKeepers] = useState<string[]>(["KeeperA", "KeeperB", "KeeperC"]);

  // Map business → use-cases
  const useCases: Record<string, string[]> = {
    CCS: ["CC-Di", "CC-MT"],
    JMSL: ["JM-Ch"],
  };

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
  const [currentPeriod, setCurrentPeriod] = useState<string>("N/A");
  const [outletsExceedingThresholdCount, setOutletsExceedingThresholdCount] = useState<number>(0);

  // --- STATUS DISTRIBUTION FOR PIE CHART (placeholder) ---
  const [statusDistribution, setStatusDistribution] = useState({
    good: 65,
    warning: 25,
    error: 10,
  });

  // --- HELPERS FOR FUN ---
  const makeLabels = (n: number) => Array.from({ length: n }, (_, i) => i.toString());
  const computeSquareSize = (grid: number[][]) => {
    const maxPx = 300;
    const rows = grid.length;
    const cols = grid[0]?.length || 0;
    if (!rows || !cols) return maxPx;
    const cellSize = Math.min(maxPx / rows, maxPx / cols);
    return Math.max(rows, cols) * cellSize;
  };
  const getStatusColor = (s?: string) => {
    if (!s) return "text-gray-400";
    switch (s.toLowerCase()) {
      case "warning":
        return "text-amber-400";
      case "error":
        return "text-rose-500";
      case "success":
        return "text-emerald-400";
      default:
        return "text-sky-400";
    }
  };
  const getStatusIcon = (s?: string) => {
    if (!s) return <Info className="h-5 w-5 text-gray-400" />;
    switch (s.toLowerCase()) {
      case "warning":
        return <AlertTriangle className="h-5 w-5 text-amber-400" />;
      case "error":
        return <AlertCircle className="h-5 w-5 text-rose-500" />;
      case "success":
        return <CheckCircle className="h-5 w-5 text-emerald-400" />;
      default:
        return <Info className="h-5 w-5 text-sky-400" />;
    }
  };

  // --- FETCHING ---
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
        currentPeriod: fetchedPeriod,
        outletsExceedingThresholdCount: fetchedCount,
      } = await fetchData();

      // If your backend returns the dashboard values, set them here:
      // setBusinessUnit(fetchedBusinessUnit)
      // setUseCase(fetchedUseCase)
      // setShortCode(fetchedShortCode)
      // setAlertKeeperValue(fetchedAlertKeeper)

      setKpis(fetchedKpis);
      setErrors(fetchedErrors);
      setReferenceMatrix(fetchedRefM);
      setCurrentMatrix(fetchedCurrM);
      setDetailedMetrics(fetchedDetailed);
      setXaiExplanation(fetchedXai);
      setCurrentPeriod(fetchedPeriod);
      setOutletsExceedingThresholdCount(fetchedCount);

      // (Optionally) recalc statusDistribution here from your new data...
    } catch (err) {
      console.error(err);
      setBackendError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    initData();
  }, []);

  // --- RENDER PIE CHART WHEN READY ---
  useEffect(() => {
    if (loading) return;
    const ctx = document.getElementById("statusPieChart") as HTMLCanvasElement;
    if (!ctx) return;
    new Chart(ctx, {
      type: "pie",
      data: {
        labels: ["Good", "Warning", "Error"],
        datasets: [
          {
            data: [
              statusDistribution.good,
              statusDistribution.warning,
              statusDistribution.error,
            ],
            backgroundColor: [
              "rgba(52, 211, 153, 0.8)",
              "rgba(251, 191, 36, 0.8)",
              "rgba(239, 68, 68, 0.8)",
            ],
            borderColor: [
              "rgba(52, 211, 153, 1)",
              "rgba(251, 191, 36, 1)",
              "rgba(239, 68, 68, 1)",
            ],
            borderWidth: 1,
          },
        ],
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
              generateLabels: (chart) =>
                chart.data.labels!.map((label, i) => ({
                  text: `${label}: ${chart.data.datasets![0].data[i]}%`,
                  fillStyle:
                    chart.data.datasets![0].backgroundColor![i] as string,
                  strokeStyle:
                    chart.data.datasets![0].borderColor![i] as string,
                  lineWidth: 1,
                  hidden: false,
                  index: i,
                })),
            },
          },
          tooltip: {
            callbacks: {
              label: (ctx) => `${ctx.label}: ${ctx.raw}%`,
            },
          },
        },
      },
    });
  }, [loading, statusDistribution]);

  // --- HANDLERS for selects (if you ever re-enable editing) ---
  const handleBusinessUnitChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setBusinessUnit(e.target.value);
    setUseCase("");
    setShortCode("");
  };
  const handleUseCaseChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setUseCase(e.target.value);
    setShortCode("");
  };
  const handleShortCodeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setShortCode(e.target.value);
  };
  const handleRuntimeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setRuntimeValue(Number(e.target.value));
  };
  const handleAlertKeeperChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setAlertKeeperValue(e.target.value);
  };

  return (
    <div className="bg-gradient-to-b from-gray-950 to-gray-900 min-h-screen flex flex-col">
      <Head>
        <title>Mode 3 | CL Dashboard</title>
      </Head>
      <main className="flex-grow container mx-auto px-4 py-8">
        {/* Backend Error */}
        {backendError && (
          <div className="bg-rose-950/40 border border-rose-800/60 rounded-lg p-4 mb-6 backdrop-blur-sm shadow-lg">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-rose-400 mr-2" />
              <h3 className="text-lg font-medium text-rose-300">Backend Error</h3>
            </div>
            <p className="mt-2 text-rose-200">{backendError}</p>
            <button
              onClick={initData}
              className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-rose-800/50 hover:bg-rose-700/70 text-white rounded-md text-sm transition"
            >
              <RefreshCw className="h-4 w-4" /> Retry
            </button>
          </div>
        )}

        {/* Header */}
        <div className="flex flex-col md:flex-row md:justify-between mb-6">
          <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-sky-600 mb-4 md:mb-0">
            OCTAVE – CL Dashboard
          </h2>
          <button
            onClick={initData}
            className="inline-flex items-center gap-2 px-4 py-2 bg-sky-800/40 hover:bg-sky-700/60 text-white rounded-md text-sm transition"
          >
            <RefreshCw className="h-4 w-4" /> Refresh
          </button>
        </div>

        {/* Mode-1-Style Dashboard */}
        <div className="bg-gray-900/80 rounded-xl shadow-xl p-6 mb-6 border border-gray-700/50 backdrop-blur-sm">
          {/* Static Filters Box */}
          <div className="bg-gradient-to-br from-sky-950/40 to-sky-900/20 p-6 rounded-lg border border-sky-800/30 shadow-md mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-medium text-sky-300 mb-2">
                  Business Unit
                </h3>
                <ul className="list-disc list-inside text-sky-200 mb-4">
                  <li>
                    {loading ? "Loading…" : businessUnit || "Not Selected"}
                  </li>
                </ul>
                <h3 className="text-lg font-medium text-sky-300 mb-2">
                  Use Case
                </h3>
                <ul className="list-disc list-inside text-sky-200">
                  <li>
                    {loading ? "Loading…" : useCase || "Not Selected"}
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-medium text-sky-300 mb-2">
                  Short Code
                </h3>
                <ul className="list-disc list-inside text-sky-200 mb-4">
                  <li>
                    {loading ? "Loading…" : shortCode || "Not Available"}
                  </li>
                </ul>
                <h3 className="text-lg font-medium text-sky-300 mb-2">
                  Alert Keeper
                </h3>
                <ul className="list-disc list-inside text-sky-200">
                  <li>
                    {loading
                      ? "Loading…"
                      : alertKeeperValue || "Not Selected"}
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Runtime & Status Distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Runtime */}
            <div className="lg:col-span-2 bg-gradient-to-br from-sky-950/40 to-sky-900/20 p-6 rounded-lg border border-sky-800/30 shadow-md">
              <h3 className="text-lg font-medium text-sky-300 mb-2">
                Runtime
              </h3>
              <select
                className="w-full bg-gray-800/80 border border-sky-700/50 rounded-md p-2 text-white focus:ring-2 focus:ring-sky-500"
                value={runtimeValue}
                onChange={handleRuntimeChange}
              >
                {[1, 2, 3, 4].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </div>
            {/* Status Distribution */}
            <div className="bg-gradient-to-br from-sky-950/40 to-sky-900/20 p-6 rounded-lg border border-sky-800/30 shadow-md">
              <h3 className="text-lg font-medium text-sky-300 mb-2">
                Status Distribution
              </h3>
              <div className="h-48">
                <canvas id="statusPieChart"></canvas>
              </div>
            </div>
          </div>
        </div>

        {/* KPI Section */}
        <div className="bg-gray-900/80 rounded-xl shadow-xl overflow-hidden p-6 mb-6 border border-gray-700/50 backdrop-blur-sm">
          <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-sky-600 mb-4">
            Key Performance Indicators
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {kpis.map((kpi) => (
              <div
                key={kpi.rowKey}
                className="bg-gradient-to-br from-sky-950/40 to-sky-900/20 p-4 rounded-lg border border-sky-800/30 shadow-md transition-all duration-300 hover:shadow-sky-900/20 hover:border-sky-700/50"
              >
                <h3 className="text-lg font-medium text-sky-300 mb-2">
                  {kpi.rowKey}
                </h3>
                <div className="flex items-center">
                  <div className="w-10 h-10 rounded-full bg-sky-800/40 flex items-center justify-center mr-3">
                    {getStatusIcon(kpi.status)}
                  </div>
                  <p
                    className={`text-xl font-semibold ${getStatusColor(
                      kpi.status
                    )}`}
                  >
                    {loading ? "Loading..." : kpi.value}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Confusion Matrices */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {[ 
            { title: "Reference Matrix", grid: referenceMatrix },
            { title: "Current Matrix", grid: currentMatrix }
          ].map(({ title, grid }, idx) => {
            const side = computeSquareSize(grid);
            return (
              <div
                key={idx}
                className="bg-gray-900/80 rounded-xl shadow-xl p-6 border border-gray-700/50 backdrop-blur-sm flex flex-col items-center"
              >
                <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-sky-600 mb-4">
                  {title}
                </h2>
                {!loading && grid.length > 0 ? (
                  <div
                    className="bg-gray-800/60 rounded-lg p-4 border border-gray-700/50"
                    style={{ width: side + 40, height: side + 40 }}
                  >
                    <div style={{ width: side, height: side }}>
                      <D3ConfusionMatrix
                        data={grid}
                        labels={makeLabels(grid[0].length)}
                        width={side}
                        height={side}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-64 w-full bg-gray-800/60 rounded-lg border border-gray-700/50">
                    <div className="flex flex-col items-center">
                      <svg
                        className="animate-spin h-8 w-8 text-sky-500 mb-2"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      <div className="text-sky-300">
                        Loading matrix data...
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Detailed Metrics */}
        <div className="bg-gray-900/80 rounded-xl shadow-xl overflow-hidden p-6 mb-6 border border-gray-700/50 backdrop-blur-sm">
          <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-sky-600 mb-4">
            Detailed Metrics by Class
          </h2>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <svg
                className="animate-spin h-8 w-8 text-sky-500 mb-2"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              <div className="text-sky-300">Loading metrics data...</div>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-gray-700/50">
              <table className="min-w-full divide-y divide-gray-700/50">
                <thead className="bg-gray-800/60">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-sky-300 uppercase tracking-wider">
                      Class
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-sky-300 uppercase tracking-wider">
                      Total
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-sky-300 uppercase tracking-wider">
                      Correct
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-sky-300 uppercase tracking-wider">
                      Incorrect
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-sky-300 uppercase tracking-wider">
                      Misclassifications
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-gray-800/30 divide-y divide-gray-700/50">
                  {Object.entries(detailedMetrics).map(([cls, dm]) => (
                    <tr
                      key={cls}
                      className="hover:bg-gray-700/30 transition-colors duration-150"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                        {cls}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        {dm.total_samples}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-emerald-400">
                        {dm.correct_predictions.count}{" "}
                        <span className="text-gray-400">
                          ({dm.correct_predictions.percentage.toFixed(1)}%)
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-rose-400">
                        {dm.incorrect_predictions.count}{" "}
                        <span className="text-gray-400">
                          ({dm.incorrect_predictions.percentage.toFixed(1)}%)
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        {Object.entries(dm.misclassifications)
                          .map(
                            ([p, m]) =>
                              `${p}: ${m.count}${
                                m.percentage > 0
                                  ? ` (${m.percentage.toFixed(1)}%)`
                                  : ""
                              }`
                          )
                          .join(", ")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* XAI Result */}
        <div className="bg-gray-900/80 rounded-xl shadow-xl overflow-hidden p-6 mb-6 border border-gray-700/50 backdrop-blur-sm">
          <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-sky-600 mb-4">
            XAI Result
          </h2>
          <div className="bg-gray-800/60 rounded-lg p-6 border border-gray-700/50">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="animate-spin h-8 w-8 text-sky-500" />
              </div>
            ) : (
              <div className="prose prose-invert prose-sky max-w-none">
                {xaiExplanation ? (
                  <ReactMarkdown>{xaiExplanation}</ReactMarkdown>
                ) : (
                  <div className="flex items-center text-rose-400 gap-2">
                    <AlertCircle className="h-5 w-5" />
                    <p>No explanation available</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Misclassified Table */}
        <div className="bg-gray-900/80 rounded-xl shadow-xl overflow-hidden p-6 border border-gray-700/50 backdrop-blur-sm max-h-96 overflow-y-auto">
          <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-sky-600 mb-4">
            Misclassified Table
          </h2>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="animate-spin h-8 w-8 text-sky-500" />
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-gray-700/50">
              <table className="min-w-full divide-y divide-gray-700/50">
                <thead className="bg-gray-800/60">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-sky-300 uppercase tracking-wider">
                      ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-sky-300 uppercase tracking-wider">
                      True &rarr; Pred
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-gray-800/30 divide-y divide-gray-700/50">
                  {errors.tableData.length > 0 ? (
                    errors.tableData.map((r, i) => (
                      <tr
                        key={i}
                        className="hover:bg-rose-900/20 transition-colors duration-150"
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                          {r.id}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-rose-300">
                          {r.timePeriod}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={2}
                        className="px-6 py-4 text-center text-sm text-gray-400"
                      >
                        No misclassified data
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
