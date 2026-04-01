import { CobbColumnMapping } from "@/types";

/**
 * Maps COBB Accessport CSV column header strings to OBD2DataPoint field names.
 * Optional `transform` converts the raw number value before storing.
 * Keys use \ufffd (replacement character) for degree symbols to match actual COBB CSV encoding.
 */

const MPH_TO_KMH = (mph: number) => Math.round(mph * 1.60934 * 100) / 100;

export const COBB_COLUMN_MAP: Record<string, CobbColumnMapping> = {
  // Note: AC Compressor Sw is handled separately (string "on"/"off" → 1/0)
  "AF Correction 1 (%)":              { field: "afCorrection1" },
  "AF Correction 3 (%)":              { field: "afCorrection3" },
  "AF Learning 1 (%)":                { field: "afLearning1" },
  "AF Learning 3 (%)":                { field: "afLearning3" },
  "AF Sens 1 Ratio (AFR)":            { field: "afSens1Ratio" },
  "AVCS Exh Left (\ufffd)":           { field: "avcsExhLeft" },
  "AVCS In Left (\ufffd)":            { field: "avcsInLeft" },
  "Accel Position (%)":               { field: "accelPosition" },
  "Baro Pressure (psi)":              { field: "baroPressurePsi" },
  "Battery Volts (V)":                { field: "batteryVoltage" },
  "Boost (psi)":                      { field: "boostPsi" },
  "CL Fuel Target (AFR)":             { field: "clFuelTarget" },
  "Calculated Load (g/rev)":          { field: "calculatedLoadGRev" },
  "Comm Fuel Final (AFR)":            { field: "commFuelFinal" },
  "Coolant Temp (C)":                 { field: "coolantTemp" },
  "Dyn Adv Mult (DAM)":               { field: "dam" },
  "EGR Commanded (steps)":            { field: "egrCommanded" },
  "Feedback Knock (\ufffd)":          { field: "feedbackKnock" },
  "Fine Knock Learn (\ufffd)":        { field: "fineKnockLearn" },
  "Fuel Cut (cylinders)":             { field: "fuelCut" },
  "Fuel Pressure (psi)":              { field: "fuelPressurePsi" },
  "Fuel Pressure Target (psi)":       { field: "fuelPressureTargetPsi" },
  "Gear Position (gear)":             { field: "gearPosition" },
  "Ign Comp IAT (\ufffd)":            { field: "ignCompIat" },
  "Ignition Timing (\ufffd)":         { field: "timingAdvance" },
  "Inj Duty Cycle (%)":               { field: "injDutyCycle" },
  "Inj PW (ms)":                      { field: "injPulseWidth" },
  "Inj Timing H SOI NEW (\ufffd)":    { field: "injTimingHSoi" },
  "Intake Temp (C)":                  { field: "intakeAirTemp" },
  "Intake Temp Manifold (C)":         { field: "intakeTempManifold" },
  "MAF Corr (g/s)":                   { field: "mafAirFlowRate" },
  "MAF Freq (kHz)":                   { field: "mafFreqKhz" },
  "Man Abs Press (psi)":              { field: "manifoldAbsPressPsi" },
  "Oil Temp (C)":                     { field: "oilTemp" },
  "RPM (RPM)":                        { field: "engineRpm" },
  "Req Torque (Nm)":                  { field: "reqTorqueNm" },
  "Req Torque Bst Targets (Nm)":      { field: "reqTorqueBstTargetsNm" },
  "TD Boost Error (psi)":             { field: "tdBoostErrorPsi" },
  "TD Integ WG Pos Corr (mm)":        { field: "tdIntegWgPosCorrMm" },
  "TD Prop WG Pos Corr (mm)":         { field: "tdPropWgPosCorrMm" },
  "TGV Map Ratio (mult)":             { field: "tgvMapRatio" },
  "Target Boost Final Rel (psi)":     { field: "targetBoostFinalRelPsi" },
  "Throttle Pos (%)":                 { field: "throttlePosition" },
  "Vehicle Speed (mph)":              { field: "vehicleSpeed", transform: MPH_TO_KMH },
  "Wastegate Init Pos Final (mm)":    { field: "wastegateInitPosFinalMm" },
  "Wastegate Pos Actual (mm)":        { field: "wastegateActualPosMm" },
  "Wastegate Pos Comm (mm)":          { field: "wastegateCommPosMm" },
  "Wastegate Pos Comm Final (mm)":    { field: "wastegateCommFinalPosMm" },
};

/** Pattern to detect the AP Info metadata column. */
export const COBB_AP_INFO_PATTERN = /^AP Info:/;

/**
 * The AC Compressor Sw column contains "on"/"off" strings, not numbers.
 * The parser calls this before parseFloat to convert to 1/0.
 */
export const COBB_STRING_COLUMNS: Record<string, Record<string, number>> = {
  "AC Compressor Sw (on/off)": { on: 1, off: 0 },
};
export const COBB_STRING_COLUMN_FIELDS: Record<string, string> = {
  "AC Compressor Sw (on/off)": "acCompressorSw",
};
