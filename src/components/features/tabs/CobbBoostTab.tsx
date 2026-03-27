"use client";

import { OBD2DataPoint, CobbBoostMetrics } from "@/types";
import { ChartWrapper } from "@/components/ui/ChartWrapper";
import { TimeSeriesChart } from "@/components/features/charts/TimeSeriesChart";
import { ScatterChart } from "@/components/features/charts/ScatterChart";
import { CHART_COLORS } from "@/lib/chartTheme";
import { CobbStatCard } from "@/components/features/tabs/CobbStatCard";
import { MetricTooltip } from "@/components/ui/MetricTooltip";
import { METRIC_TOOLTIPS } from "@/lib/data/metricTooltips";

interface CobbBoostTabProps {
  timeSeries: OBD2DataPoint[];
  stats: CobbBoostMetrics;
}

export function CobbBoostTab({ timeSeries, stats }: CobbBoostTabProps) {
  const startTime = timeSeries[0]?.timestamp ?? 0;

  return (
    <div className="space-y-4 pt-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <CobbStatCard label="Avg Boost" value={stats.avgBoostPsi} unit="psi" />
        <CobbStatCard label="Max Boost" value={stats.maxBoostPsi} unit="psi" />
        <CobbStatCard label="Avg Target" value={stats.avgTargetBoostPsi} unit="psi" />
        <CobbStatCard label="Max Target" value={stats.maxTargetBoostPsi} unit="psi" />
        <CobbStatCard label="Avg Error" value={stats.avgBoostErrorPsi} unit="psi" />
        <CobbStatCard label="Max Error" value={stats.maxBoostErrorPsi} unit="psi" />
      </div>

      <ChartWrapper title="Boost Pressure — Actual vs Target" height={280} tooltipContent={<MetricTooltip content={METRIC_TOOLTIPS.cobbBoost} />}>
        <TimeSeriesChart
          data={timeSeries}
          traces={[
            { field: "boostPsi", name: "Actual (psi)", color: CHART_COLORS.primary },
            { field: "targetBoostFinalRelPsi", name: "Target (psi)", color: CHART_COLORS.amber, yaxis: "y2" },
          ]}
          yAxisLabel="Actual psi"
          y2AxisLabel="Target psi"
          height={280}
          startTime={startTime}
        />
      </ChartWrapper>

      <ChartWrapper title="Boost Error Over Time" height={240} tooltipContent={<MetricTooltip content={METRIC_TOOLTIPS.cobbBoostError} />}>
        <TimeSeriesChart
          data={timeSeries}
          traces={[
            { field: "tdBoostErrorPsi", name: "Error (psi)", color: CHART_COLORS.subaruRed },
          ]}
          yAxisLabel="Error psi"
          height={240}
          startTime={startTime}
        />
      </ChartWrapper>

      <ChartWrapper title="Boost vs RPM" height={280} tooltipContent={<MetricTooltip content={METRIC_TOOLTIPS.cobbBoostScatter} />}>
        <ScatterChart
          data={timeSeries}
          xField="engineRpm"
          yField="boostPsi"
          colorField="throttlePosition"
          xLabel="RPM"
          yLabel="Boost (psi)"
          height={280}
        />
      </ChartWrapper>
    </div>
  );
}
