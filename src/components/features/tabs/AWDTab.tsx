"use client";

import { OBD2DataPoint, ThresholdConfig } from "@/types";
import { ChartWrapper } from "@/components/ui/ChartWrapper";
import { MetricTooltip } from "@/components/ui/MetricTooltip";
import { TimeSeriesChart } from "@/components/features/charts/TimeSeriesChart";
import { ScatterChart } from "@/components/features/charts/ScatterChart";
import { CHART_COLORS } from "@/lib/chartTheme";
import { METRIC_TOOLTIPS } from "@/lib/data/metricTooltips";

interface AWDTabProps {
  timeSeries: OBD2DataPoint[];
  thresholds: ThresholdConfig;
}

export function AWDTab({ timeSeries }: AWDTabProps) {
  const startTime = timeSeries[0]?.timestamp ?? 0;

  return (
    <div className="space-y-4 pt-4">
      {/* Solenoid current over time */}
      <ChartWrapper
        title="AWD Solenoid Current"
        height={280}
        tooltipContent={<MetricTooltip content={METRIC_TOOLTIPS.awdSolenoidActualCurrent} />}
      >
        <TimeSeriesChart
          data={timeSeries}
          traces={[
            { field: "awdSolenoidActualCurrent", name: "Actual (mA)", color: CHART_COLORS.primary },
            { field: "awdSolenoidSetCurrent", name: "Set (mA)", color: CHART_COLORS.subaruRed },
          ]}
          yAxisLabel="mA"
          height={280}
          startTime={startTime}
        />
      </ChartWrapper>

      {/* AWD engagement vs steering angle */}
      <ChartWrapper title="AWD Engagement vs Steering" height={280}>
        <ScatterChart
          data={timeSeries}
          xField="steeringAngle"
          yField="awdSolenoidActualCurrent"
          colorField="vehicleSpeed"
          xLabel="Steering Angle (°)"
          yLabel="AWD Current (mA)"
          height={280}
        />
      </ChartWrapper>
    </div>
  );
}
