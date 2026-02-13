import {
  OBD2DataPoint,
  OBD2AnalysisResult,
  EngineMetrics,
  AirIntakeMetrics,
  FuelMetrics,
  PowerMetrics,
  MotionMetrics,
  TransmissionMetrics,
  ABSMetrics,
  AWDMetrics,
  ElectricalMetrics,
} from "@/types";

// ── Utility helpers ──

/**
 * Extract non-undefined values from a specific field across all data points.
 */
function extractValues(
  points: OBD2DataPoint[],
  field: keyof OBD2DataPoint
): number[] {
  const values: number[] = [];
  for (const p of points) {
    const v = p[field];
    if (typeof v === "number") {
      values.push(v);
    }
  }
  return values;
}

function avg(values: number[]): number | null {
  if (values.length === 0) return null;
  return Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 100) / 100;
}

function max(values: number[]): number | null {
  if (values.length === 0) return null;
  return Math.round(Math.max(...values) * 100) / 100;
}

function min(values: number[]): number | null {
  if (values.length === 0) return null;
  return Math.round(Math.min(...values) * 100) / 100;
}

function last(values: number[]): number | null {
  if (values.length === 0) return null;
  return Math.round(values[values.length - 1] * 100) / 100;
}

// ── Category analyzers ──

export function analyzeEngine(points: OBD2DataPoint[]): EngineMetrics {
  const rpm = extractValues(points, "engineRpm");
  const load = extractValues(points, "engineLoad");
  const coolant = extractValues(points, "coolantTemp");
  const oil = extractValues(points, "oilTemp");
  const timing = extractValues(points, "timingAdvance");
  const knock = extractValues(points, "knockCorrection");

  return {
    avgRpm: avg(rpm),
    maxRpm: max(rpm),
    avgLoad: avg(load),
    maxLoad: max(load),
    avgCoolantTemp: avg(coolant),
    maxCoolantTemp: max(coolant),
    avgOilTemp: avg(oil),
    maxOilTemp: max(oil),
    avgTimingAdvance: avg(timing),
    avgKnockCorrection: avg(knock),
  };
}

export function analyzeAirIntake(points: OBD2DataPoint[]): AirIntakeMetrics {
  const maf = extractValues(points, "mafAirFlowRate");
  const boost = extractValues(points, "calculatedBoost");
  const intakeTemp = extractValues(points, "intakeAirTemp");
  const throttle = extractValues(points, "throttlePosition");
  const manifold = extractValues(points, "intakeManifoldPressure");

  return {
    avgMafAirFlow: avg(maf),
    maxMafAirFlow: max(maf),
    avgBoost: avg(boost),
    maxBoost: max(boost),
    avgIntakeTemp: avg(intakeTemp),
    avgThrottlePosition: avg(throttle),
    maxThrottlePosition: max(throttle),
    avgManifoldPressure: avg(manifold),
  };
}

export function analyzeFuel(points: OBD2DataPoint[]): FuelMetrics {
  const fuelConsumption = extractValues(points, "avgFuelConsumption");
  const fuelConsumptionTotal = extractValues(points, "avgFuelConsumptionTotal");
  const instantRate = extractValues(points, "instantFuelRate");
  const fuelUsed = extractValues(points, "fuelUsedTotal");
  const fuelCost = extractValues(points, "fuelUsedPriceTotal");
  const shortTrim = extractValues(points, "shortTermFuelTrim");
  const longTrim = extractValues(points, "longTermFuelTrim");
  const fuelAir = extractValues(points, "fuelAirRatio");

  return {
    avgFuelConsumption: avg(fuelConsumption),
    avgFuelConsumptionTotal: avg(fuelConsumptionTotal),
    avgInstantFuelRate: avg(instantRate),
    maxInstantFuelRate: max(instantRate),
    totalFuelUsed: last(fuelUsed), // Last reading = cumulative total
    totalFuelCost: last(fuelCost), // Last reading = cumulative total
    avgShortTermFuelTrim: avg(shortTrim),
    avgLongTermFuelTrim: avg(longTrim),
    avgFuelAirRatio: avg(fuelAir),
  };
}

export function analyzePower(points: OBD2DataPoint[]): PowerMetrics {
  const powerFuel = extractValues(points, "instantPowerFuel");
  const powerMaf = extractValues(points, "powerFromMaf");

  return {
    avgPowerFuel: avg(powerFuel),
    maxPowerFuel: max(powerFuel),
    avgPowerMaf: avg(powerMaf),
    maxPowerMaf: max(powerMaf),
  };
}

export function analyzeMotion(points: OBD2DataPoint[]): MotionMetrics {
  const speeds = extractValues(points, "vehicleSpeed");
  const accelerations = extractValues(points, "vehicleAcceleration");
  const distances = extractValues(points, "distanceTravelledTotal");

  // Duration from first to last data point
  const startTime = points[0].timestamp;
  const endTime = points[points.length - 1].timestamp;
  const durationSeconds = Math.round(endTime - startTime);
  const durationMinutes = Math.round(durationSeconds / 60);

  // Total distance: use last cumulative reading if available, otherwise estimate
  let totalDistance: number | null = null;
  if (distances.length > 0) {
    const firstDist = distances[0];
    const lastDist = distances[distances.length - 1];
    totalDistance = Math.round((lastDist - firstDist) * 100) / 100;
  }

  // Detect harsh braking: acceleration < -0.4g (approx -3.9 m/s²)
  let harshBrakingEvents = 0;
  for (const a of accelerations) {
    if (a < -0.4) {
      harshBrakingEvents++;
    }
  }

  // Detect rapid acceleration: acceleration > 0.3g (approx 2.9 m/s²)
  let rapidAccelerationEvents = 0;
  for (const a of accelerations) {
    if (a > 0.3) {
      rapidAccelerationEvents++;
    }
  }

  return {
    avgSpeed: avg(speeds),
    maxSpeed: max(speeds),
    totalDistance,
    durationSeconds,
    durationMinutes,
    harshBrakingEvents,
    rapidAccelerationEvents,
    avgAcceleration: avg(accelerations),
    maxAcceleration: max(accelerations),
  };
}

export function analyzeTransmission(
  points: OBD2DataPoint[]
): TransmissionMetrics {
  const cvtTemp = extractValues(points, "cvtTemp");
  const gearRatio = extractValues(points, "actualGearRatio");
  const primary = extractValues(points, "primaryPulleySpeed");
  const secondary = extractValues(points, "secondaryPulleySpeed");
  const turbine = extractValues(points, "turbineSpeed");
  const lockUp = extractValues(points, "lockUpDutyRatio");

  return {
    avgCvtTemp: avg(cvtTemp),
    maxCvtTemp: max(cvtTemp),
    avgGearRatio: avg(gearRatio),
    avgPrimaryPulleySpeed: avg(primary),
    avgSecondaryPulleySpeed: avg(secondary),
    avgTurbineSpeed: avg(turbine),
    avgLockUpDutyRatio: avg(lockUp),
  };
}

export function analyzeABS(points: OBD2DataPoint[]): ABSMetrics {
  const fl = extractValues(points, "absFrontLeftWheelSpeed");
  const fr = extractValues(points, "absFrontRightWheelSpeed");
  const rl = extractValues(points, "absRearLeftWheelSpeed");
  const rr = extractValues(points, "absRearRightWheelSpeed");
  const steering = extractValues(points, "steeringAngle");

  return {
    avgFrontLeftWheelSpeed: avg(fl),
    avgFrontRightWheelSpeed: avg(fr),
    avgRearLeftWheelSpeed: avg(rl),
    avgRearRightWheelSpeed: avg(rr),
    maxSteeringAngle: steering.length > 0
      ? Math.round(Math.max(...steering.map(Math.abs)) * 100) / 100
      : null,
    avgSteeringAngle: avg(steering),
  };
}

export function analyzeAWD(points: OBD2DataPoint[]): AWDMetrics {
  const actual = extractValues(points, "awdSolenoidActualCurrent");
  const set = extractValues(points, "awdSolenoidSetCurrent");

  return {
    avgSolenoidActualCurrent: avg(actual),
    maxSolenoidActualCurrent: max(actual),
    avgSolenoidSetCurrent: avg(set),
  };
}

export function analyzeElectrical(
  points: OBD2DataPoint[]
): ElectricalMetrics {
  const voltage = extractValues(points, "batteryVoltage");

  return {
    avgBatteryVoltage: avg(voltage),
    minBatteryVoltage: min(voltage),
    maxBatteryVoltage: max(voltage),
  };
}

// ── Safety score ──

/**
 * Calculate a safety score (0-100) based on driving behavior metrics.
 * Penalizes harsh braking, rapid acceleration, excessive speed,
 * high coolant temperature, and low battery voltage.
 */
export function calculateSafetyScore(
  motion: MotionMetrics,
  engine: EngineMetrics,
  electrical: ElectricalMetrics
): number {
  let score = 100;

  // Harsh braking: -2 per event, max -30
  score -= Math.min(motion.harshBrakingEvents * 2, 30);

  // Rapid acceleration: -1.5 per event, max -20
  score -= Math.min(motion.rapidAccelerationEvents * 1.5, 20);

  // Excessive speed: -10 if max speed > 120 km/h
  if (motion.maxSpeed !== null && motion.maxSpeed > 120) {
    score -= 10;
  }

  // High coolant temp: -10 if max > 105°C
  if (engine.maxCoolantTemp !== null && engine.maxCoolantTemp > 105) {
    score -= 10;
  }

  // Low battery voltage: -10 if min < 12V
  if (electrical.minBatteryVoltage !== null && electrical.minBatteryVoltage < 12) {
    score -= 10;
  }

  return Math.max(0, Math.round(score));
}

// ── Main entry point ──

/**
 * Analyze an array of OBD2 data points and produce a complete analysis result.
 */
export function analyzeOBD2Data(
  dataPoints: OBD2DataPoint[]
): OBD2AnalysisResult {
  if (dataPoints.length === 0) {
    throw new Error("No data points to analyze");
  }

  const engine = analyzeEngine(dataPoints);
  const airIntake = analyzeAirIntake(dataPoints);
  const fuel = analyzeFuel(dataPoints);
  const power = analyzePower(dataPoints);
  const motion = analyzeMotion(dataPoints);
  const transmission = analyzeTransmission(dataPoints);
  const abs = analyzeABS(dataPoints);
  const awd = analyzeAWD(dataPoints);
  const electrical = analyzeElectrical(dataPoints);

  const safetyScore = calculateSafetyScore(motion, engine, electrical);

  return {
    sessionId: `session-${Date.now()}`,
    startTime: dataPoints[0].timestamp,
    endTime: dataPoints[dataPoints.length - 1].timestamp,
    dataPointCount: dataPoints.length,
    engine,
    airIntake,
    fuel,
    power,
    motion,
    transmission,
    abs,
    awd,
    electrical,
    safetyScore,
    timestamp: new Date().toISOString(),
  };
}
