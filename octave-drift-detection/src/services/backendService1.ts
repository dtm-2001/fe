// services/backendService2.ts

export interface KPI {
  rowKey: string;
  value: string;
  status?: string;
}

export interface PlotDataPoint {
  x: number;
  y: number;
  value?: number;
  exceedsThreshold: boolean;
}

export interface TableDataPoint {
  id: string;
  timePeriod: string;
  meanPrediction?: number;
  error?: number;
  percentageError?: number;
  status: string;
}

export interface OutletsExceedingThreshold {
  id: string;
  y_true: number;
  y_pred: number;
  percentage_error: number;
}

export interface Indices {
  normal: number[];
  warning: number[];
  drift: number[];
}

export async function fetchData(): Promise<{
  kpis: KPI[];
  errors: { plotData: PlotDataPoint[]; tableData: TableDataPoint[] };
  outletsExceedingThreshold: OutletsExceedingThreshold[];
  indices: Indices;
  state: string;
  coverage: any;
  clusters: any;
  backwardAnalysis: any;
  currentPeriod: string;
  totalOutlets: number;
  outletsExceedingThresholdCount: number;
  xaiExplanation: string;
}> {
  try {
    console.log("Fetching data from backend via proxy: /api/mode2/data");
    const response = await fetch(`/api/mode2/data`, {
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const rawData = await response.json();
    console.log("Parsed data:", rawData);

    const driftMetrics = rawData.drift_state?.metrics || {};

    // 1) Build your KPIs
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
        value: rawData.average_percentage_error_all?.toFixed(2) || "N/A",
        status: "Normal",
      },
      {
        rowKey: "Average Percentage Error (Exceeding)",
        value: rawData.average_percentage_error_exceeding?.toFixed(2) || "N/A",
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
    ];

    // 2) Build your errors.plotData & errors.tableData
    const errors = {
      plotData: (rawData.id_error || []).map(
        (item: any, index: number) => ({
          x: index,
          y: item.Mean_Prediction_Error || 0,
          value: item.Mean_Prediction_Error || 0,
          exceedsThreshold:
            Math.abs(item.Mean_Prediction_Error) >
            (rawData.error_percentage_threshold || 0),
        })
      ),
      tableData: (rawData.id_error || []).map((item: any) => ({
        id: item.id?.toString() || "",
        timePeriod: item.time_period || "",
        meanPrediction: item.Mean_Prediction_Error || 0,
        error: item.Mean_Prediction_Error || 0,
        percentageError: Math.abs(item.Mean_Prediction_Error) || 0,
        status:
          Math.abs(item.Mean_Prediction_Error) >
          (rawData.error_percentage_threshold || 0)
            ? "Alert"
            : "Normal",
      })),
    };

    // 3) Outlets exceeding threshold
    const outletsExceedingThreshold: OutletsExceedingThreshold[] =
      (rawData.outlets_exceeding_threshold || []).map((item: any) => ({
        id: item.id?.toString() || "",
        y_true: item.y_true || 0,
        y_pred: item.y_pred || 0,
        percentage_error: item.percentage_error || 0,
      }));

    // 4) Other dashboard fields
    const state = rawData.state || "Unknown";
    const coverage = rawData.coverage || {};
    const clusters = rawData.clusters || {};
    const backwardAnalysis = rawData.backward_analysis || {};
    const currentPeriod = rawData.current_period || "N/A";
    const totalOutlets = rawData.total_outlets || 0;
    const outletsExceedingThresholdCount =
      rawData.outlets_exceeding_threshold_count || 0;
    const xaiExplanation =
      rawData.xai?.explanation || "No explanation available";

    // 5) Build indices
    // Prefer rawData.indices if present, otherwise derive from clusters + id_error
    let indices: Indices = rawData.indices ?? {
      normal: [],
      warning: [],
      drift: [],
    };

    if (!rawData.indices) {
      const warningSet = new Set(rawData.clusters?.warning ?? []);
      const driftSet = new Set(rawData.clusters?.drift ?? []);
      const normalIndices: number[] = [];
      const warningIndices: number[] = [];
      const driftIndices: number[] = [];

      (rawData.id_error || []).forEach((item: any, idx: number) => {
        const idStr = item.id?.toString() ?? "";
        if (warningSet.has(idStr)) {
          warningIndices.push(idx);
        } else if (driftSet.has(idStr)) {
          driftIndices.push(idx);
        } else {
          normalIndices.push(idx);
        }
      });

      indices = { normal: normalIndices, warning: warningIndices, drift: driftIndices };
    }

    return {
      kpis,
      errors,
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
    };
  } catch (error) {
    console.error("Error fetching data:", error);
    throw new Error("Failed to fetch and process data");
  }
}
