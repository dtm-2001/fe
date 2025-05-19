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
  abs_curr_per?: number
  abs_ref_per?: number
  difference?: number
}

export interface OutletsExceedingThreshold {
  id: number
  y_true: number
  y_pred: number
  percentage_error: number
}

export interface Indices {
  normal: number[]
  warning: number[]
  drift: number[]
}

export interface AllOutlets {
  id: number
  y_true: number
  y_pred: number
  percentage_error: number
}

// **NEW**: the top-10 misclassified IDs
export interface Top10Id {
  id: string
  time_period: string
  Mean_Prediction_Error: number
}

export async function fetchData(
  { runtime }: { runtime: string } = { runtime: "" }
): Promise<{
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
  referencePeriod: string
  totalOutlets: number
  outletsExceedingThresholdCount: number
  xaiExplanation: string
  error_percentage_threshold: number
  dashboardData: any
  all_outlets: AllOutlets[]
  sorted_periods: string[]
  driftDetected: boolean
}> {
  // 1) Fetch the main data
  const res = await fetch(
    `/api/mode2/data${runtime ? `?runtime=${runtime}` : ""}`,
    { credentials: "include" }
  )
  if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`)
  const raw: any = await res.json()

  // 2) Fetch the dashboard metadata
  const dashRes = await fetch(`/dashboard.json`)
  if (!dashRes.ok) {
    throw new Error(`HTTP error fetching dashboard.json! Status: ${dashRes.status}`)
  }
  const dashboardData = await dashRes.json()

  // 3) Drift detected flag comes from raw.state
  const driftDetected = raw.state?.toLowerCase() === "drift"

  // 4) Period sorting & reference period
  const sorted_periods: string[] = raw.sorted_periods || []
  const referencePeriod =
    sorted_periods.length > 0
      ? sorted_periods[0]
      : raw.current_period || "N/A"

  // 5) Build KPIs directly from your JSON
  const kpis: KPI[] = [
    {
      rowKey: "Drift Detected",
      value: driftDetected ? "Yes" : "No",
      status: driftDetected ? "Alert" : "Normal",
    },
    {
      rowKey: "Error Percentage Threshold",
      value: raw.error_percentage_threshold?.toString() || "N/A",
      status: "Normal",
    },
    {
      rowKey: "Average Percentage Error (All)",
      value:
        raw.average_percentage_error_all != null
          ? raw.average_percentage_error_all.toFixed(2)
          : "N/A",
      status: "Normal",
    },
    {
      rowKey: "Average Percentage Error (Exceeding)",
      value:
        raw.average_percentage_error_exceeding != null
          ? raw.average_percentage_error_exceeding.toFixed(2)
          : "N/A",
      status: "Alert",
    },
    {
      rowKey: "Current Period",
      value: raw.current_period || "N/A",
      status: "Normal",
    },
    {
      rowKey: "Total Outlets",
      value:
        raw.total_outlets != null ? raw.total_outlets.toString() : "N/A",
      status: "Normal",
    },
    {
      rowKey: "Outlets Exceeding Threshold",
      value:
        raw.outlets_exceeding_threshold_count != null
          ? raw.outlets_exceeding_threshold_count.toString()
          : "N/A",
      status:
        raw.outlets_exceeding_threshold_count > 0 ? "Alert" : "Normal",
    },
    {
      rowKey: "State",
      value: raw.state || "N/A",
      status: driftDetected ? "Alert" : "Normal",
    },
  ]

  // 6) Map all outlets
  const all_outlets: AllOutlets[] = (raw.all_outlets || []).map(
    (item: any) => ({
      id: item.id,
      y_true: item.y_true,
      y_pred: item.y_pred,
      percentage_error: item.percentage_error,
    })
  )

  // 7) Map outlets exceeding the threshold
  const outletsExceedingThreshold: OutletsExceedingThreshold[] = (
    raw.outlets_exceeding_threshold || []
  ).map((item: any) => ({
    id: item.id,
    y_true: item.y_true,
    y_pred: item.y_pred,
    percentage_error: item.percentage_error,
  }))

  // 8) Errors – plotData & tableData from id_error
  const idError = raw.id_error || []
  const errors = {
    plotData: idError.map(
      (item: any, idx: number): PlotDataPoint => ({
        x: idx,
        y: item.Mean_Prediction_Error,
        value: item.Mean_Prediction_Error,
        exceedsThreshold:
          Math.abs(item.Mean_Prediction_Error) >
          (raw.error_percentage_threshold || 0),
      })
    ),
    tableData: idError.map((item: any): TableDataPoint => {
      const absCurr = item.abs_curr_per || 0
      const absRef = item.abs_ref_per || 0
      const diff = absCurr - absRef
      return {
        id: item.id.toString(),
        timePeriod: item.time_period,
        meanPrediction: item.Mean_Prediction_Error,
        error: item.Mean_Prediction_Error,
        percentageError: Math.abs(item.Mean_Prediction_Error),
        abs_curr_per: absCurr,
        abs_ref_per: absRef,
        difference: diff,
        status:
          Math.abs(item.Mean_Prediction_Error) >
          (raw.error_percentage_threshold || 0)
            ? "Alert"
            : "Normal",
      }
    }),
  }

  // 9) Top-10 IDs from the payload
  const top10Ids: Top10Id[] = (raw.top_10_ids || []).map((item: any) => ({
    id: item.id.toString(),
    time_period: item.time_period,
    Mean_Prediction_Error: item.Mean_Prediction_Error,
  }))

  // 10) Indices
  const indices: Indices = {
    normal: raw.indices?.normal || [],
    warning: raw.indices?.warning || [],
    drift: raw.indices?.drift || [],
  }

  // 11) Clusters, coverage and backward analysis
  const clusters = raw.clusters || {}
  const coverage = raw.coverage || {}
  const backwardAnalysis = raw.backward_analysis || {}

  // 12) Final return
  return {
    kpis,
    errors,
    top10Ids,
    outletsExceedingThreshold,
    indices,
    state: raw.state || "Unknown",
    coverage,
    clusters,
    backwardAnalysis,
    currentPeriod: raw.current_period || "N/A",
    referencePeriod,
    totalOutlets: raw.total_outlets || 0,
    outletsExceedingThresholdCount:
      raw.outlets_exceeding_threshold_count || 0,
    xaiExplanation: raw.xai?.explanation || "",
    error_percentage_threshold:
      raw.error_percentage_threshold || 0,
    dashboardData,
    all_outlets,
    sorted_periods,
    driftDetected,
  }
}
