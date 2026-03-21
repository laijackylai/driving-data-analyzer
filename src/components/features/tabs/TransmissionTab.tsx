"use client";

import { OBD2DataPoint, DerivedMetrics, ThresholdConfig } from "@/types";
import { ChartWrapper } from "@/components/ui/ChartWrapper";
import { MetricTooltip } from "@/components/ui/MetricTooltip";
import { TimeSeriesChart } from "@/components/features/charts/TimeSeriesChart";
import { CHART_COLORS } from "@/lib/chartTheme";
import { METRIC_TOOLTIPS } from "@/lib/data/metricTooltips";

interface TransmissionTabProps {
  timeSeries: OBD2DataPoint[];
  derived: DerivedMetrics;
  thresholds: ThresholdConfig;
}

export function TransmissionTab({ timeSeries, derived, thresholds }: TransmissionTabProps) {
  const startTime = timeSeries[0]?.timestamp ?? 0;
  const cvtRatioData = derived.cvtEffectiveRatio.map((p) => ({
    timestamp: p.timestamp,
    cvtEffectiveRatio: p.ratio,
  })) as (OBD2DataPoint & { cvtEffectiveRatio?: number })[];

  return (
    <div className="space-y-4 pt-4">
      {/* CVT temp */}
      <ChartWrapper
        title="CVT Temperature"
        height={280}
        tooltipContent={<MetricTooltip content={METRIC_TOOLTIPS.cvtTemp} />}
      >
        <TimeSeriesChart
          data={timeSeries}
          traces={[{ field: "cvtTemp", name: "CVT Temp (°C)", color: CHART_COLORS.amber }]}
          thresholdKey="cvtTemp"
          thresholds={thresholds}
          yAxisLabel="°C"
          height={280}
          startTime={startTime}
        />
      </ChartWrapper>

      {/* Actual vs Target gear ratio */}
      <ChartWrapper
        title="Actual vs Target Gear Ratio"
        height={280}
        tooltipContent={<MetricTooltip content={METRIC_TOOLTIPS.actualGearRatio} />}
      >
        <TimeSeriesChart
          data={timeSeries}
          traces={[
            { field: "actualGearRatio", name: "Actual", color: CHART_COLORS.primary },
            { field: "targetGearRatio", name: "Target", color: CHART_COLORS.subaruRed },
          ]}
          yAxisLabel="Ratio"
          height={280}
          startTime={startTime}
        />
      </ChartWrapper>

      {/* Pulley speeds */}
      <ChartWrapper
        title="Pulley Speeds"
        height={280}
        tooltipContent={<MetricTooltip content={METRIC_TOOLTIPS.primaryPulleySpeed} />}
      >
        <TimeSeriesChart
          data={timeSeries}
          traces={[
            { field: "primaryPulleySpeed", name: "Primary (rpm)", color: CHART_COLORS.primary },
            { field: "secondaryPulleySpeed", name: "Secondary (rpm)", color: CHART_COLORS.secondary, yaxis: "y2" },
          ]}
          yAxisLabel="Primary rpm"
          y2AxisLabel="Secondary rpm"
          height={280}
          startTime={startTime}
        />
      </ChartWrapper>

      {/* CVT effective ratio (derived) */}
      <ChartWrapper title="CVT Effective Ratio (Derived)" height={250}>
        <TimeSeriesChart
          data={cvtRatioData as OBD2DataPoint[]}
          traces={[{ field: "cvtEffectiveRatio" as keyof OBD2DataPoint, name: "Ratio", color: CHART_COLORS.tertiary }]}
          yAxisLabel="Ratio"
          height={250}
          startTime={startTime}
        />
      </ChartWrapper>

      {/* Lock-up duty ratio */}
      <ChartWrapper
        title="Lock-Up Duty Ratio"
        height={250}
        tooltipContent={<MetricTooltip content={METRIC_TOOLTIPS.lockUpDutyRatio} />}
      >
        <TimeSeriesChart
          data={timeSeries}
          traces={[{ field: "lockUpDutyRatio", name: "Lock-up (%)", color: CHART_COLORS.emerald }]}
          yAxisLabel="%"
          height={250}
          startTime={startTime}
        />
      </ChartWrapper>

      {/* Turbine speed vs Engine RPM */}
      <ChartWrapper
        title="Turbine Speed vs Engine RPM"
        height={280}
        tooltipContent={<MetricTooltip content={METRIC_TOOLTIPS.turbineSpeed} />}
      >
        <TimeSeriesChart
          data={timeSeries}
          traces={[
            { field: "engineRpm", name: "Engine RPM", color: CHART_COLORS.primary },
            { field: "turbineSpeed", name: "Turbine RPM", color: CHART_COLORS.amber, yaxis: "y2" },
          ]}
          yAxisLabel="Engine RPM"
          y2AxisLabel="Turbine RPM"
          height={280}
          startTime={startTime}
        />
      </ChartWrapper>
    </div>
  );
}
