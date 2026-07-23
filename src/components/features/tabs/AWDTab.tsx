"use client";

import { useMemo } from "react";
import { OBD2DataPoint, DerivedMetrics } from "@/types";
import { ChartWrapper } from "@/components/ui/ChartWrapper";
import { MetricTooltip } from "@/components/ui/MetricTooltip";
import { TimeSeriesChart } from "@/components/features/charts/TimeSeriesChart";
import { StackedAreaChart } from "@/components/features/charts/StackedAreaChart";
import { ScatterChart } from "@/components/features/charts/ScatterChart";
import { CHART_COLORS } from "@/lib/chartTheme";
import { METRIC_TOOLTIPS } from "@/lib/data/metricTooltips";

interface AWDTabProps {
  timeSeries: OBD2DataPoint[];
  derived: DerivedMetrics;
}

export function AWDTab({ timeSeries, derived }: AWDTabProps) {
  const startTime = timeSeries[0]?.timestamp ?? 0;

  // Torque split data for stacked area chart
  const torqueSplitData = useMemo(() => {
    return derived.torqueSplit.map((p) => ({
      timestamp: p.timestamp,
      frontPct: p.frontPct,
      rearPct: p.rearPct,
    }));
  }, [derived.torqueSplit]);

  // Join torque split with timeSeries for rear torque vs throttle scatter
  const awdThrottleData = useMemo<OBD2DataPoint[]>(() => {
    const tsMap = new Map(timeSeries.map((d) => [d.timestamp, d]));
    return derived.torqueSplit
      .map((p) => {
        const ts = tsMap.get(p.timestamp);
        if (!ts || typeof ts.throttlePosition !== "number") return null;
        return {
          timestamp: p.timestamp,
          throttlePosition: ts.throttlePosition,
          rearTorquePct: p.rearPct,
          vehicleSpeed: ts.vehicleSpeed,
        } as OBD2DataPoint;
      })
      .filter((d): d is OBD2DataPoint => d !== null);
  }, [derived.torqueSplit, timeSeries]);

  // Join torque split with timeSeries for rear torque vs CVT temp scatter
  const awdCvtTempData = useMemo<OBD2DataPoint[]>(() => {
    const tsMap = new Map(timeSeries.map((d) => [d.timestamp, d]));
    return derived.torqueSplit
      .map((p) => {
        const ts = tsMap.get(p.timestamp);
        if (!ts || typeof ts.cvtTemp !== "number") return null;
        return {
          timestamp: p.timestamp,
          cvtTemp: ts.cvtTemp,
          rearTorquePct: p.rearPct,
          throttlePosition: ts.throttlePosition,
        } as OBD2DataPoint;
      })
      .filter((d): d is OBD2DataPoint => d !== null);
  }, [derived.torqueSplit, timeSeries]);

  return (
    <div className="space-y-4 pt-4">
      {/* AWD Solenoid Current + Throttle */}
      <ChartWrapper
        title="AWD Solenoid Current + Throttle"
        height={280}
        tooltipContent={<MetricTooltip content={METRIC_TOOLTIPS.awdSolenoidActualCurrent} />}
      >
        <TimeSeriesChart
          data={timeSeries}
          traces={[
            { field: "awdSolenoidActualCurrent", name: "Actual (mA)", color: CHART_COLORS.primary },
            { field: "awdSolenoidSetCurrent", name: "Set (mA)", color: CHART_COLORS.subaruRed },
            { field: "throttlePosition", name: "Throttle (%)", color: CHART_COLORS.amber, yaxis: "y2" },
          ]}
          yAxisLabel="mA"
          y2AxisLabel="Throttle (%)"
          height={280}
          startTime={startTime}
        />
      </ChartWrapper>

      {/* Estimated Torque Split */}
      <ChartWrapper
        title="Estimated Torque Split"
        height={280}
        tooltipContent={<MetricTooltip content={METRIC_TOOLTIPS.torqueSplit} />}
      >
        <StackedAreaChart
          data={torqueSplitData}
          traces={[
            { field: "rearPct", name: "Rear %", color: CHART_COLORS.subaruRed, fillcolor: "rgba(224, 32, 44, 0.3)" },
            { field: "frontPct", name: "Front %", color: CHART_COLORS.primary, fillcolor: "rgba(54, 112, 198, 0.3)" },
          ]}
          yAxisLabel="Torque Split (%)"
          height={280}
          startTime={startTime}
        />
      </ChartWrapper>

      {/* Rear Torque % vs Throttle */}
      <ChartWrapper
        title="Rear Torque % vs Throttle"
        height={280}
        tooltipContent={<MetricTooltip content={METRIC_TOOLTIPS.awdVsThrottle} />}
      >
        <ScatterChart
          data={awdThrottleData}
          xField="throttlePosition"
          yField="rearTorquePct"
          colorField="vehicleSpeed"
          xLabel="Throttle (%)"
          yLabel="Rear Torque (%)"
          height={280}
        />
      </ChartWrapper>

      {/* AWD vs CVT Temp */}
      <ChartWrapper
        title="AWD vs CVT Temp"
        height={280}
        tooltipContent={<MetricTooltip content={METRIC_TOOLTIPS.awdVsCvtTemp} />}
      >
        <ScatterChart
          data={awdCvtTempData}
          xField="cvtTemp"
          yField="rearTorquePct"
          colorField="throttlePosition"
          xLabel="CVT Temp (°C)"
          yLabel="Rear Torque (%)"
          height={280}
        />
      </ChartWrapper>
    </div>
  );
}
