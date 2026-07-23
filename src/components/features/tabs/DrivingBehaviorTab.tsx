"use client";

import { useMemo } from "react";
import { OBD2DataPoint, TimeSeriesRow } from "@/types";
import { ChartWrapper } from "@/components/ui/ChartWrapper";
import { MetricTooltip } from "@/components/ui/MetricTooltip";
import { TimeSeriesChart } from "@/components/features/charts/TimeSeriesChart";
import { CHART_COLORS, createDrivingEventMarkers } from "@/lib/chartTheme";
import { METRIC_TOOLTIPS } from "@/lib/data/metricTooltips";

interface DrivingBehaviorTabProps {
  timeSeries: OBD2DataPoint[];
}

export function DrivingBehaviorTab({ timeSeries }: DrivingBehaviorTabProps) {
  const startTime = timeSeries[0]?.timestamp ?? 0;

  const eventMarkers = createDrivingEventMarkers(timeSeries);

  const throttleSpeedLagData = useMemo<TimeSeriesRow[]>(() => {
    const WINDOW = 50; // samples
    const result: TimeSeriesRow[] = [];
    const valid = timeSeries.filter(
      (d) => typeof d.throttlePosition === "number" && typeof d.vehicleSpeed === "number"
    );
    if (valid.length < WINDOW * 2) return result;

    for (let i = WINDOW; i < valid.length - WINDOW; i++) {
      // Compute throttle change rate and speed change rate
      const throttleDiffs: number[] = [];
      const speedDiffs: number[] = [];
      for (let j = 0; j < WINDOW - 1; j++) {
        const idx = i - WINDOW / 2 + j;
        const dt = valid[idx + 1].timestamp - valid[idx].timestamp;
        if (dt <= 0) continue;
        throttleDiffs.push((valid[idx + 1].throttlePosition! - valid[idx].throttlePosition!) / dt);
        speedDiffs.push((valid[idx + 1].vehicleSpeed! - valid[idx].vehicleSpeed!) / dt);
      }
      if (throttleDiffs.length < 10) continue;

      // Find lag that maximizes cross-correlation (simple approach)
      let bestLag = 0;
      let bestCorr = -Infinity;
      const maxLagSamples = Math.min(20, Math.floor(throttleDiffs.length / 2));
      for (let lag = 0; lag <= maxLagSamples; lag++) {
        let corr = 0;
        let count = 0;
        for (let k = 0; k < throttleDiffs.length - lag; k++) {
          corr += throttleDiffs[k] * speedDiffs[k + lag];
          count++;
        }
        if (count > 0 && corr / count > bestCorr) {
          bestCorr = corr / count;
          bestLag = lag;
        }
      }

      // Convert lag from samples to milliseconds
      const avgDt = (valid[i + 1]?.timestamp ?? valid[i].timestamp) - (valid[i - 1]?.timestamp ?? valid[i].timestamp);
      const lagMs = bestLag * (avgDt / 2) * 1000;
      result.push({ timestamp: valid[i].timestamp, throttleSpeedLag: lagMs });
    }
    return result;
  }, [timeSeries]);

  return (
    <div className="space-y-4 pt-4">
      {/* Speed + Throttle + Acceleration with driving events */}
      <ChartWrapper
        title="Speed + Throttle + Acceleration"
        height={280}
        tooltipContent={<MetricTooltip content={METRIC_TOOLTIPS.vehicleSpeed} />}
      >
        <TimeSeriesChart
          data={timeSeries}
          traces={[
            { field: "vehicleSpeed", name: "Speed (km/h)", color: CHART_COLORS.primary, fill: true },
            { field: "throttlePosition", name: "Throttle (%)", color: CHART_COLORS.amber, yaxis: "y2" },
            { field: "vehicleAcceleration", name: "Acceleration (g)", color: CHART_COLORS.quaternary, yaxis: "y2" },
          ]}
          eventMarkers={eventMarkers}
          yAxisLabel="km/h"
          y2AxisLabel="% / g"
          height={280}
          startTime={startTime}
        />
      </ChartWrapper>

      {/* Distance + Average Speed */}
      <ChartWrapper title="Distance + Average Speed" height={280}>
        <TimeSeriesChart
          data={timeSeries}
          traces={[
            { field: "distanceTravelled", name: "Distance (km)", color: CHART_COLORS.primary, fill: true },
            { field: "averageSpeed", name: "Avg Speed (km/h)", color: CHART_COLORS.secondary, yaxis: "y2" },
          ]}
          yAxisLabel="km"
          y2AxisLabel="km/h"
          height={280}
          startTime={startTime}
        />
      </ChartWrapper>

      {/* Throttle-Speed Lag */}
      <ChartWrapper
        title="Throttle-Speed Lag"
        height={280}
        tooltipContent={<MetricTooltip content={METRIC_TOOLTIPS.throttleSpeedLag} />}
      >
        <TimeSeriesChart
          data={throttleSpeedLagData}
          traces={[
            { field: "throttleSpeedLag", name: "Lag (ms)", color: CHART_COLORS.primary, fill: true },
          ]}
          yAxisLabel="Lag (ms)"
          height={280}
          startTime={startTime}
        />
      </ChartWrapper>
    </div>
  );
}
