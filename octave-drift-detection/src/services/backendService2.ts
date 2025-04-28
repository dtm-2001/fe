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
  status: string;
}

export interface OutletsExceedingThreshold {
  id: string;
  y_true: number;
  y_pred: number;
  percentage_error: number;
}

export interface DetailedMetric {
  total_samples: number;
  correct_predictions: { count: number; percentage: number; };
  incorrect_predictions: { count: number; percentage: number; };
  misclassifications: Record<string, { count: number; percentage: number; }>;
}

export async function fetchData(): Promise<{
  kpis: KPI[];
  errors: { plotData: PlotDataPoint[]; tableData: TableDataPoint[] };
  referenceMatrix: number[][];
  currentMatrix: number[][];
  outletsExceedingThreshold: OutletsExceedingThreshold[];
  detailedMetrics: Record<string, DetailedMetric>;
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
    console.log("Fetching data from backend via relative URL: /mode3/data");
    const response = await fetch(`/mode3/data`, { credentials: 'include' });
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const rawData = await response.json();
    console.log("Parsed data:", rawData);

    // 1) Build KPIs
    const kpis: KPI[] = [
      {
        rowKey: "Drift Detected",
        value: rawData.drift_state?.drift_detected ? "Yes" : "No",
        status: rawData.drift_state?.drift_detected ? "Alert" : "Normal",
      },
      {
        rowKey: "Jensen–Shannon Divergence",
        value: rawData.drift_state?.jensen_shannon_divergence
          ? rawData.drift_state.jensen_shannon_divergence.toFixed(4)
          : "N/A",
        status: "Normal",
      },
      {
        rowKey: "Population Stability Index",
        value: rawData.drift_state?.population_stability_index
          ? rawData.drift_state.population_stability_index.toFixed(4)
          : "N/A",
        status: "Normal",
      },
      {
        rowKey: "Precision (Reference)",
        value: rawData.metrics?.reference?.precision
          ? rawData.metrics.reference.precision.toFixed(4)
          : "N/A",
        status: "Normal",
      },
      {
        rowKey: "Precision (Current)",
        value: rawData.metrics?.current?.precision
          ? rawData.metrics.current.precision.toFixed(4)
          : "N/A",
        status: "Normal",
      },
      {
        rowKey: "Recall (Reference)",
        value: rawData.metrics?.reference?.recall
          ? rawData.metrics.reference.recall.toFixed(4)
          : "N/A",
        status: "Normal",
      },
      {
        rowKey: "Recall (Current)",
        value: rawData.metrics?.current?.recall
          ? rawData.metrics.current.recall.toFixed(4)
          : "N/A",
        status: "Normal",
      },
      {
        rowKey: "F1 Score (Reference)",
        value: rawData.metrics?.reference?.f1_score
          ? rawData.metrics.reference.f1_score.toFixed(4)
          : "N/A",
        status: "Normal",
      },
      {
        rowKey: "F1 Score (Current)",
        value: rawData.metrics?.current?.f1_score
          ? rawData.metrics.current.f1_score.toFixed(4)
          : "N/A",
        status: "Normal",
      },
      {
        rowKey: "Accuracy",
        value: rawData.overall_metrics?.accuracy != null
          ? rawData.overall_metrics.accuracy.toFixed(2)
          : "N/A",
        status: "Normal",
      },
      {
        rowKey: "Error Rate",
        value: rawData.overall_metrics?.error_rate != null
          ? rawData.overall_metrics.error_rate.toFixed(2)
          : "N/A",
        status: "Normal",
      },
      {
        rowKey: "Status",
        value: rawData.drift_state?.drift_detected ? "Warning" : "Normal",
        status: rawData.drift_state?.drift_detected ? "Warning" : "Normal",
      },
    ];

    // 2) Pull both reference & current confusion-matrices
    const referenceMatrix: number[][] =
      rawData.confusion_matrices?.reference ??
      rawData.confusion_matrix?.normalized ??
      rawData.confusion_matrix?.raw ??
      [];
    const currentMatrix: number[][] =
      rawData.confusion_matrices?.current ??
      rawData.confusion_matrix?.normalized ??
      rawData.confusion_matrix?.raw ??
      [];

    // 3) Flatten referenceMatrix into plotData
    const plotData: PlotDataPoint[] = [];
    referenceMatrix.forEach((row, y) =>
      row.forEach((val, x) =>
        plotData.push({ x, y, value: val, exceedsThreshold: false })
      )
    );

    // 4) Table of misclassified cases
    const tableData: TableDataPoint[] = (rawData.misclassified_table || []).map(
      (item: any) => ({
        id: item.id,
        timePeriod: `True ${item.True} → Pred ${item.Predicted}`,
        status: "Misclassified",
      })
    );

    // 5) Outlets (we no longer need them—but still return for backward compatibility)
    const outletsExceedingThreshold = (rawData.outlets_exceeding_threshold || []).map(
      (item: any) => ({
        id: item.id?.toString() || "",
        y_true: item.y_true || 0,
        y_pred: item.y_pred || 0,
        percentage_error: item.percentage_error || 0,
      })
    );

    // 6) Detailed metrics
    const detailedMetrics: Record<string, DetailedMetric> =
      rawData.detailed_metrics || {};

    // 7) Other fields
    return {
      kpis,
      errors: { plotData, tableData },
      referenceMatrix,
      currentMatrix,
      outletsExceedingThreshold,
      detailedMetrics,
      state: rawData.state || "Unknown",
      coverage: rawData.coverage || {},
      clusters: rawData.clusters || {},
      backwardAnalysis: rawData.backward_analysis || {},
      currentPeriod: rawData.current_period || "N/A",
      totalOutlets: rawData.total_outlets || 0,
      outletsExceedingThresholdCount:
        rawData.outlets_exceeding_threshold_count || 0,
      xaiExplanation: rawData.explanation || "No explanation available",
    };
  } catch (error) {
    console.error("Error fetching data:", error);
    throw new Error("Failed to fetch and process data");
  }
}
