"use client";

import { useMemo } from "react";
import dynamic from "next/dynamic";
import { OBD2DataPoint, CobbInjectorMetrics } from "@/types";
import { ChartWrapper } from "@/components/ui/ChartWrapper";
import { TimeSeriesChart } from "@/components/features/charts/TimeSeriesChart";
import { HeatmapChart } from "@/components/features/charts/HeatmapChart";
import { BASE_LAYOUT, BASE_CONFIG, CHART_COLORS } from "@/lib/chartTheme";
import { CobbStatCard } from "@/components/features/tabs/CobbStatCard";
import { MetricTooltip } from "@/components/ui/MetricTooltip";
import { METRIC_TOOLTIPS } from "@/lib/data/metricTooltips";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

interface CobbInjectorTabProps {
  timeSeries: OBD2DataPoint[];
  stats: CobbInjectorMetrics;
}

export function CobbInjectorTab({ timeSeries, stats }: CobbInjectorTabProps) {
  const startTime = timeSeries[0]?.timestamp ?? 0;

  // Fuel pressure error: actual - target
  const fuelPressureErrorData = useMemo(() => {
    const xs: number[] = [];
    const ys: number[] = [];
    const colors: number[] = [];
    for (const d of timeSeries) {
      if (
        typeof d.engineRpm !== "number" ||
        typeof d.fuelPressurePsi !== "number" ||
        typeof d.fuelPressureTargetPsi !== "number"
      )
        continue;
      xs.push(d.engineRpm);
      ys.push(d.fuelPressurePsi - d.fuelPressureTargetPsi);
      colors.push(typeof d.injDutyCycle === "number" ? d.injDutyCycle : 0);
    }
    return { xs, ys, colors };
  }, [timeSeries]);

  // Injector headroom heatmap: RPM × Boost, value = 100 - duty cycle
  const headroomData = useMemo(
    () =>
      timeSeries
        .filter(
          (d) =>
            typeof d.engineRpm === "number" &&
            typeof d.boostPsi === "number" &&
            typeof d.injDutyCycle === "number",
        )
        .map((d) => ({
          x: d.engineRpm!,
          y: d.boostPsi!,
          value: 100 - d.injDutyCycle!,
        })),
    [timeSeries],
  );

  return (
    <div className="space-y-4 pt-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <CobbStatCard label="Avg Duty Cycle" value={stats.avgInjDutyCycle} unit="%" />
        <CobbStatCard label="Max Duty Cycle" value={stats.maxInjDutyCycle} unit="%" />
        <CobbStatCard label="Avg Pulse Width" value={stats.avgInjPulseWidthMs} unit="ms" />
        <CobbStatCard label="Max Pulse Width" value={stats.maxInjPulseWidthMs} unit="ms" />
        <CobbStatCard label="Fuel Cut Events" value={stats.fuelCutEventCount} />
      </div>

      {/* Chart 1: Injector Duty + Pulse Width + RPM */}
      <ChartWrapper title="Injector Duty Cycle, Pulse Width & RPM" height={280} tooltipContent={<MetricTooltip content={METRIC_TOOLTIPS.cobbInjDutyCycle} />}>
        <TimeSeriesChart
          data={timeSeries}
          traces={[
            { field: "injDutyCycle", name: "Duty Cycle (%)", color: CHART_COLORS.primary },
            { field: "injPulseWidth", name: "Pulse Width (ms)", color: CHART_COLORS.amber, yaxis: "y2" },
            { field: "engineRpm", name: "RPM", color: CHART_COLORS.tertiary, yaxis: "y2" },
          ]}
          yAxisLabel="Duty Cycle (%)"
          y2AxisLabel="PW (ms) / RPM"
          height={280}
          startTime={startTime}
        />
      </ChartWrapper>

      {/* Chart 2: Fuel Pressure + Target + Injection Timing */}
      <ChartWrapper title="Fuel Pressure & Injection Timing" height={280} tooltipContent={<MetricTooltip content={METRIC_TOOLTIPS.cobbFuelPressureCombined} />}>
        <TimeSeriesChart
          data={timeSeries}
          traces={[
            { field: "fuelPressurePsi", name: "Fuel Pressure (psi)", color: CHART_COLORS.primary },
            { field: "fuelPressureTargetPsi", name: "Target (psi)", color: CHART_COLORS.amber },
            { field: "injTimingHSoi", name: "Inj Timing (°)", color: CHART_COLORS.quaternary, yaxis: "y2" },
          ]}
          yAxisLabel="Fuel Pressure (psi)"
          y2AxisLabel="Timing (°)"
          height={280}
          startTime={startTime}
        />
      </ChartWrapper>

      {/* Chart 3: Fuel Pressure Error vs RPM */}
      <ChartWrapper title="Fuel Pressure Error vs RPM" height={280} tooltipContent={<MetricTooltip content={METRIC_TOOLTIPS.cobbFuelPressureError} />}>
        {fuelPressureErrorData.xs.length > 0 ? (
          <Plot
            data={[
              {
                x: fuelPressureErrorData.xs,
                y: fuelPressureErrorData.ys,
                type: "scattergl" as const,
                mode: "markers" as const,
                marker: {
                  color: fuelPressureErrorData.colors,
                  colorscale: [[0, CHART_COLORS.quaternary], [1, CHART_COLORS.subaruRed]],
                  size: 3,
                  opacity: 0.6,
                  colorbar: { title: { text: "Duty %", font: { size: 10, color: CHART_COLORS.textMuted } }, tickfont: { size: 9, color: CHART_COLORS.textMuted } },
                },
                hovertemplate: "RPM: %{x:.0f}<br>FP Error: %{y:.1f} psi<br>Duty: %{marker.color:.1f}%<extra></extra>",
              },
            ]}
            layout={{
              ...BASE_LAYOUT,
              height: 280,
              xaxis: { ...BASE_LAYOUT.xaxis, title: { text: "RPM", font: { size: 10, color: CHART_COLORS.textMuted } } },
              yaxis: { ...BASE_LAYOUT.yaxis, title: { text: "FP Error (psi)", font: { size: 10, color: CHART_COLORS.textMuted } } },
            }}
            config={BASE_CONFIG as Plotly.Config}
            style={{ width: "100%", height: "100%" }}
            useResizeHandler
          />
        ) : (
          <div data-chart-empty className="hidden" />
        )}
      </ChartWrapper>

      {/* Chart 4: Injector Headroom Heatmap */}
      <ChartWrapper title="Injector Headroom — RPM × Boost" height={300} tooltipContent={<MetricTooltip content={METRIC_TOOLTIPS.cobbInjectorHeadroom} />}>
        <HeatmapChart
          data={headroomData}
          xLabel="RPM"
          yLabel="Boost (psi)"
          valueLabel="Headroom (%)"
          colorscale={[[0, CHART_COLORS.subaruRed], [0.5, CHART_COLORS.amber], [1, CHART_COLORS.emerald]]}
          height={300}
        />
      </ChartWrapper>
    </div>
  );
}
