export interface KPI {
  rowKey: string;
  value: string;
  status?: string;
  businessUnit?: string;
  useCase?: string;
}

export interface PlotDataPoint {
  x: string;
  y: number;
  exceedsThreshold: boolean;
}

export interface RawErrorData {
  id?: string;
  timePeriod?: string;
  meanPrediction?: number;
  error?: number;
  percentageError?: number;
  exceedsThreshold?: boolean;
  dbId?: number;
}

export interface TableDataPoint {
  id: string;
  timePeriod: string;
  meanPrediction: number;
  error: number;
  percentageError: number;
  status: string;
}

export interface ErrorData {
  id: string;
  timePeriod: string;
  meanPrediction: number;
  error: number;
  exceedsThreshold: boolean;
  yTrue?: number;
  yPred?: number;
  percentageError?: number;
}
