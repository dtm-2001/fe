interface KPI {
  rowKey: string
  value: string
  alertTime?: string
  runtimeCount?: string
  status?: 'Normal' | 'Warning' | 'Error'
}

interface ErrorData {
  timePeriod: string
  meanPrediction: number
  error: number
  exceedsThreshold?: boolean
  yTrue?: number
  yPred?: number
  percentageError?: number
}

interface BusinessUnit {
  id: string
  name: string
}

interface UseCase {
  id: string
  name: string
  businessUnitId: string
}