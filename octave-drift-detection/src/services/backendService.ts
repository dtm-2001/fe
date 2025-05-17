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

export interface DashboardData {
  mode: string
  businessUnit: string
  useCase: string
  ShortCode: string
  alertKeeper: string
  runtime: number
}

// **New** interface for the MSE time-series
export interface MSETrend {
  MSE: number
  time_period: string
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
  referencePeriod?: string
  error_percentage_threshold: number
  dashboardData: DashboardData
  all_outlets: AllOutlets[]
  mse_trend: MSETrend[]
  sorted_periods: string[]
  driftDetected: boolean
  filtered_data?: any[]
}

export async function fetchData({ runtime }: { runtime: string } = { runtime: "" }): Promise<FetchDataResult> {
  try {
    console.log("Fetching data from backend via proxy: /api/mode1/data")
    const response = await fetch(`/api/mode1/data${runtime ? `?runtime=${runtime}` : ""}`, {
      credentials: "include",
    })

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`)
    }
    const rawData = await response.json()
    console.log("Parsed data:", rawData)

    // dashboard.json from public folder
    console.log("Fetching dashboard.json from public folder")
    const dashResponse = await fetch(`/dashboard.json`)
    if (!dashResponse.ok) {
      throw new Error(`HTTP error fetching dashboard.json! Status: ${dashResponse.status}`)
    }
    const dashboardData: DashboardData = await dashResponse.json()

    // Metrics nested under drift_state
    const driftMetrics = rawData.drift_state?.metrics || {}

    // Extract drift detection status
    const driftDetected = rawData.drift_state?.drift_detected || false

    // Extract sorted periods array
    const sorted_periods = rawData.sorted_periods || []

    // Get reference period (first element in sorted_periods if available)
    const referencePeriod = sorted_periods.length > 0 ? sorted_periods[0] : "N/A"

    const kpis: KPI[] = [
      {
        rowKey: "Drift Detected",
        value: driftDetected ? "Yes" : "No",
        status: driftDetected ? "Alert" : "Normal",
      },
      {
        rowKey: "Error Percentage Threshold",
        value: rawData.error_percentage_threshold?.toString() || "N/A",
        status: "Normal",
      },
      {
        rowKey: "Average Percentage Error (All)",
        value: rawData.average_percentage_error_all != null ? rawData.average_percentage_error_all.toFixed(2) : "N/A",
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
        value: driftMetrics.ks_statistic?.toFixed(3) || "N/A",
        status: "Normal",
      },
      {
        rowKey: "wasserstein",
        value: driftMetrics.wasserstein_distance?.toFixed(3) || "N/A",
        status: "Normal",
      },
      {
        rowKey: "mseRef",
        value: driftMetrics.mean_mse_reference?.toFixed(3) || "N/A",
        status: "Normal",
      },
      {
        rowKey: "mseCurrent",
        value: driftMetrics.mean_mse_current?.toFixed(3) || "N/A",
        status: "Normal",
      },
      {
        rowKey: "status",
        value: driftDetected ? "Warning" : "Normal",
        status: driftDetected ? "Warning" : "Normal",
      },
    ]

    // Extract filtered_data for the error comparison table
    const filtered_data = rawData.filtered_data || []

    // Map the filtered data to the table data format
    const tableData = filtered_data.map((item: any) => {
      const abs_curr_per = item.abs_curr_per || 0
      const abs_ref_per = item.abs_ref_per || 0
      const difference = abs_curr_per - abs_ref_per

      return {
        id: item.id?.toString() || "",
        timePeriod: item.period || "",
        abs_curr_per,
        abs_ref_per,
        difference,
        status: difference > 0 ? "Alert" : "Normal",
      }
    })

    const errors = {
      plotData: (rawData.id_error || []).map((item: any) => ({
        x: item.id?.toString() || "",
        y: item.Mean_Prediction_Error || 0,
        exceedsThreshold: Math.abs(item.Mean_Prediction_Error) > (rawData.error_percentage_threshold || 0),
      })),
      tableData:
        tableData.length > 0
          ? tableData
          : (rawData.id_error || []).map((item: any) => ({
              id: item.id?.toString() || "",
              timePeriod: item.time_period || "",
              meanPrediction: item.Mean_Prediction_Error || 0,
              error: item.Mean_Prediction_Error || 0,
              percentageError: Math.abs(item.Mean_Prediction_Error) || 0,
              status:
                Math.abs(item.Mean_Prediction_Error) > (rawData.error_percentage_threshold || 0) ? "Alert" : "Normal",
            })),
    }

    const outletsExceedingThreshold: OutletsExceedingThreshold[] = (rawData.outlets_exceeding_threshold || []).map(
      (item: any) => ({
        id: item.id?.toString() || "",
        y_true: item.y_true || 0,
        y_pred: item.y_pred || 0,
        percentage_error: item.percentage_error || 0,
      }),
    )

    // Map your backend's MSE time series into our frontend shape
    const mse_trend: MSETrend[] = (rawData.mse_trend || []).map((item: any) => ({
      MSE: typeof item.MSE === "number" ? item.MSE : (item.mse ?? 0),
      time_period: item.time_period || item.timePeriod || "",
    }))

    const xaiExplanation: string = rawData.explanation || "No explanation available"
    const currentPeriod: string = rawData.current_period ?? rawData.currentPeriod ?? "N/A"

    return {
      kpis,
      errors,
      outletsExceedingThreshold,
      xaiExplanation,
      currentPeriod,
      referencePeriod,
      error_percentage_threshold: rawData.error_percentage_threshold || 0,
      dashboardData,
      all_outlets: rawData.all_outlets || [],
      mse_trend,
      sorted_periods,
      driftDetected,
      filtered_data,
    }
  } catch (error) {
    console.error("Error fetching data:", error)
    throw new Error("Failed to fetch and process data")
  }
}
