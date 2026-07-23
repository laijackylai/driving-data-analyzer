"use client";

import { useMemo } from "react";
import dynamic from "next/dynamic";
import { BASE_LAYOUT, BASE_CONFIG, CHART_COLORS } from "@/lib/chartTheme";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

interface HeatmapChartProps {
  /** Raw data points to bin */
  data: { x: number; y: number; value: number }[];
  /** Number of bins per axis */
  xBins?: number;
  yBins?: number;
  xLabel?: string;
  yLabel?: string;
  valueLabel?: string;
  /** Plotly colorscale name or custom stops */
  colorscale?: Plotly.ColorScale;
  height?: number;
}

export function HeatmapChart({
  data,
  xBins = 15,
  yBins = 15,
  xLabel,
  yLabel,
  valueLabel,
  colorscale = [[0, CHART_COLORS.emerald], [0.5, CHART_COLORS.amber], [1, CHART_COLORS.subaruRed]],
  height = 300,
}: HeatmapChartProps) {
  const { z, xEdges, yEdges } = useMemo(() => {
    if (data.length === 0) return { z: [], xEdges: [], yEdges: [] };

    const xs = data.map((d) => d.x);
    const ys = data.map((d) => d.y);
    const xMin = Math.min(...xs), xMax = Math.max(...xs);
    const yMin = Math.min(...ys), yMax = Math.max(...ys);
    const xStep = (xMax - xMin) / xBins || 1;
    const yStep = (yMax - yMin) / yBins || 1;

    const grid: number[][] = Array.from({ length: yBins }, () => Array(xBins).fill(0));
    const counts: number[][] = Array.from({ length: yBins }, () => Array(xBins).fill(0));

    for (const d of data) {
      const xi = Math.min(Math.floor((d.x - xMin) / xStep), xBins - 1);
      const yi = Math.min(Math.floor((d.y - yMin) / yStep), yBins - 1);
      grid[yi][xi] += d.value;
      counts[yi][xi]++;
    }

    // Average values per bin
    const zAvg = grid.map((row, yi) =>
      row.map((sum, xi) => (counts[yi][xi] > 0 ? sum / counts[yi][xi] : null))
    );

    const xE = Array.from({ length: xBins }, (_, i) =>
      Math.round((xMin + i * xStep + xStep / 2) * 10) / 10
    );
    const yE = Array.from({ length: yBins }, (_, i) =>
      Math.round((yMin + i * yStep + yStep / 2) * 10) / 10
    );

    return { z: zAvg, xEdges: xE, yEdges: yE };
  }, [data, xBins, yBins]);

  if (data.length === 0) return <div data-chart-empty className="hidden" />;

  const traces: Plotly.Data[] = [
    {
      x: xEdges,
      y: yEdges,
      z,
      type: "heatmap",
      colorscale,
      hovertemplate: `${xLabel ?? "X"}: %{x}<br>${yLabel ?? "Y"}: %{y}<br>${valueLabel ?? "Value"}: %{z:.2f}<extra></extra>`,
      colorbar: {
        thickness: 10,
        len: 0.6,
        tickfont: { size: 9, color: CHART_COLORS.textMuted },
        title: { text: valueLabel ?? "", font: { size: 9, color: CHART_COLORS.textMuted }, side: "right" },
      },
    },
  ];

  const layout: Partial<Plotly.Layout> = {
    ...BASE_LAYOUT,
    hovermode: "closest",
    height,
    xaxis: {
      ...BASE_LAYOUT.xaxis,
      title: xLabel ? { text: xLabel, font: { size: 10, color: CHART_COLORS.textMuted } } : undefined,
    },
    yaxis: {
      ...BASE_LAYOUT.yaxis,
      title: yLabel ? { text: yLabel, font: { size: 10, color: CHART_COLORS.textMuted } } : undefined,
    },
  };

  return (
    <Plot
      data={traces}
      layout={layout}
      config={BASE_CONFIG as Plotly.Config}
      style={{ width: "100%", height: "100%" }}
      useResizeHandler
    />
  );
}
