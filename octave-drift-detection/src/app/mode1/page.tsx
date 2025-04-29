"use client"
import type React from "react"
import { useEffect, useState, useRef } from "react"
import Head from "next/head"
import ReactMarkdown from "react-markdown"
import { Chart, registerables } from "chart.js"
Chart.register(...registerables)
import { fetchData } from "../../services/backendService"
import { AlertCircle, AlertTriangle, CheckCircle, RefreshCw, Info } from "lucide-react"

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
}

interface OutletsExceedingThreshold {
  id: string
  y_true: number
  y_pred: number
  percentage_error: number
}

interface ErrorDataState {
  plotData: PlotDataPoint[]
  tableData: TableDataPoint[]
}

export default function Mode1Page(): JSX.Element {
  const chartRef = useRef<Chart | null>(null)
  const [kpis, setKpis] = useState<KPI[]>([])
  const [errors, setErrors] = useState<ErrorDataState>({ plotData: [], tableData: [] })
  const [outletsExceedingThreshold, setOutletsExceedingThreshold] = useState<OutletsExceedingThreshold[]>([])
  const [currentPeriod, setCurrentPeriod] = useState<string>("Loading...")
  const [xaiExplanation, setXaiExplanation] = useState<string>("No explanation available")
  const [loading, setLoading] = useState<boolean>(true)
  const [backendError, setBackendError] = useState<string | null>(null)

  // New state for Business Unit and Use Case
  const [businessUnit, setBusinessUnit] = useState<string>("")
  const [useCase, setUseCase] = useState<string>("")
  const useCases: Record<string, string[]> = {
    CCS: ["CC-Di", "CC-MT"],
    JMSL: ["JM-Ch"],
  }

  const handleBusinessUnitChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const v = e.target.value
    setBusinessUnit(v)
    setUseCase("")
  }

  const handleUseCaseChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setUseCase(e.target.value)
  }

  // Fetch Data from Backend
  const initData = async (): Promise<void> => {
    setLoading(true)
    setBackendError(null)
    try {
      const {
        kpis: fetchedKpis,
        errors: fetchedErrors,
        outletsExceedingThreshold: fetchedOutlets,
        xaiExplanation: fetchedXai,
        currentPeriod: fetchedPeriod,
      } = await fetchData()

      setKpis(fetchedKpis)
      setErrors(fetchedErrors)
      setOutletsExceedingThreshold(fetchedOutlets)
      setXaiExplanation(fetchedXai || "No explanation available")
      setCurrentPeriod(fetchedPeriod || "N/A")
    } catch (error) {
      console.error("Error fetching data:", error)
      if (error instanceof Error) {
        setBackendError(`Failed to load data: ${error.message}`)
      } else {
        setBackendError("Failed to load data: Unknown error")
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    initData()
  }, [])

  // Helper function to get status color
  const getStatusColor = (status: string | undefined) => {
    if (!status) return "text-gray-400"
    switch (status.toLowerCase()) {
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

  // Helper function to get status icon
  const getStatusIcon = (status: string | undefined) => {
    if (!status) return <Info className="h-5 w-5 text-gray-400" />
    switch (status.toLowerCase()) {
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

  return (
    <div className="bg-gradient-to-b from-gray-950 to-gray-900 min-h-screen flex flex-col">
      <Head>
        <title>Mode 1 | Business Dashboard</title>
      </Head>
      <main className="flex-grow container mx-auto px-4 py-8">
        {/* Backend Error */}
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
                OCTAVE - RG Dashboard
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

          {/* Business Unit / Use Case Selector */}
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
                <option value="CCS">CCS</option>
                <option value="JMSL">JMSL</option>
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
                <option value="">Select Use Case</option>
                {businessUnit &&
                  useCases[businessUnit]?.map((option) => (
                    <option key={option} value={option}>
                      {option}
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

        {/* KPIs Section */}
        <div className="bg-gray-900/80 rounded-xl shadow-xl overflow-hidden p-6 mb-6 border border-gray-700/50 backdrop-blur-sm">
          <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-sky-600 mb-4">
            Key Performance Indicators
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {[
              { title: "KStest", key: "kstest", icon: "chart-bar" },
              { title: "Wasserstein", key: "wasserstein", icon: "chart-pie" },
              { title: "Ref MSE", key: "mseRef", icon: "chart-square-bar" },
              { title: "MSE", key: "mseCurrent", icon: "chart-square" },
              { title: "Status", key: "status", icon: "status" },
            ].map((item, index) => {
              const kpi = kpis.find((k) => k.rowKey === item.key)
              const isStatus = item.key === "status"
              const statusClass = isStatus ? getStatusColor(kpi?.value) : "text-white"

              return (
                <div
                  key={index}
                  className="bg-gradient-to-br from-sky-950/40 to-sky-900/20 p-4 rounded-lg border border-sky-800/30 shadow-md transition-all duration-300 hover:shadow-sky-900/20 hover:border-sky-700/50"
                >
                  <h3 className="text-lg font-medium text-sky-300 mb-2">{item.title}</h3>
                  <div className="flex items-center">
                    <div className="w-10 h-10 rounded-full bg-sky-800/40 flex items-center justify-center mr-3">
                      {isStatus ? (
                        getStatusIcon(kpi?.value)
                      ) : (
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
                      )}
                    </div>
                    <p className={`text-xl font-semibold ${statusClass}`}>
                      {loading ? "Loading..." : kpi?.value || "N/A"}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* MAPE/MSE Plot Section */}
        <div className="bg-gray-900/80 rounded-xl shadow-xl overflow-hidden p-6 mb-6 border border-gray-700/50 backdrop-blur-sm">
          <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-sky-600 mb-4">
            MAPE/MSE Plot
          </h2>
          <div className="h-80 bg-gray-800/60 rounded-lg p-4 border border-gray-700/50">
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
                  <div className="text-sky-300">Loading plot data...</div>
                </div>
              </div>
            ) : (
              <canvas
                id="mapeMseChart"
                className="w-full h-full"
                ref={(el) => {
                  if (el && !loading) {
                    const ctx = el.getContext("2d")
                    if (ctx) {
                      if (chartRef.current) {
                        chartRef.current.destroy()
                      }
                      chartRef.current = new Chart(ctx, {
                        type: "line",
                        data: {
                          labels: errors.plotData.map((item) => item.x),
                          datasets: [
                            {
                              label: "Error Values",
                              data: errors.plotData.map((item) => item.y),
                              borderColor: "rgb(56, 189, 248)",
                              backgroundColor: errors.plotData.map((item) =>
                                item.exceedsThreshold ? "rgba(244, 63, 94, 0.5)" : "rgba(56, 189, 248, 0.2)",
                              ),
                              borderWidth: 2,
                              tension: 0.3,
                              fill: true,
                              pointBackgroundColor: errors.plotData.map((item) =>
                                item.exceedsThreshold ? "rgba(244, 63, 94, 1)" : "rgba(56, 189, 248, 1)",
                              ),
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
                              labels: {
                                color: "#e5e7eb",
                                font: {
                                  weight: "bold",
                                },
                              },
                              title: {
                                display: true,
                                text: "Error Trend Analysis",
                                color: "#38bdf8",
                                font: {
                                  size: 16,
                                  weight: "bold",
                                },
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
                              displayColors: true,
                              callbacks: {
                                label: (context) => `Error: ${context.parsed.y.toFixed(2)}`,
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
                                maxRotation: 45,
                                minRotation: 45,
                              },
                            },
                            y: {
                              title: {
                                display: true,
                                text: "Error Value",
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
                                callback: (value) => (typeof value === "number" ? value.toFixed(2) : value),
                              },
                            },
                          },
                          animation: {
                            duration: 1500,
                            easing: "easeOutQuart",
                          },
                          elements: {
                            line: {
                              tension: 0.4,
                            },
                          },
                          interaction: {
                            mode: "index",
                            intersect: false,
                          },
                          hover: {
                            mode: "nearest",
                            intersect: true,
                          },
                        },
                      })
                    }
                  }
                }}
              />
            )}
          </div>
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

        {/* Error Tables Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Error Comparison */}
          <div className="bg-gray-900/80 rounded-xl shadow-xl overflow-hidden p-6 border border-gray-700/50 backdrop-blur-sm">
            <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-sky-600 mb-4">
              Error Comparison
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
                  <div className="text-sky-300">Loading error data...</div>
                </div>
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
                        Time Period
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-rose-400 uppercase tracking-wider">
                        Error
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-gray-800/30 divide-y divide-gray-700/50">
                    {errors.tableData.slice(0, 5).map((error, index) => (
                      <tr key={index} className="hover:bg-gray-700/30 transition-colors duration-150">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">{error.id}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{error.timePeriod}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-rose-400 font-medium">
                          {(error.error ?? 0).toFixed(2)}
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
              Threshold Exceedances
            </h2>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="flex flex-col items-center">
                  <svg
                    className="animate-spin h-8 w-8 text-rose-500 mb-2"
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
                  <div className="text-rose-300">Loading threshold data...</div>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-rose-800/30">
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
                        Percentage Error
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-rose-900/10 divide-y divide-rose-800/30">
                    {outletsExceedingThreshold.slice(0, 5).map((outlet) => (
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
      </main>
    </div>
  )
}
