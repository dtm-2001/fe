'use client'
import { useEffect, useState, useRef } from 'react'
import { Chart, CategoryScale, LineController, PointElement, LineElement, LinearScale, Tooltip, Legend } from 'chart.js'
import type { Chart as ChartType } from 'chart.js'
import Head from 'next/head'
import { getKPIs, getErrorData } from '../../services/dummyDbService'
import D3ConfusionMatrix from '../../components/D3ConfusionMatrix'

// Register necessary components from Chart.js
Chart.register(CategoryScale, LineController, PointElement, LineElement, LinearScale, Tooltip, Legend)

interface KPI {
  rowKey: string
  value: string
  status?: string
}
interface ErrorData {
  predicted: string
  actual: string
  timePeriod: string
  meanPrediction: number
  error: number
  exceedsThreshold: boolean
  yTrue?: number
  yPred?: number
  percentageError?: number
  id?: any
}
interface ErrorDataResponse {
  tableData: ErrorData[]
  plotData?: Array<{x: string, y: number}>
  summary: {
    totalErrors: number
    errorRate: number
    misclassificationRate: number
    status: string
  }
}
interface ConfusionMatrixData {
  reference: {
    matrix: number[][]
    labels: string[]
    precision: number
    recall: number
    f1: number
    accuracy: number
  }
  current: {
    matrix: number[][]
    labels: string[]
    precision: number
    recall: number
    f1: number
    accuracy: number
  }
}

const getValidNumber = (kpis: KPI[], key: string, fallback = 0): number => {
  const value = kpis.find(k => k.rowKey === key)?.value;
  const num = Number(value);
  return isNaN(num) ? fallback : Math.max(0, num);
};

export default function Mode4Page() {
  const chartRef = useRef<ChartType | null>(null);
  const [businessUnit, setBusinessUnit] = useState('CCS')
  const [useCase, setUseCase] = useState('CC-Di')
  const [kpis, setKpis] = useState<KPI[]>([])
  const [errors, setErrors] = useState<ErrorDataResponse>({
    tableData: [],
    summary: {
      totalErrors: 0,
      errorRate: 0,
      misclassificationRate: 0,
      status: ''
    }
  })
  const [confusionMatrix, setConfusionMatrix] = useState<ConfusionMatrixData>({
    reference: {
      matrix: [[0, 0], [0, 0]],
      labels: ['Class A', 'Class B'],
      precision: 0,
      recall: 0,
      f1: 0,
      accuracy: 0
    },
    current: {
      matrix: [[0, 0], [0, 0]],
      labels: ['Class A', 'Class B'],
      precision: 0,
      recall: 0,
      f1: 0,
      accuracy: 0
    }
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const initData = async () => {
      try {
        const savedBusinessUnit = localStorage.getItem('businessUnit')
        const savedUseCase = localStorage.getItem('useCase')
        if (savedBusinessUnit) setBusinessUnit(savedBusinessUnit)
        if (savedUseCase) setUseCase(savedUseCase)
        const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:5000';
        console.log('Attempting to fetch from API base:', apiBase);
        const [metricsRes, errorsRes] = await Promise.all([
          fetch(`${apiBase}/api/metrics?mode=4`).catch(err => {
            console.error('Metrics fetch failed:', err);
            throw new Error(`Failed to reach metrics API: ${err.message}`);
          }),
          fetch(`${apiBase}/api/errors`).catch(err => {
            console.error('Errors fetch failed:', err);
            throw new Error(`Failed to reach errors API: ${err.message}`);
          })
        ]);
        if (!metricsRes.ok) {
          const errorText = await metricsRes.text();
          console.error('Metrics API error response:', errorText);
          throw new Error(`Metrics API error: ${metricsRes.status} - ${errorText}`);
        }
        if (!errorsRes.ok) {
          const errorText = await errorsRes.text();
          console.error('Errors API error response:', errorText);
          throw new Error(`Errors API error: ${errorsRes.status} - ${errorText}`);
        }
        const metricsData = await metricsRes.json();
        const errorsData = await errorsRes.json();
        console.log('Successfully fetched data:', {metricsData, errorsData});

        // Normalize KPIs data format
        const normalizedKpis = (metricsData.kpis || Object.entries(metricsData).map(([rowKey, value]) => ({
          rowKey,
          value: String(value),
          status: metricsData.status
        }))).filter((k: any) => k.rowKey && k.value);

        // Normalize errors data format
        const normalizedErrors: ErrorDataResponse = {
          tableData: (errorsData.tableData || []).filter((e: ErrorData) => e.predicted && e.actual),
          summary: errorsData.summary || {
            totalErrors: 0,
            errorRate: 0,
            misclassificationRate: 0,
            status: ''
          }
        };

        setKpis(normalizedKpis);
        setErrors(normalizedErrors);

        const getKpiNumberValue = (key: string): number => {
          const kpi = normalizedKpis.find((k: any) => k.rowKey === key);
          if (!kpi) return 0;
          const num = Number(kpi.value);
          return isNaN(num) ? 0 : num;
        };

        setConfusionMatrix({
          reference: {
            matrix: [
              [getKpiNumberValue('refTrueA'), getKpiNumberValue('refFalseB')],
              [getKpiNumberValue('refFalseA'), getKpiNumberValue('refTrueB')]
            ],
            labels: ['Class A', 'Class B'],
            precision: getKpiNumberValue('refPrecision'),
            recall: getKpiNumberValue('refRecall'),
            f1: getKpiNumberValue('refF1'),
            accuracy: getKpiNumberValue('refAccuracy')
          },
          current: {
            matrix: [
              [getKpiNumberValue('currTrueA'), getKpiNumberValue('currFalseB')],
              [getKpiNumberValue('currFalseA'), getKpiNumberValue('currTrueB')]
            ],
            labels: ['Class A', 'Class B'],
            precision: getKpiNumberValue('currPrecision'),
            recall: getKpiNumberValue('currRecall'),
            f1: getKpiNumberValue('currF1'),
            accuracy: getKpiNumberValue('currAccuracy')
          }
        });
      } catch (error) {
        console.error('Error loading data:', error)
      } finally {
        setLoading(false)
      }
    }
    initData()
  }, [])

  const handleBusinessUnitChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value
    setBusinessUnit(value)
    setUseCase('')
    localStorage.setItem('businessUnit', value)
  }

  const handleUseCaseChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value
    setUseCase(value)
    localStorage.setItem('useCase', value)
  }

  const getUseCaseOptions = () => {
    if (businessUnit === 'CCS') {
      return ['CC-Di', 'CC-MT']
    } else if (businessUnit === 'JMSL') {
      return ['JM-Ch']
    }
    return []
  }

  return (
    <div className="bg-gray-900 min-h-screen flex flex-col">
      <Head>
        <title>Mode 4 | CL Dashboard</title>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css" />
      </Head>
      {/* Main Content */}
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="bg-gray-800 rounded-xl shadow-md overflow-hidden p-6 mb-6 border border-gray-700">
          <h2 className="text-2xl font-semibold text-blue-300 mb-4">OCTAVE - CL Dashboard</h2>
          {/* Business Unit and Use Case Selector */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-900/30 p-4 rounded-lg border border-blue-800/50">
              <h3 className="text-lg font-medium text-blue-200 mb-2">Business Unit</h3>
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
                <option value="">{businessUnit ? 'Select Use Case' : 'Select Business Unit first'}</option>
                {getUseCaseOptions().map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>
            <div className="bg-blue-900/30 p-4 rounded-lg border border-blue-800/50">
              <h3 className="text-lg font-medium text-blue-200 mb-2">Short Code</h3>
              <input
                type="text"
                value={useCase || '-'}
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
          {/* Additional Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-blue-900/30 p-4 rounded-lg border border-blue-800/50">
              <h3 className="text-lg font-medium text-blue-200 mb-2">Current Alert Time</h3>
              <p className="text-xl">
                {loading ? 'Loading...' : kpis.find(k => k.rowKey === 'alertTime')?.value || 'N/A'}
              </p>
            </div>
            <div className="bg-blue-900/30 p-4 rounded-lg border border-blue-800/50">
              <h3 className="text-lg font-medium text-blue-200 mb-2">No. of Runtime</h3>
              <p className="text-xl">
                {loading ? 'Loading...' : kpis.find(k => k.rowKey === 'runtimeCount')?.value || '0'}
              </p>
            </div>
            <div className="bg-blue-900/30 p-4 rounded-lg border border-blue-800/50">
              <h3 className="text-lg font-medium text-blue-200 mb-2">Alert Keeper</h3>
              <p className="text-xl">
                {loading ? 'Loading...' : kpis.find(k => k.rowKey === 'alertKeeper')?.value || 'N/A'}
              </p>
            </div>
          </div>
        </div>
        {/* Drift Warning Plot Section */}
        <div className="bg-gray-800 rounded-xl shadow-md overflow-hidden p-6 mb-6 border border-gray-700">
          <h2 className="text-2xl font-semibold text-blue-300 mb-4">Drift Warning Plot</h2>
          <div className="h-64 bg-gray-700 rounded p-4">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-white">Loading drift warnings...</div>
              </div>
            ) : (
              <div className="relative h-full">
                <canvas 
                  id="driftWarningChart"
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
                            labels: errors.plotData?.map((point, i) => point.x || `Time ${i+1}`) ?? [],
                            datasets: [
                              {
                                label: 'Drift Level', 
                                data: errors.plotData?.length 
                                  ? errors.plotData.map(point => Math.floor(point.y) % 3)
                                  : kpis
                                    .filter(k => k.rowKey.includes('currentDrift'))
                                    .map(k => Math.floor(parseFloat(k.value)) % 3),
                                borderColor: 'rgb(239, 68, 68)',
                                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                                tension: 0.1,
                                fill: true
                              }
                            ]
                          },
                          options: {
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: {
                              legend: {
                                labels: {
                                  color: '#e5e7eb'
                                }
                              },
                              tooltip: {
                                mode: 'index',
                                intersect: false
                              }
                            },
                            scales: {
                              x: {
                                type: 'category', // Using built-in category scale
                                title: {
                                  display: true,
                                  text: 'Data Points',
                                  color: '#93c5fd',
                                  font: {
                                    weight: 'bold'
                                  }
                                },
                                grid: {
                                  color: 'rgba(255, 255, 255, 0.1)'
                                },
                                ticks: {
                                  color: '#e5e7eb',
                                  font: {
                                    size: 12
                                  }
                                }
                              },
                              y: {
                                title: {
                                  display: true,
                                  text: 'Drift Value',
                                  color: '#93c5fd',
                                  font: {
                                    weight: 'bold'
                                  }
                                },
                                beginAtZero: true,
                                grid: {
                                  color: 'rgba(255, 255, 255, 0.1)'
                                },
                                ticks: {
                                  color: '#e5e7eb',
                                  font: {
                                    size: 12
                                  },
                                  callback: (value) => typeof value === 'number' ? value.toFixed(2) : value
                                }
                              }
                            },
                            animation: {
                              duration: 1000,
                              easing: 'easeInOutQuad'
                            },
                            elements: {
                              point: {
                                radius: 4,
                                hoverRadius: 6
                              }
                            }
                          }
                        });
                      }
                    }
                  }}
                />
              </div>
            )}
          </div>
        </div>
        {/* Confusion Matrices Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Current Confusion Matrix */}
          <div className="bg-gray-800 rounded-xl shadow-md overflow-hidden p-6 border border-gray-700">
            <h2 className="text-2xl font-semibold text-blue-300 mb-4">Current Confusion Matrix</h2>
            <div className="h-96 bg-gray-700 rounded p-4">
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-white">Loading current matrix...</div>
                </div>
              ) : (
                <D3ConfusionMatrix
                  data={confusionMatrix.current.matrix}
                  labels={confusionMatrix.current.labels}
                  title="Current Matrix"
                  width={500}
                  height={500}
                />
              )}
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2">
              <div className="bg-blue-900/20 p-2 rounded">
                <p className="text-xs text-blue-200">Precision</p>
                <p className="text-lg font-semibold text-white">
                  {loading ? '-' : confusionMatrix.current?.precision?.toFixed(2) || 'N/A'}
                </p>
              </div>
              <div className="bg-blue-900/20 p-2 rounded">
                <p className="text-xs text-blue-200">Recall</p>
                <p className="text-lg font-semibold text-white">
                  {loading ? '-' : confusionMatrix.current?.recall?.toFixed(2) || 'N/A'}
                </p>
              </div>
              <div className="bg-blue-900/20 p-2 rounded">
                <p className="text-xs text-blue-200">F1</p>
                <p className="text-lg font-semibold text-white">
                  {loading ? '-' : confusionMatrix.current?.f1?.toFixed(2) || 'N/A'}
                </p>
              </div>
            </div>
          </div>
        </div>
        {/* Key Performance Indicators */}
        <div className="bg-gray-800 rounded-xl shadow-md overflow-hidden p-6 mb-6 border border-gray-700">
          <h2 className="text-2xl font-semibold text-blue-300 mb-4">Hyperparameters</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-blue-900/30 p-4 rounded-lg border border-blue-800/50">
              <h3 className="text-lg font-medium text-blue-200 mb-2">Hyperparameters</h3>
              <p className="text-xl">
                {loading ? 'Loading...' : kpis.find(k => k.rowKey === 'hyperparameters')?.value || 'N/A'}
              </p>
            </div>
            <div className="bg-yellow-900/20 p-4 rounded-lg border border-yellow-800/50">
              <h3 className="text-lg font-medium text-yellow-200 mb-2">Status</h3>
              <p className={`text-xl ${
                loading ? '' : 
                kpis.find(k => k.rowKey === 'status')?.value === 'Warning' ? 'text-yellow-300' : 
                kpis.find(k => k.rowKey === 'status')?.value === 'Error' ? 'text-red-400' : 
                'text-green-400'
              }`}>
                {loading ? 'Loading...' : kpis.find(k => k.rowKey === 'status')?.value || 'N/A'}
              </p>
            </div>
          </div>
        </div>
        {/* XAI Result Section */}
        <div className="bg-gray-800 rounded-xl shadow-md overflow-hidden p-6 mb-6 border border-gray-700">
          <h2 className="text-2xl font-semibold text-blue-300 mb-4">XAI Result</h2>
          <div className="space-y-3 text-white">
            <p>{kpis.find(k => k.rowKey === 'xaiAnalysis')?.value || 'Performance analysis loading...'}</p>
            <p className="font-medium text-yellow-300">
              {kpis.find(k => k.rowKey === 'recommendation')?.value || 'Recommendation loading...'}
            </p>
          </div>
        </div>
        {/* Error and Misclassification Percentages */}
        <div className="bg-red-900/20 rounded-xl shadow-md overflow-hidden p-6 mb-6 border border-red-800/50">
          <h2 className="text-2xl font-semibold text-red-300 mb-4">Error and Misclassification Percentages</h2>
          <div className="space-y-3 text-white">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="text-lg font-medium text-red-200">Error Rate</h3>
                <p className="text-2xl font-bold">
                  {errors.summary?.errorRate ? (errors.summary.errorRate * 100).toFixed(1) + '%' : 'N/A'}
                </p>
                <div className="w-full bg-gray-700 rounded-full h-4 mt-2">
                  <div 
                    className="bg-red-500 h-4 rounded-full" 
                    style={{width: `${errors.summary?.errorRate ? errors.summary.errorRate * 100 : 0}%`}}
                  ></div>
                </div>
              </div>
              <div>
                <h3 className="text-lg font-medium text-red-200">Misclassification Rate</h3>
                <p className="text-2xl font-bold">
                  {errors.summary?.misclassificationRate ? (errors.summary.misclassificationRate * 100).toFixed(1) + '%' : 'N/A'}
                </p>
              </div>
            </div>
            <h3 className="text-lg font-medium text-red-200 mt-4">Worst Performing Cases</h3>
            <ul className="list-disc pl-5 space-y-1">
              {errors.tableData
                .sort((a: ErrorData, b: ErrorData) => (b.percentageError || 0) - (a.percentageError || 0))
                .slice(0, 3)
                .map((error: ErrorData, i: number) => (
                  <li key={i}>
                    {error.timePeriod}: {error.predicted} â†’ {error.actual} ({error.percentageError}% error)
                  </li>
                ))}
            </ul>
            <p className="font-medium text-yellow-300 mt-2">
              {errors.summary?.status ? `Status: ${errors.summary.status}` : 'Status loading...'}
            </p>
          </div>
        </div>
        {/* Misclassified Table */}
        <div className="bg-gray-800 rounded-xl shadow-md overflow-hidden p-6 mb-6 border border-gray-700">
          <h2 className="text-2xl font-semibold text-blue-300 mb-4">Misclassified Table</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-700">
              <thead>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-blue-200 uppercase tracking-wider">ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-blue-200 uppercase tracking-wider">Predicted</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-blue-200 uppercase tracking-wider">Actual</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {loading ? (
                  <tr>
                    <td colSpan={3} className="px-6 py-4 text-center text-sm text-white">
                      Loading misclassified data...
                    </td>
                  </tr>
                ) : errors.tableData.length > 0 ? (
                  errors.tableData.map((error: ErrorData, index: number) => (
                    <tr key={index} className="bg-red-900/10">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-white">{error.id}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-red-300">{error.predicted}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-white">{error.actual}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} className="px-6 py-4 text-center text-sm text-white">
                      No misclassified data available
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  )
}