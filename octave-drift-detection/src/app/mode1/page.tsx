'use client'
import React, { useEffect, useState, useRef } from 'react'
import { JSX } from 'react/jsx-runtime'
import { Chart, registerables } from 'chart.js'
Chart.register(...registerables)
import Head from 'next/head'
import { fetchMode1KPIs, fetchErrors, fetchMode1XAIData } from '../../services/backendService'

interface KPI {
  rowKey: string
  value: string
  status?: string
  // Removed id field as per requirements
}

interface PlotDataPoint {
  x: string
  y: number 
  exceedsThreshold: boolean
}

interface TableDataPoint {
  id: string
  timePeriod: string
  meanPrediction: number
  error: number
  percentageError: number
  status: string
  exceedsThreshold?: boolean
}

interface RawErrorData {
  id?: string
  timePeriod?: string
  meanPrediction?: number
  error?: number
  percentageError?: number
  exceedsThreshold?: boolean
}

interface ErrorDataState {
  plotData: PlotDataPoint[]
  tableData: TableDataPoint[]
}

export default function Mode1Page(): JSX.Element {
  const chartRef = useRef<Chart | null>(null)
  const [businessUnits, setBusinessUnits] = useState<string[]>(['CCS', 'JMSL'])
  const [useCases, setUseCases] = useState<{[key: string]: string[]}>({
    'CCS': ['CC-Di', 'CC-MT'],
    'JMSL': ['JM-Ch']
  })
  const [businessUnit, setBusinessUnit] = useState<string>('')
  const [useCase, setUseCase] = useState<string>('')
  const [kpis, setKpis] = useState<KPI[]>([])
  const [errors, setErrors] = useState<ErrorDataState>({ 
    plotData: [], 
    tableData: [] 
  })
  const [xaiExplanation, setXaiExplanation] = useState<string>('')
  const [backendError, setBackendError] = useState<string|null>(null)
  const [loading, setLoading] = useState<boolean>(true)

  // Initialize data
  const initData = async (): Promise<void> => {
    setLoading(true);
    setBackendError(null);
    try {
        const savedBusinessUnit = localStorage.getItem('businessUnit')
        const savedUseCase = localStorage.getItem('useCase')
        if (savedBusinessUnit) setBusinessUnit(savedBusinessUnit)
        if (savedUseCase) setUseCase(savedUseCase)
        
        const [kpiData, errorData, xaiData] = await Promise.all([
          fetchMode1KPIs(),
          fetchErrors(),
          fetchMode1XAIData()
        ])
        
        // Transform the ErrorData[] into our ErrorDataState format
        const processedErrorData: ErrorDataState = {
          plotData: Array.isArray(errorData) ? 
            errorData.map((err: RawErrorData) => ({
              x: err.timePeriod || '',
              y: err.error || 0,
              exceedsThreshold: err.exceedsThreshold || false
            })) : 
            errorData?.plotData?.map((err: RawErrorData) => ({
              x: err.timePeriod || '',
              y: err.error || 0,
              exceedsThreshold: err.exceedsThreshold || false
            })) || [],
          tableData: Array.isArray(errorData) ? 
            errorData.map((err: RawErrorData) => ({
              id: err.id || `ERR-${Date.now()}`,
              timePeriod: err.timePeriod || '',
              meanPrediction: err.meanPrediction || 0,
              error: err.error || 0,
              percentageError: err.percentageError || 0,
              status: err.exceedsThreshold ? 'Alert' : 'Normal'
            })) : 
            errorData?.tableData?.map((err: RawErrorData) => ({
              id: err.id || `ERR-${Date.now()}`,
              timePeriod: err.timePeriod || '',
              meanPrediction: err.meanPrediction || 0,
              error: err.error || 0,
              percentageError: err.percentageError || 0,
              status: err.exceedsThreshold ? 'Alert' : 'Normal'
            })) || []
        }
        
        setKpis(kpiData)
        setErrors(processedErrorData)
        setXaiExplanation(xaiData || 'No explanation available')
        console.log('RAW BACKEND RESPONSES:', {
          kpiData: JSON.parse(JSON.stringify(kpiData)),
          errorData: JSON.parse(JSON.stringify(errorData)), 
          xaiData: JSON.parse(JSON.stringify(xaiData))
        })
      } catch (error) {
        console.error('Error loading data - full error:', error);
        if (error instanceof Error) {
          setBackendError(`Failed to load data: ${error.message}`);
        } else {
          setBackendError('Failed to load data: Unknown error');
        }
        
        // Generate comprehensive fallback data
        const sampleErrors = Array.from({length: 10}, (_, i) => ({
          id: `ERR-SAMPLE-${i+1}`,
          timePeriod: `2023-01-${String(i+1).padStart(2, '0')}`,
          meanPrediction: Math.random() * 100,
          error: Math.random() * 20,
          exceedsThreshold: Math.random() > 0.7,
          percentageError: Math.random() * 30
        }))
        
        setKpis([
          {rowKey: 'alertTime', value: new Date().toISOString(), status: 'Normal'},
          {rowKey: 'runtimeCount', value: '5', status: 'Normal'},
          {rowKey: 'alertKeeper', value: 'Sample User', status: 'Normal'},
          {rowKey: 'kstest', value: '0.12', status: 'Normal'},
          {rowKey: 'wasserstein', value: '0.08', status: 'Normal'},
          {rowKey: 'mseRef', value: '0.25', status: 'Normal'},
          {rowKey: 'mseCurrent', value: '0.32', status: 'Warning'},
          {rowKey: 'status', value: 'Warning', status: 'Warning'}
        ])
        
        setErrors({
          plotData: sampleErrors.map(err => ({
            x: err.timePeriod,
            y: err.error,
            exceedsThreshold: err.exceedsThreshold
          })),
          tableData: sampleErrors.map(err => ({
            id: err.id,
            timePeriod: err.timePeriod,
            meanPrediction: err.meanPrediction,
            error: err.error,
            percentageError: err.percentageError,
            status: err.exceedsThreshold ? 'Alert' : 'Normal'
          }))
        })
        
        setXaiExplanation('Sample explanation: The model shows moderate drift with 5.2% precision change and -2.1% recall change')
      } finally {
        setLoading(false)
      }
    }

    useEffect(() => {
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

  return (
    <div className="bg-gray-900 min-h-screen flex flex-col">
      <Head>
        <title>Mode 1 | Business Dashboard</title>
      </Head>

      <main className="flex-grow container mx-auto px-4 py-8">
        {backendError && (
          <div className="bg-red-900/50 border border-red-700 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <svg className="h-5 w-5 text-red-300 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
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
          
          {/* Business Unit and Use Case Selector */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-900/30 p-4 rounded-lg border border-blue-800/50">
              <h3 className="text-lg font-medium text-blue-200 mb-2">Business Unit</h3>
              <select
                className="w-full bg-gray-700 border-blue-600 rounded p-2 text-white"
                value={businessUnit}
                onChange={handleBusinessUnitChange}
              >
                {businessUnits.map(unit => (
                  <option key={unit} value={unit}>{unit}</option>
                ))}
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
                {businessUnit && useCases[businessUnit]?.map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>
            <div className="bg-blue-900/30 p-4 rounded-lg border border-blue-800/50">
              <h3 className="text-lg font-medium text-blue-200 mb-2">Short Code</h3>
              <input
                type="text"
                value={businessUnit && useCase ? `${businessUnit.substring(0,2)}-${useCase.substring(0,2)}` : '-'}
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

        {/* MAPE/MSE Plot Section */}
        <div className="bg-gray-800 rounded-xl shadow-md overflow-hidden p-6 mb-6 border border-gray-700">
          <h2 className="text-2xl font-semibold text-blue-300 mb-4">MAPE/MSE Plot</h2>
          <div className="h-64 bg-gray-700 rounded p-4">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-white">Loading plot data...</div>
              </div>
            ) : (
              <div className="relative h-full">
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
                            labels: errors.plotData.map(item => item.x),
                            datasets: [
                              {
                                label: 'Error Values',
                                data: errors.plotData.map(item => item.y),
                                borderColor: 'rgb(75, 192, 192)',
                                backgroundColor: errors.plotData.map(item => 
                                  item.exceedsThreshold ? 'rgba(255, 99, 132, 0.5)' : 'rgba(54, 162, 235, 0.5)'),
                                borderWidth: 2,
                                tension: 0.1
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
                                  text: 'Error Value',
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

        {/* KPIs Section */}
        <div className="bg-gray-800 rounded-xl shadow-md overflow-hidden p-6 mb-6 border border-gray-700">
          <h2 className="text-2xl font-semibold text-blue-300 mb-4">Key Performance Indicators</h2>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="bg-blue-900/30 p-4 rounded-lg border border-blue-800/50">
              <h3 className="text-lg font-medium text-blue-200 mb-2">KStest</h3>
              <p className="text-xl">
                {loading ? 'Loading...' : kpis.find(k => k.rowKey === 'kstest')?.value || 'N/A'}
              </p>
            </div>
            <div className="bg-blue-900/30 p-4 rounded-lg border border-blue-800/50">
              <h3 className="text-lg font-medium text-blue-200 mb-2">Wasserstein</h3>
              <p className="text-xl">
                {loading ? 'Loading...' : kpis.find(k => k.rowKey === 'wasserstein')?.value || 'N/A'}
              </p>
            </div>
            <div className="bg-blue-900/30 p-4 rounded-lg border border-blue-800/50">
              <h3 className="text-lg font-medium text-blue-200 mb-2">Ref MSE</h3>
              <p className="text-xl">
                {loading ? 'Loading...' : kpis.find(k => k.rowKey === 'mseRef')?.value || 'N/A'}
              </p>
            </div>
            <div className="bg-blue-900/30 p-4 rounded-lg border border-blue-800/50">
              <h3 className="text-lg font-medium text-blue-200 mb-2">MSE</h3>
              <p className="text-xl">
                {loading ? 'Loading...' : kpis.find(k => k.rowKey === 'mseCurrent')?.value || 'N/A'}
              </p>
            </div>
            <div className="bg-blue-900/30 p-4 rounded-lg border border-blue-800/50">
              <h3 className="text-lg font-medium text-blue-200 mb-2">Status</h3>
              <p className={`text-xl ${
                loading ? '' : 
                kpis.find(k => k.rowKey === 'status')?.value === 'Warning' ? 'text-yellow-400' : 
                kpis.find(k => k.rowKey === 'status')?.value === 'Error' ? 'text-red-400' : 
                'text-green-400'
              }`}>
                {loading ? 'Loading...' : kpis.find(k => k.rowKey === 'status')?.value || 'N/A'}
              </p>
            </div>
          </div>
        </div>

        {/* Debug Data Section */}
        <div className="bg-gray-800 rounded-xl shadow-md overflow-hidden p-6 mb-6 border border-gray-700">
          <h2 className="text-2xl font-semibold text-blue-300 mb-4">Debug Data</h2>
          <div className="space-y-3 text-white text-xs overflow-auto max-h-60">
            <pre>{JSON.stringify({
              kpis: kpis,
              errors: errors,
              xaiExplanation: xaiExplanation
            }, null, 2)}</pre>
          </div>
        </div>

        {/* XAI Result Section */}
        <div className="bg-gray-800 rounded-xl shadow-md overflow-hidden p-6 mb-6 border border-gray-700">
          <h2 className="text-2xl font-semibold text-blue-300 mb-4">XAI Result</h2>
          <div className="space-y-3 text-white">
            {loading ? (
              <p>Loading XAI explanation...</p>
            ) : xaiExplanation ? (
              <p>{xaiExplanation}</p>
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
                    <th className="px-6 py-3 text-left text-xs font-medium text-blue-200 uppercase tracking-wider">Error</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {errors.tableData.slice(0, 5).map((error, index) => (
                    <tr key={error.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-white">{error.id}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-white">{error.timePeriod}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-red-400">{error.error.toFixed(2)}</td>
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
                    <th className="px-6 py-3 text-left text-xs font-medium text-red-200 uppercase tracking-wider">Error %</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-red-200 uppercase tracking-wider">Exceeds</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-red-800/50">
                  {errors.tableData
                    .filter((e: TableDataPoint) => e.status === 'Alert')
                    .slice(0, 5)
                    .map((error: TableDataPoint) => (
                      <tr key={error.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-white">{error.id}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-white">{error.percentageError.toFixed(2)}%</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-red-300">
                          {error.status === 'Alert' ? 'Yes' : 'No'}
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
  )
}
