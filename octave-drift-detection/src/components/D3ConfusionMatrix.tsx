import React, { useRef, useEffect } from 'react'
import * as d3 from 'd3'

export interface D3ConfusionMatrixProps {
  data: number[][]
  labels: string[]
  title?: string
  width: number
  height: number
}

const D3ConfusionMatrix: React.FC<D3ConfusionMatrixProps> = ({
  data,
  labels,
  title,
  width,
  height,
}) => {
  const svgRef = useRef<SVGSVGElement>(null)

  useEffect(() => {
    if (!data.length) return

    const maxVal = d3.max(data.flat()) ?? 1
    const margin = { top: title ? 30 : 10, right: 10, bottom: 10, left: 10 }
    const innerW = width - margin.left - margin.right
    const innerH = height - margin.top - margin.bottom

    const x = d3
      .scaleBand<string>()
      .domain(labels)
      .range([0, innerW])
      .padding(0.05)

    const y = d3
      .scaleBand<string>()
      .domain(labels)
      .range([0, innerH])
      .padding(0.05)

    const color = d3
      .scaleSequential(d3.interpolateBlues)
      .domain([0, maxVal])

    const svg = d3.select(svgRef.current!)
    svg.selectAll('*').remove()
    svg.attr('viewBox', `0 0 ${width} ${height}`)

    // optional title
    if (title) {
      svg
        .append('text')
        .attr('x', width / 2)
        .attr('y', margin.top / 2)
        .attr('text-anchor', 'middle')
        .style('fill', 'white')
        .style('font-size', '14px')
        .text(title)
    }

    const g = svg
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`)

    // cells + centered text
    data.forEach((row, i) => {
      row.forEach((val, j) => {
        const xpos = x(labels[j])!
        const ypos = y(labels[i])!

        g.append('rect')
          .attr('x', xpos)
          .attr('y', ypos)
          .attr('width', x.bandwidth())
          .attr('height', y.bandwidth())
          .attr('fill', color(val))

        g.append('text')
          .attr('x', xpos + x.bandwidth() / 2)
          .attr('y', ypos + y.bandwidth() / 2)
          .attr('text-anchor', 'middle')
          .attr('dominant-baseline', 'middle')
          .style('font-size', `${Math.min(x.bandwidth(), y.bandwidth()) * 0.4}px`)
          .attr('fill', val > maxVal / 2 ? 'white' : 'black')
          .text(val)
      })
    })

    // axes (no tick lines)
    g.append('g')
      .call(d3.axisTop(x).tickSize(0))
      .selectAll('text')
      .style('font-size', '10px')

    g.append('g')
      .call(d3.axisLeft(y).tickSize(0))
      .selectAll('text')
      .style('font-size', '10px')
  }, [data, labels, width, height, title])

  return (
    <svg
      ref={svgRef}
      width="100%"
      height="100%"
      preserveAspectRatio="xMidYMid meet"
    />
  )
}

export default D3ConfusionMatrix
