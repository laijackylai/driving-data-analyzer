"use client";

import { OBD2DataPoint, ThresholdConfig } from "@/types";
import { ChartWrapper } from "@/components/ui/ChartWrapper";
import { MetricTooltip } from "@/components/ui/MetricTooltip";
import { TimeSeriesChart } from "@/components/features/charts/TimeSeriesChart";
import { ScatterChart } from "@/components/features/charts/ScatterChart";
import { CHART_COLORS } from "@/lib/chartTheme";
import { METRIC_TOOLTIPS } from "@/lib/data/metricTooltips";

interface EngineTabProps {
  timeSeries: OBD2DataPoint[];
  thresholds: ThresholdConfig;
}

export function EngineTab({ timeSeries, thresholds }: EngineTabProps) {
  const startTime = timeSeries[0]?.timestamp ?? 0;

  return (
    <div className="space-y-4 pt-4">
      {/* RPM over time */}
      <ChartWrapper
        title="Engine RPM"
        height={280}
        tooltipContent={<MetricTooltip content={METRIC_TOOLTIPS.engineRpm} />}
      >
        <TimeSeriesChart
          data={timeSeries}
          traces={[{ field: "engineRpm", name: "RPM", color: CHART_COLORS.primary }]}
          thresholdKey="engineRpm"
          thresholds={thresholds}
          yAxisLabel="RPM"
          height={280}
          startTime={startTime}
        />
      </ChartWrapper>

      {/* Load vs RPM scatter */}
      <ChartWrapper
        title="Engine Load vs RPM"
        height={280}
        tooltipContent={<MetricTooltip content={METRIC_TOOLTIPS.engineLoad} />}
      >
        <ScatterChart
          data={timeSeries}
          xField="engineRpm"
          yField="engineLoad"
          colorField="throttlePosition"
          xLabel="RPM"
          yLabel="Load (%)"
          height={280}
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
            { field: "oilTemp", name: "Oil (°C)", color: CHART_COLORS.amber, yaxis: "y2" },
          ]}
          thresholdKey="coolantTemp"
          thresholds={thresholds}
          yAxisLabel="Coolant °C"
          y2AxisLabel="Oil °C"
          height={280}
          startTime={startTime}
        />
      </ChartWrapper>

      {/* Knock correction */}
      <ChartWrapper
        title="Knock Correction"
        height={250}
        tooltipContent={<MetricTooltip content={METRIC_TOOLTIPS.knockCorrection} />}
      >
        <TimeSeriesChart
          data={timeSeries}
          traces={[{ field: "knockCorrection", name: "Knock Correction (°)", color: CHART_COLORS.subaruRed }]}
          thresholdKey="knockCorrection"
          thresholds={thresholds}
          yAxisLabel="Degrees"
          height={250}
          startTime={startTime}
        />
      </ChartWrapper>

      {/* Timing advance vs RPM */}
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
    </div>
  );
}
