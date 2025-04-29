"use client"

import type React from "react"
import { useEffect, useState } from "react"
import Head from "next/head"
import D3ConfusionMatrix from "../../components/D3ConfusionMatrix"
import DriftWarningChart from "../mode2/DriftWarningChart"
import ReactMarkdown from "react-markdown"
import { AlertCircle, AlertTriangle, CheckCircle, RefreshCw, Info } from "lucide-react"
import { fetchData, type KPI, type PlotDataPoint, type TableDataPoint } from "../../services/backendService3"

interface DetailedMetric {
  total_samples: number
  correct_predictions: { count: number; percentage: number }
  incorrect_predictions: { count: number; percentage: number }
  misclassifications: Record<string, { count: number; percentage: number }>
}

export default function Mode4Page(): React.ReactElement {
  // --- STATE HOOKS ---
  const [businessUnit, setBusinessUnit] = useState<string>("")
  const [useCase, setUseCase] = useState<string>("")
  const useCases: Record<string, string[]> = {
    CCS: ["CC-Di", "CC-MT"],
    JMSL: ["JM-Ch"],
  }

  const handleBusinessUnitChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setBusinessUnit(e.target.value)
    setUseCase("")
  }
  const handleUseCaseChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setUseCase(e.target.value)
  }

  const [kpis, setKpis] = useState<KPI[]>([])
  const [errors, setErrors] = useState<{ plotData: PlotDataPoint[]; tableData: TableDataPoint[] }>({
    plotData: [],
    tableData: [],
  })
  const [referenceMatrix, setReferenceMatrix] = useState<number[][]>([])
  const [currentMatrix, setCurrentMatrix] = useState<number[][]>([])
  const [detailedMetrics, setDetailedMetrics] = useState<Record<string, DetailedMetric>>({})

  const [stateVal, setStateVal] = useState<string>("Unknown")
  const [coverage, setCoverage] = useState<any>({})
  const [clusters, setClusters] = useState<any>({})
  const [backwardAnalysis, setBackwardAnalysis] = useState<any>({})
  const [currentPeriod, setCurrentPeriod] = useState<string>("N/A")
  const [totalOutlets, setTotalOutlets] = useState<number>(0)
  const [outletsExceedingThresholdCount, setOutletsExceedingThresholdCount] = useState<number>(0)
  const [xaiExplanation, setXaiExplanation] = useState<string>("No explanation available")
  const [backendError, setBackendError] = useState<string | null>(null)

  const [loading, setLoading] = useState<boolean>(true)

  // build labels ["0","1",…] for axes
  const makeLabels = (n: number) => Array.from({ length: n }, (_, i) => i.toString())

  // cap matrix square at 300px
  const computeSquareSize = (grid: number[][]) => {
    const maxPx = 300
    const rows = grid.length
    const cols = grid[0]?.length || 0
    if (!rows || !cols) return maxPx
    const cellSize = Math.min(maxPx / rows, maxPx / cols)
    return Math.max(rows, cols) * cellSize
  }

  // Helper function to get status color
  const getStatusColor = (status: string | undefined) => {
    if (!status) return "text-gray-400"
    switch (status.toLowerCase()) {
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

  // Helper function to get status icon
  const getStatusIcon = (status: string | undefined) => {
    if (!status) return <Info className="h-5 w-5 text-gray-400" />
    switch (status.toLowerCase()) {
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

  // derived KPIs
  const derivedKpis: KPI[] = [
    {
      rowKey: "Drift Detected",
      value: outletsExceedingThresholdCount === 0 ? "No" : "Yes",
      status: outletsExceedingThresholdCount === 0 ? "Normal" : "Warning",
    },
    {
      rowKey: "Accuracy",
      value: kpis.find((k) => k.rowKey.toLowerCase() === "accuracy")?.value ?? "N/A",
      status: "Normal",
    },
    {
      rowKey: "Error Rate",
      value: (() => {
        const acc = Number.parseFloat(kpis.find((k) => k.rowKey.toLowerCase() === "accuracy")?.value ?? "")
        return !isNaN(acc) ? (100 - acc).toFixed(2) : "N/A"
      })(),
      status: "Normal",
    },
    {
      rowKey: "Status",
      value: stateVal,
      status: stateVal === "Normal" ? "Normal" : "Warning",
    },
  ]

  // merge without duplicates
  const mergedKpis: KPI[] = [...kpis]
  derivedKpis.forEach((d) => {
    if (!mergedKpis.find((k) => k.rowKey === d.rowKey)) mergedKpis.push(d)
  })

  // --- FETCH DATA ---
  const initData = async () => {
    setLoading(true)
    setBackendError(null)
    try {
      const {
        kpis: fetchedKpis,
        errors: fetchedErrors,
        referenceMatrix: fetchedRefM,
        currentMatrix: fetchedCurrM,
        detailedMetrics: fetchedDetailed,
        state: fetchedState,
        coverage: fetchedCoverage,
        clusters: fetchedClusters,
        backwardAnalysis: fetchedBackward,
        currentPeriod: fetchedPeriod,
        totalOutlets: fetchedTotal,
        outletsExceedingThresholdCount: fetchedCount,
        xaiExplanation: fetchedXai,
      } = await fetchData()

      setKpis(fetchedKpis)
      setErrors(fetchedErrors)
      setReferenceMatrix(fetchedRefM)
      setCurrentMatrix(fetchedCurrM)
      setDetailedMetrics(fetchedDetailed)
      setStateVal(fetchedState)
      setCoverage(fetchedCoverage)
      setClusters(fetchedClusters)
      setBackwardAnalysis(fetchedBackward)
      setCurrentPeriod(fetchedPeriod)
      setTotalOutlets(fetchedTotal)
      setOutletsExceedingThresholdCount(fetchedCount)
      setXaiExplanation(fetchedXai)
    } catch (err) {
      console.error("Error fetching data:", err)
      setBackendError(
        err instanceof Error ? `Failed to load data: ${err.message}` : "Failed to load data: Unknown error",
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    initData()
  }, [])

  // filter out N/A values for display
  const displayedKpis = mergedKpis.filter((k) => k.value !== "N/A")

  return (
    <div className="bg-gradient-to-b from-gray-950 to-gray-900 min-h-screen flex flex-col">
      <Head>
        <title>Mode 4 | CL Dashboard</title>
      </Head>
      <main className="flex-grow container mx-auto px-4 py-8">
        {/* Backend Error Fallback */}
        {backendError && (
          <div className="bg-rose-950/40 border border-rose-800/60 rounded-lg p-4 mb-6 backdrop-blur-sm shadow-lg animate-fade-in">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-rose-400 mr-2" />
              <h3 className="text-lg font-medium text-rose-300">Backend Error</h3>
            </div>
            <p className="mt-2 text-rose-200">{backendError}</p>
            <p className="mt-2 text-rose-200/80 text-sm">Displaying fallback data. Some features may be limited.</p>
            <button
              onClick={initData}
              className="mt-3 px-4 py-2 bg-rose-800/50 hover:bg-rose-700/70 text-white rounded-md text-sm font-medium transition-colors duration-200 flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Retry Connection
            </button>
          </div>
        )}

        {/* Header Section */}
        <div className="bg-gray-900/80 rounded-xl shadow-xl overflow-hidden p-6 mb-6 border border-gray-700/50 backdrop-blur-sm">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
            <div>
              <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-sky-600 mb-2">
                OCTAVE - CL Dashboard
              </h2>
              <p className="text-sky-300 flex items-center gap-2">
                <span className="inline-block h-2 w-2 rounded-full bg-sky-400 animate-pulse"></span>
                Current Period: {loading ? "Loading..." : currentPeriod}
              </p>
            </div>
            <button
              onClick={initData}
              className="mt-4 md:mt-0 px-4 py-2 bg-sky-800/40 hover:bg-sky-700/60 text-white rounded-md text-sm font-medium transition-colors duration-200 flex items-center gap-2 self-start"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh Data
            </button>
          </div>

          {/* Business Unit / Use Case */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-gradient-to-br from-sky-950/40 to-sky-900/20 p-4 rounded-lg border border-sky-800/30 shadow-md">
              <h3 className="text-lg font-medium text-sky-300 mb-2 flex items-center gap-2">
                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-sky-800/40 text-xs">
                  1
                </span>
                Business Unit
              </h3>
              <select
                className="w-full bg-gray-800/80 border border-sky-700/50 rounded-md p-2 text-white focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all duration-200"
                value={businessUnit}
                onChange={handleBusinessUnitChange}
              >
                <option value="">Select Business Unit</option>
                {Object.keys(useCases).map((bu) => (
                  <option key={bu} value={bu}>
                    {bu}
                  </option>
                ))}
              </select>
            </div>
            <div className="bg-gradient-to-br from-sky-950/40 to-sky-900/20 p-4 rounded-lg border border-sky-800/30 shadow-md">
              <h3 className="text-lg font-medium text-sky-300 mb-2 flex items-center gap-2">
                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-sky-800/40 text-xs">
                  2
                </span>
                Use Case
              </h3>
              <select
                className="w-full bg-gray-800/80 border border-sky-700/50 rounded-md p-2 text-white focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all duration-200"
                value={useCase}
                onChange={handleUseCaseChange}
                disabled={!businessUnit}
              >
                <option value="">{businessUnit ? "Select Use Case" : "Select BU first"}</option>
                {(useCases[businessUnit] || []).map((uc) => (
                  <option key={uc} value={uc}>
                    {uc}
                  </option>
                ))}
              </select>
            </div>
            <div className="bg-gradient-to-br from-sky-950/40 to-sky-900/20 p-4 rounded-lg border border-sky-800/30 shadow-md">
              <h3 className="text-lg font-medium text-sky-300 mb-2 flex items-center gap-2">
                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-sky-800/40 text-xs">
                  3
                </span>
                Short Code
              </h3>
              <div className="w-full bg-gray-800/80 border border-sky-700/50 rounded-md p-2 text-white">
                {businessUnit && useCase ? `${businessUnit.substring(0, 2)}-${useCase.substring(0, 2)}` : "-"}
              </div>
            </div>
            <div className="bg-gradient-to-br from-sky-950/40 to-sky-900/20 p-4 rounded-lg border border-sky-800/30 shadow-md">
              <h3 className="text-lg font-medium text-sky-300 mb-2 flex items-center gap-2">
                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-sky-800/40 text-xs">
                  4
                </span>
                Runtime
              </h3>
              <div className="w-full bg-gray-800/80 border border-sky-700/50 rounded-md p-2 text-white flex items-center">
                <span className="inline-block h-2 w-2 rounded-full bg-emerald-400 mr-2"></span>
                2h 45m
              </div>
            </div>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gradient-to-br from-sky-950/40 to-sky-900/20 p-4 rounded-lg border border-sky-800/30 shadow-md transition-all duration-300 hover:shadow-sky-900/20 hover:border-sky-700/50">
              <h3 className="text-lg font-medium text-sky-300 mb-2">Current Alert Time</h3>
              <div className="flex items-center">
                <div className="w-10 h-10 rounded-full bg-sky-800/40 flex items-center justify-center mr-3">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 text-sky-300"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <p className="text-xl font-semibold text-white">
                  {loading ? "Loading..." : kpis.find((k) => k.rowKey === "alertTime")?.value || "N/A"}
                </p>
              </div>
            </div>
            <div className="bg-gradient-to-br from-sky-950/40 to-sky-900/20 p-4 rounded-lg border border-sky-800/30 shadow-md transition-all duration-300 hover:shadow-sky-900/20 hover:border-sky-700/50">
              <h3 className="text-lg font-medium text-sky-300 mb-2">No. of Runtime</h3>
              <div className="flex items-center">
                <div className="w-10 h-10 rounded-full bg-sky-800/40 flex items-center justify-center mr-3">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 text-sky-300"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                    />
                  </svg>
                </div>
                <p className="text-xl font-semibold text-white">
                  {loading ? "Loading..." : kpis.find((k) => k.rowKey === "runtimeCount")?.value || "0"}
                </p>
              </div>
            </div>
            <div className="bg-gradient-to-br from-sky-950/40 to-sky-900/20 p-4 rounded-lg border border-sky-800/30 shadow-md transition-all duration-300 hover:shadow-sky-900/20 hover:border-sky-700/50">
              <h3 className="text-lg font-medium text-sky-300 mb-2">Alert Keeper</h3>
              <div className="flex items-center">
                <div className="w-10 h-10 rounded-full bg-sky-800/40 flex items-center justify-center mr-3">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 text-sky-300"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                </div>
                <p className="text-xl font-semibold text-white">
                  {loading ? "Loading..." : kpis.find((k) => k.rowKey === "alertKeeper")?.value || "N/A"}
                </p>
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
            {displayedKpis.map((kpi) => (
              <div
                key={kpi.rowKey}
                className="bg-gradient-to-br from-sky-950/40 to-sky-900/20 p-4 rounded-lg border border-sky-800/30 shadow-md transition-all duration-300 hover:shadow-sky-900/20 hover:border-sky-700/50"
              >
                <h3 className="text-lg font-medium text-sky-300 mb-2">{kpi.rowKey}</h3>
                <div className="flex items-center">
                  <div className="w-10 h-10 rounded-full bg-sky-800/40 flex items-center justify-center mr-3">
                    {getStatusIcon(kpi.status)}
                  </div>
                  <p className={`text-xl font-semibold ${getStatusColor(kpi.status)}`}>
                    {loading ? "Loading..." : kpi.value}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Drift & Warning Chart */}
        <div className="bg-gray-900/80 rounded-xl shadow-xl overflow-hidden p-6 mb-6 border border-gray-700/50 backdrop-blur-sm">
          <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-sky-600 mb-4">
            Drift & Warning Over Time
          </h2>
          <div className="bg-gray-800/60 rounded-lg p-4 border border-gray-700/50 h-72">
            {!loading ? (
              <DriftWarningChart plotData={errors.plotData} />
            ) : (
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
            )}
          </div>
        </div>

        {/* Confusion Matrices */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {[{ title: "Current Matrix", grid: referenceMatrix }].map(({ title, grid }, idx) => {
            const side = computeSquareSize(grid)
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
                      <D3ConfusionMatrix data={grid} labels={makeLabels(grid[0].length)} width={side} height={side} />
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
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      <div className="text-sky-300">Loading matrix data...</div>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Detailed Metrics */}
        <div className="bg-gray-900/80 rounded-xl shadow-xl overflow-hidden p-6 mb-6 border border-gray-700/50 backdrop-blur-sm">
          <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-sky-600 mb-4">
            Detailed Metrics by Class
          </h2>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex flex-col items-center">
                <svg
                  className="animate-spin h-8 w-8 text-sky-500 mb-2"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                <div className="text-sky-300">Loading metrics data...</div>
              </div>
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
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">{cls}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{dm.total_samples}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-emerald-400">
                        {dm.correct_predictions.count}{" "}
                        <span className="text-gray-400">({dm.correct_predictions.percentage.toFixed(1)}%)</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-rose-400">
                        {dm.incorrect_predictions.count}{" "}
                        <span className="text-gray-400">({dm.incorrect_predictions.percentage.toFixed(1)}%)</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        {Object.entries(dm.misclassifications)
                          .map(
                            ([p, m]) => `${p}: ${m.count} ${m.percentage > 0 ? `(${m.percentage.toFixed(1)}%)` : ""}`,
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
                  <div className="text-sky-300">Loading XAI explanation...</div>
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
