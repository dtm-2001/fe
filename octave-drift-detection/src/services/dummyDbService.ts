import { KPI, ErrorData } from '../types/dbTypes';

export async function getBusinessUnits() {
  const response = await fetch('/api/businessUnits');
  return await response.json();
}

export async function getUseCases(businessUnit: string) {
  const response = await fetch(`/api/useCases?businessUnit=${businessUnit}`);
  return await response.json();
}

export async function getKPIs(mode: string): Promise<KPI[]> {
  const response = await fetch(`/api/metrics?mode=${mode}`);
  const data = await response.json();
  return data.map((item: any) => ({
    rowKey: item.rowKey,
    value: item.value,
    ...(item.status && { status: item.status })
  }));
}

export async function getErrorData(): Promise<ErrorData[]> {
  const response = await fetch('/api/errors');
  const data = await response.json();
  return data.map((item: any) => ({
    timePeriod: item.timePeriod,
    meanPrediction: item.meanPrediction,
    error: item.error,
    exceedsThreshold: item.exceedsThreshold
  }));
}
