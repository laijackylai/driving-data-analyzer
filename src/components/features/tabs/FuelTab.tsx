"use client";

import { useMemo } from "react";
import { OBD2DataPoint, ThresholdConfig, TimeSeriesRow } from "@/types";
import { ChartWrapper } from "@/components/ui/ChartWrapper";
import { MetricTooltip } from "@/components/ui/MetricTooltip";
import { TimeSeriesChart } from "@/components/features/charts/TimeSeriesChart";
import { ScatterChart } from "@/components/features/charts/ScatterChart";
import { CHART_COLORS } from "@/lib/chartTheme";
import { METRIC_TOOLTIPS } from "@/lib/data/metricTooltips";
import { computeSTFTStability } from "@/lib/data/deriveMetrics";

/** Per-chart LTTB downsampling threshold for Fuel Trims (dual overlapping traces). */
const FUEL_TRIM_MAX_POINTS = 2000;

interface FuelTabProps {
  timeSeries: OBD2DataPoint[];
  thresholds: ThresholdConfig;
}

export function FuelTab({ timeSeries, thresholds }: FuelTabProps) {
  const startTime = timeSeries[0]?.timestamp ?? 0;

  const fuelTrimStabilityData = useMemo(() => computeSTFTStability(timeSeries), [timeSeries]);

  return (
    <div className="space-y-4 pt-4">
      {/* STFT + LTFT + Fuel Rate */}
      <ChartWrapper
        title="STFT + LTFT + Fuel Rate"
        height={280}
        tooltipContent={
          <MetricTooltip content={METRIC_TOOLTIPS.shortTermFuelTrim} />
        }
      >
        <TimeSeriesChart
          data={timeSeries}
          traces={[
            {
              field: "shortTermFuelTrim",
              name: "STFT (%)",
              color: CHART_COLORS.primary,
            },
            {
              field: "longTermFuelTrim",
              name: "LTFT (%)",
              color: CHART_COLORS.amber,
            },
            {
              field: "instantFuelRate",
              name: "Fuel Rate (L/h)",
              color: CHART_COLORS.secondary,
              yaxis: "y2",
            },
          ]}
          thresholdKey="shortTermFuelTrim"
          thresholds={thresholds}
          yAxisLabel="Fuel Trim %"
          y2AxisLabel="Fuel Rate (L/h)"
          height={280}
          startTime={startTime}
          maxPoints={FUEL_TRIM_MAX_POINTS}
        />
      </ChartWrapper>

      {/* Fuel Trim vs RPM scatter */}
      <ChartWrapper
        title="Fuel Trim vs RPM"
        height={280}
        tooltipContent={
          <MetricTooltip content={METRIC_TOOLTIPS.fuelTrimVsRpm} />
        }
      >
        <ScatterChart
          data={timeSeries}
          xField="engineRpm"
          yField="shortTermFuelTrim"
          colorField="engineLoad"
          xLabel="RPM"
          yLabel="Short-term Fuel Trim (%)"
          height={280}
        />
      </ChartWrapper>

      {/* Fuel Trim Stability */}
      <ChartWrapper
        title="Fuel Trim Stability"
        height={250}
        tooltipContent={
          <MetricTooltip content={METRIC_TOOLTIPS.fuelTrimStability} />
        }
      >
        <TimeSeriesChart
          data={fuelTrimStabilityData}
          traces={[
            {
              field: "stftStdDev",
              name: "STFT Std Dev",
              color: CHART_COLORS.primary,
            },
          ]}
          yAxisLabel="Std Dev (%)"
          height={250}
          startTime={startTime}
        />
      </ChartWrapper>

      {/* LTFT Drift */}
      <ChartWrapper
        title="LTFT Drift"
        height={250}
        tooltipContent={<MetricTooltip content={METRIC_TOOLTIPS.ltftDrift} />}
      >
        <TimeSeriesChart
          data={timeSeries}
          traces={[
            {
              field: "longTermFuelTrim",
              name: "LTFT (%)",
              color: CHART_COLORS.primary,
            },
          ]}
          thresholdKey="longTermFuelTrim"
          thresholds={thresholds}
          yAxisLabel="LTFT %"
          height={250}
          startTime={startTime}
        />
      </ChartWrapper>
    </div>
  );
}
