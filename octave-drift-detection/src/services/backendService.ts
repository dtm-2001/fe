// services/backendService.ts

export interface KPI {
  rowKey: string
  value: string
  status?: string
}

export interface PlotDataPoint {
  x: string
  y: number
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
  id: string
  y_true: number
  y_pred: number
  percentage_error: number
}

export interface AllOutlets {
  id: number
  percentage_error: number
  y_pred: number
  y_true: number
}

export interface MSETrend {
  MSE: number
  time_period: string
}

export interface DashboardData {
  mode: string
  businessUnit: string
  useCase: string
  ShortCode: string
  alertKeeper: string
  runtime: number
}

export interface StatusDistribution {
  good: number
  warning: number
  error: number
}

export interface FetchDataResult {
  kpis: KPI[]
  errors: {
    plotData: PlotDataPoint[]
    tableData: TableDataPoint[]
  }
  outletsExceedingThreshold: OutletsExceedingThreshold[]
  xaiExplanation: string
  currentPeriod: string
  referencePeriod: string
  error_percentage_threshold: number
  dashboardData: DashboardData
  all_outlets: AllOutlets[]
  mse_trend: MSETrend[]
  sorted_periods: string[]
  driftDetected: boolean
  filtered_data?: any[]
  status_distribution: StatusDistribution
}

export async function fetchData(
  { runtime }: { runtime: string } = { runtime: "" }
): Promise<FetchDataResult> {
  try {
    // 1. Fetch drift data
    const resp = await fetch(`/api/mode1/data${runtime ? `?runtime=${runtime}` : ""}`, {
      credentials: "include",
    })
    if (!resp.ok) {
      throw new Error(`HTTP error! Status: ${resp.status}`)
    }
    const rawData: any = await resp.json()

    // 2. Fetch dashboard config
    const dashResp = await fetch(`/dashboard.json`)
    if (!dashResp.ok) {
      throw new Error(`HTTP error fetching dashboard.json! Status: ${dashResp.status}`)
    }
    const dashboardData: DashboardData = await dashResp.json()

    // 3. Extract drift metrics
    const driftMetrics = rawData.drift_state?.metrics || {}
    const driftDetected = rawData.drift_state?.drift_detected ?? false
    const sorted_periods: string[] = rawData.sorted_periods ?? []
    const referencePeriod = sorted_periods.length > 0 ? sorted_periods[0] : "N/A"

    // 4. Build KPI list
    const kpis: KPI[] = [
      {
        rowKey: "Drift Detected",
        value: driftDetected ? "Yes" : "No",
        status: driftDetected ? "Alert" : "Normal",
      },
      {
        rowKey: "Error Percentage Threshold",
        value: String(rawData.error_percentage_threshold ?? "N/A"),
        status: "Normal",
      },
      {
        rowKey: "Average Percentage Error (All)",
        value:
          rawData.average_percentage_error_all != null
            ? rawData.average_percentage_error_all.toFixed(2)
            : "N/A",
        status: "Normal",
      },
      {
        rowKey: "Average Percentage Error (Exceeding)",
        value:
          rawData.average_percentage_error_exceeding != null
            ? rawData.average_percentage_error_exceeding.toFixed(2)
            : "N/A",
        status: "Alert",
      },
      {
        rowKey: "kstest",
        value: driftMetrics.ks_statistic?.toFixed(3) ?? "N/A",
        status: "Normal",
      },
      {
        rowKey: "wasserstein",
        value: driftMetrics.wasserstein_distance?.toFixed(3) ?? "N/A",
        status: "Normal",
      },
      {
        rowKey: "mseRef",
        value: driftMetrics.mean_mse_reference?.toFixed(3) ?? "N/A",
        status: "Normal",
      },
      {
        rowKey: "mseCurrent",
        value: driftMetrics.mean_mse_current?.toFixed(3) ?? "N/A",
        status: "Normal",
      },
      {
        rowKey: "status",
        value: driftDetected ? "Warning" : "Normal",
        status: driftDetected ? "Warning" : "Normal",
      },
    ]

    // 5. Map filtered_data => tableData
    const filtered_data = rawData.filtered_data ?? []
    const tableData: TableDataPoint[] = filtered_data.map((item: any) => {
      const abs_curr_per = item.abs_curr_per ?? 0
      const abs_ref_per = item.abs_ref_per ?? 0
      const diff = abs_curr_per - abs_ref_per
      return {
        id: String(item.id ?? ""),
        timePeriod: item.period ?? "",
        abs_curr_per,
        abs_ref_per,
        difference: diff,
        status: diff > 0 ? "Alert" : "Normal",
      }
    })

    // 6. Build errors object
    const errors = {
      plotData: (rawData.id_error ?? []).map((item: any) => ({
        x: String(item.id ?? ""),
        y: item.Mean_Prediction_Error ?? 0,
        exceedsThreshold:
          Math.abs(item.Mean_Prediction_Error ?? 0) >
          (rawData.error_percentage_threshold ?? 0),
      })),
      tableData:
        tableData.length > 0
          ? tableData
          : (rawData.id_error ?? []).map((item: any) => ({
              id: String(item.id ?? ""),
              timePeriod: item.time_period ?? "",
              meanPrediction: item.Mean_Prediction_Error ?? 0,
              error: item.Mean_Prediction_Error ?? 0,
              percentageError: Math.abs(item.Mean_Prediction_Error ?? 0),
              status:
                Math.abs(item.Mean_Prediction_Error ?? 0) >
                (rawData.error_percentage_threshold ?? 0)
                  ? "Alert"
                  : "Normal",
            })),
    }

    // 7. Outlets exceeding threshold
    const outletsExceedingThreshold: OutletsExceedingThreshold[] =
      (rawData.outlets_exceeding_threshold ?? []).map((item: any) => ({
        id: String(item.id ?? ""),
        y_true: item.y_true ?? 0,
        y_pred: item.y_pred ?? 0,
        percentage_error: item.percentage_error ?? 0,
      }))

    // 8. MSE trend
    const mse_trend: MSETrend[] = (rawData.mse_trend ?? []).map((item: any) => ({
      MSE:
        typeof item.MSE === "number"
          ? item.MSE
          : typeof item.mse === "number"
          ? item.mse
          : 0,
      time_period: item.time_period ?? item.timePeriod ?? "",
    }))

    // 9. XAI explanation and periods
    const xaiExplanation = rawData.explanation ?? "No explanation available"
    const currentPeriod = rawData.current_period ?? rawData.currentPeriod ?? "N/A"
    const error_percentage_threshold = rawData.error_percentage_threshold ?? 0

    // 10. Compute status distribution for pie chart
    const threshold = error_percentage_threshold
    const warningThreshold = threshold * 0.8
    let goodCount = 0
    let warningCount = 0
    let errorCount = 0

    const allTableRows = errors.tableData
    interface TableRowWithDifference {
      difference?: number
      percentageError?: number
    }

    (allTableRows as TableRowWithDifference[]).forEach((row: TableRowWithDifference) => {
      const errVal =
      Math.abs(row.difference ?? row.percentageError ?? 0)
      if (errVal >= threshold) {
      errorCount++
      } else if (errVal >= warningThreshold) {
      warningCount++
      } else {
      goodCount++
      }
    })

    const total = Math.max(goodCount + warningCount + errorCount, 1)
    const good = Math.round((goodCount / total) * 100)
    const warning = Math.round((warningCount / total) * 100)
    const error = 100 - good - warning

    const status_distribution: StatusDistribution = { good, warning, error }

    return {
      kpis,
      errors,
      outletsExceedingThreshold,
      xaiExplanation,
      currentPeriod,
      referencePeriod,
      error_percentage_threshold,
      dashboardData,
      all_outlets: rawData.all_outlets ?? [],
      mse_trend,
      sorted_periods,
      driftDetected,
      filtered_data,
      status_distribution,
    }
  } catch (err) {
    console.error("Error fetching data:", err)
    throw new Error("Failed to fetch and process data")
  }
}
