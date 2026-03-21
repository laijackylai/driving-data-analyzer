"use client";

import { OBD2DataPoint, ThresholdConfig } from "@/types";
import { ChartWrapper } from "@/components/ui/ChartWrapper";
import { MetricTooltip } from "@/components/ui/MetricTooltip";
import { TimeSeriesChart } from "@/components/features/charts/TimeSeriesChart";
import { ScatterChart } from "@/components/features/charts/ScatterChart";
import { CHART_COLORS } from "@/lib/chartTheme";
import { METRIC_TOOLTIPS } from "@/lib/data/metricTooltips";

interface PowerTabProps {
  timeSeries: OBD2DataPoint[];
  thresholds: ThresholdConfig;
}

export function PowerTab({ timeSeries }: PowerTabProps) {
  const startTime = timeSeries[0]?.timestamp ?? 0;

  return (
    <div className="space-y-4 pt-4">
      {/* Power output overlay */}
      <ChartWrapper
        title="Power Output (MAF vs Fuel)"
        height={280}
        tooltipContent={<MetricTooltip content={METRIC_TOOLTIPS.powerFromMaf} />}
      >
        <TimeSeriesChart
          data={timeSeries}
          traces={[
            { field: "powerFromMaf", name: "From MAF (hp)", color: CHART_COLORS.primary },
            { field: "instantPowerFuel", name: "From Fuel (hp)", color: CHART_COLORS.amber, yaxis: "y2" },
          ]}
          yAxisLabel="MAF hp"
          y2AxisLabel="Fuel hp"
          height={280}
          startTime={startTime}
        />
      </ChartWrapper>

      {/* Power vs RPM */}
      <ChartWrapper
        title="Power vs RPM"
        height={280}
        tooltipContent={<MetricTooltip content={METRIC_TOOLTIPS.powerFromMaf} />}
      >
        <ScatterChart
          data={timeSeries}
          xField="engineRpm"
          yField="powerFromMaf"
          colorField="throttlePosition"
          xLabel="RPM"
          yLabel="Power (hp)"
          height={280}
        />
      </ChartWrapper>

      {/* Throttle over time */}
      <ChartWrapper
        title="Throttle Position"
        height={250}
        tooltipContent={<MetricTooltip content={METRIC_TOOLTIPS.throttlePosition} />}
      >
        <TimeSeriesChart
          data={timeSeries}
          traces={[{ field: "throttlePosition", name: "Throttle (%)", color: CHART_COLORS.emerald, fill: true }]}
          yAxisLabel="%"
          height={250}
          startTime={startTime}
        />
      </ChartWrapper>

      {/* Throttle vs acceleration */}
      <ChartWrapper title="Throttle vs Acceleration" height={280}>
        <ScatterChart
          data={timeSeries}
          xField="throttlePosition"
          yField="vehicleAcceleration"
          colorField="vehicleSpeed"
          xLabel="Throttle (%)"
          yLabel="Acceleration (g)"
          height={280}
        />
      </ChartWrapper>
    </div>
  );
}
