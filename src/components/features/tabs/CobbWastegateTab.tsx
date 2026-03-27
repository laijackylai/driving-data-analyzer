"use client";

import { OBD2DataPoint, CobbWastegateMetrics } from "@/types";
import { ChartWrapper } from "@/components/ui/ChartWrapper";
import { TimeSeriesChart } from "@/components/features/charts/TimeSeriesChart";
import { CHART_COLORS } from "@/lib/chartTheme";
import { CobbStatCard } from "@/components/features/tabs/CobbStatCard";

interface CobbWastegateTabProps {
  timeSeries: OBD2DataPoint[];
  stats: CobbWastegateMetrics;
}

export function CobbWastegateTab({ timeSeries, stats }: CobbWastegateTabProps) {
  const startTime = timeSeries[0]?.timestamp ?? 0;

  return (
    <div className="space-y-4 pt-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <CobbStatCard label="Avg Actual" value={stats.avgWastegateActualMm} unit="mm" />
        <CobbStatCard label="Max Actual" value={stats.maxWastegateActualMm} unit="mm" />
        <CobbStatCard label="Avg Target" value={stats.avgWastegateTargetMm} unit="mm" />
        <CobbStatCard label="Avg Error (actual−target)" value={stats.avgWastegateErrorMm} unit="mm" />
      </div>

      <ChartWrapper title="Wastegate Position — Actual vs Target" height={280}>
        <TimeSeriesChart
          data={timeSeries}
          traces={[
            { field: "wastegateActualPosMm", name: "Actual (mm)", color: CHART_COLORS.primary },
            { field: "wastegateCommFinalPosMm", name: "Target (mm)", color: CHART_COLORS.amber },
          ]}
          yAxisLabel="mm"
          height={280}
          startTime={startTime}
        />
      </ChartWrapper>
    </div>
  );
}
