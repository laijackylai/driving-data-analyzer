"use client";

import { OBD2DataPoint, CobbKnockMetrics } from "@/types";
import { ChartWrapper } from "@/components/ui/ChartWrapper";
import { TimeSeriesChart } from "@/components/features/charts/TimeSeriesChart";
import { CHART_COLORS } from "@/lib/chartTheme";
import { CobbStatCard } from "@/components/features/tabs/CobbStatCard";
import { MetricTooltip } from "@/components/ui/MetricTooltip";
import { METRIC_TOOLTIPS } from "@/lib/data/metricTooltips";

interface CobbKnockTabProps {
  timeSeries: OBD2DataPoint[];
  stats: CobbKnockMetrics;
}

export function CobbKnockTab({ timeSeries, stats }: CobbKnockTabProps) {
  const startTime = timeSeries[0]?.timestamp ?? 0;

  return (
    <div className="space-y-4 pt-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <CobbStatCard label="Knock Events" value={stats.knockEventCount} />
        <CobbStatCard label="Min Feedback Knock" value={stats.minFeedbackKnock} unit="°" />
        <CobbStatCard label="Avg Feedback Knock" value={stats.avgFeedbackKnock} unit="°" />
        <CobbStatCard label="Min Fine Knock Learn" value={stats.minFineKnockLearn} unit="°" />
        <CobbStatCard label="Min DAM" value={stats.minDAM} />
        <CobbStatCard label="Avg DAM" value={stats.avgDAM} />
      </div>

      <ChartWrapper title="Feedback Knock Over Time" height={260} tooltipContent={<MetricTooltip content={METRIC_TOOLTIPS.cobbFeedbackKnock} />}>
        <TimeSeriesChart
          data={timeSeries}
          traces={[
            { field: "feedbackKnock", name: "Feedback Knock (°)", color: CHART_COLORS.subaruRed },
          ]}
          yAxisLabel="Degrees"
          height={260}
          startTime={startTime}
        />
      </ChartWrapper>

      <ChartWrapper title="Fine Knock Learn Over Time" height={240} tooltipContent={<MetricTooltip content={METRIC_TOOLTIPS.cobbFineKnockLearn} />}>
        <TimeSeriesChart
          data={timeSeries}
          traces={[
            { field: "fineKnockLearn", name: "Fine Knock Learn (°)", color: CHART_COLORS.amber },
          ]}
          yAxisLabel="Degrees"
          height={240}
          startTime={startTime}
        />
      </ChartWrapper>

      <ChartWrapper title="Dynamic Advance Multiplier (DAM)" height={240} tooltipContent={<MetricTooltip content={METRIC_TOOLTIPS.cobbDAM} />}>
        <TimeSeriesChart
          data={timeSeries}
          traces={[
            { field: "dam", name: "DAM", color: CHART_COLORS.quaternary },
          ]}
          yAxisLabel="DAM (0–1)"
          height={240}
          startTime={startTime}
        />
      </ChartWrapper>
    </div>
  );
}
