'use client'
import { useEffect, useRef } from 'react';
import { Chart } from 'chart.js/auto';
import type { Chart as ChartType } from 'chart.js';

interface LineChartProps {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    borderColor: string;
    backgroundColor: string;
    tension?: number;
    fill?: boolean;
  }[];
  xTitle: string;
  yTitle: string;
}

export default function LineChart({ labels, datasets, xTitle, yTitle }: LineChartProps) {
  const chartRef = useRef<ChartType | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        if (chartRef.current) {
          chartRef.current.destroy();
        }

        chartRef.current = new Chart(ctx, {
          type: 'line',
          data: { labels, datasets },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                labels: {
                  color: '#e5e7eb'
                }
              },
              tooltip: {
                mode: 'index',
                intersect: false
              }
            },
            scales: {
              x: {
                title: {
                  display: true,
                  text: xTitle,
                  color: '#93c5fd',
                  font: { weight: 'bold' }
                },
                grid: { color: 'rgba(255, 255, 255, 0.1)' },
                ticks: { color: '#e5e7eb', font: { size: 12 } }
              },
              y: {
                title: {
                  display: true,
                  text: yTitle,
                  color: '#93c5fd',
                  font: { weight: 'bold' }
                },
                beginAtZero: true,
                grid: { color: 'rgba(255, 255, 255, 0.1)' },
                ticks: { 
                  color: '#e5e7eb',
                  font: { size: 12 },
                  callback: (value: string | number) => typeof value === 'number' ? value.toFixed(2) : value
                }
              }
            },
            animation: {
              duration: 1000,
              easing: 'easeInOutQuad'
            },
            elements: {
              point: {
                radius: 4,
                hoverRadius: 6
              }
            }
          }
        });
      }
    }

    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
      }
    };
  }, [labels, datasets, xTitle, yTitle]);

  return <canvas ref={canvasRef} className="w-full h-full" />;
}