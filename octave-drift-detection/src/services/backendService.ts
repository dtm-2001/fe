export async function fetchData() {
  try {
    console.log("Fetching data from backend via proxy: /api/mode1/data");
    const response = await fetch(`/api/mode1/data`, {
      credentials: 'include',
    });

    console.log("Raw response:", response);

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const rawData = await response.json();

    console.log("Parsed data:", rawData);

    const driftMetrics = rawData.drift_state?.metrics || {};

    const kpis = [
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

    const errors = {
      plotData: rawData.id_error?.map((item: any) => ({
        x: item.time_period || "",
        y: item.Mean_Prediction_Error || 0,
        exceedsThreshold: Math.abs(item.Mean_Prediction_Error) > (rawData.error_percentage_threshold || 0),
      })) || [],
      tableData: rawData.id_error?.map((item: any) => ({
        id: item.id?.toString() || "",
        timePeriod: item.time_period || "",
        meanPrediction: item.Mean_Prediction_Error || 0,
        error: item.Mean_Prediction_Error || 0,
        percentageError: Math.abs(item.Mean_Prediction_Error) || 0,
        status: Math.abs(item.Mean_Prediction_Error) > (rawData.error_percentage_threshold || 0) ? "Alert" : "Normal",
      })) || [],
    };

    // Add outlets_exceeding_threshold data for frontend display
    const outletsExceedingThreshold = rawData.outlets_exceeding_threshold?.map((item: any) => ({
      id: item.id?.toString() || "",
      y_true: item.y_true || 0,
      y_pred: item.y_pred || 0,
      percentage_error: item.percentage_error || 0,
    })) || [];

    const xaiExplanation = rawData.explanation || "No explanation available";

    return {
      kpis,
      errors,
      outletsExceedingThreshold,
      xaiExplanation,
    };
  } catch (error) {
    console.error("Error fetching data:", error);
    throw new Error("Failed to fetch and process data");
  }
}
