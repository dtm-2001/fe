'use client'

import React, { useEffect, useState } from 'react'
import Head from 'next/head'
import D3ConfusionMatrix from '../../components/D3ConfusionMatrix'
import DriftWarningChart from '../mode2/DriftWarningChart'
import {
  fetchData,
  KPI,
  PlotDataPoint,
  TableDataPoint,
} from '../../services/backendService3'
import ReactMarkdown from 'react-markdown'

interface DetailedMetric {
  total_samples: number
  correct_predictions: { count: number; percentage: number }
  incorrect_predictions: { count: number; percentage: number }
  misclassifications: Record<string, { count: number; percentage: number }>
}

export default function Mode4Page(): React.ReactElement {
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

  const [stateVal, setStateVal] = useState<string>('Unknown')
  const [coverage, setCoverage] = useState<any>({})
  const [clusters, setClusters] = useState<any>({})
  const [backwardAnalysis, setBackwardAnalysis] = useState<any>({})
  const [currentPeriod, setCurrentPeriod] = useState<string>('N/A')
  const [totalOutlets, setTotalOutlets] = useState<number>(0)
  const [outletsExceedingThresholdCount, setOutletsExceedingThresholdCount] = useState<number>(0)
  const [xaiExplanation, setXaiExplanation] = useState<string>('No explanation available')

  const [loading, setLoading] = useState<boolean>(true)

  const makeLabels = (n: number) => Array.from({ length: n }, (_, i) => i.toString())

  const computeSquareSize = (grid: number[][]) => {
    const maxPx = 300
    const rows = grid.length
    const cols = grid[0]?.length || 0
    if (!rows || !cols) return maxPx
    const cellSize = Math.min(maxPx / rows, maxPx / cols)
    return Math.max(rows, cols) * cellSize
  }

  const derivedKpis: KPI[] = [
    {
      rowKey: 'Drift Detected',
      value: outletsExceedingThresholdCount === 0 ? 'No' : 'Yes',
      status: outletsExceedingThresholdCount === 0 ? 'Normal' : 'Warning',
    },
    {
      rowKey: 'Accuracy',
      value: (() => {
        const accuracyKpi = kpis.find(k => k.rowKey.toLowerCase() === 'accuracy')
        if (accuracyKpi) return accuracyKpi.value
        return 'N/A'
      })(),
      status: 'Normal',
    },
    {
      rowKey: 'Error Rate',
      value: (() => {
        const accuracyKpi = kpis.find(k => k.rowKey.toLowerCase() === 'accuracy')
        if (accuracyKpi) {
          const accNum = parseFloat(accuracyKpi.value)
          if (!isNaN(accNum)) return (100 - accNum).toFixed(2)
        }
        return 'N/A'
      })(),
      status: 'Normal',
    },
    {
      rowKey: 'Status',
      value: stateVal,
      status: stateVal === 'Normal' ? 'Normal' : 'Warning',
    },
  ]

  const mergedKpis = [...kpis]
  derivedKpis.forEach(derived => {
    if (!mergedKpis.find(k => k.rowKey === derived.rowKey)) {
      mergedKpis.push(derived)
    }
  })

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

  return (
    <div className="bg-gray-900 min-h-screen flex flex-col">
      <Head>
        <title>Mode 4 | CL Dashboard</title>
      </Head>

      <main className="flex-grow container mx-auto px-4 py-8">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          {mergedKpis
            .filter(kpi => ![
              'Jensen–Shannon Divergence',
              'Population Stability Index',
              'Precision (Reference)',
              'Precision (Current)',
              'Recall (Reference)',
              'Recall (Current)',
              'F1 Score (Reference)',
              'F1 Score (Current)',
            ].includes(kpi.rowKey))
            .map(kpi => (
              <div
                key={kpi.rowKey}
                className="bg-blue-900/30 p-4 rounded-lg border border-blue-800/50"
              >
                <h3 className="text-lg font-medium text-blue-200 mb-2">{kpi.rowKey}</h3>
                <p className={`text-xl ${
                  kpi.status === 'Alert' || kpi.status === 'Warning' ? 'text-yellow-400'
                  : kpi.status === 'Error' ? 'text-red-400'
                  : 'text-green-400'
                }`}>
                  {loading ? 'Loading...' : kpi.value}
                </p>
              </div>
            ))
          }
        </div>

        {/* Drift Chart */}
        <div className="bg-gray-800 rounded-xl shadow-md overflow-hidden p-6 mb-6 border border-gray-700 h-80">
          <h2 className="text-2xl font-semibold text-blue-300 mb-4">Drift & Warning Over Time</h2>
          <DriftWarningChart plotData={errors.plotData} />
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


        {/* XAI Result */}
        <div className="bg-gray-800 rounded-xl shadow-md overflow-hidden p-6 mb-6 border border-gray-700">
          <h2 className="text-2xl font-semibold text-blue-300 mb-4">XAI Result</h2>
          <div className="prose prose-invert text-white max-w-none">
            {loading ? 'Loading explanation...' : (
              <ReactMarkdown>
                {xaiExplanation || 'No explanation available'}
              </ReactMarkdown>
            )}
          </div>
        </div>

        {/* Misclassified Table */}
        {/* (Same structure as you already had) */}
      </main>
    </div>
  )
}
