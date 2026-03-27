"use client";

import { OBD2DataPoint, CobbInjectorMetrics } from "@/types";
import { ChartWrapper } from "@/components/ui/ChartWrapper";
import { TimeSeriesChart } from "@/components/features/charts/TimeSeriesChart";
import { ScatterChart } from "@/components/features/charts/ScatterChart";
import { CHART_COLORS } from "@/lib/chartTheme";
import { CobbStatCard } from "@/components/features/tabs/CobbStatCard";

interface CobbInjectorTabProps {
  timeSeries: OBD2DataPoint[];
  stats: CobbInjectorMetrics;
}

export function CobbInjectorTab({ timeSeries, stats }: CobbInjectorTabProps) {
  const startTime = timeSeries[0]?.timestamp ?? 0;

  return (
    <div className="space-y-4 pt-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <CobbStatCard label="Avg Duty Cycle" value={stats.avgInjDutyCycle} unit="%" />
        <CobbStatCard label="Max Duty Cycle" value={stats.maxInjDutyCycle} unit="%" />
        <CobbStatCard label="Avg Pulse Width" value={stats.avgInjPulseWidthMs} unit="ms" />
        <CobbStatCard label="Max Pulse Width" value={stats.maxInjPulseWidthMs} unit="ms" />
        <CobbStatCard label="Fuel Cut Events" value={stats.fuelCutEventCount} />
      </div>

      <ChartWrapper title="Injector Duty Cycle Over Time" height={260}>
        <TimeSeriesChart
          data={timeSeries}
          traces={[
            { field: "injDutyCycle", name: "Duty Cycle (%)", color: CHART_COLORS.primary },
          ]}
          yAxisLabel="%"
          height={260}
          startTime={startTime}
        />
      </ChartWrapper>

      <ChartWrapper title="Injector Pulse Width Over Time" height={240}>
        <TimeSeriesChart
          data={timeSeries}
          traces={[
            { field: "injPulseWidth", name: "Pulse Width (ms)", color: CHART_COLORS.secondary },
          ]}
          yAxisLabel="ms"
          height={240}
          startTime={startTime}
        />
      </ChartWrapper>

      <ChartWrapper title="Injector Duty Cycle vs RPM" height={280}>
        <ScatterChart
          data={timeSeries}
          xField="engineRpm"
          yField="injDutyCycle"
          colorField="throttlePosition"
          xLabel="RPM"
          yLabel="Duty Cycle (%)"
          height={280}
        />
      </ChartWrapper>
    </div>
  );
}
