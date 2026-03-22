"use client";

import { useMemo } from "react";
import dynamic from "next/dynamic";
import { TimeSeriesRow, TraceConfig, EventMarker, TimeSeriesChartProps } from "@/types";
import { BASE_LAYOUT, BASE_CONFIG, CHART_COLORS, formatTimestamp, createThresholdShapes } from "@/lib/chartTheme";
import { lttb } from "@/lib/data/downsample";
import { useTimeRange } from "@/hooks/useTimeRange";

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
  const { timeRange, setTimeRange } = useTimeRange();

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

      const xs: string[] = [];
      const ys: number[] = [];
      for (const d of source) {
        xs.push(formatTimestamp(d.timestamp, startTime));
        ys.push(d[trace.field] as number);
      }
      return {
        x: xs,
        y: ys,
        type: "scatter" as const,
        mode: trace.mode ?? "lines",
        name: trace.name,
        line: { color: trace.color ?? CHART_COLORS.primary, width: 1.5 },
        fill: (trace.fill ? "tozeroy" : undefined) as Plotly.PlotData["fill"],
        fillcolor: trace.fill ? (trace.color ?? CHART_COLORS.primaryFill) : undefined,
        yaxis: trace.yaxis ?? "y",
      };
    });

    // Add event markers
    if (eventMarkers && eventMarkers.length > 0) {
      result.push({
        x: eventMarkers.map((e) => formatTimestamp(e.timestamp, startTime)),
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

  const layout = useMemo(() => {
    const shapes = thresholdKey && thresholds
      ? createThresholdShapes(thresholds[thresholdKey].warning, thresholds[thresholdKey].danger)
      : [];

    const xAxisRange = timeRange.start !== null && timeRange.end !== null
      ? [formatTimestamp(timeRange.start, startTime), formatTimestamp(timeRange.end, startTime)]
      : undefined;

    const l: Partial<Plotly.Layout> = {
      ...BASE_LAYOUT,
      height,
      shapes: shapes as Plotly.Layout["shapes"],
      xaxis: {
        ...BASE_LAYOUT.xaxis,
        title: { text: "Time (m:ss)", font: { size: 10, color: CHART_COLORS.textMuted } },
        range: xAxisRange,
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
  }, [thresholdKey, thresholds, timeRange, startTime, height, yAxisLabel, y2AxisLabel]);

  const handleRelayout = (event: Plotly.PlotRelayoutEvent) => {
    const xStart = event["xaxis.range[0]"] as string | undefined;
    const xEnd = event["xaxis.range[1]"] as string | undefined;

    if (xStart && xEnd) {
      // Convert relative time string back to timestamp
      const parseRelative = (s: string) => {
        const parts = s.split(":");
        if (parts.length !== 2) return null;
        const mins = parseInt(parts[0], 10);
        const secs = parseFloat(parts[1]);
        return startTime + mins * 60 + secs;
      };
      const start = parseRelative(xStart);
      const end = parseRelative(xEnd);
      if (start !== null && end !== null) {
        setTimeRange({ start, end, source: "chart" });
      }
    } else if (event["xaxis.autorange"]) {
      setTimeRange({ start: null, end: null, source: "reset" });
    }
  };

  return (
    <Plot
      data={plotTraces}
      layout={layout}
      config={BASE_CONFIG as Plotly.Config}
      onRelayout={handleRelayout}
      style={{ width: "100%", height: "100%" }}
      useResizeHandler
    />
  );
}
