'use client'
import { useEffect, useRef } from 'react'
import { Chart } from 'chart.js'
import { MatrixController, MatrixElement } from 'chartjs-chart-matrix'
import type { MatrixDataPoint, MatrixDatasetOptions } from 'chartjs-chart-matrix'
import 'chart.js/auto'

// Register the matrix chart type
Chart.register(MatrixController, MatrixElement)

export default function ConfusionMatrix({ data, labels, title }: {
  data: number[][]
  labels: string[]
  title: string
}) {
  const chartRef = useRef<Chart | null>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (!canvasRef.current) return

    const ctx = canvasRef.current.getContext('2d')
    if (!ctx) return

    if (chartRef.current) {
      chartRef.current.destroy()
    }

    const matrixData = data.flatMap((row, y) => 
      row.map((value, x) => ({x, y, value}))
    )

    chartRef.current = new Chart(ctx, {
      type: 'matrix',
      data: {
        datasets: [{
          label: title,
          data: matrixData,
          backgroundColor(context: { dataset: { data: { value: number }[] }, dataIndex: number }) {
            const value = context.dataset.data[context.dataIndex].value
            const alpha = Math.min(1, value * 1.5)
            return `rgba(59, 130, 246, ${alpha})`
          },
          borderColor: 'rgba(255, 255, 255, 0.1)',
          borderWidth: 1,
          width: ({chart}: {chart: { chartArea: { width: number } }}) => (chart.chartArea.width - 50) / data.length,
          height: ({chart}: {chart: { chartArea: { height: number } }}) => (chart.chartArea.height - 50) / data[0].length
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (context: { dataset: { data: { x: number, y: number, value: number }[] }, dataIndex: number }) => {
                const point = context.dataset.data[context.dataIndex]
                return `${labels[point.x]} → ${labels[point.y]}: ${point.value.toFixed(2)}`
              }
            }
          }
        },
        scales: {
          x: {
            type: 'category',
            labels: labels,
            offset: true,
            grid: { display: false },
            ticks: { color: '#e5e7eb' }
          },
          y: {
            type: 'category',
            labels: labels,
            offset: true,
            grid: { display: false },
            ticks: { color: '#e5e7eb' }
          }
        }
      }
    })

    return () => {
      if (chartRef.current) {
        chartRef.current.destroy()
      }
    }
  }, [data, labels, title])

  return (
    <div className="relative h-full w-full">
      <h3 className="text-lg font-medium text-blue-200 mb-2">{title}</h3>
      <canvas ref={canvasRef} className="w-full h-full" />
    </div>
  )
}