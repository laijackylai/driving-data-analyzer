"use client";

import { OBD2DataPoint, GPSDataPoint } from "@/types";
import { ChartWrapper } from "@/components/ui/ChartWrapper";
import { RouteMap } from "@/components/features/charts/RouteMap";
import { TimeSeriesChart } from "@/components/features/charts/TimeSeriesChart";
import { CHART_COLORS, createDrivingEventMarkers } from "@/lib/chartTheme";

interface OverviewTabProps {
  timeSeries: OBD2DataPoint[];
  gps: GPSDataPoint[];
}

export function OverviewTab({ timeSeries, gps }: OverviewTabProps) {
  const startTime = timeSeries[0]?.timestamp ?? 0;

  const eventMarkers = createDrivingEventMarkers(timeSeries);

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
          eventMarkers={eventMarkers}
          yAxisLabel="km/h"
          height={280}
          startTime={startTime}
        />
      </ChartWrapper>

    </div>
  );
}
