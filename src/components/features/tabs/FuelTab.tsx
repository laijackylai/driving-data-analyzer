"use client";

import { OBD2DataPoint, DerivedMetrics, ThresholdConfig } from "@/types";
import { ChartWrapper } from "@/components/ui/ChartWrapper";
import { MetricTooltip } from "@/components/ui/MetricTooltip";
import { TimeSeriesChart } from "@/components/features/charts/TimeSeriesChart";
import { ScatterChart } from "@/components/features/charts/ScatterChart";
import { BarChart } from "@/components/features/charts/BarChart";
import { AreaChart } from "@/components/features/charts/AreaChart";
import { CHART_COLORS } from "@/lib/chartTheme";
import { METRIC_TOOLTIPS } from "@/lib/data/metricTooltips";

/** Per-chart LTTB downsampling threshold for Fuel Trims (dual overlapping traces). */
const FUEL_TRIM_MAX_POINTS = 2000;

interface FuelTabProps {
  timeSeries: OBD2DataPoint[];
  derived: DerivedMetrics;
  thresholds: ThresholdConfig;
}

export function FuelTab({ timeSeries, derived, thresholds }: FuelTabProps) {
  const startTime = timeSeries[0]?.timestamp ?? 0;

  return (
    <div className="space-y-4 pt-4">
      {/* Fuel trims over time */}
      <ChartWrapper
        title="Fuel Trims"
        height={280}
        tooltipContent={<MetricTooltip content={METRIC_TOOLTIPS.shortTermFuelTrim} />}
      >
        <TimeSeriesChart
          data={timeSeries}
          traces={[
            { field: "shortTermFuelTrim", name: "Short-term (%)", color: CHART_COLORS.primary },
            { field: "longTermFuelTrim", name: "Long-term (%)", color: CHART_COLORS.amber, yaxis: "y2" },
          ]}
          thresholdKey="shortTermFuelTrim"
          thresholds={thresholds}
          yAxisLabel="Short-term %"
          y2AxisLabel="Long-term %"
          height={280}
          startTime={startTime}
          maxPoints={FUEL_TRIM_MAX_POINTS}
        />
      </ChartWrapper>

      {/* Fuel/Air equivalence ratio */}
      <ChartWrapper
        title="Fuel/Air Equivalence Ratio"
        height={250}
        tooltipContent={<MetricTooltip content={METRIC_TOOLTIPS.fuelAirRatio} />}
      >
        <TimeSeriesChart
          data={timeSeries}
          traces={[{ field: "fuelAirRatio", name: "λ (lambda)", color: CHART_COLORS.secondary }]}
          yAxisLabel="Equivalence Ratio"
          height={250}
          startTime={startTime}
        />
      </ChartWrapper>

      {/* Consumption vs speed scatter */}
      <ChartWrapper
        title="Fuel Consumption vs Speed"
        height={280}
        tooltipContent={<MetricTooltip content={METRIC_TOOLTIPS.instantFuelRate} />}
      >
        <ScatterChart
          data={timeSeries}
          xField="vehicleSpeed"
          yField="instantFuelRate"
          colorField="engineLoad"
          xLabel="Speed (km/h)"
          yLabel="Fuel Rate (L/h)"
          height={280}
        />
      </ChartWrapper>

      {/* Consumption by speed bucket */}
      <ChartWrapper title="Avg Fuel Consumption by Speed" height={250}>
        <BarChart
          data={derived.fuelBySpeedBucket.map((b) => ({
            label: `${b.bucket} km/h`,
            value: b.avgConsumption,
            count: b.sampleCount,
          }))}
          yLabel="Avg Fuel Rate (L/h)"
          height={250}
        />
      </ChartWrapper>

      {/* Cumulative fuel used */}
      <ChartWrapper title="Cumulative Fuel Used vs Distance" height={250}>
        <AreaChart
          data={derived.fuelDistanceSeries.map((p) => ({ x: p.distance, y: p.fuel }))}
          xLabel="Distance (km)"
          yLabel="Fuel Used (L)"
          height={250}
        />
      </ChartWrapper>
    </div>
  );
}
