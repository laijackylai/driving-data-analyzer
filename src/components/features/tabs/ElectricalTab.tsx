"use client";

import { OBD2DataPoint, ThresholdConfig } from "@/types";
import { ChartWrapper } from "@/components/ui/ChartWrapper";
import { MetricTooltip } from "@/components/ui/MetricTooltip";
import { TimeSeriesChart } from "@/components/features/charts/TimeSeriesChart";
import { CHART_COLORS } from "@/lib/chartTheme";
import { METRIC_TOOLTIPS } from "@/lib/data/metricTooltips";

interface ElectricalTabProps {
  timeSeries: OBD2DataPoint[];
  thresholds: ThresholdConfig;
}

export function ElectricalTab({ timeSeries, thresholds }: ElectricalTabProps) {
  const startTime = timeSeries[0]?.timestamp ?? 0;

  return (
    <div className="space-y-4 pt-4">
      {/* Battery voltage over time */}
      <ChartWrapper
        title="Battery Voltage"
        height={320}
        tooltipContent={<MetricTooltip content={METRIC_TOOLTIPS.batteryVoltage} />}
      >
        <TimeSeriesChart
          data={timeSeries}
          traces={[{ field: "batteryVoltage", name: "Voltage (V)", color: CHART_COLORS.emerald }]}
          thresholdKey="batteryVoltage"
          thresholds={thresholds}
          yAxisLabel="Volts"
          height={320}
          startTime={startTime}
        />
      </ChartWrapper>
    </div>
  );
}
