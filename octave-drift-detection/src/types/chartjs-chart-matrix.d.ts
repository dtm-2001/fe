import type { ChartComponent, ChartTypeRegistry } from 'chart.js';

declare module 'chartjs-chart-matrix' {
  import 'chart.js';
  export const MatrixController: ChartComponent & {
    id: 'matrix';
    defaults: {};
    defaultRoutes: {};
  };
  
  export const MatrixElement: ChartComponent & {
    id: 'matrix';
    defaults: {
      width: number;
      height: number;
    };
  };

  export interface MatrixDataPoint {
    x: number;
    y: number; 
    value: number;
  }

  export interface MatrixDatasetOptions {
    width?: (ctx: {chart: {chartArea: {width: number}}}) => number;
    height?: (ctx: {chart: {chartArea: {height: number}}}) => number;
  }

  interface ChartTypeRegistry {
    matrix: {
      chartOptions: {};
      datasetOptions: MatrixDatasetOptions;
      defaultDataPoint: MatrixDataPoint;
      parsedDataType: MatrixDataPoint;
      scales: {};
    };
  }
}
