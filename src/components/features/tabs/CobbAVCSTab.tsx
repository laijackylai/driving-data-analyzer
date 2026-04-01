"use client";

import { OBD2DataPoint, CobbAVCSMetrics } from "@/types";
import { ChartWrapper } from "@/components/ui/ChartWrapper";
import { TimeSeriesChart } from "@/components/features/charts/TimeSeriesChart";
import { CHART_COLORS } from "@/lib/chartTheme";
import { CobbStatCard } from "@/components/features/tabs/CobbStatCard";
import { MetricTooltip } from "@/components/ui/MetricTooltip";
import { METRIC_TOOLTIPS } from "@/lib/data/metricTooltips";

interface CobbAVCSTabProps {
  timeSeries: OBD2DataPoint[];
  stats: CobbAVCSMetrics;
}

export function CobbAVCSTab({ timeSeries, stats }: CobbAVCSTabProps) {
  const startTime = timeSeries[0]?.timestamp ?? 0;

  return (
    <div className="space-y-4 pt-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <CobbStatCard label="Avg Intake" value={stats.avgAvcsInLeft} unit="°" />
        <CobbStatCard label="Max Intake" value={stats.maxAvcsInLeft} unit="°" />
        <CobbStatCard label="Avg Exhaust" value={stats.avgAvcsExhLeft} unit="°" />
        <CobbStatCard label="Max Exhaust" value={stats.maxAvcsExhLeft} unit="°" />
      </div>

      <ChartWrapper title="AVCS Cam Timing — Intake & Exhaust" height={280} tooltipContent={<MetricTooltip content={METRIC_TOOLTIPS.cobbAVCS} />}>
        <TimeSeriesChart
          data={timeSeries}
          traces={[
            { field: "avcsInLeft", name: "Intake (°)", color: CHART_COLORS.primary },
            { field: "avcsExhLeft", name: "Exhaust (°)", color: CHART_COLORS.amber },
          ]}
          yAxisLabel="Degrees"
          height={280}
          startTime={startTime}
        />
      </ChartWrapper>
    </div>
  );
}
