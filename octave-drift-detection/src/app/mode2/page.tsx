'use client';

import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import ReactMarkdown from 'react-markdown';
import DriftWarningChart from './DriftWarningChart';
import {
  fetchData,
  KPI,
  PlotDataPoint,
  TableDataPoint,
  OutletsExceedingThreshold,
  Indices,
  Top10Id,
} from '../../services/backendService1';

export default function Mode2Page(): React.ReactElement {
  // --- STATE HOOKS ---
  const [kpis, setKpis] = useState<KPI[]>([]);
  const [errorData, setErrorData] = useState<{
    plotData: PlotDataPoint[];
    tableData: TableDataPoint[];
  }>({ plotData: [], tableData: [] });
  const [top10Ids, setTop10Ids] = useState<Top10Id[]>([]);
  const [outletsExceedingThreshold, setOutletsExceedingThreshold] = useState<
    OutletsExceedingThreshold[]
  >([]);
  const [indices, setIndices] = useState<Indices>({ normal: [], warning: [], drift: [] });
  const [dashboardState, setDashboardState] = useState<string>('Unknown');
  const [coverage, setCoverage] = useState<any>({});
  const [clusters, setClusters] = useState<any>({});
  const [backwardAnalysis, setBackwardAnalysis] = useState<any>({});
  const [currentPeriod, setCurrentPeriod] = useState<string>('N/A');
  const [totalOutlets, setTotalOutlets] = useState<number>(0);
  const [outletsExceedingThresholdCount, setOutletsExceedingThresholdCount] =
    useState<number>(0);
  const [xaiExplanation, setXaiExplanation] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [backendError, setBackendError] = useState<string | null>(null);

  // New state for business unit and use case
  const [businessUnit, setBusinessUnit] = useState<string>('');
  const [useCase, setUseCase] = useState<string>('');
  const useCases: Record<string, string[]> = {
    CCS: ['CC-Di', 'CC-MT'],
    JMSL: ['JM-Ch'],
  };

  const handleBusinessUnitChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const v = e.target.value;
    setBusinessUnit(v);
    setUseCase('');
  };

  const handleUseCaseChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const v = e.target.value;
    setUseCase(v);
  };

  // --- DATA FETCHER ---
  const initData = async (): Promise<void> => {
    setLoading(true);
    setBackendError(null);

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
      } = await fetchData();

      // Build our drift/warning plot from indices
      const driftPlot: PlotDataPoint[] = [];
      fetchedIndices.normal.forEach(x =>
        driftPlot.push({ x, y: 0, exceedsThreshold: false })
      );
      fetchedIndices.warning.forEach(x =>
        driftPlot.push({ x, y: 1, exceedsThreshold: false })
      );
      fetchedIndices.drift.forEach(x =>
        driftPlot.push({ x, y: 2, exceedsThreshold: false })
      );
      driftPlot.sort((a, b) => (a.x > b.x ? 1 : a.x < b.x ? -1 : 0));

      // Filter out certain KPIs
      const filteredKpis = fetchedKpis.filter(
        kpi =>
          !['kstest', 'wasserstein', 'mseref', 'msecurrent'].includes(
            kpi.rowKey.toLowerCase()
          )
      );

      setKpis(filteredKpis);
      setErrorData({ plotData: driftPlot, tableData: fetchedErrors.tableData });
      setTop10Ids(fetchedTop10);
      setOutletsExceedingThreshold(fetchedOutlets);
      setIndices(fetchedIndices);
      setDashboardState(fetchedState);
      setCoverage(fetchedCoverage);
      setClusters(fetchedClusters);
      setBackwardAnalysis(fetchedBackward);
      setCurrentPeriod(fetchedPeriod);
      setTotalOutlets(fetchedTotal);
      setOutletsExceedingThresholdCount(fetchedCount);
      setXaiExplanation(fetchedXai);
    } catch (err) {
      console.error('Error fetching data:', err);
      setBackendError(
        err instanceof Error
          ? `Failed to load data: ${err.message}`
          : 'Failed to load data: Unknown error'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    initData();
  }, []);

  // --- RENDER ---
  return (
    <div className="bg-gray-900 min-h-screen flex flex-col">
      <Head>
        <title>Mode 2 | Business Dashboard</title>
      </Head>
      <main className="flex-grow container mx-auto px-4 py-8">
        {/* Backend Error Fallback */}
        {backendError && (
          <div className="bg-red-900/50 border border-red-700 rounded-lg p-4 mb-6 text-white">
            <h3 className="text-lg font-medium">Backend Error</h3>
            <p className="mt-2">{backendError}</p>
            <p className="mt-1 text-sm opacity-75">
              Displaying fallback data. Some features may be limited.
            </p>
            <button
              onClick={initData}
              className="mt-3 px-4 py-2 bg-red-800/50 hover:bg-red-800 rounded-md text-sm font-medium"
            >
              Retry Connection
            </button>
          </div>
        )}

        {/* Header Section */}
        <div className="bg-gray-800 rounded-xl shadow-md overflow-hidden p-6 mb-6 border border-gray-700">
          <h2 className="text-2xl font-semibold text-blue-300 mb-4">
            OCTAVE - RG Dashboard
          </h2>
          <p className="text-blue-200 mb-4">
            Current Period: {loading ? 'Loading...' : currentPeriod}
          </p>

          {/* Business Unit and Use Case Selector */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-900/30 p-4 rounded-lg border border-blue-800/50">
              <h3 className="text-lg font-medium text-blue-200 mb-2">
                Business Unit
              </h3>
              <select
                className="w-full bg-gray-700 border-blue-600 rounded p-2 text-white"
                value={businessUnit}
                onChange={handleBusinessUnitChange}
              >
                <option value="">Select Business Unit</option>
                <option value="CCS">CCS</option>
                <option value="JMSL">JMSL</option>
              </select>
            </div>
            <div className="bg-blue-900/30 p-4 rounded-lg border border-blue-800/50">
              <h3 className="text-lg font-medium text-blue-200 mb-2">Use Case</h3>
              <select
                className="w-full bg-gray-700 border-blue-600 rounded p-2 text-white"
                value={useCase}
                onChange={handleUseCaseChange}
                disabled={!businessUnit}
              >
                <option value="">Select Use Case</option>
                {businessUnit &&
                  useCases[businessUnit]?.map(option => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
              </select>
            </div>
            <div className="bg-blue-900/30 p-4 rounded-lg border border-blue-800/50">
              <h3 className="text-lg font-medium text-blue-200 mb-2">Short Code</h3>
              <input
                type="text"
                value={
                  businessUnit && useCase
                    ? `${businessUnit.substring(0, 2)}-${useCase.substring(0, 2)}`
                    : '-'
                }
                readOnly
                className="w-full bg-gray-700 border-blue-600 rounded p-2 text-white"
              />
            </div>
            <div className="bg-blue-900/30 p-4 rounded-lg border border-blue-800/50">
              <h3 className="text-lg font-medium text-blue-200 mb-2">Runtime</h3>
              <input
                type="text"
                value="2h 45m"
                readOnly
                className="w-full bg-gray-700 border-blue-600 rounded p-2 text-white"
              />
            </div>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-900/30 p-4 rounded-lg border border-blue-800/50">
              <h3 className="text-lg font-medium text-blue-200 mb-2">
                Current Alert Time
              </h3>
              <p className="text-xl">
                {loading
                  ? 'Loading...'
                  : kpis.find(k => k.rowKey === 'alertTime')?.value || 'N/A'}
              </p>
            </div>
            <div className="bg-blue-900/30 p-4 rounded-lg border border-blue-800/50">
              <h3 className="text-lg font-medium text-blue-200 mb-2">
                No. of Runtime
              </h3>
              <p className="text-xl">
                {loading
                  ? 'Loading...'
                  : kpis.find(k => k.rowKey === 'runtimeCount')?.value || '0'}
              </p>
            </div>
            <div className="bg-blue-900/30 p-4 rounded-lg border border-blue-800/50">
              <h3 className="text-lg font-medium text-blue-200 mb-2">
                Alert Keeper
              </h3>
              <p className="text-xl">
                {loading
                  ? 'Loading...'
                  : kpis.find(k => k.rowKey === 'alertKeeper')?.value || 'N/A'}
              </p>
            </div>
          </div>
        </div>

        {/* KPI Section */}
        <div className="bg-gray-800 rounded-xl shadow-md overflow-hidden p-6 mb-6 border border-gray-700">
          <h2 className="text-2xl font-semibold text-blue-300 mb-4">
            Key Performance Indicators
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {kpis.map(kpi => (
              <div
                key={kpi.rowKey}
                className="bg-blue-900/30 p-4 rounded-lg border border-blue-800/50"
              >
                <h3 className="text-lg font-medium text-blue-200 mb-2">
                  {kpi.rowKey}
                </h3>
                <p
                  className={`text-xl ${
                    kpi.status === 'Warning'
                      ? 'text-yellow-400'
                      : kpi.status === 'Error'
                      ? 'text-red-400'
                      : 'text-green-400'
                  }`}
                >
                  {loading ? 'Loading...' : kpi.value}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Drift/Warning Chart */}
        <div className="bg-gray-800 rounded-xl shadow-md overflow-hidden p-6 mb-6 border border-gray-700 h-80">
          <h2 className="text-2xl font-semibold text-blue-300 mb-4">
            Drift & Warning Over Time
          </h2>
          {loading ? (
            <div className="flex items-center justify-center h-full text-white">
              Loading…
            </div>
          ) : (
            <DriftWarningChart plotData={errorData.plotData} />
          )}
        </div>

        {/* XAI Explanation */}
        <div className="bg-gray-800 rounded-xl shadow-md p-6 mb-6 border border-gray-700">
          <h2 className="text-2xl font-semibold text-blue-300 mb-4">
            XAI Result
          </h2>
          <div className="prose prose-invert text-white">
            {loading ? (
              <p>Loading XAI explanation...</p>
            ) : xaiExplanation ? (
              <ReactMarkdown>{xaiExplanation}</ReactMarkdown>
            ) : (
              <p className="text-red-400">No explanation available</p>
            )}
          </div>
        </div>

        {/* Top 10 Misclassifications */}
        <div className="bg-gray-800 rounded-xl shadow-md p-6 mb-6 border border-gray-700">
          <h2 className="text-2xl font-semibold text-blue-300 mb-4">
            Top 10 Misclassifications
          </h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-700">
              <thead>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-blue-200 uppercase">
                    ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-blue-200 uppercase">
                    Time Period
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-red-400 uppercase">
                    Error
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {top10Ids.slice(0, 10).map((item, i) => (
                  <tr key={i}>
                    <td className="px-6 py-4 text-sm text-white">{item.id}</td>
                    <td className="px-6 py-4 text-sm text-white">
                      {item.time_period}
                    </td>
                    <td className="px-6 py-4 text-sm text-red-400">
                      {item.Mean_Prediction_Error.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Threshold Exceedances */}
        <div className="bg-red-900/20 rounded-xl shadow-md overflow-hidden p-6 mb-6 border border-red-800/50">
          <h2 className="text-2xl font-semibold text-red-300 mb-4">
            Threshold Exceedances
          </h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-red-800/50">
              <thead>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-red-200 uppercase">
                    ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-red-200 uppercase">
                    True Value
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-red-200 uppercase">
                    Predicted Value
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-red-200 uppercase">
                    Percentage Error
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-red-800/50">
                {outletsExceedingThreshold.slice(0, 5).map(o => (
                  <tr key={o.id}>
                    <td className="px-6 py-4 text-sm text-white">{o.id}</td>
                    <td className="px-6 py-4 text-sm text-white">
                      {o.y_true.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-sm text-white">
                      {o.y_pred.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-sm text-red-400">
                      {o.percentage_error.toFixed(2)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
