"use client";

import { OBD2DataPoint, ThresholdConfig } from "@/types";
import { ChartWrapper } from "@/components/ui/ChartWrapper";
import { MetricTooltip } from "@/components/ui/MetricTooltip";
import { TimeSeriesChart } from "@/components/features/charts/TimeSeriesChart";
import { ScatterChart } from "@/components/features/charts/ScatterChart";
import { CHART_COLORS } from "@/lib/chartTheme";
import { METRIC_TOOLTIPS } from "@/lib/data/metricTooltips";

interface AirIntakeTabProps {
  timeSeries: OBD2DataPoint[];
  thresholds: ThresholdConfig;
}

export function AirIntakeTab({ timeSeries, thresholds }: AirIntakeTabProps) {
  const startTime = timeSeries[0]?.timestamp ?? 0;

  return (
    <div className="space-y-4 pt-4">
      {/* MAF air flow */}
      <ChartWrapper
        title="MAF Air Flow Rate"
        height={280}
        tooltipContent={<MetricTooltip content={METRIC_TOOLTIPS.mafAirFlowRate} />}
      >
        <TimeSeriesChart
          data={timeSeries}
          traces={[{ field: "mafAirFlowRate", name: "MAF (g/s)", color: CHART_COLORS.primary }]}
          thresholdKey="mafAirFlowRate"
          thresholds={thresholds}
          yAxisLabel="g/s"
          height={280}
          startTime={startTime}
        />
      </ChartWrapper>

      {/* Intake vacuum */}
      <ChartWrapper
        title="Intake Vacuum (Calculated Boost)"
        height={280}
        tooltipContent={<MetricTooltip content={METRIC_TOOLTIPS.calculatedBoost} />}
      >
        <TimeSeriesChart
          data={timeSeries}
          traces={[{ field: "calculatedBoost", name: "Vacuum (bar)", color: CHART_COLORS.secondary }]}
          thresholdKey="calculatedBoost"
          thresholds={thresholds}
          yAxisLabel="bar"
          height={280}
          startTime={startTime}
        />
      </ChartWrapper>

      {/* Intake air temp */}
      <ChartWrapper
        title="Intake Air Temperature"
        height={250}
        tooltipContent={<MetricTooltip content={METRIC_TOOLTIPS.intakeAirTemp} />}
      >
        <TimeSeriesChart
          data={timeSeries}
          traces={[{ field: "intakeAirTemp", name: "IAT (°C)", color: CHART_COLORS.amber }]}
          yAxisLabel="°C"
          height={250}
          startTime={startTime}
        />
      </ChartWrapper>

      {/* Manifold pressure vs RPM */}
      <ChartWrapper
        title="Manifold Pressure vs RPM"
        height={280}
        tooltipContent={<MetricTooltip content={METRIC_TOOLTIPS.intakeManifoldPressure} />}
      >
        <ScatterChart
          data={timeSeries}
          xField="engineRpm"
          yField="intakeManifoldPressure"
          colorField="throttlePosition"
          xLabel="RPM"
          yLabel="MAP (kPa)"
          height={280}
        />
      </ChartWrapper>
    </div>
  );
}
