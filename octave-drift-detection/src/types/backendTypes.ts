export interface BackendErrorData {
  timePeriod: string;
  meanPrediction: number;
  error: number;
  exceedsThreshold: boolean;
}

export interface BackendKPI {
  rowKey: string;
  value: string;
}

export interface Mode3MetricsResponse {
  confusionMatrix: {
    reference: {
      trueA: number;
      falseB: number;
      trueB: number;
      falseA: number;
      precision: number;
      recall: number;
      f1: number;
      accuracy: number;
    };
    current: {
      trueA: number;
      falseB: number;
      trueB: number;
      falseA: number;
      precision: number;
      recall: number;
      f1: number;
      accuracy: number;
    };
  };
  driftMetrics: {
    jensenShannon: number;
    psi: number;
    precisionChange: number;
    recallChange: number;
    f1Change: number;
    classAToBChange: number;
    classBToAChange: number;
    errorRate: number;
  };
  statusInfo: {
    status: string;
    alertTime: string;
    runtimeCount: number;
    alertKeeper: string;
  };
}
