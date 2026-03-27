"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { OBD2DataPoint } from "@/types";
import { BASE_LAYOUT, BASE_CONFIG, CHART_COLORS } from "@/lib/chartTheme";
import { useTimeRange } from "@/hooks/useTimeRange";
import { InsufficientData, INSUFFICIENT_DATA_THRESHOLD } from "@/components/ui/InsufficientData";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

interface ScatterChartProps {
  data: OBD2DataPoint[];
  xField: keyof OBD2DataPoint;
  yField: keyof OBD2DataPoint;
  colorField?: keyof OBD2DataPoint;
  xLabel?: string;
  yLabel?: string;
  height?: number;
}

export function ScatterChart({
  data,
  xField,
  yField,
  colorField,
  xLabel,
  yLabel,
  height = 300,
}: ScatterChartProps) {
  const { timeRange, isRangeActive } = useTimeRange();
  const [forceRender, setForceRender] = useState(false);

  const plotTraces = useMemo(() => {
    const inRange: { x: number; y: number; ts: number; color?: number }[] = [];
    const outRange: { x: number; y: number; ts: number; color?: number }[] = [];

    for (const d of data) {
      const x = d[xField];
      const y = d[yField];
      if (x === undefined || y === undefined) continue;

      const point = {
        x: x as number,
        y: y as number,
        ts: d.timestamp,
        color: colorField ? (d[colorField] as number) : undefined,
      };

      if (isRangeActive && (d.timestamp < timeRange.start! || d.timestamp > timeRange.end!)) {
        outRange.push(point);
      } else {
        inRange.push(point);
      }
    }

    const traces: Plotly.Data[] = [];

    if (outRange.length > 0) {
      traces.push({
        x: outRange.map((p) => p.x),
        y: outRange.map((p) => p.y),
        customdata: outRange.map((p) => [p.ts]),
        type: "scatter" as const,
        mode: "markers",
        name: "Out of range",
        marker: {
          color: CHART_COLORS.primary,
          size: 4,
          opacity: 0.15,
        },
        showlegend: false,
        hoverinfo: "skip",
      });
    }

    const markerConfig: Plotly.PlotData["marker"] = colorField
      ? {
          color: inRange.map((p) => p.color ?? 0),
          colorscale: [
            [0, CHART_COLORS.emerald],
            [0.5, CHART_COLORS.amber],
            [1, CHART_COLORS.subaruRed],
          ],
          size: 4,
          opacity: 0.8,
          showscale: true,
          colorbar: {
            thickness: 8,
            len: 0.6,
            tickfont: { size: 9, color: CHART_COLORS.textMuted },
          },
        }
      : {
          color: CHART_COLORS.primary,
          size: 4,
          opacity: 0.8,
        };

    traces.push({
      x: inRange.map((p) => p.x),
      y: inRange.map((p) => p.y),
      customdata: inRange.map((p) => [p.ts]),
      type: "scatter" as const,
      mode: "markers",
      name: yLabel ?? String(yField),
      marker: markerConfig,
    });

    return traces;
  }, [data, xField, yField, colorField, timeRange, yLabel]);

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

  // Check if enough data points have both X and Y fields (≥10% of total)
  const validCount = useMemo(() => {
    return data.filter((d) => d[xField] !== undefined && d[yField] !== undefined).length;
  }, [data, xField, yField]);

  if (validCount === 0) return <div data-chart-empty className="hidden" />;

  if (!forceRender && validCount / data.length < INSUFFICIENT_DATA_THRESHOLD) {
    return <InsufficientData available={validCount} total={data.length} height={height} onForceRender={() => setForceRender(true)} />;
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
