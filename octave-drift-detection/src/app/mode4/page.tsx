'use client'

import React, { useEffect, useState } from 'react'
import Head from 'next/head'
import D3ConfusionMatrix from '../../components/D3ConfusionMatrix'
import DriftWarningChart from '../mode2/DriftWarningChart'
import ReactMarkdown from 'react-markdown'
import {
  fetchData,
  KPI,
  PlotDataPoint,
  TableDataPoint,
} from '../../services/backendService3'

interface DetailedMetric {
  total_samples: number
  correct_predictions: { count: number; percentage: number }
  incorrect_predictions: { count: number; percentage: number }
  misclassifications: Record<string, { count: number; percentage: number }>
}

export default function Mode4Page(): React.ReactElement {
  // --- STATE HOOKS ---
  const [businessUnit, setBusinessUnit] = useState<string>('')
  const [useCase, setUseCase] = useState<string>('')
  const useCases: Record<string, string[]> = {
    CCS: ['CC-Di', 'CC-MT'],
    JMSL: ['JM-Ch'],
  }

  const handleBusinessUnitChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setBusinessUnit(e.target.value)
    setUseCase('')
  }
  const handleUseCaseChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setUseCase(e.target.value)
  }

  const [kpis, setKpis] = useState<KPI[]>([])
  const [errors, setErrors] = useState<{ plotData: PlotDataPoint[]; tableData: TableDataPoint[] }>({
    plotData: [],
    tableData: [],
  })
  const [referenceMatrix, setReferenceMatrix] = useState<number[][]>([])
  const [currentMatrix, setCurrentMatrix] = useState<number[][]>([])
  const [detailedMetrics, setDetailedMetrics] = useState<Record<string, DetailedMetric>>({})

  const [stateVal, setStateVal] = useState<string>('Unknown')
  const [coverage, setCoverage] = useState<any>({})
  const [clusters, setClusters] = useState<any>({})
  const [backwardAnalysis, setBackwardAnalysis] = useState<any>({})
  const [currentPeriod, setCurrentPeriod] = useState<string>('N/A')
  const [totalOutlets, setTotalOutlets] = useState<number>(0)
  const [outletsExceedingThresholdCount, setOutletsExceedingThresholdCount] = useState<number>(0)
  const [xaiExplanation, setXaiExplanation] = useState<string>('No explanation available')

  const [loading, setLoading] = useState<boolean>(true)

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

  // derived KPIs
  const derivedKpis: KPI[] = [
    {
      rowKey: 'Drift Detected',
      value: outletsExceedingThresholdCount === 0 ? 'No' : 'Yes',
      status: outletsExceedingThresholdCount === 0 ? 'Normal' : 'Warning',
    },
    {
      rowKey: 'Accuracy',
      value: kpis.find(k => k.rowKey.toLowerCase() === 'accuracy')?.value ?? 'N/A',
      status: 'Normal',
    },
    {
      rowKey: 'Error Rate',
      value: (() => {
        const acc = parseFloat(kpis.find(k => k.rowKey.toLowerCase() === 'accuracy')?.value ?? '')
        return !isNaN(acc) ? (100 - acc).toFixed(2) : 'N/A'
      })(),
      status: 'Normal',
    },
    {
      rowKey: 'Status',
      value: stateVal,
      status: stateVal === 'Normal' ? 'Normal' : 'Warning',
    },
  ]

  // merge without duplicates
  const mergedKpis: KPI[] = [...kpis]
  derivedKpis.forEach(d => {
    if (!mergedKpis.find(k => k.rowKey === d.rowKey)) mergedKpis.push(d)
  })

  // --- FETCH DATA ---
  useEffect(() => {
    async function init() {
      setLoading(true)
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
          totalOutlets: fetchedTotal,
          outletsExceedingThresholdCount: fetchedCount,
          xaiExplanation: fetchedXai,
        } = await fetchData()

        setKpis(fetchedKpis)
        setErrors(fetchedErrors)
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

  // filter out N/A values for display
  const displayedKpis = mergedKpis.filter(k => k.value !== 'N/A')

  return (
    <div className="bg-gray-900 min-h-screen flex flex-col">
      <Head>
        <title>Mode 4 | CL Dashboard</title>
      </Head>
      <main className="flex-grow container mx-auto px-4 py-8">

        {/* Header Section */}
        <div className="bg-gray-800 rounded-xl shadow-md overflow-hidden p-6 mb-6 border border-gray-700">
          <h2 className="text-2xl font-semibold text-blue-300 mb-4">OCTAVE - CL Dashboard</h2>
          <p className="text-blue-200 mb-4">
            Current Period: {loading ? 'Loading...' : currentPeriod}
          </p>

          {/* Business Unit / Use Case */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-900/30 p-4 rounded-lg border border-blue-800/50">
              <h3 className="text-lg font-medium text-blue-200 mb-2">Business Unit</h3>
              <select
                className="w-full bg-gray-700 border-blue-600 rounded p-2 text-white"
                value={businessUnit}
                onChange={handleBusinessUnitChange}
              >
                <option value="">Select Business Unit</option>
                {Object.keys(useCases).map(bu => (
                  <option key={bu} value={bu}>{bu}</option>
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
                <option value="">{businessUnit ? 'Select Use Case' : 'Select BU first'}</option>
                {(useCases[businessUnit] || []).map(uc => (
                  <option key={uc} value={uc}>{uc}</option>
                ))}
              </select>
            </div>
            <div className="bg-blue-900/30 p-4 rounded-lg border border-blue-800/50">
              <h3 className="text-lg font-medium text-blue-200 mb-2">Short Code</h3>
              <input
                type="text"
                readOnly
                value={
                  businessUnit && useCase
                    ? `${businessUnit.substring(0,2)}-${useCase.substring(0,2)}`
                    : '-'
                }
                className="w-full bg-gray-700 border-blue-600 rounded p-2 text-white"
              />
            </div>
            <div className="bg-blue-900/30 p-4 rounded-lg border border-blue-800/50">
              <h3 className="text-lg font-medium text-blue-200 mb-2">Runtime</h3>
              <input
                type="text"
                readOnly
                value="2h 45m"
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

        {/* KPI Section */}
        <div className="bg-gray-800 rounded-xl shadow-md overflow-hidden p-6 mb-6 border border-gray-700">
          <h2 className="text-2xl font-semibold text-blue-300 mb-4">Key Performance Indicators</h2>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {displayedKpis.map(kpi => (
              <div
                key={kpi.rowKey}
                className="bg-blue-900/30 p-4 rounded-lg border border-blue-800/50"
              >
                <h3 className="text-lg font-medium text-blue-200 mb-2">{kpi.rowKey}</h3>
                <p className={`text-xl ${
                  kpi.status === 'Warning' ? 'text-yellow-400' :
                  kpi.status === 'Error'   ? 'text-red-400' :
                  'text-green-400'
                }`}>
                  {loading ? 'Loading...' : kpi.value}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Drift & Warning Chart */}
        <div className="bg-gray-800 rounded-xl shadow-md overflow-hidden p-6 mb-6 border border-gray-700 h-80">
          <h2 className="text-2xl font-semibold text-blue-300 mb-4">Drift & Warning Over Time</h2>
          {!loading ? (
            <DriftWarningChart plotData={errors.plotData} />
          ) : (
            <div className="flex items-center justify-center h-full text-white">Loading…</div>
          )}
        </div>

        {/* Confusion Matrices */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {[
            { title: 'Current Matrix', grid: referenceMatrix }
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
          <h2 className="text-2xl font-semibold text-blue-300 mb-4">
            Detailed Metrics by Class
          </h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-700">
              <thead>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-blue-200 uppercase">
                    Class
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-blue-200 uppercase">
                    Total
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-blue-200 uppercase">
                    Correct
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-blue-200 uppercase">
                    Incorrect
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-blue-200 uppercase">
                    Misclassifications
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {loading ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-6 py-4 text-center text-sm text-white"
                    >
                      Loading…
                    </td>
                  </tr>
                ) : (
                  Object.entries(detailedMetrics).map(([cls, dm]) => (
                    <tr key={cls}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                        {cls}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                        {dm.total_samples}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                        {dm.correct_predictions.count} (
                        {dm.correct_predictions.percentage.toFixed(1)}%)
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                        {dm.incorrect_predictions.count} (
                        {dm.incorrect_predictions.percentage.toFixed(1)}%)
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                        {Object.entries(dm.misclassifications)
                          .map(
                            ([p, m]) => `${p}: ${m.count} (${m.percentage.toFixed(1)}%)`
                          )
                          .join(', ')}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* XAI Result */}
        <div className="bg-gray-800 rounded-xl shadow-md overflow-hidden p-6 border border-gray-700">
          <h2 className="text-2xl font-semibold text-blue-300 mb-4">XAI Result</h2>
          <div className="prose prose-invert text-white max-w-none">
            {loading
              ? 'Loading explanation...'
              : xaiExplanation
                ? <ReactMarkdown>{xaiExplanation}</ReactMarkdown>
                : 'No explanation available'}
          </div>
        </div>
      </main>
    </div>
  )
}
