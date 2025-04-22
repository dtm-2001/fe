import 'chart.js'

declare module 'chart.js' {
  interface ChartTypeRegistry {
    matrix: {
      chartOptions: any
      datasetOptions: any
      defaultDataPoint: {x: number, y: number, value: number}
    }
  }
}