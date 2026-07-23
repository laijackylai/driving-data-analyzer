"use client";

import { useMemo } from "react";
import { OBD2DataPoint, DerivedMetrics, TimeSeriesRow } from "@/types";
import { ChartWrapper } from "@/components/ui/ChartWrapper";
import { MetricTooltip } from "@/components/ui/MetricTooltip";
import { TimeSeriesChart } from "@/components/features/charts/TimeSeriesChart";
import { ScatterChart } from "@/components/features/charts/ScatterChart";
import { CHART_COLORS } from "@/lib/chartTheme";
import { METRIC_TOOLTIPS } from "@/lib/data/metricTooltips";

interface ABSTabProps {
  timeSeries: OBD2DataPoint[];
  derived: DerivedMetrics;
}

export function ABSTab({ timeSeries, derived }: ABSTabProps) {
  const startTime = timeSeries[0]?.timestamp ?? 0;

  // Understeer/oversteer scatter data: front-rear delta vs steering angle
  const understeerData = useMemo<OBD2DataPoint[]>(() => {
    return timeSeries
      .filter(
        (d) =>
          typeof d.absFrontLeftWheelSpeed === "number" &&
          typeof d.absFrontRightWheelSpeed === "number" &&
          typeof d.absRearLeftWheelSpeed === "number" &&
          typeof d.absRearRightWheelSpeed === "number" &&
          typeof d.steeringAngle === "number"
      )
      .map((d) => {
        const avgFront = (d.absFrontLeftWheelSpeed! + d.absFrontRightWheelSpeed!) / 2;
        const avgRear = (d.absRearLeftWheelSpeed! + d.absRearRightWheelSpeed!) / 2;
        return {
          ...d,
          frontRearDelta: avgFront - avgRear,
        } as OBD2DataPoint;
      });
  }, [timeSeries]);

  // Alignment check: left-right delta over time when steering is nearly straight
  const alignmentData = useMemo<TimeSeriesRow[]>(() => {
    return timeSeries
      .filter(
        (d) =>
          typeof d.absFrontLeftWheelSpeed === "number" &&
          typeof d.absFrontRightWheelSpeed === "number" &&
          typeof d.absRearLeftWheelSpeed === "number" &&
          typeof d.absRearRightWheelSpeed === "number" &&
          typeof d.steeringAngle === "number" &&
          Math.abs(d.steeringAngle!) < 5
      )
      .map((d) => {
        const avgLeft = (d.absFrontLeftWheelSpeed! + d.absRearLeftWheelSpeed!) / 2;
        const avgRight = (d.absFrontRightWheelSpeed! + d.absRearRightWheelSpeed!) / 2;
        return { timestamp: d.timestamp, leftRightDelta: avgLeft - avgRight };
      });
  }, [timeSeries]);

  return (
    <div className="space-y-4 pt-4">
      {/* 4 Wheel Speeds + Steering Angle (dual Y-axis) */}
      <ChartWrapper
        title="4 Wheel Speeds + Steering Angle"
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
            { field: "steeringAngle", name: "Steering Angle (°)", color: CHART_COLORS.subaruRed, yaxis: "y2" },
          ]}
          yAxisLabel="km/h"
          y2AxisLabel="Steering Angle (°)"
          height={300}
          startTime={startTime}
        />
      </ChartWrapper>

      {/* Understeer/Oversteer Indicator */}
      <ChartWrapper
        title="Understeer/Oversteer Indicator"
        height={280}
        tooltipContent={<MetricTooltip content={METRIC_TOOLTIPS.understeerOversteer} />}
      >
        <ScatterChart
          data={understeerData}
          xField="steeringAngle"
          yField="frontRearDelta"
          colorField="vehicleSpeed"
          xLabel="Steering Angle (°)"
          yLabel="Front-Rear Delta (km/h)"
          height={280}
        />
      </ChartWrapper>

      {/* Alignment Check */}
      <ChartWrapper
        title="Alignment Check"
        height={250}
        tooltipContent={<MetricTooltip content={METRIC_TOOLTIPS.alignmentCheck} />}
      >
        <TimeSeriesChart
          data={alignmentData}
          traces={[{ field: "leftRightDelta", name: "Left−Right (km/h)", color: CHART_COLORS.amber }]}
          yAxisLabel="Left−Right (km/h)"
          height={250}
          startTime={startTime}
        />
      </ChartWrapper>
    </div>
  );
}
