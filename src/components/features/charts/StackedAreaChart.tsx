"use client";

import { useMemo } from "react";
import dynamic from "next/dynamic";
import { BASE_LAYOUT, BASE_CONFIG, CHART_COLORS, formatTimestamp } from "@/lib/chartTheme";
import { useTimeRange } from "@/hooks/useTimeRange";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

interface StackedAreaTrace {
  field: string;
  name: string;
  color: string;
  fillcolor: string;
}

interface StackedAreaChartProps {
  data: Record<string, number | undefined>[];
  traces: StackedAreaTrace[];
  yAxisLabel?: string;
  height?: number;
  startTime: number;
}

export function StackedAreaChart({
  data,
  traces,
  yAxisLabel,
  height = 300,
  startTime,
}: StackedAreaChartProps) {
  const { timeRange, isRangeActive } = useTimeRange();
  const plotTraces = useMemo<Plotly.Data[]>(() => {
    return traces.map((trace, i) => {
      const xs: number[] = [];
      const ys: number[] = [];
      for (const d of data) {
        const ts = d.timestamp as number;
        const v = d[trace.field];
        if (typeof ts === "number" && typeof v === "number") {
          xs.push(ts - startTime);
          ys.push(v);
        }
      }
      return {
        x: xs,
        y: ys,
        type: "scatter",
        mode: "lines",
        name: trace.name,
        line: { color: trace.color, width: 0.5 },
        fill: i === 0 ? "tozeroy" : "tonexty",
        fillcolor: trace.fillcolor,
        stackgroup: "one",
        hovertemplate: `%{fullData.name}: %{y:.1f}%<extra></extra>`,
      } as Plotly.Data;
    });
  }, [data, traces, startTime]);

  if (data.length === 0) return <div data-chart-empty className="hidden" />;

  // Generate time axis ticks
  const xAxisRange = isRangeActive
    ? [timeRange.start! - startTime, timeRange.end! - startTime]
    : undefined;

  const elapsedMax = data.length > 0
    ? (data[data.length - 1].timestamp as number) - startTime
    : 0;
  const TARGET_TICKS = 12;
  const rangeMax = xAxisRange ? xAxisRange[1] : elapsedMax;
  const rawInterval = rangeMax / TARGET_TICKS;
  const NICE_INTERVALS = [5, 10, 15, 30, 60, 120, 300, 600, 900, 1800, 3600];
  const tickInterval = NICE_INTERVALS.find((i) => i >= rawInterval) ?? rawInterval;
  const tickvals: number[] = [];
  const ticktext: string[] = [];
  for (let t = 0; t <= rangeMax; t += tickInterval) {
    tickvals.push(t);
    ticktext.push(formatTimestamp(t + startTime, startTime));
  }

  const layout: Partial<Plotly.Layout> = {
    ...BASE_LAYOUT,
    hovermode: "x",
    height,
    xaxis: {
      ...BASE_LAYOUT.xaxis,
      type: "linear",
      hoverformat: "",
      title: { text: "Time (m:ss)", font: { size: 10, color: CHART_COLORS.textMuted } },
      range: xAxisRange,
      tickvals,
      ticktext,
    },
    yaxis: {
      ...BASE_LAYOUT.yaxis,
      title: yAxisLabel ? { text: yAxisLabel, font: { size: 10, color: CHART_COLORS.textMuted } } : undefined,
      range: [0, 100],
    },
  };

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
