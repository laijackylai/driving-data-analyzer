"use client";

import { OBD2DataPoint } from "@/types";
import { ChartWrapper } from "@/components/ui/ChartWrapper";
import { MetricTooltip } from "@/components/ui/MetricTooltip";
import { TimeSeriesChart } from "@/components/features/charts/TimeSeriesChart";
import { ScatterChart } from "@/components/features/charts/ScatterChart";
import { HistogramChart } from "@/components/features/charts/HistogramChart";
import { CHART_COLORS } from "@/lib/chartTheme";
import { METRIC_TOOLTIPS } from "@/lib/data/metricTooltips";

interface DrivingBehaviorTabProps {
  timeSeries: OBD2DataPoint[];
}

export function DrivingBehaviorTab({ timeSeries }: DrivingBehaviorTabProps) {
  const startTime = timeSeries[0]?.timestamp ?? 0;

  const accelerationValues = timeSeries
    .map((d) => d.vehicleAcceleration)
    .filter((v): v is number => v !== undefined);

  const harshBrakingMarkers = timeSeries
    .filter((d) => d.vehicleAcceleration !== undefined && d.vehicleAcceleration < -0.4)
    .map((d) => ({ timestamp: d.timestamp, color: CHART_COLORS.subaruRed, label: "Harsh braking" }));

  const rapidAccelMarkers = timeSeries
    .filter((d) => d.vehicleAcceleration !== undefined && d.vehicleAcceleration > 0.3)
    .map((d) => ({ timestamp: d.timestamp, color: CHART_COLORS.amber, label: "Rapid acceleration" }));

  return (
    <div className="space-y-4 pt-4">
      {/* Acceleration histogram */}
      <ChartWrapper
        title="Acceleration Distribution"
        height={280}
        tooltipContent={<MetricTooltip content={METRIC_TOOLTIPS.vehicleAcceleration} />}
      >
        <HistogramChart
          data={accelerationValues}
          bins={60}
          highlightRanges={[
            { min: -2, max: -0.4, color: CHART_COLORS.subaruRedFill, label: "Harsh braking" },
            { min: 0.3, max: 2, color: CHART_COLORS.amberFill, label: "Rapid acceleration" },
          ]}
          xLabel="Acceleration (g)"
          height={280}
        />
      </ChartWrapper>

      {/* Speed vs RPM */}
      <ChartWrapper title="Speed vs RPM" height={280}>
        <ScatterChart
          data={timeSeries}
          xField="vehicleSpeed"
          yField="engineRpm"
          colorField="actualGearRatio"
          xLabel="Speed (km/h)"
          yLabel="RPM"
          height={280}
        />
      </ChartWrapper>

      {/* Speed profile with events */}
      <ChartWrapper
        title="Speed with Driving Events"
        height={280}
        tooltipContent={<MetricTooltip content={METRIC_TOOLTIPS.vehicleSpeed} />}
      >
        <TimeSeriesChart
          data={timeSeries}
          traces={[{ field: "vehicleSpeed", name: "Speed (km/h)", color: CHART_COLORS.primary, fill: true }]}
          eventMarkers={[...harshBrakingMarkers, ...rapidAccelMarkers]}
          yAxisLabel="km/h"
          height={280}
          startTime={startTime}
        />
      </ChartWrapper>
    </div>
  );
}
