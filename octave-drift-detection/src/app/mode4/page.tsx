"use client";

import type React from "react";
import { useEffect, useState } from "react";
import Head from "next/head";
import D3ConfusionMatrix from "../../components/D3ConfusionMatrix";
import DriftWarningChart from "../mode2/DriftWarningChart";
import ReactMarkdown from "react-markdown";
import { AlertCircle, AlertTriangle, CheckCircle, RefreshCw, Info } from "lucide-react";
import {
  fetchData,
  type KPI,
  type PlotDataPoint,
  type TableDataPoint,
} from "../../services/backendService3";

interface DetailedMetric {
  total_samples: number;
  correct_predictions: { count: number; percentage: number };
  incorrect_predictions: { count: number; percentage: number };
  misclassifications: Record<string, { count: number; percentage: number }>;
}

export default function Mode4Page(): React.ReactElement {
  // --- FILTER STATES ---
  const [businessUnit, setBusinessUnit] = useState<string>("");
  const [useCase, setUseCase] = useState<string>("");
  const [shortCode, setShortCode] = useState<string>("");
  const [runtimeValue, setRuntimeValue] = useState<number>(1);
  const [alertKeeperValue, setAlertKeeperValue] = useState<string>("");
  const [roleValue, setRoleValue] = useState<string>("");
  const [emailValue, setEmailValue] = useState<string>("");

  const useCases: Record<string, string[]> = {
    CCS: ["CC-Di", "CC-MT"],
    JMSL: ["JM-Ch"],
  };

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
  const handleRoleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setRoleValue(e.target.value);
  };
  const handleEmailChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setEmailValue(e.target.value);
  };

  // Stub lists for next filters
  const availableAlertKeepers = ["KeeperA", "KeeperB", "KeeperC"];
  const availableRoles = ["Analyst", "Manager", "Reviewer"];
  const availableEmails = ["alice@example.com", "bob@example.com", "carol@example.com"];

  // --- DATA STATES ---
  const [kpis, setKpis] = useState<KPI[]>([]);
  const [errors, setErrors] = useState<{ plotData: PlotDataPoint[]; tableData: TableDataPoint[] }>({
    plotData: [],
    tableData: [],
  });
  const [referenceMatrix, setReferenceMatrix] = useState<number[][]>([]);
  const [currentMatrix, setCurrentMatrix] = useState<number[][]>([]);
  const [detailedMetrics, setDetailedMetrics] = useState<Record<string, DetailedMetric>>({});

  const [stateVal, setStateVal] = useState<string>("Unknown");
  const [coverage, setCoverage] = useState<any>({});
  const [clusters, setClusters] = useState<any>({});
  const [backwardAnalysis, setBackwardAnalysis] = useState<any>({});
  const [currentPeriod, setCurrentPeriod] = useState<string>("N/A");
  const [outletsExceedingThresholdCount, setOutletsExceedingThresholdCount] = useState<number>(0);
  const [xaiExplanation, setXaiExplanation] = useState<string>("No explanation available");
  const [backendError, setBackendError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // --- HELPERS ---
  const makeLabels = (n: number) => Array.from({ length: n }, (_, i) => i.toString());
  const computeSquareSize = (grid: number[][]) => {
    const maxPx = 300;
    const rows = grid.length;
    const cols = grid[0]?.length || 0;
    if (!rows || !cols) return maxPx;
    const cellSize = Math.min(maxPx / rows, maxPx / cols);
    return Math.max(rows, cols) * cellSize;
  };
  const getStatusColor = (status?: string) => {
    if (!status) return "text-gray-400";
    switch (status.toLowerCase()) {
      case "warning":
        return "text-amber-400";
      case "error":
        return "text-rose-500";
      case "success":
      case "normal":
        return "text-emerald-400";
      default:
        return "text-sky-400";
    }
  };
  const getStatusIcon = (status?: string) => {
    if (!status) return <Info className="h-5 w-5 text-gray-400" />;
    switch (status.toLowerCase()) {
      case "warning":
        return <AlertTriangle className="h-5 w-5 text-amber-400" />;
      case "error":
        return <AlertCircle className="h-5 w-5 text-rose-500" />;
      case "success":
      case "normal":
        return <CheckCircle className="h-5 w-5 text-emerald-400" />;
      default:
        return <Info className="h-5 w-5 text-sky-400" />;
    }
  };

  // --- DERIVED KPIs ---
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
        const acc = parseFloat(kpis.find((k) => k.rowKey.toLowerCase() === "accuracy")?.value ?? "");
        return !isNaN(acc) ? (100 - acc).toFixed(2) : "N/A";
      })(),
      status: "Normal",
    },
    {
      rowKey: "Status",
      value: stateVal,
      status: stateVal === "Normal" ? "Normal" : "Warning",
    },
  ];
  const mergedKpis = [...kpis];
  derivedKpis.forEach((d) => {
    if (!mergedKpis.find((k) => k.rowKey === d.rowKey)) mergedKpis.push(d);
  });
  const displayedKpis = mergedKpis.filter((k) => k.value !== "N/A");

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
        state: fetchedState,
        coverage: fetchedCoverage,
        clusters: fetchedClusters,
        backwardAnalysis: fetchedBackward,
        currentPeriod: fetchedPeriod,
        outletsExceedingThresholdCount: fetchedCount,
        xaiExplanation: fetchedXai,
      } = await fetchData();

      setKpis(fetchedKpis);
      setErrors(fetchedErrors); // Added this line to set errors state
      setReferenceMatrix(fetchedRefM);
      setCurrentMatrix(fetchedCurrM);
      setDetailedMetrics(fetchedDetailed);
      setStateVal(fetchedState);
      setCoverage(fetchedCoverage);
      setClusters(fetchedClusters);
      setBackwardAnalysis(fetchedBackward);
      setCurrentPeriod(fetchedPeriod);
      setOutletsExceedingThresholdCount(fetchedCount);
      setXaiExplanation(fetchedXai);
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

  return (
    <div className="bg-gradient-to-b from-gray-950 to-gray-900 min-h-screen flex flex-col">
      <Head>
        <title>Mode 4 | CL Dashboard</title>
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

        {/* Header & Filters */}
        <div className="bg-gray-900/80 rounded-xl shadow-xl overflow-hidden p-6 mb-6 border border-gray-700/50 backdrop-blur-sm">
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

          {/* Filters row 1 */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            {/* Business Unit */}
            <div className="p-4 bg-gradient-to-br from-sky-950/40 to-sky-900/20 rounded-lg border border-sky-800/30 shadow-md">
              <label className="block text-sky-300 mb-2 font-medium">Business Unit</label>
              <select
                className="w-full bg-gray-800/80 border border-sky-700/50 rounded-md p-2 text-white focus:ring-2 focus:ring-sky-500"
                value={businessUnit}
                onChange={handleBusinessUnitChange}
              >
                <option value="">Select</option>
                <option value="CCS">CCS</option>
                <option value="JMSL">JMSL</option>
              </select>
            </div>
            {/* Use Case */}
            <div className="p-4 bg-gradient-to-br from-sky-950/40 to-sky-900/20 rounded-lg border border-sky-800/30 shadow-md">
              <label className="block text-sky-300 mb-2 font-medium">Use Case</label>
              <select
                className="w-full bg-gray-800/80 border border-sky-700/50 rounded-md p-2 text-white focus:ring-2 focus:ring-sky-500"
                value={useCase}
                onChange={handleUseCaseChange}
                disabled={!businessUnit}
              >
                <option value="">Select</option>
                {businessUnit &&
                  useCases[businessUnit].map((uc) => (
                    <option key={uc} value={uc}>
                      {uc}
                    </option>
                  ))}
              </select>
            </div>
            {/* Short Code */}
            <div className="p-4 bg-gradient-to-br from-sky-950/40 to-sky-900/20 rounded-lg border border-sky-800/30 shadow-md">
              <label className="block text-sky-300 mb-2 font-medium">Short Code</label>
              <select
                className="w-full bg-gray-800/80 border border-sky-700/50 rounded-md p-2 text-white focus:ring-2 focus:ring-sky-500"
                value={shortCode}
                onChange={handleShortCodeChange}
                disabled={!businessUnit || !useCase}
              >
                <option value="">Select</option>
                <option value={`${businessUnit.substring(0, 2)}-${useCase.substring(0, 2)}`}>
                  {businessUnit && useCase
                    ? `${businessUnit.substring(0, 2)}-${useCase.substring(0, 2)}`
                    : "-"}
                </option>
              </select>
            </div>
            {/* Runtime */}
            <div className="p-4 bg-gradient-to-br from-sky-950/40 to-sky-900/20 rounded-lg border border-sky-800/30 shadow-md">
              <label className="block text-sky-300 mb-2 font-medium">Runtime</label>
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
          </div>

          {/* Filters row 2 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {/* Alert Keeper */}
            <div className="p-4 bg-gradient-to-br from-sky-950/40 to-sky-900/20 rounded-lg border border-sky-800/30 shadow-md">
              <label className="block text-sky-300 mb-2 font-medium">Alert Keeper</label>
              <select
                className="w-full bg-gray-800/80 border	border-sky-700/50 rounded-md p-2 text-white focus:ring-2 focus:ring-sky-500"
                value={alertKeeperValue}
                onChange={handleAlertKeeperChange}
              >
                <option value="">Select</option>
                {availableAlertKeepers.map((k) => (
                  <option key={k} value={k}>
                    {k}
                  </option>
                ))}
              </select>
            </div>
            {/* Role */}
            <div className="p-4 bg-gradient-to-br from-sky-950/40 to-sky-900/20 rounded-lg border border-sky-800/30 shadow-md">
              <label className="block text-sky-300 mb-2 font-medium">Role</label>
              <select
                className="w-full bg-gray-800/80 border	border-sky-700/50 rounded-md p-2 text-white focus:ring-2 focus:ring-sky-500"
                value={roleValue}
                onChange={handleRoleChange}
              >
                <option value="">Select</option>
                {availableRoles.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
            {/* Email */}
            <div className="p-4 bg-gradient-to-br from-sky-950/40 to-sky-900/20 rounded-lg border	border-sky-800/30 shadow-md">
              <label className="block text-sky-300 mb-2 font-medium">Email</label>
              <select
                className="w-full bg-gray-800/80 border	border-sky-700/50 rounded-md p-2 text-white focus:ring-2 focus:ring-sky-500"
                value={emailValue}
                onChange={handleEmailChange}
              >
                <option value="">Select</option>
                {availableEmails.map((e) => (
                  <option key={e} value={e}>
                    {e}
                  </option>
                ))}
              </select>
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
          <div className="bg-gray-800/60 rounded-lg p-4 border border-gray-700/50 h-72 relative">
            {!loading ? (
              <DriftWarningChart plotData={errors.plotData} />
            ) : (
              <div className="flex items-center justify-center h-full">
                <RefreshCw className="animate-spin h-8 w-8 text-sky-500" />
              </div>
            )}
          </div>
        </div>

        {/* Confusion Matrix */}
        <div className="bg-gray-900/80 rounded-xl shadow-xl p-6 mb-6 border border-gray-700/50 backdrop-blur-sm flex flex-col items-center">
          <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-sky-600 mb-4">
            Current Matrix
          </h2>
          {!loading && referenceMatrix.length > 0 ? (
            <div
              className="bg-gray-800/60 rounded-lg p-4 border border-gray-700/50"
              style={{ width: computeSquareSize(referenceMatrix) + 40, height: computeSquareSize(referenceMatrix) + 40 }}
            >
              <div style={{ width: computeSquareSize(referenceMatrix), height: computeSquareSize(referenceMatrix) }}>
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
          <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-sky-600 mb-4">
            Detailed Metrics by Class
          </h2>
          {loading ? (
            <RefreshCw className="animate-spin h-8 w-8 text-sky-500 mx-auto" />
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
                            ([p, m]) => `${p}: ${m.count} ${m.percentage > 0 ? `(${m.percentage.toFixed(1)}%)` : ""}`
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
              <RefreshCw className="animate-spin h-8 w-8 text-sky-500 mx-auto" />
            ) : (
              <div className="prose prose-invert prose-sky max-w-none">
                <ReactMarkdown>{xaiExplanation}</ReactMarkdown>
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
                      <tr key={i} className="hover:bg-rose-900/20 transition-colors duration-150">
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
  );
}
