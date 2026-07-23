"use client";

import { useMemo } from "react";
import { OBD2DataPoint, DerivedMetrics, ThresholdConfig } from "@/types";
import { ChartWrapper } from "@/components/ui/ChartWrapper";
import { MetricTooltip } from "@/components/ui/MetricTooltip";
import { TimeSeriesChart, TimeSeriesRow } from "@/components/features/charts/TimeSeriesChart";
import { ScatterChart } from "@/components/features/charts/ScatterChart";
import { CHART_COLORS } from "@/lib/chartTheme";
import { METRIC_TOOLTIPS } from "@/lib/data/metricTooltips";

interface TransmissionTabProps {
  timeSeries: OBD2DataPoint[];
  derived: DerivedMetrics;
  thresholds: ThresholdConfig;
}

export function TransmissionTab({ timeSeries, derived, thresholds }: TransmissionTabProps) {
  const startTime = timeSeries[0]?.timestamp ?? 0;

  const ratioErrorData: TimeSeriesRow[] = derived.ratioError.map((p) => ({
    timestamp: p.timestamp,
    ratioError: p.error,
    throttlePosition: p.throttle,
  }));

  const tcSlipData = useMemo<OBD2DataPoint[]>(() => {
    return derived.torqueConverterSlip.map((p) => {
      const matchingPoint = timeSeries.find((d) => d.timestamp === p.timestamp);
      return {
        timestamp: p.timestamp,
        engineRpm: matchingPoint?.engineRpm,
        tcSlipPct: p.slipPct,
        lockUpDutyRatio: p.lockUpDuty,
      } as OBD2DataPoint;
    });
  }, [derived.torqueConverterSlip, timeSeries]);

  return (
    <div className="space-y-4 pt-4">
      {/* Actual vs Target Gear Ratio + CVT Temp */}
      <ChartWrapper
        title="Actual vs Target Gear Ratio + CVT Temp"
        height={280}
        tooltipContent={<MetricTooltip content={METRIC_TOOLTIPS.actualGearRatio} />}
      >
        <TimeSeriesChart
          data={timeSeries}
          traces={[
            { field: "actualGearRatio", name: "Actual", color: CHART_COLORS.primary },
            { field: "targetGearRatio", name: "Target", color: CHART_COLORS.subaruRed },
            { field: "cvtTemp", name: "CVT Temp (°C)", color: CHART_COLORS.amber, yaxis: "y2" },
          ]}
          thresholdKey="cvtTemp"
          thresholds={thresholds}
          yAxisLabel="Ratio"
          y2AxisLabel="°C"
          height={280}
          startTime={startTime}
        />
      </ChartWrapper>

      {/* Pulley Speeds + Lock-Up Duty */}
      <ChartWrapper
        title="Pulley Speeds + Lock-Up Duty"
        height={280}
        tooltipContent={<MetricTooltip content={METRIC_TOOLTIPS.primaryPulleySpeed} />}
      >
        <TimeSeriesChart
          data={timeSeries}
          traces={[
            { field: "primaryPulleySpeed", name: "Primary (rpm)", color: CHART_COLORS.primary },
            { field: "secondaryPulleySpeed", name: "Secondary (rpm)", color: CHART_COLORS.secondary },
            { field: "lockUpDutyRatio", name: "Lock-up (%)", color: CHART_COLORS.emerald, yaxis: "y2" },
          ]}
          yAxisLabel="rpm"
          y2AxisLabel="%"
          height={280}
          startTime={startTime}
        />
      </ChartWrapper>

      {/* Ratio Error Timeline */}
      <ChartWrapper
        title="Ratio Error Timeline"
        height={280}
        tooltipContent={<MetricTooltip content={METRIC_TOOLTIPS.ratioError} />}
      >
        <TimeSeriesChart
          data={ratioErrorData}
          traces={[
            { field: "ratioError", name: "Ratio Error", color: CHART_COLORS.primary },
            { field: "throttlePosition", name: "Throttle (%)", color: CHART_COLORS.amber, yaxis: "y2" },
          ]}
          yAxisLabel="Error"
          y2AxisLabel="%"
          height={280}
          startTime={startTime}
        />
      </ChartWrapper>

      {/* TC Slip vs RPM */}
      <ChartWrapper
        title="TC Slip vs RPM"
        height={280}
        tooltipContent={<MetricTooltip content={METRIC_TOOLTIPS.torqueConverterSlip} />}
      >
        <ScatterChart
          data={tcSlipData}
          xField="engineRpm"
          yField="tcSlipPct"
          colorField="lockUpDutyRatio"
          xLabel="Engine RPM"
          yLabel="TC Slip (%)"
          height={280}
        />
      </ChartWrapper>
    </div>
  );
}
