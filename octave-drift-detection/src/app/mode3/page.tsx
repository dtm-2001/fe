'use client'

import React, { useEffect, useState } from 'react'
import Head from 'next/head'
import ReactMarkdown from 'react-markdown';
import D3ConfusionMatrix from '../../components/D3ConfusionMatrix'
import {
  fetchData,
  KPI,
  PlotDataPoint,
  TableDataPoint,
} from '../../services/backendService2'

interface DetailedMetric {
  total_samples: number
  correct_predictions: { count: number; percentage: number }
  incorrect_predictions: { count: number; percentage: number }
  misclassifications: Record<string, { count: number; percentage: number }>
}

export default function Mode3Page() {
  const [businessUnit, setBusinessUnit] = useState('CCS')
  const [useCase, setUseCase] = useState('CC-Di')

  const [kpis, setKpis] = useState<KPI[]>([])
  const [errors, setErrors] = useState<{ plotData: PlotDataPoint[]; tableData: TableDataPoint[] }>({
    plotData: [],
    tableData: [],
  })

  const [referenceMatrix, setReferenceMatrix] = useState<number[][]>([])
  const [currentMatrix, setCurrentMatrix] = useState<number[][]>([])
  const [detailedMetrics, setDetailedMetrics] = useState<Record<string, DetailedMetric>>({})

  const [stateVal, setStateVal] = useState('Unknown')
  const [coverage, setCoverage] = useState<Coverage>({})
  const [clusters, setClusters] = useState<Clusters>({})
  const [backwardAnalysis, setBackwardAnalysis] = useState<BackwardAnalysis>({})
  const [currentPeriod, setCurrentPeriod] = useState('N/A')
  const [totalOutlets, setTotalOutlets] = useState(0)
  const [outletsExceedingThresholdCount, setOutletsExceedingThresholdCount] = useState(0)
  const [xaiExplanation, setXaiExplanation] = useState('No explanation available')

  const [loading, setLoading] = useState(true)

  // build labels ["0","1",…] for axes
  const makeLabels = (n: number) => Array.from({ length: n }, (_, i) => i.toString())

  // cap matrix square at 300px
  const computeSquareSize = (grid: number[][]) => {
    const maxPx = 300
    const rows = grid.length
    const cols = grid[0]?.length || 0
    if (!rows || !cols) return maxPx
    const cellSize = Math.min(maxPx / rows, maxPx / cols)
    return Math.max(rows, cols) * cellSize
  }

  useEffect(() => {
    async function init() {
      setLoading(true)
      try {
        const savedBU = localStorage.getItem('businessUnit')
        const savedUC = localStorage.getItem('useCase')
        if (savedBU) setBusinessUnit(savedBU)
        if (savedUC) setUseCase(savedUC)

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
          totalOutlets: fetchedTotal,
          outletsExceedingThresholdCount: fetchedCount,
          xaiExplanation: fetchedXai,
        } = await fetchData()

        setKpis(fetchedKpis)
        setErrors(fetchedErrors)                     // ← fixed typo here
        setReferenceMatrix(fetchedRefM)
        setCurrentMatrix(fetchedCurrM)
        setDetailedMetrics(fetchedDetailed)
        setStateVal(fetchedState)
        setCoverage(fetchedCoverage)
        setClusters(fetchedClusters)
        setBackwardAnalysis(fetchedBackward)
        setCurrentPeriod(fetchedPeriod)
        setTotalOutlets(fetchedTotal)
        setOutletsExceedingThresholdCount(fetchedCount)
        setXaiExplanation(fetchedXai)
      } catch (err) {
        console.error('Error fetching data:', err)
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [])

  const handleBusinessUnitChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const v = e.target.value
    setBusinessUnit(v)
    setUseCase('')
    localStorage.setItem('businessUnit', v)
  }
  const handleUseCaseChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const v = e.target.value
    setUseCase(v)
    localStorage.setItem('useCase', v)
  }
  const getUseCaseOptions = () => {
    if (businessUnit === 'CCS') return ['CC-Di', 'CC-MT']
    if (businessUnit === 'JMSL') return ['JM-Ch']
    return []
  }

  const additionalKpis: KPI[] = [
    { rowKey: 'Drift Detected', value: 'Yes', status: 'Warning' },
    { rowKey: 'Jensen–Shannon Divergence', value: '0.3228', status: 'Normal' },
    { rowKey: 'Population Stability Index', value: '5327.1352', status: 'Normal' },
    { rowKey: 'Precision (Reference)', value: '0.1631', status: 'Normal' },
    { rowKey: 'Precision (Current)', value: '0.1693', status: 'Normal' },
    { rowKey: 'Recall (Reference)', value: '0.2260', status: 'Normal' },
    { rowKey: 'Recall (Current)', value: '0.2320', status: 'Normal' },
    { rowKey: 'F1 Score (Reference)', value: '0.1894', status: 'Normal' },
    { rowKey: 'F1 Score (Current)', value: '0.1957', status: 'Normal' },
    { rowKey: 'Accuracy', value: '23.20', status: 'Normal' },
    { rowKey: 'Error Rate', value: '76.80', status: 'Warning' },
    { rowKey: 'Status', value: 'Warning', status: 'Warning' },
  ];

  return (
    <div className="bg-gray-900 min-h-screen flex flex-col">
      <Head>
        <title>Mode 3 | CL Dashboard</title>
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css"
        />
      </Head>
      <main className="flex-grow container mx-auto px-4 py-8">

        {/* Header & selectors */}
        <div className="bg-gray-800 rounded-xl shadow-md overflow-hidden p-6 mb-6 border border-gray-700">
          <h2 className="text-2xl font-semibold text-blue-300 mb-4">OCTAVE - CL Dashboard</h2>
          <p className="text-blue-200 mb-2">
            Current Period: {loading ? 'Loading...' : currentPeriod}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
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
                <option value="">{businessUnit ? 'Select Use Case' : 'Select BU first'}</option>
                {getUseCaseOptions().map(o => (
                  <option key={o} value={o}>{o}</option>
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

          {/* Additional KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mt-6">
            {additionalKpis.map(kpi => (
              <div
                key={kpi.rowKey}
                className="bg-blue-900/30 p-4 rounded-lg border border-blue-800/50"
              >
                <h3 className="text-lg font-medium text-blue-200 mb-2">{kpi.rowKey}</h3>
                <p
                  className={`text-xl ${
                    kpi.status === 'Alert' || kpi.status === 'Warning'
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

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          {kpis
            .filter(
              kpi =>
                !additionalKpis.some(
                  addKpi => addKpi.rowKey.toLowerCase() === kpi.rowKey.toLowerCase()
                )
            )
            .map(kpi => (
              <div
                key={kpi.rowKey}
                className="bg-blue-900/30 p-4 rounded-lg border border-blue-800/50"
              >
                <h3 className="text-lg font-medium text-blue-200 mb-2">{kpi.rowKey}</h3>
                <p
                  className={`text-xl ${
                    kpi.status === 'Alert' || kpi.status === 'Warning'
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

        {/* Confusion Matrices */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {[ 
            { title: 'Reference Matrix', grid: referenceMatrix },
            { title: 'Current Matrix',   grid: currentMatrix   },
          ].map(({ title, grid }, idx) => {
            const side = computeSquareSize(grid)
            return (
              <div
                key={idx}
                className="bg-gray-800 rounded-xl shadow-md p-6 border border-gray-700 flex flex-col items-center"
              >
                <h2 className="text-2xl font-semibold text-blue-300 mb-4">{title}</h2>
                {!loading && grid.length > 0 ? (
                  <div style={{ width: side, height: side }}>
                    <D3ConfusionMatrix
                      data={grid}
                      labels={makeLabels(grid[0].length)}
                      width={side}
                      height={side}
                    />
                  </div>
                ) : (
                  <div className="text-white">Loading…</div>
                )}
              </div>
            )
          })}
        </div>

        {/* Detailed Metrics */}
        <div className="bg-gray-800 rounded-xl shadow-md overflow-hidden p-6 mb-6 border border-gray-700">
          <h2 className="text-2xl font-semibold text-blue-300 mb-4">Detailed Metrics by Class</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-700">
              <thead>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-blue-200 uppercase">Class</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-blue-200 uppercase">Total</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-blue-200 uppercase">Correct</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-blue-200 uppercase">Incorrect</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-blue-200 uppercase">Misclassifications</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-4 text-center text-sm text-white">Loading…</td>
                  </tr>
                ) : (
                  Object.entries(detailedMetrics).map(([cls, dm]) => (
                    <tr key={cls}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-white">{cls}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-white">{dm.total_samples}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                        {dm.correct_predictions.count} ({dm.correct_predictions.percentage.toFixed(1)}%)
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                        {dm.incorrect_predictions.count} ({dm.incorrect_predictions.percentage.toFixed(1)}%)
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                        {Object.entries(dm.misclassifications)
                          .map(([p, m]) => `${p}: ${m.count} (${m.percentage.toFixed(1)}%)`)
                          .join(', ')}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* XAI Explanation */}
        <div className="bg-gray-800 rounded-xl shadow-md overflow-hidden p-6 mb-6 border border-gray-700">
          <h2 className="text-2xl font-semibold text-blue-300 mb-4">XAI Result</h2>
          <div className="prose prose-invert text-white">
            {loading ? (
              <p>Loading explanation…</p>
            ) : xaiExplanation ? (
              <ReactMarkdown>{xaiExplanation}</ReactMarkdown>
            ) : (
              <p className="text-red-400">No explanation available</p>
            )}
          </div>
        </div>

        {/* Misclassified Table (BOTTOM) */}
        <div className="bg-gray-800 rounded-xl shadow-md overflow-hidden p-6 border border-gray-700">
          <h2 className="text-2xl font-semibold text-blue-300 mb-4">Misclassified Table</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-700">
              <thead>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-blue-200 uppercase">ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-blue-200 uppercase">True &rarr; Pred</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {loading ? (
                  <tr>
                    <td colSpan={2} className="px-6 py-4 text-center text-sm text-white">Loading…</td>
                  </tr>
                ) : errors.tableData.length > 0 ? (
                  errors.tableData.map((r, i) => (
                    <tr key={i} className="bg-red-900/10">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-white">{r.id}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-red-300">{r.timePeriod}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={2} className="px-6 py-4 text-center text-sm text-white">No misclassified data</td>
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
