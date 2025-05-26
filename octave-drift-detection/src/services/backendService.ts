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

// ← Changed: this now matches what your TSX expects
export interface MSETrend {
  MAPE: number
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
  mse_trend: MSETrend[]            // ← still called `mse_trend`
  sorted_periods: string[]
  driftDetected: boolean
  filtered_data: any[]
  status_distribution: StatusDistribution
}

export async function fetchData(
  { runtime }: { runtime: string } = { runtime: "" }
): Promise<FetchDataResult> {
  try {
    // 1. Fetch drift data
    const resp = await fetch(
      `/api/mode1/data${runtime ? `?runtime=${encodeURIComponent(runtime)}` : ""}`,
      { credentials: "include" }
    )
    if (!resp.ok) {
      throw new Error(`HTTP error fetching drift data! Status: ${resp.status}`)
    }
    const rawData: any = await resp.json()

    // 2. Fetch dashboard config
    const dashResp = await fetch(`/dashboard.json`)
    if (!dashResp.ok) {
      throw new Error(`HTTP error fetching dashboard.json! Status: ${dashResp.status}`)
    }
    const dashboardData: DashboardData = await dashResp.json()

    // 3. Core periods & threshold
    const sorted_periods: string[] = rawData.sorted_periods ?? []
    const referencePeriod = sorted_periods[0] ?? "N/A"
    const currentPeriod = rawData.current_period ?? "N/A"
    const error_percentage_threshold: number = rawData.error_percentage_threshold ?? 0

    // 4. Drift state & metrics
    const driftDetected: boolean = rawData.drift_state?.drift_detected ?? false
    const driftMetrics = rawData.drift_state?.metrics ?? {}

    // 5. Build KPI list exactly matching your TSX keys
    const kpis: KPI[] = [
      {
        rowKey: "Ref MSE",
        value:
          driftMetrics.mean_mse_reference != null
            ? driftMetrics.mean_mse_reference.toFixed(3)
            : "N/A",
        status: "Normal",
      },
      {
        rowKey: "Curr MSE",
        value:
          driftMetrics.mean_mse_current != null
            ? driftMetrics.mean_mse_current.toFixed(3)
            : "N/A",
        status: driftDetected ? "Warning" : "Normal",
      },
      {
        rowKey: "Drift Detected",
        value: driftDetected ? "Yes" : "No",
        status: driftDetected ? "Alert" : "Normal",
      },
      {
        rowKey: "Error Percentage Threshold",
        value: error_percentage_threshold.toFixed(2),
        status: "Normal",
      },
      {
        rowKey: "Total Outlets",
        value: String(rawData.total_outlets ?? "N/A"),
        status: "Normal",
      },
      {
        rowKey: "Exceeding Count",
        value: String(rawData.outlets_exceeding_threshold_count ?? "N/A"),
        status: "Alert",
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
        rowKey: "KS Statistic",
        value: driftMetrics.ks_statistic?.toFixed(3) ?? "N/A",
        status: "Normal",
      },
      {
        rowKey: "KS p-value",
        value: driftMetrics.ks_p_value?.toFixed(3) ?? "N/A",
        status: "Normal",
      },
      {
        rowKey: "Wasserstein",
        value: driftMetrics.wasserstein_distance?.toFixed(3) ?? "N/A",
        status: "Normal",
      },
      {
        rowKey: "Status",
        value: driftDetected ? "Warning" : "Normal",
        status: driftDetected ? "Warning" : "Normal",
      },
    ]

    // 6. Plot-data
    const plotData: PlotDataPoint[] = (rawData.id_error ?? []).map((item: any) => ({
      x: item.time_period ?? "",
      y: item.Mean_Prediction_Error ?? 0,
      exceedsThreshold:
        Math.abs(item.Mean_Prediction_Error ?? 0) > error_percentage_threshold,
    }))

    // 7. Table-data
    const filtered_data = rawData.filtered_data ?? []
    const tableData: TableDataPoint[] = filtered_data.map((item: any) => {
      const abs_curr = item.abs_curr_per ?? 0
      const abs_ref = item.abs_ref_per ?? 0
      const diff = item.abs_diff ?? abs_curr - abs_ref
      return {
        id: String(item.id ?? ""),
        timePeriod: item.time_period ?? "",
        abs_curr_per: abs_curr,
        abs_ref_per: abs_ref,
        difference: diff,
        status: diff > error_percentage_threshold ? "Alert" : "Normal",
      }
    })

    // 8. Fallback if no filtered_data
    const fallbackTable: TableDataPoint[] = (rawData.id_error ?? []).map((item: any) => {
      const err = item.Mean_Prediction_Error ?? 0
      return {
        id: String(item.id ?? ""),
        timePeriod: item.time_period ?? "",
        meanPrediction: err,
        error: err,
        percentageError: Math.abs(err),
        status:
          Math.abs(err) > error_percentage_threshold ? "Alert" : "Normal",
      }
    })

    // 9–10. Outlets lists
    const outletsExceedingThreshold: OutletsExceedingThreshold[] =
      (rawData.outlets_exceeding_threshold ?? []).map((item: any) => ({
        id: String(item.id ?? ""),
        y_true: item.y_true ?? 0,
        y_pred: item.y_pred ?? 0,
        percentage_error: item.percentage_error ?? 0,
      }))

    const allOutlets: AllOutlets[] =
      (rawData.all_outlets ?? []).map((item: any) => ({
        id: Number(item.id ?? 0),
        y_true: item.y_true ?? 0,
        y_pred: item.y_pred ?? 0,
        percentage_error: item.percentage_error ?? 0,
      }))

    // 11. MSE trend → now emits `MAPE` so your TSX’s `.map(d=>d.MAPE)` works
    const mse_trend: MSETrend[] = (rawData.mse_trend ?? []).map((item: any) => ({
      MAPE: item.MAPE ?? 0,
      time_period: item.time_period ?? "",
    }))

    // 12. XAI HTML
    const xaiExplanation: string = rawData.explanation ?? ""

    // 13. Status‐distribution (for your pie chart)
    const threshold = error_percentage_threshold
    const warnTh = threshold * 0.8
    let goodCount = 0, warningCount = 0, errorCount = 0
    const sourceTable = tableData.length > 0 ? tableData : fallbackTable
    sourceTable.forEach(r => {
      const val = Math.abs(r.difference ?? r.percentageError ?? 0)
      if (val >= threshold) errorCount++
      else if (val >= warnTh) warningCount++
      else goodCount++
    })
    const total = Math.max(goodCount + warningCount + errorCount, 1)
    const status_distribution: StatusDistribution = {
      good: Math.round((goodCount / total) * 100),
      warning: Math.round((warningCount / total) * 100),
      error:
        100 -
        Math.round((goodCount / total) * 100) -
        Math.round((warningCount / total) * 100),
    }

    return {
      kpis,
      errors: {
        plotData,
        tableData: tableData.length > 0 ? tableData : fallbackTable,
      },
      outletsExceedingThreshold,
      xaiExplanation,
      currentPeriod,
      referencePeriod,
      error_percentage_threshold,
      dashboardData,
      all_outlets: allOutlets,
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
