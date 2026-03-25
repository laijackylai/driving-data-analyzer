"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { BASE_LAYOUT, BASE_CONFIG, CHART_COLORS } from "@/lib/chartTheme";
import { InsufficientData, INSUFFICIENT_DATA_THRESHOLD } from "@/components/ui/InsufficientData";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

interface AreaChartProps {
  data: { x: number; y: number }[];
  xLabel?: string;
  yLabel?: string;
  height?: number;
}

export function AreaChart({ data, xLabel, yLabel, height = 300 }: AreaChartProps) {
  const [forceRender, setForceRender] = useState(false);
  const plotTraces = useMemo<Plotly.Data[]>(() => [
    {
      x: data.map((d) => d.x),
      y: data.map((d) => d.y),
      type: "scatter" as const,
      mode: "lines",
      fill: "tozeroy",
      name: yLabel ?? "Value",
      line: { color: CHART_COLORS.primary, width: 1.5 },
      fillcolor: CHART_COLORS.primaryFill,
    },
  ], [data, yLabel]);

  const layout = useMemo<Partial<Plotly.Layout>>(() => ({
    ...BASE_LAYOUT,
    height,
    xaxis: {
      ...BASE_LAYOUT.xaxis,
      title: xLabel ? { text: xLabel, font: { size: 10, color: CHART_COLORS.textMuted } } : undefined,
    },
    yaxis: {
      ...BASE_LAYOUT.yaxis,
      title: yLabel ? { text: yLabel, font: { size: 10, color: CHART_COLORS.textMuted } } : undefined,
    },
  }), [height, xLabel, yLabel]);

  if (data.length < 2 && !forceRender) {
    return <InsufficientData available={data.length} total={data.length} height={height} onForceRender={() => setForceRender(true)} />;
  }

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
