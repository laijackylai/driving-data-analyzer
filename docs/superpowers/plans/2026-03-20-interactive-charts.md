# Interactive Charts & GPS Map Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add 30+ interactive Plotly charts and a Leaflet GPS route map to the OBD2 dashboard with linked brushing, 2024 Impreza RS thresholds, and metric tooltips.

**Architecture:** Server-side: extend API to return time-series data, GPS points, derived metrics, and thresholds. Client-side: generic chart components (TimeSeriesChart, ScatterChart, etc.) consumed by 10 tab components, coordinated via a shared useTimeRange hook for linked brushing. Plotly and Leaflet dynamically imported to avoid SSR issues.

**Tech Stack:** Next.js 16, React 19, TypeScript strict, Tailwind CSS 3, react-plotly.js + plotly.js-basic-dist-min, react-leaflet + leaflet, CartoDB Dark Matter tiles (free OSM).

**Spec:** `docs/superpowers/specs/2026-03-20-interactive-charts-design.md`

---

## Chunk 1: Foundation — Types, Thresholds, Tooltips, Design Tokens

### Task 1: Install dependencies

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install charting and map libraries**

Run:
```bash
npm install react-plotly.js plotly.js-basic-dist-min react-leaflet leaflet
npm install -D @types/leaflet @types/react-plotly.js @types/plotly.js
```

- [ ] **Step 2: Verify install succeeds and types resolve**

Run: `npm run type-check`
Expected: PASS (no new errors — the packages aren't imported yet)

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "feat: install plotly.js, react-leaflet, and leaflet dependencies"
```

---

### Task 2: Add new types to `src/types/index.ts`

**Files:**
- Modify: `src/types/index.ts`

- [ ] **Step 1: Add GPSDataPoint, DerivedMetrics, ThresholdConfig, MetricTooltip, ExtendedAnalysisResponse types**

Append after the existing `UploadedFile` interface:

```ts
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

// ── Metric Tooltips ──

export interface MetricTooltipContent {
  what: string;
  good: string;
  bad: string;
  lookFor: string;
}

// ── Extended API Response ──

export interface ExtendedAnalysisResponse {
  success: true;
  result: OBD2AnalysisResult;
  timeSeries: OBD2DataPoint[];
  gps: GPSDataPoint[];
  derived: DerivedMetrics;
  thresholds: ThresholdConfig;
}
```

- [ ] **Step 2: Verify types compile**

Run: `npm run type-check`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/types/index.ts
git commit -m "feat: add types for GPS, derived metrics, thresholds, and extended API response"
```

---

### Task 3: Create threshold config

**Files:**
- Create: `src/lib/data/thresholds.ts`

- [ ] **Step 1: Write threshold config for 2024 Impreza RS**

```ts
import { ThresholdConfig } from "@/types";

/**
 * 2024 Subaru Impreza RS threshold configuration.
 * Engine: 2.5L FB25 naturally aspirated boxer. Redline 6200 RPM.
 * Transmission: Lineartronic CVT.
 * Drivetrain: Symmetrical AWD.
 */
export const IMPREZA_RS_THRESHOLDS: ThresholdConfig = {
  engineRpm: {
    normal: [0, 5000],
    warning: [5000, 6000],
    danger: [6000, 8000],
  },
  coolantTemp: {
    normal: [80, 100],
    warning: [100, 108],
    danger: [108, 150],
  },
  oilTemp: {
    normal: [80, 110],
    warning: [110, 125],
    danger: [125, 180],
  },
  cvtTemp: {
    normal: [60, 100],
    warning: [100, 120],
    danger: [120, 180],
  },
  batteryVoltage: {
    normal: [13.8, 14.6],
    warning: [[12.5, 13.8], [14.6, 15.0]],
    danger: [[0, 12.5], [15.0, 20.0]],
  },
  calculatedBoost: {
    normal: [-0.8, -0.2],
    warning: [-0.2, 0],
    danger: [0, 2],
  },
  knockCorrection: {
    normal: [-1, 0],
    warning: [-3, -1],
    danger: [-20, -3],
  },
  shortTermFuelTrim: {
    normal: [-5, 5],
    warning: [[-10, -5], [5, 10]],
    danger: [[-50, -10], [10, 50]],
  },
  longTermFuelTrim: {
    normal: [-5, 5],
    warning: [[-8, -5], [5, 8]],
    danger: [[-50, -8], [8, 50]],
  },
  mafAirFlowRate: {
    normal: [2, 40],
    warning: [40, 50],
    danger: [50, 100],
  },
};
```

- [ ] **Step 2: Verify types compile**

Run: `npm run type-check`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/lib/data/thresholds.ts
git commit -m "feat: add 2024 Impreza RS threshold configuration"
```

---

### Task 4: Create metric tooltips

**Files:**
- Create: `src/lib/data/metricTooltips.ts`

- [ ] **Step 1: Write all metric tooltip content**

Create the file with a `Record<string, MetricTooltipContent>` containing all tooltip entries from the spec (Engine RPM, Engine Load, Coolant Temperature, Oil Temperature, Timing Advance, Knock Correction, MAF Air Flow Rate, Intake Vacuum, Intake Air Temperature, Manifold Pressure, Throttle Position, Short-Term Fuel Trim, Long-Term Fuel Trim, Fuel/Air Equivalence Ratio, Instant Fuel Consumption, Power from MAF, Vehicle Speed, Vehicle Acceleration, CVT Temperature, Actual vs Target Gear Ratio, Primary/Secondary Pulley Speed, Lock-Up Duty Ratio, Wheel Speeds, Front-Rear Wheel Speed Differential, Left-Right Wheel Speed Differential, Steering Angle, AWD Solenoid Current, Battery Voltage).

Keys should match the camelCase field names from `OBD2DataPoint` (e.g., `engineRpm`, `coolantTemp`, `batteryVoltage`). For derived metrics use descriptive keys (e.g., `frontRearDiff`, `leftRightDiff`, `cvtEffectiveRatio`).

```ts
import { MetricTooltipContent } from "@/types";

export const METRIC_TOOLTIPS: Record<string, MetricTooltipContent> = {
  engineRpm: {
    what: "How fast the engine crankshaft is spinning. Higher RPM = more power but more wear and fuel usage.",
    good: "700-800 idle, 1500-3500 cruising. The FB25 is most efficient around 2000-2500 RPM.",
    bad: "Sustained >5000 RPM accelerates wear. >6000 is near redline (6200).",
    lookFor: "RPM that won't drop at idle (vacuum leak), sudden spikes without throttle input (transmission slip).",
  },
  engineLoad: {
    what: "How hard the engine is working as a percentage of its maximum capacity.",
    good: "15-30% cruising on flat road, 40-60% moderate acceleration.",
    bad: "Sustained >80% without heavy acceleration or hill climbing.",
    lookFor: "High load at low speed (dragging brakes, low tire pressure), load that never drops below 20% at idle (sensor issue).",
  },
  coolantTemp: {
    what: "Temperature of the liquid cooling your engine. The thermostat regulates this to an optimal range.",
    good: "80-100°C — engine is at normal operating temperature.",
    bad: ">108°C — engine is overheating. Could indicate low coolant, failed thermostat, or radiator blockage.",
    lookFor: "Temp climbing steadily during a drive (cooling degradation), never reaching 80°C (thermostat stuck open), erratic swings (air in cooling system).",
  },
  oilTemp: {
    what: "Temperature of the engine oil. Oil thins as it heats, reducing its protective ability.",
    good: "80-110°C. Oil reaches operating temp slower than coolant — normal to lag behind.",
    bad: ">125°C — oil is breaking down. Risk of accelerated engine wear.",
    lookFor: "Oil temp significantly higher than coolant temp (oil cooler issue), oil temp rising without coolant rising (oil level low).",
  },
  timingAdvance: {
    what: "How early the spark plug fires before the piston reaches top dead center. The ECU adjusts this for optimal power and efficiency.",
    good: "5-25° depending on load and RPM. Higher advance at light load, lower under heavy load.",
    bad: "Very low or negative values sustained (ECU retarding timing due to knock).",
    lookFor: "Sudden drops correlating with knock correction events (engine detecting detonation).",
  },
  knockCorrection: {
    what: "The ECU pulling back ignition timing because it detected engine knock (detonation). Knock damages pistons and bearings.",
    good: "0° — no knock detected.",
    bad: "< -3° — significant knock. Causes include low octane fuel, carbon buildup, or overheating.",
    lookFor: "Consistent knock at specific RPM ranges (carbon buildup), knock only on hot days (heat-related), knock during heavy load (fuel octane too low).",
  },
  mafAirFlowRate: {
    what: "Mass of air entering the engine per second, measured by the Mass Air Flow sensor. The ECU uses this to calculate fuel injection.",
    good: "2-5 g/s at idle, 15-35 g/s cruising, up to 40 g/s at full throttle.",
    bad: ">40 g/s sustained is unusual for the NA FB25. Very low readings at higher RPM suggest a dirty MAF sensor.",
    lookFor: "Readings that don't scale with RPM (dirty or failing MAF), sudden drops to zero (intermittent connection).",
  },
  calculatedBoost: {
    what: "Pressure in the intake manifold relative to atmospheric. On your NA engine, this should always be negative (vacuum).",
    good: "-0.8 to -0.2 bar. Deeper vacuum at idle and light throttle; closer to 0 at wide-open throttle.",
    bad: "Positive values should never occur on an NA engine — indicates a sensor fault.",
    lookFor: "Vacuum that doesn't go deep at idle (vacuum leak), erratic readings (intake gasket leak).",
  },
  intakeAirTemp: {
    what: "Temperature of air entering the engine. Cooler air is denser and makes more power.",
    good: "Roughly ambient temperature to ambient +20°C (heat soak from engine bay).",
    bad: "Extremely hot intake air (>60°C) reduces power and can cause knock.",
    lookFor: "Temp rising significantly during stop-and-go (heat soak), dropping on highway (ram air effect).",
  },
  intakeManifoldPressure: {
    what: "Absolute pressure inside the intake manifold in kPa. Atmospheric is ~101 kPa; engine vacuum pulls this lower.",
    good: "20-40 kPa at idle, 60-80 kPa cruising, 90-100 kPa at wide-open throttle.",
    bad: "High pressure at idle (>50 kPa) suggests a vacuum leak.",
    lookFor: "Pressure that doesn't drop at idle (vacuum leak), pressure that doesn't rise with throttle (clogged intake).",
  },
  throttlePosition: {
    what: "How far the throttle plate is open, as a percentage. Controls how much air enters the engine.",
    good: "0-5% at idle, 10-25% normal driving, 50-100% hard acceleration.",
    bad: "Never reaching 0% at idle (sticky throttle body), erratic at steady state (throttle position sensor issue).",
    lookFor: "Sudden spikes indicate aggressive driving style. Smooth gradients indicate economical driving.",
  },
  shortTermFuelTrim: {
    what: "Real-time adjustment the ECU makes to fuel injection based on oxygen sensor feedback. Positive = adding fuel (lean correction), negative = removing fuel (rich correction).",
    good: "-5% to +5% — small corrections are normal.",
    bad: "> ±10% — the ECU is making large corrections. Lean (positive): vacuum leak, weak fuel pump, clogged injector. Rich (negative): leaking injector, faulty O2 sensor.",
    lookFor: "Consistently positive (lean condition — check for vacuum leaks), consistently negative (rich — check injectors).",
  },
  longTermFuelTrim: {
    what: "The ECU's learned, persistent fuel correction. Represents a sustained deviation from expected fuel needs.",
    good: "-5% to +5%.",
    bad: "> ±8% — the engine has a persistent fuel delivery issue the ECU is compensating for.",
    lookFor: "Gradually drifting over time (wear-related issue like aging O2 sensor), sudden jump (new problem like a cracked vacuum hose).",
  },
  fuelAirRatio: {
    what: "The commanded fuel/air equivalence ratio. A value of 1.0 means stoichiometric (ideal 14.7:1 AFR). The OBD2 PID reports equivalence ratio, not raw AFR.",
    good: "~1.0 during steady-state cruising. Slightly above 1.0 (rich) during hard acceleration. Slightly below 1.0 (lean) during deceleration.",
    bad: "Sustained >1.05 (rich) or <0.95 (lean) at steady cruise — indicates fuel delivery imbalance.",
    lookFor: "Matches with fuel trim data — if both show lean, confirms a real lean condition. Brief rich spikes during acceleration are normal.",
  },
  instantFuelRate: {
    what: "How much fuel the engine is using right now, in litres per hour.",
    good: "0.5-1.0 L/h at idle, 3-8 L/h cruising, up to 15+ L/h at full throttle.",
    bad: "High consumption at idle (>1.5 L/h) may indicate a fuel system issue.",
    lookFor: "Correlate with throttle and speed — high fuel at low throttle suggests efficiency problems.",
  },
  powerFromMaf: {
    what: "Estimated engine power output calculated from the mass air flow rate. Approximate but useful for trends.",
    good: "1-5 hp at idle, 20-60 hp cruising, up to 150-180 hp at peak (FB25 rated 182 hp).",
    bad: "Peak power significantly below expected — could indicate intake restriction, exhaust restriction, or sensor error.",
    lookFor: "Power that doesn't scale with RPM and throttle (engine issue), power peaks at unexpected RPM.",
  },
  instantPowerFuel: {
    what: "Estimated engine power output calculated from instantaneous fuel consumption. An alternative to MAF-based power estimation.",
    good: "Should track MAF-based power closely. 1-5 hp at idle, up to 150-180 hp at peak.",
    bad: "Large divergence from MAF-based power suggests one of the input sensors is inaccurate.",
    lookFor: "Compare with MAF-based power — consistent divergence indicates a sensor calibration issue.",
  },
  vehicleSpeed: {
    what: "Speed reported by the vehicle's wheel speed sensors via OBD2.",
    good: "Matches GPS speed within ±3 km/h.",
    bad: "Large divergence from GPS speed (wrong tire size, ABS sensor fault).",
    lookFor: "OBD consistently higher than GPS (tires smaller than stock), consistently lower (tires larger).",
  },
  vehicleAcceleration: {
    what: "Rate of speed change measured in g-force. 1g = 9.8 m/s². Positive = accelerating, negative = braking.",
    good: "-0.2g to +0.2g for smooth driving. Up to ±0.4g for spirited but safe driving.",
    bad: "< -0.4g harsh braking, > 0.3g rapid acceleration — increases wear on tires, brakes, CVT.",
    lookFor: "Frequency of harsh events. Many harsh braking events may indicate following too closely.",
  },
  cvtTemp: {
    what: "Temperature of the Continuously Variable Transmission fluid. The Lineartronic CVT is sensitive to heat.",
    good: "60-100°C during normal driving.",
    bad: ">120°C — CVT fluid breaks down, causing accelerated belt/chain wear. The CVT is the most expensive drivetrain component.",
    lookFor: "Temp climbing during sustained hill climbs (CVT stress), temp that won't cool down on highway (fluid level low or cooler blocked).",
  },
  actualGearRatio: {
    what: "The CVT's actual operating ratio vs what the ECU commanded. The CVT continuously varies rather than shifting through fixed gears.",
    good: "Actual closely tracks target with minimal lag.",
    bad: "Large or persistent gap between actual and target (CVT belt slip, hydraulic pressure issue).",
    lookFor: "Sudden ratio changes without throttle input (CVT hunting), actual ratio that won't reach target (belt slip).",
  },
  primaryPulleySpeed: {
    what: "Rotational speed of the CVT's input (primary) and output (secondary) pulleys. Their ratio determines the effective gear.",
    good: "Both scale smoothly with vehicle speed and RPM.",
    bad: "Primary spinning much faster than expected relative to secondary (belt slip).",
    lookFor: "Sudden discrepancies between the two (slipping), smooth ratio changes (healthy CVT operation).",
  },
  lockUpDutyRatio: {
    what: "How much the torque converter clutch is engaged. 0% = fully open (slipping for smooth starts), 100% = fully locked (direct drive for efficiency).",
    good: "0% at low speed, transitioning to 60-100% at cruising speed.",
    bad: "Never reaching high lock-up at highway speed (increased fuel consumption, heat buildup).",
    lookFor: "Frequent lock/unlock cycling (torque converter shudder — common CVT issue).",
  },
  turbineSpeed: {
    what: "Rotational speed of the torque converter turbine. Compares to engine RPM to show converter slip.",
    good: "Should approach engine RPM when lock-up duty is high. Lags behind engine RPM when converter is slipping.",
    bad: "Large sustained gap between turbine and engine RPM at highway speed (converter not locking up).",
    lookFor: "Gap narrows as lock-up engages. Persistent gap at cruise = torque converter issue.",
  },
  absFrontLeftWheelSpeed: {
    what: "Individual speed of each wheel measured by ABS sensors. Used by ABS, traction control, and stability control.",
    good: "All four wheels within 1-2 km/h of each other during straight-line driving.",
    bad: "One wheel significantly different (ABS sensor fault, tire size mismatch, brake dragging).",
    lookFor: "Momentary divergence during cornering is normal. Sustained divergence in a straight line is a problem.",
  },
  frontRearDiff: {
    what: "Derived: average front wheel speed minus average rear wheel speed. Indicates traction distribution.",
    good: "Near zero during normal driving. Small positive values during acceleration.",
    bad: "Large sustained differential (drivetrain binding, incorrect tire sizes front vs rear).",
    lookFor: "Spikes during acceleration on slippery surfaces (traction control intervening), correlation with AWD engagement.",
  },
  leftRightDiff: {
    what: "Derived: average left wheel speed minus average right wheel speed.",
    good: "Near zero in straight lines. Diverges during turns (outer wheels travel further).",
    bad: "Sustained non-zero in straight lines (brake dragging, alignment issue, tire pressure imbalance).",
    lookFor: "Correlation with steering angle (normal cornering) vs no steering input (problem).",
  },
  steeringAngle: {
    what: "Angle of the steering wheel measured by the steering angle sensor. Used by stability control.",
    good: "Any value — this is driver input, not a health metric.",
    bad: "N/A — no warning thresholds.",
    lookFor: "Correlate with wheel speed differentials and AWD engagement to understand vehicle dynamics.",
  },
  awdSolenoidActualCurrent: {
    what: "Current flowing to the AWD coupling solenoid. Higher current = more torque sent to rear wheels.",
    good: "Low current (50-100 mA) during straight-line dry driving. Higher during cornering, acceleration, or slippery conditions.",
    bad: "Actual significantly different from set (solenoid or wiring issue). Always at maximum (system stuck engaged).",
    lookFor: "AWD engaging during hard cornering (normal), engaging on dry straight roads (wheel speed sensor issue).",
  },
  batteryVoltage: {
    what: "Voltage at the battery terminals while the engine is running. The alternator should maintain charging voltage.",
    good: "13.8-14.6V with engine running — alternator is charging properly.",
    bad: "<12.5V (alternator not charging, belt slipping), >15.0V (voltage regulator failure — risks electronics).",
    lookFor: "Voltage dropping under electrical load (weak alternator), voltage sagging at idle but recovering at RPM (belt tension).",
  },
};
```

- [ ] **Step 2: Verify types compile**

Run: `npm run type-check`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/lib/data/metricTooltips.ts
git commit -m "feat: add metric tooltip content for all OBD2 parameters"
```

---

### Task 5: Add Subaru Red design token and deprecate accent-red

**Files:**
- Modify: `tailwind.config.ts`

- [ ] **Step 1: Add subaru-red color scale and update red-glow**

Add `'subaru-red'` inside `colors` (after `accent`):

```ts
'subaru-red': {
  DEFAULT: '#E0202C',
  light: 'rgba(224, 32, 44, 0.15)',
  medium: 'rgba(224, 32, 44, 0.4)',
  dark: 'rgba(224, 32, 44, 0.8)',
},
```

Update the `red-glow` background image to use Subaru red:
```ts
"red-glow": "radial-gradient(circle at center, rgba(224, 32, 44, 0.15) 0%, transparent 70%)",
```

Update `glow-red` box shadow:
```ts
"glow-red": "0 0 20px rgba(224, 32, 44, 0.25), 0 0 60px rgba(224, 32, 44, 0.08)",
```

- [ ] **Step 2: Verify build still works**

Run: `npm run build`
Expected: PASS (existing components still reference accent-red which still exists — migration happens later per-component)

- [ ] **Step 3: Commit**

```bash
git add tailwind.config.ts
git commit -m "feat: add Subaru WR Red design token to Tailwind config"
```

---

## Chunk 2: Server-Side — GPS Parser, Derived Metrics, LTTB, API Extension

### Task 6: Create GPS parser

**Files:**
- Create: `src/lib/data/gpsParser.ts`

- [ ] **Step 0: Export `splitOBD2Line` from existing parser**

In `src/lib/data/obd2Parser.ts`, change line 8 from:
```ts
function splitOBD2Line(line: string): string[] {
```
to:
```ts
export function splitOBD2Line(line: string): string[] {
```

This is the only change to the existing parser — adding `export` to share the CSV line splitting logic.

- [ ] **Step 1: Write GPS parser**

```ts
import { GPSDataPoint } from "@/types";
import { splitOBD2Line } from "./obd2Parser";

/**
 * Parse GPS data from OBD2 CSV text.
 * Reads LATITUDE (index 4), LONGITUDE (index 5) columns plus
 * Altitude (GPS) and Speed (GPS) PID rows.
 * Returns deduplicated GPSDataPoints bucketed by ~1 second.
 */
export function parseGPSData(csvText: string): GPSDataPoint[] {
  const lines = csvText.trim().split("\n");
  if (lines.length < 2) return [];

  // Validate header has lat/lon columns
  const headers = splitOBD2Line(lines[0]).map((h) => h.toUpperCase());
  const latIdx = headers.findIndex((h) => h.includes("LATITUDE"));
  const lonIdx = headers.findIndex((h) => h.includes("LONGTITUDE") || h.includes("LONGITUDE"));
  const secIdx = headers.indexOf("SECONDS");
  const pidIdx = headers.indexOf("PID");
  const valIdx = headers.indexOf("VALUE");

  if (latIdx === -1 || lonIdx === -1 || secIdx === -1) return [];

  // First pass: collect raw lat/lon per timestamp bucket
  const buckets = new Map<number, { lat: number; lon: number; count: number }>();
  // Second pass data: altitude and GPS speed from PID rows
  const altitudes = new Map<number, number>();
  const gpsSpeeds = new Map<number, number>();

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const fields = splitOBD2Line(line);
    const timestamp = parseFloat(fields[secIdx]);
    if (isNaN(timestamp)) continue;

    const bucket = Math.floor(timestamp);

    // Extract lat/lon
    const lat = parseFloat(fields[latIdx]);
    const lon = parseFloat(fields[lonIdx]);
    if (!isNaN(lat) && !isNaN(lon) && lat !== 0 && lon !== 0 &&
        lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180) {
      const existing = buckets.get(bucket);
      if (existing) {
        existing.lat += lat;
        existing.lon += lon;
        existing.count += 1;
      } else {
        buckets.set(bucket, { lat, lon, count: 1 });
      }
    }

    // Extract altitude and GPS speed from PID rows
    if (pidIdx !== -1 && valIdx !== -1) {
      const pid = fields[pidIdx];
      const value = parseFloat(fields[valIdx]);
      if (!isNaN(value)) {
        if (pid === "Altitude (GPS)") {
          altitudes.set(bucket, value);
        } else if (pid === "Speed (GPS)") {
          gpsSpeeds.set(bucket, value);
        }
      }
    }
  }

  // Build GPSDataPoint array
  const points: GPSDataPoint[] = [];
  const sortedBuckets = Array.from(buckets.entries()).sort(([a], [b]) => a - b);

  for (const [timestamp, { lat, lon, count }] of sortedBuckets) {
    const point: GPSDataPoint = {
      timestamp,
      lat: lat / count,
      lon: lon / count,
    };
    const alt = altitudes.get(timestamp);
    if (alt !== undefined) point.altitude = alt;
    const speed = gpsSpeeds.get(timestamp);
    if (speed !== undefined) point.gpsSpeed = speed;
    points.push(point);
  }

  return points;
}
```

- [ ] **Step 2: Verify types compile**

Run: `npm run type-check`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/lib/data/gpsParser.ts
git commit -m "feat: add GPS parser to extract lat/lon/altitude from CSV"
```

---

### Task 7: Create derived metrics computation

**Files:**
- Create: `src/lib/data/deriveMetrics.ts`

- [ ] **Step 1: Write derived metrics functions**

```ts
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
```

- [ ] **Step 2: Verify types compile**

Run: `npm run type-check`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/lib/data/deriveMetrics.ts
git commit -m "feat: add server-side derived metrics computation"
```

---

### Task 8: Add LTTB downsampling utility

**Files:**
- Create: `src/lib/data/downsample.ts`

- [ ] **Step 1: Implement Largest-Triangle-Three-Buckets**

```ts
import { OBD2DataPoint, GPSDataPoint } from "@/types";

/**
 * Largest-Triangle-Three-Buckets (LTTB) downsampling.
 * Reduces an array of points to `threshold` points while preserving visual shape.
 * Generic version that works with any object having a numeric key for x and y.
 */
function lttb<T>(data: T[], threshold: number, getX: (d: T) => number, getY: (d: T) => number): T[] {
  if (threshold >= data.length || threshold < 3) return [...data];

  const sampled: T[] = [data[0]]; // Always keep first point
  const bucketSize = (data.length - 2) / (threshold - 2);

  let prevIndex = 0;

  for (let i = 0; i < threshold - 2; i++) {
    const bucketStart = Math.floor((i + 1) * bucketSize) + 1;
    const bucketEnd = Math.min(Math.floor((i + 2) * bucketSize) + 1, data.length - 1);

    // Calculate average of next bucket for area computation
    const nextBucketStart = Math.floor((i + 2) * bucketSize) + 1;
    const nextBucketEnd = Math.min(Math.floor((i + 3) * bucketSize) + 1, data.length - 1);
    let avgX = 0, avgY = 0, count = 0;
    for (let j = nextBucketStart; j < nextBucketEnd && j < data.length; j++) {
      avgX += getX(data[j]);
      avgY += getY(data[j]);
      count++;
    }
    if (count > 0) { avgX /= count; avgY /= count; }

    // Find point in current bucket with max triangle area
    const prevX = getX(data[prevIndex]);
    const prevY = getY(data[prevIndex]);
    let maxArea = -1;
    let maxIndex = bucketStart;

    for (let j = bucketStart; j < bucketEnd && j < data.length; j++) {
      const area = Math.abs(
        (prevX - avgX) * (getY(data[j]) - prevY) -
        (prevX - getX(data[j])) * (avgY - prevY)
      );
      if (area > maxArea) {
        maxArea = area;
        maxIndex = j;
      }
    }

    sampled.push(data[maxIndex]);
    prevIndex = maxIndex;
  }

  sampled.push(data[data.length - 1]); // Always keep last point
  return sampled;
}

const MAX_POINTS = 5000;

/**
 * Downsample OBD2DataPoint array if it exceeds MAX_POINTS.
 * Uses engineRpm as the Y-axis proxy for visual importance (falls back to vehicleSpeed).
 */
export function downsampleTimeSeries(data: OBD2DataPoint[]): OBD2DataPoint[] {
  if (data.length <= MAX_POINTS) return data;
  return lttb(
    data,
    MAX_POINTS,
    (d) => d.timestamp,
    (d) => d.engineRpm ?? d.vehicleSpeed ?? 0
  );
}

/**
 * Downsample GPSDataPoint array if it exceeds MAX_POINTS.
 */
export function downsampleGPS(data: GPSDataPoint[]): GPSDataPoint[] {
  if (data.length <= MAX_POINTS) return data;
  return lttb(
    data,
    MAX_POINTS,
    (d) => d.timestamp,
    (d) => d.gpsSpeed ?? d.altitude ?? 0
  );
}
```

- [ ] **Step 2: Verify types compile**

Run: `npm run type-check`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/lib/data/downsample.ts
git commit -m "feat: add LTTB downsampling for time-series and GPS data"
```

---

### Task 9: Extend API route to return time-series, GPS, derived, thresholds

**Files:**
- Modify: `src/app/api/analyze/route.ts`

- [ ] **Step 1: Update the API route**

Replace the entire file content with:

```ts
import { NextRequest, NextResponse } from "next/server";
import { parseOBD2File } from "@/lib/data/obd2Parser";
import { analyzeOBD2Data } from "@/lib/data/obd2Analyzer";
import { validateFileFormat } from "@/lib/data/obd2Validators";
import { parseGPSData } from "@/lib/data/gpsParser";
import { computeDerivedMetrics } from "@/lib/data/deriveMetrics";
import { downsampleTimeSeries, downsampleGPS } from "@/lib/data/downsample";
import { IMPREZA_RS_THRESHOLDS } from "@/lib/data/thresholds";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    // Validate file size (10MB limit)
    const MAX_FILE_SIZE = 10 * 1024 * 1024;
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 10MB." },
        { status: 413 }
      );
    }

    // Validate file format (CSV only for OBD2)
    const format = validateFileFormat(file.name);
    if (!format) {
      return NextResponse.json(
        { error: "Invalid file format. Only OBD2 CSV files (.csv) are supported." },
        { status: 400 }
      );
    }

    // Read file content
    const fileContent = await file.text();

    // Parse OBD2 CSV data (throws if no valid data found)
    const dataPoints = parseOBD2File(fileContent);

    // Parse GPS data independently from raw CSV
    const gpsData = parseGPSData(fileContent);

    // Analyze data — return full OBD2AnalysisResult for the dashboard
    const result = analyzeOBD2Data(dataPoints);

    // Compute derived metrics
    const derived = computeDerivedMetrics(dataPoints);

    // Downsample if needed
    const timeSeries = downsampleTimeSeries(dataPoints);
    const gps = downsampleGPS(gpsData);

    return NextResponse.json({
      success: true,
      result,
      timeSeries,
      gps,
      derived,
      thresholds: IMPREZA_RS_THRESHOLDS,
    });
  } catch (error) {
    console.error("Analysis error:", error);
    return NextResponse.json(
      {
        error: "Failed to analyze OBD2 data",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
```

- [ ] **Step 2: Verify the app builds**

Run: `npm run build`
Expected: PASS

- [ ] **Step 3: Test with actual CSV file**

Run: `npm run dev` and then:
```bash
curl -s -F "file=@input/2026-03-17 18-27-59.csv" http://localhost:3000/api/analyze | node -e "const d=JSON.parse(require('fs').readFileSync('/dev/stdin','utf8')); console.log('result keys:', Object.keys(d)); console.log('timeSeries count:', d.timeSeries?.length); console.log('gps count:', d.gps?.length); console.log('derived keys:', Object.keys(d.derived || {})); console.log('thresholds keys:', Object.keys(d.thresholds || {}));"
```

Expected: `timeSeries count: ~3000`, `gps count: ~3000`, `derived keys: [wheelSpeedDiffs, cvtEffectiveRatio, ...]`, `thresholds keys: [engineRpm, coolantTemp, ...]`

- [ ] **Step 4: Commit**

```bash
git add src/app/api/analyze/route.ts
git commit -m "feat: extend API to return time-series, GPS, derived metrics, and thresholds"
```

---

## Chunk 3: Client Foundation — useTimeRange, ChartWrapper, MetricTooltip, Plotly Dynamic Import

### Task 10: Create useTimeRange hook

**Files:**
- Create: `src/hooks/useTimeRange.ts`

- [ ] **Step 1: Write the hook with React context**

```ts
"use client";

import { createContext, useContext, useState, useCallback, useMemo, ReactNode } from "react";

export interface TimeRangeState {
  start: number | null;
  end: number | null;
  source: "chart" | "map" | "reset";
}

interface TimeRangeContextValue {
  timeRange: TimeRangeState;
  setTimeRange: (range: TimeRangeState) => void;
  resetTimeRange: () => void;
  isRangeActive: boolean;
}

const TimeRangeContext = createContext<TimeRangeContextValue | null>(null);

const INITIAL_STATE: TimeRangeState = { start: null, end: null, source: "reset" };

export function TimeRangeProvider({ children }: { children: ReactNode }) {
  const [timeRange, setTimeRangeState] = useState<TimeRangeState>(INITIAL_STATE);

  const setTimeRange = useCallback((range: TimeRangeState) => {
    setTimeRangeState(range);
  }, []);

  const resetTimeRange = useCallback(() => {
    setTimeRangeState(INITIAL_STATE);
  }, []);

  const isRangeActive = timeRange.start !== null && timeRange.end !== null;

  const value = useMemo(
    () => ({ timeRange, setTimeRange, resetTimeRange, isRangeActive }),
    [timeRange, setTimeRange, resetTimeRange, isRangeActive]
  );

  return (
    <TimeRangeContext.Provider value={value}>
      {children}
    </TimeRangeContext.Provider>
  );
}

export function useTimeRange(): TimeRangeContextValue {
  const context = useContext(TimeRangeContext);
  if (!context) {
    throw new Error("useTimeRange must be used within a TimeRangeProvider");
  }
  return context;
}
```

- [ ] **Step 2: Verify types compile**

Run: `npm run type-check`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/hooks/useTimeRange.ts
git commit -m "feat: add useTimeRange hook with React context for linked brushing"
```

---

### Task 11: Create ChartWrapper component

**Files:**
- Create: `src/components/ui/ChartWrapper.tsx`

- [ ] **Step 1: Write ChartWrapper with loading skeleton and dynamic Plotly import**

```ts
"use client";

import { useRef, useEffect, useState, ReactNode } from "react";
import { cn } from "@/lib/utils";
import dynamic from "next/dynamic";

// Dynamically import Plotly to avoid SSR issues
const Plot = dynamic(() => import("react-plotly.js"), {
  ssr: false,
  loading: () => null, // ChartWrapper handles its own loading state
});

export { Plot };

interface ChartWrapperProps {
  title: string;
  height?: number;
  children: ReactNode;
  className?: string;
  loading?: boolean;
  tooltipContent?: ReactNode;
}

export function ChartWrapper({
  title,
  height = 350,
  children,
  className,
  loading = false,
  tooltipContent,
}: ChartWrapperProps) {
  const [plotlyReady, setPlotlyReady] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Detect Plotly readiness by checking for the dynamically imported module.
  // The Plot component renders null via loading prop until ready,
  // so we observe the container for actual chart content via MutationObserver.
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    // Check if Plotly has already rendered (e.g., cached module)
    if (container.querySelector(".js-plotly-plot")) {
      setPlotlyReady(true);
      return;
    }
    const observer = new MutationObserver(() => {
      if (container.querySelector(".js-plotly-plot")) {
        setPlotlyReady(true);
        observer.disconnect();
      }
    });
    observer.observe(container, { childList: true, subtree: true });
    // Fallback: if Plotly loads but no chart is rendered yet (empty data),
    // resolve after the dynamic import by checking window
    const checkInterval = setInterval(() => {
      if (typeof window !== "undefined" && "Plotly" in window) {
        setPlotlyReady(true);
        clearInterval(checkInterval);
      }
    }, 200);
    return () => { observer.disconnect(); clearInterval(checkInterval); };
  }, []);

  const showSkeleton = loading || !plotlyReady;

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative rounded-2xl border border-glass-edge",
        "bg-pearl-gradient backdrop-blur-md",
        "shadow-sapphire-sm",
        "overflow-hidden",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-2 px-4 pt-3 pb-1">
        <h3 className="text-sm font-medium text-sapphire-200 font-body">
          {title}
        </h3>
        {tooltipContent}
      </div>

      {/* Chart area */}
      <div style={{ height }} className="relative">
        {showSkeleton ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-full h-full bg-sapphire-900/30 animate-pulse rounded-b-2xl">
              {/* Faint axis hints */}
              <div className="absolute bottom-8 left-12 right-4 h-px bg-sapphire-800/50" />
              <div className="absolute top-4 bottom-8 left-12 w-px bg-sapphire-800/50" />
              {/* Shimmer overlay */}
              <div className="absolute inset-0 overflow-hidden">
                <div className="w-1/3 h-full bg-gradient-to-r from-transparent via-sapphire-700/10 to-transparent animate-progress-shimmer" />
              </div>
            </div>
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify types compile**

Run: `npm run type-check`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/components/ui/ChartWrapper.tsx
git commit -m "feat: add ChartWrapper with loading skeleton and dynamic Plotly import"
```

---

### Task 12: Create MetricTooltip component

**Files:**
- Create: `src/components/ui/MetricTooltip.tsx`

- [ ] **Step 1: Write MetricTooltip with glass-morphism popover**

```tsx
"use client";

import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { MetricTooltipContent } from "@/types";

interface MetricTooltipProps {
  content: MetricTooltipContent;
  className?: string;
}

export function MetricTooltip({ content, className }: MetricTooltipProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  return (
    <div ref={ref} className={cn("relative inline-flex", className)}>
      <button
        onClick={() => setOpen(!open)}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        className="text-sapphire-400 hover:text-sapphire-200 transition-colors p-0.5 rounded-full"
        aria-label="Metric information"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 16v-4" />
          <path d="M12 8h.01" />
        </svg>
      </button>

      {open && (
        <div
          className={cn(
            "absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2",
            "w-72 sm:w-80 p-3 rounded-xl",
            "bg-sapphire-900/95 backdrop-blur-lg",
            "border border-glass-edge",
            "shadow-sapphire-lg",
            "text-xs leading-relaxed",
            "animate-fade-in"
          )}
        >
          <div className="space-y-2">
            <p className="text-sapphire-100">{content.what}</p>
            <div>
              <span className="text-emerald-400 font-medium">Good: </span>
              <span className="text-sapphire-200">{content.good}</span>
            </div>
            <div>
              <span className="text-subaru-red font-medium">Bad: </span>
              <span className="text-sapphire-200">{content.bad}</span>
            </div>
            <div>
              <span className="text-sapphire-300 font-medium">Look for: </span>
              <span className="text-sapphire-200">{content.lookFor}</span>
            </div>
          </div>
          {/* Arrow */}
          <div className="absolute top-full left-1/2 -translate-x-1/2 w-2 h-2 rotate-45 bg-sapphire-900/95 border-r border-b border-glass-edge" />
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verify types compile**

Run: `npm run type-check`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/components/ui/MetricTooltip.tsx
git commit -m "feat: add MetricTooltip component with glass-morphism popover"
```

---

### Task 13: Create Plotly theme config

**Files:**
- Create: `src/lib/chartTheme.ts`

- [ ] **Step 1: Write shared Plotly layout and config**

```ts
/**
 * Shared Plotly theme configuration matching the sapphire glass-morphism design system.
 * All charts use these as base layout/config, with per-chart overrides.
 */

export const CHART_COLORS = {
  primary: "rgba(54, 112, 198, 0.9)",       // sapphire-500
  primaryFill: "rgba(54, 112, 198, 0.15)",   // sapphire-500 transparent fill
  secondary: "rgba(90, 146, 219, 0.9)",      // sapphire-400
  tertiary: "rgba(137, 180, 232, 0.9)",      // sapphire-300
  quaternary: "rgba(16, 185, 129, 0.9)",     // emerald-500
  subaruRed: "#E0202C",
  subaruRedFill: "rgba(224, 32, 44, 0.15)",
  subaruRedMedium: "rgba(224, 32, 44, 0.4)",
  amber: "rgba(245, 158, 11, 0.9)",          // amber-500
  amberFill: "rgba(245, 158, 11, 0.15)",
  emerald: "rgba(16, 185, 129, 0.9)",        // emerald-500
  emeraldFill: "rgba(16, 185, 129, 0.15)",
  text: "rgba(184, 212, 240, 0.9)",          // sapphire-200
  textMuted: "rgba(137, 180, 232, 0.5)",     // sapphire-300 muted
  grid: "rgba(22, 48, 96, 0.5)",             // sapphire-800
  background: "rgba(0,0,0,0)",               // transparent
} as const;

export const BASE_LAYOUT: Partial<Plotly.Layout> = {
  paper_bgcolor: CHART_COLORS.background,
  plot_bgcolor: CHART_COLORS.background,
  font: {
    family: "var(--font-dm-sans), system-ui, sans-serif",
    color: CHART_COLORS.text,
    size: 11,
  },
  margin: { l: 50, r: 20, t: 10, b: 40 },
  xaxis: {
    gridcolor: CHART_COLORS.grid,
    zerolinecolor: CHART_COLORS.grid,
    tickfont: { size: 10, color: CHART_COLORS.textMuted },
  },
  yaxis: {
    gridcolor: CHART_COLORS.grid,
    zerolinecolor: CHART_COLORS.grid,
    tickfont: { size: 10, color: CHART_COLORS.textMuted },
  },
  hoverlabel: {
    bgcolor: "rgba(15, 34, 64, 0.95)",
    bordercolor: "rgba(54, 112, 198, 0.3)",
    font: {
      family: "var(--font-dm-sans), system-ui, sans-serif",
      color: CHART_COLORS.text,
      size: 12,
    },
  },
  legend: {
    font: { size: 10, color: CHART_COLORS.textMuted },
    bgcolor: "rgba(0,0,0,0)",
    borderwidth: 0,
  },
  dragmode: "zoom",
  hovermode: "x unified",
};

export const BASE_CONFIG: Partial<Plotly.Config> = {
  displayModeBar: true,
  displaylogo: false,
  modeBarButtonsToRemove: [
    "lasso2d",
    "select2d",
    "autoScale2d",
    "toggleSpikelines",
  ],
  responsive: true,
};

/**
 * Format a Unix timestamp (seconds) to a human-readable time string.
 * Used for chart axis labels and hover text.
 */
export function formatTimestamp(seconds: number, startTime: number): string {
  const elapsed = seconds - startTime;
  const mins = Math.floor(elapsed / 60);
  const secs = Math.floor(elapsed % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

/**
 * Create threshold shape annotations for Plotly layout.
 * Returns Plotly shape objects for warning and danger bands.
 */
export function createThresholdShapes(
  yWarning: [number, number] | [number, number][],
  yDanger: [number, number] | [number, number][],
): Partial<Plotly.Shape>[] {
  const shapes: Partial<Plotly.Shape>[] = [];

  const warningRanges = Array.isArray(yWarning[0]) ? yWarning as [number, number][] : [yWarning as [number, number]];
  const dangerRanges = Array.isArray(yDanger[0]) ? yDanger as [number, number][] : [yDanger as [number, number]];

  for (const [y0, y1] of warningRanges) {
    shapes.push({
      type: "rect",
      xref: "paper",
      x0: 0, x1: 1,
      yref: "y",
      y0, y1,
      fillcolor: "rgba(245, 158, 11, 0.08)",
      line: { width: 0 },
      layer: "below",
    });
  }

  for (const [y0, y1] of dangerRanges) {
    shapes.push({
      type: "rect",
      xref: "paper",
      x0: 0, x1: 1,
      yref: "y",
      y0, y1,
      fillcolor: "rgba(224, 32, 44, 0.1)",
      line: { width: 0 },
      layer: "below",
    });
  }

  return shapes;
}
```

- [ ] **Step 2: Verify types compile**

Run: `npm run type-check`
Expected: PASS (`@types/plotly.js` was installed in Task 1)

- [ ] **Step 3: Commit**

```bash
git add src/lib/chartTheme.ts
git commit -m "feat: add shared Plotly theme config matching sapphire design system"
```

---

## Chunk 4: Generic Chart Components

### Task 14: Create TimeSeriesChart component

**Files:**
- Create: `src/components/features/charts/TimeSeriesChart.tsx`

- [ ] **Step 1: Write TimeSeriesChart**

A generic time-series line chart that supports: multiple traces, dual Y-axis, threshold bands, event markers, and linked brushing via `useTimeRange`.

Props:
- `data: OBD2DataPoint[]` — the time-series data
- `traces: { field: keyof OBD2DataPoint; name: string; color?: string; yaxis?: "y" | "y2"; fill?: boolean }[]`
- `thresholdKey?: ThresholdMetricKey` — if provided, renders warning/danger bands from thresholds
- `thresholds?: ThresholdConfig`
- `eventMarkers?: { timestamp: number; color: string; label: string }[]`
- `yAxisLabel?: string`
- `y2AxisLabel?: string`
- `height?: number`
- `startTime: number` — for relative time axis labels

The component:
1. Converts `OBD2DataPoint[]` to Plotly trace arrays (x = relative time, y = field value)
2. Applies `BASE_LAYOUT` and `BASE_CONFIG` from `chartTheme.ts`
3. On `onRelayout`, extracts the new x-axis range and updates `useTimeRange`
4. Reads `useTimeRange` to set the initial x-axis range when range is active
5. Renders threshold shapes if `thresholdKey` is provided

- [ ] **Step 2: Verify types compile**

Run: `npm run type-check`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/components/features/charts/TimeSeriesChart.tsx
git commit -m "feat: add TimeSeriesChart component with threshold bands and linked brushing"
```

---

### Task 15: Create ScatterChart component

**Files:**
- Create: `src/components/features/charts/ScatterChart.tsx`

- [ ] **Step 1: Write ScatterChart**

A generic scatter plot that supports: color-by field, size-by field, time-range highlighting via `useTimeRange`, and box/lasso select → time range update.

Props:
- `data: OBD2DataPoint[]`
- `xField: keyof OBD2DataPoint`
- `yField: keyof OBD2DataPoint`
- `colorField?: keyof OBD2DataPoint` — maps to a color scale
- `xLabel?: string`
- `yLabel?: string`
- `height?: number`

Key behavior:
- Each point carries `customdata: [timestamp]`
- When `useTimeRange` has active selection: in-range points full opacity, out-of-range 0.15 opacity (two traces technique)
- On box/lasso select: extract min/max timestamps from `customdata` → update `useTimeRange`

- [ ] **Step 2: Verify types compile**

Run: `npm run type-check`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/components/features/charts/ScatterChart.tsx
git commit -m "feat: add ScatterChart component with time-range highlighting"
```

---

### Task 16: Create HistogramChart component

**Files:**
- Create: `src/components/features/charts/HistogramChart.tsx`

- [ ] **Step 1: Write HistogramChart**

Props:
- `data: number[]` — array of values to bin
- `bins?: number` — number of bins (default 50)
- `highlightRanges?: { min: number; max: number; color: string; label: string }[]`
- `xLabel?: string`
- `height?: number`

Renders a Plotly histogram with colored overlay for highlighted ranges (e.g., harsh braking in subaru-red).

- [ ] **Step 2: Verify types compile**

Run: `npm run type-check`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/components/features/charts/HistogramChart.tsx
git commit -m "feat: add HistogramChart component with highlight ranges"
```

---

### Task 17: Create BarChart component

**Files:**
- Create: `src/components/features/charts/BarChart.tsx`

- [ ] **Step 1: Write BarChart**

Props:
- `data: { label: string; value: number; count?: number }[]`
- `yLabel?: string`
- `height?: number`

Simple categorical bar chart (e.g., fuel consumption by speed bucket).

- [ ] **Step 2: Verify types compile and commit**

```bash
git add src/components/features/charts/BarChart.tsx
git commit -m "feat: add BarChart component for categorical data"
```

---

### Task 18: Create AreaChart component

**Files:**
- Create: `src/components/features/charts/AreaChart.tsx`

- [ ] **Step 1: Write AreaChart**

Props:
- `data: { x: number; y: number }[]`
- `xLabel?: string`
- `yLabel?: string`
- `height?: number`

Gradient-filled area chart (e.g., cumulative fuel used over distance).

- [ ] **Step 2: Verify types compile and commit**

```bash
git add src/components/features/charts/AreaChart.tsx
git commit -m "feat: add AreaChart component with gradient fill"
```

---

### Task 19: Create RouteMap component

**Files:**
- Create: `src/components/features/charts/RouteMap.tsx`

- [ ] **Step 1: Write RouteMap with Leaflet, dynamic import, and linked brushing**

**Important: all chart and tab components must have `"use client"` at the top** since they use hooks (`useTimeRange`) and browser-only libraries (Plotly, Leaflet).

This is the most complex chart component. It must:
1. Dynamically import `react-leaflet` (`MapContainer`, `TileLayer`, `Polyline`, `Marker`, `useMap`)
2. Import Leaflet CSS at the top of the file as a side-effect: `import "leaflet/dist/leaflet.css";` — this works in Next.js App Router client components. Do NOT put it in `globals.css` (it would be loaded on every page).
3. Use CartoDB Dark Matter tile URL: `https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png`
4. Render the GPS track as a colored polyline (color gradient based on speed: green→amber→subaru-red)
5. Add custom SVG markers for start (green circle) and end (subaru-red circle)
6. On click of a polyline segment, update `useTimeRange` with the timestamp range of that segment
7. When `useTimeRange` has an active range, highlight the corresponding segment brighter and dim the rest
8. Show empty state ("No GPS data available") when `gps` array is empty
9. Auto-fit bounds to the GPS track on load
10. Mobile: 300px height, pinch-to-zoom, two-finger pan

Props:
- `gps: GPSDataPoint[]`
- `height?: number`
- `className?: string`

The RouteMap should be exported via `next/dynamic` with `ssr: false` from a wrapper file or directly in the tab components.

- [ ] **Step 2: Verify types compile**

Run: `npm run type-check`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/components/features/charts/RouteMap.tsx
git commit -m "feat: add RouteMap component with Leaflet, speed gradient, and linked brushing"
```

---

## Chunk 5: Tab Components (Overview, Engine, Fuel, Transmission, Power)

### Task 20: Create OverviewTab

**Files:**
- Create: `src/components/features/tabs/OverviewTab.tsx`

- [ ] **Step 1: Write OverviewTab**

Contains:
- RouteMap (full width, colored by speed)
- Speed Profile chart: TimeSeriesChart with `vehicleSpeed` + GPS speed overlay, harsh braking markers (subaru-red) and rapid acceleration markers (amber)
- Existing SafetyGauge and trip summary chips remain in the parent dashboard, not duplicated here

Props: `timeSeries`, `gps`, `derived`, `thresholds`, `result` (for event markers from motion metrics)

- [ ] **Step 2: Verify types compile and commit**

```bash
git add src/components/features/tabs/OverviewTab.tsx
git commit -m "feat: add OverviewTab with route map and speed profile"
```

---

### Task 21: Create EngineTab

**Files:**
- Create: `src/components/features/tabs/EngineTab.tsx`

- [ ] **Step 1: Write EngineTab**

Contains 5 charts:
1. RPM over time (TimeSeriesChart, redline shading via threshold)
2. Load vs RPM (ScatterChart, color = throttlePosition)
3. Coolant + Oil temp over time (TimeSeriesChart, dual axis, threshold bands)
4. Knock correction over time (TimeSeriesChart as bar-mode, subaru-red for < -3°)
5. Timing advance vs RPM (ScatterChart)

Plus existing CategoryMetrics summary row at top.

- [ ] **Step 2: Verify types compile and commit**

```bash
git add src/components/features/tabs/EngineTab.tsx
git commit -m "feat: add EngineTab with 5 interactive charts"
```

---

### Task 22: Create FuelTab

**Files:**
- Create: `src/components/features/tabs/FuelTab.tsx`

- [ ] **Step 1: Write FuelTab**

Contains 5 charts:
1. Fuel trims over time (TimeSeriesChart, dual line, threshold bands at ±5/8/10%)
2. Fuel/Air equivalence ratio (TimeSeriesChart, reference line at 1.0)
3. Consumption vs speed (ScatterChart, trend line)
4. Consumption by speed bucket (BarChart from derived.fuelBySpeedBucket)
5. Cumulative fuel used (AreaChart from derived.fuelDistanceSeries)

- [ ] **Step 2: Verify types compile and commit**

```bash
git add src/components/features/tabs/FuelTab.tsx
git commit -m "feat: add FuelTab with 5 interactive charts"
```

---

### Task 23: Create TransmissionTab

**Files:**
- Create: `src/components/features/tabs/TransmissionTab.tsx`

- [ ] **Step 1: Write TransmissionTab**

Contains 6 charts:
1. CVT temp over time (TimeSeriesChart, threshold bands)
2. Actual vs Target gear ratio (TimeSeriesChart, dual trace overlay)
3. Pulley speeds (TimeSeriesChart, primary + secondary dual line)
4. CVT effective ratio (TimeSeriesChart from derived.cvtEffectiveRatio)
5. Lock-up duty ratio (TimeSeriesChart)
6. Turbine speed vs Engine RPM (TimeSeriesChart, dual trace)

- [ ] **Step 2: Verify types compile and commit**

```bash
git add src/components/features/tabs/TransmissionTab.tsx
git commit -m "feat: add TransmissionTab with 6 interactive charts"
```

---

### Task 24: Create PowerTab

**Files:**
- Create: `src/components/features/tabs/PowerTab.tsx`

- [ ] **Step 1: Write PowerTab**

Contains 5 charts:
1. Power output (MAF) over time (TimeSeriesChart)
2. Power output (fuel) over time (TimeSeriesChart, overlay with MAF)
3. Power vs RPM (ScatterChart, color = throttlePosition)
4. Throttle over time (TimeSeriesChart)
5. Throttle vs acceleration (ScatterChart)

- [ ] **Step 2: Verify types compile and commit**

```bash
git add src/components/features/tabs/PowerTab.tsx
git commit -m "feat: add PowerTab with 5 interactive charts"
```

---

## Chunk 6: Tab Components (Driving Behavior, ABS, AWD, Electrical, Air Intake)

### Task 25: Create DrivingBehaviorTab

**Files:**
- Create: `src/components/features/tabs/DrivingBehaviorTab.tsx`

- [ ] **Step 1: Write DrivingBehaviorTab**

Contains 3 charts:
1. Acceleration histogram (HistogramChart, subaru-red for harsh events)
2. Speed vs RPM (ScatterChart, color = actualGearRatio)
3. Speed profile over time (TimeSeriesChart with event markers)

- [ ] **Step 2: Verify types compile and commit**

```bash
git add src/components/features/tabs/DrivingBehaviorTab.tsx
git commit -m "feat: add DrivingBehaviorTab with 3 interactive charts"
```

---

### Task 26: Create ABSTab

**Files:**
- Create: `src/components/features/tabs/ABSTab.tsx`

- [ ] **Step 1: Write ABSTab**

Contains 4 charts:
1. 4-wheel speed comparison (TimeSeriesChart, 4 traces: FL, FR, RL, RR)
2. Front-rear differential (TimeSeriesChart from derived.wheelSpeedDiffs.frontRearDelta)
3. Left-right differential (TimeSeriesChart from derived.wheelSpeedDiffs.leftRightDelta)
4. Steering angle vs speed (ScatterChart)

- [ ] **Step 2: Verify types compile and commit**

```bash
git add src/components/features/tabs/ABSTab.tsx
git commit -m "feat: add ABSTab with 4 interactive charts"
```

---

### Task 27: Create AWDTab

**Files:**
- Create: `src/components/features/tabs/AWDTab.tsx`

- [ ] **Step 1: Write AWDTab**

Contains 2 charts:
1. Solenoid current over time (TimeSeriesChart, actual vs set dual line)
2. AWD engagement vs steering (ScatterChart, x = steeringAngle, y = awdSolenoidActualCurrent)

- [ ] **Step 2: Verify types compile and commit**

```bash
git add src/components/features/tabs/AWDTab.tsx
git commit -m "feat: add AWDTab with 2 interactive charts"
```

---

### Task 28: Create ElectricalTab

**Files:**
- Create: `src/components/features/tabs/ElectricalTab.tsx`

- [ ] **Step 1: Write ElectricalTab**

Contains 1 chart:
1. Battery voltage over time (TimeSeriesChart, threshold bands, subaru-red glow below 12.5V)

- [ ] **Step 2: Verify types compile and commit**

```bash
git add src/components/features/tabs/ElectricalTab.tsx
git commit -m "feat: add ElectricalTab with battery voltage chart"
```

---

### Task 29: Create AirIntakeTab

**Files:**
- Create: `src/components/features/tabs/AirIntakeTab.tsx`

- [ ] **Step 1: Write AirIntakeTab**

Contains 4 charts:
1. MAF air flow over time (TimeSeriesChart, threshold bands)
2. Intake vacuum over time (TimeSeriesChart, threshold bands, positive = subaru-red)
3. Intake air temp over time (TimeSeriesChart)
4. Manifold pressure vs RPM (ScatterChart)

- [ ] **Step 2: Verify types compile and commit**

```bash
git add src/components/features/tabs/AirIntakeTab.tsx
git commit -m "feat: add AirIntakeTab with 4 interactive charts"
```

---

## Chunk 7: Dashboard Integration

### Task 30: Update CategoryIcon for new tab structure

**Files:**
- Modify: `src/components/ui/CategoryIcon.tsx`

- [ ] **Step 1: Replace `motion` with `overview` + `drivingBehavior`, add new icons**

The existing `motion` category is removed from the order and split into two new entries: `overview` (map + speed profile + safety gauge) and `drivingBehavior` (acceleration analysis). The `motion` key still exists in the types for backward-compatible metric access, but it is no longer a tab.

Update `CATEGORY_ORDER`:
```ts
export const CATEGORY_ORDER = [
  "overview",
  "engine",
  "fuel",
  "transmission",
  "power",
  "drivingBehavior",
  "abs",
  "awd",
  "electrical",
  "airIntake",
] as const;
```

Update `CATEGORY_LABELS`:
```ts
export const CATEGORY_LABELS: Record<string, string> = {
  overview: "Overview",
  engine: "Engine",
  fuel: "Fuel",
  transmission: "Transmission",
  power: "Power",
  drivingBehavior: "Driving",
  abs: "ABS / Stability",
  awd: "AWD",
  electrical: "Electrical",
  airIntake: "Air Intake",
};
```

Update `CATEGORY_SHORT_LABELS` similarly.

Add `"overview"` and `"drivingBehavior"` cases to the `CategoryIcon` switch:
- Overview: map pin / route icon
- Driving Behavior: car / steering wheel icon

- [ ] **Step 2: Verify types compile**

Run: `npm run type-check`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/components/ui/CategoryIcon.tsx
git commit -m "feat: update category icons and ordering for 10-tab structure"
```

---

### Task 31: Update dashboard page to consume extended API response

**Files:**
- Modify: `src/app/dashboard/page.tsx`

- [ ] **Step 1: Update state and data flow**

Key changes:
1. Import `ExtendedAnalysisResponse`, `OBD2DataPoint`, `GPSDataPoint`, `DerivedMetrics`, `ThresholdConfig` from `@/types`
2. Add state for new fields: `timeSeries`, `gps`, `derived`, `thresholds`
3. In `handleFileSelect`: type the `data` response as `ExtendedAnalysisResponse` (currently untyped — `const data = await response.json()`). Destructure `data.timeSeries`, `data.gps`, `data.derived`, `data.thresholds` from response
4. Wrap results area in `<TimeRangeProvider>`
5. Import and render tab components: `OverviewTab`, `EngineTab`, `FuelTab`, `TransmissionTab`, `PowerTab`, `DrivingBehaviorTab`, `ABSTab`, `AWDTab`, `ElectricalTab`, `AirIntakeTab`
6. Each tab renders: existing `CategoryPanel` / `CategoryMetrics` as summary row at top, then the new chart tab component below
7. The `overview` tab replaces `motion` as the default active tab
8. Add a "Reset Zoom" button that calls `resetTimeRange()` when a range is active

- [ ] **Step 2: Verify the app builds**

Run: `npm run build`
Expected: PASS

- [ ] **Step 3: Manual test**

Run: `npm run dev`, upload the CSV file, verify:
- All 10 tabs render
- Charts appear with data
- Map shows the GPS route
- Zooming on a chart syncs other charts on the same tab
- Clicking a map segment updates the time range
- Reset zoom button works
- Existing metric cards still display correctly
- Metric tooltips appear on hover/tap

- [ ] **Step 4: Commit**

```bash
git add src/app/dashboard/page.tsx
git commit -m "feat: integrate interactive charts and GPS map into dashboard"
```

---

### Task 32: Verify full build and type-check

**Files:** None (verification only)

- [ ] **Step 1: Run type-check**

Run: `npm run type-check`
Expected: PASS

- [ ] **Step 2: Run lint**

Run: `npm run lint`
Expected: PASS (fix any lint errors found)

- [ ] **Step 3: Run build**

Run: `npm run build`
Expected: PASS

- [ ] **Step 4: Final commit if any fixes were needed**

```bash
git add -A
git commit -m "fix: resolve lint and type errors from chart integration"
```

---

## Task Dependency Summary

```
Task 1 (deps) → Task 2 (types) → Task 3 (thresholds) ─┐
                                   Task 4 (tooltips) ───┤
                                   Task 5 (design tokens)│
                                                         ├→ Task 9 (API route)
Task 6 (GPS parser) ────────────────────────────────────┤
Task 7 (derived metrics) ──────────────────────────────┤
Task 8 (LTTB downsampling) ───────────────────────────┘
                                                         │
Task 10 (useTimeRange) ─┐                               │
Task 11 (ChartWrapper) ─┤                               │
Task 12 (MetricTooltip) ┤→ Tasks 14-19 (chart components)│
Task 13 (chart theme) ──┘         │                      │
                                  ├→ Tasks 20-29 (tab components)
                                  │         │
                                  └→ Tasks 30-31 (dashboard integration)
                                            │
                                            └→ Task 32 (verification)
```

**Parallelizable groups:**
- Tasks 3, 4, 5 can run in parallel (all depend on Task 2 for types, but not on each other)
- Tasks 6, 7, 8 can run in parallel
- Tasks 10, 11, 12, 13 can run in parallel
- Tasks 14-19 can run in parallel (all generic chart components)
- Tasks 20-29 can run in parallel (all tab components, given chart components exist)
