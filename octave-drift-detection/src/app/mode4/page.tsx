"use client"

import type React from "react"
import { useEffect, useState } from "react"
import D3ConfusionMatrix from "../../components/D3ConfusionMatrix"
import DriftWarningChart from "../mode2/DriftWarningChart"
import ReactMarkdown from "react-markdown"
import { AlertCircle, AlertTriangle, CheckCircle, RefreshCw, Info } from "lucide-react"
import { Chart, registerables } from "chart.js"
import { useSearchParams } from "next/navigation"
import { fetchData, type KPI, type PlotDataPoint, type TableDataPoint } from "../../services/backendService3"
import { fetchEntriesTable } from "../../services/dashboardService"

Chart.register(...registerables)

// Define the entry table interface
interface EntryTableItem {
  BusinessUnit: string
  useCase: string
  ShortCode: string
  Runtime: string
  alertKeeper: string
}

interface DetailedMetric {
  total_samples: number
  correct_predictions: { count: number; percentage: number }
  incorrect_predictions: { count: number; percentage: number }
  misclassifications: Record<string, { count: number; percentage: number }>
}

export default function Mode4Page(): React.ReactElement {
  const searchParams = useSearchParams()
  const businessUnitParam = searchParams.get("businessUnit") || ""
  const useCaseParam = searchParams.get("useCase") || ""
  const alertKeeperParam  = searchParams.get("alertKeeper") || ""

  // --- FILTER STATES ---
  const [businessUnit, setBusinessUnit] = useState("")
  const [useCase, setUseCase] = useState("")
  const [shortCode, setShortCode] = useState("")
  const [alertKeeperValue, setAlertKeeperValue] = useState<string>(alertKeeperParam)


  // Entries state (fetched via dashboardService)
  const [entries, setEntries] = useState<EntryTableItem[]>([])
  const [runtimeValue, setRuntimeValue] = useState<string>("")
  const [runtimeOptions, setRuntimeOptions] = useState<string[]>([])

  // --- CORE DATA STATES ---
  const [kpis, setKpis] = useState<KPI[]>([])
  const [errors, setErrors] = useState<{
    plotData: PlotDataPoint[]
    tableData: TableDataPoint[]
  }>({ plotData: [], tableData: [] })
  const [referenceMatrix, setReferenceMatrix] = useState<number[][]>([])
  const [currentMatrix, setCurrentMatrix] = useState<number[][]>([])
  const [detailedMetrics, setDetailedMetrics] = useState<Record<string, DetailedMetric>>({})
  const [xaiExplanation, setXaiExplanation] = useState("No explanation available")
  const [backendError, setBackendError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  // --- TABS & PIE STATES ---
  const [activeTab, setActiveTab] = useState<"errorByClass" | "driftStates">("errorByClass")
  const [selectedClass, setSelectedClass] = useState("")

  // --- KPI EXCLUSION LIST ---
  const excludedKPIs = [
    "Jensen–Shannon Divergence",
    "Population Stability Index",
    "Precision (Reference)",
    "Precision (Current)",
    "Recall (Reference)",
    "Recall (Current)",
    "F1 Score (Reference)",
    "F1 Score (Current)",
  ]

  // --- HELPERS ---
  const makeLabels = (n: number) => Array.from({ length: n }, (_, i) => i.toString())
  const computeSquareSize = (grid: number[][]) => {
    const maxPx = 300
    const rows = grid.length
    const cols = grid[0]?.length || 0
    if (!rows || !cols) return maxPx
    const cellSize = Math.min(maxPx / rows, maxPx / cols)
    return Math.max(rows, cols) * cellSize
  }
  const getStatusIcon = (s?: string) => {
    if (!s) return <Info className="h-5 w-5 text-gray-400" />
    switch (s.toLowerCase()) {
      case "warning":
        return <AlertTriangle className="h-5 w-5 text-amber-400" />
      case "error":
        return <AlertCircle className="h-5 w-5 text-rose-500" />
      case "success":
      case "normal":
        return <CheckCircle className="h-5 w-5 text-emerald-400" />
      default:
        return <Info className="h-5 w-5 text-sky-400" />
    }
  }
  const getStatusColor = (s?: string) => {
    if (!s) return "text-gray-400"
    switch (s.toLowerCase()) {
      case "warning":
        return "text-amber-400"
      case "error":
        return "text-rose-500"
      case "success":
      case "normal":
        return "text-emerald-400"
      default:
        return "text-sky-400"
    }
  }

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


  // --- FETCH DATA ---
  const fetchAllData = async () => {
    setLoading(true)
    setBackendError(null)
    try {
      const data = await fetchData({ runtime: runtimeValue })

      setKpis(data.kpis)
      setErrors(data.errors)
      setReferenceMatrix(data.referenceMatrix)
      setCurrentMatrix(data.currentMatrix)
      setDetailedMetrics(data.detailedMetrics)
      setXaiExplanation(data.xaiExplanation)

      const classes = Object.keys(data.detailedMetrics)
      if (classes.length) setSelectedClass(classes[0])
    } catch (err) {
      console.error(err)
      setBackendError(err instanceof Error ? err.message : "Unknown error")
    } finally {
      setLoading(false)
    }
  }

  // 3) Fetch dynamic data when runtimeValue changes
  useEffect(() => {
    if (runtimeValue) {
      fetchAllData()
    }
  }, [runtimeValue])

  // --- PIE CHARTS EFFECT ---
  useEffect(() => {
    if (loading) return

    if (activeTab === "errorByClass") {
      const ctx = document.getElementById("errorClassPieChart") as HTMLCanvasElement
      if (!ctx) return
      Chart.getChart(ctx)?.destroy()

      const classes = Object.keys(detailedMetrics)
      const data = classes.map((cls) => detailedMetrics[cls].incorrect_predictions.percentage)
      const colors = classes.map((_, i) => `hsl(${(i * 360) / classes.length}, 70%, 50%)`)

      new Chart(ctx, {
        type: "pie",
        data: {
          labels: classes,
          datasets: [{ data, backgroundColor: colors, borderColor: colors, borderWidth: 1 }],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: "right", labels: { color: "#e5e7eb", font: { size: 12 } } },
            tooltip: { callbacks: { label: (c) => `${c.label}: ${c.raw.toFixed(1)}%` } },
          },
        },
      })
    }

    if (activeTab === "driftStates") {
      const ctx = document.getElementById("driftPieChart") as HTMLCanvasElement
      if (!ctx) return
      Chart.getChart(ctx)?.destroy()

      const counts = errors.plotData.reduce(
        (acc, p) => {
          const s = (p as any).state?.toLowerCase()
          if (s === "warning") acc.warning++
          else if (s === "drift") acc.drift++
          else acc.normal++
          return acc
        },
        { normal: 0, warning: 0, drift: 0 },
      )
      const total = counts.normal + counts.warning + counts.drift || 1
      const data = [(counts.normal / total) * 100, (counts.warning / total) * 100, (counts.drift / total) * 100].map(
        (v) => +v.toFixed(1),
      )

      new Chart(ctx, {
        type: "pie",
        data: {
          labels: ["Normal", "Warning", "Drift"],
          datasets: [
            {
              data,
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
            legend: { position: "right", labels: { color: "#e5e7eb", font: { size: 12 } } },
            tooltip: { callbacks: { label: (c) => `${c.label}: ${c.raw}%` } },
          },
        },
      })
    }
  }, [loading, activeTab, detailedMetrics, errors.plotData])

  return (
    <div className="bg-gradient-to-b from-gray-950 to-gray-900 min-h-screen flex flex-col">
      <title>Mode 4 | CL Dashboard</title>
      <main className="flex-grow container mx-auto px-4 py-8 space-y-6">
        {backendError && (
          <div className="bg-rose-950/40 border border-rose-800/60 rounded-lg p-4">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-rose-400 mr-2" />
              <p className="text-rose-300">{backendError}</p>
            </div>
            <button
              onClick={fetchAllData}
              className="mt-2 inline-flex items-center gap-2 px-4 py-2 bg-rose-800/50 text-white rounded text-sm"
            >
              <RefreshCw className="h-4 w-4" /> Retry
            </button>
          </div>
        )}

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-sky-600">
            OCTAVE – CL Dashboard
          </h1>
          <button
            onClick={fetchAllData}
            className="inline-flex items-center gap-2 px-4 py-2 bg-sky-800/40 text-white rounded-md text-sm"
          >
            <RefreshCw className="h-4 w-4" /> Refresh
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 bg-gradient-to-br from-sky-950/40 to-sky-900/20 p-6 rounded-lg border border-sky-800/30">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-sky-300">Business Unit:</p>
                <p className="text-lg text-white">{loading ? "…" : businessUnit || "Not Selected"}</p>
                <p className="mt-4 text-sm text-sky-300">Use Case:</p>
                <p className="text-lg text-white">{loading ? "…" : useCase || "Not Selected"}</p>
              </div>
              <div>
                <p className="text-sm text-sky-300">Short Code:</p>
                <p className="text-lg text-white">{loading ? "…" : shortCode || "Not Available"}</p>
                <p className="mt-4 text-sm text-sky-300">Alert Keeper:</p>
                <p className="text-lg text-white">{loading ? "…" : alertKeeperValue || "Not Selected"}</p>
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-sky-950/40 to-sky-900/20 p-6 rounded-lg border border-sky-800/30">
            <p className="text-sm text-sky-300">Runtime</p>
            <select
              className="mt-1 w-full bg-gray-800/80 border border-sky-700/50 rounded-md p-2 text-white"
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

        {/* Drift & Warning / Status Distribution */}
        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-2 bg-gray-900/80 rounded-xl shadow-xl p-6 border border-gray-700/50">
            <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-sky-600 mb-4">
              Drift & Warning Over Time
            </h2>
            <div className="bg-gray-800/60 rounded-lg p-4 border border-gray-700/50 h-80">
              {!loading ? (
                <DriftWarningChart plotData={errors.plotData} />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <RefreshCw className="animate-spin h-8 w-8 text-sky-500" />
                </div>
              )}
            </div>
          </div>

          <div className="col-span-1 bg-gray-900/80 rounded-xl shadow-xl p-6 border border-gray-700/50">
            <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-sky-600 mb-4">
              Status Distribution
            </h2>
            <div className="flex border-b border-gray-700/50 mb-4">
              <button
                onClick={() => setActiveTab("errorByClass")}
                className={`px-3 py-1 -mb-px ${
                  activeTab === "errorByClass" ? "border-b-2 border-cyan-400 text-cyan-400" : "text-gray-400"
                }`}
              >
                Errors
              </button>
              <button
                onClick={() => setActiveTab("driftStates")}
                className={`ml-3 px-3 py-1 -mb-px ${
                  activeTab === "driftStates" ? "border-b-2 border-cyan-400 text-cyan-400" : "text-gray-400"
                }`}
              >
                States
              </button>
            </div>

            {activeTab === "errorByClass" ? (
              <>
                <select
                  className="mb-4 w-full bg-gray-800/80 border border-sky-700/50 rounded-md p-2 text-white"
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                >
                  {Object.keys(detailedMetrics).map((cls) => (
                    <option key={cls} value={cls}>
                      {cls}
                    </option>
                  ))}
                </select>
                <div className="w-70 h-70 mx-auto">
                  <canvas id="errorClassPieChart"></canvas>
                </div>
              </>
            ) : (
              <div className="w-70 h-70 mx-auto">
                <canvas id="driftPieChart"></canvas>
              </div>
            )}
          </div>
        </div>

        {/* KPI Section */}
        <div className="bg-gray-900/80 rounded-xl shadow-xl overflow-hidden p-6 mb-6 border border-gray-700/50">
          <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-sky-600 mb-4">
            Key Performance Indicators
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {kpis
              .filter((kpi) => !excludedKPIs.includes(kpi.rowKey))
              .map((kpi) => (
                <div
                  key={kpi.rowKey}
                  className="bg-gradient-to-br from-sky-950/40 to-sky-900/20 p-4 rounded-lg border border-sky-800/30 shadow-md hover:shadow-sky-900/20 hover:border-sky-700/50 transition"
                >
                  <h3 className="text-lg font-medium text-sky-300 mb-2">{kpi.rowKey}</h3>
                  <div className="flex items-center">
                    <div className="w-10 h-10 rounded-full bg-sky-800/40 flex items-center justify-center mr-3">
                      {getStatusIcon(kpi.status)}
                    </div>
                    <p className={`text-xl font-semibold ${getStatusColor(kpi.status)}`}>{loading ? "…" : kpi.value}</p>
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* Reference Matrix */}
        <div className="bg-gray-900/80 rounded-xl shadow-xl p-6 mb-6 border border-gray-700/50 backdrop-blur-sm flex flex-col items-center">
          <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-sky-600 mb-4">
            Reference Matrix
          </h2>
          {!loading && referenceMatrix.length ? (
            <div
              className="bg-gray-800/60 rounded-lg p-4 border border-gray-700/50"
              style={{
                width: computeSquareSize(referenceMatrix) + 40,
                height: computeSquareSize(referenceMatrix) + 40,
              }}
            >
              <div
                style={{
                  width: computeSquareSize(referenceMatrix),
                  height: computeSquareSize(referenceMatrix),
                }}
              >
                <D3ConfusionMatrix
                  data={referenceMatrix}
                  labels={makeLabels(referenceMatrix[0].length)}
                  width={computeSquareSize(referenceMatrix)}
                  height={computeSquareSize(referenceMatrix)}
                />
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-64 w-full bg-gray-800/60 rounded-lg border border-gray-700/50">
              <RefreshCw className="animate-spin h-8 w-8 text-sky-500" />
            </div>
          )}
        </div>

        {/* Detailed Metrics */}
        <div className="bg-gray-900/80 rounded-xl shadow-xl overflow-hidden p-6 mb-6 border border-gray-700/50 backdrop-blur-sm">
          <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-sky-600 mb-4">
            Detailed Metrics by Class
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
                    <tr key={cls} className="hover:bg-gray-700/30 transition-colors duration-150">
                      <td className="px-6 py-4 text-sm font-medium text-white">{cls}</td>
                      <td className="px-6 py-4 text-sm text-gray-300">{dm.total_samples}</td>
                      <td className="px-6 py-4 text-sm text-emerald-400">
                        {dm.correct_predictions.count}{" "}
                        <span className="text-gray-400">({dm.correct_predictions.percentage.toFixed(1)}%)</span>
                      </td>
                      <td className="px-6 py-4 text-sm text-rose-400">
                        {dm.incorrect_predictions.count}{" "}
                        <span className="text-gray-400">({dm.incorrect_predictions.percentage.toFixed(1)}%)</span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-300">
                        {Object.entries(dm.misclassifications)
                          .map(
                            ([p, m]) => `${p}: ${m.count}${m.percentage > 0 ? ` (${m.percentage.toFixed(1)}%)` : ""}`,
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
        <div className="bg-gray-900/80 rounded-xl shadow-xl overflow-hidden p-6 border border-gray-700/50 backdrop-blur-sm">
          <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-sky-600 mb-4">
            XAI Result
          </h2>
          <div className="bg-gray-800/60 rounded-lg p-6 border border-gray-700/50">
            {loading ? (
              <div className="flex justify-center py-8">
                <RefreshCw className="animate-spin h-8 w-8 text-sky-500" />
              </div>
            ) : (
              <div className="prose prose-invert prose-sky max-w-none">
                <ReactMarkdown>{xaiExplanation}</ReactMarkdown>
              </div>
            )}
          </div>
        </div>

        {/* Misclassified Table */}
        <div className="bg-gray-900/80 rounded-xl shadow-xl overflow-hidden p-6 border border-gray-700/50 backdrop-blur-sm max-h-96 overflow-y-auto">
          <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-sky-600 mb-4">
            Misclassified Table
          </h2>
          {loading ? (
            <div className="flex justify-center py-12">
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
                      True → Pred
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-gray-800/30 divide-y divide-gray-700/50">
                  {errors.tableData.length > 0 ? (
                    errors.tableData.map((r, i) => (
                      <tr key={i} className="hover:bg-rose-900/20 transition-colors duration-150">
                        <td className="px-6 py-4 text-sm font-medium text-white">{r.id}</td>
                        <td className="px-6 py-4 text-sm text-rose-300">{r.timePeriod}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={2} className="px-6 py-4 text-center text-sm text-gray-400">
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
  )
}
