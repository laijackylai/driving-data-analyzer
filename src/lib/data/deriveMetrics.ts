import {
  OBD2DataPoint,
  DerivedMetrics,
  WheelSpeedDiff,
  CVTRatioPoint,
  FuelSpeedBucket,
  EngineZonePoint,
  AWDEngagementEvent,
  ThermalDeltaPoint,
  TorqueSplitPoint,
  RatioErrorPoint,
  TorqueConverterSlipPoint,
  TimeSeriesRow,
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

function computeThermalDelta(data: OBD2DataPoint[]): ThermalDeltaPoint[] {
  const result: ThermalDeltaPoint[] = [];
  for (const d of data) {
    if (typeof d.oilTemp === "number" && typeof d.coolantTemp === "number") {
      result.push({
        timestamp: d.timestamp,
        delta: d.oilTemp - d.coolantTemp,
        engineLoad: d.engineLoad,
      });
    }
  }
  return result;
}

/**
 * Sigmoidal AWD torque split estimation.
 * Maps solenoid current (mA) → rear torque %.
 */
function computeTorqueSplit(data: OBD2DataPoint[]): TorqueSplitPoint[] {
  const MAX_CURRENT = 1080;
  const result: TorqueSplitPoint[] = [];
  for (const d of data) {
    const current = d.awdSolenoidActualCurrent;
    if (typeof current !== "number") continue;
    const normalized = Math.max(0, Math.min(current / MAX_CURRENT, 1));
    const k = 6;
    const x0 = 0.35;
    const rearPct = 50 / (1 + Math.exp(-k * (normalized - x0)));
    const frontPct = 100 - rearPct;
    result.push({ timestamp: d.timestamp, frontPct, rearPct });
  }
  return result;
}

function computeRatioError(data: OBD2DataPoint[]): RatioErrorPoint[] {
  const result: RatioErrorPoint[] = [];
  for (const d of data) {
    if (typeof d.actualGearRatio === "number" && typeof d.targetGearRatio === "number") {
      result.push({
        timestamp: d.timestamp,
        error: d.actualGearRatio - d.targetGearRatio,
        throttle: d.throttlePosition,
      });
    }
  }
  return result;
}

function computeTorqueConverterSlip(data: OBD2DataPoint[]): TorqueConverterSlipPoint[] {
  const result: TorqueConverterSlipPoint[] = [];
  for (const d of data) {
    if (typeof d.turbineSpeed === "number" && typeof d.engineRpm === "number" && d.engineRpm > 0) {
      result.push({
        timestamp: d.timestamp,
        slipPct: (1 - d.turbineSpeed / d.engineRpm) * 100,
        lockUpDuty: d.lockUpDutyRatio,
      });
    }
  }
  return result;
}

export function computeVolumetricEfficiency(data: OBD2DataPoint[]): OBD2DataPoint[] {
  const DISPLACEMENT_M3 = 0.002498;
  const AIR_DENSITY = 1.225;
  return data
    .filter(
      (d) =>
        typeof d.mafAirFlowRate === "number" &&
        typeof d.engineRpm === "number" &&
        d.engineRpm! > 500
    )
    .map((d) => {
      const theoreticalMaf =
        ((DISPLACEMENT_M3 * d.engineRpm! * AIR_DENSITY) / (2 * 60)) * 1000;
      return {
        ...d,
        volumetricEfficiency: (d.mafAirFlowRate! / theoreticalMaf) * 100,
      } as OBD2DataPoint;
    });
}

export function computeSTFTStability(data: OBD2DataPoint[]): TimeSeriesRow[] {
  const WINDOW_S = 30;
  const result: TimeSeriesRow[] = [];
  const stftPts = data.filter((d) => typeof d.shortTermFuelTrim === "number");
  for (let i = 0; i < stftPts.length; i++) {
    const t = stftPts[i].timestamp;
    const windowPts: number[] = [];
    for (let j = i; j >= 0 && stftPts[j].timestamp >= t - WINDOW_S; j--) {
      windowPts.push(stftPts[j].shortTermFuelTrim!);
    }
    if (windowPts.length < 3) continue;
    const mean = windowPts.reduce((a, b) => a + b, 0) / windowPts.length;
    const variance =
      windowPts.reduce((a, b) => a + (b - mean) ** 2, 0) / windowPts.length;
    result.push({ timestamp: t, stftStdDev: Math.sqrt(variance) });
  }
  return result;
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
    thermalDelta: computeThermalDelta(data),
    torqueSplit: computeTorqueSplit(data),
    ratioError: computeRatioError(data),
    torqueConverterSlip: computeTorqueConverterSlip(data),
    volumetricEfficiency: computeVolumetricEfficiency(data),
    stftStability: computeSTFTStability(data),
  };
}
