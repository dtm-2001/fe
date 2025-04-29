"use client"
import React, { useEffect, useState, useRef } from "react"
import Head from "next/head"
import ReactMarkdown from "react-markdown"
import { Chart, registerables } from "chart.js"
import { fetchData } from "../../services/backendService"
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Info,
} from "lucide-react"

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

// Map of business units → use cases
const useCasesByUnit: Record<string, string[]> = {
  CCS: ["CC-Di", "CC-MT"],
  JMSL: ["JM-Ch"],
}

export default function Mode1Page(): JSX.Element {
  const chartRef = useRef<Chart | null>(null)

  // Data states
  const [kpis, setKpis] = useState<KPI[]>([])
  const [errors, setErrors] = useState<ErrorDataState>({ plotData: [], tableData: [] })
  const [outletsExceedingThreshold, setOutletsExceedingThreshold] = useState<
    OutletsExceedingThreshold[]
  >([])
  const [xaiExplanation, setXaiExplanation] = useState<string>("No explanation available")
  const [currentPeriod, setCurrentPeriod] = useState<string>("N/A")
  const [errorPercentageThreshold, setErrorPercentageThreshold] = useState<number>(0)

  // Filter & UI states
  const [loading, setLoading] = useState<boolean>(false)
  const [backendError, setBackendError] = useState<string | null>(null)
  const [businessUnit, setBusinessUnit] = useState<string>("")
  const [useCase, setUseCase] = useState<string>("")
  const [shortCode, setShortCode] = useState<string>("")
  const [runtimeValue, setRuntimeValue] = useState<number>(1)
  const [alertKeeperValue, setAlertKeeperValue] = useState<string>("")
  const [roleValue, setRoleValue] = useState<string>("")
  const [emailValue, setEmailValue] = useState<string>("")

  // Available options returned by backend
  const [availableAlertKeepers, setAvailableAlertKeepers] = useState<string[]>([])
  const [availableRoles, setAvailableRoles] = useState<string[]>([])
  const [availableEmails, setAvailableEmails] = useState<string[]>([])

  // Compute possible short-code options from BU + UseCase
  const computedShortCodes = React.useMemo(() => {
    if (!businessUnit || !useCase) return []
    const buCode = businessUnit.substring(0, 2)
    const ucCode = useCase.substring(0, 2)
    return [`${buCode}-${ucCode}`]
  }, [businessUnit, useCase])

  // Fetch all data, including available filters
  const fetchAllData = async (): Promise<void> => {
    setLoading(true)
    setBackendError(null)
    try {
      const {
        kpis: fetchedKpis,
        errors: fetchedErrors,
        outletsExceedingThreshold: fetchedOutlets,
        xaiExplanation: fetchedXai,
        currentPeriod: fetchedPeriod,
        error_percentage_threshold: fetchedThreshold,
        availableAlertKeepers: fetchedAlertKeepers,
        roles: fetchedRoles,
        emails: fetchedEmails,
      } = await fetchData({
        businessUnit,
        useCase,
        shortCode,
        runtime: runtimeValue,
        alertKeeper: alertKeeperValue,
        role: roleValue,
        email: emailValue,
      })

      setKpis(fetchedKpis || [])
      setErrors(fetchedErrors || { plotData: [], tableData: [] })
      setOutletsExceedingThreshold(fetchedOutlets || [])
      setXaiExplanation(fetchedXai || "No explanation available")
      setCurrentPeriod(fetchedPeriod || "N/A")
      setErrorPercentageThreshold(fetchedThreshold ?? 0)

      setAvailableAlertKeepers(fetchedAlertKeepers || [])
      setAvailableRoles(fetchedRoles || [])
      setAvailableEmails(fetchedEmails || [])
    } catch (err) {
      console.error("Error fetching data:", err)
      const message =
        err instanceof Error
          ? `Failed to load data: ${err.message}`
          : "Failed to load data: Unknown error"
      setBackendError(message)
    } finally {
      setLoading(false)
    }
  }

  // Re-fetch whenever any filter changes
  useEffect(() => {
    fetchAllData()
  }, [
    businessUnit,
    useCase,
    shortCode,
    runtimeValue,
    alertKeeperValue,
    roleValue,
    emailValue,
  ])

  // Handlers for filter controls
  const handleBusinessUnitChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setBusinessUnit(e.target.value)
    setUseCase("")
    setShortCode("")
  }
  const handleUseCaseChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setUseCase(e.target.value)
    setShortCode("")
  }
  const handleShortCodeChange = (e: React.ChangeEvent<HTMLSelectElement>) =>
    setShortCode(e.target.value)
  const handleRuntimeChange = (e: React.ChangeEvent<HTMLSelectElement>) =>
    setRuntimeValue(parseInt(e.target.value, 10))
  const handleAlertKeeperChange = (e: React.ChangeEvent<HTMLSelectElement>) =>
    setAlertKeeperValue(e.target.value)
  const handleRoleChange = (e: React.ChangeEvent<HTMLSelectElement>) =>
    setRoleValue(e.target.value)
  const handleEmailChange = (e: React.ChangeEvent<HTMLSelectElement>) =>
    setEmailValue(e.target.value)

  // Helpers for KPI status display
  const getStatusColor = (status?: string) => {
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
  const getStatusIcon = (status?: string) => {
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
            <p className="mt-2 text-rose-200/80 text-sm">
              Displaying fallback data. Some features may be limited.
            </p>
            <button
              onClick={fetchAllData}
              className="mt-3 px-4 py-2 bg-rose-800/50 hover:bg-rose-700/70 text-white rounded-md text-sm font-medium transition-colors duration-200 flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" /> Retry Connection
            </button>
          </div>
        )}

        {/* Header & Filters */}
        <div className="bg-gray-900/80 rounded-xl shadow-xl overflow-hidden p-6 mb-6 border border-gray-700/50 backdrop-blur-sm">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
            <div>
              <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-sky-600 mb-2">
                OCTAVE - RG Dashboard
              </h2>
              <p className="text-sky-300 flex items-center gap-2">
                <span className="inline-block h-2 w-2 rounded-full bg-sky-400 animate-pulse" />
                Current Period: {loading ? "Loading..." : currentPeriod}
              </p>
            </div>
            <button
              onClick={fetchAllData}
              className="mt-4 md:mt-0 px-4 py-2 bg-sky-800/40 hover:bg-sky-700/60 text-white rounded-md text-sm font-medium transition-colors duration-200 flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" /> Refresh Data
            </button>
          </div>

          {/* first row: 1–4 */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            {/* 1. Business Unit */}
            <div className="bg-gradient-to-br from-sky-950/40 to-sky-900/20 p-4 rounded-lg border border-sky-800/30 shadow-md">
              <h3 className="text-lg font-medium text-sky-300 mb-2 flex items-center gap-2">
                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-sky-800/40 text-xs">
                  1
                </span>
                Business Unit
              </h3>
              <select
                className="w-full bg-gray-800/80 border border-sky-700/50 rounded-md p-2 text-white focus:ring-2 focus:ring-sky-500 transition-all duration-200"
                value={businessUnit}
                onChange={handleBusinessUnitChange}
              >
                <option value="">Select Business Unit</option>
                {Object.keys(useCasesByUnit).map((bu) => (
                  <option key={bu} value={bu}>
                    {bu}
                  </option>
                ))}
              </select>
            </div>

            {/* 2. Use Case */}
            <div className="bg-gradient-to-br from-sky-950/40 to-sky-900/20 p-4 rounded-lg border border-sky-800/30 shadow-md">
              <h3 className="text-lg font-medium text-sky-300 mb-2 flex items-center gap-2">
                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-sky-800/40 text-xs">
                  2
                </span>
                Use Case
              </h3>
              <select
                className="w-full bg-gray-800/80 border border-sky-700/50 rounded-md p-2 text-white focus:ring-2 focus:ring-sky-500 transition-all duration-200"
                value={useCase}
                onChange={handleUseCaseChange}
                disabled={!businessUnit}
              >
                <option value="">Select Use Case</option>
                {businessUnit &&
                  useCasesByUnit[businessUnit].map((uc) => (
                    <option key={uc} value={uc}>
                      {uc}
                    </option>
                  ))}
              </select>
            </div>

            {/* 3. Short Code */}
            <div className="bg-gradient-to-br from-sky-950/40 to-sky-900/20 p-4 rounded-lg border border-sky-800/30 shadow-md">
              <h3 className="text-lg font-medium text-sky-300 mb-2 flex items-center gap-2">
                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-sky-800/40 text-xs">
                  3
                </span>
                Short Code
              </h3>
              <select
                className="w-full bg-gray-800/80 border border-sky-700/50 rounded-md p-2 text-white focus:ring-2 focus:ring-sky-500 transition-all duration-200"
                value={shortCode}
                onChange={handleShortCodeChange}
                disabled={computedShortCodes.length === 0}
              >
                <option value="">Select Short Code</option>
                {computedShortCodes.map((code) => (
                  <option key={code} value={code}>
                    {code}
                  </option>
                ))}
              </select>
            </div>

            {/* 4. Runtime */}
            <div className="bg-gradient-to-br from-sky-950/40 to-sky-900/20 p-4 rounded-lg border border-sky-800/30 shadow-md">
              <h3 className="text-lg font-medium text-sky-300 mb-2 flex items-center gap-2">
                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-sky-800/40 text-xs">
                  4
                </span>
                Runtime
              </h3>
              <select
                className="w-full bg-gray-800/80 border border-sky-700/50 rounded-md p-2 text-white focus:ring-2 focus:ring-sky-500 transition-all duration-200"
                value={runtimeValue}
                onChange={handleRuntimeChange}
              >
                <option value={1}>1</option>
                <option value={2}>2</option>
                <option value={3}>3</option>
                <option value={4}>4</option>
              </select>
            </div>
          </div>

          {/* second row: 5–7 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {/* 5. Alert Keeper */}
            <div className="bg-gradient-to-br from-sky-950/40 to-sky-900/20 p-4 rounded-lg border border-sky-800/30 shadow-md">
              <h3 className="text-lg font-medium text-sky-300 mb-2 flex items-center gap-2">
                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-sky-800/40 text-xs">
                  5
                </span>
                Alert Keeper
              </h3>
              <select
                className="w-full bg-gray-800/80 border border-sky-700/50 rounded-md p-2 text-white focus:ring-2 focus:ring-sky-500 transition-all duration-200"
                value={alertKeeperValue}
                onChange={handleAlertKeeperChange}
                disabled={!availableAlertKeepers.length}
              >
                <option value="">Select Keeper</option>
                {availableAlertKeepers.map((k) => (
                  <option key={k} value={k}>
                    {k}
                  </option>
                ))}
              </select>
            </div>

            {/* 6. Role */}
            <div className="bg-gradient-to-br from-sky-950/40 to-sky-900/20 p-4 rounded-lg border border-sky-800/30 shadow-md">
              <h3 className="text-lg font-medium text-sky-300 mb-2 flex items-center gap-2">
                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-sky-800/40 text-xs">
                  6
                </span>
                Role
              </h3>
              <select
                className="w-full bg-gray-800/80 border border-sky-700/50 rounded-md p-2 text-white focus:ring-2 focus:ring-sky-500 transition-all duration-200"
                value={roleValue}
                onChange={handleRoleChange}
                disabled={!availableRoles.length}
              >
                <option value="">Select Role</option>
                {availableRoles.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>

            {/* 7. Email */}
            <div className="bg-gradient-to-br from-sky-950/40 to-sky-900/20 p-4 rounded-lg border border-sky-800/30 shadow-md">
              <h3 className="text-lg font-medium text-sky-300 mb-2 flex items-center gap-2">
                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-sky-800/40 text-xs">
                  7
                </span>
                Email
              </h3>
              <select
                className="w-full bg-gray-800/80 border	border-sky-700/50 rounded-md p-2 text-white focus:ring-2 focus:ring-sky-500 transition-all duration-200"
                value={emailValue}
                onChange={handleEmailChange}
                disabled={!availableEmails.length}
              >
                <option value="">Select Email</option>
                {availableEmails.map((e) => (
                  <option key={e} value={e}>
                    {e}
                  </option>
                ))}
              </select>
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
              { title: "KStest", key: "kstest" },
              { title: "Wasserstein", key: "wasserstein" },
              { title: "Ref MSE", key: "mseRef" },
              { title: "MSE", key: "mseCurrent" },
              { title: "Status", key: "status", isStatus: true },
            ].map(({ title, key, isStatus }, idx) => {
              const kpi = kpis.find((k) => k.rowKey === key)
              const statusClass = isStatus ? getStatusColor(kpi?.value) : "text-white"
              return (
                <div
                  key={idx}
                  className="bg-gradient-to-br from-sky-950/40 to-sky-900/20 p-4 rounded-lg border	border-sky-800/30 shadow-md hover:shadow-sky-900/20 hover:border-sky-700/50 transition-all"
                >
                  <h3 className="text-lg font-medium text-sky-300 mb-2">{title}</h3>
                  <div className="flex items-center">
                    <div className="w-10 h-10 rounded-full bg-sky-800/40 flex	items-center justify-center mr-3">
                      {isStatus ? getStatusIcon(kpi?.value) : <Info className="h-5 w-5 text-sky-300" />}
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

        {/* MAPE/MSE Plot */}
        <div className="bg-gray-900/80 rounded-xl shadow-xl overflow-hidden p-6 mb-6	border border-gray-700/50 backdrop-blur-sm">
          <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-sky-600 mb-4">
            MAPE/MSE Plot
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
                      chartRef.current?.destroy()
                      chartRef.current = new Chart(ctx, {
                        type: "line",
                        data: {
                          labels: errors.plotData.map((d) => d.x),
                          datasets: [
                            {
                              label: "Error Values",
                              data: errors.plotData.map((d) => d.y),
                              borderColor: "rgb(56, 189, 248)",
                              backgroundColor: errors.plotData.map((d) =>
                                d.exceedsThreshold
                                  ? "rgba(244, 63, 94, 0.5)"
                                  : "rgba(56, 189, 248, 0.2)"
                              ),
                              borderWidth: 2,
                              tension: 0.3,
                              fill: true,
                              pointBackgroundColor: errors.plotData.map((d) =>
                                d.exceedsThreshold
                                  ? "rgba(244, 63, 94, 1)"
                                  : "rgba(56, 189, 248, 1)"
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
                              labels: { color: "#e5e7eb", font: { weight: "bold" } },
                              title: {
                                display: true,
                                text: "Error Trend Analysis",
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
                                label: (ctx) => `Error: ${ctx.parsed.y.toFixed(2)}`,
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
                                callback: (val: number) => val.toFixed(2),
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

        {/* Error Tables Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
              <div className="max-h-96 overflow-y-auto rounded-lg border	border-gray-700/50">
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
                    {errors.tableData
                      .slice()
                      .sort((a, b) => (a.error ?? 0) - (b.error ?? 0))
                      .map((row, i) => (
                        <tr key={row.id} className="hover:bg-gray-700/30 transition-colors duration-150">
                          <td className="px-6 py-4 whitespace-nowrap text-sm	font-medium text-white">
                            {i + 1}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                            {row.id}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-rose-400	font-medium">
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
              <span className="text-sm text-rose-200">
                (Threshold: {errorPercentageThreshold.toFixed(2)}%)
              </span>
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
              <div className="max-h-96 overflow-y-auto rounded-lg border	border-rose-800/30">
                <table className="min-w-full divide-y divide-rose-800/30">
                  <thead className="bg-rose-900/20">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs	font-medium text-rose-300 uppercase tracking-wider">
                        ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium	text-rose-300 uppercase tracking-wider">
                        True Value
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium	text-rose-300 uppercase tracking-wider">
                        Predicted Value
                      </th>
                      <th className="px-6 py-3 text-left text-xs	font-medium text-rose-300 uppercase tracking-wider">
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
                          <td className="px-6 py-4 whitespace-nowrap text-sm	font-medium text-white">
                            {outlet.id}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                            {outlet.y_true.toFixed(2)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm	text-gray-300">
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
