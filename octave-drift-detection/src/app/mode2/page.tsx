'use client'
import { useEffect, useState, useRef } from 'react'
import { Chart, registerables } from 'chart.js'

interface ErrorDataState {
  plotData: {
    x: string
    y: number
    exceedsThreshold: boolean
  }[]
  tableData: TableDataPoint[]
}
Chart.register(...registerables)
import Head from 'next/head'
import {
  fetchBusinessUnits,
  fetchMode2KPIs,
  fetchMode2XAIData,
  fetchErrors
} from '../../services/backendService'
import type { KPI, TableDataPoint, PlotDataPoint } from '../../types/dbTypes'

export default function Mode2Page() {
  const chartRef = useRef<Chart | null>(null)
  const [businessUnits] = useState<string[]>(['CCS', 'JMSL'])
  const [useCases] = useState<{[key: string]: string[]}>({
    'CCS': ['CC-Di', 'CC-MT'],
    'JMSL': ['JM-Ch']
  })
  const [businessUnit, setBusinessUnit] = useState('')
  const [useCase, setUseCase] = useState('')
  const [kpis, setKpis] = useState<KPI[]>([])
  const [errors, setErrors] = useState<{
    plotData: PlotDataPoint[],
    tableData: TableDataPoint[]
  }>({ plotData: [], tableData: [] })
  const [xaiExplanation, setXaiExplanation] = useState<string>('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const initData = async () => {
      try {
        const [kpiData, errorData, xaiResponse] = await Promise.all([
          fetchMode2KPIs(),
          fetchErrors(),
          fetchMode2XAIData()
        ])
        setKpis(kpiData)
        setErrors({
          plotData: errorData.plotData,
          tableData: errorData.tableData
        })
        setXaiExplanation(xaiResponse || 'No explanation available')
      } catch (error) {
        console.error('Error loading data:', error);
        
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
          {rowKey: 'currentDrift1', value: '1', status: 'Normal'},
          {rowKey: 'currentDrift2', value: '0', status: 'Normal'},
          {rowKey: 'status', value: 'Normal', status: 'Normal'},
          {rowKey: 'businessUnit', value: 'CCS', status: 'Normal'},
          {rowKey: 'useCase', value: 'CC-Di', status: 'Normal'}
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
        
        setXaiExplanation(`XAI Analysis Results:
- Drift Type: Covariate Shift
- Confidence: 87%
- Affected Features: 
  * Feature1 (Importance: 0.45)
  * Feature2 (Importance: 0.32)
- Recommended Actions:
  1. Review training data distribution
  2. Check for data pipeline issues
  3. Consider model retraining`)
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

  return (
    <div className="bg-gray-900 min-h-screen flex flex-col">
      <Head>
        <title>Mode 2 | Business Dashboard</title>
      </Head>

      <main className="flex-grow container mx-auto px-4 py-8">
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
            <div className="bg-blue-900/30 p4 rounded-lg border border-blue-800/50">
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
                            labels: errors.plotData.map((point, i) => point.x || `Time ${i+1}`),
                            datasets: [
                              {
                                label: 'Drift Level', 
                                data: errors.plotData.length > 0 
                                  ? errors.plotData.map(point => Math.floor(point.y) % 3) // Ensures only 0,1,2
                                  : kpis
                                    .filter(k => k.rowKey.includes('currentDrift'))
                                    .map(k => Math.floor(parseFloat(k.value)) % 3), // Ensures only 0,1,2
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

        {/* Hyperparameters Section */}
        <div className="bg-gray-800 rounded-xl shadow-md overflow-hidden p-6 mb-6 border border-gray-700">
          <h2 className="text-2xl font-semibold text-blue-300 mb-4">Hyperparameters</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-blue-900/30 p-4 rounded-lg border border-blue-800/50">
              <h3 className="text-lg font-medium text-blue-200 mb-2">Hyperparameters</h3>
              <p className="text-xl">Default</p>
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


        {/* XAI Result Section */}
        <div className="bg-gray-800 rounded-xl shadow-md overflow-hidden p-6 mb-6 border border-gray-700">
          <h2 className="text-2xl font-semibold text-blue-300 mb-4">XAI Result</h2>
          <div className="space-y-3 text-white">
            {loading ? (
              <p>Loading XAI explanation...</p>
            ) : xaiExplanation ? (
              <div className="bg-blue-900/20 p-4 rounded-lg">
                <p className="whitespace-pre-wrap">{xaiExplanation}</p>
              </div>
            ) : (
              <p className="text-yellow-400">No XAI explanation available</p>
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
                  {errors.tableData.slice(0, 5).map((error: TableDataPoint, index: number) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-white">{error.id}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-white">{error.timePeriod}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-red-400">{error.error}</td>
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
                    .map((error: TableDataPoint, index: number) => (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-white">{error.id}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-white">{error.percentageError}%</td>
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
