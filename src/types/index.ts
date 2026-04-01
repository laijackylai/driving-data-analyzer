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
  [key: string]: number | undefined;

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

  // COBB Accessport Parameters
  accelPosition?: number;        // % (accelerator pedal position — "Accel Position (%)")
  acCompressorSw?: number;       // 1=on, 0=off
  afCorrection1?: number;        // %
  afCorrection3?: number;        // %
  afLearning1?: number;          // %
  afLearning3?: number;          // %
  afSens1Ratio?: number;         // AFR
  avcsExhLeft?: number;          // degrees
  avcsInLeft?: number;           // degrees
  baroPressurePsi?: number;      // psi
  boostPsi?: number;             // psi
  clFuelTarget?: number;         // AFR
  calculatedLoadGRev?: number;   // g/rev (different from OBD2 engineLoad %)
  commFuelFinal?: number;        // AFR
  dam?: number;                  // Dynamic Advance Multiplier (0-1)
  egrCommanded?: number;         // steps
  feedbackKnock?: number;        // degrees
  fineKnockLearn?: number;       // degrees
  fuelCut?: number;              // cylinders cut
  fuelPressurePsi?: number;      // psi
  fuelPressureTargetPsi?: number; // psi
  gearPosition?: number;         // gear number
  ignCompIat?: number;           // degrees
  injDutyCycle?: number;         // %
  injPulseWidth?: number;        // ms
  injTimingHSoi?: number;        // degrees
  intakeTempManifold?: number;   // C
  mafFreqKhz?: number;           // kHz
  manifoldAbsPressPsi?: number;  // psi
  reqTorqueNm?: number;          // Nm
  reqTorqueBstTargetsNm?: number; // Nm
  tdBoostErrorPsi?: number;      // psi
  tdIntegWgPosCorrMm?: number;   // mm
  tdPropWgPosCorrMm?: number;    // mm
  tgvMapRatio?: number;          // multiplier
  targetBoostFinalRelPsi?: number; // psi
  wastegateInitPosFinalMm?: number; // mm
  wastegateActualPosMm?: number; // mm
  wastegateCommPosMm?: number;   // mm
  wastegateCommFinalPosMm?: number; // mm
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

// ── COBB-Specific Metric Interfaces ──

export interface CobbBoostMetrics {
  avgBoostPsi: number | null;
  maxBoostPsi: number | null;
  avgTargetBoostPsi: number | null;
  maxTargetBoostPsi: number | null;
  avgBoostErrorPsi: number | null;
  maxBoostErrorPsi: number | null;
}

export interface CobbKnockMetrics {
  knockEventCount: number;        // leading-edge transitions where feedbackKnock < -0.5
  avgFeedbackKnock: number | null;
  minFeedbackKnock: number | null; // most negative = worst knock
  avgFineKnockLearn: number | null;
  minFineKnockLearn: number | null;
  avgDAM: number | null;
  minDAM: number | null;           // DAM < 1.0 = knock retard active
}

export interface CobbAFRMetrics {
  avgAFR: number | null;
  avgAFRTarget: number | null;
  avgAFRDeviation: number | null;  // abs(AFR - target)
  maxAFRDeviation: number | null;
  avgAFCorrection1: number | null;
  avgAFLearning1: number | null;
}

export interface CobbWastegateMetrics {
  avgWastegateActualMm: number | null;
  maxWastegateActualMm: number | null;
  avgWastegateTargetMm: number | null;
  avgWastegateErrorMm: number | null; // actual - target
}

export interface CobbInjectorMetrics {
  avgInjDutyCycle: number | null;
  maxInjDutyCycle: number | null;
  avgInjPulseWidthMs: number | null;
  maxInjPulseWidthMs: number | null;
  fuelCutEventCount: number;
}

export interface CobbAVCSMetrics {
  avgAvcsExhLeft: number | null;
  maxAvcsExhLeft: number | null;
  avgAvcsInLeft: number | null;
  maxAvcsInLeft: number | null;
}

export interface CobbAnalysisResult {
  boost: CobbBoostMetrics;
  knock: CobbKnockMetrics;
  afr: CobbAFRMetrics;
  wastegate: CobbWastegateMetrics;
  injector: CobbInjectorMetrics;
  avcs: CobbAVCSMetrics;
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

// ── View State ──

export type ViewState = "landing" | "dissolving" | "analyzing" | "dashboard";

// ── Component Props ──

export interface LandingViewProps {
  onFileSelect: (file: File) => void;
}

export interface DotLoaderProps {
  className?: string;
}

// ── File Upload ──

export interface UploadedFile {
  name: string;
  size: number;
  type: string;
  content: string | ArrayBuffer;
}

// ── Data Source ──

/** String-literal union — `type` is correct here (not an object, so interface doesn't apply). */
export type DataSource = 'obd2' | 'cobb' | 'unknown';

export interface CobbMetadata {
  apVersion?: string;      // e.g. "AP3-SUB-006 v1.7.5.0-25910"
  vehicle?: string;        // e.g. "2023 USDM WRX MT"
  tune?: string;           // e.g. "Reflash: Stage1 93 v310.ptm"
}

// ── GPS Data ──

export interface GPSDataPoint {
  timestamp: number;
  lat: number;
  lon: number;
  altitude?: number;
  gpsSpeed?: number;
}

// ── Derived Metrics ──

export interface WheelSpeedDiff {
  timestamp: number;
  frontRearDelta: number;
  leftRightDelta: number;
}

export interface CVTRatioPoint {
  timestamp: number;
  ratio: number;
}

export interface FuelSpeedBucket {
  bucket: string;
  avgConsumption: number;
  sampleCount: number;
}

export interface EngineZonePoint {
  timestamp: number;
  zone: "eco" | "normal" | "sport";
}

export interface AWDEngagementEvent {
  timestamp: number;
  current: number;
  duration: number;
}

export interface DerivedMetrics {
  wheelSpeedDiffs: WheelSpeedDiff[];
  cvtEffectiveRatio: CVTRatioPoint[];
  fuelBySpeedBucket: FuelSpeedBucket[];
  engineZones: EngineZonePoint[];
  awdEngagementEvents: AWDEngagementEvent[];
  fuelDistanceSeries: { distance: number; fuel: number }[];
}

// ── Thresholds ──

export type ThresholdMetricKey =
  | "engineRpm"
  | "coolantTemp"
  | "oilTemp"
  | "cvtTemp"
  | "batteryVoltage"
  | "calculatedBoost"
  | "knockCorrection"
  | "shortTermFuelTrim"
  | "longTermFuelTrim"
  | "mafAirFlowRate";

export interface ThresholdRange {
  normal: [number, number];
  warning: [number, number] | [number, number][];
  danger: [number, number] | [number, number][];
}

export type ThresholdConfig = Record<ThresholdMetricKey, ThresholdRange>;

// ── Chart Types ──

/**
 * A row of time-series data with a required timestamp and arbitrary numeric fields.
 * Uses intersection type because it combines a fixed field with an index signature,
 * which cannot be expressed as a single interface.
 */
export type TimeSeriesRow = { timestamp: number } & Record<string, number | undefined>;

export interface TraceConfig {
  field: string;
  name: string;
  color?: string;
  yaxis?: "y" | "y2";
  fill?: boolean;
  mode?: "lines" | "markers" | "lines+markers";
}

export interface EventMarker {
  timestamp: number;
  color: string;
  label: string;
}

export interface TimeSeriesChartProps {
  data: TimeSeriesRow[];
  traces: TraceConfig[];
  thresholdKey?: ThresholdMetricKey;
  thresholds?: ThresholdConfig;
  eventMarkers?: EventMarker[];
  yAxisLabel?: string;
  y2AxisLabel?: string;
  height?: number;
  startTime: number;
  /** Per-chart LTTB downsampling threshold. If set, each trace is downsampled to this many points. Must be >= 3 for LTTB. */
  maxPoints?: number;
}

// ── Metric Tooltips ──

export interface MetricTooltipContent {
  /** One-line explanation of what the axis represents */
  axis: string;
  /** Two-line explanation of what the values mean */
  values: [string, string];
  /** One-line explanation of how to interpret the graph */
  interpretation: string;
}

// ── Extended API Response ──

export interface ExtendedAnalysisResponse {
  success: true;
  result?: OBD2AnalysisResult;
  timeSeries: OBD2DataPoint[];
  gps: GPSDataPoint[];
  derived: DerivedMetrics;
  thresholds: ThresholdConfig;
  dataSource?: DataSource;          // new, optional until Task 6 lands
  cobbResult?: CobbAnalysisResult;  // new, only when dataSource === 'cobb'
  cobbMetadata?: CobbMetadata;      // new, only when dataSource === 'cobb'
}

// ── Data Layer Interfaces ──

/**
 * Maps a COBB Accessport CSV column header to an OBD2DataPoint field name.
 * Optional `transform` converts the raw number value before storing.
 */
export interface CobbColumnMapping {
  field: string;
  transform?: (value: number) => number;
}

/**
 * Return type of parseCobbFile: parsed data points and extracted AP Info metadata.
 */
export interface CobbParseResult {
  dataPoints: OBD2DataPoint[];
  metadata: CobbMetadata;
}

/**
 * A pluggable source detector for the source registry.
 * Inspects raw CSV text and returns true if it recognises the format.
 */
export interface SourceDetector {
  source: DataSource;
  priority: number;
  detect(csvText: string): boolean;
}
