"use client";

import { useMemo } from "react";
import { OBD2DataPoint, TimeSeriesRow } from "@/types";
import { ChartWrapper } from "@/components/ui/ChartWrapper";
import { MetricTooltip } from "@/components/ui/MetricTooltip";
import { TimeSeriesChart } from "@/components/features/charts/TimeSeriesChart";
import { ScatterChart } from "@/components/features/charts/ScatterChart";
import { CHART_COLORS } from "@/lib/chartTheme";
import { METRIC_TOOLTIPS } from "@/lib/data/metricTooltips";

interface CobbEngineTabProps {
  timeSeries: OBD2DataPoint[];
}

export function CobbEngineTab({ timeSeries }: CobbEngineTabProps) {
  const startTime = timeSeries[0]?.timestamp ?? 0;

  // Thermal delta: oilTemp - coolantTemp
  const thermalDeltaData = useMemo<TimeSeriesRow[]>(() => {
    const result: TimeSeriesRow[] = [];
    for (const d of timeSeries) {
      if (typeof d.oilTemp !== "number" || typeof d.coolantTemp !== "number") continue;
      result.push({
        timestamp: d.timestamp,
        thermalDelta: d.oilTemp - d.coolantTemp,
        calculatedLoadGRev: d.calculatedLoadGRev,
      });
    }
    return result;
  }, [timeSeries]);

  // Coolant stability (rolling 60s std dev)
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
      {/* Chart 1: RPM + Load + Accel Position */}
      <ChartWrapper title="RPM, Load & Throttle" height={280} tooltipContent={<MetricTooltip content={METRIC_TOOLTIPS.engineCombined} />}>
        <TimeSeriesChart
          data={timeSeries}
          traces={[
            { field: "engineRpm", name: "RPM", color: CHART_COLORS.primary },
            { field: "calculatedLoadGRev", name: "Load (g/rev)", color: CHART_COLORS.amber, yaxis: "y2" },
            { field: "accelPosition", name: "Throttle (%)", color: CHART_COLORS.subaruRed, yaxis: "y2" },
          ]}
          yAxisLabel="RPM"
          y2AxisLabel="Load / Throttle"
          height={280}
          startTime={startTime}
        />
      </ChartWrapper>

      {/* Chart 2: Coolant + Oil temp */}
      <ChartWrapper title="Coolant & Oil Temperature" height={280} tooltipContent={<MetricTooltip content={METRIC_TOOLTIPS.coolantTemp} />}>
        <TimeSeriesChart
          data={timeSeries}
          traces={[
            { field: "coolantTemp", name: "Coolant (°C)", color: CHART_COLORS.primary },
            { field: "oilTemp", name: "Oil (°C)", color: CHART_COLORS.amber },
          ]}
          yAxisLabel="Temperature (°C)"
          height={280}
          startTime={startTime}
        />
      </ChartWrapper>

      {/* Chart 3: Timing Advance + Feedback Knock + Fine Knock Learn */}
      <ChartWrapper title="Timing Advance & Knock" height={280} tooltipContent={<MetricTooltip content={METRIC_TOOLTIPS.cobbFeedbackKnock} />}>
        <TimeSeriesChart
          data={timeSeries}
          traces={[
            { field: "timingAdvance", name: "Timing Advance (°)", color: CHART_COLORS.primary },
            { field: "feedbackKnock", name: "Feedback Knock (°)", color: CHART_COLORS.subaruRed, yaxis: "y2" },
            { field: "fineKnockLearn", name: "Fine Knock Learn (°)", color: CHART_COLORS.amber, yaxis: "y2" },
          ]}
          yAxisLabel="Timing (°)"
          y2AxisLabel="Knock (°)"
          height={280}
          startTime={startTime}
        />
      </ChartWrapper>

      {/* Chart 4: RPM vs Load scatter colored by coolant temp */}
      <ChartWrapper title="Load vs RPM (by Coolant Temp)" height={280} tooltipContent={<MetricTooltip content={METRIC_TOOLTIPS.engineLoad} />}>
        <ScatterChart
          data={timeSeries}
          xField="engineRpm"
          yField="calculatedLoadGRev"
          colorField="coolantTemp"
          xLabel="RPM"
          yLabel="Load (g/rev)"
          height={280}
        />
      </ChartWrapper>

      {/* Chart 5: Thermal delta (oil - coolant) */}
      <ChartWrapper title="Thermal Delta (Oil − Coolant)" height={280} tooltipContent={<MetricTooltip content={METRIC_TOOLTIPS.thermalDelta} />}>
        <TimeSeriesChart
          data={thermalDeltaData}
          traces={[
            { field: "thermalDelta", name: "Δ Temp (°C)", color: CHART_COLORS.primary },
            { field: "calculatedLoadGRev", name: "Load (g/rev)", color: CHART_COLORS.amber, yaxis: "y2" },
          ]}
          yAxisLabel="Δ Temperature (°C)"
          y2AxisLabel="Load (g/rev)"
          height={280}
          startTime={startTime}
        />
      </ChartWrapper>

      {/* Chart 6: Timing Advance vs RPM scatter */}
      <ChartWrapper title="Timing Advance vs RPM" height={280} tooltipContent={<MetricTooltip content={METRIC_TOOLTIPS.timingAdvance} />}>
        <ScatterChart
          data={timeSeries}
          xField="engineRpm"
          yField="timingAdvance"
          colorField="calculatedLoadGRev"
          xLabel="RPM"
          yLabel="Timing Advance (°)"
          height={280}
        />
      </ChartWrapper>

      {/* Chart 7: Coolant stability */}
      <ChartWrapper title="Coolant Temperature Stability" height={280} tooltipContent={<MetricTooltip content={METRIC_TOOLTIPS.coolantStability} />}>
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
