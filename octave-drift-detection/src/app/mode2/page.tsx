"use client"
import type React from "react"
import { useState, useEffect, useMemo, useRef, useCallback } from "react"
import { Chart, registerables } from "chart.js"
import DriftWarningChart from "./DriftWarningChart"
import { AlertCircle, AlertTriangle, CheckCircle, RefreshCw, Info, X } from "lucide-react"
import { useSearchParams } from "next/navigation"
import {
  fetchData,
  type KPI,
  type PlotDataPoint,
  type TableDataPoint,
  type OutletsExceedingThreshold,
  type Indices,
  type AllOutlets,
  type Top10Id,
} from "../../services/backendService1"
import { fetchEntriesTable } from "../../services/dashboardService"
import { Markdown } from "../../components/Markdown"

Chart.register(...registerables)

// Define the entry table interface
interface EntryTableItem {
  BusinessUnit: string
  useCase: string
  ShortCode: string
  Runtime: string
  alertKeeper: string
}

// Error percentage ranges for the bar chart
const ERROR_RANGES = [
  { min: 0, max: 10, label: "0-10%" },
  { min: 10, max: 20, label: "10-20%" },
  { min: 20, max: 30, label: "20-30%" },
  { min: 30, max: 40, label: "30-40%" },
  { min: 40, max: 50, label: "40-50%" },
  { min: 50, max: 60, label: "50-60%" },
  { min: 60, max: 70, label: "60-70%" },
  { min: 70, max: 80, label: "70-80%" },
  { min: 80, max: 90, label: "80-90%" },
  { min: 90, max: 100, label: "90-100%" },
  { min: 100, max: Number.POSITIVE_INFINITY, label: ">100%" },
]

export default function Mode2Page(): React.ReactElement {
  const searchParams = useSearchParams()
  const businessUnitParam = searchParams.get("businessUnit") || ""
  const useCaseParam = searchParams.get("useCase") || ""
  const alertKeeperParam = searchParams.get("alertKeeper") || ""


  // --- STATE HOOKS ---
  const [kpis, setKpis] = useState<KPI[]>([])
  const [errorData, setErrorData] = useState<{ plotData: PlotDataPoint[]; tableData: TableDataPoint[] }>({
    plotData: [],
    tableData: [],
  })
    // how many outlets went over the threshold
  const [outletsExceedingThresholdCount, setOutletsExceedingThresholdCount] = useState<number>(0)

  const [outletsExceedingThreshold, setOutletsExceedingThreshold] = useState<OutletsExceedingThreshold[]>([])
  const [indices, setIndices] = useState<Indices>({ normal: [], warning: [], drift: [] })
  const [currentPeriod, setCurrentPeriod] = useState<string>("N/A")
//  const [outletsExceedingThresholdCount, setOutletsExceedingThresholdCoufetchEntriesTablent] = useState<number>(0)
  const [xaiExplanation, setXaiExplanation] = useState<string>("")
  const [loading, setLoading] = useState<boolean>(true)
  const [backendError, setBackendError] = useState<string | null>(null)
  const [errorPercentageThreshold, setErrorPercentageThreshold] = useState<number>(0)
  const [sortedPeriods, setSortedPeriods] = useState<string[]>([])
  const [driftDetected, setDriftDetected] = useState<boolean | null>(null)
  const [top10Ids, setTop10Ids] = useState<Top10Id[]>([])
  const [totalOutlets, setTotalOutlets] = useState<number>(0)

  // --- FILTER STATES for Dashboard ---
  const [businessUnit, setBusinessUnit] = useState<string>("")
  const [useCase, setUseCase] = useState<string>("")
  const [shortCode, setShortCode] = useState<string>("")
  const [alertKeeperValue, setAlertKeeperValue] = useState<string>(alertKeeperParam)


  // Entries state (fetched via dashboardService)
  const [entries, setEntries] = useState<EntryTableItem[]>([])
  const [runtimeValue, setRuntimeValue] = useState<string>("")
  const [runtimeOptions, setRuntimeOptions] = useState<string[]>([])

  // Status distribution for pie chart
  const [statusDistribution, setStatusDistribution] = useState({ good: 65, warning: 25, error: 10 })

  // Error range data for bar chart
  const [allOutlets, setAllOutlets] = useState<AllOutlets[]>([])
  const [errorRangeData, setErrorRangeData] = useState<{ range: string; count: number; outlets: AllOutlets[] }[]>([])
  const [selectedRange, setSelectedRange] = useState<string | null>(null)
  const [selectedRangeOutlets, setSelectedRangeOutlets] = useState<AllOutlets[]>([])

  // Chart refs
  const pieChartRef = useRef<Chart | null>(null)
  const errorRangeChartRef = useRef<Chart | null>(null)

  // Memoized chart colors
  const chartColors = useMemo(() => {
    return {
      good: "rgba(52,211,153,0.8)",
      warning: "rgba(251,191,36,0.8)",
      error: "rgba(239,68,68,0.8)",
      goodBorder: "rgba(52,211,153,1)",
      warningBorder: "rgba(251,191,36,1)",
      errorBorder: "rgba(239,68,68,1)",
      barColors: [
        "rgba(52,211,153,0.8)",
        "rgba(96,165,250,0.8)",
        "rgba(234,179,8,0.8)",
        "rgba(251,191,36,0.8)",
        "rgba(251,146,60,0.8)",
        "rgba(249,115,22,0.8)",
        "rgba(236,72,153,0.8)",
        "rgba(244,114,182,0.8)",
        "rgba(248,113,113,0.8)",
        "rgba(244,63,94,0.8)",
        "rgba(239,68,68,0.8)",
      ],
    }
  }, [])

  // Memoized status helpers
  const getStatusIcon = useCallback((s?: string) => {
    if (!s) return <Info className="h-5 w-5 text-gray-400" />
    return s.toLowerCase() === "warning" ? (
      <AlertTriangle className="h-5 w-5 text-amber-400" />
    ) : s.toLowerCase() === "error" || s.toLowerCase() === "alert" ? (
      <AlertCircle className="h-5 w-5 text-rose-500" />
    ) : (
      <CheckCircle className="h-5 w-5 text-emerald-400" />
    )
  }, [])

  const getStatusColor = useCallback((s?: string) => {
    if (!s) return "text-gray-400"
    return s.toLowerCase() === "warning"
      ? "text-amber-400"
      : s.toLowerCase() === "error" || s.toLowerCase() === "alert"
        ? "text-rose-500"
        : "text-emerald-400"
  }, [])

  // Calculate error range data
  const calculateErrorRangeData = useCallback((outlets: AllOutlets[]) => {
    if (!outlets?.length) return []

    return ERROR_RANGES.map((r) => {
      const outs: AllOutlets[] = outlets.filter(
        (o: AllOutlets) => o.percentage_error >= r.min && o.percentage_error < r.max,
      )
      return { range: r.label, count: outs.length, outlets: outs }
    })
  }, [])

  // 1) Fetch entries when businessUnitParam or useCaseParam change
  useEffect(() => {
    if (!businessUnitParam || !useCaseParam) return

    const loadEntries = async () => {
      try {
        const fetched = await fetchEntriesTable({
          BusinessUnit: businessUnitParam,
          useCase: useCaseParam,
        })
        // Filter out any placeholder rows
        const filtered = fetched.filter(
          (entry) =>
            entry.BusinessUnit !== "Not Selected" &&
            entry.useCase !== "Not Selected" &&
            entry.ShortCode !== "Not Available",
        )
        setEntries(filtered)

        if (filtered.length === 0) {
          setBusinessUnit("Not Selected")
          setUseCase("Not Selected")
          setShortCode("Not Available")
          setRuntimeOptions([])
         
          setRuntimeValue("")
        } else {
          // Initialize with first entry
          setBusinessUnit(filtered[0].BusinessUnit)
          setUseCase(filtered[0].useCase)
          setShortCode(filtered[0].ShortCode)

          const uniqueRuntimes = Array.from(new Set(filtered.map((e) => e.Runtime)))
          setRuntimeOptions(uniqueRuntimes)
          setRuntimeValue(uniqueRuntimes[0])

        }
      } catch (err) {
        console.error(err)
        setBackendError(err instanceof Error ? err.message : "Failed to load entries")
      }
    }

    loadEntries()
  }, [businessUnitParam, useCaseParam])



  // Fetch & prepare all data
  const fetchAllData = useCallback(async (): Promise<void> => {
    setLoading(true)
    setBackendError(null)
    try {
      const data = await fetchData({ runtime: runtimeValue })

      // Build the "drift & warning over time" plotData from indices
      const driftPlot: PlotDataPoint[] = []
      data.indices.normal.forEach((x) => driftPlot.push({ x, y: 0, exceedsThreshold: false }))
      data.indices.warning.forEach((x) => driftPlot.push({ x, y: 1, exceedsThreshold: false }))
      data.indices.drift.forEach((x) => driftPlot.push({ x, y: 2, exceedsThreshold: false }))
      driftPlot.sort((a, b) => a.x - b.x)

      // Dynamic data
      setKpis(
        data.kpis.filter((k) =>
          ["kstest", "wasserstein", "mseref", "msecurrent"].includes(k.rowKey.toLowerCase()) ? false : true,
        ),
      )
      setErrorData({ plotData: driftPlot, tableData: data.errors.tableData })
      setOutletsExceedingThreshold(data.outletsExceedingThreshold)
      setIndices(data.indices)
      setCurrentPeriod(data.currentPeriod)
      setOutletsExceedingThresholdCount(data.outletsExceedingThresholdCount)
      setXaiExplanation(data.xaiExplanation)
      setErrorPercentageThreshold(data.error_percentage_threshold ?? 0)
      setAllOutlets(data.all_outlets || [])
      setSortedPeriods(data.sorted_periods || [])
      setDriftDetected(data.driftDetected || null)
      setTop10Ids(data.top10Ids || [])
      setTotalOutlets(data.totalOutlets || 0)

      // Status distribution
      const normalCount = data.indices.normal.length
      const warningCount = data.indices.warning.length
      const driftCount = data.indices.drift.length
      const total = normalCount + warningCount + driftCount || 1
      setStatusDistribution({
        good: Math.round((normalCount / total) * 100),
        warning: Math.round((warningCount / total) * 100),
        error: Math.round((driftCount / total) * 100),
      })

      // Error‐range bar chart data
      if (data.all_outlets?.length) {
        setErrorRangeData(calculateErrorRangeData(data.all_outlets))
      }
    } catch (err) {
      console.error(err)
      setBackendError(err instanceof Error ? err.message : "Unknown error")
    } finally {
      setLoading(false)
    }
  }, [calculateErrorRangeData, runtimeValue])

  // 3) Fetch dynamic data when runtimeValue changes
  useEffect(() => {
    if (runtimeValue) {
      fetchAllData()
    }
  }, [runtimeValue, fetchAllData])

  // Cleanup function to destroy charts when component unmounts
  useEffect(() => {
    return () => {
      if (pieChartRef.current) {
        pieChartRef.current.destroy()
      }
      if (errorRangeChartRef.current) {
        errorRangeChartRef.current.destroy()
      }
    }
  }, [])

  // Re-draw charts any time data changes
  useEffect(() => {
    if (!loading) {
      renderPieChart()
      renderErrorRangeChart()
    }
  }, [loading, statusDistribution, errorRangeData, chartColors])

  // Pie chart
  const renderPieChart = useCallback(() => {
    const ctx = document.getElementById("statusPieChart") as HTMLCanvasElement
    if (!ctx) return

    // Properly destroy existing chart to prevent memory leaks
    if (pieChartRef.current) {
      pieChartRef.current.destroy()
    }

    // Memoize chart data
    const chartData = {
      labels: ["Good", "Warning", "Error"],
      datasets: [
        {
          data: [statusDistribution.good, statusDistribution.warning, statusDistribution.error],
          backgroundColor: [chartColors.good, chartColors.warning, chartColors.error],
          borderColor: [chartColors.goodBorder, chartColors.warningBorder, chartColors.errorBorder],
          borderWidth: 1,
        },
      ],
    }

    pieChartRef.current = new Chart(ctx, {
      type: "pie",
      data: chartData,
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
  }, [statusDistribution, chartColors])

  // Bar chart
  const renderErrorRangeChart = useCallback(() => {
    const ctx = document.getElementById("errorRangeChart") as HTMLCanvasElement
    if (!ctx) return

    // Properly destroy existing chart to prevent memory leaks
    if (errorRangeChartRef.current) {
      errorRangeChartRef.current.destroy()
    }

    // Get colors based on data length
    const colors = chartColors.barColors.slice(0, errorRangeData.length)
    const borders = colors.map((c) => c.replace(/0\.8/, "1"))

    // Memoize chart data
    const chartData = {
      labels: errorRangeData.map((d) => d.range),
      datasets: [
        {
          label: "Number of IDs",
          data: errorRangeData.map((d) => d.count),
          backgroundColor: colors,
          borderColor: borders,
          borderWidth: 1,
          borderRadius: 4,
        },
      ],
    }

    errorRangeChartRef.current = new Chart(ctx, {
      type: "bar",
      data: chartData,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: "ID Distribution by Error Percentage Range",
            color: "#38bdf8",
            font: { size: 16, weight: "bold" },
          },
          tooltip: {
            callbacks: {
              label: (ctx) => `IDs: ${ctx.raw}`,
              afterLabel: () => "Click to view details",
            },
            backgroundColor: "rgba(15,23,42,0.8)",
            titleColor: "#38bdf8",
            bodyColor: "#e5e7eb",
            borderColor: "#1e40af",
            borderWidth: 1,
            padding: 10,
          },
          legend: { display: false },
        },
        scales: {
          x: {
            title: { display: true, text: "Error Percentage Range", color: "#38bdf8", font: { weight: "bold" } },
            ticks: { color: "#e5e7eb", font: { size: 12 } },
            grid: { color: "rgba(148,163,184,0.1)", borderColor: "rgba(148,163,184,0.2)" },
          },
          y: {
            title: { display: true, text: "Number of IDs", color: "#38bdf8", font: { weight: "bold" } },
            beginAtZero: true,
            ticks: { color: "#e5e7eb", precision: 0 },
            grid: { color: "rgba(148,163,184,0.1)", borderColor: "rgba(148,163,184,0.2)" },
          },
        },
        onClick: (_evt, elems) => {
          if (elems.length) handleBarClick(elems[0].index)
        },
      },
    })
  }, [errorRangeData, chartColors])

  // Bar‐click handler
  const handleBarClick = useCallback(
    (i: number) => {
      const sel = errorRangeData[i]
      setSelectedRange(sel.range)
      setSelectedRangeOutlets(sel.outlets.sort((a, b) => b.percentage_error - a.percentage_error))
    },
    [errorRangeData],
  )

  // Memoize sorted table data
  const sortedErrorTableData = useMemo(() => {
    return (
      errorData.tableData
        .slice()
        // Filter out duplicate IDs, keeping only the first occurrence
        .filter((row, index, self) => index === self.findIndex((r) => r.id === row.id))
        .sort((a, b) => (b.difference ?? 0) - (a.difference ?? 0))
    )
  }, [errorData.tableData])

  // Memoize sorted threshold exceedance data
  const sortedOutletsExceedingThreshold = useMemo(() => {
    return outletsExceedingThreshold.slice().sort((a, b) => b.percentage_error - a.percentage_error)
  }, [outletsExceedingThreshold])

  // Memoize status KPI
  const statusKpi = useMemo(() => {
    return kpis.find((k) => k.rowKey === "State")?.value || kpis.find((k) => k.rowKey === "status")?.value
  }, [kpis])

  // Memoize additional metrics
  const additionalMetrics = useMemo(() => {
    return {
      avgPercentageError: kpis.find((k) => k.rowKey === "Average Percentage Error (All)")?.value || "N/A",
      avgPercentageErrorExceeding:
        kpis.find((k) => k.rowKey === "Average Percentage Error (Exceeding)")?.value || "N/A",
      totalOutlets: kpis.find((k) => k.rowKey === "Total Outlets")?.value || totalOutlets.toString(),
      outletsExceedingThreshold:
        kpis.find((k) => k.rowKey === "Outlets Exceeding Threshold")?.value ||
        outletsExceedingThresholdCount.toString(),
    }
  }, [kpis, totalOutlets, outletsExceedingThresholdCount])

  return (
    <div className="bg-gradient-to-b from-gray-950 to-gray-900 min-h-screen flex flex-col">
      <title>Mode 2 | Business Dashboard</title>
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
              onClick={fetchAllData}
              className="mt-3 px-4 py-2 bg-rose-800/50 hover:bg-rose-700/70 text-white rounded-md text-sm flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" /> Retry
            </button>
          </div>
        )}

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-sky-600 mb-2">
            OCTAVE – RG Dashboard
          </h2>
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <p className="text-sky-300 flex items-center gap-2">
              <span className="inline-block h-2 w-2 rounded-full bg-sky-400 animate-pulse" />
              Current Period: {loading ? "Loading…" : currentPeriod}
            </p>
            {driftDetected !== null && (
              <div
                className={`flex items-center gap-2 sm:ml-6 px-3 py-1.5 rounded-md ${driftDetected ? "bg-rose-900/40 border border-rose-700" : "bg-emerald-900/40 border border-emerald-700"}`}
              >
                <span className="font-medium text-gray-200">Drift Detected:</span>
                <span className={`font-bold ${driftDetected ? "text-rose-400" : "text-emerald-400"}`}>
                  {driftDetected ? "Yes" : "No"}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Static Filters & Runtime */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Filters (2/3) */}
          <div className="lg:col-span-2 bg-gradient-to-br from-sky-950/40 to-sky-900/20 p-6 rounded-lg border border-sky-800/30 shadow-md">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-lg font-medium text-sky-300">Business Unit:</p>
                <p className="text-sky-200">{loading ? "Loading…" : businessUnit || "Not Selected"}</p>
                <p className="mt-4 text-lg font-medium text-sky-300">Use Case:</p>
                <p className="text-sky-200">{loading ? "Loading…" : useCase || "Not Selected"}</p>
              </div>
              <div>
                <p className="text-lg font-medium text-sky-300">Short Code:</p>
                <p className="text-sky-200">{loading ? "Loading…" : shortCode || "Not Available"}</p>
                <p className="mt-4 text-lg font-medium text-sky-300">Alert Keeper:</p>
                <p className="text-sky-200">{loading ? "Loading…" : alertKeeperValue || "Not Selected"}</p>
              </div>
            </div>
          </div>

          {/* Runtime (1/3) */}
          <div className="bg-gradient-to-br from-sky-950/40 to-sky-900/20 p-6 rounded-lg border border-sky-800/30 shadow-md">
            <h3 className="text-lg font-medium text-sky-300 mb-2">Runtime</h3>
            <select
              className="w-full bg-gray-800/80 border border-sky-700/50 rounded-md p-2 text-white focus:ring-2 focus:ring-sky-500"
              value={runtimeValue}
              onChange={(e) => setRuntimeValue(e.target.value)}
              disabled={runtimeOptions.length === 0}
            >
              {runtimeOptions.length === 0 ? (
                <option value="">No runtimes available</option>
              ) : (
                runtimeOptions.map((runtime) => (
                  <option key={runtime} value={runtime}>
                    {runtime}
                  </option>
                ))
              )}
            </select>
          </div>
        </div>

        {/* Plot & Pie */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Drift & Warning Over Time */}
          <div className="lg:col-span-2 bg-gray-900/80 rounded-xl shadow-xl overflow-hidden p-6 border border-gray-700/50 backdrop-blur-sm">
            <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-sky-600 mb-4">
              Drift & Warning Over Time
            </h2>
            <div className="h-80 bg-gray-800/60 rounded-lg p-4 border border-gray-700/50">
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <svg
                    className="animate-spin h-8 w-8 text-sky-500"
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
                </div>
              ) : (
                <DriftWarningChart plotData={errorData.plotData} />
              )}
            </div>
          </div>

          {/* Status Distribution */}
          <div className="bg-gradient-to-br from-sky-950/40 to-sky-900/20 p-6 rounded-lg border border-sky-800/30 shadow-md">
            <h3 className="text-lg font-medium text-sky-300 mb-2">Status Distribution</h3>
            <div className="h-80">
              <canvas id="statusPieChart"></canvas>
            </div>
          </div>
        </div>

        {/* KPIs */}
        <div className="bg-gray-900/80 rounded-xl shadow-xl overflow-hidden p-6 mb-6 border border-gray-700/50 backdrop-blur-sm">
          <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-sky-600 mb-4">
            Key Performance Indicators
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Status */}
            <div className="bg-gradient-to-br from-sky-950/40 to-sky-900/20 p-4 rounded-lg border border-sky-800/30 shadow-md hover:shadow-sky-900/20 hover:border-sky-700/50 transition-all">
              <h3 className="text-lg font-medium text-sky-300 mb-2">Status</h3>
              <div className="flex items-center">
                <div className="w-10 h-10 rounded-full bg-sky-800/40 flex items-center justify-center mr-3">
                  {getStatusIcon(statusKpi)}
                </div>
                <p className={`text-xl font-semibold ${getStatusColor(statusKpi)}`}>
                  {loading ? "Loading..." : statusKpi || "N/A"}
                </p>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-400">Total Outlets</p>
                  <p className="text-lg font-medium text-white">{additionalMetrics.totalOutlets}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Outlets Exceeding</p>
                  <p className="text-lg font-medium text-white">{additionalMetrics.outletsExceedingThreshold}</p>
                </div>
              </div>
            </div>
            {/* Additional Metrics */}
            <div className="bg-gradient-to-br from-sky-950/40 to-sky-900/20 p-4 rounded-lg border border-sky-800/30 shadow-md hover:shadow-sky-900/20 hover:border-sky-700/50 transition-all">
              <h3 className="text-lg font-medium text-sky-300 mb-2">Error Metrics</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-400">Error % Threshold:</span>
                    <span className="text-sm font-medium text-white">
                      {loading ? "Loading..." : errorPercentageThreshold.toFixed(2)}
                    </span>
                  </div>
                </div>
                <div className="pt-3 border-t border-sky-800/30">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-400">Avg % Error (All):</span>
                    <span className="text-sm font-medium text-white">
                      {loading ? "Loading..." : additionalMetrics.avgPercentageError}
                    </span>
                  </div>
                </div>
                <div className="pt-3 border-t border-sky-800/30">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-400">Avg % Error (Exceed):</span>
                    <span className="text-sm font-medium text-white">
                      {loading ? "Loading..." : additionalMetrics.avgPercentageErrorExceeding}
                    </span>
                  </div>
                </div>
                <div className="pt-3 border-t border-sky-800/30">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-400">Drift Detected:</span>
                    <span className={`text-sm font-medium ${driftDetected ? "text-rose-400" : "text-emerald-400"}`}>
                      {loading ? "Loading..." : driftDetected ? "Yes" : "No"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Error Comparison & Threshold Exceedances */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Error Comparison */}
          <div className="bg-gray-900/80 rounded-xl shadow-xl overflow-hidden p-6 border border-gray-700/50 backdrop-blur-sm">
            <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-sky-600 mb-4">
              Error Comparison (Current Period)
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
                      <th className="px-6 py-3 text-left text-xs font-medium text-sky-300 uppercase tracking-wider">
                        Current Error
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-sky-300 uppercase tracking-wider">
                        Reference Error
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-sky-300 uppercase tracking-wider">
                        Difference
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-gray-800/30 divide-y divide-gray-700/50">
                    {sortedErrorTableData.map((row, i) => (
                      <tr key={row.id} className="hover:bg-gray-700/30 transition-colors duration-150">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">{i + 1}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">{row.id}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-sky-400 font-medium">
                          {(row.abs_curr_per ?? row.error ?? 0).toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-sky-400 font-medium">
                          {(row.abs_ref_per ?? 0).toFixed(2)}
                        </td>
                        <td
                          className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${(row.difference ?? 0) > 0 ? "text-rose-400" : "text-emerald-400"}`}
                        >
                          {(row.difference ?? 0) > 0 ? "+" : ""}
                          {(row.difference ?? 0).toFixed(2)}
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
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.137 5.824 3 7.938l3-2.647z"
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
                    {sortedOutletsExceedingThreshold.map((outlet) => (
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

        {/* Error Range Distribution Bar Chart */}
        <div className="bg-gray-900/80 rounded-xl shadow-xl overflow-hidden p-6 mb-6 border border-gray-700/50 backdrop-blur-sm">
          <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-sky-600 mb-4">
            ID Distribution by Error Percentage Range
          </h2>
          <div className="h-80 bg-gray-800/60 rounded-lg p-4 border border-gray-700/50 mb-4">
            {loading ? (
              <div className="flex items-center justify-center h-full">
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
                <span className="text-sky-300">Loading chart data...</span>
              </div>
            ) : (
              <canvas id="errorRangeChart"></canvas>
            )}
          </div>

          {/* Selected Range Table */}
          {selectedRange && (
            <div className="mt-4">
              <h3 className="text-xl font-medium text-sky-300 mb-3">
                IDs in {selectedRange} Error Range
                <button onClick={() => setSelectedRange(null)} className="ml-2 text-sky-400 hover:text-sky-300">
                  <X className="h-4 w-4 inline" />
                </button>
              </h3>
              {selectedRangeOutlets.length === 0 ? (
                <p className="text-gray-400">No IDs in this range</p>
              ) : (
                <div className="max-h-96 overflow-y-auto rounded-lg border border-sky-800/30">
                  <table className="min-w-full divide-y divide-sky-800/30">
                    <thead className="bg-sky-900/20">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-sky-300 uppercase tracking-wider">
                          ID
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-sky-300 uppercase tracking-wider">
                          True Value
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-sky-300 uppercase tracking-wider">
                          Predicted Value
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-sky-300 uppercase tracking-wider">
                          % Error
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-sky-900/10 divide-y divide-sky-800/30">
                      {selectedRangeOutlets.map((o) => (
                        <tr key={o.id} className="hover:bg-sky-900/20 transition-colors duration-150">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">{o.id}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{o.y_true.toFixed(2)}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{o.y_pred.toFixed(2)}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-sky-400 font-medium">
                            {o.percentage_error.toFixed(2)}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
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
            ) : (
              <div className="prose prose-invert prose-sky max-w-none">
                {xaiExplanation ? (
                  <Markdown content={xaiExplanation} />
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
