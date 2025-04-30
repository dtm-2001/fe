"use client"
import type React from "react"
import { useState, useEffect, useMemo } from "react"
import Head from "next/head"
import ReactMarkdown from "react-markdown"
import { Chart, registerables } from "chart.js"
import DriftWarningChart from "./DriftWarningChart"
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Info,
} from "lucide-react"
import {
  fetchData,
  type KPI,
  type PlotDataPoint,
  type TableDataPoint,
  type OutletsExceedingThreshold,
  type Indices,
  type Top10Id,
} from "../../services/backendService1"

Chart.register(...registerables)

export default function Mode2Page(): React.ReactElement {
  // --- STATE HOOKS ---
  const [kpis, setKpis] = useState<KPI[]>([])
  const [errorData, setErrorData] = useState<{
    plotData: PlotDataPoint[]
    tableData: TableDataPoint[]
  }>({ plotData: [], tableData: [] })
  const [top10Ids, setTop10Ids] = useState<Top10Id[]>([])
  const [outletsExceedingThreshold, setOutletsExceedingThreshold] = useState<OutletsExceedingThreshold[]>([])
  const [indices, setIndices] = useState<Indices>({ normal: [], warning: [], drift: [] })
  const [dashboardState, setDashboardState] = useState<string>("Unknown")
  const [coverage, setCoverage] = useState<any>({})
  const [clusters, setClusters] = useState<any>({})
  const [backwardAnalysis, setBackwardAnalysis] = useState<any>({})
  const [currentPeriod, setCurrentPeriod] = useState<string>("N/A")
  const [totalOutlets, setTotalOutlets] = useState<number>(0)
  const [outletsExceedingThresholdCount, setOutletsExceedingThresholdCount] = useState<number>(0)
  const [xaiExplanation, setXaiExplanation] = useState<string>("")
  const [loading, setLoading] = useState<boolean>(true)
  const [backendError, setBackendError] = useState<string | null>(null)
  const [errorPercentageThreshold, setErrorPercentageThreshold] = useState<number>(0)

  // --- FILTER STATES for Dashboard ---
  const [businessUnit, setBusinessUnit] = useState<string>("")
  const [useCase, setUseCase] = useState<string>("")
  const [shortCode, setShortCode] = useState<string>("")
  const [alertKeeperValue, setAlertKeeperValue] = useState<string>("")
  const [runtimeValue, setRuntimeValue] = useState<number>(1)

  // Status distribution for pie chart
  const [statusDistribution, setStatusDistribution] = useState({
    good: 65,
    warning: 25,
    error: 10,
  })

  // Map business → use-cases (if you still fetch these on the fly)
  const useCasesByUnit: Record<string, string[]> = {
    CCS: ["CC-Di", "CC-MT"],
    JMSL: ["JM-Ch"],
  }

  // If your backend returns an array of valid short codes instead, you can skip this
  const computedShortCodes = useMemo(() => {
    if (!businessUnit || !useCase) return []
    return [`${businessUnit.substring(0, 2)}-${useCase.substring(0, 2)}`]
  }, [businessUnit, useCase])

  // Stubbed AlertKeeper list (replace with real backend values if you fetch them)
  const [availableAlertKeepers] = useState<string[]>(["KeeperA", "KeeperB", "KeeperC"])

  // --- FETCH & PREPARE DATA ---
  const initData = async (): Promise<void> => {
    setLoading(true)
    setBackendError(null)
    try {
      const {
        businessUnit: fBU,
        useCase: fUC,
        shortCode: fSC,
        alertKeeper: fAK,
        kpis: fetchedKpis,
        errors: fetchedErrors,
        top10Ids: fetchedTop10,
        outletsExceedingThreshold: fetchedOutlets,
        indices: fetchedIndices,
        state: fetchedState,
        coverage: fetchedCoverage,
        clusters: fetchedClusters,
        backwardAnalysis: fetchedBackward,
        currentPeriod: fetchedPeriod,
        totalOutlets: fetchedTotal,
        outletsExceedingThresholdCount: fetchedCount,
        xaiExplanation: fetchedXai,
        error_percentage_threshold,
      } = await fetchData()

      // Set the “static” dashboard values from backend
      setBusinessUnit(fBU || "")
      setUseCase(fUC || "")
      setShortCode(fSC || "")
      setAlertKeeperValue(fAK || "")

      // The rest of your data
      const driftPlot: PlotDataPoint[] = []
      fetchedIndices.normal.forEach((x) => driftPlot.push({ x, y: 0, exceedsThreshold: false }))
      fetchedIndices.warning.forEach((x) => driftPlot.push({ x, y: 1, exceedsThreshold: false }))
      fetchedIndices.drift.forEach((x) => driftPlot.push({ x, y: 2, exceedsThreshold: false }))
      driftPlot.sort((a, b) => a.x - b.x)

      setKpis(fetchedKpis.filter((k) =>
        !["kstest","wasserstein","mseref","msecurrent"].includes(k.rowKey.toLowerCase())
      ))
      setErrorData({ plotData: driftPlot, tableData: fetchedErrors.tableData })
      setTop10Ids(fetchedTop10)
      setOutletsExceedingThreshold(fetchedOutlets)
      setIndices(fetchedIndices)
      setDashboardState(fetchedState)
      setCoverage(fetchedCoverage)
      setClusters(fetchedClusters)
      setBackwardAnalysis(fetchedBackward)
      setCurrentPeriod(fetchedPeriod)
      setTotalOutlets(fetchedTotal)
      setOutletsExceedingThresholdCount(fetchedCount)
      setXaiExplanation(fetchedXai)
      setErrorPercentageThreshold(error_percentage_threshold ?? 0)

      // Build the status‐distribution pie
      const normalCount = fetchedIndices.normal.length
      const warningCount = fetchedIndices.warning.length
      const driftCount = fetchedIndices.drift.length
      const total = normalCount + warningCount + driftCount || 1
      setStatusDistribution({
        good: Math.round((normalCount / total) * 100),
        warning: Math.round((warningCount / total) * 100),
        error: Math.round((driftCount / total) * 100),
      })
    } catch (err) {
      console.error(err)
      setBackendError(err instanceof Error ? err.message : "Unknown error")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    initData()
  }, [])

  // Re-render the pie chart any time the data changes
  useEffect(() => {
    if (!loading) renderPieChart()
  }, [loading, statusDistribution])

  function renderPieChart() {
    const ctx = document.getElementById("statusPieChart") as HTMLCanvasElement
    if (!ctx) return
    Chart.defaults.font.family = `"Inter","sans-serif"`
    const pie = Chart.getChart(ctx)
    if (pie) pie.destroy()
    new Chart(ctx, {
      type: "pie",
      data: {
        labels: ["Good", "Warning", "Error"],
        datasets: [
          {
            data: [statusDistribution.good, statusDistribution.warning, statusDistribution.error],
            backgroundColor: ["rgba(52,211,153,0.8)", "rgba(251,191,36,0.8)", "rgba(239,68,68,0.8)"],
            borderColor: ["rgba(52,211,153,1)", "rgba(251,191,36,1)", "rgba(239,68,68,1)"],
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
                chart.data.labels!.map((l, i) => ({
                  text: `${l}: ${chart.data.datasets![0].data[i]}%`,
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
              label: (ctx) => `${ctx.label}: ${ctx.raw}%`,
            },
          },
        },
      },
    })
  }

  // KPI helpers
  const getStatusColor = (s?: string) => {
    if (!s) return "text-gray-400"
    switch (s.toLowerCase()) {
      case "warning":
        return "text-amber-400"
      case "error":
        return "text-rose-500"
      case "success":
        return "text-emerald-400"
      default:
        return "text-sky-400"
    }
  }
  const getStatusIcon = (s?: string) => {
    if (!s) return <Info className="h-5 w-5 text-gray-400" />
    switch (s.toLowerCase()) {
      case "warning":
        return <AlertTriangle className="h-5 w-5 text-amber-400" />
      case "error":
        return <AlertCircle className="h-5 w-5 text-rose-500" />
      case "success":
        return <CheckCircle className="h-5 w-5 text-emerald-400" />
      default:
        return <Info className="h-5 w-5 text-sky-400" />
    }
  }

  // --- RENDER ---
  return (
    <div className="bg-gradient-to-b from-gray-950 to-gray-900 min-h-screen flex flex-col">
      <Head>
        <title>Mode 2 | Business Dashboard</title>
      </Head>
      <main className="flex-grow container mx-auto px-4 py-8">
        {/* --- Backend Error --- */}
        {backendError && (
          <div className="bg-rose-950/40 border border-rose-800/60 rounded-lg p-4 mb-6 backdrop-blur-sm shadow-lg">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-rose-400 mr-2" />
              <h3 className="text-lg font-medium text-rose-300">Backend Error</h3>
            </div>
            <p className="mt-2 text-rose-200">{backendError}</p>
            <button
              onClick={initData}
              className="mt-3 px-4 py-2 bg-rose-800/50 hover:bg-rose-700/70 text-white rounded-md text-sm flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" /> Retry Connection
            </button>
          </div>
        )}

        {/* --- Header --- */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-sky-600 mb-2">
            OCTAVE – RG Dashboard
          </h2>
          <p className="text-sky-300 flex items-center gap-2">
            <span className="inline-block h-2 w-2 rounded-full bg-sky-400 animate-pulse" />
            Current Period: {loading ? "Loading…" : currentPeriod}
          </p>
        </div>

        {/* --- Mode1-Style Dashboard --- */}
        <div className="bg-gray-900/80 rounded-xl shadow-xl p-6 mb-6 border border-gray-700/50 backdrop-blur-sm">
          {/* Filters box */}
          <div className="bg-gradient-to-br from-sky-950/40 to-sky-900/20 p-6 rounded-lg border border-sky-800/30 shadow-md mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-medium text-sky-300 mb-2">Business Unit</h3>
                <ul className="list-disc list-inside text-sky-200 mb-4">
                  <li>{loading ? "Loading…" : businessUnit || "Not Selected"}</li>
                </ul>
                <h3 className="text-lg font-medium text-sky-300 mb-2">Use Case</h3>
                <ul className="list-disc list-inside text-sky-200">
                  <li>{loading ? "Loading…" : useCase || "Not Selected"}</li>
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-medium text-sky-300 mb-2">Short Code</h3>
                <ul className="list-disc list-inside text-sky-200 mb-4">
                  <li>{loading ? "Loading…" : shortCode || "Not Available"}</li>
                </ul>
                <h3 className="text-lg font-medium text-sky-300 mb-2">Alert Keeper</h3>
                <ul className="list-disc list-inside text-sky-200">
                  <li>{loading ? "Loading…" : alertKeeperValue || "Not Selected"}</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Runtime & Status Distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Runtime */}
            <div className="lg:col-span-2 bg-gradient-to-br from-sky-950/40 to-sky-900/20 p-6 rounded-lg border border-sky-800/30 shadow-md">
              <h3 className="text-lg font-medium text-sky-300 mb-2">Runtime</h3>
              <select
                className="w-full bg-gray-800/80 border border-sky-700/50 rounded-md p-2 text-white focus:ring-2 focus:ring-sky-500"
                value={runtimeValue}
                onChange={(e) => setRuntimeValue(Number(e.target.value))}
              >
                <option value={1}>1</option>
                <option value={2}>2</option>
                <option value={3}>3</option>
                <option value={4}>4</option>
              </select>
            </div>
            {/* Status Distribution */}
            <div className="bg-gradient-to-br from-sky-950/40 to-sky-900/20 p-6 rounded-lg border border-sky-800/30 shadow-md">
              <h3 className="text-lg font-medium text-sky-300 mb-2">Status Distribution</h3>
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Status Card */}
            <div className="bg-gradient-to-br from-sky-950/40 to-sky-900/20 p-4 rounded-lg border border-sky-800/30 shadow-md hover:shadow-sky-900/20 hover:border-sky-700/50 transition-all">
              <h3 className="text-lg font-medium text-sky-300 mb-2">Status</h3>
              <div className="flex items-center">
                <div className="w-10 h-10 rounded-full bg-sky-800/40 flex items-center justify-center mr-3">
                  {getStatusIcon(kpis.find((k) => k.rowKey === "status")?.value)}
                </div>
                <p
                  className={`text-xl font-semibold ${getStatusColor(kpis.find((k) => k.rowKey === "status")?.value)}`}
                >
                  {loading ? "Loading..." : kpis.find((k) => k.rowKey === "status")?.value || "N/A"}
                </p>
              </div>
            </div>

            {/* Additional Metrics */}
            <div className="bg-gradient-to-br from-sky-950/40 to-sky-900/20 p-4 rounded-lg border border-sky-800/30 shadow-md hover:shadow-sky-900/20 hover:border-sky-700/50 transition-all">
              <h3 className="text-lg font-medium text-sky-300 mb-2">Additional Metrics</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-400">Drift Detected:</span>
                    <span className="text-sm font-medium text-white">
                      {loading ? "Loading..." : outletsExceedingThresholdCount === 0 ? "No" : "Yes"}
                    </span>
                  </div>
                </div>
                <div className="pt-3 border-t border-sky-800/30">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-400">Error Percentage Threshold:</span>
                    <span className="text-sm font-medium text-white">
                      {loading ? "Loading..." : errorPercentageThreshold.toFixed(2)}
                    </span>
                  </div>
                </div>
                <div className="pt-3 border-t border-sky-800/30">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-400">Average Percentage Error (All):</span>
                    <span className="text-sm font-medium text-white">
                      {loading ? "Loading..." : kpis.find((k) => k.rowKey === "avgPercentageError")?.value || "5.72"}
                    </span>
                  </div>
                </div>
                <div className="pt-3 border-t border-sky-800/30">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-400">Average Percentage Error (Exceeding):</span>
                    <span className="text-sm font-medium text-white">
                      {loading
                        ? "Loading..."
                        : kpis.find((k) => k.rowKey === "avgPercentageErrorExceeding")?.value || "12.66"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Drift/Warning Chart */}
        <div className="bg-gray-900/80 rounded-xl shadow-xl overflow-hidden p-6 mb-6 border border-gray-700/50 backdrop-blur-sm">
          <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-sky-600 mb-4">
            Drift & Warning Over Time
          </h2>
          <div className="bg-gray-800/60 rounded-lg p-4 border border-gray-700/50 h-72 relative">
            {loading ? (
              <div className="flex items-center justify-center h-full">
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
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  <div className="text-sky-300">Loading chart data...</div>
                </div>
              </div>
            ) : errorData.plotData.length === 0 ? (
              <div className="flex items-center justify-center h-full text-sky-300">
                No data available for Drift & Warning Over Time
              </div>
            ) : (
              <DriftWarningChart plotData={errorData.plotData} />
            )}
          </div>
        </div>


        {/* Error Tables Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Error Comparison */}
          <div className="bg-gray-900/80 rounded-xl shadow-xl overflow-hidden p-6 border border-gray-700/50 backdrop-blur-sm">
            <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-sky-600 mb-4">
              Error Comparison
            </h2>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <svg
                  className="animate-spin h-8 w-8 text-sky-500 mb-2"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                <span className="text-sky-300">Loading error data...</span>
              </div>
            ) : (
              <div className="max-h-96 overflow-y-auto rounded-lg border border-gray-700/50">
                <table className="min-w-full divide-y divide-gray-700/50">
                  <thead className="bg-gray-800/60">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-sky-300 uppercase tracking-wider">
                        NO.
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-sky-300 uppercase tracking-wider">
                        ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-rose-400 uppercase tracking-wider">
                        Error
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-gray-800/30 divide-y divide-gray-700/50">
                    {errorData.tableData
                      .slice()
                      .sort((a: any, b: any) => (a.error ?? 0) - (b.error ?? 0))
                      .map((row: any, i: number) => (
                        <tr key={row.id} className="hover:bg-gray-700/30 transition-colors duration-150">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">{i + 1}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">{row.id}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-rose-400 font-medium">
                            {(row.error ?? 0).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Threshold Exceedances */}
          <div className="bg-gradient-to-br from-rose-950/30 to-gray-900/90 rounded-xl shadow-xl overflow-hidden p-6 border border-rose-900/30 backdrop-blur-sm">
            <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-rose-400 to-rose-600 mb-4">
              Threshold Exceedances&nbsp;
              <span className="text-sm text-rose-200">(Threshold: {errorPercentageThreshold.toFixed(2)}%)</span>
            </h2>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <svg
                  className="animate-spin h-8 w-8 text-rose-500 mb-2"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                <span className="text-rose-300">Loading threshold data...</span>
              </div>
            ) : (
              <div className="max-h-96 overflow-y-auto rounded-lg border border-rose-800/30">
                <table className="min-w-full divide-y divide-rose-800/30">
                  <thead className="bg-rose-900/20">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-rose-300 uppercase tracking-wider">
                        ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-rose-300 uppercase tracking-wider">
                        True Value
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-rose-300 uppercase tracking-wider">
                        Predicted Value
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-rose-300 uppercase tracking-wider">
                        % Error
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-rose-900/10 divide-y divide-rose-800/30">
                    {outletsExceedingThreshold
                      .slice()
                      .sort((a, b) => b.percentage_error - a.percentage_error)
                      .map((outlet) => (
                        <tr key={outlet.id} className="hover:bg-rose-900/20 transition-colors duration-150">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">{outlet.id}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                            {outlet.y_true.toFixed(2)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                            {outlet.y_pred.toFixed(2)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-rose-400 font-medium">
                            {outlet.percentage_error.toFixed(2)}%
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* XAI Result Section - Moved to bottom */}
        <div className="bg-gray-900/80 rounded-xl shadow-xl overflow-hidden p-6 mb-6 border border-gray-700/50 backdrop-blur-sm">
          <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-sky-600 mb-4">
            XAI Result
          </h2>
          <div className="bg-gray-800/60 rounded-lg p-6 border border-gray-700/50">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="flex flex-col items-center">
                  <svg
                    className="animate-spin h-8 w-8 text-sky-500 mb-2"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  <span className="text-sky-300">Loading XAI explanation...</span>
                </div>
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
      </main>
    </div>
  )
}
