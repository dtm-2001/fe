'use client';
import React, { useEffect, useRef } from 'react';
import { Chart, registerables } from 'chart.js';
Chart.register(...registerables);

interface PlotDataPoint {
  x: number;
  y: number;
  exceedsThreshold: boolean;
}

interface DriftWarningChartProps {
  plotData: PlotDataPoint[];
}

export default function DriftWarningChart({ plotData }: DriftWarningChartProps): React.ReactElement {
  const chartRef = useRef<Chart | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    console.log('DriftWarningChart plotData length:', plotData.length);
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    if (chartRef.current) {
      chartRef.current.destroy();
    }

    chartRef.current = new Chart(ctx, {
      type: 'scatter',
      data: {
        datasets: [
          {
            label: 'Drift State',
            data: plotData.map((item) => ({ x: item.x, y: item.y })),
            borderColor: 'rgb(75, 192, 192)',
            backgroundColor: 'rgba(75, 192, 192, 0.8)',
            pointBackgroundColor: plotData.map((item) => {
              if (item.y === 0) return 'rgba(54, 162, 235, 0.8)'; // normal - blue
              if (item.y === 1) return 'rgba(255, 206, 86, 0.8)'; // warning - yellow
              if (item.y === 2) return 'rgba(255, 99, 132, 0.8)'; // drift - red
              return 'rgba(201, 203, 207, 0.8)'; // default grey
            }),
            borderWidth: 2,
            showLine: true,
            tension: 0.1,
            fill: false,
            stepped: false,
            pointRadius: 5,
            pointHoverRadius: 7,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            labels: {
              color: '#e5e7eb',
            },
          },
          tooltip: {
            mode: 'nearest',
            intersect: true,
            callbacks: {
              label: function(context) {
                const y = context.parsed.y;
                if (y === 0) return 'Normal';
                if (y === 1) return 'Warning';
                if (y === 2) return 'Drift';
                return 'Unknown';
              }
            }
          },
        },
        scales: {
          x: {
            type: 'linear',
            title: {
              display: true,
              text: 'Index',
              color: '#93c5fd',
              font: {
                weight: 'bold',
              },
            },
            grid: {
              color: 'rgba(255, 255, 255, 0.1)',
            },
            ticks: {
              color: '#e5e7eb',
              font: {
                size: 12,
              },
            },
          },
          y: {
            title: {
              display: true,
              text: 'Drift State',
              color: '#93c5fd',
              font: {
                weight: 'bold',
              },
            },
            beginAtZero: true,
            ticks: {
              stepSize: 1,
              callback: function (this: any, tickValue: string | number) {
                const value = typeof tickValue === 'string' ? parseInt(tickValue) : tickValue;
                if (value === 0) return 'Normal';
                if (value === 1) return 'Warning';
                if (value === 2) return 'Drift';
                return '';
              },
              color: '#e5e7eb',
              font: {
                size: 12,
              },
            },
            grid: {
              color: 'rgba(255, 255, 255, 0.1)',
            },
            min: 0,
            max: 2,
          },
        },
        animation: {
          duration: 1000,
          easing: 'easeInOutQuad',
        },
        elements: {
          point: {
            radius: 5,
            hoverRadius: 7,
          },
        },
      },
    });

    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
        chartRef.current = null;
      }
    };
  }, [plotData]);

  return <canvas ref={canvasRef} style={{ width: '100%', height: '416px' }} />;
}
