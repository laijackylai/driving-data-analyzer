"use client";

import { OBD2DataPoint, GPSDataPoint, DerivedMetrics, ThresholdConfig, OBD2AnalysisResult } from "@/types";
import { ChartWrapper } from "@/components/ui/ChartWrapper";
import { RouteMap } from "@/components/features/charts/RouteMap";
import { TimeSeriesChart } from "@/components/features/charts/TimeSeriesChart";
import { CHART_COLORS } from "@/lib/chartTheme";

interface OverviewTabProps {
  timeSeries: OBD2DataPoint[];
  gps: GPSDataPoint[];
  derived: DerivedMetrics;
  thresholds: ThresholdConfig;
  result: OBD2AnalysisResult;
}

export function OverviewTab({ timeSeries, gps, result }: OverviewTabProps) {
  const startTime = timeSeries[0]?.timestamp ?? 0;

  const harshBrakingMarkers = timeSeries
    .filter((d) => d.vehicleAcceleration !== undefined && d.vehicleAcceleration < -0.4)
    .map((d) => ({ timestamp: d.timestamp, color: CHART_COLORS.subaruRed, label: "Harsh braking" }));

  const rapidAccelMarkers = timeSeries
    .filter((d) => d.vehicleAcceleration !== undefined && d.vehicleAcceleration > 0.3)
    .map((d) => ({ timestamp: d.timestamp, color: CHART_COLORS.amber, label: "Rapid acceleration" }));

  return (
    <div className="space-y-4 pt-4">
      {/* Route Map */}
      <ChartWrapper title="GPS Route" height={350}>
        <RouteMap gps={gps} height={350} />
      </ChartWrapper>

      {/* Speed Profile */}
      <ChartWrapper title="Speed Profile" height={280}>
        <TimeSeriesChart
          data={timeSeries}
          traces={[
            { field: "vehicleSpeed", name: "Speed (km/h)", color: CHART_COLORS.primary },
          ]}
          eventMarkers={[...harshBrakingMarkers, ...rapidAccelMarkers]}
          yAxisLabel="km/h"
          height={280}
          startTime={startTime}
        />
      </ChartWrapper>

      {/* Trip summary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Harsh Braking", value: result.motion.harshBrakingEvents, color: "text-subaru-red" },
          { label: "Rapid Accel.", value: result.motion.rapidAccelerationEvents, color: "text-accent-amber-400" },
          { label: "Avg Speed", value: result.motion.avgSpeed !== null ? `${result.motion.avgSpeed.toFixed(0)} km/h` : "—", color: "text-sapphire-200" },
          { label: "Max Speed", value: result.motion.maxSpeed !== null ? `${result.motion.maxSpeed.toFixed(0)} km/h` : "—", color: "text-sapphire-200" },
        ].map((stat) => (
          <div key={stat.label} className="rounded-xl border border-glass-edge bg-pearl-gradient p-3 text-center">
            <div className={`text-lg font-semibold font-mono ${stat.color}`}>{stat.value}</div>
            <div className="text-xs text-sapphire-500 mt-0.5">{stat.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
