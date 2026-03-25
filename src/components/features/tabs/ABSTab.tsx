"use client";

import { OBD2DataPoint, DerivedMetrics } from "@/types";
import { ChartWrapper } from "@/components/ui/ChartWrapper";
import { MetricTooltip } from "@/components/ui/MetricTooltip";
import { TimeSeriesChart, TimeSeriesRow } from "@/components/features/charts/TimeSeriesChart";
import { ScatterChart } from "@/components/features/charts/ScatterChart";
import { CHART_COLORS } from "@/lib/chartTheme";
import { METRIC_TOOLTIPS } from "@/lib/data/metricTooltips";

interface ABSTabProps {
  timeSeries: OBD2DataPoint[];
  derived: DerivedMetrics;
}

export function ABSTab({ timeSeries, derived }: ABSTabProps) {
  const startTime = timeSeries[0]?.timestamp ?? 0;

  const frontRearData: TimeSeriesRow[] = [];
  const leftRightData: TimeSeriesRow[] = [];
  for (const p of derived.wheelSpeedDiffs) {
    frontRearData.push({ timestamp: p.timestamp, wheelFrontRearDiff: p.frontRearDelta });
    leftRightData.push({ timestamp: p.timestamp, wheelLeftRightDiff: p.leftRightDelta });
  }

  return (
    <div className="space-y-4 pt-4">
      {/* 4-wheel speed comparison */}
      <ChartWrapper
        title="4-Wheel Speed Comparison"
        height={300}
        tooltipContent={<MetricTooltip content={METRIC_TOOLTIPS.absFrontLeftWheelSpeed} />}
      >
        <TimeSeriesChart
          data={timeSeries}
          traces={[
            { field: "absFrontLeftWheelSpeed", name: "FL", color: CHART_COLORS.primary },
            { field: "absFrontRightWheelSpeed", name: "FR", color: CHART_COLORS.secondary },
            { field: "absRearLeftWheelSpeed", name: "RL", color: CHART_COLORS.tertiary },
            { field: "absRearRightWheelSpeed", name: "RR", color: CHART_COLORS.amber },
          ]}
          yAxisLabel="km/h"
          height={300}
          startTime={startTime}
        />
      </ChartWrapper>

      {/* Front-rear differential */}
      <ChartWrapper
        title="Front-Rear Wheel Speed Differential"
        height={250}
        tooltipContent={<MetricTooltip content={METRIC_TOOLTIPS.frontRearDiff} />}
      >
        <TimeSeriesChart
          data={frontRearData}
          traces={[{ field: "wheelFrontRearDiff", name: "Front−Rear (km/h)", color: CHART_COLORS.subaruRed }]}
          yAxisLabel="km/h diff"
          height={250}
          startTime={startTime}
        />
      </ChartWrapper>

      {/* Left-right differential */}
      <ChartWrapper
        title="Left-Right Wheel Speed Differential"
        height={250}
        tooltipContent={<MetricTooltip content={METRIC_TOOLTIPS.leftRightDiff} />}
      >
        <TimeSeriesChart
          data={leftRightData}
          traces={[{ field: "wheelLeftRightDiff", name: "Left−Right (km/h)", color: CHART_COLORS.amber }]}
          yAxisLabel="km/h diff"
          height={250}
          startTime={startTime}
        />
      </ChartWrapper>

      {/* Steering angle vs speed */}
      <ChartWrapper
        title="Steering Angle vs Speed"
        height={280}
        tooltipContent={<MetricTooltip content={METRIC_TOOLTIPS.steeringAngle} />}
      >
        <ScatterChart
          data={timeSeries}
          xField="steeringAngle"
          yField="vehicleSpeed"
          colorField="vehicleAcceleration"
          xLabel="Steering Angle (°)"
          yLabel="Speed (km/h)"
          height={280}
        />
      </ChartWrapper>
    </div>
  );
}
