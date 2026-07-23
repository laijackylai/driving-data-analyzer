"use client";

import { useMemo } from "react";
import { OBD2DataPoint, ThresholdConfig } from "@/types";
import { ChartWrapper } from "@/components/ui/ChartWrapper";
import { MetricTooltip } from "@/components/ui/MetricTooltip";
import { TimeSeriesChart } from "@/components/features/charts/TimeSeriesChart";
import { ScatterChart } from "@/components/features/charts/ScatterChart";
import { CHART_COLORS } from "@/lib/chartTheme";
import { METRIC_TOOLTIPS } from "@/lib/data/metricTooltips";
import { computeVolumetricEfficiency } from "@/lib/data/deriveMetrics";

interface AirIntakeTabProps {
  timeSeries: OBD2DataPoint[];
  thresholds: ThresholdConfig;
}

export function AirIntakeTab({ timeSeries, thresholds }: AirIntakeTabProps) {
  const startTime = timeSeries[0]?.timestamp ?? 0;

  const vePoints = useMemo(() => computeVolumetricEfficiency(timeSeries), [timeSeries]);

  return (
    <div className="space-y-4 pt-4">
      {/* MAF + Throttle + Manifold Pressure combined */}
      <ChartWrapper
        title="MAF + Throttle + Manifold Pressure"
        height={280}
        tooltipContent={
          <MetricTooltip content={METRIC_TOOLTIPS.mafAirFlowRate} />
        }
      >
        <TimeSeriesChart
          data={timeSeries}
          traces={[
            {
              field: "mafAirFlowRate",
              name: "MAF (g/s)",
              color: CHART_COLORS.primary,
            },
            {
              field: "throttlePosition",
              name: "Throttle (%)",
              color: CHART_COLORS.amber,
              yaxis: "y2",
            },
            {
              field: "intakeManifoldPressure",
              name: "MAP (kPa)",
              color: CHART_COLORS.emerald,
              yaxis: "y2",
            },
          ]}
          thresholdKey="mafAirFlowRate"
          thresholds={thresholds}
          yAxisLabel="g/s"
          y2AxisLabel="% / kPa"
          height={280}
          startTime={startTime}
        />
      </ChartWrapper>

      {/* VE Estimate vs RPM */}
      <ChartWrapper
        title="Volumetric Efficiency Estimate vs RPM"
        height={280}
        tooltipContent={
          <MetricTooltip content={METRIC_TOOLTIPS.volumetricEfficiency} />
        }
      >
        <ScatterChart
          data={vePoints}
          xField={"engineRpm" as keyof OBD2DataPoint}
          yField={"volumetricEfficiency" as keyof OBD2DataPoint}
          colorField="engineLoad"
          xLabel="RPM"
          yLabel="VE (%)"
          height={280}
        />
      </ChartWrapper>

      {/* IAT Heat Soak */}
      <ChartWrapper
        title="IAT Heat Soak"
        height={280}
        tooltipContent={
          <MetricTooltip content={METRIC_TOOLTIPS.iatHeatSoak} />
        }
      >
        <TimeSeriesChart
          data={timeSeries}
          traces={[
            {
              field: "intakeAirTemp",
              name: "IAT (°C)",
              color: CHART_COLORS.amber,
            },
            {
              field: "engineLoad",
              name: "Load (%)",
              color: CHART_COLORS.secondary,
              yaxis: "y2",
            },
          ]}
          yAxisLabel="°C"
          y2AxisLabel="Load (%)"
          height={280}
          startTime={startTime}
        />
      </ChartWrapper>

      {/* MAF vs RPM */}
      <ChartWrapper
        title="MAF vs RPM"
        height={280}
        tooltipContent={<MetricTooltip content={METRIC_TOOLTIPS.mafVsRpm} />}
      >
        <ScatterChart
          data={timeSeries}
          xField="engineRpm"
          yField="mafAirFlowRate"
          colorField="throttlePosition"
          xLabel="RPM"
          yLabel="MAF (g/s)"
          height={280}
        />
      </ChartWrapper>
    </div>
  );
}
