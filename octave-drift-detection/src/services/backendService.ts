// services/backendService3.ts

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
}

export interface OutletsExceedingThreshold {
  id: string
  y_true: number
  y_pred: number
  percentage_error: number
}

export interface DashboardData {
  mode: string
  businessUnit: string
  useCase: string
  ShortCode: string
  alertKeeper: string
  runtime: number
}

export interface AllOutlets {
  id: number
  percentage_error: number
  y_pred: number
  y_true: number
}

export interface FetchDataResult {
  kpis: KPI[]
  errors: { plotData: PlotDataPoint[]; tableData: TableDataPoint[] }
  outletsExceedingThreshold: OutletsExceedingThreshold[]
  xaiExplanation: string
  currentPeriod: string
  error_percentage_threshold: number
  dashboardData: DashboardData
  all_outlets: AllOutlets[]
}

export async function fetchData(): Promise<FetchDataResult> {
  try {
    console.log("Fetching data from backend via proxy: /api/mode1/data")
    const response = await fetch(`/api/mode1/data`, {
      credentials: 'include',
    })

    console.log("Raw response:", response)
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`)
    }

    const rawData = await response.json()
    console.log("Parsed data:", rawData)

    // Fetch dashboard.json separately
    console.log("Fetching dashboard.json from public folder")
    const dashResponse = await fetch(`/dashboard.json`)
    if (!dashResponse.ok) {
      throw new Error(`HTTP error fetching dashboard.json! Status: ${dashResponse.status}`)
    }
    const dashboardData = await dashResponse.json()

    const driftMetrics = rawData.drift_state?.metrics || {}

    const kpis: KPI[] = [
      {
        rowKey: "Drift Detected",
        value: rawData.drift_state?.drift_detected ? "Yes" : "No",
        status: rawData.drift_state?.drift_detected ? "Alert" : "Normal",
      },
      {
        rowKey: "Error Percentage Threshold",
        value: rawData.error_percentage_threshold?.toString() || "N/A",
        status: "Normal",
      },
      {
        rowKey: "Average Percentage Error (All)",
        value: rawData.average_percentage_error_all != null
          ? rawData.average_percentage_error_all.toFixed(2)
          : "N/A",
        status: "Normal",
      },
      {
        rowKey: "Average Percentage Error (Exceeding)",
        value: rawData.average_percentage_error_exceeding != null
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
        value: rawData.drift_state?.drift_detected ? "Warning" : "Normal",
        status: rawData.drift_state?.drift_detected ? "Warning" : "Normal",
      },
    ]

    const errors = {
      plotData: rawData.id_error?.map((item: any) => ({
        x: item.id?.toString() || "",
        y: item.Mean_Prediction_Error || 0,
        exceedsThreshold:
          Math.abs(item.Mean_Prediction_Error) > (rawData.error_percentage_threshold || 0),
      })) || [],
      tableData: rawData.id_error?.map((item: any) => ({
        id: item.id?.toString() || "",
        timePeriod: item.time_period || "",
        meanPrediction: item.Mean_Prediction_Error || 0,
        error: item.Mean_Prediction_Error || 0,
        percentageError: Math.abs(item.Mean_Prediction_Error) || 0,
        status:
          Math.abs(item.Mean_Prediction_Error) > (rawData.error_percentage_threshold || 0)
            ? "Alert"
            : "Normal",
      })) || [],
    }

    const outletsExceedingThreshold =
      rawData.outlets_exceeding_threshold?.map((item: any) => ({
        id: item.id?.toString() || "",
        y_true: item.y_true || 0,
        y_pred: item.y_pred || 0,
        percentage_error: item.percentage_error || 0,
      })) || []

    const xaiExplanation = rawData.explanation || "No explanation available"

    const currentPeriod =
      rawData.current_period ?? rawData.currentPeriod ?? "N/A"

    return {
      kpis,
      errors,
      outletsExceedingThreshold,
      xaiExplanation,
      currentPeriod,
      error_percentage_threshold: rawData.error_percentage_threshold || 0,
      dashboardData,
      all_outlets: rawData.all_outlets || [],
    }
  } catch (error) {
    console.error("Error fetching data:", error)
    throw new Error("Failed to fetch and process data")
  }
}
