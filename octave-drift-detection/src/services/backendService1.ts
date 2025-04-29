// services/backendService1.ts

export interface KPI {
  rowKey: string
  value: string
  status?: string
}

export interface PlotDataPoint {
  x: number
  y: number
  value?: number
  exceedsThreshold: boolean
}

export interface TableDataPoint {
  id: string
  timePeriod: string
  meanPrediction?: number
  error?: number
  percentageError?: number
  status: string
}

export interface OutletsExceedingThreshold {
  id: string
  y_true: number
  y_pred: number
  percentage_error: number
}

export interface Indices {
  normal: number[]
  warning: number[]
  drift: number[]
}

// **NEW**: the top-10 misclassified IDs
export interface Top10Id {
  id: string
  time_period: string
  Mean_Prediction_Error: number
}

export async function fetchData(): Promise<{
  kpis: KPI[]
  errors: { plotData: PlotDataPoint[]; tableData: TableDataPoint[] }
  top10Ids: Top10Id[]
  outletsExceedingThreshold: OutletsExceedingThreshold[]
  indices: Indices
  state: string
  coverage: any
  clusters: any
  backwardAnalysis: any
  currentPeriod: string
  totalOutlets: number
  outletsExceedingThresholdCount: number
  xaiExplanation: string
  error_percentage_threshold: number
}> {
  const res = await fetch('/api/mode2/data', { credentials: 'include' })
  if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`)
  const raw = await res.json()

  // 1) KPIs (as before)…
  const driftMetrics = raw.drift_state?.metrics || {}
  const kpis: KPI[] = [
    {
      rowKey: 'Drift Detected',
      value: raw.drift_state?.drift_detected ? 'Yes' : 'No',
      status: raw.drift_state?.drift_detected ? 'Alert' : 'Normal',
    },
    {
      rowKey: 'Error Percentage Threshold',
      value: raw.error_percentage_threshold?.toString() || 'N/A',
      status: 'Normal',
    },
    {
      rowKey: 'Average Percentage Error (All)',
      value: raw.average_percentage_error_all?.toFixed(2) || 'N/A',
      status: 'Normal',
    },
    {
      rowKey: 'Average Percentage Error (Exceeding)',
      value: raw.average_percentage_error_exceeding?.toFixed(2) || 'N/A',
      status: 'Alert',
    },
    {
      rowKey: 'kstest',
      value: driftMetrics.ks_statistic?.toFixed(3) || 'N/A',
      status: 'Normal',
    },
    {
      rowKey: 'wasserstein',
      value: driftMetrics.wasserstein_distance?.toFixed(3) || 'N/A',
      status: 'Normal',
    },
    {
      rowKey: 'mseRef',
      value: driftMetrics.mean_mse_reference?.toFixed(3) || 'N/A',
      status: 'Normal',
    },
    {
      rowKey: 'mseCurrent',
      value: driftMetrics.mean_mse_current?.toFixed(3) || 'N/A',
      status: 'Normal',
    },
    {
      rowKey: 'status',
      value: raw.drift_state?.drift_detected ? 'Warning' : 'Normal',
      status: raw.drift_state?.drift_detected ? 'Warning' : 'Normal',
    },
  ]

  // 2) errors.plotData & tableData
  const idError = raw.id_error || []
  const errors = {
    plotData: idError.map((item: any, idx: number) => ({
      x: idx,
      y: item.Mean_Prediction_Error || 0,
      value: item.Mean_Prediction_Error || 0,
      exceedsThreshold:
        Math.abs(item.Mean_Prediction_Error) >
        (raw.error_percentage_threshold || 0),
    })),
    tableData: idError.map((item: any) => ({
      id: item.id?.toString() || '',
      timePeriod: item.time_period || '',
      meanPrediction: item.Mean_Prediction_Error || 0,
      error: item.Mean_Prediction_Error || 0,
      percentageError: Math.abs(item.Mean_Prediction_Error) || 0,
      status:
        Math.abs(item.Mean_Prediction_Error) >
        (raw.error_percentage_threshold || 0)
          ? 'Alert'
          : 'Normal',
    })),
  }

  // 3) Top-10 by absolute error
  const top10Ids: Top10Id[] = [...idError]
    .sort(
      (a: any, b: any) =>
        Math.abs(b.Mean_Prediction_Error) - Math.abs(a.Mean_Prediction_Error)
    )
    .slice(0, 10)
    .map((item: any) => ({
      id: item.id?.toString() || '',
      time_period: item.time_period || '',
      Mean_Prediction_Error: item.Mean_Prediction_Error || 0,
    }))

  // 4) Outlets
  const outletsExceedingThreshold: OutletsExceedingThreshold[] =
    (raw.outlets_exceeding_threshold || []).map((item: any) => ({
      id: item.id?.toString() || '',
      y_true: item.y_true || 0,
      y_pred: item.y_pred || 0,
      percentage_error: item.percentage_error || 0,
    }))

  // 5) Build indices from raw.indices or clusters fallback
  let indices: Indices = raw.indices ?? { normal: [], warning: [], drift: [] }
  if (!raw.indices) {
    const w = new Set(raw.clusters?.warning || [])
    const d = new Set(raw.clusters?.drift || [])
    const n: number[] = []
    const widx: number[] = []
    const didx: number[] = []
    idError.forEach((item: any, idx: number) => {
      const idStr = item.id?.toString()
      if (w.has(idStr)) widx.push(idx)
      else if (d.has(idStr)) didx.push(idx)
      else n.push(idx)
    })
    indices = { normal: n, warning: widx, drift: didx }
  }

  // 6) Other fields
  const state = raw.state || 'Unknown'
  const coverage = raw.coverage || {}
  const clusters = raw.clusters || {}
  const backwardAnalysis = raw.backward_analysis || {}
  const currentPeriod = raw.current_period || 'N/A'
  const totalOutlets = raw.total_outlets || 0
  const outletsExceedingThresholdCount = raw.outlets_exceeding_threshold_count || 0
  const xaiExplanation = raw.xai?.explanation || 'No explanation available'

  return {
    kpis,
    errors,
    top10Ids,
    outletsExceedingThreshold,
    indices,
    state,
    coverage,
    clusters,
    backwardAnalysis,
    currentPeriod,
    totalOutlets,
    outletsExceedingThresholdCount,
    xaiExplanation,
    error_percentage_threshold: raw.error_percentage_threshold || 0,
  }
}
