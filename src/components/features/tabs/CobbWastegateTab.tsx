"use client";

import { useMemo } from "react";
import dynamic from "next/dynamic";
import { OBD2DataPoint, CobbWastegateMetrics } from "@/types";
import { ChartWrapper } from "@/components/ui/ChartWrapper";
import { TimeSeriesChart } from "@/components/features/charts/TimeSeriesChart";
import { ScatterChart } from "@/components/features/charts/ScatterChart";
import { BASE_LAYOUT, BASE_CONFIG, CHART_COLORS } from "@/lib/chartTheme";
import { CobbStatCard } from "@/components/features/tabs/CobbStatCard";
import { MetricTooltip } from "@/components/ui/MetricTooltip";
import { METRIC_TOOLTIPS } from "@/lib/data/metricTooltips";
import { useTimeRange } from "@/hooks/useTimeRange";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

interface CobbWastegateTabProps {
  timeSeries: OBD2DataPoint[];
  stats: CobbWastegateMetrics;
}

export function CobbWastegateTab({ timeSeries, stats }: CobbWastegateTabProps) {
  const { timeRange, isRangeActive } = useTimeRange();
  const startTime = timeSeries[0]?.timestamp ?? 0;

  // Wastegate error: actual - commanded
  const wastegateErrorData = useMemo(() => {
    const inRange: { x: number; y: number; color: number }[] = [];
    const outRange: { x: number; y: number }[] = [];
    for (const d of timeSeries) {
      if (
        typeof d.boostPsi !== "number" ||
        typeof d.wastegateActualPosMm !== "number" ||
        typeof d.wastegateCommFinalPosMm !== "number"
      )
        continue;
      const point = {
        x: d.boostPsi,
        y: d.wastegateActualPosMm - d.wastegateCommFinalPosMm,
        color: typeof d.engineRpm === "number" ? d.engineRpm : 0,
      };
      if (isRangeActive && (d.timestamp < timeRange.start! || d.timestamp > timeRange.end!)) {
        outRange.push(point);
      } else {
        inRange.push(point);
      }
    }
    return { inRange, outRange };
  }, [timeSeries, timeRange, isRangeActive]);

  // Boost overshoot: filter where actual > target
  const overshootData = useMemo(() => {
    const inRange: { x: number; y: number }[] = [];
    const outRange: { x: number; y: number }[] = [];
    for (const d of timeSeries) {
      if (
        typeof d.boostPsi !== "number" ||
        typeof d.targetBoostFinalRelPsi !== "number" ||
        typeof d.wastegateActualPosMm !== "number" ||
        d.boostPsi <= d.targetBoostFinalRelPsi
      )
        continue;
      const point = {
        x: d.wastegateActualPosMm,
        y: d.boostPsi - d.targetBoostFinalRelPsi,
      };
      if (isRangeActive && (d.timestamp < timeRange.start! || d.timestamp > timeRange.end!)) {
        outRange.push(point);
      } else {
        inRange.push(point);
      }
    }
    return { inRange, outRange };
  }, [timeSeries, timeRange, isRangeActive]);

  return (
    <div className="space-y-4 pt-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <CobbStatCard label="Avg Actual" value={stats.avgWastegateActualMm} unit="mm" />
        <CobbStatCard label="Max Actual" value={stats.maxWastegateActualMm} unit="mm" />
        <CobbStatCard label="Avg Target" value={stats.avgWastegateTargetMm} unit="mm" />
        <CobbStatCard label="Avg Error (actual−target)" value={stats.avgWastegateErrorMm} unit="mm" />
      </div>

      {/* Chart 1: Wastegate Positions + Boost */}
      <ChartWrapper title="Wastegate Position & Boost" height={280} tooltipContent={<MetricTooltip content={METRIC_TOOLTIPS.cobbWastegate} />}>
        <TimeSeriesChart
          data={timeSeries}
          traces={[
            { field: "wastegateActualPosMm", name: "Actual (mm)", color: CHART_COLORS.primary },
            { field: "wastegateCommFinalPosMm", name: "Commanded (mm)", color: CHART_COLORS.amber },
            { field: "boostPsi", name: "Boost (psi)", color: CHART_COLORS.quaternary, yaxis: "y2" },
          ]}
          yAxisLabel="Position (mm)"
          y2AxisLabel="Boost (psi)"
          height={280}
          startTime={startTime}
        />
      </ChartWrapper>

      {/* Chart 2: Wastegate Error vs Boost */}
      <ChartWrapper title="Wastegate Error vs Boost" height={280} tooltipContent={<MetricTooltip content={METRIC_TOOLTIPS.cobbWastegateErrorVsBoost} />}>
        {wastegateErrorData.inRange.length > 0 || wastegateErrorData.outRange.length > 0 ? (
          <Plot
            data={[
              ...(wastegateErrorData.outRange.length > 0
                ? [
                    {
                      x: wastegateErrorData.outRange.map((p) => p.x),
                      y: wastegateErrorData.outRange.map((p) => p.y),
                      type: "scattergl" as const,
                      mode: "markers" as const,
                      marker: { color: CHART_COLORS.primary, size: 3, opacity: 0.15 },
                      showlegend: false,
                      hoverinfo: "skip" as const,
                    },
                  ]
                : []),
              {
                x: wastegateErrorData.inRange.map((p) => p.x),
                y: wastegateErrorData.inRange.map((p) => p.y),
                type: "scattergl" as const,
                mode: "markers" as const,
                marker: {
                  color: wastegateErrorData.inRange.map((p) => p.color),
                  colorscale: [[0, CHART_COLORS.primary], [1, CHART_COLORS.subaruRed]],
                  size: 3,
                  opacity: 0.6,
                  colorbar: { title: { text: "RPM", font: { size: 10, color: CHART_COLORS.textMuted } }, tickfont: { size: 9, color: CHART_COLORS.textMuted } },
                },
                hovertemplate: "Boost: %{x:.1f} psi<br>WG Error: %{y:.1f} mm<br>RPM: %{marker.color:.0f}<extra></extra>",
              },
            ]}
            layout={{
              ...BASE_LAYOUT,
              height: 280,
              xaxis: { ...BASE_LAYOUT.xaxis, title: { text: "Boost (psi)", font: { size: 10, color: CHART_COLORS.textMuted } } },
              yaxis: { ...BASE_LAYOUT.yaxis, title: { text: "WG Error (mm)", font: { size: 10, color: CHART_COLORS.textMuted } } },
            }}
            config={BASE_CONFIG as Plotly.Config}
            style={{ width: "100%", height: "100%" }}
            useResizeHandler
          />
        ) : (
          <div data-chart-empty className="hidden" />
        )}
      </ChartWrapper>

      {/* Chart 3: Wastegate Position vs RPM by gear */}
      <ChartWrapper title="Wastegate Position vs RPM (by Gear)" height={280} tooltipContent={<MetricTooltip content={METRIC_TOOLTIPS.cobbWastegateVsRpm} />}>
        <ScatterChart
          data={timeSeries}
          xField="engineRpm"
          yField="wastegateCommFinalPosMm"
          colorField="gearPosition"
          xLabel="RPM"
          yLabel="Commanded WG (mm)"
          height={280}
        />
      </ChartWrapper>

      {/* Chart 4: Boost Overshoot Detection */}
      <ChartWrapper title="Boost Overshoot vs Wastegate Position" height={280} tooltipContent={<MetricTooltip content={METRIC_TOOLTIPS.cobbBoostOvershoot} />}>
        {overshootData.inRange.length > 0 || overshootData.outRange.length > 0 ? (
          <Plot
            data={[
              ...(overshootData.outRange.length > 0
                ? [
                    {
                      x: overshootData.outRange.map((p) => p.x),
                      y: overshootData.outRange.map((p) => p.y),
                      type: "scattergl" as const,
                      mode: "markers" as const,
                      marker: { color: CHART_COLORS.subaruRed, size: 4, opacity: 0.15 },
                      showlegend: false,
                      hoverinfo: "skip" as const,
                    },
                  ]
                : []),
              {
                x: overshootData.inRange.map((p) => p.x),
                y: overshootData.inRange.map((p) => p.y),
                type: "scattergl" as const,
                mode: "markers" as const,
                marker: { color: CHART_COLORS.subaruRed, size: 4, opacity: 0.6 },
                hovertemplate: "WG Pos: %{x:.1f} mm<br>Overshoot: %{y:.2f} psi<extra></extra>",
              },
            ]}
            layout={{
              ...BASE_LAYOUT,
              height: 280,
              xaxis: { ...BASE_LAYOUT.xaxis, title: { text: "Wastegate Position (mm)", font: { size: 10, color: CHART_COLORS.textMuted } } },
              yaxis: { ...BASE_LAYOUT.yaxis, title: { text: "Overshoot (psi)", font: { size: 10, color: CHART_COLORS.textMuted } } },
            }}
            config={BASE_CONFIG as Plotly.Config}
            style={{ width: "100%", height: "100%" }}
            useResizeHandler
          />
        ) : (
          <div data-chart-empty className="hidden" />
        )}
      </ChartWrapper>
    </div>
  );
}
