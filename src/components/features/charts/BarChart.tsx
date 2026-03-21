"use client";

import { useMemo } from "react";
import dynamic from "next/dynamic";
import { BASE_LAYOUT, BASE_CONFIG, CHART_COLORS } from "@/lib/chartTheme";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

interface BarChartProps {
  data: { label: string; value: number; count?: number }[];
  yLabel?: string;
  height?: number;
}

export function BarChart({ data, yLabel, height = 300 }: BarChartProps) {
  const plotTraces = useMemo<Plotly.Data[]>(() => [
    {
      x: data.map((d) => d.label),
      y: data.map((d) => d.value),
      type: "bar" as const,
      name: yLabel ?? "Value",
      marker: {
        color: data.map((_, i) => {
          const colors = [CHART_COLORS.primary, CHART_COLORS.secondary, CHART_COLORS.tertiary, CHART_COLORS.amber];
          return colors[i % colors.length];
        }),
      },
      text: data.map((d) => d.count !== undefined ? `n=${d.count}` : ""),
      textposition: "outside" as const,
    },
  ], [data, yLabel]);

  const layout = useMemo<Partial<Plotly.Layout>>(() => ({
    ...BASE_LAYOUT,
    height,
    xaxis: { ...BASE_LAYOUT.xaxis },
    yaxis: {
      ...BASE_LAYOUT.yaxis,
      title: yLabel ? { text: yLabel, font: { size: 10, color: CHART_COLORS.textMuted } } : undefined,
    },
  }), [height, yLabel]);

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
