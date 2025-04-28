'use client';

import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import DriftWarningChart from './DriftWarningChart';
import {
  fetchData,
  KPI,
  PlotDataPoint,
  TableDataPoint,
  OutletsExceedingThreshold,
  Indices,
} from '../../services/backendService1';

export default function Mode2Page(): React.ReactElement {
  // --- STATE HOOKS ---
  const [kpis, setKpis] = useState<KPI[]>([]);
  const [errorData, setErrorData] = useState<{
    plotData: PlotDataPoint[];
    tableData: TableDataPoint[];
  }>({ plotData: [], tableData: [] });
  const [outletsExceedingThreshold, setOutletsExceedingThreshold] = useState<
    OutletsExceedingThreshold[]
  >([]);
  const [indices, setIndices] = useState<Indices>({
    normal: [],
    warning: [],
    drift: [],
  });
  const [dashboardState, setDashboardState] = useState<string>('Unknown');
  const [coverage, setCoverage] = useState<any>({});
  const [clusters, setClusters] = useState<any>({});
  const [backwardAnalysis, setBackwardAnalysis] = useState<any>({});
  const [currentPeriod, setCurrentPeriod] = useState<string>('N/A');
  const [totalOutlets, setTotalOutlets] = useState<number>(0);
  const [
    outletsExceedingThresholdCount,
    setOutletsExceedingThresholdCount,
  ] = useState<number>(0);
  const [xaiExplanation, setXaiExplanation] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [backendError, setBackendError] = useState<string | null>(null);

  // --- DATA FETCHER ---
  const initData = async (): Promise<void> => {
    setLoading(true);
    setBackendError(null);

    try {
      const {
        kpis: fetchedKpis,
        errors: fetchedErrors,
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

      // build our drift/warning plot from indices
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
      driftPlot.sort((a, b) => a.x - b.x);

      setKpis(fetchedKpis);
      // overwrite plotData with our driftPlot
      setErrorData({ plotData: driftPlot, tableData: fetchedErrors.tableData });
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

        {/* Header Metrics */}
        <div className="bg-gray-800 rounded-xl shadow-md p-6 mb-6 border border-gray-700">
          <h2 className="text-2xl font-semibold text-blue-300 mb-4">
            OCTAVE - RG Dashboard
          </h2>
          <p className="text-blue-200 mb-2">
            Current Period: {loading ? 'Loading...' : currentPeriod}
          </p>
          <p className="text-blue-200 mb-2">
            State: {loading ? 'Loading...' : dashboardState}
          </p>
          <p className="text-blue-200 mb-2">
            Total Outlets: {loading ? 'Loading...' : totalOutlets}
          </p>
          <p className="text-blue-200 mb-2">
            Outlets Exceeding Threshold:{' '}
            {loading ? 'Loading...' : outletsExceedingThresholdCount}
          </p>
          <p className="text-blue-200 mb-2">
            Coverage – Total Points:{' '}
            {loading ? 'Loading...' : coverage.total_points ?? 'N/A'}
          </p>
          <p className="text-blue-200 mb-2">
            Coverage – Warning:{' '}
            {loading ? 'Loading...' : coverage.warning_coverage ?? 'N/A'}
          </p>
          <p className="text-blue-200 mb-2">
            Coverage – Drift:{' '}
            {loading ? 'Loading...' : coverage.drift_coverage ?? 'N/A'}
          </p>
          <p className="text-blue-200 mb-2">
            Backward Analysis – 10% Drift:{' '}
            {loading
              ? 'Loading...'
              : backwardAnalysis.backward_10_percent_drift
              ? 'Yes'
              : 'No'}
          </p>
          <p className="text-blue-200 mb-2">
            Backward Analysis – 10% Warning:{' '}
            {loading
              ? 'Loading...'
              : backwardAnalysis.backward_10_percent_warning
              ? 'Yes'
              : 'No'}
          </p>

          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mt-4">
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

        {/* Error Comparison & Threshold Exceedances */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Error Comparison */}
          <div className="bg-gray-800 rounded-xl shadow-md p-6 border border-gray-700">
            <h2 className="text-2xl font-semibold text-blue-300 mb-4">
              Error Comparison
            </h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-700">
                <thead>
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-blue-200 uppercase tracking-wider">
                      ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-blue-200 uppercase tracking-wider">
                      Time Period
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-red-400 uppercase tracking-wider">
                      Error
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {errorData.tableData.slice(0, 5).map((err, i) => (
                    <tr key={i}>
                      <td className="px-6 py-4 text-sm text-white">
                        {err.id}
                      </td>
                      <td className="px-6 py-4 text-sm text-white">
                        {err.timePeriod}
                      </td>
                      <td className="px-6 py-4 text-sm text-red-400">
                        {(err.error ?? 0).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Threshold Exceedances */}
          <div className="bg-red-900/20 rounded-xl shadow-md p-6 border border-red-800/50">
            <h2 className="text-2xl font-semibold text-red-300 mb-4">
              Threshold Exceedances
            </h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-red-800/50">
                <thead>
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-red-200 uppercase tracking-wider">
                      ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-red-200 uppercase tracking-wider">
                      True Value
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-red-200 uppercase tracking-wider">
                      Predicted Value
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-red-200 uppercase tracking-wider">
                      Percentage Error
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-red-800/50">
                  {outletsExceedingThreshold.slice(0, 5).map((o) => (
                    <tr key={o.id}>
                      <td className="px-6 py-4 text-sm text-white">
                        {o.id}
                      </td>
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
        </div>

        {/* XAI Explanation */}
        <div className="bg-gray-800 rounded-xl shadow-md p-6 mt-6 border border-gray-700">
          <h2 className="text-2xl font-semibold text-blue-300 mb-4">
            XAI Result
          </h2>
          <div className="space-y-3 text-white">
            {loading ? (
              <p>Loading XAI explanation...</p>
            ) : xaiExplanation ? (
              <div
                className="prose prose-invert"
                dangerouslySetInnerHTML={{ __html: xaiExplanation }}
              />
            ) : (
              <p className="text-red-400">No explanation available</p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
