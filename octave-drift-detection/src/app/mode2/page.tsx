"use client"
import type React from "react"
import { useState, useEffect, useMemo } from "react"
import Head from "next/head"
import ReactMarkdown from "react-markdown"
import DriftWarningChart from "./DriftWarningChart"
import { AlertCircle, AlertTriangle, CheckCircle, RefreshCw, Info } from "lucide-react"
import {
  fetchData,
  type KPI,
  type PlotDataPoint,
  type TableDataPoint,
  type OutletsExceedingThreshold,
  type Indices,
  type Top10Id,
} from "../../services/backendService1"

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

  // --- NEW STATE FOR FILTERS ---
  const [businessUnit, setBusinessUnit] = useState<string>("")
  const [useCase, setUseCase] = useState<string>("")
  const [shortCode, setShortCode] = useState<string>("")
  const [runtimeValue, setRuntimeValue] = useState<number>(1)
  const [alertKeeperValue, setAlertKeeperValue] = useState<string>("")
  const [roleValue, setRoleValue] = useState<string>("")
  const [emailValue, setEmailValue] = useState<string>("")

  // Status distribution for pie chart
  const [statusDistribution, setStatusDistribution] = useState({
    good: 65,
    warning: 25,
    error: 10,
  })

  const useCasesByUnit: Record<string, string[]> = {
    CCS: ["CC-Di", "CC-MT"],
    JMSL: ["JM-Ch"],
  }

  const computedShortCodes = useMemo(() => {
    if (!businessUnit || !useCase) return []
    return [`${businessUnit.substring(0, 2)}-${useCase.substring(0, 2)}`]
  }, [businessUnit, useCase])

  // Stubbed lists for the remaining selects
  const [availableAlertKeepers] = useState<string[]>(["KeeperA", "KeeperB", "KeeperC"])
  const [availableRoles] = useState<string[]>(["Analyst", "Manager", "Reviewer"])
  const [availableEmails] = useState<string[]>(["alice@example.com", "bob@example.com", "carol@example.com"])

  // --- HANDLERS FOR FILTERS ---
  const handleBusinessUnitChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setBusinessUnit(e.target.value)
    setUseCase("")
    setShortCode("")
  }

  const handleUseCaseChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setUseCase(e.target.value)
    setShortCode("")
  }

  const handleShortCodeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setShortCode(e.target.value)
  }

  const handleRuntimeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setRuntimeValue(Number(e.target.value))
  }

  const handleAlertKeeperChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setAlertKeeperValue(e.target.value)
  }

  const handleRoleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setRoleValue(e.target.value)
  }

  const handleEmailChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setEmailValue(e.target.value)
  }

  // --- DATA FETCHER ---
  const initData = async (): Promise<void> => {
    setLoading(true)
    setBackendError(null)

    try {
      const {
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

      // Build drift/warning plot
      const driftPlot: PlotDataPoint[] = []
      fetchedIndices.normal.forEach((x) => driftPlot.push({ x, y: 0, exceedsThreshold: false }))
      fetchedIndices.warning.forEach((x) => driftPlot.push({ x, y: 1, exceedsThreshold: false }))
      fetchedIndices.drift.forEach((x) => driftPlot.push({ x, y: 2, exceedsThreshold: false }))
      driftPlot.sort((a, b) => (a.x > b.x ? 1 : a.x < b.x ? -1 : 0))

      // Filter KPIs
      const filteredKpis = fetchedKpis.filter(
        (kpi) => !["kstest", "wasserstein", "mseref", "msecurrent"].includes(kpi.rowKey.toLowerCase()),
      )

      setKpis(filteredKpis)
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

      // Calculate status distribution for pie chart
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

  // --- Helpers for KPI rendering ---
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

  // --- RENDER ---
  return (
    <div className="bg-gradient-to-b from-gray-950 to-gray-900 min-h-screen flex flex-col">
      <Head>
        <title>Mode 2 | Business Dashboard</title>
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
                OCTAVE - RG Dashboard
              </h2>
              <p className="text-sky-300 flex items-center gap-2">
                <span className="inline-block h-2 w-2 rounded-full bg-sky-400 animate-pulse" />
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

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-4">
            <div className="lg:col-span-3">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
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
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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

            {/* Status Distribution Pie Chart */}
            <div className="bg-gradient-to-br from-sky-950/40 to-sky-900/20 p-4 rounded-lg border border-sky-800/30 shadow-md">
              <h3 className="text-lg font-medium text-sky-300 mb-2">Status Distribution</h3>
              <div className="h-[200px] relative">
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
