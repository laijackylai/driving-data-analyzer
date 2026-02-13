// OBD2 PID mappings and metadata

export type CategoryType =
  | "engine"
  | "airIntake"
  | "fuel"
  | "power"
  | "motion"
  | "transmission"
  | "abs"
  | "awd"
  | "electrical";

export interface PIDMapping {
  field: string;
  category: CategoryType;
  unit: string;
}

/**
 * Maps raw PID name strings from OBD2 CSV to camelCase field names, categories, and units.
 */
export const PID_MAP: Record<string, PIDMapping> = {
  // Engine Parameters
  "Engine RPM": { field: "engineRpm", category: "engine", unit: "rpm" },
  "Engine RPM x1000": {
    field: "engineRpmX1000",
    category: "engine",
    unit: "rpm",
  },
  "Calculated engine load value": {
    field: "engineLoad",
    category: "engine",
    unit: "%",
  },
  "Timing advance": {
    field: "timingAdvance",
    category: "engine",
    unit: "\u00b0",
  },
  "Engine coolant temperature": {
    field: "coolantTemp",
    category: "engine",
    unit: "\u2103",
  },
  "Engine coolant temperature (A)": {
    field: "coolantTempA",
    category: "engine",
    unit: "\u2103",
  },
  "Engine coolant temperature (B)": {
    field: "coolantTempB",
    category: "engine",
    unit: "\u2103",
  },
  "Engine oil temperature": {
    field: "oilTemp",
    category: "engine",
    unit: "\u2103",
  },
  "Knocking Correction": {
    field: "knockCorrection",
    category: "engine",
    unit: "\u00b0",
  },
  "Learned Ignition Timing": {
    field: "learnedIgnitionTiming",
    category: "engine",
    unit: "\u00b0",
  },
  "OCV Duty Left": { field: "ocvDutyLeft", category: "engine", unit: "%" },

  // Air Intake Parameters
  "MAF air flow rate": {
    field: "mafAirFlowRate",
    category: "airIntake",
    unit: "g/sec",
  },
  "Intake manifold absolute pressure": {
    field: "intakeManifoldPressure",
    category: "airIntake",
    unit: "kPa",
  },
  "Calculated boost": {
    field: "calculatedBoost",
    category: "airIntake",
    unit: "bar",
  },
  "Intake air temperature": {
    field: "intakeAirTemp",
    category: "airIntake",
    unit: "\u2103",
  },
  "Barometric pressure": {
    field: "barometricPressure",
    category: "airIntake",
    unit: "kPa",
  },
  "Relative throttle position": {
    field: "throttlePosition",
    category: "airIntake",
    unit: "%",
  },

  // Fuel System Parameters
  "Average fuel consumption": {
    field: "avgFuelConsumption",
    category: "fuel",
    unit: "L/100km",
  },
  "Average fuel consumption (total)": {
    field: "avgFuelConsumptionTotal",
    category: "fuel",
    unit: "L/100km",
  },
  "Average fuel consumption 10 sec": {
    field: "avgFuelConsumption10s",
    category: "fuel",
    unit: "L/100km",
  },
  "Calculated instant fuel rate": {
    field: "instantFuelRate",
    category: "fuel",
    unit: "L/h",
  },
  "Fuel used (total)": { field: "fuelUsedTotal", category: "fuel", unit: "L" },
  "Fuel used price": { field: "fuelUsedPrice", category: "fuel", unit: "$" },
  "Fuel used price (total)": {
    field: "fuelUsedPriceTotal",
    category: "fuel",
    unit: "$",
  },
  "Fuel economizer": {
    field: "fuelEconomizer",
    category: "fuel",
    unit: "",
  },
  "Short term fuel % trim - Bank 1": {
    field: "shortTermFuelTrim",
    category: "fuel",
    unit: "%",
  },
  "Long term fuel % trim - Bank 1": {
    field: "longTermFuelTrim",
    category: "fuel",
    unit: "%",
  },
  "Commanded Fuel Rail Pressure": {
    field: "commandedFuelRailPressure",
    category: "fuel",
    unit: "kPa",
  },
  "Fuel Rail Pressure": {
    field: "fuelRailPressure",
    category: "fuel",
    unit: "kPa",
  },
  "Fuel/Air commanded equivalence ratio": {
    field: "fuelAirRatio",
    category: "fuel",
    unit: "",
  },
  "A/F Sensor #1": { field: "afSensor1", category: "fuel", unit: "" },

  // Power Calculations
  "Instant engine power (based on fuel consumption)": {
    field: "instantPowerFuel",
    category: "power",
    unit: "hp",
  },
  "Power from MAF": { field: "powerFromMaf", category: "power", unit: "hp" },

  // Vehicle Motion Parameters
  "Vehicle speed": { field: "vehicleSpeed", category: "motion", unit: "km/h" },
  "Vehicle acceleration": {
    field: "vehicleAcceleration",
    category: "motion",
    unit: "g",
  },
  "Average speed": { field: "averageSpeed", category: "motion", unit: "km/h" },
  "Distance travelled": {
    field: "distanceTravelled",
    category: "motion",
    unit: "km",
  },
  "Distance travelled (total)": {
    field: "distanceTravelledTotal",
    category: "motion",
    unit: "km",
  },

  // Transmission Parameters
  "AT/CVT Temperature v.1": {
    field: "cvtTemp",
    category: "transmission",
    unit: "\u2103",
  },
  "Actual Gear Ratio": {
    field: "actualGearRatio",
    category: "transmission",
    unit: "",
  },
  "Target Gear Ratio": {
    field: "targetGearRatio",
    category: "transmission",
    unit: "",
  },
  "Primary Pulley Speed": {
    field: "primaryPulleySpeed",
    category: "transmission",
    unit: "rpm",
  },
  "Secondary Pulley Speed": {
    field: "secondaryPulleySpeed",
    category: "transmission",
    unit: "rpm",
  },
  "Turbine Speed": {
    field: "turbineSpeed",
    category: "transmission",
    unit: "rpm",
  },
  "Lock Up Duty Ratio": {
    field: "lockUpDutyRatio",
    category: "transmission",
    unit: "%",
  },

  // ABS/Stability System Parameters
  "[ABS] Front left wheel speed": {
    field: "absFrontLeftWheelSpeed",
    category: "abs",
    unit: "km/h",
  },
  "[ABS] Front right wheel speed": {
    field: "absFrontRightWheelSpeed",
    category: "abs",
    unit: "km/h",
  },
  "[ABS] Rear left wheel speed": {
    field: "absRearLeftWheelSpeed",
    category: "abs",
    unit: "km/h",
  },
  "[ABS] Rear right wheel speed": {
    field: "absRearRightWheelSpeed",
    category: "abs",
    unit: "km/h",
  },
  "[ABS] Steering angle sensor": {
    field: "steeringAngle",
    category: "abs",
    unit: "\u00b0",
  },

  // AWD System Parameters
  "AWD Solenoid Actual Current": {
    field: "awdSolenoidActualCurrent",
    category: "awd",
    unit: "mA",
  },
  "AWD Solenoid Set Current": {
    field: "awdSolenoidSetCurrent",
    category: "awd",
    unit: "mA",
  },

  // Electrical System Parameters
  "Battery Terminal Voltage": {
    field: "batteryVoltage",
    category: "electrical",
    unit: "V",
  },
};

/**
 * Maps category names to their PID field arrays.
 */
export const PID_CATEGORIES: Record<CategoryType, string[]> = {
  engine: [
    "engineRpm",
    "engineRpmX1000",
    "engineLoad",
    "timingAdvance",
    "coolantTemp",
    "coolantTempA",
    "coolantTempB",
    "oilTemp",
    "knockCorrection",
    "learnedIgnitionTiming",
    "ocvDutyLeft",
  ],
  airIntake: [
    "mafAirFlowRate",
    "intakeManifoldPressure",
    "calculatedBoost",
    "intakeAirTemp",
    "barometricPressure",
    "throttlePosition",
  ],
  fuel: [
    "avgFuelConsumption",
    "avgFuelConsumptionTotal",
    "avgFuelConsumption10s",
    "instantFuelRate",
    "fuelUsedTotal",
    "fuelUsedPrice",
    "fuelUsedPriceTotal",
    "fuelEconomizer",
    "shortTermFuelTrim",
    "longTermFuelTrim",
    "commandedFuelRailPressure",
    "fuelRailPressure",
    "fuelAirRatio",
    "afSensor1",
  ],
  power: ["instantPowerFuel", "powerFromMaf"],
  motion: [
    "vehicleSpeed",
    "vehicleAcceleration",
    "averageSpeed",
    "distanceTravelled",
    "distanceTravelledTotal",
  ],
  transmission: [
    "cvtTemp",
    "actualGearRatio",
    "targetGearRatio",
    "primaryPulleySpeed",
    "secondaryPulleySpeed",
    "turbineSpeed",
    "lockUpDutyRatio",
  ],
  abs: [
    "absFrontLeftWheelSpeed",
    "absFrontRightWheelSpeed",
    "absRearLeftWheelSpeed",
    "absRearRightWheelSpeed",
    "steeringAngle",
  ],
  awd: ["awdSolenoidActualCurrent", "awdSolenoidSetCurrent"],
  electrical: ["batteryVoltage"],
};

/**
 * Maps camelCase field names to human-readable labels for the UI.
 */
export const PID_DISPLAY: Record<string, { label: string; unit: string }> = {};

// Build PID_DISPLAY from PID_MAP
for (const [pidName, mapping] of Object.entries(PID_MAP)) {
  PID_DISPLAY[mapping.field] = { label: pidName, unit: mapping.unit };
}

/**
 * Human-readable category labels for the UI.
 */
export const CATEGORY_LABELS: Record<CategoryType, string> = {
  engine: "Engine",
  airIntake: "Air Intake",
  fuel: "Fuel System",
  power: "Power",
  motion: "Motion",
  transmission: "Transmission",
  abs: "ABS/Stability",
  awd: "AWD",
  electrical: "Electrical",
};
