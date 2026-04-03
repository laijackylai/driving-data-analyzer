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

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

interface CobbAVCSTabProps {
  timeSeries: OBD2DataPoint[];
  stats: CobbAVCSMetrics;
}

export function CobbAVCSTab({ timeSeries, stats }: CobbAVCSTabProps) {
  const startTime = timeSeries[0]?.timestamp ?? 0;

  // Cam angle vs RPM — two traces (intake + exhaust) colored by load
  const camVsRpmData = useMemo(() => {
    const intakeRpm: number[] = [];
    const intakeAngle: number[] = [];
    const intakeLoad: number[] = [];
    const exhaustRpm: number[] = [];
    const exhaustAngle: number[] = [];
    const exhaustLoad: number[] = [];
    for (const d of timeSeries) {
      const rpm = d.engineRpm;
      const load = d.calculatedLoadGRev;
      if (typeof rpm !== "number") continue;
      if (typeof d.avcsInLeft === "number") {
        intakeRpm.push(rpm);
        intakeAngle.push(d.avcsInLeft);
        intakeLoad.push(typeof load === "number" ? load : 0);
      }
      if (typeof d.avcsExhLeft === "number") {
        exhaustRpm.push(rpm);
        exhaustAngle.push(d.avcsExhLeft);
        exhaustLoad.push(typeof load === "number" ? load : 0);
      }
    }
    return { intakeRpm, intakeAngle, intakeLoad, exhaustRpm, exhaustAngle, exhaustLoad };
  }, [timeSeries]);

  // AVCS response check: rate of change of cam angle (°/second)
  const avcsResponseData = useMemo(() => {
    const intakeRpm: number[] = [];
    const intakeRate: number[] = [];
    const exhaustRpm: number[] = [];
    const exhaustRate: number[] = [];
    for (let i = 1; i < timeSeries.length; i++) {
      const prev = timeSeries[i - 1];
      const curr = timeSeries[i];
      const dt = curr.timestamp - prev.timestamp;
      if (dt <= 0 || dt > 1) continue;
      const rpm = curr.engineRpm;
      if (typeof rpm !== "number") continue;
      if (typeof curr.avcsInLeft === "number" && typeof prev.avcsInLeft === "number") {
        const rate = Math.abs(curr.avcsInLeft - prev.avcsInLeft) / dt;
        if (rate > 0.1) {
          intakeRpm.push(rpm);
          intakeRate.push(rate);
        }
      }
      if (typeof curr.avcsExhLeft === "number" && typeof prev.avcsExhLeft === "number") {
        const rate = Math.abs(curr.avcsExhLeft - prev.avcsExhLeft) / dt;
        if (rate > 0.1) {
          exhaustRpm.push(rpm);
          exhaustRate.push(rate);
        }
      }
    }
    return { intakeRpm, intakeRate, exhaustRpm, exhaustRate };
  }, [timeSeries]);

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
        {camVsRpmData.intakeRpm.length > 0 || camVsRpmData.exhaustRpm.length > 0 ? (
          <Plot
            data={[
              ...(camVsRpmData.intakeRpm.length > 0
                ? [
                    {
                      x: camVsRpmData.intakeRpm,
                      y: camVsRpmData.intakeAngle,
                      type: "scattergl" as const,
                      mode: "markers" as const,
                      name: "Intake",
                      marker: {
                        color: camVsRpmData.intakeLoad,
                        colorscale: [[0, CHART_COLORS.primary], [1, CHART_COLORS.amber]] as Plotly.ColorScale,
                        size: 3,
                        opacity: 0.6,
                        colorbar: { title: { text: "Load", font: { size: 10, color: CHART_COLORS.textMuted } }, tickfont: { size: 9, color: CHART_COLORS.textMuted }, x: 1.02 },
                      },
                      hovertemplate: "RPM: %{x:.0f}<br>Intake: %{y:.1f}°<br>Load: %{marker.color:.2f}<extra>Intake</extra>",
                    },
                  ]
                : []),
              ...(camVsRpmData.exhaustRpm.length > 0
                ? [
                    {
                      x: camVsRpmData.exhaustRpm,
                      y: camVsRpmData.exhaustAngle,
                      type: "scattergl" as const,
                      mode: "markers" as const,
                      name: "Exhaust",
                      marker: {
                        color: camVsRpmData.exhaustLoad,
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
        {avcsResponseData.intakeRpm.length > 0 || avcsResponseData.exhaustRpm.length > 0 ? (
          <Plot
            data={[
              ...(avcsResponseData.intakeRpm.length > 0
                ? [
                    {
                      x: avcsResponseData.intakeRpm,
                      y: avcsResponseData.intakeRate,
                      type: "scattergl" as const,
                      mode: "markers" as const,
                      name: "Intake",
                      marker: { color: CHART_COLORS.primary, size: 3, opacity: 0.5 },
                      hovertemplate: "RPM: %{x:.0f}<br>Rate: %{y:.1f} °/s<extra>Intake</extra>",
                    },
                  ]
                : []),
              ...(avcsResponseData.exhaustRpm.length > 0
                ? [
                    {
                      x: avcsResponseData.exhaustRpm,
                      y: avcsResponseData.exhaustRate,
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
