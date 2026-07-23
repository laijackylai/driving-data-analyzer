# COBB Charts Integration Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Integrate COBB Accessport metrics into the category/tab system so each of the 6 COBB categories gets a proper tab in the nav bar with time-series charts, replacing the current hardcoded metric-card-only section.

**Architecture:** Add 6 COBB category keys to `CATEGORY_ORDER`; filter the tab bar per `dataSource` (COBB tabs only for `"cobb"`, OBD2 tabs only for `"obd2"`); create one tab component per COBB category (stats + charts); swap the hardcoded COBB block in `DashboardView` for proper `<section id="cobbXxx">` sections.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript strict, Tailwind CSS, Plotly (via existing `TimeSeriesChart` / `ScatterChart` wrappers), `ChartWrapper` from `@/components/ui/ChartWrapper`, `CHART_COLORS` from `@/lib/chartTheme`

---

## File Map

| Action | File | Purpose |
|--------|------|---------|
| Modify | `src/components/ui/CategoryIcon.tsx` | Add 6 COBB keys to `CATEGORY_ORDER`, `CATEGORY_LABELS`, `CATEGORY_SHORT_LABELS`, and `CategoryIcon` switch |
| Create | `src/components/features/tabs/CobbStatCard.tsx` | Shared stat-card sub-component reused by all 6 COBB tab files |
| Create | `src/components/features/tabs/CobbBoostTab.tsx` | Boost Curve tab — stats + time-series + scatter |
| Create | `src/components/features/tabs/CobbKnockTab.tsx` | Knock Events tab — stats + time-series (feedbackKnock, DAM) |
| Create | `src/components/features/tabs/CobbAFRTab.tsx` | AFR vs Target tab — stats + time-series + scatter |
| Create | `src/components/features/tabs/CobbWastegateTab.tsx` | Wastegate Position tab — stats + time-series |
| Create | `src/components/features/tabs/CobbInjectorTab.tsx` | Injector tab — stats + time-series + scatter |
| Create | `src/components/features/tabs/CobbAVCSTab.tsx` | AVCS Cam Timing tab — stats + time-series |
| Modify | `src/components/features/DashboardView.tsx` | Filter tab bar by dataSource, add 6 COBB sections, remove hardcoded COBB block |

---

## Task 1: Add COBB categories to CategoryIcon.tsx

**Files:**
- Modify: `src/components/ui/CategoryIcon.tsx`

- [ ] **Step 1: Add 6 keys to `CATEGORY_ORDER`**

Open `src/components/ui/CategoryIcon.tsx`. Replace the existing `CATEGORY_ORDER` export (lines 221–233) with:

```tsx
export const CATEGORY_ORDER = [
  "summary",
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
  // COBB Accessport categories
  "cobbBoost",
  "cobbKnock",
  "cobbAFR",
  "cobbWastegate",
  "cobbInjector",
  "cobbAVCS",
] as const;
```

- [ ] **Step 2: Add entries to `CATEGORY_LABELS`**

Extend `CATEGORY_LABELS` with:

```tsx
export const CATEGORY_LABELS: Record<string, string> = {
  // … existing entries unchanged …
  summary: "Summary",
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
  // COBB
  cobbBoost: "Boost",
  cobbKnock: "Knock",
  cobbAFR: "AFR",
  cobbWastegate: "Wastegate",
  cobbInjector: "Injector",
  cobbAVCS: "AVCS",
};
```

- [ ] **Step 3: Add entries to `CATEGORY_SHORT_LABELS`**

```tsx
export const CATEGORY_SHORT_LABELS: Record<string, string> = {
  // … existing unchanged …
  summary: "Sum",
  overview: "Map",
  engine: "Engine",
  fuel: "Fuel",
  transmission: "Trans",
  power: "Power",
  drivingBehavior: "Drive",
  abs: "ABS",
  awd: "AWD",
  electrical: "Elec",
  airIntake: "Air",
  // COBB
  cobbBoost: "Boost",
  cobbKnock: "Knock",
  cobbAFR: "AFR",
  cobbWastegate: "WG",
  cobbInjector: "Inj",
  cobbAVCS: "AVCS",
};
```

- [ ] **Step 4: Add SVG icon cases to `CategoryIcon` switch**

Add these cases before the `default:` clause:

```tsx
case "cobbBoost":
  // Pressure gauge
  return (
    <svg {...iconProps}>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 6v2" />
      <path d="M6.34 8.34l1.42 1.42" />
      <path d="M4 14h2" />
      <path d="M18 14h2" />
      <path d="M16.24 8.34l-1.42 1.42" />
      <path d="M12 12l3-3" />
      <circle cx="12" cy="12" r="1.5" fill="currentColor" />
    </svg>
  );

case "cobbKnock":
  // Warning triangle with exclamation
  return (
    <svg {...iconProps}>
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );

case "cobbAFR":
  // Scale / balance
  return (
    <svg {...iconProps}>
      <line x1="12" y1="2" x2="12" y2="22" />
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  );

case "cobbWastegate":
  // Gate / valve
  return (
    <svg {...iconProps}>
      <circle cx="12" cy="12" r="10" />
      <path d="M4.93 4.93l14.14 14.14" />
      <path d="M12 8v4l3 3" />
    </svg>
  );

case "cobbInjector":
  // Droplet / injector spray
  return (
    <svg {...iconProps}>
      <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
      <line x1="12" y1="22" x2="12" y2="18" />
      <line x1="9" y1="19" x2="15" y2="19" />
    </svg>
  );

case "cobbAVCS":
  // Camshaft / timing lobes
  return (
    <svg {...iconProps}>
      <ellipse cx="12" cy="12" rx="10" ry="4" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <circle cx="7" cy="12" r="2" fill="currentColor" />
      <circle cx="17" cy="12" r="2" fill="currentColor" />
    </svg>
  );
```

- [ ] **Step 5: Type-check**

```bash
npm run type-check
```

Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add src/components/ui/CategoryIcon.tsx
git commit -m "feat(ui): add 6 COBB categories to CategoryIcon order, labels, and icons"
```

---

## Task 2: Create CobbStatCard shared component

**Files:**
- Create: `src/components/features/tabs/CobbStatCard.tsx`

- [ ] **Step 1: Create the file**

```tsx
// src/components/features/tabs/CobbStatCard.tsx
interface CobbStatCardProps {
  label: string;
  value: string | number | null;
  unit?: string;
}

export function CobbStatCard({ label, value, unit }: CobbStatCardProps) {
  const display =
    value != null ? `${value}${unit ? ` ${unit}` : ""}` : "—";
  return (
    <div className="rounded-lg bg-sapphire-900/40 border border-glass-edge p-3">
      <p className="text-xs text-sapphire-500 mb-1">{label}</p>
      <p className="text-lg font-mono font-semibold text-sapphire-100">{display}</p>
    </div>
  );
}
```

- [ ] **Step 2: Type-check**

```bash
npm run type-check
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/features/tabs/CobbStatCard.tsx
git commit -m "feat(ui): add shared CobbStatCard component for COBB metric display"
```

---

## Task 3: Create CobbBoostTab

**Files:**
- Create: `src/components/features/tabs/CobbBoostTab.tsx`

OBD2DataPoint fields used: `boostPsi`, `targetBoostFinalRelPsi`, `tdBoostErrorPsi`, `engineRpm`, `throttlePosition`
CobbBoostMetrics fields: `avgBoostPsi`, `maxBoostPsi`, `avgTargetBoostPsi`, `maxTargetBoostPsi`, `avgBoostErrorPsi`, `maxBoostErrorPsi`

- [ ] **Step 1: Create the file**

```tsx
"use client";

import { OBD2DataPoint, CobbBoostMetrics } from "@/types";
import { ChartWrapper } from "@/components/ui/ChartWrapper";
import { TimeSeriesChart } from "@/components/features/charts/TimeSeriesChart";
import { ScatterChart } from "@/components/features/charts/ScatterChart";
import { CHART_COLORS } from "@/lib/chartTheme";
import { CobbStatCard } from "@/components/features/tabs/CobbStatCard";

interface CobbBoostTabProps {
  timeSeries: OBD2DataPoint[];
  stats: CobbBoostMetrics;
}

export function CobbBoostTab({ timeSeries, stats }: CobbBoostTabProps) {
  const startTime = timeSeries[0]?.timestamp ?? 0;

  return (
    <div className="space-y-4 pt-4">
      {/* Summary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <CobbStatCard label="Avg Boost" value={stats.avgBoostPsi} unit="psi" />
        <CobbStatCard label="Max Boost" value={stats.maxBoostPsi} unit="psi" />
        <CobbStatCard label="Avg Target" value={stats.avgTargetBoostPsi} unit="psi" />
        <CobbStatCard label="Max Target" value={stats.maxTargetBoostPsi} unit="psi" />
        <CobbStatCard label="Avg Error" value={stats.avgBoostErrorPsi} unit="psi" />
        <CobbStatCard label="Max Error" value={stats.maxBoostErrorPsi} unit="psi" />
      </div>

      {/* Boost actual vs target over time */}
      <ChartWrapper title="Boost Pressure — Actual vs Target" height={280}>
        <TimeSeriesChart
          data={timeSeries}
          traces={[
            { field: "boostPsi", name: "Actual (psi)", color: CHART_COLORS.primary },
            { field: "targetBoostFinalRelPsi", name: "Target (psi)", color: CHART_COLORS.amber, yaxis: "y2" },
          ]}
          yAxisLabel="Actual psi"
          y2AxisLabel="Target psi"
          height={280}
          startTime={startTime}
        />
      </ChartWrapper>

      {/* Boost error over time */}
      <ChartWrapper title="Boost Error Over Time" height={240}>
        <TimeSeriesChart
          data={timeSeries}
          traces={[
            { field: "tdBoostErrorPsi", name: "Error (psi)", color: CHART_COLORS.subaruRed },
          ]}
          yAxisLabel="Error psi"
          height={240}
          startTime={startTime}
        />
      </ChartWrapper>

      {/* Boost vs RPM scatter */}
      <ChartWrapper title="Boost vs RPM" height={280}>
        <ScatterChart
          data={timeSeries}
          xField="engineRpm"
          yField="boostPsi"
          colorField="throttlePosition"
          xLabel="RPM"
          yLabel="Boost (psi)"
          height={280}
        />
      </ChartWrapper>
    </div>
  );
}
```

- [ ] **Step 2: Type-check**

```bash
npm run type-check
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/features/tabs/CobbBoostTab.tsx
git commit -m "feat(ui): add CobbBoostTab with stats, time-series, and scatter charts"
```

---

## Task 4: Create CobbKnockTab

**Files:**
- Create: `src/components/features/tabs/CobbKnockTab.tsx`

OBD2DataPoint fields: `feedbackKnock`, `fineKnockLearn`, `dam`
CobbKnockMetrics fields: `knockEventCount`, `avgFeedbackKnock`, `minFeedbackKnock`, `avgFineKnockLearn`, `minFineKnockLearn`, `avgDAM`, `minDAM`

- [ ] **Step 1: Create the file**

```tsx
"use client";

import { OBD2DataPoint, CobbKnockMetrics } from "@/types";
import { ChartWrapper } from "@/components/ui/ChartWrapper";
import { TimeSeriesChart } from "@/components/features/charts/TimeSeriesChart";
import { CHART_COLORS } from "@/lib/chartTheme";
import { CobbStatCard } from "@/components/features/tabs/CobbStatCard";

interface CobbKnockTabProps {
  timeSeries: OBD2DataPoint[];
  stats: CobbKnockMetrics;
}

export function CobbKnockTab({ timeSeries, stats }: CobbKnockTabProps) {
  const startTime = timeSeries[0]?.timestamp ?? 0;

  return (
    <div className="space-y-4 pt-4">
      {/* Summary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <CobbStatCard label="Knock Events" value={stats.knockEventCount} />
        <CobbStatCard label="Min Feedback Knock" value={stats.minFeedbackKnock} unit="°" />
        <CobbStatCard label="Avg Feedback Knock" value={stats.avgFeedbackKnock} unit="°" />
        <CobbStatCard label="Min Fine Knock Learn" value={stats.minFineKnockLearn} unit="°" />
        <CobbStatCard label="Min DAM" value={stats.minDAM} />
        <CobbStatCard label="Avg DAM" value={stats.avgDAM} />
      </div>

      {/* Feedback knock over time */}
      <ChartWrapper title="Feedback Knock Over Time" height={260}>
        <TimeSeriesChart
          data={timeSeries}
          traces={[
            { field: "feedbackKnock", name: "Feedback Knock (°)", color: CHART_COLORS.subaruRed },
          ]}
          yAxisLabel="Degrees"
          height={260}
          startTime={startTime}
        />
      </ChartWrapper>

      {/* Fine knock learn over time */}
      <ChartWrapper title="Fine Knock Learn Over Time" height={240}>
        <TimeSeriesChart
          data={timeSeries}
          traces={[
            { field: "fineKnockLearn", name: "Fine Knock Learn (°)", color: CHART_COLORS.amber },
          ]}
          yAxisLabel="Degrees"
          height={240}
          startTime={startTime}
        />
      </ChartWrapper>

      {/* DAM over time */}
      <ChartWrapper title="Dynamic Advance Multiplier (DAM)" height={240}>
        <TimeSeriesChart
          data={timeSeries}
          traces={[
            { field: "dam", name: "DAM", color: CHART_COLORS.quaternary },
          ]}
          yAxisLabel="DAM (0–1)"
          height={240}
          startTime={startTime}
        />
      </ChartWrapper>
    </div>
  );
}
```

- [ ] **Step 2: Type-check**

```bash
npm run type-check
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/features/tabs/CobbKnockTab.tsx
git commit -m "feat(ui): add CobbKnockTab with knock events, fine knock learn, and DAM charts"
```

---

## Task 5: Create CobbAFRTab

**Files:**
- Create: `src/components/features/tabs/CobbAFRTab.tsx`

OBD2DataPoint fields: `afSens1Ratio`, `clFuelTarget`, `afCorrection1`, `afLearning1`, `engineRpm`
CobbAFRMetrics fields: `avgAFR`, `avgAFRTarget`, `avgAFRDeviation`, `maxAFRDeviation`, `avgAFCorrection1`, `avgAFLearning1`

- [ ] **Step 1: Create the file**

```tsx
"use client";

import { OBD2DataPoint, CobbAFRMetrics } from "@/types";
import { ChartWrapper } from "@/components/ui/ChartWrapper";
import { TimeSeriesChart } from "@/components/features/charts/TimeSeriesChart";
import { ScatterChart } from "@/components/features/charts/ScatterChart";
import { CHART_COLORS } from "@/lib/chartTheme";
import { CobbStatCard } from "@/components/features/tabs/CobbStatCard";

interface CobbAFRTabProps {
  timeSeries: OBD2DataPoint[];
  stats: CobbAFRMetrics;
}

export function CobbAFRTab({ timeSeries, stats }: CobbAFRTabProps) {
  const startTime = timeSeries[0]?.timestamp ?? 0;

  return (
    <div className="space-y-4 pt-4">
      {/* Summary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <CobbStatCard label="Avg AFR" value={stats.avgAFR} />
        <CobbStatCard label="Avg Target AFR" value={stats.avgAFRTarget} />
        <CobbStatCard label="Avg Deviation" value={stats.avgAFRDeviation} />
        <CobbStatCard label="Max Deviation" value={stats.maxAFRDeviation} />
        <CobbStatCard label="Avg AF Correction 1" value={stats.avgAFCorrection1} unit="%" />
        <CobbStatCard label="Avg AF Learning 1" value={stats.avgAFLearning1} unit="%" />
      </div>

      {/* AFR actual vs target over time — single y-axis (both AFR ratios) */}
      <ChartWrapper title="AFR — Actual vs Target" height={280}>
        <TimeSeriesChart
          data={timeSeries}
          traces={[
            { field: "afSens1Ratio", name: "AFR (actual)", color: CHART_COLORS.primary },
            { field: "clFuelTarget", name: "AFR (target)", color: CHART_COLORS.amber },
          ]}
          yAxisLabel="AFR"
          height={280}
          startTime={startTime}
        />
      </ChartWrapper>

      {/* AF correction + learning — single y-axis (both percentages) */}
      <ChartWrapper title="AF Correction & Learning" height={240}>
        <TimeSeriesChart
          data={timeSeries}
          traces={[
            { field: "afCorrection1", name: "AF Correction 1 (%)", color: CHART_COLORS.secondary },
            { field: "afLearning1", name: "AF Learning 1 (%)", color: CHART_COLORS.quaternary },
          ]}
          yAxisLabel="%"
          height={240}
          startTime={startTime}
        />
      </ChartWrapper>

      {/* AFR vs RPM scatter */}
      <ChartWrapper title="AFR vs RPM" height={280}>
        <ScatterChart
          data={timeSeries}
          xField="engineRpm"
          yField="afSens1Ratio"
          colorField="throttlePosition"
          xLabel="RPM"
          yLabel="AFR"
          height={280}
        />
      </ChartWrapper>
    </div>
  );
}
```

- [ ] **Step 2: Type-check**

```bash
npm run type-check
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/features/tabs/CobbAFRTab.tsx
git commit -m "feat(ui): add CobbAFRTab with AFR vs target, corrections, and RPM scatter"
```

---

## Task 6: Create CobbWastegateTab

**Files:**
- Create: `src/components/features/tabs/CobbWastegateTab.tsx`

OBD2DataPoint fields: `wastegateActualPosMm`, `wastegateCommFinalPosMm`
CobbWastegateMetrics fields: `avgWastegateActualMm`, `maxWastegateActualMm`, `avgWastegateTargetMm`, `avgWastegateErrorMm`

- [ ] **Step 1: Create the file**

```tsx
"use client";

import { OBD2DataPoint, CobbWastegateMetrics } from "@/types";
import { ChartWrapper } from "@/components/ui/ChartWrapper";
import { TimeSeriesChart } from "@/components/features/charts/TimeSeriesChart";
import { CHART_COLORS } from "@/lib/chartTheme";
import { CobbStatCard } from "@/components/features/tabs/CobbStatCard";

interface CobbWastegateTabProps {
  timeSeries: OBD2DataPoint[];
  stats: CobbWastegateMetrics;
}

export function CobbWastegateTab({ timeSeries, stats }: CobbWastegateTabProps) {
  const startTime = timeSeries[0]?.timestamp ?? 0;

  return (
    <div className="space-y-4 pt-4">
      {/* Summary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <CobbStatCard label="Avg Actual" value={stats.avgWastegateActualMm} unit="mm" />
        <CobbStatCard label="Max Actual" value={stats.maxWastegateActualMm} unit="mm" />
        <CobbStatCard label="Avg Target" value={stats.avgWastegateTargetMm} unit="mm" />
        <CobbStatCard label="Avg Error (actual−target)" value={stats.avgWastegateErrorMm} unit="mm" />
      </div>

      {/* Wastegate actual vs target over time — single y-axis (both in mm) */}
      <ChartWrapper title="Wastegate Position — Actual vs Target" height={280}>
        <TimeSeriesChart
          data={timeSeries}
          traces={[
            { field: "wastegateActualPosMm", name: "Actual (mm)", color: CHART_COLORS.primary },
            { field: "wastegateCommFinalPosMm", name: "Target (mm)", color: CHART_COLORS.amber },
          ]}
          yAxisLabel="mm"
          height={280}
          startTime={startTime}
        />
      </ChartWrapper>
    </div>
  );
}
```

- [ ] **Step 2: Type-check**

```bash
npm run type-check
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/features/tabs/CobbWastegateTab.tsx
git commit -m "feat(ui): add CobbWastegateTab with actual vs target position chart"
```

---

## Task 7: Create CobbInjectorTab

**Files:**
- Create: `src/components/features/tabs/CobbInjectorTab.tsx`

OBD2DataPoint fields: `injDutyCycle`, `injPulseWidth`, `engineRpm`
CobbInjectorMetrics fields: `avgInjDutyCycle`, `maxInjDutyCycle`, `avgInjPulseWidthMs`, `maxInjPulseWidthMs`, `fuelCutEventCount`

- [ ] **Step 1: Create the file**

```tsx
"use client";

import { OBD2DataPoint, CobbInjectorMetrics } from "@/types";
import { ChartWrapper } from "@/components/ui/ChartWrapper";
import { TimeSeriesChart } from "@/components/features/charts/TimeSeriesChart";
import { ScatterChart } from "@/components/features/charts/ScatterChart";
import { CHART_COLORS } from "@/lib/chartTheme";
import { CobbStatCard } from "@/components/features/tabs/CobbStatCard";

interface CobbInjectorTabProps {
  timeSeries: OBD2DataPoint[];
  stats: CobbInjectorMetrics;
}

export function CobbInjectorTab({ timeSeries, stats }: CobbInjectorTabProps) {
  const startTime = timeSeries[0]?.timestamp ?? 0;

  return (
    <div className="space-y-4 pt-4">
      {/* Summary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <CobbStatCard label="Avg Duty Cycle" value={stats.avgInjDutyCycle} unit="%" />
        <CobbStatCard label="Max Duty Cycle" value={stats.maxInjDutyCycle} unit="%" />
        <CobbStatCard label="Avg Pulse Width" value={stats.avgInjPulseWidthMs} unit="ms" />
        <CobbStatCard label="Max Pulse Width" value={stats.maxInjPulseWidthMs} unit="ms" />
        <CobbStatCard label="Fuel Cut Events" value={stats.fuelCutEventCount} />
      </div>

      {/* Injector duty cycle over time */}
      <ChartWrapper title="Injector Duty Cycle Over Time" height={260}>
        <TimeSeriesChart
          data={timeSeries}
          traces={[
            { field: "injDutyCycle", name: "Duty Cycle (%)", color: CHART_COLORS.primary },
          ]}
          yAxisLabel="%"
          height={260}
          startTime={startTime}
        />
      </ChartWrapper>

      {/* Injector pulse width over time */}
      <ChartWrapper title="Injector Pulse Width Over Time" height={240}>
        <TimeSeriesChart
          data={timeSeries}
          traces={[
            { field: "injPulseWidth", name: "Pulse Width (ms)", color: CHART_COLORS.secondary },
          ]}
          yAxisLabel="ms"
          height={240}
          startTime={startTime}
        />
      </ChartWrapper>

      {/* Duty cycle vs RPM */}
      <ChartWrapper title="Injector Duty Cycle vs RPM" height={280}>
        <ScatterChart
          data={timeSeries}
          xField="engineRpm"
          yField="injDutyCycle"
          colorField="throttlePosition"
          xLabel="RPM"
          yLabel="Duty Cycle (%)"
          height={280}
        />
      </ChartWrapper>
    </div>
  );
}
```

- [ ] **Step 2: Type-check**

```bash
npm run type-check
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/features/tabs/CobbInjectorTab.tsx
git commit -m "feat(ui): add CobbInjectorTab with duty cycle, pulse width, and RPM scatter"
```

---

## Task 8: Create CobbAVCSTab

**Files:**
- Create: `src/components/features/tabs/CobbAVCSTab.tsx`

OBD2DataPoint fields: `avcsInLeft`, `avcsExhLeft`
CobbAVCSMetrics fields: `avgAvcsInLeft`, `maxAvcsInLeft`, `avgAvcsExhLeft`, `maxAvcsExhLeft`

- [ ] **Step 1: Create the file**

```tsx
"use client";

import { OBD2DataPoint, CobbAVCSMetrics } from "@/types";
import { ChartWrapper } from "@/components/ui/ChartWrapper";
import { TimeSeriesChart } from "@/components/features/charts/TimeSeriesChart";
import { CHART_COLORS } from "@/lib/chartTheme";
import { CobbStatCard } from "@/components/features/tabs/CobbStatCard";

interface CobbAVCSTabProps {
  timeSeries: OBD2DataPoint[];
  stats: CobbAVCSMetrics;
}

export function CobbAVCSTab({ timeSeries, stats }: CobbAVCSTabProps) {
  const startTime = timeSeries[0]?.timestamp ?? 0;

  return (
    <div className="space-y-4 pt-4">
      {/* Summary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <CobbStatCard label="Avg Intake" value={stats.avgAvcsInLeft} unit="°" />
        <CobbStatCard label="Max Intake" value={stats.maxAvcsInLeft} unit="°" />
        <CobbStatCard label="Avg Exhaust" value={stats.avgAvcsExhLeft} unit="°" />
        <CobbStatCard label="Max Exhaust" value={stats.maxAvcsExhLeft} unit="°" />
      </div>

      {/* Intake + exhaust cam timing over time — single y-axis (both in degrees) */}
      <ChartWrapper title="AVCS Cam Timing — Intake & Exhaust" height={280}>
        <TimeSeriesChart
          data={timeSeries}
          traces={[
            { field: "avcsInLeft", name: "Intake (°)", color: CHART_COLORS.primary },
            { field: "avcsExhLeft", name: "Exhaust (°)", color: CHART_COLORS.amber },
          ]}
          yAxisLabel="Degrees"
          height={280}
          startTime={startTime}
        />
      </ChartWrapper>
    </div>
  );
}
```

- [ ] **Step 2: Type-check**

```bash
npm run type-check
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/features/tabs/CobbAVCSTab.tsx
git commit -m "feat(ui): add CobbAVCSTab with intake and exhaust cam timing chart"
```

---

## Task 9: Wire up DashboardView

**Files:**
- Modify: `src/components/features/DashboardView.tsx`

This is the central wiring task. Three changes:
1. **Filter tab bar** — show COBB tabs only when `dataSource === "cobb"`, hide OBD2-specific tabs for COBB files
2. **Add 6 COBB sections** — after `#airIntake`, before the session details card
3. **Remove hardcoded COBB block** — lines 228–385 (the `dataSource === "cobb" && cobbResult &&` section)

- [ ] **Step 1: Add imports for all 6 COBB tab components**

At the top of DashboardView.tsx, after the existing tab imports (around line 43), add:

```tsx
import { CobbBoostTab } from "@/components/features/tabs/CobbBoostTab";
import { CobbKnockTab } from "@/components/features/tabs/CobbKnockTab";
import { CobbAFRTab } from "@/components/features/tabs/CobbAFRTab";
import { CobbWastegateTab } from "@/components/features/tabs/CobbWastegateTab";
import { CobbInjectorTab } from "@/components/features/tabs/CobbInjectorTab";
import { CobbAVCSTab } from "@/components/features/tabs/CobbAVCSTab";
```

- [ ] **Step 2: Add category filter constants**

After the `SCROLL_MARGIN` constant (around line 68), add:

```tsx
// Categories that only appear in OBD2 mode
const OBD2_ONLY_CATS = new Set([
  "engine", "fuel", "transmission", "power", "drivingBehavior",
  "abs", "awd", "electrical", "airIntake",
]);

// Categories that only appear in COBB mode
const COBB_ONLY_CATS = new Set([
  "cobbBoost", "cobbKnock", "cobbAFR", "cobbWastegate", "cobbInjector", "cobbAVCS",
]);
```

- [ ] **Step 3: Compute `visibleCategories` in DashboardContent, update tab bar, and fix `useActiveSection`**

The module-level `const SECTION_IDS = CATEGORY_ORDER as readonly string[]` at line 65 must be **deleted** — it passes the full unfiltered order to `useActiveSection`, which would cause the active-tab highlight to disappear when scrolling into OBD2 sections on a COBB file (and vice versa).

Inside the `DashboardContent` function, replace the existing lines:
```tsx
const { activeSection, scrollToSection } = useActiveSection(SECTION_IDS);
const hasChartData = timeSeries.length > 0;
```
with:
```tsx
const hasChartData = timeSeries.length > 0;

const visibleCategories = CATEGORY_ORDER.filter((cat) =>
  dataSource === "cobb" ? !OBD2_ONLY_CATS.has(cat) : !COBB_ONLY_CATS.has(cat)
);
const { activeSection, scrollToSection } = useActiveSection(visibleCategories as readonly string[]);
```

Then replace the tab bar map at line 114:
```tsx
// OLD:
{CATEGORY_ORDER.map((cat) => {
// NEW:
{visibleCategories.map((cat) => {
```

- [ ] **Step 4: Conditionally render OBD2 sections and add 6 COBB sections**

OBD2-specific sections must not exist in the DOM when a COBB file is loaded — otherwise `useActiveSection` would report them as active when the user scrolls, but no corresponding tab button exists. Wrap the 9 OBD2-only sections in a single guard:

```tsx
{/* OBD2-only sections — hidden for COBB files */}
{dataSource !== "cobb" && (
  <>
    {/* #engine */}
    <section id="engine" className={SCROLL_MARGIN}>
      {hasChartData && <EngineTab timeSeries={timeSeries} thresholds={thresholds} />}
    </section>
    {/* … paste the remaining 8 OBD2 sections (fuel, transmission, power, drivingBehavior, abs, awd, electrical, airIntake) here … */}
  </>
)}
```

Then, immediately after that block, add the 6 COBB sections:

```tsx
{/* #cobbBoost */}
<section id="cobbBoost" className={SCROLL_MARGIN}>
  {hasChartData && dataSource === "cobb" && cobbResult && (
    <CobbBoostTab timeSeries={timeSeries} stats={cobbResult.boost} />
  )}
</section>

{/* #cobbKnock */}
<section id="cobbKnock" className={SCROLL_MARGIN}>
  {hasChartData && dataSource === "cobb" && cobbResult && (
    <CobbKnockTab timeSeries={timeSeries} stats={cobbResult.knock} />
  )}
</section>

{/* #cobbAFR */}
<section id="cobbAFR" className={SCROLL_MARGIN}>
  {hasChartData && dataSource === "cobb" && cobbResult && (
    <CobbAFRTab timeSeries={timeSeries} stats={cobbResult.afr} />
  )}
</section>

{/* #cobbWastegate */}
<section id="cobbWastegate" className={SCROLL_MARGIN}>
  {hasChartData && dataSource === "cobb" && cobbResult && (
    <CobbWastegateTab timeSeries={timeSeries} stats={cobbResult.wastegate} />
  )}
</section>

{/* #cobbInjector */}
<section id="cobbInjector" className={SCROLL_MARGIN}>
  {hasChartData && dataSource === "cobb" && cobbResult && (
    <CobbInjectorTab timeSeries={timeSeries} stats={cobbResult.injector} />
  )}
</section>

{/* #cobbAVCS */}
<section id="cobbAVCS" className={SCROLL_MARGIN}>
  {hasChartData && dataSource === "cobb" && cobbResult && (
    <CobbAVCSTab timeSeries={timeSeries} stats={cobbResult.avcs} />
  )}
</section>
```

- [ ] **Step 5: Remove the hardcoded COBB block**

Delete the entire block starting at line 228 (the `{/* COBB Accessport Data … */}` comment through the closing `})`). This is approximately lines 228–385.

- [ ] **Step 6: Type-check and lint**

```bash
npm run type-check && npm run lint
```

Expected: no errors, no warnings.

- [ ] **Step 7: Commit**

```bash
git add src/components/features/DashboardView.tsx
git commit -m "feat(dashboard): wire COBB tabs into nav bar and section system, remove hardcoded block"
```

---

## Task 10: Build verification

- [ ] **Step 1: Production build**

```bash
npm run build
```

Expected: build completes with no TypeScript errors. Any "No SWC binary" warnings are normal.

- [ ] **Step 2: Smoke test (manual)**

Start dev server: `npm run dev`

Upload a COBB CSV file. Verify:
- [ ] Tab bar shows: Summary · Overview · Boost · Knock · AFR · Wastegate · Injector · AVCS (no OBD2 tabs)
- [ ] Each COBB tab renders stats grid + at least one chart
- [ ] Scrolling to a tab section highlights the correct tab button

Upload an OBD2 CSV file. Verify:
- [ ] Tab bar shows: Summary · Overview · Engine · Fuel · … (no COBB tabs)

- [ ] **Step 3: Final commit if any fixups were needed**

```bash
git add -p
git commit -m "fix(cobb): address build/smoke-test issues"
```
