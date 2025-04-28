'use client';
import React, { useEffect, useState, useRef } from 'react';
import Head from 'next/head';
import ReactMarkdown from 'react-markdown';
import { Chart, registerables } from 'chart.js';
Chart.register(...registerables);
import { fetchData } from '../../services/backendService';

// Interfaces for type safety
interface KPI {
  rowKey: string;
  value: string;
  status?: string;
}

interface PlotDataPoint {
  x: string;
  y: number;
  exceedsThreshold: boolean;
}

interface TableDataPoint {
  id: string;
  timePeriod: string;
  meanPrediction?: number;
  error?: number;
  percentageError?: number;
  status: string;
}

interface OutletsExceedingThreshold {
  id: string;
  y_true: number;
  y_pred: number;
  percentage_error: number;
}

interface ErrorDataState {
  plotData: PlotDataPoint[];
  tableData: TableDataPoint[];
}

export default function Mode1Page(): JSX.Element {
  const chartRef = useRef<Chart | null>(null);
  const [kpis, setKpis] = useState<KPI[]>([]);
  const [errors, setErrors] = useState<ErrorDataState>({ plotData: [], tableData: [] });
  const [outletsExceedingThreshold, setOutletsExceedingThreshold] = useState<OutletsExceedingThreshold[]>([]);
  const [xaiExplanation, setXaiExplanation] = useState<string>('No explanation available');
  const [loading, setLoading] = useState<boolean>(true);
  const [backendError, setBackendError] = useState<string | null>(null);

  // Fetch Data from Backend
  const initData = async (): Promise<void> => {
    setLoading(true);
    setBackendError(null);
    try {
      const { kpis: fetchedKpis, errors: fetchedErrors, outletsExceedingThreshold: fetchedOutlets, xaiExplanation: fetchedXai } = await fetchData();
      setKpis(fetchedKpis);
      setErrors(fetchedErrors);
      setOutletsExceedingThreshold(fetchedOutlets);
      setXaiExplanation(fetchedXai || 'No explanation available');
    } catch (error) {
      console.error('Error fetching data:', error);
      if (error instanceof Error) {
        setBackendError(`Failed to load data: ${error.message}`);
      } else {
        setBackendError('Failed to load data: Unknown error');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    initData();
  }, []);

  return (
    <div className="bg-gray-900 min-h-screen flex flex-col">
      <Head>
        <title>Mode 1 | Business Dashboard</title>
      </Head>
      <main className="flex-grow container mx-auto px-4 py-8">
        {/* Backend Error Section */}
        {backendError && (
          <div className="bg-red-900/50 border border-red-700 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <svg className="h-5 w-5 text-red-300 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              <h3 className="text-lg font-medium text-red-300">Backend Error</h3>
            </div>
            <p className="mt-2 text-red-200">{backendError}</p>
            <p className="mt-2 text-red-200 text-sm">Displaying fallback data. Some features may be limited.</p>
            <button
              onClick={() => initData()}
              className="mt-3 px-4 py-2 bg-red-800/50 hover:bg-red-800 text-white rounded-md text-sm font-medium"
            >
              Retry Connection
            </button>
          </div>
        )}

        {/* Header Section */}
        <div className="bg-gray-800 rounded-xl shadow-md overflow-hidden p-6 mb-6 border border-gray-700">
          <h2 className="text-2xl font-semibold text-blue-300 mb-4">OCTAVE - RG Dashboard</h2>

          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {kpis.map((kpi) => (
              <div key={kpi.rowKey} className="bg-blue-900/30 p-4 rounded-lg border border-blue-800/50">
                <h3 className="text-lg font-medium text-blue-200 mb-2">{kpi.rowKey}</h3>
                <p
                  className={`text-xl ${
                    kpi.status === 'Warning' ? 'text-yellow-400' : kpi.status === 'Error' ? 'text-red-400' : 'text-green-400'
                  }`}
                >
                  {loading ? 'Loading...' : kpi.value || 'N/A'}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* MAPE/MSE Plot Section */}
        <div className="bg-gray-800 rounded-xl shadow-md overflow-hidden p-6 mb-6 border border-gray-700">
          <h2 className="text-2xl font-semibold mb-4">MAPE/MSE Plot</h2>
          <div className="h-64 bg-gray-700 rounded p-4">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-white">Loading plot data...</div>
              </div>
            ) : (
              <canvas
                id="mapeMseChart"
                className="w-full h-full"
                ref={(el) => {
                  if (el && !loading) {
                    const ctx = el.getContext('2d');
                    if (ctx) {
                      if (chartRef.current) {
                        chartRef.current.destroy();
                      }
                      chartRef.current = new Chart(ctx, {
                        type: 'line',
                        data: {
                          labels: errors.plotData.map((item) => item.x),
                          datasets: [
                            {
                              label: 'Error Values',
                              data: errors.plotData.map((item) => item.y),
                              borderColor: 'rgb(75, 192, 192)',
                              backgroundColor: errors.plotData.map((item) =>
                                item.exceedsThreshold
                                  ? 'rgba(255, 99, 132, 0.5)'
                                  : 'rgba(54, 162, 235, 0.5)'
                              ),
                              borderWidth: 2,
                              tension: 0.1,
                            },
                          ],
                        },
                        options: {
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: {
                            legend: { labels: { color: '#e5e7eb' } },
                            tooltip: { mode: 'index', intersect: false },
                          },
                          scales: {
                            x: {
                              title: {
                                display: true,
                                text: 'Time Period',
                                color: '#93c5fd',
                                font: { weight: 'bold' },
                              },
                              grid: { color: 'rgba(255, 255, 255, 0.1)' },
                              ticks: { color: '#e5e7eb', font: { size: 12 } },
                            },
                            y: {
                              title: {
                                display: true,
                                text: 'Error Value',
                                color: '#93c5fd',
                                font: { weight: 'bold' },
                              },
                              beginAtZero: true,
                              grid: { color: 'rgba(255, 255, 255, 0.1)' },
                              ticks: {
                                color: '#e5e7eb',
                                font: { size: 12 },
                                callback: (value) =>
                                  typeof value === 'number' ? value.toFixed(2) : value,
                              },
                            },
                          },
                          animation: { duration: 1000, easing: 'easeInOutQuad' },
                          elements: { point: { radius: 4, hoverRadius: 6 } },
                        },
                      });
                    }
                  }
                }}
              />
            )}
          </div>
        </div>

        {/* KPIs Section */}
        <div className="bg-gray-800 rounded-xl shadow-md overflow-hidden p-6 mb-6 border border-gray-700">
          <h2 className="text-2xl font-semibold text-blue-300 mb-4">Key Performance Indicators</h2>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="bg-blue-900/30 p-4 rounded-lg border border-blue-800/50">
              <h3 className="text-lg font-medium text-blue-200 mb-2">KStest</h3>
              <p className="text-xl">
                {loading ? 'Loading...' : kpis.find((k) => k.rowKey === 'kstest')?.value || 'N/A'}
              </p>
            </div>
            <div className="bg-blue-900/30 p-4 rounded-lg border border-blue-800/50">
              <h3 className="text-lg font-medium text-blue-200 mb-2">Wasserstein</h3>
              <p className="text-xl">
                {loading
                  ? 'Loading...'
                  : kpis.find((k) => k.rowKey === 'wasserstein')?.value || 'N/A'}
              </p>
            </div>
            <div className="bg-blue-900/30 p-4 rounded-lg border border-blue-800/50">
              <h3 className="text-lg font-medium text-blue-200 mb-2">Ref MSE</h3>
              <p className="text-xl">
                {loading ? 'Loading...' : kpis.find((k) => k.rowKey === 'mseRef')?.value || 'N/A'}
              </p>
            </div>
            <div className="bg-blue-900/30 p-4 rounded-lg border border-blue-800/50">
              <h3 className="text-lg font-medium text-blue-200 mb-2">MSE</h3>
              <p className="text-xl">
                {loading
                  ? 'Loading...'
                  : kpis.find((k) => k.rowKey === 'mseCurrent')?.value || 'N/A'}
              </p>
            </div>
            <div className="bg-blue-900/30 p-4 rounded-lg border border-blue-800/50">
              <h3 className="text-lg font-medium text-blue-200 mb-2">Status</h3>
              <p
                className={`text-xl ${
                  loading
                    ? ''
                    : kpis.find((k) => k.rowKey === 'status')?.value === 'Warning'
                    ? 'text-yellow-400'
                    : kpis.find((k) => k.rowKey === 'status')?.value === 'Error'
                    ? 'text-red-400'
                    : 'text-green-400'
                }`}
              >
                {loading
                  ? 'Loading...'
                  : kpis.find((k) => k.rowKey === 'status')?.value || 'N/A'}
              </p>
            </div>
          </div>
        </div>
        {/* XAI Result Section */}
        <div className="bg-gray-800 rounded-xl shadow-md overflow-hidden p-6 mb-6 border border-gray-700">
          <h2 className="text-2xl font-semibold text-blue-300 mb-4">XAI Result</h2>
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

        {/* Error Tables Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Error Comparison */}
          <div className="bg-gray-800 rounded-xl shadow-md overflow-hidden p-6 border border-gray-700">
            <h2 className="text-2xl font-semibold text-blue-300 mb-4">Error Comparison</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-700">
                <thead>
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-blue-200 uppercase tracking-wider">ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-blue-200 uppercase tracking-wider">Time Period</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-red-400 uppercase tracking-wider">Error</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {errors.tableData.slice(0, 5).map((error, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-white">{error.id}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                        {error.timePeriod}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-red-400">
                        {(error.error ?? 0).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Threshold Exceedances */}
          <div className="bg-red-900/20 rounded-xl shadow-md overflow-hidden p-6 border border-red-800/50">
            <h2 className="text-2xl font-semibold text-red-300 mb-4">Threshold Exceedances</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-red-800/50">
                <thead>
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-red-200 uppercase tracking-wider">ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-red-200 uppercase tracking-wider">True Value</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-red-200 uppercase tracking-wider">Predicted Value</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-red-200 uppercase tracking-wider">Percentage Error</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-red-800/50">
                  {outletsExceedingThreshold.slice(0, 5).map((outlet) => (
                    <tr key={outlet.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-white">{outlet.id}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                        {outlet.y_true.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                        {outlet.y_pred.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-red-400">
                        {outlet.percentage_error.toFixed(2)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
