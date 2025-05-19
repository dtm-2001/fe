"use client"
import { useEffect, useState, useRef } from "react"
import ReactMarkdown from "react-markdown"
import { Chart, registerables, type Scale, type ChartEvent } from "chart.js"
import { fetchData } from "../../services/backendService"
import { fetchEntriesTable } from "../../services/dashboardService"
import { AlertCircle, AlertTriangle, CheckCircle, RefreshCw, Info, HelpCircle, X } from "lucide-react"
import { useSearchParams } from "next/navigation"

Chart.register(...registerables)

// Interfaces for type safety
interface KPI {
  rowKey: string
  value: string
  status?: string
}

interface PlotDataPoint {
  x: string
  y: number
  exceedsThreshold: boolean
}

interface TableDataPoint {
  id: string
  timePeriod: string
  meanPrediction?: number
  error?: number
  percentageError?: number
  status: string
  abs_curr_per?: number
  abs_ref_per?: number
  difference?: number
}

interface OutletsExceedingThreshold {
  id: string
  y_true: number
  y_pred: number
  percentage_error: number
}

// Add the AllOutlets interface after the OutletsExceedingThreshold interface
interface AllOutlets {
  id: number
  percentage_error: number
  y_pred: number
  y_true: number
}

interface MSETrend {
  MSE: number
  time_period: string
}

interface ErrorDataState {
  plotData: PlotDataPoint[]
  tableData: TableDataPoint[]
}

// Define the entry table interface
interface EntryTableItem {
  BusinessUnit: string
  useCase: string
  ShortCode: string
  Runtime: string
  alertKeeper: string
}

// Tooltip content for KS test and Wasserstein
const tooltipContent = {
  kstest: {
    title: "Kolmogorov-Smirnov Test",
    content: `The KS test measures the maximum difference between two cumulative distribution functions. 
It helps determine if two datasets differ significantly. Lower values indicate more similar distributions.

Technical explanation: The test statistic quantifies the distance between the empirical distribution function of the sample and the cumulative distribution function of the reference distribution.`,
    image: "/ks-test-diagram.png",
  },
  wasserstein: {
    title: "Wasserstein Distance",
    content: `The Wasserstein distance (also called Earth Mover's Distance) measures the minimum "cost" of transforming one distribution into another.

Technical explanation: It represents the minimum amount of "work" required to transform one probability distribution into another, where "work" is measured as the amount of distribution weight that must be moved, multiplied by the distance it has to be moved.`,
    image: "/wasserstein-diagram.png",
  },
}

// Error percentage ranges for the bar chart - as requested by the user
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

// Add this tooltip component after the ERROR_RANGES constant and before the Mode1Page function
const TooltipPopup = ({ type, onClose }: { type: string; onClose: () => void }) => {
  const content = tooltipContent[type as keyof typeof tooltipContent]
  if (!content) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-gray-800 border border-sky-700 rounded-lg shadow-xl max-w-2xl w-full p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-xl font-bold text-sky-400">{content.title}</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
            aria-label="Close tooltip"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="prose prose-invert prose-sky max-w-none mb-4">
          <p className="text-gray-300 whitespace-pre-line">{content.content}</p>
        </div>
        {content.image && (
          <div className="mt-4 flex justify-center">
            <img
              src={content.image || "/placeholder.svg"}
              alt={`${content.title} visualization`}
              className="max-w-full h-auto rounded-md border border-gray-700"
            />
          </div>
        )}
      </div>
    </div>
  )
}

export default function Mode1Page() {
  const searchParams = useSearchParams()
  const businessUnitParam = searchParams.get("businessUnit") || ""
  const useCaseParam = searchParams.get("useCase") || ""

  const chartRef = useRef<Chart | null>(null)
  const pieChartRef = useRef<Chart | null>(null)
  const errorRangeChartRef = useRef<Chart | null>(null)

  // Data states
  const [kpis, setKpis] = useState<KPI[]>([])
  const [errors, setErrors] = useState<ErrorDataState>({ plotData: [], tableData: [] })
  const [outletsExceedingThreshold, setOutletsExceedingThreshold] = useState<OutletsExceedingThreshold[]>([])
  const [allOutlets, setAllOutlets] = useState<AllOutlets[]>([])
  const [xaiExplanation, setXaiExplanation] = useState<string>("No explanation available")
  const [currentPeriod, setCurrentPeriod] = useState<string>("N/A")
  const [referencePeriod, setReferencePeriod] = useState<string>("N/A")
  const [errorPercentageThreshold, setErrorPercentageThreshold] = useState<number>(0)
  const [mseTrend, setMseTrend] = useState<MSETrend[]>([])

  // Add these new state variables after the existing state declarations (around line 125)
  const [sortedPeriods, setSortedPeriods] = useState<string[]>([])
  const [driftDetected, setDriftDetected] = useState<boolean | null>(null)

  // Static values from entries_table.json filtered by businessUnit and useCase
  const [businessUnit, setBusinessUnit] = useState<string>("")
  const [useCase, setUseCase] = useState<string>("")
  const [shortCode, setShortCode] = useState<string>("")
  const [alertKeeperValue, setAlertKeeperValue] = useState<string>("")

  // Runtime & UI
  const [runtimeValue, setRuntimeValue] = useState<string>("")
  const [runtimeOptions, setRuntimeOptions] = useState<string[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [backendError, setBackendError] = useState<string | null>(null)
  const [statusDistribution, setStatusDistribution] = useState({ good: 65, warning: 25, error: 10 })
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null)

  // Error range data for bar chart
  const [errorRangeData, setErrorRangeData] = useState<{ range: string; count: number; outlets: AllOutlets[] }[]>([])
  const [selectedRange, setSelectedRange] = useState<string | null>(null)
  const [selectedRangeOutlets, setSelectedRangeOutlets] = useState<AllOutlets[]>([])

  // Entries state (fetched via dashboardService)
  const [entries, setEntries] = useState<EntryTableItem[]>([])

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
          setAlertKeeperValue("Not Selected")
          setRuntimeValue("")
        } else {
          // Initialize with first entry
          setBusinessUnit(filtered[0].BusinessUnit)
          setUseCase(filtered[0].useCase)
          setShortCode(filtered[0].ShortCode)

          const uniqueRuntimes = Array.from(new Set(filtered.map((e) => e.Runtime)))
          setRuntimeOptions(uniqueRuntimes)
          setRuntimeValue(uniqueRuntimes[0])

          const initialKeeper = filtered.find((e) => e.Runtime === uniqueRuntimes[0])?.alertKeeper || ""
          setAlertKeeperValue(initialKeeper)
        }
      } catch (err) {
        console.error(err)
        setBackendError(err instanceof Error ? err.message : "Failed to load entries")
      }
    }

    loadEntries()
  }, [businessUnitParam, useCaseParam])

  // 2) Update alertKeeper when runtimeValue or entries change
  useEffect(() => {
    if (!runtimeValue) return

    const matched = entries.find((e) => e.Runtime === runtimeValue)
    setAlertKeeperValue(matched?.alertKeeper || "Not Selected")
  }, [runtimeValue, entries])

  // 3) Fetch dynamic data (kpis, errors, etc.) whenever runtimeValue changes
  const fetchAllData = async (): Promise<void> => {
    setLoading(true)
    setBackendError(null)
    try {
      const data = await fetchData({ runtime: runtimeValue })

      // Dynamic data
      setKpis(data.kpis || [])
      setErrors(data.errors || { plotData: [], tableData: [] })
      setOutletsExceedingThreshold(data.outletsExceedingThreshold || [])
      setAllOutlets(data.all_outlets || [])
      setXaiExplanation(data.xaiExplanation || "No explanation available")
      setCurrentPeriod(data.currentPeriod || "N/A")
      setReferencePeriod(data.referencePeriod || "N/A") // Add this line to extract reference period
      setErrorPercentageThreshold(data.error_percentage_threshold ?? 0)
      setMseTrend(data.mse_trend || [])

      // Update the fetchAllData function to extract the sorted periods and drift detection status
      // Find the fetchAllData function and modify it to include these new lines after the existing data extraction
      // Around line 200 in the fetchAllData function, after setting other state variables:
      setSortedPeriods(data.sorted_periods || [])
      setDriftDetected(data.driftDetected || null)
      // If the sorted periods array has at least one element, use it as the reference period
      if (data.sorted_periods && data.sorted_periods.length > 0) {
        setReferencePeriod(data.sorted_periods[0])
      }

      // Compute status distribution...
      const goodCount =
        data.errors?.tableData.filter((r) => (r.error ?? 0) < (data.error_percentage_threshold || 5) * 0.5).length || 0
      const warningCount =
        data.errors?.tableData.filter(
          (r) =>
            (r.error ?? 0) >= (data.error_percentage_threshold || 5) * 0.5 &&
            (r.error ?? 0) < (data.error_percentage_threshold || 5),
        ).length || 0
      const errorCount =
        data.errors?.tableData.filter((r) => (r.error ?? 0) >= (data.error_percentage_threshold || 5)).length || 0
      const total = goodCount + warningCount + errorCount || 1

      setStatusDistribution({
        good: Math.round((goodCount / total) * 100),
        warning: Math.round((warningCount / total) * 100),
        error: Math.round((errorCount / total) * 100),
      })

      // Build error ranges
      if (data.all_outlets?.length) {
        const rangeData = ERROR_RANGES.map((range) => {
          const outletsInRange = data.all_outlets.filter((outlet: AllOutlets) => {
            const pe = outlet.percentage_error
            return pe >= range.min && pe < range.max
          })
          return { range: range.label, count: outletsInRange.length, outlets: outletsInRange }
        })
        setErrorRangeData(rangeData)
      }
    } catch (err) {
      console.error(err)
      setBackendError(err instanceof Error ? err.message : "Unknown error")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (runtimeValue) fetchAllData()
  }, [runtimeValue])

  // Re-render pie chart when data updates
  useEffect(() => {
    if (!loading) {
      renderPieChart()
      renderErrorRangeChart()
    }
  }, [loading, statusDistribution, errorRangeData])

  // Handle bar chart click
  const handleBarClick = (rangeIndex: number) => {
    if (rangeIndex >= 0 && rangeIndex < errorRangeData.length) {
      const range = errorRangeData[rangeIndex]
      setSelectedRange(range.range)
      setSelectedRangeOutlets(range.outlets)
    }
  }

  // Pie chart renderer
  const renderPieChart = () => {
    const ctx = document.getElementById("statusPieChart") as HTMLCanvasElement | null
    if (!ctx) return

    if (pieChartRef.current) {
      pieChartRef.current.destroy()
    }

    pieChartRef.current = new Chart(ctx, {
      type: "pie",
      data: {
        labels: ["Good", "Warning", "Error"],
        datasets: [
          {
            data: [statusDistribution.good, statusDistribution.warning, statusDistribution.error],
            backgroundColor: ["rgba(52, 211, 153, 0.8)", "rgba(251, 191, 36, 0.8)", "rgba(239, 68, 68, 0.8)"],
            borderColor: ["rgba(52, 211, 153, 1)", "rgba(251, 191, 36, 1)", "rgba(239, 68, 68, 1)"],
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

  // Update the renderErrorRangeChart function to ensure it's using the correct data
  const renderErrorRangeChart = () => {
    const ctx = document.getElementById("errorRangeChart") as HTMLCanvasElement | null
    if (!ctx) return

    console.log("Rendering error range chart with data:", errorRangeData)

    if (errorRangeChartRef.current) {
      errorRangeChartRef.current.destroy()
    }

    // Color gradient for the bars - adjusted for the requested ranges
    const gradientColors = [
      "rgba(52, 211, 153, 0.8)", // Green for low errors (0-10%)
      "rgba(96, 165, 250, 0.8)", // Blue (10-20%)
      "rgba(234, 179, 8, 0.8)", // Amber (20-30%)
      "rgba(251, 191, 36, 0.8)", // Yellow (30-40%)
      "rgba(251, 146, 60, 0.8)", // Light Orange (40-50%)
      "rgba(249, 115, 22, 0.8)", // Orange (50-60%)
      "rgba(236, 72, 153, 0.8)", // Fuchsia (60-70%)
      "rgba(244, 114, 182, 0.8)", // Pink (70-80%)
      "rgba(248, 113, 113, 0.8)", // Light Red (80-90%)
      "rgba(244, 63, 94, 0.8)", // Rose (90-100%)
      "rgba(239, 68, 68, 0.8)", // Red for high errors (>100%)
    ]

    const borderColors = [
      "rgba(52, 211, 153, 1)",
      "rgba(96, 165, 250, 1)",
      "rgba(234, 179, 8, 1)",
      "rgba(251, 191, 36, 1)",
      "rgba(251, 146, 60, 1)",
      "rgba(249, 115, 22, 1)",
      "rgba(236, 72, 153, 1)",
      "rgba(244, 114, 182, 1)",
      "rgba(248, 113, 113, 1)",
      "rgba(244, 63, 94, 1)",
      "rgba(239, 68, 68, 1)",
    ]

    // Use errorRangeData directly without sorting to maintain the natural order of ranges
    const dataToUse = errorRangeData

    errorRangeChartRef.current = new Chart(ctx, {
      type: "bar",
      data: {
        labels: dataToUse.map((d) => d.range),
        datasets: [
          {
            label: "Number of IDs",
            data: dataToUse.map((d) => d.count),
            backgroundColor: gradientColors.slice(0, dataToUse.length),
            borderColor: borderColors.slice(0, dataToUse.length),
            borderWidth: 1,
            borderRadius: 4,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            position: "top",
            labels: {
              color: "#e5e7eb",
              font: { size: 14 },
            },
          },
          title: {
            display: true,
            text: "ID Distribution by Error Percentage Range",
            color: "#38bdf8",
            font: { size: 16, weight: "bold" },
          },
          tooltip: {
            callbacks: {
              label: (ctx) => `IDs: ${ctx.raw}`,
              afterLabel: (ctx) => `Click to view details`,
            },
            backgroundColor: "rgba(15, 23, 42, 0.8)",
            titleColor: "#38bdf8",
            bodyColor: "#e5e7eb",
            borderColor: "#1e40af",
            borderWidth: 1,
            padding: 10,
          },
        },
        scales: {
          x: {
            title: {
              display: true,
              text: "Error Percentage Range",
              color: "#38bdf8",
              font: { weight: "bold" },
            },
            grid: {
              color: "rgba(148, 163, 184, 0.1)",
              borderColor: "rgba(148, 163, 184, 0.2)",
            },
            ticks: {
              color: "#e5e7eb",
              font: { size: 12 },
            },
          },
          y: {
            title: {
              display: true,
              text: "Number of IDs",
              color: "#38bdf8",
              font: { weight: "bold" },
            },
            beginAtZero: true,
            grid: {
              color: "rgba(148, 163, 184, 0.1)",
              borderColor: "rgba(148, 163, 184, 0.2)",
            },
            ticks: {
              color: "#e5e7eb",
              font: { size: 12 },
              precision: 0, // Ensure whole numbers for ID counts
            },
          },
        },
        onClick: (_event: ChartEvent, elements: any[]) => {
          if (elements && elements.length > 0) {
            const index = elements[0].index
            if (index !== undefined && index >= 0 && index < dataToUse.length) {
              handleBarClick(index)
            }
          }
        },
      },
    })
  }

  // Helpers for KPIs
  const calculateMseChange = () => {
    const refMse = Number.parseFloat(kpis.find((k) => k.rowKey === "mseRef")?.value || "0")
    const currMse = Number.parseFloat(kpis.find((k) => k.rowKey === "mseCurrent")?.value || "0")
    if (refMse === 0) return "N/A"
    const change = ((currMse - refMse) / refMse) * 100
    return `${change >= 0 ? "+" : ""}${change.toFixed(2)}%`
  }

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

  // Update the header section to include the drift detection status
  // Find the header section (around line 300) and replace it with:
  return (
    <div className="bg-gradient-to-b from-gray-950 to-gray-900 min-h-screen flex flex-col">
      <title>Mode 1 | Business Dashboard</title>
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
            <div className="text-sky-300 flex flex-col sm:flex-row sm:items-center gap-2">
              <p className="flex items-center gap-2">
                <span className="inline-block h-2 w-2 rounded-full bg-sky-400 animate-pulse" />
                Current Period: {loading ? "Loading..." : currentPeriod}
              </p>
              <p className="flex items-center gap-2 sm:ml-6">
                <span className="inline-block h-2 w-2 rounded-full bg-gray-400" />
                Reference Period: {loading ? "Loading..." : referencePeriod}
              </p>
            </div>
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

        {/* Static Filters Box and Runtime in 2:1 ratio */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Static Filters Box - 2/3 */}
          <div className="lg:col-span-2 bg-gradient-to-br from-sky-950/40 to-sky-900/20 p-6 rounded-lg border border-sky-800/30 shadow-md">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="mb-4">
                  <span className="text-lg font-medium text-sky-300">Business Unit: </span>
                  <span className="text-sky-200">{loading ? "Loading…" : businessUnit || "Not Selected"}</span>
                </div>
                <div>
                  <span className="text-lg font-medium text-sky-300">Use Case: </span>
                  <span className="text-sky-200">{loading ? "Loading…" : useCase || "Not Selected"}</span>
                </div>
              </div>
              <div>
                <div className="mb-4">
                  <span className="text-lg font-medium text-sky-300">Short Code: </span>
                  <span className="text-sky-200">{loading ? "Loading…" : shortCode || "Not Available"}</span>
                </div>
                <div>
                  <span className="text-lg font-medium text-sky-300">Alert Keeper: </span>
                  <span className="text-sky-200">{loading ? "Loading…" : alertKeeperValue || "Not Selected"}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Runtime - 1/3 */}
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

        {/* MAPE/MSE Plot and Status Distribution */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* MAPE/MSE Plot */}
          <div className="lg:col-span-2 bg-gray-900/80 rounded-xl shadow-xl overflow-hidden p-6 border border-gray-700/50 backdrop-blur-sm">
            <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-sky-600 mb-4">
              MSE Trend Analysis
            </h2>
            <div className="h-80 bg-gray-800/60 rounded-lg p-4 border border-gray-700/50">
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
                  <span className="text-sky-300">Loading plot data...</span>
                </div>
              ) : (
                <canvas
                  id="mapeMseChart"
                  className="w-full h-full"
                  ref={(el) => {
                    if (!loading && el) {
                      const ctx = el.getContext("2d")
                      if (ctx) {
                        if (chartRef.current) {
                          chartRef.current.destroy()
                        }
                        chartRef.current = new Chart(ctx, {
                          type: "line",
                          data: {
                            labels: mseTrend.map((d) => d.time_period),
                            datasets: [
                              {
                                label: "MSE Values",
                                data: mseTrend.map((d) => d.MSE),
                                borderColor: "rgb(56, 189, 248)",
                                backgroundColor: "rgba(56, 189, 248, 0.2)",
                                borderWidth: 2,
                                tension: 0.3,
                                fill: true,
                                pointBackgroundColor: "rgba(56, 189, 248, 1)",
                                pointBorderColor: "#fff",
                                pointRadius: 4,
                                pointHoverRadius: 6,
                              },
                            ],
                          },
                          options: {
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: {
                              legend: {
                                labels: { color: "#e5e7eb", font: { weight: "bold" } },
                                title: {
                                  display: true,
                                  text: "MSE Trend Analysis",
                                  color: "#38bdf8",
                                  font: { size: 16, weight: "bold" },
                                },
                              },
                              tooltip: {
                                mode: "index",
                                intersect: false,
                                backgroundColor: "rgba(15, 23, 42, 0.8)",
                                titleColor: "#38bdf8",
                                bodyColor: "#e5e7eb",
                                borderColor: "#1e40af",
                                borderWidth: 1,
                                padding: 10,
                                callbacks: {
                                  label: (ctx) => `MSE: ${ctx.parsed.y.toFixed(4)}`,
                                },
                              },
                            },
                            scales: {
                              x: {
                                title: {
                                  display: true,
                                  text: "Time Period",
                                  color: "#38bdf8",
                                  font: { weight: "bold" },
                                },
                                grid: {
                                  color: "rgba(148, 163, 184, 0.1)",
                                  borderColor: "rgba(148, 163, 184, 0.2)",
                                },
                                ticks: {
                                  color: "#e5e7eb",
                                  font: { size: 12 },
                                },
                              },
                              y: {
                                title: {
                                  display: true,
                                  text: "MSE Value",
                                  color: "#38bdf8",
                                  font: { weight: "bold" },
                                },
                                beginAtZero: true,
                                grid: {
                                  color: "rgba(148, 163, 184, 0.1)",
                                  borderColor: "rgba(148, 163, 184, 0.2)",
                                },
                                ticks: {
                                  color: "#e5e7eb",
                                  font: { size: 12 },
                                  callback: function (
                                    this: Scale<unknown>,
                                    tickValue: string | number,
                                  ): string | number {
                                    if (typeof tickValue === "number") {
                                      return tickValue.toFixed(4)
                                    }
                                    return tickValue
                                  },
                                },
                              },
                            },
                            interaction: { mode: "index", intersect: false },
                            hover: { mode: "nearest", intersect: true },
                            animation: { duration: 1500, easing: "easeOutQuart" },
                            elements: { line: { tension: 0.4 } },
                          },
                        })
                      }
                    }
                  }}
                />
              )}
            </div>
          </div>

          {/* Status Distribution */}
          <div className="bg-gradient-to-br from-sky-950/40 to-sky-900/20 p-6 rounded-lg border border-sky-800/30 shadow-md">
            <h3 className="text-lg font-medium text-sky-300 mb-2">Status Distribution</h3>
            <div className="h-64">
              <canvas id="statusPieChart"></canvas>
            </div>
          </div>
        </div>

        {/* KPIs Section */}
        <div className="bg-gray-900/80 rounded-xl shadow-xl overflow-hidden p-6 mb-6 border border-gray-700/50 backdrop-blur-sm">
          <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-sky-600 mb-4">
            Key Performance Indicators
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* KS-test & Wasserstein */}
            <div
              className="bg-gradient-to-br from-sky-950/40 to-sky-900/20 p-4 rounded-lg border border-sky-800/30 shadow-md
 hover:shadow-sky-900/20 hover:border-sky-700/50 transition-all relative"
            >
              <button
                onClick={() => setActiveTooltip("kstest")}
                className="absolute top-2 right-2 text-sky-400 hover:text-sky-300 transition-colors"
                aria-label="KS Test Information"
              >
                <HelpCircle className="h-5 w-5" />
              </button>
              <h3 className="text-lg font-medium text-sky-300 mb-2">KStest</h3>
              <div className="flex items-center">
                <div className="w-10 h-10 rounded-full bg-sky-800/40 flex items-center justify-center mr-3">
                  <Info className="h-5 w-5 text-sky-300" />
                </div>
                <p className="text-xl font-semibold text-white">
                  {loading ? "Loading..." : kpis.find((k) => k.rowKey === "kstest")?.value || "N/A"}
                </p>
              </div>
              <div className="mt-4 border-t border-sky-800/30 pt-4">
                <h3 className="text-lg font-medium text-sky-300 mb-2">Wasserstein</h3>
                <div className="flex items-center">
                  <div className="w-10 h-10 rounded-full bg-sky-800/40 flex items-center justify-center mr-3">
                    <Info className="h-5 w-5 text-sky-300" />
                  </div>
                  <p className="text-xl font-semibold text-white">
                    {loading ? "Loading..." : kpis.find((k) => k.rowKey === "wasserstein")?.value || "N/A"}
                  </p>
                </div>
                <button
                  onClick={() => setActiveTooltip("wasserstein")}
                  className="absolute bottom-2 right-2 text-sky-400 hover:text-sky-300 transition-colors"
                  aria-label="Wasserstein Distance Information"
                >
                  <HelpCircle className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* MSE Metrics */}
            <div className="bg-gradient-to-br from-sky-950/40 to-sky-900/20 p-4 rounded-lg border border-sky-800/30 shadow-md hover:shadow-sky-900/20 hover:border-sky-700/50 transition-all">
              <h3 className="text-lg font-medium text-sky-300 mb-2">MSE Metrics</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">Ref MSE:</span>
                  <span className="text-sm font-medium text-white">
                    {loading ? "Loading..." : kpis.find((k) => k.rowKey === "mseRef")?.value || "N/A"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">Curr MSE:</span>
                  <span className="text-sm font-medium text-white">
                    {loading ? "Loading..." : kpis.find((k) => k.rowKey === "mseCurrent")?.value || "N/A"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">Change:</span>
                  <span
                    className={`text-sm font-medium ${calculateMseChange().startsWith("+") ? "text-rose-400" : "text-emerald-400"}`}
                  >
                    {loading ? "Loading..." : calculateMseChange()}
                  </span>
                </div>
                <div className="pt-2 border-t border-sky-800/30">
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
              </div>
            </div>

            {/* Additional Metrics */}
            <div className="bg-gradient-to-br from-sky-950/40 to-sky-900/20 p-4 rounded-lg border border-sky-800/30 shadow-md hover:shadow-sky-900/20 hover:border-sky-700/50 transition-all">
              <h3 className="text-lg font-medium text-sky-300 mb-2">Error Metrics</h3>
              <div className="space-y-4">
                {kpis
                  .filter((k) =>
                    [
                      "Error Percentage Threshold",
                      "Average Percentage Error (All)",
                      "Average Percentage Error (Exceeding)",
                      "Drift Detected",
                    ].includes(k.rowKey),
                  )
                  .map((kpi) => (
                    <div
                      key={kpi.rowKey}
                      className={kpi.rowKey !== kpis[0].rowKey ? "pt-3 border-t border-sky-800/30" : ""}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-400">{kpi.rowKey}:</span>
                        <span
                          className={`text-sm font-medium ${kpi.rowKey === "Drift Detected" ? (kpi.value === "Yes" ? "text-rose-400" : "text-emerald-400") : getStatusColor(kpi.status)}`}
                        >
                          {kpi.value}
                        </span>
                      </div>
                    </div>
                  ))}
                {kpis
                  .filter(
                    (k) =>
                      ![
                        "kstest",
                        "wasserstein",
                        "mseRef",
                        "mseCurrent",
                        "status",
                        "Error Percentage Threshold",
                        "Average Percentage Error (All)",
                        "Average Percentage Error (Exceeding)",
                        "Drift Detected",
                      ].includes(k.rowKey),
                  )
                  .map((kpi) => (
                    <div key={kpi.rowKey} className="pt-3 border-t border-sky-800/30">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-400">{kpi.rowKey}:</span>
                        <span className={`text-sm font-medium ${getStatusColor(kpi.status)}`}>{kpi.value}</span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>

        {/* Error Tables Section */}
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
                    {errors.tableData
                      .slice()
                      // Filter out duplicate IDs, keeping only the first occurrence
                      .filter((row, index, self) => index === self.findIndex((r) => r.id === row.id))
                      .sort((a, b) => (b.difference ?? 0) - (a.difference ?? 0))
                      .map((row: TableDataPoint, i: number) => (
                        <tr key={row.id} className="hover:bg-gray-700/30 transition-colors duration-150">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">{i + 1}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">{row.id}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-sky-400 font-medium">
                            {(row.abs_curr_per ?? 0).toFixed(2)}
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
              Threshold Exceedances{" "}
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
              <canvas id="errorRangeChart" width={800} height={320}></canvas>
            )}
          </div>

          {/* Selected Range Data Table */}
          {selectedRange && (
            <div className="mt-4">
              <h3 className="text-xl font-medium text-sky-300 mb-3">
                IDs in {selectedRange} Error Range
                <button
                  onClick={() => setSelectedRange(null)}
                  className="ml-2 text-sky-400 hover:text-sky-300"
                  aria-label="Close details"
                >
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
                      {selectedRangeOutlets.map((outlet: AllOutlets) => (
                        <tr key={outlet.id} className="hover:bg-sky-900/20 transition-colors duration-150">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">{outlet.id}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                            {outlet.y_true.toFixed(2)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                            {outlet.y_pred.toFixed(2)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-sky-400 font-medium">
                            {outlet.percentage_error.toFixed(2)}%
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

        {/* XAI Result Section */}
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
      {/* Tooltip Popup */}
      {activeTooltip && <TooltipPopup type={activeTooltip} onClose={() => setActiveTooltip(null)} />}
    </div>
  )
}
