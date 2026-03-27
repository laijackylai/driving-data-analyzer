"use client";

import { OBD2DataPoint, CobbAFRMetrics } from "@/types";
import { ChartWrapper } from "@/components/ui/ChartWrapper";
import { TimeSeriesChart } from "@/components/features/charts/TimeSeriesChart";
import { ScatterChart } from "@/components/features/charts/ScatterChart";
import { CHART_COLORS } from "@/lib/chartTheme";
import { CobbStatCard } from "@/components/features/tabs/CobbStatCard";

interface CobbAFRTabProps {
  timeSeries: OBD2DataPoint[];
  stats: CobbAFRMetrics;
}

export function CobbAFRTab({ timeSeries, stats }: CobbAFRTabProps) {
  const startTime = timeSeries[0]?.timestamp ?? 0;

  return (
    <div className="space-y-4 pt-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <CobbStatCard label="Avg AFR" value={stats.avgAFR} />
        <CobbStatCard label="Avg Target AFR" value={stats.avgAFRTarget} />
        <CobbStatCard label="Avg Deviation" value={stats.avgAFRDeviation} />
        <CobbStatCard label="Max Deviation" value={stats.maxAFRDeviation} />
        <CobbStatCard label="Avg AF Correction 1" value={stats.avgAFCorrection1} unit="%" />
        <CobbStatCard label="Avg AF Learning 1" value={stats.avgAFLearning1} unit="%" />
      </div>

      <ChartWrapper title="AFR — Actual vs Target" height={280}>
        <TimeSeriesChart
          data={timeSeries}
          traces={[
            { field: "afSens1Ratio", name: "AFR (actual)", color: CHART_COLORS.primary },
            { field: "clFuelTarget", name: "AFR (target)", color: CHART_COLORS.amber },
          ]}
          yAxisLabel="AFR"
          height={280}
          startTime={startTime}
        />
      </ChartWrapper>

      <ChartWrapper title="AF Correction & Learning" height={240}>
        <TimeSeriesChart
          data={timeSeries}
          traces={[
            { field: "afCorrection1", name: "AF Correction 1 (%)", color: CHART_COLORS.secondary },
            { field: "afLearning1", name: "AF Learning 1 (%)", color: CHART_COLORS.quaternary },
          ]}
          yAxisLabel="%"
          height={240}
          startTime={startTime}
        />
      </ChartWrapper>

      <ChartWrapper title="AFR vs RPM" height={280}>
        <ScatterChart
          data={timeSeries}
          xField="engineRpm"
          yField="afSens1Ratio"
          colorField="throttlePosition"
          xLabel="RPM"
          yLabel="AFR"
          height={280}
        />
      </ChartWrapper>
    </div>
  );
}
