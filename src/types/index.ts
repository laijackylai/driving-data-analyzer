// OBD2 driving data types

/**
 * A single raw reading from an OBD2 CSV file (long-form).
 * Each row in the CSV is one PID measurement at a timestamp.
 */
export interface OBD2Reading {
  timestamp: number; // SECONDS as float (unix-style with microsecond precision)
  pid: string; // PID name (e.g. "Engine RPM")
  value: number | null; // Parsed numeric value, or null if empty/invalid
  units: string; // Unit string (e.g. "rpm", "km/h")
}

/**
 * A pivoted data point with all PIDs as optional fields (wide-form).
 * Created by grouping OBD2Readings by timestamp bucket.
 */
export interface OBD2DataPoint {
  timestamp: number;

  // Engine Parameters
  engineRpm?: number;
  engineRpmX1000?: number;
  engineLoad?: number;
  timingAdvance?: number;
  coolantTemp?: number;
  coolantTempA?: number;
  coolantTempB?: number;
  oilTemp?: number;
  knockCorrection?: number;
  learnedIgnitionTiming?: number;
  ocvDutyLeft?: number;

  // Air Intake Parameters
  mafAirFlowRate?: number;
  intakeManifoldPressure?: number;
  calculatedBoost?: number;
  intakeAirTemp?: number;
  barometricPressure?: number;
  throttlePosition?: number;

  // Fuel System Parameters
  avgFuelConsumption?: number;
  avgFuelConsumptionTotal?: number;
  avgFuelConsumption10s?: number;
  instantFuelRate?: number;
  fuelUsedTotal?: number;
  fuelUsedPrice?: number;
  fuelUsedPriceTotal?: number;
  fuelEconomizer?: number;
  shortTermFuelTrim?: number;
  longTermFuelTrim?: number;
  commandedFuelRailPressure?: number;
  fuelRailPressure?: number;
  fuelAirRatio?: number;
  afSensor1?: number;

  // Power Calculations
  instantPowerFuel?: number;
  powerFromMaf?: number;

  // Vehicle Motion Parameters
  vehicleSpeed?: number;
  vehicleAcceleration?: number;
  averageSpeed?: number;
  distanceTravelled?: number;
  distanceTravelledTotal?: number;

  // Transmission Parameters
  cvtTemp?: number;
  actualGearRatio?: number;
  targetGearRatio?: number;
  primaryPulleySpeed?: number;
  secondaryPulleySpeed?: number;
  turbineSpeed?: number;
  lockUpDutyRatio?: number;

  // ABS/Stability System Parameters
  absFrontLeftWheelSpeed?: number;
  absFrontRightWheelSpeed?: number;
  absRearLeftWheelSpeed?: number;
  absRearRightWheelSpeed?: number;
  steeringAngle?: number;

  // AWD System Parameters
  awdSolenoidActualCurrent?: number;
  awdSolenoidSetCurrent?: number;

  // Electrical System Parameters
  batteryVoltage?: number;
}

// ── Category Metric Interfaces ──

export interface EngineMetrics {
  avgRpm: number | null;
  maxRpm: number | null;
  avgLoad: number | null;
  maxLoad: number | null;
  avgCoolantTemp: number | null;
  maxCoolantTemp: number | null;
  avgOilTemp: number | null;
  maxOilTemp: number | null;
  avgTimingAdvance: number | null;
  avgKnockCorrection: number | null;
}

export interface AirIntakeMetrics {
  avgMafAirFlow: number | null;
  maxMafAirFlow: number | null;
  avgBoost: number | null;
  maxBoost: number | null;
  avgIntakeTemp: number | null;
  avgThrottlePosition: number | null;
  maxThrottlePosition: number | null;
  avgManifoldPressure: number | null;
}

export interface FuelMetrics {
  avgFuelConsumption: number | null;
  avgFuelConsumptionTotal: number | null;
  avgInstantFuelRate: number | null;
  maxInstantFuelRate: number | null;
  totalFuelUsed: number | null;
  totalFuelCost: number | null;
  avgShortTermFuelTrim: number | null;
  avgLongTermFuelTrim: number | null;
  avgFuelAirRatio: number | null;
}

export interface PowerMetrics {
  avgPowerFuel: number | null;
  maxPowerFuel: number | null;
  avgPowerMaf: number | null;
  maxPowerMaf: number | null;
}

export interface MotionMetrics {
  avgSpeed: number | null;
  maxSpeed: number | null;
  totalDistance: number | null;
  durationSeconds: number;
  durationMinutes: number;
  harshBrakingEvents: number;
  rapidAccelerationEvents: number;
  avgAcceleration: number | null;
  maxAcceleration: number | null;
}

export interface TransmissionMetrics {
  avgCvtTemp: number | null;
  maxCvtTemp: number | null;
  avgGearRatio: number | null;
  avgPrimaryPulleySpeed: number | null;
  avgSecondaryPulleySpeed: number | null;
  avgTurbineSpeed: number | null;
  avgLockUpDutyRatio: number | null;
}

export interface ABSMetrics {
  avgFrontLeftWheelSpeed: number | null;
  avgFrontRightWheelSpeed: number | null;
  avgRearLeftWheelSpeed: number | null;
  avgRearRightWheelSpeed: number | null;
  maxSteeringAngle: number | null;
  avgSteeringAngle: number | null;
}

export interface AWDMetrics {
  avgSolenoidActualCurrent: number | null;
  maxSolenoidActualCurrent: number | null;
  avgSolenoidSetCurrent: number | null;
}

export interface ElectricalMetrics {
  avgBatteryVoltage: number | null;
  minBatteryVoltage: number | null;
  maxBatteryVoltage: number | null;
}

// ── Main Analysis Result ──

export interface OBD2AnalysisResult {
  sessionId: string;
  startTime: number; // First timestamp in the data
  endTime: number; // Last timestamp in the data
  dataPointCount: number; // Number of pivoted data points
  engine: EngineMetrics;
  airIntake: AirIntakeMetrics;
  fuel: FuelMetrics;
  power: PowerMetrics;
  motion: MotionMetrics;
  transmission: TransmissionMetrics;
  abs: ABSMetrics;
  awd: AWDMetrics;
  electrical: ElectricalMetrics;
  safetyScore: number; // 0-100
  timestamp: string; // ISO string of when the analysis was performed
}

// ── Backward-compatible Analysis Result for Dashboard ──

/**
 * Simplified analysis result for dashboard display.
 * Maintains backward compatibility with existing frontend components.
 */
export interface AnalysisResult {
  sessionId: string;
  timestamp: string; // ISO string of when the analysis was performed
  safetyScore: number; // 0-100
  metrics: {
    averageSpeed: number | null;
    maxSpeed: number | null;
    distanceTraveled: number | null;
    durationMinutes: number;
    harshBrakingEvents: number;
    rapidAccelerationEvents: number;
  };
}

// ── Category Metrics Union ──

export type CategoryMetricsType =
  | EngineMetrics
  | AirIntakeMetrics
  | FuelMetrics
  | PowerMetrics
  | MotionMetrics
  | TransmissionMetrics
  | ABSMetrics
  | AWDMetrics
  | ElectricalMetrics;

// ── File Upload ──

export interface UploadedFile {
  name: string;
  size: number;
  type: string;
  content: string | ArrayBuffer;
}
