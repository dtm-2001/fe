"use client";

import React, { useRef, useEffect } from "react";
import * as d3 from "d3";

export interface D3ConfusionMatrixProps {
  data: number[][];
  labels: string[];
  title?: string;
  width: number;   // the “inner” width (cells only)
  height: number;  // the “inner” height (cells only)
}

const D3ConfusionMatrix: React.FC<D3ConfusionMatrixProps> = ({
  data,
  labels,
  title,
  width,
  height,
}) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!data.length || !svgRef.current) return;

    // --- margins around the matrix, in pixels
    const margin = { top: title ? 30 : 10, right: 10, bottom: 10, left: 10 };

    // total SVG coordinate size
    const totalWidth = width + margin.left + margin.right;
    const totalHeight = height + margin.top + margin.bottom;

    // scales for cells
    const xScale = d3
      .scaleBand<string>()
      .domain(labels)
      .range([0, width])
      .padding(0.05);

    const yScale = d3
      .scaleBand<string>()
      .domain(labels)
      .range([0, height])
      .padding(0.05);

    // color ramp
    const maxVal = d3.max(data.flat()) ?? 1;
    const colorScale = d3.scaleSequential(d3.interpolateBlues).domain([0, maxVal]);

    // set up the SVG
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();
    svg.attr("viewBox", `0 0 ${totalWidth} ${totalHeight}`);

    // optional title
    if (title) {
      svg
        .append("text")
        .attr("x", totalWidth / 2)
        .attr("y", margin.top / 2)
        .attr("text-anchor", "middle")
        .style("fill", "white")
        .style("font-size", "14px")
        .text(title);
    }

    // container for everything, offset by margin
    const g = svg
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // draw cells + numbers
    data.forEach((row, i) => {
      row.forEach((val, j) => {
        // raw positions in the inner 0..width / 0..height
        const rx = xScale(labels[j])!;
        const ry = yScale(labels[i])!;
        const rw = xScale.bandwidth();
        const rh = yScale.bandwidth();

        // round to integers so that both rect and text align perfectly
        const x = Math.round(rx);
        const y = Math.round(ry);
        const w = Math.round(rw);
        const h = Math.round(rh);

        // background rect
        g.append("rect")
          .attr("x", x)
          .attr("y", y)
          .attr("width", w)
          .attr("height", h)
          .attr("fill", colorScale(val))
          .attr("stroke", "#334155")
          .attr("stroke-width", 0.5);

        // centered text
        g.append("text")
          .attr("x", x + w / 2)
          .attr("y", y + h / 2)
          .attr("text-anchor", "middle")
          .attr("dominant-baseline", "middle")
          .style("font-size", `${Math.floor(Math.min(w, h) * 0.4)}px`)
          .attr("fill", val > maxVal / 2 ? "white" : "black")
          .text(val);
      });
    });

    // X axis (top)
    g.append("g")
      .attr("transform", `translate(0,0)`)
      .call(d3.axisTop(xScale).tickSize(0))
      .selectAll("text")
      .style("font-size", "10px")
      .attr("dy", "-0.3em");

    // Y axis (left)
    g.append("g")
      .attr("transform", `translate(0,0)`)
      .call(d3.axisLeft(yScale).tickSize(0))
      .selectAll("text")
      .style("font-size", "10px")
      .attr("dx", "-0.3em");

    // remove domain lines
    g.selectAll(".domain").remove();

    // axis labels
    g.append("text")
      .attr("x", width / 2)
      .attr("y", -margin.top / 2)
      .attr("text-anchor", "middle")
      .style("fill", "#94a3b8")
      .style("font-size", "12px")
      .text("Predicted");

    g.append("text")
      .attr("transform", `translate(${-margin.left / 2},${height / 2}) rotate(-90)`)
      .attr("text-anchor", "middle")
      .style("fill", "#94a3b8")
      .style("font-size", "12px")
      .text("Actual");
  }, [data, labels, title, width, height]);

  return (
    <svg
      ref={svgRef}
      width="100%"
      height="100%"
      preserveAspectRatio="xMidYMid meet"
    />
  );
};

export default D3ConfusionMatrix;
