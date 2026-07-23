"use client";

import { useMemo } from "react";
import dynamic from "next/dynamic";
import { OBD2DataPoint, CobbAVCSMetrics } from "@/types";
import { ChartWrapper } from "@/components/ui/ChartWrapper";
import { TimeSeriesChart } from "@/components/features/charts/TimeSeriesChart";
import { BASE_LAYOUT, BASE_CONFIG, CHART_COLORS } from "@/lib/chartTheme";
import { CobbStatCard } from "@/components/features/tabs/CobbStatCard";
import { MetricTooltip } from "@/components/ui/MetricTooltip";
import { METRIC_TOOLTIPS } from "@/lib/data/metricTooltips";
import { useTimeRange } from "@/hooks/useTimeRange";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

interface CobbAVCSTabProps {
  timeSeries: OBD2DataPoint[];
  stats: CobbAVCSMetrics;
}

export function CobbAVCSTab({ timeSeries, stats }: CobbAVCSTabProps) {
  const { timeRange, isRangeActive } = useTimeRange();
  const startTime = timeSeries[0]?.timestamp ?? 0;

  // Cam angle vs RPM — split by in/out range
  const camVsRpmData = useMemo(() => {
    const intake = { inRange: [] as { rpm: number; angle: number; load: number }[], outRange: [] as { rpm: number; angle: number }[] };
    const exhaust = { inRange: [] as { rpm: number; angle: number; load: number }[], outRange: [] as { rpm: number; angle: number }[] };
    for (const d of timeSeries) {
      const rpm = d.engineRpm;
      const load = d.calculatedLoadGRev;
      if (typeof rpm !== "number") continue;
      const out = isRangeActive && (d.timestamp < timeRange.start! || d.timestamp > timeRange.end!);
      if (typeof d.avcsInLeft === "number") {
        if (out) {
          intake.outRange.push({ rpm, angle: d.avcsInLeft });
        } else {
          intake.inRange.push({ rpm, angle: d.avcsInLeft, load: typeof load === "number" ? load : 0 });
        }
      }
      if (typeof d.avcsExhLeft === "number") {
        if (out) {
          exhaust.outRange.push({ rpm, angle: d.avcsExhLeft });
        } else {
          exhaust.inRange.push({ rpm, angle: d.avcsExhLeft, load: typeof load === "number" ? load : 0 });
        }
      }
    }
    return { intake, exhaust };
  }, [timeSeries, timeRange, isRangeActive]);

  // AVCS response check: rate of change of cam angle (°/second) — split by in/out range
  const avcsResponseData = useMemo(() => {
    const intake = { inRange: [] as { rpm: number; rate: number }[], outRange: [] as { rpm: number; rate: number }[] };
    const exhaust = { inRange: [] as { rpm: number; rate: number }[], outRange: [] as { rpm: number; rate: number }[] };
    for (let i = 1; i < timeSeries.length; i++) {
      const prev = timeSeries[i - 1];
      const curr = timeSeries[i];
      const dt = curr.timestamp - prev.timestamp;
      if (dt <= 0 || dt > 1) continue;
      const rpm = curr.engineRpm;
      if (typeof rpm !== "number") continue;
      const out = isRangeActive && (curr.timestamp < timeRange.start! || curr.timestamp > timeRange.end!);
      if (typeof curr.avcsInLeft === "number" && typeof prev.avcsInLeft === "number") {
        const rate = Math.abs(curr.avcsInLeft - prev.avcsInLeft) / dt;
        if (rate > 0.1) {
          if (out) {
            intake.outRange.push({ rpm, rate });
          } else {
            intake.inRange.push({ rpm, rate });
          }
        }
      }
      if (typeof curr.avcsExhLeft === "number" && typeof prev.avcsExhLeft === "number") {
        const rate = Math.abs(curr.avcsExhLeft - prev.avcsExhLeft) / dt;
        if (rate > 0.1) {
          if (out) {
            exhaust.outRange.push({ rpm, rate });
          } else {
            exhaust.inRange.push({ rpm, rate });
          }
        }
      }
    }
    return { intake, exhaust };
  }, [timeSeries, timeRange, isRangeActive]);

  return (
    <div className="space-y-4 pt-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <CobbStatCard label="Avg Intake" value={stats.avgAvcsInLeft} unit="°" />
        <CobbStatCard label="Max Intake" value={stats.maxAvcsInLeft} unit="°" />
        <CobbStatCard label="Avg Exhaust" value={stats.avgAvcsExhLeft} unit="°" />
        <CobbStatCard label="Max Exhaust" value={stats.maxAvcsExhLeft} unit="°" />
      </div>

      {/* Chart 1: AVCS Cam Angles + RPM */}
      <ChartWrapper title="AVCS Cam Timing & RPM" height={280} tooltipContent={<MetricTooltip content={METRIC_TOOLTIPS.cobbAVCS} />}>
        <TimeSeriesChart
          data={timeSeries}
          traces={[
            { field: "avcsInLeft", name: "Intake (°)", color: CHART_COLORS.primary },
            { field: "avcsExhLeft", name: "Exhaust (°)", color: CHART_COLORS.amber },
            { field: "engineRpm", name: "RPM", color: CHART_COLORS.tertiary, yaxis: "y2" },
          ]}
          yAxisLabel="Cam Angle (°)"
          y2AxisLabel="RPM"
          height={280}
          startTime={startTime}
        />
      </ChartWrapper>

      {/* Chart 2: Cam Angle vs RPM (intake + exhaust, colored by load) */}
      <ChartWrapper title="Cam Angle vs RPM (by Load)" height={280} tooltipContent={<MetricTooltip content={METRIC_TOOLTIPS.cobbCamVsRpm} />}>
        {camVsRpmData.intake.inRange.length > 0 || camVsRpmData.exhaust.inRange.length > 0 ||
         camVsRpmData.intake.outRange.length > 0 || camVsRpmData.exhaust.outRange.length > 0 ? (
          <Plot
            data={[
              // Out-of-range intake (greyed)
              ...(camVsRpmData.intake.outRange.length > 0
                ? [
                    {
                      x: camVsRpmData.intake.outRange.map((p) => p.rpm),
                      y: camVsRpmData.intake.outRange.map((p) => p.angle),
                      type: "scattergl" as const,
                      mode: "markers" as const,
                      marker: { color: CHART_COLORS.primary, size: 3, opacity: 0.15 },
                      showlegend: false,
                      hoverinfo: "skip" as const,
                    },
                  ]
                : []),
              // Out-of-range exhaust (greyed)
              ...(camVsRpmData.exhaust.outRange.length > 0
                ? [
                    {
                      x: camVsRpmData.exhaust.outRange.map((p) => p.rpm),
                      y: camVsRpmData.exhaust.outRange.map((p) => p.angle),
                      type: "scattergl" as const,
                      mode: "markers" as const,
                      marker: { color: CHART_COLORS.quaternary, size: 3, opacity: 0.15, symbol: "diamond" as const },
                      showlegend: false,
                      hoverinfo: "skip" as const,
                    },
                  ]
                : []),
              // In-range intake
              ...(camVsRpmData.intake.inRange.length > 0
                ? [
                    {
                      x: camVsRpmData.intake.inRange.map((p) => p.rpm),
                      y: camVsRpmData.intake.inRange.map((p) => p.angle),
                      type: "scattergl" as const,
                      mode: "markers" as const,
                      name: "Intake",
                      marker: {
                        color: camVsRpmData.intake.inRange.map((p) => p.load),
                        colorscale: [[0, CHART_COLORS.primary], [1, CHART_COLORS.amber]] as Plotly.ColorScale,
                        size: 3,
                        opacity: 0.6,
                        colorbar: { title: { text: "Load", font: { size: 10, color: CHART_COLORS.textMuted } }, tickfont: { size: 9, color: CHART_COLORS.textMuted }, x: 1.02 },
                      },
                      hovertemplate: "RPM: %{x:.0f}<br>Intake: %{y:.1f}°<br>Load: %{marker.color:.2f}<extra>Intake</extra>",
                    },
                  ]
                : []),
              // In-range exhaust
              ...(camVsRpmData.exhaust.inRange.length > 0
                ? [
                    {
                      x: camVsRpmData.exhaust.inRange.map((p) => p.rpm),
                      y: camVsRpmData.exhaust.inRange.map((p) => p.angle),
                      type: "scattergl" as const,
                      mode: "markers" as const,
                      name: "Exhaust",
                      marker: {
                        color: camVsRpmData.exhaust.inRange.map((p) => p.load),
                        colorscale: [[0, CHART_COLORS.quaternary], [1, CHART_COLORS.subaruRed]] as Plotly.ColorScale,
                        size: 3,
                        opacity: 0.6,
                        symbol: "diamond" as const,
                      },
                      hovertemplate: "RPM: %{x:.0f}<br>Exhaust: %{y:.1f}°<br>Load: %{marker.color:.2f}<extra>Exhaust</extra>",
                    },
                  ]
                : []),
            ]}
            layout={{
              ...BASE_LAYOUT,
              height: 280,
              showlegend: true,
              xaxis: { ...BASE_LAYOUT.xaxis, title: { text: "RPM", font: { size: 10, color: CHART_COLORS.textMuted } } },
              yaxis: { ...BASE_LAYOUT.yaxis, title: { text: "Cam Angle (°)", font: { size: 10, color: CHART_COLORS.textMuted } } },
            }}
            config={BASE_CONFIG as Plotly.Config}
            style={{ width: "100%", height: "100%" }}
            useResizeHandler
          />
        ) : (
          <div data-chart-empty className="hidden" />
        )}
      </ChartWrapper>

      {/* Chart 3: AVCS Response Check */}
      <ChartWrapper title="AVCS Response — Rate of Change" height={280} tooltipContent={<MetricTooltip content={METRIC_TOOLTIPS.cobbAvcsResponse} />}>
        {avcsResponseData.intake.inRange.length > 0 || avcsResponseData.exhaust.inRange.length > 0 ||
         avcsResponseData.intake.outRange.length > 0 || avcsResponseData.exhaust.outRange.length > 0 ? (
          <Plot
            data={[
              // Out-of-range intake (greyed)
              ...(avcsResponseData.intake.outRange.length > 0
                ? [
                    {
                      x: avcsResponseData.intake.outRange.map((p) => p.rpm),
                      y: avcsResponseData.intake.outRange.map((p) => p.rate),
                      type: "scattergl" as const,
                      mode: "markers" as const,
                      marker: { color: CHART_COLORS.primary, size: 3, opacity: 0.15 },
                      showlegend: false,
                      hoverinfo: "skip" as const,
                    },
                  ]
                : []),
              // Out-of-range exhaust (greyed)
              ...(avcsResponseData.exhaust.outRange.length > 0
                ? [
                    {
                      x: avcsResponseData.exhaust.outRange.map((p) => p.rpm),
                      y: avcsResponseData.exhaust.outRange.map((p) => p.rate),
                      type: "scattergl" as const,
                      mode: "markers" as const,
                      marker: { color: CHART_COLORS.amber, size: 3, opacity: 0.15 },
                      showlegend: false,
                      hoverinfo: "skip" as const,
                    },
                  ]
                : []),
              // In-range intake
              ...(avcsResponseData.intake.inRange.length > 0
                ? [
                    {
                      x: avcsResponseData.intake.inRange.map((p) => p.rpm),
                      y: avcsResponseData.intake.inRange.map((p) => p.rate),
                      type: "scattergl" as const,
                      mode: "markers" as const,
                      name: "Intake",
                      marker: { color: CHART_COLORS.primary, size: 3, opacity: 0.5 },
                      hovertemplate: "RPM: %{x:.0f}<br>Rate: %{y:.1f} °/s<extra>Intake</extra>",
                    },
                  ]
                : []),
              // In-range exhaust
              ...(avcsResponseData.exhaust.inRange.length > 0
                ? [
                    {
                      x: avcsResponseData.exhaust.inRange.map((p) => p.rpm),
                      y: avcsResponseData.exhaust.inRange.map((p) => p.rate),
                      type: "scattergl" as const,
                      mode: "markers" as const,
                      name: "Exhaust",
                      marker: { color: CHART_COLORS.amber, size: 3, opacity: 0.5 },
                      hovertemplate: "RPM: %{x:.0f}<br>Rate: %{y:.1f} °/s<extra>Exhaust</extra>",
                    },
                  ]
                : []),
            ]}
            layout={{
              ...BASE_LAYOUT,
              height: 280,
              showlegend: true,
              xaxis: { ...BASE_LAYOUT.xaxis, title: { text: "RPM", font: { size: 10, color: CHART_COLORS.textMuted } } },
              yaxis: { ...BASE_LAYOUT.yaxis, title: { text: "Rate of Change (°/s)", font: { size: 10, color: CHART_COLORS.textMuted } } },
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
