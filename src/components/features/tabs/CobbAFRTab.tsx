"use client";

import { useMemo } from "react";
import dynamic from "next/dynamic";
import { OBD2DataPoint, CobbAFRMetrics } from "@/types";
import { ChartWrapper } from "@/components/ui/ChartWrapper";
import { TimeSeriesChart } from "@/components/features/charts/TimeSeriesChart";
import { ScatterChart } from "@/components/features/charts/ScatterChart";
import { HeatmapChart } from "@/components/features/charts/HeatmapChart";
import { BASE_LAYOUT, BASE_CONFIG, CHART_COLORS } from "@/lib/chartTheme";
import { CobbStatCard } from "@/components/features/tabs/CobbStatCard";
import { MetricTooltip } from "@/components/ui/MetricTooltip";
import { METRIC_TOOLTIPS } from "@/lib/data/metricTooltips";
import { useTimeRange } from "@/hooks/useTimeRange";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

interface CobbAFRTabProps {
  timeSeries: OBD2DataPoint[];
  stats: CobbAFRMetrics;
}

export function CobbAFRTab({ timeSeries, stats }: CobbAFRTabProps) {
  const { timeRange, isRangeActive } = useTimeRange();
  const startTime = timeSeries[0]?.timestamp ?? 0;

  const heatmapData = useMemo(
    () =>
      timeSeries
        .filter(
          (d) =>
            typeof d.engineRpm === "number" &&
            typeof d.calculatedLoadGRev === "number" &&
            typeof d.afLearning1 === "number",
        )
        .map((d) => ({
          x: d.engineRpm!,
          y: d.calculatedLoadGRev!,
          value: d.afLearning1!,
        })),
    [timeSeries],
  );

  // AFR vs Boost scatter data with in/out range split
  const afrVsBoost = useMemo(() => {
    const inRange: { x: number; y: number; color: number }[] = [];
    const outRange: { x: number; y: number }[] = [];
    for (const d of timeSeries) {
      if (
        typeof d.boostPsi !== "number" ||
        typeof d.afSens1Ratio !== "number"
      )
        continue;
      if (isRangeActive && (d.timestamp < timeRange.start! || d.timestamp > timeRange.end!)) {
        outRange.push({ x: d.boostPsi, y: d.afSens1Ratio });
      } else {
        inRange.push({
          x: d.boostPsi,
          y: d.afSens1Ratio,
          color: typeof d.engineRpm === "number" ? d.engineRpm : 0,
        });
      }
    }
    return { inRange, outRange };
  }, [timeSeries, timeRange, isRangeActive]);

  return (
    <div className="space-y-4 pt-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <CobbStatCard label="Avg AFR" value={stats.avgAFR} />
        <CobbStatCard label="Avg Target AFR" value={stats.avgAFRTarget} />
        <CobbStatCard label="Avg Deviation" value={stats.avgAFRDeviation} />
        <CobbStatCard label="Max Deviation" value={stats.maxAFRDeviation} />
        <CobbStatCard label="Avg AF Correction 1" value={stats.avgAFCorrection1} unit="%" />
        <CobbStatCard label="Avg AF Learning 1" value={stats.avgAFLearning1} unit="%" />
      </div>

      {/* Chart 1: AFR Commanded + Learning + Injector Duty */}
      <ChartWrapper title="AFR Control & Injector Duty" height={280} tooltipContent={<MetricTooltip content={METRIC_TOOLTIPS.cobbAFR} />}>
        <TimeSeriesChart
          data={timeSeries}
          traces={[
            { field: "afSens1Ratio", name: "AFR (actual)", color: CHART_COLORS.primary },
            { field: "clFuelTarget", name: "AFR (target)", color: CHART_COLORS.amber },
            { field: "injDutyCycle", name: "Inj Duty (%)", color: CHART_COLORS.quaternary, yaxis: "y2" },
          ]}
          yAxisLabel="AFR"
          y2AxisLabel="Duty Cycle (%)"
          height={280}
          startTime={startTime}
        />
      </ChartWrapper>

      {/* Chart 2: AFR Learning Heatmap */}
      <ChartWrapper title="AF Learning — RPM × Load" height={300} tooltipContent={<MetricTooltip content={METRIC_TOOLTIPS.cobbAfrLearningHeatmap} />}>
        <HeatmapChart
          data={heatmapData}
          xLabel="RPM"
          yLabel="Load (g/rev)"
          valueLabel="AF Learning 1 (%)"
          height={300}
        />
      </ChartWrapper>

      {/* Chart 3: Injector Duty vs RPM */}
      <ChartWrapper title="Injector Duty Cycle vs RPM" height={280} tooltipContent={<MetricTooltip content={METRIC_TOOLTIPS.cobbInjScatter} />}>
        <ScatterChart
          data={timeSeries}
          xField="engineRpm"
          yField="injDutyCycle"
          colorField="accelPosition"
          xLabel="RPM"
          yLabel="Duty Cycle (%)"
          height={280}
        />
      </ChartWrapper>

      {/* Chart 4: AFR vs Boost (safety chart with danger zone) */}
      <ChartWrapper title="⚠️ AFR vs Boost — Safety Chart" height={280} tooltipContent={<MetricTooltip content={METRIC_TOOLTIPS.cobbAfrVsBoost} />}>
        {afrVsBoost.inRange.length > 0 || afrVsBoost.outRange.length > 0 ? (
          <Plot
            data={[
              ...(afrVsBoost.outRange.length > 0
                ? [
                    {
                      x: afrVsBoost.outRange.map((p) => p.x),
                      y: afrVsBoost.outRange.map((p) => p.y),
                      type: "scattergl" as const,
                      mode: "markers" as const,
                      marker: { color: CHART_COLORS.primary, size: 4, opacity: 0.15 },
                      showlegend: false,
                      hoverinfo: "skip" as const,
                    },
                  ]
                : []),
              {
                x: afrVsBoost.inRange.map((p) => p.x),
                y: afrVsBoost.inRange.map((p) => p.y),
                type: "scattergl" as const,
                mode: "markers" as const,
                marker: {
                  color: afrVsBoost.inRange.map((p) => p.color),
                  colorscale: [[0, CHART_COLORS.primary], [1, CHART_COLORS.subaruRed]],
                  size: 4,
                  opacity: 0.7,
                  colorbar: { title: { text: "RPM", font: { size: 10, color: CHART_COLORS.textMuted } }, tickfont: { size: 9, color: CHART_COLORS.textMuted } },
                },
                hovertemplate: "Boost: %{x:.1f} psi<br>AFR: %{y:.2f}<br>RPM: %{marker.color:.0f}<extra></extra>",
              },
            ]}
            layout={{
              ...BASE_LAYOUT,
              height: 280,
              xaxis: { ...BASE_LAYOUT.xaxis, title: { text: "Boost (psi)", font: { size: 10, color: CHART_COLORS.textMuted } } },
              yaxis: { ...BASE_LAYOUT.yaxis, title: { text: "AFR", font: { size: 10, color: CHART_COLORS.textMuted } } },
              shapes: [
                {
                  type: "rect",
                  xref: "paper",
                  x0: 0,
                  x1: 1,
                  yref: "y",
                  y0: 12.0,
                  y1: 15.0,
                  fillcolor: "rgba(224, 32, 44, 0.1)",
                  line: { width: 0 },
                  layer: "below",
                },
              ],
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
