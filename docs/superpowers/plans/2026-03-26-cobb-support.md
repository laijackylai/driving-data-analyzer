# COBB Accessport Data Support Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add support for COBB Accessport wide-form CSV data logs alongside the existing OBD2 long-form format, auto-detected on upload, with 6 new COBB-specific chart panels rendered conditionally in the existing dashboard.

**Architecture:** An extensible source registry detects the data format from CSV headers and routes to the appropriate parser + analyzer. COBB data is wide-form (all ~50 columns per row), requiring a dedicated parser that maps column headers to `OBD2DataPoint` fields. Both sources produce the same `OBD2DataPoint[]` type, so all downstream analysis and charting code stays unchanged. New COBB-specific metric categories and chart panels are rendered conditionally when `dataSource === 'cobb'`.

**Tech Stack:** TypeScript strict, Vitest, Next.js 16 App Router API route, existing `OBD2DataPoint` type extended with COBB fields.

---

## Data Source Notes (Read Before Coding)

| | OBD2 | COBB |
|---|---|---|
| Delimiter | Semicolon `;` | Comma `,` |
| Format | Long-form (1 PID per row) | Wide-form (all columns per row) |
| Time column | `SECONDS` | `Time (sec)` |
| Speed unit | km/h | **mph** → convert ×1.60934 |
| Load unit | `%` | `g/rev` (different scale, treat as separate field) |
| Metadata | None | Last column: `AP Info:[...]` — extract vehicle/tune info |
| Timestamp | Unix float | Seconds from session start (relative) |
| `AC Compressor Sw` values | N/A | **String `"on"`/`"off"`, not numeric** — parser must pre-convert before `parseFloat` |
| Degree symbols in headers | N/A | **COBB CSVs saved with broken encoding use `\ufffd` (replacement char), not `\u00b0`** — parser must normalize all non-ASCII in headers before column map lookup |

**COBB column→field mapping (all 50 data columns):**

| COBB Header | OBD2DataPoint field | Notes |
|---|---|---|
| `Time (sec)` | `timestamp` | Relative seconds |
| `AC Compressor Sw (on/off)` | `acCompressorSw` | New |
| `AF Correction 1 (%)` | `afCorrection1` | New |
| `AF Correction 3 (%)` | `afCorrection3` | New |
| `AF Learning 1 (%)` | `afLearning1` | New |
| `AF Learning 3 (%)` | `afLearning3` | New |
| `AF Sens 1 Ratio (AFR)` | `afSens1Ratio` | New |
| `AVCS Exh Left (°)` | `avcsExhLeft` | New |
| `AVCS In Left (°)` | `avcsInLeft` | New |
| `Accel Position (%)` | `throttlePosition` | Maps existing |
| `Baro Pressure (psi)` | `baroPressurePsi` | New (psi not kPa) |
| `Battery Volts (V)` | `batteryVoltage` | Maps existing |
| `Boost (psi)` | `boostPsi` | New |
| `CL Fuel Target (AFR)` | `clFuelTarget` | New |
| `Calculated Load (g/rev)` | `calculatedLoadGRev` | New (g/rev ≠ %) |
| `Comm Fuel Final (AFR)` | `commFuelFinal` | New |
| `Coolant Temp (C)` | `coolantTemp` | Maps existing |
| `Dyn Adv Mult (DAM)` | `dam` | New |
| `EGR Commanded (steps)` | `egrCommanded` | New |
| `Feedback Knock (°)` | `feedbackKnock` | New |
| `Fine Knock Learn (°)` | `fineKnockLearn` | New |
| `Fuel Cut (cylinders)` | `fuelCut` | New |
| `Fuel Pressure (psi)` | `fuelPressurePsi` | New |
| `Fuel Pressure Target (psi)` | `fuelPressureTargetPsi` | New |
| `Gear Position (gear)` | `gearPosition` | New |
| `Ign Comp IAT (°)` | `ignCompIat` | New |
| `Ignition Timing (°)` | `timingAdvance` | Maps existing |
| `Inj Duty Cycle (%)` | `injDutyCycle` | New |
| `Inj PW (ms)` | `injPulseWidth` | New |
| `Inj Timing H SOI NEW (°)` | `injTimingHSoi` | New |
| `Intake Temp (C)` | `intakeAirTemp` | Maps existing |
| `Intake Temp Manifold (C)` | `intakeTempManifold` | New |
| `MAF Corr (g/s)` | `mafAirFlowRate` | Maps existing |
| `MAF Freq (kHz)` | `mafFreqKhz` | New |
| `Man Abs Press (psi)` | `manifoldAbsPressPsi` | New |
| `Oil Temp (C)` | `oilTemp` | Maps existing |
| `RPM (RPM)` | `engineRpm` | Maps existing |
| `Req Torque (Nm)` | `reqTorqueNm` | New |
| `Req Torque Bst Targets (Nm)` | `reqTorqueBstTargetsNm` | New |
| `TD Boost Error (psi)` | `tdBoostErrorPsi` | New |
| `TD Integ WG Pos Corr (mm)` | `tdIntegWgPosCorrMm` | New |
| `TD Prop WG Pos Corr (mm)` | `tdPropWgPosCorrMm` | New |
| `TGV Map Ratio (mult)` | `tgvMapRatio` | New |
| `Target Boost Final Rel (psi)` | `targetBoostFinalRelPsi` | New |
| `Throttle Pos (%)` | `throttlePosition` | Maps existing (same field as Accel Position) |
| `Vehicle Speed (mph)` | `vehicleSpeed` | Maps existing, **convert mph×1.60934→km/h** |
| `Wastegate Init Pos Final (mm)` | `wastegateInitPosFinalMm` | New |
| `Wastegate Pos Actual (mm)` | `wastegateActualPosMm` | New |
| `Wastegate Pos Comm (mm)` | `wastegateCommPosMm` | New |
| `Wastegate Pos Comm Final (mm)` | `wastegateCommFinalPosMm` | New |
| `AP Info:[...]` | (skip — metadata) | Extract to `CobbMetadata` |

---

## File Map

| Action | File | Responsibility |
|---|---|---|
| Create | `src/lib/data/sourceRegistry.ts` | `SourceDetector` interface + registry, `detectDataSource()` |
| Create | `src/lib/data/cobbColumnMap.ts` | Maps COBB header strings → `OBD2DataPoint` field names + optional transform fns |
| Create | `src/lib/data/cobbParser.ts` | `parseCobbFile(csvText)` → `{ dataPoints: OBD2DataPoint[], metadata: CobbMetadata }` |
| Create | `src/lib/data/cobbAnalyzer.ts` | `analyzeCobbData(points)` → `CobbAnalysisResult` with 6 metric categories |
| Create | `src/test/sourceRegistry.test.ts` | Detection tests for OBD2, COBB, unknown inputs |
| Create | `src/test/cobbParser.test.ts` | Parser unit tests: header mapping, mph conversion, AP info extraction |
| Create | `src/test/cobbAnalyzer.test.ts` | Analyzer unit tests: boost, knock, AFR, wastegate, injector, AVCS |
| Modify | `src/types/index.ts` | Add `DataSource`, COBB fields to `OBD2DataPoint`, `CobbMetadata`, `CobbAnalysisResult`, update `ExtendedAnalysisResponse` |
| Modify | `src/app/api/analyze/route.ts` | Use `detectDataSource()`, route to correct parser+analyzer, include `dataSource` in response |
| Modify | `src/components/features/DashboardView.tsx` | Add 6 COBB-specific chart panels rendered when `dataSource === 'cobb'` |

---

## Task 1: Types

**Files:**
- Modify: `src/types/index.ts`

- [ ] **Step 1: Add `DataSource` type and `CobbMetadata` interface** — open `src/types/index.ts` and add after the `UploadedFile` interface:

```typescript
// ── Data Source ──

export type DataSource = 'obd2' | 'cobb' | 'unknown';

export interface CobbMetadata {
  apVersion?: string;      // e.g. "AP3-SUB-006 v1.7.5.0-25910"
  vehicle?: string;        // e.g. "2023 USDM WRX MT"
  tune?: string;           // e.g. "Reflash: Stage1 93 v310.ptm"
}
```

- [ ] **Step 2: Add COBB fields to `OBD2DataPoint`** — append inside the `OBD2DataPoint` interface after `batteryVoltage`:

```typescript
  // COBB Accessport Parameters
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
```

- [ ] **Step 3: Add `CobbAnalysisResult` with 6 metric category interfaces** — add after `ElectricalMetrics`:

```typescript
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
  knockEventCount: number;        // samples where feedbackKnock < -0.5
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
```

- [ ] **Step 4: Update `ExtendedAnalysisResponse`** — add optional `dataSource`, `cobbResult`, and `cobbMetadata`. Use optional (`?`) for `dataSource` to avoid type errors in existing code before Task 6 updates the API route:

```typescript
export interface ExtendedAnalysisResponse {
  success: true;
  result: OBD2AnalysisResult;
  timeSeries: OBD2DataPoint[];
  gps: GPSDataPoint[];
  derived: DerivedMetrics;
  thresholds: ThresholdConfig;
  dataSource?: DataSource;          // new, optional until Task 6 lands
  cobbResult?: CobbAnalysisResult;  // new, only when dataSource === 'cobb'
  cobbMetadata?: CobbMetadata;      // new, only when dataSource === 'cobb'
}
```

- [ ] **Step 5: Run type-check to verify no compile errors**

```bash
npm run type-check
```
Expected: no errors

- [ ] **Step 6: Commit**

```bash
git add src/types/index.ts
git commit -m "feat(types): add DataSource, COBB fields to OBD2DataPoint, CobbAnalysisResult"
```

---

## Task 2: Source Registry

**Files:**
- Create: `src/lib/data/sourceRegistry.ts`
- Create: `src/test/sourceRegistry.test.ts`

- [ ] **Step 1: Write the failing tests** — create `src/test/sourceRegistry.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { detectDataSource } from "@/lib/data/sourceRegistry";

// Minimal OBD2 CSV (semicolon-delimited, long-form)
const OBD2_CSV = `SECONDS;PID;VALUE;UNITS
0.000;Engine RPM;1234;rpm
0.000;Vehicle Speed;45;km/h
`;

// Minimal COBB CSV (comma-delimited, wide-form)
const COBB_CSV = `Time (sec),RPM (RPM),Boost (psi),Vehicle Speed (mph)
0.000,1098,-10.67,10
0.021,1089,-10.60,10
`;

// COBB CSV without boost (still valid COBB - Time (sec) + comma is enough)
const COBB_NO_BOOST_CSV = `Time (sec),RPM (RPM),Throttle Pos (%),MAF Corr (g/s)
0.000,1098,5.0,4.54
`;

const UNKNOWN_CSV = `foo,bar,baz
1,2,3
`;

const EMPTY = ``;

describe("detectDataSource", () => {
  it("detects OBD2 from semicolon-delimited long-form headers", () => {
    expect(detectDataSource(OBD2_CSV)).toBe("obd2");
  });

  it("detects COBB from Time (sec) + comma delimiter", () => {
    expect(detectDataSource(COBB_CSV)).toBe("cobb");
  });

  it("detects COBB even without Boost column", () => {
    expect(detectDataSource(COBB_NO_BOOST_CSV)).toBe("cobb");
  });

  it("returns unknown for unrecognized format", () => {
    expect(detectDataSource(UNKNOWN_CSV)).toBe("unknown");
  });

  it("returns unknown for empty input", () => {
    expect(detectDataSource(EMPTY)).toBe("unknown");
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run src/test/sourceRegistry.test.ts
```
Expected: FAIL — `detectDataSource` not found

- [ ] **Step 3: Implement `sourceRegistry.ts`**

```typescript
import { DataSource } from "@/types";

export interface SourceDetector {
  source: DataSource;
  priority: number;
  detect(csvText: string): boolean;
}

const detectors: SourceDetector[] = [
  {
    source: "obd2",
    priority: 10,
    detect(csvText: string): boolean {
      const firstLine = csvText.split("\n")[0] ?? "";
      const upper = firstLine.toUpperCase();
      return (
        firstLine.includes(";") &&
        upper.includes("SECONDS") &&
        upper.includes("PID") &&
        upper.includes("VALUE")
      );
    },
  },
  {
    source: "cobb",
    priority: 10,
    detect(csvText: string): boolean {
      const firstLine = csvText.split("\n")[0] ?? "";
      return (
        firstLine.includes(",") &&
        firstLine.trim().startsWith("Time (sec)")
      );
    },
  },
];

/**
 * Detect the data source format from CSV text.
 * Runs all registered detectors in priority order; returns first match.
 * Returns 'unknown' if no detector matches.
 */
export function detectDataSource(csvText: string): DataSource {
  if (!csvText.trim()) return "unknown";

  const sorted = [...detectors].sort((a, b) => b.priority - a.priority);
  for (const detector of sorted) {
    if (detector.detect(csvText)) return detector.source;
  }
  return "unknown";
}

/**
 * Register a new source detector (for future data sources).
 */
export function registerDetector(detector: SourceDetector): void {
  detectors.push(detector);
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run src/test/sourceRegistry.test.ts
```
Expected: all 5 PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/data/sourceRegistry.ts src/test/sourceRegistry.test.ts
git commit -m "feat(data): add extensible source detection registry"
```

---

## Task 3: COBB Column Map

**Files:**
- Create: `src/lib/data/cobbColumnMap.ts`

No tests needed — this is a pure data mapping table verified by the parser tests in Task 4.

- [ ] **Step 1: Create `src/lib/data/cobbColumnMap.ts`**

> **NOTE on degree symbols:** COBB CSVs exported from certain OS/locale configurations contain `\ufffd` (UTF-8 replacement character) instead of `\u00b0` (°) in header names. The parser in Task 4 normalizes all non-ASCII characters in headers to `\ufffd` before lookup, so the keys here use `\ufffd`.

> **NOTE on AC Compressor Sw:** The data column contains the strings `"on"` and `"off"`, not numbers. The parser handles this with a special pre-convert step — `acCompressorSw` does NOT use a numeric `transform` here.

```typescript
/**
 * Maps COBB Accessport CSV column header strings to OBD2DataPoint field names.
 * Optional `transform` converts the raw number value before storing.
 * Keys use \ufffd (replacement character) for degree symbols to match actual COBB CSV encoding.
 */
export interface CobbColumnMapping {
  field: string;
  transform?: (value: number) => number;
}

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
  "Accel Position (%)":               { field: "throttlePosition" },
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
```

- [ ] **Step 2: Run type-check**

```bash
npm run type-check
```
Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add src/lib/data/cobbColumnMap.ts
git commit -m "feat(data): add COBB column→field mapping table with unit transforms"
```

---

## Task 4: COBB Parser

**Files:**
- Create: `src/lib/data/cobbParser.ts`
- Create: `src/test/cobbParser.test.ts`

- [ ] **Step 1: Write failing tests** — create `src/test/cobbParser.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { parseCobbFile, extractCobbMetadata } from "@/lib/data/cobbParser";

// All numeric values use ASCII hyphen-minus (-), not Unicode minus (U+2212).
const COBB_WITH_AP_INFO = `Time (sec),RPM (RPM),Vehicle Speed (mph),Boost (psi),Battery Volts (V),Coolant Temp (C),AC Compressor Sw (on/off),"AP Info:[AP3-SUB-006 v1.7.5.0-25910][2023 USDM WRX MT][Reflash: Stage1 93 v310.ptm]"
0.000,1098,10,-10.67,14.30,94,off,0
0.021,1089,10,-10.60,14.22,94,on,0
`;

const COBB_TWO_ROWS = `Time (sec),RPM (RPM),Vehicle Speed (mph),Boost (psi),Coolant Temp (C)
0.000,1098,10,-10.67,94
1.000,2500,30,5.5,95
`;

describe("parseCobbFile", () => {
  it("returns OBD2DataPoints with timestamp from Time (sec)", () => {
    const { dataPoints } = parseCobbFile(COBB_TWO_ROWS);
    expect(dataPoints[0].timestamp).toBe(0);
    expect(dataPoints[1].timestamp).toBe(1);
  });

  it("maps RPM column to engineRpm field", () => {
    const { dataPoints } = parseCobbFile(COBB_TWO_ROWS);
    expect(dataPoints[0].engineRpm).toBe(1098);
  });

  it("converts Vehicle Speed from mph to km/h", () => {
    const { dataPoints } = parseCobbFile(COBB_TWO_ROWS);
    // 10 mph × 1.60934 = 16.09
    expect(dataPoints[0].vehicleSpeed).toBeCloseTo(16.09, 1);
  });

  it("maps Boost column to boostPsi field", () => {
    const { dataPoints } = parseCobbFile(COBB_TWO_ROWS);
    expect(dataPoints[0].boostPsi).toBe(-10.67);
    expect(dataPoints[1].boostPsi).toBe(5.5);
  });

  it("maps Coolant Temp to coolantTemp field", () => {
    const { dataPoints } = parseCobbFile(COBB_TWO_ROWS);
    expect(dataPoints[0].coolantTemp).toBe(94);
  });

  it("converts AC Compressor Sw 'off'→0 and 'on'→1", () => {
    const { dataPoints } = parseCobbFile(COBB_WITH_AP_INFO);
    expect(dataPoints[0].acCompressorSw).toBe(0); // "off"
    expect(dataPoints[1].acCompressorSw).toBe(1); // "on"
  });

  it("extracts AP Info metadata through parseCobbFile", () => {
    const { metadata } = parseCobbFile(COBB_WITH_AP_INFO);
    expect(metadata.apVersion).toBe("AP3-SUB-006 v1.7.5.0-25910");
    expect(metadata.vehicle).toBe("2023 USDM WRX MT");
    expect(metadata.tune).toBe("Reflash: Stage1 93 v310.ptm");
  });

  it("skips unknown columns silently", () => {
    const csv = `Time (sec),RPM (RPM),Unknown Column
0.000,1098,999
`;
    const { dataPoints } = parseCobbFile(csv);
    expect(dataPoints[0].engineRpm).toBe(1098);
    expect((dataPoints[0] as Record<string, unknown>)["Unknown Column"]).toBeUndefined();
  });

  it("throws if first column is not Time (sec)", () => {
    const bad = `Seconds,RPM (RPM)
0.000,1098
`;
    expect(() => parseCobbFile(bad)).toThrow();
  });

  it("throws if fewer than 2 rows", () => {
    expect(() => parseCobbFile(`Time (sec),RPM (RPM)`)).toThrow();
  });
});

describe("extractCobbMetadata", () => {
  it("extracts AP version, vehicle, and tune from AP Info column header", () => {
    const header = `AP Info:[AP3-SUB-006 v1.7.5.0-25910][2023 USDM WRX MT][Reflash: Stage1 93 v310.ptm]`;
    const meta = extractCobbMetadata(header);
    expect(meta.apVersion).toBe("AP3-SUB-006 v1.7.5.0-25910");
    expect(meta.vehicle).toBe("2023 USDM WRX MT");
    expect(meta.tune).toBe("Reflash: Stage1 93 v310.ptm");
  });

  it("returns empty object for non-AP Info string", () => {
    const meta = extractCobbMetadata("some other column");
    expect(meta).toEqual({});
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run src/test/cobbParser.test.ts
```
Expected: FAIL — module not found

- [ ] **Step 3: Implement `src/lib/data/cobbParser.ts`**

```typescript
import { OBD2DataPoint, CobbMetadata } from "@/types";
import {
  COBB_COLUMN_MAP,
  COBB_AP_INFO_PATTERN,
  COBB_STRING_COLUMNS,
  COBB_STRING_COLUMN_FIELDS,
} from "./cobbColumnMap";

export interface CobbParseResult {
  dataPoints: OBD2DataPoint[];
  metadata: CobbMetadata;
}

/**
 * Normalize a COBB CSV header: replace all non-ASCII characters with \ufffd.
 * COBB CSVs may be saved with broken encoding where ° becomes the UTF-8
 * replacement character \ufffd. Normalize to \ufffd for consistent map lookup.
 */
function normalizeHeader(h: string): string {
  // eslint-disable-next-line no-control-regex
  return h.replace(/[^\x00-\x7F]/g, "\ufffd");
}

/**
 * Extract CobbMetadata from an AP Info column header string.
 * Format: "AP Info:[apVersion][vehicle][tune]"
 */
export function extractCobbMetadata(apInfoHeader: string): CobbMetadata {
  if (!COBB_AP_INFO_PATTERN.test(apInfoHeader)) return {};
  const matches = apInfoHeader.match(/\[([^\]]+)\]/g);
  if (!matches) return {};
  return {
    apVersion: matches[0]?.slice(1, -1),
    vehicle: matches[1]?.slice(1, -1),
    tune: matches[2]?.slice(1, -1),
  };
}

/**
 * Parse COBB Accessport wide-form CSV into OBD2DataPoint array.
 * Each row becomes one data point; columns are mapped via COBB_COLUMN_MAP.
 * Vehicle Speed is converted from mph to km/h.
 * AC Compressor Sw "on"/"off" strings are converted to 1/0.
 * Header degree symbols are normalized to \ufffd before lookup.
 */
export function parseCobbFile(csvText: string): CobbParseResult {
  const lines = csvText.trim().split("\n");
  if (lines.length < 2) {
    throw new Error("COBB CSV file is empty or has no data rows");
  }

  // Parse headers — COBB uses comma delimiter, may have quoted fields
  const rawHeaders = parseCobbLine(lines[0]);

  if (!rawHeaders[0]?.trim().startsWith("Time (sec)")) {
    throw new Error(
      `Invalid COBB CSV: first column must be "Time (sec)", got "${rawHeaders[0]}"`
    );
  }

  // Find AP Info column index and extract metadata
  const apInfoIdx = rawHeaders.findIndex((h) => COBB_AP_INFO_PATTERN.test(h.trim()));
  const metadata: CobbMetadata =
    apInfoIdx >= 0 ? extractCobbMetadata(rawHeaders[apInfoIdx].trim()) : {};

  // Build index → field mapping (skip Time (sec) at 0, skip AP Info)
  // Normalize headers for degree-symbol encoding before map lookup
  const numericMappings: Array<{ index: number; field: string; transform?: (v: number) => number }> = [];
  const stringMappings: Array<{ index: number; field: string; valueMap: Record<string, number> }> = [];

  for (let i = 1; i < rawHeaders.length; i++) {
    if (i === apInfoIdx) continue;
    const rawHeader = rawHeaders[i].trim();
    const normHeader = normalizeHeader(rawHeader);

    // Check string-value columns first (e.g. AC Compressor Sw "on"/"off")
    const stringValueMap = COBB_STRING_COLUMNS[rawHeader] ?? COBB_STRING_COLUMNS[normHeader];
    const stringField = COBB_STRING_COLUMN_FIELDS[rawHeader] ?? COBB_STRING_COLUMN_FIELDS[normHeader];
    if (stringValueMap && stringField) {
      stringMappings.push({ index: i, field: stringField, valueMap: stringValueMap });
      continue;
    }

    // Regular numeric columns — try normalized header, then raw
    const mapping = COBB_COLUMN_MAP[normHeader] ?? COBB_COLUMN_MAP[rawHeader];
    if (mapping) {
      numericMappings.push({ index: i, field: mapping.field, transform: mapping.transform });
    }
  }

  const dataPoints: OBD2DataPoint[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const fields = parseCobbLine(line);
    const timestampStr = fields[0]?.trim();
    const timestamp = parseFloat(timestampStr ?? "");
    if (isNaN(timestamp)) continue;

    const point: OBD2DataPoint = { timestamp };

    for (const { index, field, transform } of numericMappings) {
      const raw = fields[index]?.trim();
      if (!raw || raw === "") continue;
      const parsed = parseFloat(raw);
      if (isNaN(parsed)) continue;
      const value = transform ? transform(parsed) : parsed;
      (point as unknown as Record<string, number>)[field] = value;
    }

    for (const { index, field, valueMap } of stringMappings) {
      const raw = fields[index]?.trim().toLowerCase();
      if (raw !== undefined && raw in valueMap) {
        (point as unknown as Record<string, number>)[field] = valueMap[raw];
      }
    }

    dataPoints.push(point);
  }

  if (dataPoints.length === 0) {
    throw new Error("No valid data rows found in COBB CSV");
  }

  return { dataPoints, metadata };
}

/**
 * Split a comma-delimited COBB CSV line respecting quoted fields.
 */
function parseCobbLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run src/test/cobbParser.test.ts
```
Expected: all 9 PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/data/cobbParser.ts src/test/cobbParser.test.ts
git commit -m "feat(data): add COBB wide-form CSV parser with mph→km/h conversion"
```

---

## Task 5: COBB Analyzer

**Files:**
- Create: `src/lib/data/cobbAnalyzer.ts`
- Create: `src/test/cobbAnalyzer.test.ts`

- [ ] **Step 1: Write failing tests** — create `src/test/cobbAnalyzer.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import {
  analyzeCobbBoost,
  analyzeCobbKnock,
  analyzeCobbAFR,
  analyzeCobbWastegate,
  analyzeCobbInjector,
  analyzeCobbAVCS,
  analyzeCobbData,
} from "@/lib/data/cobbAnalyzer";
import { OBD2DataPoint } from "@/types";

function makePoints(overrides: Partial<OBD2DataPoint>[]): OBD2DataPoint[] {
  return overrides.map((o, i) => ({ timestamp: i, ...o }));
}

describe("analyzeCobbBoost", () => {
  it("calculates avg and max boost", () => {
    const points = makePoints([
      { boostPsi: 5.0 },
      { boostPsi: 10.0 },
      { boostPsi: 15.0 },
    ]);
    const result = analyzeCobbBoost(points);
    expect(result.avgBoostPsi).toBeCloseTo(10.0);
    expect(result.maxBoostPsi).toBe(15.0);
  });

  it("returns null for missing boost data", () => {
    const result = analyzeCobbBoost(makePoints([{ engineRpm: 1000 }]));
    expect(result.avgBoostPsi).toBeNull();
    expect(result.maxBoostPsi).toBeNull();
  });
});

describe("analyzeCobbKnock", () => {
  it("counts knock EVENTS by edge transition, not sample count", () => {
    // 2 separate events: one at samples 1-2, another at sample 4
    // (sample 3 at -0.3 is above threshold — resets the event state)
    const points = makePoints([
      { feedbackKnock: 0.0, dam: 1.0 },   // no knock
      { feedbackKnock: -1.5, dam: 0.875 }, // event 1 starts
      { feedbackKnock: -1.2, dam: 0.875 }, // event 1 continues (NOT a new event)
      { feedbackKnock: -0.3, dam: 1.0 },   // above threshold — event 1 ends
      { feedbackKnock: -2.0, dam: 0.75 },  // event 2 starts
    ]);
    const result = analyzeCobbKnock(points);
    expect(result.knockEventCount).toBe(2); // 2 events, not 3 samples
    expect(result.minDAM).toBe(0.75);
  });

  it("returns 0 knock events with clean data", () => {
    const points = makePoints([{ feedbackKnock: 0.0, dam: 1.0 }]);
    const result = analyzeCobbKnock(points);
    expect(result.knockEventCount).toBe(0);
  });
});

describe("analyzeCobbAFR", () => {
  it("calculates AFR deviation from target", () => {
    const points = makePoints([
      { afSens1Ratio: 14.7, clFuelTarget: 14.7 },
      { afSens1Ratio: 15.2, clFuelTarget: 14.7 },
      { afSens1Ratio: 14.1, clFuelTarget: 14.7 },
    ]);
    const result = analyzeCobbAFR(points);
    expect(result.avgAFRDeviation).toBeCloseTo(0.33, 1);
    expect(result.maxAFRDeviation).toBeCloseTo(0.6, 1);
  });
});

describe("analyzeCobbWastegate", () => {
  it("calculates avg and max wastegate position", () => {
    const points = makePoints([
      { wastegateActualPosMm: 10.0, wastegateCommFinalPosMm: 11.0 },
      { wastegateActualPosMm: 12.0, wastegateCommFinalPosMm: 11.5 },
    ]);
    const result = analyzeCobbWastegate(points);
    expect(result.avgWastegateActualMm).toBe(11.0);
    expect(result.maxWastegateActualMm).toBe(12.0);
  });
});

describe("analyzeCobbInjector", () => {
  it("counts fuel cut events", () => {
    const points = makePoints([
      { injDutyCycle: 50, injPulseWidth: 2.0, fuelCut: 0 },
      { injDutyCycle: 0, injPulseWidth: 0, fuelCut: 4 },
      { injDutyCycle: 0, injPulseWidth: 0, fuelCut: 4 },
    ]);
    const result = analyzeCobbInjector(points);
    expect(result.fuelCutEventCount).toBe(2);
    expect(result.maxInjDutyCycle).toBe(50);
  });
});

describe("analyzeCobbAVCS", () => {
  it("calculates avg AVCS positions", () => {
    const points = makePoints([
      { avcsInLeft: -15, avcsExhLeft: 1 },
      { avcsInLeft: -16, avcsExhLeft: 2 },
    ]);
    const result = analyzeCobbAVCS(points);
    expect(result.avgAvcsInLeft).toBe(-15.5);
    expect(result.avgAvcsExhLeft).toBe(1.5);
  });
});

describe("analyzeCobbData", () => {
  it("returns all 6 metric categories", () => {
    const points = makePoints([{ engineRpm: 2000 }]);
    const result = analyzeCobbData(points);
    expect(result).toHaveProperty("boost");
    expect(result).toHaveProperty("knock");
    expect(result).toHaveProperty("afr");
    expect(result).toHaveProperty("wastegate");
    expect(result).toHaveProperty("injector");
    expect(result).toHaveProperty("avcs");
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run src/test/cobbAnalyzer.test.ts
```
Expected: FAIL — module not found

- [ ] **Step 3: Implement `src/lib/data/cobbAnalyzer.ts`**

```typescript
import {
  OBD2DataPoint,
  CobbAnalysisResult,
  CobbBoostMetrics,
  CobbKnockMetrics,
  CobbAFRMetrics,
  CobbWastegateMetrics,
  CobbInjectorMetrics,
  CobbAVCSMetrics,
} from "@/types";

// ── Utility (mirrors obd2Analyzer.ts) ──

function extractValues(points: OBD2DataPoint[], field: keyof OBD2DataPoint): number[] {
  return points.flatMap((p) => {
    const v = p[field];
    return typeof v === "number" ? [v] : [];
  });
}

function avg(values: number[]): number | null {
  if (values.length === 0) return null;
  return Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 100) / 100;
}

function max(values: number[]): number | null {
  return values.length === 0 ? null : Math.round(Math.max(...values) * 100) / 100;
}

function min(values: number[]): number | null {
  return values.length === 0 ? null : Math.round(Math.min(...values) * 100) / 100;
}

// ── Category analyzers ──

export function analyzeCobbBoost(points: OBD2DataPoint[]): CobbBoostMetrics {
  const boost = extractValues(points, "boostPsi");
  const target = extractValues(points, "targetBoostFinalRelPsi");
  const error = extractValues(points, "tdBoostErrorPsi");
  return {
    avgBoostPsi: avg(boost),
    maxBoostPsi: max(boost),
    avgTargetBoostPsi: avg(target),
    maxTargetBoostPsi: max(target),
    avgBoostErrorPsi: avg(error),
    maxBoostErrorPsi: max(error),
  };
}

export function analyzeCobbKnock(points: OBD2DataPoint[]): CobbKnockMetrics {
  const fbKnock = extractValues(points, "feedbackKnock");
  const fineKnock = extractValues(points, "fineKnockLearn");
  const damValues = extractValues(points, "dam");

  // Count knock EVENTS by counting leading edges (transitions into knock state).
  // COBB logs at ~50Hz; a sustained knock retard produces many consecutive negative rows.
  // Counting raw samples would inflate the count by 50x compared to actual events.
  const KNOCK_THRESHOLD = -0.5;
  let knockEventCount = 0;
  let inKnockEvent = false;
  for (const v of fbKnock) {
    if (v < KNOCK_THRESHOLD) {
      if (!inKnockEvent) {
        knockEventCount++;
        inKnockEvent = true;
      }
    } else {
      inKnockEvent = false;
    }
  }

  return {
    knockEventCount,
    avgFeedbackKnock: avg(fbKnock),
    minFeedbackKnock: min(fbKnock),
    avgFineKnockLearn: avg(fineKnock),
    minFineKnockLearn: min(fineKnock),
    avgDAM: avg(damValues),
    minDAM: min(damValues),
  };
}

export function analyzeCobbAFR(points: OBD2DataPoint[]): CobbAFRMetrics {
  const afr = extractValues(points, "afSens1Ratio");
  const target = extractValues(points, "clFuelTarget");
  const corr1 = extractValues(points, "afCorrection1");
  const learn1 = extractValues(points, "afLearning1");

  // Compute per-point AFR deviation where both AFR and target exist
  const deviations: number[] = [];
  for (const p of points) {
    const a = p.afSens1Ratio;
    const t = p.clFuelTarget;
    if (typeof a === "number" && typeof t === "number") {
      deviations.push(Math.abs(a - t));
    }
  }

  return {
    avgAFR: avg(afr),
    avgAFRTarget: avg(target),
    avgAFRDeviation: avg(deviations),
    maxAFRDeviation: max(deviations),
    avgAFCorrection1: avg(corr1),
    avgAFLearning1: avg(learn1),
  };
}

export function analyzeCobbWastegate(points: OBD2DataPoint[]): CobbWastegateMetrics {
  const actual = extractValues(points, "wastegateActualPosMm");
  const target = extractValues(points, "wastegateCommFinalPosMm");

  const errors: number[] = [];
  for (const p of points) {
    const a = p.wastegateActualPosMm;
    const t = p.wastegateCommFinalPosMm;
    if (typeof a === "number" && typeof t === "number") {
      errors.push(a - t);
    }
  }

  return {
    avgWastegateActualMm: avg(actual),
    maxWastegateActualMm: max(actual),
    avgWastegateTargetMm: avg(target),
    avgWastegateErrorMm: avg(errors),
  };
}

export function analyzeCobbInjector(points: OBD2DataPoint[]): CobbInjectorMetrics {
  const duty = extractValues(points, "injDutyCycle");
  const pw = extractValues(points, "injPulseWidth");
  const fuelCutEvents = points.filter((p) => typeof p.fuelCut === "number" && p.fuelCut > 0);

  return {
    avgInjDutyCycle: avg(duty),
    maxInjDutyCycle: max(duty),
    avgInjPulseWidthMs: avg(pw),
    maxInjPulseWidthMs: max(pw),
    fuelCutEventCount: fuelCutEvents.length,
  };
}

export function analyzeCobbAVCS(points: OBD2DataPoint[]): CobbAVCSMetrics {
  const exh = extractValues(points, "avcsExhLeft");
  const intake = extractValues(points, "avcsInLeft");

  return {
    avgAvcsExhLeft: avg(exh),
    maxAvcsExhLeft: max(exh),
    avgAvcsInLeft: avg(intake),
    maxAvcsInLeft: max(intake),
  };
}

export function analyzeCobbData(points: OBD2DataPoint[]): CobbAnalysisResult {
  return {
    boost: analyzeCobbBoost(points),
    knock: analyzeCobbKnock(points),
    afr: analyzeCobbAFR(points),
    wastegate: analyzeCobbWastegate(points),
    injector: analyzeCobbInjector(points),
    avcs: analyzeCobbAVCS(points),
  };
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run src/test/cobbAnalyzer.test.ts
```
Expected: all 8 PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/data/cobbAnalyzer.ts src/test/cobbAnalyzer.test.ts
git commit -m "feat(data): add COBB analyzer for boost, knock, AFR, wastegate, injector, AVCS"
```

---

## Task 6: API Route Update

**Files:**
- Modify: `src/app/api/analyze/route.ts`

- [ ] **Step 1: Update the route to detect source and branch to correct parser/analyzer** — replace the file content:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { parseOBD2File } from "@/lib/data/obd2Parser";
import { parseCobbFile } from "@/lib/data/cobbParser";
import { analyzeOBD2Data } from "@/lib/data/obd2Analyzer";
import { analyzeCobbData } from "@/lib/data/cobbAnalyzer";
import { validateFileFormat } from "@/lib/data/obd2Validators";
import { detectDataSource } from "@/lib/data/sourceRegistry";
import { parseGPSData } from "@/lib/data/gpsParser";
import { computeDerivedMetrics } from "@/lib/data/deriveMetrics";
import { downsampleTimeSeries, downsampleGPS } from "@/lib/data/downsample";
import { IMPREZA_RS_THRESHOLDS } from "@/lib/data/thresholds";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const MAX_FILE_SIZE = 10 * 1024 * 1024;
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 10MB." },
        { status: 413 }
      );
    }

    const format = validateFileFormat(file.name);
    if (!format) {
      return NextResponse.json(
        { error: "Invalid file format. Only CSV files (.csv) are supported." },
        { status: 400 }
      );
    }

    const fileContent = await file.text();
    const dataSource = detectDataSource(fileContent);

    if (dataSource === "unknown") {
      return NextResponse.json(
        {
          error: "Unrecognized CSV format. Supported formats: OBD2 (semicolon-delimited long-form), COBB Accessport (comma-delimited wide-form).",
        },
        { status: 400 }
      );
    }

    let dataPoints;
    let cobbResult;
    let cobbMetadata;

    if (dataSource === "cobb") {
      const parsed = parseCobbFile(fileContent);
      dataPoints = parsed.dataPoints;
      cobbMetadata = parsed.metadata;
      cobbResult = analyzeCobbData(dataPoints);
    } else {
      dataPoints = parseOBD2File(fileContent);
    }

    // GPS parsing is called for all sources. COBB files have no GPS columns
    // so this returns an empty array — GPS panels will simply not render.
    const gpsData = parseGPSData(fileContent);
    const result = analyzeOBD2Data(dataPoints);
    const derived = computeDerivedMetrics(dataPoints);
    const timeSeries = downsampleTimeSeries(dataPoints);
    const gps = downsampleGPS(gpsData);

    return NextResponse.json({
      success: true,
      result,
      timeSeries,
      gps,
      derived,
      thresholds: IMPREZA_RS_THRESHOLDS,
      dataSource,
      ...(cobbResult && { cobbResult }),
      ...(cobbMetadata && { cobbMetadata }),
    });
  } catch (error) {
    console.error("Analysis error:", error);
    return NextResponse.json(
      {
        error: "Failed to analyze data",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
```

- [ ] **Step 2: Run type-check and lint**

```bash
npm run type-check && npm run lint
```
Expected: no errors

- [ ] **Step 3: Manual smoke test** — start dev server and upload `input/cobb_datalog2.csv`; verify response JSON includes `"dataSource": "cobb"` and `cobbResult` with boost/knock/AFR/wastegate/injector/avcs keys.

```bash
npm run dev
# In another terminal:
curl -s -X POST http://localhost:3000/api/analyze \
  -F "file=@input/cobb_datalog2.csv" | npx json dataSource cobbResult.boost.maxBoostPsi
```
Expected: `"cobb"` and a numeric psi value

- [ ] **Step 4: Commit**

```bash
git add src/app/api/analyze/route.ts
git commit -m "feat(api): detect data source, route COBB files to COBB parser+analyzer"
```

---

## Task 7: Dashboard — COBB Chart Panels

**Files:**
- Modify: `src/components/features/DashboardView.tsx`

This task adds 6 conditional chart panels. Read `DashboardView.tsx` fully before editing to understand the existing chart pattern (TimeSeriesChart + panel layout). The approach: extract a `CobbPanels` component that renders only when `dataSource === 'cobb'` and the relevant data is present.

**`CobbPanels` component signature** (define this as a named component in `DashboardView.tsx` or a separate file):

```typescript
import { OBD2DataPoint, CobbAnalysisResult, CobbMetadata, ThresholdConfig } from "@/types";

interface CobbPanelsProps {
  timeSeries: OBD2DataPoint[];
  cobbResult: CobbAnalysisResult;
  cobbMetadata?: CobbMetadata;
  startTime: number;
  thresholds: ThresholdConfig;
}

function CobbPanels({ timeSeries, cobbResult, cobbMetadata, startTime, thresholds }: CobbPanelsProps) {
  // ... 6 chart panels
}
```

- [ ] **Step 1: Write a failing unit test for conditional COBB panel rendering** — add to `src/test/DashboardView.test.tsx`:

```typescript
it("renders COBB panels when dataSource is cobb", async () => {
  // Mock the API response with dataSource: 'cobb' and cobbResult
  // Assert that a COBB-specific panel heading (e.g. "Boost") is present
  // Assert that it is NOT present when dataSource is 'obd2'
  // Follow the existing DashboardView test mock pattern exactly
});
```

> **Note:** Read the existing `DashboardView.test.tsx` to understand how the API response is mocked in this project before writing the test body. The existing tests mock `fetch` or use a specific wrapper — replicate that pattern.

- [ ] **Step 2: Run the new test to verify it fails**

```bash
npx vitest run src/test/DashboardView.test.tsx
```
Expected: new test FAILS

- [ ] **Step 4: Read `DashboardView.tsx` to understand current chart patterns before touching anything**

```bash
# In your editor, read src/components/features/DashboardView.tsx
```

- [ ] **Step 5: Update `DashboardView` to accept and pass `dataSource` and `cobbResult`** — find where the component's props/state is destructured from the API response and add:

```typescript
const dataSource = data.dataSource ?? 'obd2';
const cobbResult = data.cobbResult;
const cobbMetadata = data.cobbMetadata;
```

- [ ] **Step 6: Add a COBB-only panel section** — after the existing category panels, add conditionally:

```tsx
{dataSource === 'cobb' && cobbResult && (
  <CobbPanels
    timeSeries={timeSeries}
    cobbResult={cobbResult}
    cobbMetadata={cobbMetadata}
    startTime={result.startTime}
    thresholds={thresholds}
  />
)}
```

- [ ] **Step 7: Implement 6 chart panels in the CobbPanels section** — each panel follows the existing `TimeSeriesChart` + metric card pattern:

**Chart 1 — Boost Curve:**
```tsx
// Traces: boostPsi (actual) + targetBoostFinalRelPsi (target) + tdBoostErrorPsi (error, y2)
traces={[
  { field: "boostPsi", name: "Boost (psi)", color: "#3b82f6" },
  { field: "targetBoostFinalRelPsi", name: "Target (psi)", color: "#10b981", mode: "lines" },
  { field: "tdBoostErrorPsi", name: "Error (psi)", color: "#f59e0b", yaxis: "y2" },
]}
```

**Chart 2 — Knock Events:**
```tsx
// Traces: feedbackKnock + fineKnockLearn + dam (y2, 0-1 scale)
traces={[
  { field: "feedbackKnock", name: "Feedback Knock (°)", color: "#ef4444" },
  { field: "fineKnockLearn", name: "Fine Knock Learn (°)", color: "#f97316" },
  { field: "dam", name: "DAM", color: "#a855f7", yaxis: "y2" },
]}
```

**Chart 3 — AFR vs Target:**
```tsx
// Traces: afSens1Ratio + clFuelTarget (target dashed line)
traces={[
  { field: "afSens1Ratio", name: "AFR", color: "#06b6d4" },
  { field: "clFuelTarget", name: "Target AFR", color: "#6366f1", mode: "lines" },
]}
```

**Chart 4 — Wastegate Position:**
```tsx
// Traces: wastegateActualPosMm + wastegateCommFinalPosMm (commanded)
traces={[
  { field: "wastegateActualPosMm", name: "Actual (mm)", color: "#84cc16" },
  { field: "wastegateCommFinalPosMm", name: "Commanded (mm)", color: "#14b8a6", mode: "lines" },
]}
```

**Chart 5 — Injector:**
```tsx
// Traces: injDutyCycle + injPulseWidth (y2)
traces={[
  { field: "injDutyCycle", name: "Duty Cycle (%)", color: "#f59e0b" },
  { field: "injPulseWidth", name: "Pulse Width (ms)", color: "#ec4899", yaxis: "y2" },
]}
```

**Chart 6 — AVCS Cam Timing:**
```tsx
// Traces: avcsInLeft + avcsExhLeft
traces={[
  { field: "avcsInLeft", name: "Intake (°)", color: "#8b5cf6" },
  { field: "avcsExhLeft", name: "Exhaust (°)", color: "#14b8a6" },
]}
```

- [ ] **Step 8: Display CobbMetadata if present** — show vehicle/tune info as a small badge or subtitle near the top of the COBB panels section:

```tsx
{cobbMetadata?.vehicle && (
  <p className="text-sm text-muted-foreground font-mono">
    {cobbMetadata.vehicle}{cobbMetadata.tune ? ` · ${cobbMetadata.tune}` : ''}
  </p>
)}
```

- [ ] **Step 9: Run type-check and lint**

```bash
npm run type-check && npm run lint
```
Expected: no errors

- [ ] **Step 10: Run DashboardView tests to verify new test passes**

```bash
npx vitest run src/test/DashboardView.test.tsx
```
Expected: all tests PASS including the new COBB conditional-render test

- [ ] **Step 11: Manual verification** — upload COBB file in the app, confirm 6 new chart panels appear below existing OBD2 panels; upload an OBD2 file, confirm new panels are absent.

- [ ] **Step 12: Commit**

```bash
git add src/components/features/DashboardView.tsx src/test/DashboardView.test.tsx
git commit -m "feat(dashboard): add 6 COBB-specific chart panels (boost, knock, AFR, wastegate, injector, AVCS)"
```

---

## Task 8: Final Verification

- [ ] Run full test suite:

```bash
npx vitest run
```
Expected: all existing tests still pass + new COBB tests pass

- [ ] Run type-check:

```bash
npm run type-check
```
Expected: no errors

- [ ] Upload `input/cobb_datalog2.csv` in the live dev app and verify all 6 panels render with data

- [ ] Upload an existing OBD2 file and verify no regression (all existing panels still work, COBB panels absent)

- [ ] Final commit (if any cleanup):

```bash
git add -p
git commit -m "chore: final cleanup for COBB support"
```
