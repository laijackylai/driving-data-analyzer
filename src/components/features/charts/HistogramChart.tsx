"use client";

import { useMemo } from "react";
import dynamic from "next/dynamic";
import { BASE_LAYOUT, BASE_CONFIG, CHART_COLORS } from "@/lib/chartTheme";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

interface HighlightRange {
  min: number;
  max: number;
  color: string;
  label: string;
}

interface HistogramChartProps {
  data: number[];
  bins?: number;
  highlightRanges?: HighlightRange[];
  xLabel?: string;
  height?: number;
}

export function HistogramChart({
  data,
  bins = 50,
  highlightRanges,
  xLabel,
  height = 300,
}: HistogramChartProps) {
  // Plotly's @types/plotly.js doesn't expose nbinsx in the union type for histogram
  // traces, so we extend Data with the missing property rather than suppressing types.
  type HistogramData = Plotly.Data & { nbinsx?: number };

  const plotTraces = useMemo<HistogramData[]>(() => [
    {
      x: data,
      type: "histogram" as const,
      nbinsx: bins,
      name: xLabel ?? "Distribution",
      marker: { color: CHART_COLORS.primaryFill, line: { color: CHART_COLORS.primary, width: 1 } },
    },
  ], [data, bins, xLabel]);

  const layout = useMemo<Partial<Plotly.Layout>>(() => {
    const shapes: Partial<Plotly.Shape>[] = (highlightRanges ?? []).map((r) => ({
      type: "rect" as const,
      xref: "x" as const,
      x0: r.min,
      x1: r.max,
      yref: "paper" as const,
      y0: 0,
      y1: 1,
      fillcolor: r.color,
      line: { width: 0 },
      layer: "below" as const,
    }));

    return {
      ...BASE_LAYOUT,
      height,
      shapes,
      xaxis: {
        ...BASE_LAYOUT.xaxis,
        title: xLabel ? { text: xLabel, font: { size: 10, color: CHART_COLORS.textMuted } } : undefined,
      },
      yaxis: {
        ...BASE_LAYOUT.yaxis,
        title: { text: "Count", font: { size: 10, color: CHART_COLORS.textMuted } },
      },
    };
  }, [highlightRanges, height, xLabel]);

  return (
    <Plot
      data={plotTraces}
      layout={layout}
      config={BASE_CONFIG as Plotly.Config}
      style={{ width: "100%", height: "100%" }}
      useResizeHandler
    />
  );
}
