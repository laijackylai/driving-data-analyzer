"use client";

import dynamic from "next/dynamic";
import { BASE_LAYOUT, BASE_CONFIG, CHART_COLORS } from "@/lib/chartTheme";
import { PowerPoint } from "@/lib/data/hpTorqueCalc";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

interface DynoChartProps {
  data: PowerPoint[];
  height?: number;
}

export function DynoChart({ data, height = 300 }: DynoChartProps) {
  if (data.length === 0) return <div data-chart-empty className="hidden" />;

  const plotData: Plotly.Data[] = [
    {
      x: data.map((p) => p.rpm),
      y: data.map((p) => p.wheelHp),
      type: "scatter",
      mode: "lines",
      name: "Wheel HP",
      line: { color: CHART_COLORS.primary, width: 2 },
      yaxis: "y",
    },
    {
      x: data.map((p) => p.rpm),
      y: data.map((p) => p.wheelTorqueNm),
      type: "scatter",
      mode: "lines",
      name: "Wheel Torque (Nm)",
      line: { color: CHART_COLORS.amber, width: 2 },
      yaxis: "y2",
    },
  ];

  const layout: Partial<Plotly.Layout> = {
    ...BASE_LAYOUT,
    height,
    xaxis: {
      ...BASE_LAYOUT.xaxis,
      title: { text: "RPM", font: { size: 11, color: CHART_COLORS.textMuted } },
    },
    yaxis: {
      ...BASE_LAYOUT.yaxis,
      title: { text: "Wheel HP", font: { size: 11, color: CHART_COLORS.primary } },
    },
    yaxis2: {
      title: { text: "Torque (Nm)", font: { size: 11, color: CHART_COLORS.amber } },
      overlaying: "y",
      side: "right",
      gridcolor: CHART_COLORS.grid,
      tickfont: { size: 10, color: CHART_COLORS.textMuted },
    },
    legend: { ...BASE_LAYOUT.legend, x: 0.02, y: 0.98 },
    margin: { l: 55, r: 55, t: 10, b: 45 },
  };

  return (
    <Plot
      data={plotData}
      layout={layout}
      config={BASE_CONFIG as Plotly.Config}
      style={{ width: "100%", height: "100%" }}
      useResizeHandler
    />
  );
}
