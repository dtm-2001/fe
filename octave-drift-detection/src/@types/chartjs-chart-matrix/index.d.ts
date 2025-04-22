declare module 'chartjs-chart-matrix' {
  import { ChartComponent } from 'chart.js'

  export const MatrixController: ChartComponent
  export const MatrixElement: ChartComponent

  export interface MatrixDataPoint {
    x: number
    y: number
    value: number
  }

  export interface MatrixDatasetOptions {
    width?: (ctx: {chart: {chartArea: {width: number}}}) => number
    height?: (ctx: {chart: {chartArea: {height: number}}}) => number
  }
}
