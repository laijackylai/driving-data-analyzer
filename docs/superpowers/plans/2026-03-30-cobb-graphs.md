# COBB Graphs Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade all 6 existing COBB tab components from basic charts to the brainstormed combined raw time-series + insight graphs, and add 2 new COBB tabs for Engine (Cat 1) and Power (Cat 4). Total: 40 charts across 8 categories.

**Architecture:** Each existing COBB tab (`CobbBoostTab`, `CobbKnockTab`, etc.) gets rewritten to match `docs/plan/graphs-decisions.md`. Two new tabs (`CobbEngineTab`, `CobbPowerTab`) are created. New chart components (`HeatmapChart`, `DynoChart`) are assumed to exist from the OBD2 plan. New metric tooltips go in `metricTooltips.ts`.

**Tech Stack:** React 19, Plotly.js (via react-plotly.js), TypeScript strict

**Reference:** `docs/plan/graphs-decisions.md` — Categories 1–4 (COBB-specific) + Categories 10–13

**Dependency:** OBD2 plan Tasks 0–2 must be completed first (HeatmapChart, StackedAreaChart, WOT detection, HP/torque calc).

---

## Current State → Target State

| Tab | Current Charts | Target Charts | Delta |
|-----|:---:|:---:|-------|
| CobbBoostTab | 3 (actual vs target, error, boost vs RPM scatter) | 7 (2 combined + 5 insight) | Add: VE estimate, IAT heat soak, boost error histogram, MAF vs RPM |
| CobbKnockTab | 3 (feedback knock, fine knock learn, DAM timeline) | 5 (2 combined + 3 insight) | Add: knock vs RPM scatter, DAM recovery, fine knock heatmap |
| CobbAFRTab | 3 (AFR actual/target, correction/learning, AFR vs RPM) | 4 (1 combined + 3 insight) | Add: AFR learning heatmap, AFR vs Boost scatter. Remove injector duty (moved to Cat 12) |
| CobbWastegateTab | 1 (actual vs target) | 4 (1 combined + 3 insight) | Add: wastegate error vs boost, position vs RPM, boost overshoot |
| CobbInjectorTab | 3 (duty cycle, pulse width, duty vs RPM scatter) | 4 (2 combined + 2 insight) | Add: fuel pressure error vs RPM, injector headroom heatmap |
| CobbAVCSTab | 1 (intake + exhaust timeline) | 3 (1 combined + 2 insight) | Add: cam angle vs RPM, AVCS response check |
| **NEW** CobbEngineTab | — | 7 (3 combined + 4 insight) | New tab: same structure as OBD2 EngineTab but using COBB fields |
| **NEW** CobbPowerTab | — | 6 (dyno + pull overlay + ECU torque + gear overlay + peak trend + P/W) | New tab: HP/torque with ECU reqTorqueNm cross-reference |

---

## File Structure

### New tab components
- `src/components/features/tabs/CobbEngineTab.tsx` — Cat 1 for COBB data
- `src/components/features/tabs/CobbPowerTab.tsx` — Cat 4 for COBB data (includes ECU torque)

### Modified tab components
- `src/components/features/tabs/CobbBoostTab.tsx` — Cat 2 (Air Intake/Boost)
- `src/components/features/tabs/CobbKnockTab.tsx` — Cat 10
- `src/components/features/tabs/CobbAFRTab.tsx` — Cat 3 (Fuel/AFR)
- `src/components/features/tabs/CobbWastegateTab.tsx` — Cat 11
- `src/components/features/tabs/CobbInjectorTab.tsx` — Cat 12
- `src/components/features/tabs/CobbAVCSTab.tsx` — Cat 13

### Modified support files
- `src/components/features/DashboardView.tsx` — add CobbEngineTab + CobbPowerTab sections, update COBB_ONLY_CATS
- `src/components/ui/CategoryIcon.tsx` — add labels/icons for cobbEngine, cobbPower
- `src/lib/data/metricTooltips.ts` — add COBB-specific tooltip entries
- `src/types/index.ts` — extend if needed

### Shared (from OBD2 plan — must exist)
- `src/components/features/charts/HeatmapChart.tsx`
- `src/lib/data/wotDetection.ts`
- `src/lib/data/hpTorqueCalc.ts`

---

## Task 0: Register New COBB Tabs in Dashboard

**Files:**
- Modify: `src/components/features/DashboardView.tsx`
- Modify: `src/components/ui/CategoryIcon.tsx`

Before creating the tabs, register them in the dashboard so they appear in the tab bar.

- [ ] **Step 1: Add category entries**

In `CategoryIcon.tsx`, add to `CATEGORY_LABELS`, `CATEGORY_SHORT_LABELS`, and `CATEGORY_ORDER`:

```ts
// Add to CATEGORY_ORDER (in the COBB section, before cobbBoost)
"cobbEngine", "cobbPower",

// Add to CATEGORY_LABELS
cobbEngine: "Engine",
cobbPower: "Power",

// Add to CATEGORY_SHORT_LABELS
cobbEngine: "Engine",
cobbPower: "Power",
```

Add icon mappings for `cobbEngine` and `cobbPower` (reuse engine/power icons).

- [ ] **Step 2: Add COBB_ONLY_CATS entries**

In `DashboardView.tsx`, update:
```ts
const COBB_ONLY_CATS = new Set([
  "cobbEngine", "cobbPower",  // NEW
  "cobbBoost", "cobbKnock", "cobbAFR", "cobbWastegate", "cobbInjector", "cobbAVCS",
]);
```

- [ ] **Step 3: Add placeholder sections in DashboardContent**

Add sections for `cobbEngine` and `cobbPower` in the COBB block of `DashboardContent`. Import placeholder components (will be created in later tasks):

```tsx
{/* #cobbEngine */}
<section id="cobbEngine" className={SCROLL_MARGIN}>
  {hasChartData && (
    <CobbEngineTab timeSeries={timeSeries} />
  )}
</section>

{/* #cobbPower */}
<section id="cobbPower" className={SCROLL_MARGIN}>
  {hasChartData && (
    <CobbPowerTab timeSeries={timeSeries} />
  )}
</section>
```

- [ ] **Step 4: Create stub tab files**

Create minimal stub components so the build passes:

```tsx
// src/components/features/tabs/CobbEngineTab.tsx
"use client";
import { OBD2DataPoint } from "@/types";
interface CobbEngineTabProps { timeSeries: OBD2DataPoint[]; }
export function CobbEngineTab({ timeSeries }: CobbEngineTabProps) {
  return <div className="space-y-4 pt-4"><p className="text-sapphire-400 text-sm">Engine charts coming soon</p></div>;
}

// src/components/features/tabs/CobbPowerTab.tsx
"use client";
import { OBD2DataPoint } from "@/types";
interface CobbPowerTabProps { timeSeries: OBD2DataPoint[]; }
export function CobbPowerTab({ timeSeries }: CobbPowerTabProps) {
  return <div className="space-y-4 pt-4"><p className="text-sapphire-400 text-sm">Power charts coming soon</p></div>;
}
```

- [ ] **Step 5: Verify it builds**

Run: `npm run type-check`

- [ ] **Step 6: Commit**

```bash
git add src/components/features/DashboardView.tsx src/components/ui/CategoryIcon.tsx \
  src/components/features/tabs/CobbEngineTab.tsx src/components/features/tabs/CobbPowerTab.tsx
git commit -m "feat(cobb): register CobbEngine + CobbPower tabs in dashboard"
```

---

## Task 1: Category 10 — Knock Tab (5 charts)

**Files:**
- Modify: `src/components/features/tabs/CobbKnockTab.tsx`
- Modify: `src/lib/data/metricTooltips.ts`

Replace 3 basic charts with 2 combined + 3 insight.

**Target charts:**
1. Timing Advance + Feedback Knock + Fine Knock Learn (combined, timing on left, knock values on right)
2. DAM timeline with boost on right Y-axis
3. Feedback Knock vs RPM scatter (colored by boost) — knock-prone zones
4. DAM recovery timeline — DAM events with recovery duration
5. Fine Knock Learn heatmap: RPM × Load

- [ ] **Step 1: Add new tooltips**

```ts
cobbKnockVsRpm: {
  axis: "X-axis shows RPM; Y-axis shows feedback knock (°); color shows boost pressure.",
  values: [
    "Knock events concentrated at specific RPM/boost zones = tune needs adjustment there.",
    "Scattered knock across all RPM with high boost = fuel octane too low for this boost level.",
  ],
  interpretation: "Concentrated clusters are actionable — the tuner can retard timing in those specific cells. Random scatter means global issue (fuel, IAT).",
},
cobbDamRecovery: {
  axis: "X-axis shows time; Y-axis shows DAM value (0–1); annotations show recovery duration.",
  values: [
    "Fast recovery (< 30 seconds) = transient knock (bad fuel slug, momentary heat spike).",
    "Slow recovery (> 2 minutes) = persistent knock source needs investigation.",
  ],
  interpretation: "DAM that drops and never recovers within the session is a red flag — do not continue WOT pulls until resolved.",
},
cobbFineKnockHeatmap: {
  axis: "X-axis shows RPM bins; Y-axis shows load bins; color shows average fine knock learn (°).",
  values: [
    "Green cells (near 0°) = engine is happy in that operating range.",
    "Red cells (large negative) = ECU has permanently pulled timing — tune is too aggressive there.",
  ],
  interpretation: "This is the primary tuner diagnostic view — red cells tell you exactly where in the RPM/load map to retard timing.",
},
```

- [ ] **Step 2: Rewrite CobbKnockTab**

Key changes:
- Chart 1: `TimeSeriesChart` — timingAdvance on left, feedbackKnock + fineKnockLearn on right
- Chart 2: `TimeSeriesChart` — dam on left, boostPsi on right
- Chart 3: `ScatterChart` — engineRpm vs feedbackKnock, colored by boostPsi
- Chart 4: DAM recovery — compute DAM drop events and recovery duration inline:

```ts
// Find DAM drop events: DAM drops below 1.0, track recovery time
interface DamEvent { startTime: number; endTime: number; minDam: number; recoverySeconds: number; }
const damEvents: DamEvent[] = [];
let inDrop = false;
let dropStart = 0;
let minDam = 1;
for (const d of timeSeries) {
  if (typeof d.dam !== "number") continue;
  if (!inDrop && d.dam < 0.99) {
    inDrop = true;
    dropStart = d.timestamp;
    minDam = d.dam;
  } else if (inDrop) {
    minDam = Math.min(minDam, d.dam);
    if (d.dam >= 0.99) {
      damEvents.push({
        startTime: dropStart,
        endTime: d.timestamp,
        minDam,
        recoverySeconds: d.timestamp - dropStart,
      });
      inDrop = false;
    }
  }
}
```

Render as `TimeSeriesChart` of DAM with event marker annotations showing recovery duration.

- Chart 5: `HeatmapChart` — data = points with engineRpm, calculatedLoadGRev, fineKnockLearn:

```ts
const heatmapData = timeSeries
  .filter((d) =>
    typeof d.engineRpm === "number" &&
    typeof d.calculatedLoadGRev === "number" &&
    typeof d.fineKnockLearn === "number"
  )
  .map((d) => ({
    x: d.engineRpm!,
    y: d.calculatedLoadGRev!,
    value: d.fineKnockLearn!,
  }));
```

- [ ] **Step 3: Verify & commit**

```bash
git add src/components/features/tabs/CobbKnockTab.tsx src/lib/data/metricTooltips.ts
git commit -m "feat(cobb/knock): rewrite with 5 charts — timing combined, DAM recovery, knock heatmap"
```

---

## Task 2: Category 2 — Boost Tab (7 charts for turbo)

**Files:**
- Modify: `src/components/features/tabs/CobbBoostTab.tsx`
- Modify: `src/lib/data/metricTooltips.ts`

Replace 3 basic charts with 2 combined + 5 insight.

**Target charts:**
1. MAF + Throttle + Manifold Pressure (combined, dual Y-axis)
2. Boost + Target Boost + Boost Error (combined, dual Y-axis)
3. Boost vs RPM scatter (colored by gear)
4. Volumetric Efficiency estimate vs RPM
5. IAT heat soak (IAT vs time, colored by engine load)
6. Boost Error histogram
7. MAF vs RPM curve

- [ ] **Step 1: Add new tooltips**

Reuse `volumetricEfficiency`, `iatHeatSoak`, `mafVsRpm` from OBD2 plan if already added. Add:

```ts
cobbBoostVsRpmGear: {
  axis: "X-axis shows RPM; Y-axis shows boost pressure (psi); color shows gear position.",
  values: [
    "Boost should rise steeply from ~2500 RPM and plateau. Each gear should show a similar curve.",
    "Lower gears (1st-2nd) may show lower peak boost due to shorter time in boost range.",
  ],
  interpretation: "Comparing boost curves across gears reveals load-dependent turbo behavior — inconsistent curves suggest wastegate tuning issues.",
},
cobbBoostErrorHist: {
  axis: "X-axis shows boost error (actual − target) in psi; Y-axis shows frequency count.",
  values: [
    "Tight distribution centered at 0 = good tune, wastegate is tracking target well.",
    "Skewed negative = chronic underboost (check turbo, wastegate actuator, boost leaks).",
  ],
  interpretation: "The shape tells the story — bimodal distribution suggests two distinct operating regimes (spool-up vs steady-state).",
},
```

- [ ] **Step 2: Rewrite CobbBoostTab**

Keep stat cards at top. Charts:

- Chart 1: `TimeSeriesChart` — mafAirFlowRate on left, accelPosition + manifoldAbsPressPsi on right
- Chart 2: `TimeSeriesChart` — boostPsi + targetBoostFinalRelPsi on left, tdBoostErrorPsi on right
- Chart 3: `ScatterChart` — engineRpm vs boostPsi, colorField=gearPosition
- Chart 4: VE computation (same as OBD2 plan but using COBB fields):

```ts
// FA24 turbo: displacement = 2.387L = 0.002387 m³
// VE > 100% is expected on turbo (pressurized intake)
const DISPLACEMENT_M3 = 0.002387;
const AIR_DENSITY = 1.225;
```

- Chart 5: `ScatterChart` — use timestamp as x-proxy, IAT on y, colored by engineLoad (use `intakeAirTemp` or `intakeTempManifold`)
- Chart 6: `HistogramChart` — extract tdBoostErrorPsi values
- Chart 7: `ScatterChart` — engineRpm vs mafAirFlowRate

- [ ] **Step 3: Verify & commit**

```bash
git add src/components/features/tabs/CobbBoostTab.tsx src/lib/data/metricTooltips.ts
git commit -m "feat(cobb/boost): rewrite with 7 charts — VE, IAT heat soak, boost error histogram"
```

---

## Task 3: Category 3 — AFR Tab (4 charts)

**Files:**
- Modify: `src/components/features/tabs/CobbAFRTab.tsx`
- Modify: `src/lib/data/metricTooltips.ts`

Replace 3 basic charts with 1 combined + 3 insight.

**Target charts:**
2. AFR Commanded + AFR Learning + Injector Duty Cycle (combined, AFR on left, duty % on right)
4. AFR Learning heatmap: RPM × Load
6. Injector Duty Cycle vs RPM (moved from existing, but now in context of AFR tab as cross-ref)
8. AFR vs Boost scatter (colored by RPM) — **most important safety graph**

- [ ] **Step 1: Add new tooltips**

```ts
cobbAfrLearningHeatmap: {
  axis: "X-axis shows RPM bins; Y-axis shows load bins (g/rev); color shows AF Learning 1 (%).",
  values: [
    "Green cells (near 0%) = base map is accurate for that operating range.",
    "Red cells (large positive/negative) = ECU is compensating heavily — base map needs correction.",
  ],
  interpretation: "Large learning corrections after a reflash suggest the OTS map doesn't match your injectors or fuel system.",
},
cobbAfrVsBoost: {
  axis: "X-axis shows boost (psi); Y-axis shows actual AFR; color shows RPM.",
  values: [
    "Under boost, AFR should go rich (11.0-11.8:1) for safety — this protects pistons from detonation.",
    "Lean spots at high boost (AFR > 12.0:1) are the highest-risk data points in any COBB log.",
  ],
  interpretation: "⚠️ This is the most important safety graph for tuned turbo cars. Any lean outliers at high boost demand immediate investigation — check fuel pressure, injector duty, and boost target.",
},
```

- [ ] **Step 2: Rewrite CobbAFRTab**

Keep stat cards. Charts:

- Chart 2: `TimeSeriesChart` — afSens1Ratio + clFuelTarget on left, injDutyCycle on right (shows fueling control at a glance)
- Chart 4: `HeatmapChart` — engineRpm × calculatedLoadGRev, value = afLearning1
- Chart 6: `ScatterChart` — engineRpm vs injDutyCycle, colored by accelPosition (kept as cross-reference)
- Chart 8: `ScatterChart` — boostPsi vs afSens1Ratio, colored by engineRpm — **highlight danger zone** with a horizontal shape at AFR > 12.0

For the danger zone annotation on Chart 8, add a Plotly shape:
```ts
// Add to chart 8 layout
shapes: [{
  type: "rect", xref: "paper", x0: 0, x1: 1,
  yref: "y", y0: 12.0, y1: 15.0,
  fillcolor: "rgba(224, 32, 44, 0.1)",
  line: { width: 0 }, layer: "below",
}],
```

- [ ] **Step 3: Verify & commit**

```bash
git add src/components/features/tabs/CobbAFRTab.tsx src/lib/data/metricTooltips.ts
git commit -m "feat(cobb/afr): rewrite with AFR learning heatmap + AFR vs boost safety chart"
```

---

## Task 4: Category 11 — Wastegate Tab (4 charts)

**Files:**
- Modify: `src/components/features/tabs/CobbWastegateTab.tsx`
- Modify: `src/lib/data/metricTooltips.ts`

Replace 1 basic chart with 1 combined + 3 insight.

**Target charts:**
1. Wastegate Positions + Boost (actual vs commanded on left, boost on right)
2. Wastegate error vs boost scatter (colored by RPM)
3. Wastegate position vs RPM curve (colored by gear)
4. Boost overshoot detection (overshoot magnitude vs wastegate position)

- [ ] **Step 1: Add new tooltips**

```ts
cobbWastegateErrorVsBoost: {
  axis: "X-axis shows boost (psi); Y-axis shows wastegate error (actual − commanded) in mm; color shows RPM.",
  values: [
    "Error near 0 across all boost levels = wastegate is tracking well.",
    "Large errors at high boost = actuator is struggling — possible mechanical binding or weak actuator.",
  ],
  interpretation: "Errors that grow with boost suggest the actuator can't overcome exhaust backpressure — check actuator spring rate.",
},
cobbWastegateVsRpm: {
  axis: "X-axis shows RPM; Y-axis shows commanded wastegate position (mm); color shows gear.",
  values: [
    "Shows the ECU's wastegate control strategy across the rev range.",
    "Position should increase (open more) at higher RPM to control boost.",
  ],
  interpretation: "Comparing across gears reveals load-dependent behavior — if the curve shifts significantly per gear, the boost control is load-compensating correctly.",
},
cobbBoostOvershoot: {
  axis: "X-axis shows wastegate position (mm); Y-axis shows boost overshoot (actual − target when positive) in psi.",
  values: [
    "Overshoot < 1 psi is normal transient behavior during spool-up.",
    "> 3 psi overshoot at specific wastegate positions = tuning opportunity (adjust wastegate duty at that opening).",
  ],
  interpretation: "Overshoots that correlate with specific wastegate positions reveal where the PID controller needs adjustment.",
},
```

- [ ] **Step 2: Rewrite CobbWastegateTab**

Keep stat cards. Charts:

- Chart 1: `TimeSeriesChart` — wastegateActualPosMm + wastegateCommFinalPosMm on left, boostPsi on right
- Chart 2: `ScatterChart` — boostPsi vs wastegateError (computed inline: actual - commanded), colored by engineRpm
- Chart 3: `ScatterChart` — engineRpm vs wastegateCommFinalPosMm, colored by gearPosition
- Chart 4: `ScatterChart` — filter to overshoot only (boostPsi > targetBoostFinalRelPsi), plot wastegateActualPosMm vs overshoot magnitude

```ts
// Compute overshoot data
const overshootData = timeSeries
  .filter((d) =>
    typeof d.boostPsi === "number" &&
    typeof d.targetBoostFinalRelPsi === "number" &&
    typeof d.wastegateActualPosMm === "number" &&
    d.boostPsi! > d.targetBoostFinalRelPsi!
  )
  .map((d) => ({
    ...d,
    boostOvershoot: d.boostPsi! - d.targetBoostFinalRelPsi!,
  }));
```

- [ ] **Step 3: Verify & commit**

```bash
git add src/components/features/tabs/CobbWastegateTab.tsx src/lib/data/metricTooltips.ts
git commit -m "feat(cobb/wastegate): rewrite with 4 charts — error vs boost, overshoot detection"
```

---

## Task 5: Category 12 — Injector Tab (4 charts)

**Files:**
- Modify: `src/components/features/tabs/CobbInjectorTab.tsx`
- Modify: `src/lib/data/metricTooltips.ts`

Replace 3 basic charts with 2 combined + 2 insight.

**Target charts:**
1. Injector Duty Cycle + Pulse Width + RPM (combined, duty on left, PW + RPM on right)
2. Fuel Pressure + Target + Injection Timing (combined, pressure on left, timing on right)
3. Fuel pressure error vs RPM (colored by duty cycle) — safety chart
4. Injector headroom heatmap: RPM × Boost (value = 100% - duty cycle)

- [ ] **Step 1: Add new tooltips**

```ts
cobbFuelPressureCombined: {
  axis: "Left Y-axis shows fuel pressure (psi) — actual vs target; right Y-axis shows injection timing (°).",
  values: [
    "Actual tracking target closely = fuel pump is keeping up with demand.",
    "Actual dropping below target at high RPM = pump can't supply enough fuel volume.",
  ],
  interpretation: "Cross-reference with injector duty cycle — if duty is high AND pressure is dropping, the fuel system is at its limit.",
},
cobbFuelPressureError: {
  axis: "X-axis shows RPM; Y-axis shows fuel pressure error (actual − target) in psi; color shows injector duty cycle.",
  values: [
    "Negative error (actual < target) at high RPM + high duty = fuel system can't keep up.",
    "This is a critical safety indicator — lean fueling under boost causes detonation.",
  ],
  interpretation: "If error goes negative only above a certain RPM/duty threshold, the fuel pump is the bottleneck. Consider a fuel pump upgrade.",
},
cobbInjectorHeadroom: {
  axis: "X-axis shows RPM bins; Y-axis shows boost bins (psi); color shows injector headroom (100% − duty cycle).",
  values: [
    "Green cells (>20% headroom) = plenty of injector capacity remaining.",
    "Red cells (<15% headroom) = nearing injector limit — fueling may go lean under sustained demand.",
  ],
  interpretation: "Quick visual answer to 'do I need bigger injectors?' — if high-RPM high-boost cells are red, the answer is yes.",
},
```

- [ ] **Step 2: Rewrite CobbInjectorTab**

Keep stat cards. Charts:

- Chart 1: `TimeSeriesChart` — injDutyCycle on left, injPulseWidth + engineRpm on right
- Chart 2: `TimeSeriesChart` — fuelPressurePsi + fuelPressureTargetPsi on left, injTimingHSoi on right
- Chart 3: `ScatterChart` — engineRpm vs fuelPressureError (computed: fuelPressurePsi - fuelPressureTargetPsi), colored by injDutyCycle
- Chart 4: `HeatmapChart` — engineRpm × boostPsi, value = (100 - injDutyCycle)

For the heatmap, use green→red reversed colorscale (high headroom = green, low = red):
```ts
colorscale={[[0, CHART_COLORS.subaruRed], [0.5, CHART_COLORS.amber], [1, CHART_COLORS.emerald]]}
```

- [ ] **Step 3: Verify & commit**

```bash
git add src/components/features/tabs/CobbInjectorTab.tsx src/lib/data/metricTooltips.ts
git commit -m "feat(cobb/injector): rewrite with fuel pressure error + injector headroom heatmap"
```

---

## Task 6: Category 13 — AVCS Tab (3 charts)

**Files:**
- Modify: `src/components/features/tabs/CobbAVCSTab.tsx`
- Modify: `src/lib/data/metricTooltips.ts`

Replace 1 basic chart with 1 combined + 2 insight.

**Target charts:**
1. AVCS Intake + Exhaust Cam Angles + RPM (combined, cam angles on left, RPM on right)
2. Cam angle vs RPM curve (colored by load)
3. AVCS response check — rate of change of cam angle vs RPM

- [ ] **Step 1: Add new tooltips**

```ts
cobbCamVsRpm: {
  axis: "X-axis shows RPM; Y-axis shows cam advance (°) for intake and exhaust; color shows engine load.",
  values: [
    "Intake cam advances aggressively (15-30°) at mid-RPM for torque; more conservative at low/high RPM.",
    "Exhaust cam timing is typically less variable — large swings suggest AVCS solenoid issues.",
  ],
  interpretation: "Smooth transitions across RPM = healthy AVCS. Erratic scatter = sticking solenoid or low oil pressure in that RPM range.",
},
cobbAvcsResponse: {
  axis: "X-axis shows RPM; Y-axis shows rate of cam angle change (°/second).",
  values: [
    "Fast cam movement (high °/s) = AVCS solenoids are responsive, oil pressure is good.",
    "Slow cam movement at specific RPM zones = sticky solenoid or oil viscosity issue.",
  ],
  interpretation: "Oil thinning at high temp → lower hydraulic pressure → sluggish phaser. Compare intake vs exhaust response — if one is slow and the other isn't, it's solenoid-specific.",
},
```

- [ ] **Step 2: Rewrite CobbAVCSTab**

Keep stat cards. Charts:

- Chart 1: `TimeSeriesChart` — avcsInLeft + avcsExhLeft on left, engineRpm on right
- Chart 2: Two-trace ScatterChart — show intake AND exhaust as separate traces on same chart:

```ts
// Use two ScatterChart calls or build custom Plotly traces
// Intake: engineRpm vs avcsInLeft, colored by calculatedLoadGRev
// Exhaust: engineRpm vs avcsExhLeft, colored by calculatedLoadGRev
```

Since `ScatterChart` only supports one y-field, either:
a) Use two `ScatterChart` instances side by side, or
b) Build custom Plotly traces inline (preferred — keeps them on same axes for comparison)

- Chart 3: AVCS response check — compute rate of change:

```ts
// Rate of change of cam angle (°/second)
const avcsResponseData: { rpm: number; intakeRate: number; exhaustRate: number }[] = [];
for (let i = 1; i < timeSeries.length; i++) {
  const prev = timeSeries[i - 1];
  const curr = timeSeries[i];
  const dt = curr.timestamp - prev.timestamp;
  if (dt <= 0 || dt > 1) continue; // skip gaps > 1 second

  const rpm = curr.engineRpm;
  const inRate = (typeof curr.avcsInLeft === "number" && typeof prev.avcsInLeft === "number")
    ? Math.abs(curr.avcsInLeft - prev.avcsInLeft) / dt
    : undefined;
  const exRate = (typeof curr.avcsExhLeft === "number" && typeof prev.avcsExhLeft === "number")
    ? Math.abs(curr.avcsExhLeft - prev.avcsExhLeft) / dt
    : undefined;

  if (typeof rpm === "number" && (inRate !== undefined || exRate !== undefined)) {
    avcsResponseData.push({
      rpm,
      intakeRate: inRate ?? 0,
      exhaustRate: exRate ?? 0,
    });
  }
}
```

Render as scatter: RPM vs rate of change, with separate traces for intake and exhaust.

- [ ] **Step 3: Verify & commit**

```bash
git add src/components/features/tabs/CobbAVCSTab.tsx src/lib/data/metricTooltips.ts
git commit -m "feat(cobb/avcs): rewrite with cam vs RPM curve + AVCS response check"
```

---

## Task 7: Category 1 — COBB Engine Tab (7 charts, new)

**Files:**
- Modify: `src/components/features/tabs/CobbEngineTab.tsx` (replace stub)

Same chart structure as OBD2 EngineTab but adapted for COBB fields. COBB has: engineRpm, timingAdvance, coolantTemp, oilTemp, calculatedLoadGRev (instead of engineLoad %), accelPosition (instead of throttlePosition).

**Target charts:**
1. RPM + Load + Accel Position (combined, RPM on left, load/accel on right)
2. Coolant + Oil temp
3. Timing Advance + Feedback Knock + Fine Knock Learn (combined — similar to Cat 10 chart 1 but in engine context)
4. RPM vs Load scatter colored by coolant temp
5. Thermal delta timeline (oilTemp - coolantTemp)
6. Timing Advance vs RPM scatter (colored by load)
7. Coolant temp stability

- [ ] **Step 1: Implement CobbEngineTab**

Mirror the EngineTab structure from OBD2 plan Task 4, but use COBB field names:
- `accelPosition` instead of `throttlePosition`
- `calculatedLoadGRev` instead of `engineLoad`
- `feedbackKnock` + `fineKnockLearn` instead of `knockCorrection`

Charts 1-7 follow same patterns as OBD2 EngineTab with these field swaps.

- [ ] **Step 2: Verify & commit**

```bash
git add src/components/features/tabs/CobbEngineTab.tsx
git commit -m "feat(cobb/engine): implement 7-chart engine tab for COBB data"
```

---

## Task 8: Category 4 — COBB Power Tab (6 charts, new)

**Files:**
- Modify: `src/components/features/tabs/CobbPowerTab.tsx` (replace stub)
- Modify: `src/components/features/DashboardView.tsx` (pass props)

Same as OBD2 PowerTab but with extra ECU torque chart and COBB-specific fields.

**Target charts:**
1. Classic dyno chart (HP + Torque vs RPM, acceleration-based + MAF-based)
2. Per-pull overlay toggle
3. ECU Torque vs Estimated Torque (COBB-exclusive — reqTorqueNm vs acceleration-based)
4. Power vs Gear overlay
5. Peak HP/Torque trend per pull
6. Power-to-weight ratio vs speed

### WRX Gear Ratios (FA24 6MT)
```ts
const WRX_GEAR_RATIOS: Record<number, number> = {
  1: 3.462, 2: 1.947, 3: 1.366, 4: 1.028, 5: 0.825, 6: 0.673,
};
const WRX_FINAL_DRIVE = 4.111;
```

For COBB, engine torque is computed from wheel torque / (gearRatio × finalDrive) using `gearPosition`.

- [ ] **Step 1: Implement CobbPowerTab**

Key differences from OBD2 PowerTab:
- Uses `accelPosition` for WOT detection (not `throttlePosition`)
- Has `gearPosition` for discrete gear identification
- Has `reqTorqueNm` for ECU torque cross-reference
- Engine torque = wheelTorque / (WRX_GEAR_RATIOS[gear] × WRX_FINAL_DRIVE)

Chart 3 (COBB-exclusive): Plot `reqTorqueNm` vs RPM alongside acceleration-based torque estimate:
```ts
// ECU torque trace
const ecuTorqueData = timeSeries
  .filter((d) => typeof d.reqTorqueNm === "number" && typeof d.engineRpm === "number")
  .map((d) => ({ rpm: d.engineRpm!, torque: d.reqTorqueNm! }));
```

Curb weight input needed (same UX as OBD2 PowerTab).

- [ ] **Step 2: Update DashboardView**

Pass any needed props (curbWeight state can live in the tab component itself since it's user-entered).

- [ ] **Step 3: Verify & commit**

```bash
git add src/components/features/tabs/CobbPowerTab.tsx src/components/features/DashboardView.tsx
git commit -m "feat(cobb/power): implement 6-chart power tab with ECU torque cross-reference"
```

---

## Task 9: Final Integration & Type Check

**Files:**
- All modified files

- [ ] **Step 1: Full type check**

Run: `npm run type-check`
Fix any type errors.

- [ ] **Step 2: Full lint**

Run: `npm run lint`
Fix any lint errors.

- [ ] **Step 3: Build check**

Run: `npm run build`
Verify clean build.

- [ ] **Step 4: Verify COBB tab order in dashboard**

Check `DashboardView.tsx` renders tabs in logical order:
1. CobbEngine (Cat 1)
2. CobbBoost (Cat 2)
3. CobbAFR (Cat 3)
4. CobbPower (Cat 4)
5. CobbKnock (Cat 10)
6. CobbWastegate (Cat 11)
7. CobbInjector (Cat 12)
8. CobbAVCS (Cat 13)

- [ ] **Step 5: Commit any fixes**

```bash
git add -A
git commit -m "fix: resolve type/lint issues from COBB graph implementation"
```

---

## Summary

| Task | Description | New Files | Modified Files |
|------|-------------|-----------|----------------|
| 0 | Register new tabs in dashboard | 2 (stubs) | 2 |
| 1 | Knock Tab (5 charts) | 0 | 2 |
| 2 | Boost Tab (7 charts) | 0 | 2 |
| 3 | AFR Tab (4 charts) | 0 | 2 |
| 4 | Wastegate Tab (4 charts) | 0 | 2 |
| 5 | Injector Tab (4 charts) | 0 | 2 |
| 6 | AVCS Tab (3 charts) | 0 | 2 |
| 7 | COBB Engine Tab (7 charts) | 0 (replace stub) | 1 |
| 8 | COBB Power Tab (6 charts) | 0 (replace stub) | 2 |
| 9 | Integration check | 0 | varies |
| **Total** | **40 charts** | **2** | **~15** |

---

## Execution Order

**Must be done after OBD2 plan Tasks 0–2** (HeatmapChart, StackedAreaChart, WOT detection, HP/torque calc).

Within this plan, tasks are mostly independent except:
- Task 0 must be done first (registers tabs)
- Task 8 (Power) depends on OBD2 plan Task 2 (wotDetection + hpTorqueCalc)
- Task 9 must be last

Tasks 1–7 can be parallelized.
