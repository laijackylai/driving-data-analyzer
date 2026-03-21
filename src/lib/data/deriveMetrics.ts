import {
  OBD2DataPoint,
  DerivedMetrics,
  WheelSpeedDiff,
  CVTRatioPoint,
  FuelSpeedBucket,
  EngineZonePoint,
  AWDEngagementEvent,
} from "@/types";

function computeWheelSpeedDiffs(data: OBD2DataPoint[]): WheelSpeedDiff[] {
  return data
    .filter(
      (d) =>
        d.absFrontLeftWheelSpeed !== undefined &&
        d.absFrontRightWheelSpeed !== undefined &&
        d.absRearLeftWheelSpeed !== undefined &&
        d.absRearRightWheelSpeed !== undefined
    )
    .map((d) => {
      const avgFront = ((d.absFrontLeftWheelSpeed ?? 0) + (d.absFrontRightWheelSpeed ?? 0)) / 2;
      const avgRear = ((d.absRearLeftWheelSpeed ?? 0) + (d.absRearRightWheelSpeed ?? 0)) / 2;
      const avgLeft = ((d.absFrontLeftWheelSpeed ?? 0) + (d.absRearLeftWheelSpeed ?? 0)) / 2;
      const avgRight = ((d.absFrontRightWheelSpeed ?? 0) + (d.absRearRightWheelSpeed ?? 0)) / 2;
      return {
        timestamp: d.timestamp,
        frontRearDelta: Math.round((avgFront - avgRear) * 100) / 100,
        leftRightDelta: Math.round((avgLeft - avgRight) * 100) / 100,
      };
    });
}

function computeCVTEffectiveRatio(data: OBD2DataPoint[]): CVTRatioPoint[] {
  return data
    .filter((d) => d.primaryPulleySpeed !== undefined && d.secondaryPulleySpeed !== undefined && d.secondaryPulleySpeed !== 0)
    .map((d) => ({
      timestamp: d.timestamp,
      ratio: Math.round(((d.primaryPulleySpeed ?? 0) / (d.secondaryPulleySpeed ?? 1)) * 1000) / 1000,
    }));
}

function computeFuelBySpeedBucket(data: OBD2DataPoint[]): FuelSpeedBucket[] {
  const buckets: Record<string, { sum: number; count: number }> = {
    "0-30": { sum: 0, count: 0 },
    "30-60": { sum: 0, count: 0 },
    "60-90": { sum: 0, count: 0 },
    "90+": { sum: 0, count: 0 },
  };

  for (const d of data) {
    if (d.instantFuelRate === undefined || d.vehicleSpeed === undefined) continue;
    const speed = d.vehicleSpeed;
    const bucket = speed < 30 ? "0-30" : speed < 60 ? "30-60" : speed < 90 ? "60-90" : "90+";
    buckets[bucket].sum += d.instantFuelRate;
    buckets[bucket].count += 1;
  }

  return Object.entries(buckets).map(([bucket, { sum, count }]) => ({
    bucket,
    avgConsumption: count > 0 ? Math.round((sum / count) * 100) / 100 : 0,
    sampleCount: count,
  }));
}

function computeEngineZones(data: OBD2DataPoint[]): EngineZonePoint[] {
  return data
    .filter((d) => d.engineRpm !== undefined)
    .map((d) => {
      const rpm = d.engineRpm ?? 0;
      const load = d.engineLoad ?? 0;
      let zone: "eco" | "normal" | "sport";
      if (rpm < 2000 && load < 30) {
        zone = "eco";
      } else if (rpm > 4000 || load > 70) {
        zone = "sport";
      } else {
        zone = "normal";
      }
      return { timestamp: d.timestamp, zone };
    });
}

function computeAWDEngagementEvents(data: OBD2DataPoint[]): AWDEngagementEvent[] {
  const THRESHOLD = 150; // mA
  const GAP_SECONDS = 3;

  const events: AWDEngagementEvent[] = [];
  let eventStart: number | null = null;
  let peakCurrent = 0;
  let lastAboveTimestamp = 0;

  for (const d of data) {
    if (d.awdSolenoidActualCurrent === undefined) continue;
    const current = d.awdSolenoidActualCurrent;

    if (current > THRESHOLD) {
      if (eventStart === null) {
        eventStart = d.timestamp;
        peakCurrent = current;
      } else if (d.timestamp - lastAboveTimestamp > GAP_SECONDS) {
        // Gap too large — close previous event, start new one
        events.push({
          timestamp: eventStart,
          current: peakCurrent,
          duration: Math.round((lastAboveTimestamp - eventStart) * 100) / 100,
        });
        eventStart = d.timestamp;
        peakCurrent = current;
      }
      peakCurrent = Math.max(peakCurrent, current);
      lastAboveTimestamp = d.timestamp;
    }
  }

  // Close final event
  if (eventStart !== null) {
    events.push({
      timestamp: eventStart,
      current: peakCurrent,
      duration: Math.round((lastAboveTimestamp - eventStart) * 100) / 100,
    });
  }

  return events;
}

function computeFuelDistanceSeries(data: OBD2DataPoint[]): { distance: number; fuel: number }[] {
  const series: { distance: number; fuel: number }[] = [];
  for (const d of data) {
    if (d.fuelUsedTotal !== undefined && d.distanceTravelled !== undefined) {
      series.push({
        distance: Math.round(d.distanceTravelled * 1000) / 1000,
        fuel: Math.round(d.fuelUsedTotal * 1000) / 1000,
      });
    }
  }
  return series;
}

/**
 * Compute all derived metrics from pivoted time-series data.
 */
export function computeDerivedMetrics(data: OBD2DataPoint[]): DerivedMetrics {
  return {
    wheelSpeedDiffs: computeWheelSpeedDiffs(data),
    cvtEffectiveRatio: computeCVTEffectiveRatio(data),
    fuelBySpeedBucket: computeFuelBySpeedBucket(data),
    engineZones: computeEngineZones(data),
    awdEngagementEvents: computeAWDEngagementEvents(data),
    fuelDistanceSeries: computeFuelDistanceSeries(data),
  };
}
