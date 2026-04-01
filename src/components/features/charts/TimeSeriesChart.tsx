"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { TimeSeriesRow, TraceConfig, EventMarker, TimeSeriesChartProps } from "@/types";
import { BASE_LAYOUT, BASE_CONFIG, CHART_COLORS, formatTimestamp, createThresholdShapes } from "@/lib/chartTheme";
import { lttb } from "@/lib/data/downsample";
import { useTimeRange } from "@/hooks/useTimeRange";
import { InsufficientData, INSUFFICIENT_DATA_THRESHOLD } from "@/components/ui/InsufficientData";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

// Re-export for consumers that import from here
export type { TimeSeriesRow };

export function TimeSeriesChart({
  data,
  traces,
  thresholdKey,
  thresholds,
  eventMarkers,
  yAxisLabel,
  y2AxisLabel,
  height = 300,
  startTime,
  maxPoints,
}: TimeSeriesChartProps) {
  const { timeRange, isRangeActive } = useTimeRange();
  const [forceRender, setForceRender] = useState(false);

  const plotTraces = useMemo(() => {
    const result: Plotly.Data[] = traces.map((trace) => {
      // Filter to rows that have a defined value for this trace's field
      const defined = data.filter((d) => typeof d[trace.field] === "number");

      // Per-chart downsampling if maxPoints is set (must be >= 3 for LTTB).
      // Each trace downsamples independently — misaligned timestamps are fine
      // because Plotly renders each trace with its own x-coordinates.
      // NOTE: data may already have been reduced by API-level downsampleTimeSeries
      // (which uses engineRpm as the y-proxy). This second pass uses the actual
      // trace field, so importance signals differ — acceptable when the reduction
      // ratio is mild (e.g. 5000→2000).
      const source = maxPoints && maxPoints >= 3 && defined.length > maxPoints
        ? lttb(defined, maxPoints, (d) => d.timestamp, (d) => d[trace.field] as number)
        : defined;

      const xs: number[] = [];
      const ys: number[] = [];
      for (const d of source) {
        xs.push(d.timestamp - startTime);
        ys.push(d[trace.field] as number);
      }
      const color = trace.color ?? CHART_COLORS.primary;
      return {
        x: xs,
        y: ys,
        customdata: source.map((d) => [formatTimestamp(d.timestamp, startTime)]),
        // Each trace shows time + name:value uniformly. hovermode "x" renders
        // separate per-trace boxes; the time repeats in each box intentionally
        // since there is no unified header with hovermode "x".
        hovertemplate: `⏱ %{customdata[0]}<br><span style='color:${color}'>%{fullData.name}</span>: %{y:.2f}<extra></extra>`,
        type: "scatter" as const,
        mode: trace.mode ?? "lines",
        name: trace.name,
        line: { color, width: 1.5 },
        fill: (trace.fill ? "tozeroy" : undefined) as Plotly.PlotData["fill"],
        fillcolor: trace.fill ? (trace.color ?? CHART_COLORS.primaryFill) : undefined,
        yaxis: trace.yaxis ?? "y",
      };
    });

    // Add event markers
    if (eventMarkers && eventMarkers.length > 0) {
      result.push({
        x: eventMarkers.map((e) => e.timestamp - startTime),
        y: eventMarkers.map(() => 0),
        mode: "markers" as const,
        type: "scatter" as const,
        name: "Events",
        marker: {
          color: eventMarkers.map((e) => e.color),
          size: 8,
          symbol: "triangle-up" as const,
        },
        text: eventMarkers.map((e) => e.label),
        hoverinfo: "text" as const,
      });
    }

    return result;
  }, [data, traces, eventMarkers, startTime, maxPoints]);

  // Compute elapsed time range from data for tick generation
  const elapsedMax = useMemo(() => {
    if (data.length === 0) return 0;
    return data[data.length - 1].timestamp - startTime;
  }, [data, startTime]);

  const layout = useMemo(() => {
    const shapes = thresholdKey && thresholds
      ? createThresholdShapes(thresholds[thresholdKey].warning, thresholds[thresholdKey].danger)
      : [];

    const xAxisRange = isRangeActive
      ? [timeRange.start! - startTime, timeRange.end! - startTime]
      : undefined;

    // Generate m:ss tick labels for the numeric elapsed-seconds x-axis
    // Aim for ~10-15 ticks regardless of range, using round intervals
    const rangeMax = xAxisRange ? xAxisRange[1] : elapsedMax;
    const TARGET_TICKS = 12;
    const rawInterval = rangeMax / TARGET_TICKS;
    const NICE_INTERVALS = [5, 10, 15, 30, 60, 120, 300, 600, 900, 1800, 3600];
    const tickInterval = NICE_INTERVALS.find((i) => i >= rawInterval) ?? rawInterval;
    const tickvals: number[] = [];
    const ticktext: string[] = [];
    for (let t = 0; t <= rangeMax; t += tickInterval) {
      tickvals.push(t);
      ticktext.push(formatTimestamp(t + startTime, startTime));
    }

    const l: Partial<Plotly.Layout> = {
      ...BASE_LAYOUT,
      hovermode: "x",
      height,
      shapes: shapes as Plotly.Layout["shapes"],
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
      },
    };

    if (y2AxisLabel) {
      l.yaxis2 = {
        gridcolor: CHART_COLORS.grid,
        zerolinecolor: CHART_COLORS.grid,
        tickfont: { size: 10, color: CHART_COLORS.textMuted },
        title: { text: y2AxisLabel, font: { size: 10, color: CHART_COLORS.textMuted } },
        overlaying: "y",
        side: "right",
      };
    }

    return l;
  }, [thresholdKey, thresholds, timeRange, startTime, height, yAxisLabel, y2AxisLabel, elapsedMax]);

  // Check if any trace has enough data points (≥10% of total)
  const hasEnoughData = useMemo(() => {
    if (data.length === 0) return false;
    return traces.some((trace) => {
      const defined = data.filter((d) => typeof d[trace.field] === "number");
      return defined.length / data.length >= INSUFFICIENT_DATA_THRESHOLD;
    });
  }, [data, traces]);

  const totalDefined = useMemo(() =>
    traces.reduce((sum, trace) => sum + data.filter((d) => typeof d[trace.field] === "number").length, 0),
    [data, traces]);

  if (totalDefined === 0) return <div data-chart-empty className="hidden" />;

  if (!hasEnoughData && !forceRender) {
    const best = traces.reduce((max, trace) => {
      const count = data.filter((d) => typeof d[trace.field] === "number").length;
      return count > max ? count : max;
    }, 0);
    return <InsufficientData available={best} total={data.length} height={height} onForceRender={() => setForceRender(true)} />;
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
