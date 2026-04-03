"use client";

import { useMemo } from "react";
import { OBD2DataPoint, CobbKnockMetrics, EventMarker } from "@/types";
import { ChartWrapper } from "@/components/ui/ChartWrapper";
import { TimeSeriesChart } from "@/components/features/charts/TimeSeriesChart";
import { ScatterChart } from "@/components/features/charts/ScatterChart";
import { HeatmapChart } from "@/components/features/charts/HeatmapChart";
import { CHART_COLORS } from "@/lib/chartTheme";
import { CobbStatCard } from "@/components/features/tabs/CobbStatCard";
import { MetricTooltip } from "@/components/ui/MetricTooltip";
import { METRIC_TOOLTIPS } from "@/lib/data/metricTooltips";

interface CobbKnockTabProps {
  timeSeries: OBD2DataPoint[];
  stats: CobbKnockMetrics;
}

interface DamEvent {
  startTime: number;
  endTime: number;
  minDam: number;
  recoverySeconds: number;
}

export function CobbKnockTab({ timeSeries, stats }: CobbKnockTabProps) {
  const startTime = timeSeries[0]?.timestamp ?? 0;

  const { damEvents, damEventMarkers } = useMemo(() => {
    const events: DamEvent[] = [];
    let inDrop = false;
    let dropStart = 0;
    let minDam = 1;
    for (const d of timeSeries) {
      if (typeof d.dam !== "number") continue;
      if (!inDrop && d.dam < 0.99) {
        inDrop = true;
        dropStart = d.timestamp;
        minDam = d.dam;
      } else if (inDrop) {
        minDam = Math.min(minDam, d.dam);
        if (d.dam >= 0.99) {
          events.push({
            startTime: dropStart,
            endTime: d.timestamp,
            minDam,
            recoverySeconds: d.timestamp - dropStart,
          });
          inDrop = false;
        }
      }
    }
    const markers: EventMarker[] = events.map((e) => ({
      timestamp: e.startTime,
      label: `DAM ${e.minDam.toFixed(2)} → recovery ${e.recoverySeconds.toFixed(0)}s`,
      color: e.recoverySeconds > 120 ? CHART_COLORS.subaruRed : CHART_COLORS.amber,
    }));
    return { damEvents: events, damEventMarkers: markers };
  }, [timeSeries]);

  const heatmapData = useMemo(
    () =>
      timeSeries
        .filter(
          (d) =>
            typeof d.engineRpm === "number" &&
            typeof d.calculatedLoadGRev === "number" &&
            typeof d.fineKnockLearn === "number",
        )
        .map((d) => ({
          x: d.engineRpm!,
          y: d.calculatedLoadGRev!,
          value: d.fineKnockLearn!,
        })),
    [timeSeries],
  );

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

      {/* Chart 1: Timing Advance + Feedback Knock + Fine Knock Learn */}
      <ChartWrapper title="Timing Advance & Knock" height={280} tooltipContent={<MetricTooltip content={METRIC_TOOLTIPS.cobbFeedbackKnock} />}>
        <TimeSeriesChart
          data={timeSeries}
          traces={[
            { field: "timingAdvance", name: "Timing Advance (°)", color: CHART_COLORS.primary },
            { field: "feedbackKnock", name: "Feedback Knock (°)", color: CHART_COLORS.subaruRed, yaxis: "y2" },
            { field: "fineKnockLearn", name: "Fine Knock Learn (°)", color: CHART_COLORS.amber, yaxis: "y2" },
          ]}
          yAxisLabel="Timing (°)"
          y2AxisLabel="Knock (°)"
          height={280}
          startTime={startTime}
        />
      </ChartWrapper>

      {/* Chart 2: DAM + Boost */}
      <ChartWrapper title="DAM & Boost Pressure" height={280} tooltipContent={<MetricTooltip content={METRIC_TOOLTIPS.cobbDAM} />}>
        <TimeSeriesChart
          data={timeSeries}
          traces={[
            { field: "dam", name: "DAM", color: CHART_COLORS.quaternary },
            { field: "boostPsi", name: "Boost (psi)", color: CHART_COLORS.secondary, yaxis: "y2" },
          ]}
          yAxisLabel="DAM (0–1)"
          y2AxisLabel="Boost (psi)"
          height={280}
          startTime={startTime}
        />
      </ChartWrapper>

      {/* Chart 3: Feedback Knock vs RPM scatter */}
      <ChartWrapper title="Feedback Knock vs RPM" height={280} tooltipContent={<MetricTooltip content={METRIC_TOOLTIPS.cobbKnockVsRpm} />}>
        <ScatterChart
          data={timeSeries}
          xField="engineRpm"
          yField="feedbackKnock"
          colorField="boostPsi"
          xLabel="RPM"
          yLabel="Feedback Knock (°)"
          height={280}
        />
      </ChartWrapper>

      {/* Chart 4: DAM Recovery Timeline */}
      <ChartWrapper title="DAM Recovery Events" height={280} tooltipContent={<MetricTooltip content={METRIC_TOOLTIPS.cobbDamRecovery} />}>
        <TimeSeriesChart
          data={timeSeries}
          traces={[
            { field: "dam", name: "DAM", color: CHART_COLORS.quaternary },
          ]}
          eventMarkers={damEventMarkers}
          yAxisLabel="DAM (0–1)"
          height={280}
          startTime={startTime}
        />
      </ChartWrapper>

      {/* Chart 5: Fine Knock Learn Heatmap */}
      <ChartWrapper title="Fine Knock Learn — RPM × Load" height={300} tooltipContent={<MetricTooltip content={METRIC_TOOLTIPS.cobbFineKnockHeatmap} />}>
        <HeatmapChart
          data={heatmapData}
          xLabel="RPM"
          yLabel="Load (g/rev)"
          valueLabel="Fine Knock Learn (°)"
          height={300}
        />
      </ChartWrapper>
    </div>
  );
}
