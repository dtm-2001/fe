'use client'
import * as d3 from 'd3'
import { useEffect, useRef } from 'react'

type Props = {
  data: number[][]
  labels: string[]
  title: string
  width?: number
  height?: number
  cellSize?: number
  minCellSize?: number
  maxCellSize?: number
}

export default function D3ConfusionMatrix({
  data,
  labels,
  title,
  width = 500,
  height = 500,
  cellSize = 40,
  minCellSize = 20,
  maxCellSize = 60
}: Props) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!ref.current || !data?.length || !labels?.length) return
    
    // Validate dimensions
    const safeWidth = Math.max(100, width || 500)
    const safeHeight = Math.max(100, height || 500)
    const containerWidth = ref.current?.clientWidth || safeWidth
    const containerHeight = ref.current?.clientHeight || safeHeight
    const calculatedCellSize = Math.min(
      Math.max(minCellSize || 20, Math.min(containerWidth, containerHeight) / Math.max(data.length, data[0]?.length || 1)),
      maxCellSize || 60
    )
    const safeCellSize = Math.max(10, cellSize || calculatedCellSize)

    // Clear previous render
    ref.current.innerHTML = ''

    const margin = { top: 30, right: 30, bottom: 30, left: 30 }
    const innerWidth = safeWidth - margin.left - margin.right
    const innerHeight = safeHeight - margin.top - margin.bottom

    const svg = d3.select(ref.current)
      .append('svg')
      .attr('width', safeWidth)
      .attr('height', safeHeight)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`)

    // Color scale
    const colorScale = d3.scaleSequential(d3.interpolateBlues)
      .domain([0, d3.max(data.flat()) || 1])

    // Create matrix
    svg.selectAll('g')
      .data(data)
      .enter()
      .append('g')
      .selectAll('rect')
      .data((d, i) => d.map((value, j) => ({value, x: j, y: i})))
      .enter()
      .append('rect')
      .attr('x', d => d.x * safeCellSize)
      .attr('y', d => d.y * safeCellSize)
      .attr('width', safeCellSize - 1)
      .attr('height', safeCellSize - 1)
      .style('fill', d => colorScale(d.value))
      .style('stroke', '#fff')

    // Add labels
    svg.selectAll('.row-label')
      .data(labels)
      .enter()
      .append('text')
      .attr('x', -5)
      .attr('y', (d, i) => i * safeCellSize + safeCellSize / 2)
      .style('text-anchor', 'end')
      .style('fill', '#e5e7eb')
      .text(d => d)

    svg.selectAll('.col-label')
      .data(labels)
      .enter()
      .append('text')
      .attr('y', -5)
      .attr('x', (d, i) => i * safeCellSize + safeCellSize / 2)
      .style('text-anchor', 'middle')
      .style('fill', '#e5e7eb')
      .text(d => d)

  }, [data, labels, width, height, cellSize, minCellSize, maxCellSize])

  return (
    <div className="relative h-full w-full">
      <h3 className="text-lg font-medium text-blue-200 mb-2">{title}</h3>
      <div ref={ref} />
    </div>
  )
}
