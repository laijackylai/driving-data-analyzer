"use client";

import { useMemo } from "react";
import { OBD2DataPoint, ThresholdConfig, DerivedMetrics, TimeSeriesRow } from "@/types";
import { ChartWrapper } from "@/components/ui/ChartWrapper";
import { MetricTooltip } from "@/components/ui/MetricTooltip";
import { TimeSeriesChart } from "@/components/features/charts/TimeSeriesChart";
import { ScatterChart } from "@/components/features/charts/ScatterChart";
import { CHART_COLORS } from "@/lib/chartTheme";
import { METRIC_TOOLTIPS } from "@/lib/data/metricTooltips";

interface EngineTabProps {
  timeSeries: OBD2DataPoint[];
  thresholds: ThresholdConfig;
  derived: DerivedMetrics;
}

export function EngineTab({ timeSeries, thresholds, derived }: EngineTabProps) {
  const startTime = timeSeries[0]?.timestamp ?? 0;

  const thermalDeltaData = useMemo<TimeSeriesRow[]>(
    () =>
      derived.thermalDelta.map((p) => ({
        timestamp: p.timestamp,
        thermalDelta: p.delta,
        engineLoad: p.engineLoad,
      })),
    [derived.thermalDelta],
  );

  const coolantStabilityData = useMemo<TimeSeriesRow[]>(() => {
    const WINDOW_S = 60;
    const result: TimeSeriesRow[] = [];
    const coolantPts = timeSeries.filter((d) => typeof d.coolantTemp === "number");
    for (let i = 0; i < coolantPts.length; i++) {
      const t = coolantPts[i].timestamp;
      const windowPts: number[] = [];
      for (let j = i; j >= 0 && coolantPts[j].timestamp >= t - WINDOW_S; j--) {
        windowPts.push(coolantPts[j].coolantTemp!);
      }
      if (windowPts.length < 3) continue;
      const mean = windowPts.reduce((a, b) => a + b, 0) / windowPts.length;
      const variance = windowPts.reduce((a, b) => a + (b - mean) ** 2, 0) / windowPts.length;
      result.push({ timestamp: t, coolantStdDev: Math.sqrt(variance) });
    }
    return result;
  }, [timeSeries]);

  return (
    <div className="space-y-4 pt-4">
      {/* RPM + Load + Throttle combined */}
      <ChartWrapper
        title="RPM, Load & Throttle"
        height={280}
        tooltipContent={<MetricTooltip content={METRIC_TOOLTIPS.engineCombined} />}
      >
        <TimeSeriesChart
          data={timeSeries}
          traces={[
            { field: "engineRpm", name: "RPM", color: CHART_COLORS.primary },
            { field: "engineLoad", name: "Load (%)", color: CHART_COLORS.amber, yaxis: "y2" },
            { field: "throttlePosition", name: "Throttle (%)", color: CHART_COLORS.subaruRed, yaxis: "y2" },
          ]}
          yAxisLabel="RPM"
          y2AxisLabel="Load / Throttle (%)"
          height={280}
          startTime={startTime}
        />
      </ChartWrapper>

      {/* Coolant + Oil temp */}
      <ChartWrapper
        title="Coolant & Oil Temperature"
        height={280}
        tooltipContent={<MetricTooltip content={METRIC_TOOLTIPS.coolantTemp} />}
      >
        <TimeSeriesChart
          data={timeSeries}
          traces={[
            { field: "coolantTemp", name: "Coolant (°C)", color: CHART_COLORS.primary },
            { field: "oilTemp", name: "Oil (°C)", color: CHART_COLORS.amber },
          ]}
          thresholdKey="coolantTemp"
          thresholds={thresholds}
          yAxisLabel="Temperature (°C)"
          height={280}
          startTime={startTime}
        />
      </ChartWrapper>

      {/* Timing Advance + Knock Correction */}
      <ChartWrapper
        title="Timing Advance & Knock Correction"
        height={280}
        tooltipContent={<MetricTooltip content={METRIC_TOOLTIPS.timingKnockCombined} />}
      >
        <TimeSeriesChart
          data={timeSeries}
          traces={[
            { field: "timingAdvance", name: "Timing Advance (°)", color: CHART_COLORS.primary },
            { field: "knockCorrection", name: "Knock Correction (°)", color: CHART_COLORS.subaruRed },
          ]}
          thresholdKey="knockCorrection"
          thresholds={thresholds}
          yAxisLabel="Degrees"
          height={280}
          startTime={startTime}
        />
      </ChartWrapper>

      {/* RPM vs Load scatter colored by coolant temp */}
      <ChartWrapper
        title="Engine Load vs RPM (by Coolant Temp)"
        height={280}
        tooltipContent={<MetricTooltip content={METRIC_TOOLTIPS.engineLoad} />}
      >
        <ScatterChart
          data={timeSeries}
          xField="engineRpm"
          yField="engineLoad"
          colorField="coolantTemp"
          xLabel="RPM"
          yLabel="Load (%)"
          height={280}
        />
      </ChartWrapper>

      {/* Thermal delta timeline */}
      <ChartWrapper
        title="Thermal Delta (Oil − Coolant)"
        height={280}
        tooltipContent={<MetricTooltip content={METRIC_TOOLTIPS.thermalDelta} />}
      >
        <TimeSeriesChart
          data={thermalDeltaData}
          traces={[
            { field: "thermalDelta", name: "Δ Temp (°C)", color: CHART_COLORS.primary },
            { field: "engineLoad", name: "Load (%)", color: CHART_COLORS.amber, yaxis: "y2" },
          ]}
          yAxisLabel="Δ Temperature (°C)"
          y2AxisLabel="Load (%)"
          height={280}
          startTime={startTime}
        />
      </ChartWrapper>

      {/* Timing Advance vs RPM scatter */}
      <ChartWrapper
        title="Timing Advance vs RPM"
        height={280}
        tooltipContent={<MetricTooltip content={METRIC_TOOLTIPS.timingAdvance} />}
      >
        <ScatterChart
          data={timeSeries}
          xField="engineRpm"
          yField="timingAdvance"
          colorField="engineLoad"
          xLabel="RPM"
          yLabel="Timing Advance (°)"
          height={280}
        />
      </ChartWrapper>

      {/* Coolant stability */}
      <ChartWrapper
        title="Coolant Temperature Stability"
        height={280}
        tooltipContent={<MetricTooltip content={METRIC_TOOLTIPS.coolantStability} />}
      >
        <TimeSeriesChart
          data={coolantStabilityData}
          traces={[
            { field: "coolantStdDev", name: "Std Dev (°C)", color: CHART_COLORS.primary },
          ]}
          yAxisLabel="Std Dev (°C)"
          height={280}
          startTime={startTime}
        />
      </ChartWrapper>
    </div>
  );
}
