# Chart Tooltips — Correct Format Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ensure all five Plotly chart components display tooltips in a human-readable format — showing formatted time (m:ss), axis labels with units, and clean value formatting instead of raw floats and internal field names.

**Architecture:** Each chart component owns its own `hovertemplate` string and `hovermode` override. `TimeSeriesChart` adds per-trace `customdata` arrays with pre-formatted m:ss strings (computed from existing `formatTimestamp`). `ScatterChart`, `BarChart`, `AreaChart`, and `HistogramChart` embed their label props directly into `hovertemplate` strings. No changes to `BASE_LAYOUT` or `chartTheme.ts` — individual chart layout spreads override `hovermode` where needed.

**Tech Stack:** Plotly.js hovertemplate syntax (`%{x}`, `%{y}`, `%{customdata[0]}`, `<extra>`), `formatTimestamp` from `@/lib/chartTheme`, TypeScript strict

---

## File Map

| Action | File | Change |
|--------|------|--------|
| Modify | `src/components/features/charts/TimeSeriesChart.tsx` | Add `customdata` (m:ss strings) per trace + `hovertemplate`; keep `hovermode: "x unified"` |
| Modify | `src/components/features/charts/ScatterChart.tsx` | Add `hovertemplate` with label props; override `hovermode: "closest"` |
| Modify | `src/components/features/charts/BarChart.tsx` | Add `hovertemplate` with yLabel + count |
| Modify | `src/components/features/charts/AreaChart.tsx` | Add `hovertemplate` with xLabel/yLabel |
| Modify | `src/components/features/charts/HistogramChart.tsx` | Add `hovertemplate` with xLabel + count |

---

## Background: Current State vs Target

| Chart | Current hover shows | Target hover shows |
|-------|--------------------|--------------------|
| TimeSeriesChart | raw float seconds e.g. `"125.3"` as x header | `"2:05"` (m:ss) from customdata in each trace row |
| ScatterChart | internal field name e.g. `"vehicleSpeed"` + raw number | `"Speed (km/h): 87.4"` using xLabel/yLabel props |
| BarChart | label + raw number, no units | `"60–80 km/h: 8.23 (Avg Fuel Rate (L/h))"` |
| AreaChart | raw x/y floats | `"Distance (km): 12.4 — Fuel Used (L): 1.83"` |
| HistogramChart | raw bin range + count | `"Accel (g): [0.12, 0.18] — Count: 43"` |

---

## Plotly hovertemplate syntax cheatsheet

```
%{x}            — raw x value
%{y}            — raw y value
%{y:.2f}        — y formatted to 2 decimal places
%{customdata[0]}— first element of per-point customdata array
%{fullData.name}— trace name (same as `name` prop)
<extra>text</extra>  — the colored badge shown next to the box; use <extra></extra> to hide it
```

For `hovermode: "x unified"`, each trace's `hovertemplate` controls its row in the shared box.
The shared box header always shows the raw x value — no d3 format can produce m:ss for plain numeric seconds. We work around this by embedding the formatted time inside each trace row via `customdata`.

---

## Task 1: TimeSeriesChart — formatted time in hover

**Files:**
- Modify: `src/components/features/charts/TimeSeriesChart.tsx:31–84`

### What changes
Each trace currently builds `xs` (elapsed seconds) and `ys` arrays but sets no `hovertemplate`. The unified hover header shows the raw float x value. We add `customdata` (one formatted string per point) and a `hovertemplate` that surfaces the m:ss time in each trace row.

The event-markers trace already uses `hoverinfo: "text"` — leave it unchanged.

- [ ] **Step 1: Add customdata to each data trace inside `plotTraces` memo**

In `TimeSeriesChart.tsx`, find the `return { x: xs, y: ys, ... }` block inside `traces.map(...)` (lines 53–63). Add two new fields: `customdata` and `hovertemplate`.

Replace the return object (lines 53–63):
```tsx
return {
  x: xs,
  y: ys,
  customdata: source.map((d) => [formatTimestamp(d.timestamp, startTime)]),
  hovertemplate: `⏱ %{customdata[0]}<br>%{y:.2f}<extra>%{fullData.name}</extra>`,
  type: "scatter" as const,
  mode: trace.mode ?? "lines",
  name: trace.name,
  line: { color: trace.color ?? CHART_COLORS.primary, width: 1.5 },
  fill: (trace.fill ? "tozeroy" : undefined) as Plotly.PlotData["fill"],
  fillcolor: trace.fill ? (trace.color ?? CHART_COLORS.primaryFill) : undefined,
  yaxis: trace.yaxis ?? "y",
};
```

Note: `source` is already defined just above as the (possibly downsampled) `OBD2DataPoint[]` array. `formatTimestamp(d.timestamp, startTime)` passes the **absolute** timestamp; the function internally computes `elapsed = d.timestamp - startTime` and returns `"m:ss"`. Tick labels use `formatTimestamp(t + startTime, startTime)` where `t` is already elapsed — same result, different call sites.

- [ ] **Step 2: Run TypeScript check**

```bash
npm run type-check
```

Expected: no errors. `customdata` on Plotly.Data is `any[][]` so the string array is accepted. `hovertemplate` is `string`.

- [ ] **Step 3: Commit**

```bash
git add src/components/features/charts/TimeSeriesChart.tsx
git commit -m "feat(charts): add m:ss formatted time to TimeSeriesChart hover tooltip"
```

---

## Task 2: ScatterChart — labeled axes in hover

**Files:**
- Modify: `src/components/features/charts/ScatterChart.tsx:57–108, 113–124`

### What changes
The in-range trace has no `hovertemplate`, so Plotly shows the internal field name (e.g., `"vehicleSpeed"`) as the trace name and raw numbers. We:
1. Add a `hovertemplate` using `xLabel`/`yLabel` props so hover reads `"Speed (km/h): 87.4<br>Fuel Rate (L/h): 2.11"`.
2. Override `hovermode` to `"closest"` in the layout — scatter charts show x/y correlations, not time series, so showing the nearest single point is more useful than a unified x-axis hover.

- [ ] **Step 1: Add hovertemplate to the inRange trace (line ~100)**

Find the `traces.push({ x: inRange.map(...), ... })` block (lines 100–108). `customdata` already exists on this trace — only add `hovertemplate`:

```tsx
traces.push({
  x: inRange.map((p) => p.x),
  y: inRange.map((p) => p.y),
  customdata: inRange.map((p) => [p.ts]),   // already present — do not duplicate
  hovertemplate: `${xLabel ?? String(xField)}: %{x:.2f}<br>${yLabel ?? String(yField)}: %{y:.2f}<extra></extra>`,
  type: "scatter" as const,
  mode: "markers",
  name: yLabel ?? String(yField),
  marker: markerConfig,
});
```

- [ ] **Step 2: Override hovermode to "closest" in layout**

In the `layout` memo (lines 113–124), add `hovermode: "closest"`:

```tsx
const layout = useMemo<Partial<Plotly.Layout>>(() => ({
  ...BASE_LAYOUT,
  hovermode: "closest",
  height,
  xaxis: {
    ...BASE_LAYOUT.xaxis,
    title: xLabel ? { text: xLabel, font: { size: 10, color: CHART_COLORS.textMuted } } : undefined,
  },
  yaxis: {
    ...BASE_LAYOUT.yaxis,
    title: yLabel ? { text: yLabel, font: { size: 10, color: CHART_COLORS.textMuted } } : undefined,
  },
}), [height, xLabel, yLabel]);
```

- [ ] **Step 3: Run TypeScript check**

```bash
npm run type-check
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/features/charts/ScatterChart.tsx
git commit -m "feat(charts): add labeled axis hover tooltip and closest hovermode to ScatterChart"
```

---

## Task 3: BarChart — units in hover

**Files:**
- Modify: `src/components/features/charts/BarChart.tsx:16–31`

### What changes
The bar trace has no `hovertemplate`. Default hover shows the bar category label + raw value with no units. We add `hovertemplate` showing the label, value with 2dp, and units from `yLabel`. The `n=X` count annotation is already rendered as bar text (`textposition: "outside"`) — we don't need to repeat it in the tooltip.

- [ ] **Step 1: Add hovertemplate to the bar trace**

In the `plotTraces` memo (lines 16–31), add `hovertemplate`. Note: `hoverinfo` is irrelevant when `hovertemplate` is set — do not add it.

```tsx
const plotTraces = useMemo<Plotly.Data[]>(() => [
  {
    x: data.map((d) => d.label),
    y: data.map((d) => d.value),
    type: "bar" as const,
    name: yLabel ?? "Value",
    marker: {
      color: data.map((_, i) => {
        const colors = [CHART_COLORS.primary, CHART_COLORS.secondary, CHART_COLORS.tertiary, CHART_COLORS.amber];
        return colors[i % colors.length];
      }),
    },
    text: data.map((d) => d.count !== undefined ? `n=${d.count}` : ""),
    textposition: "outside" as const,
    hovertemplate: `%{x}<br>${yLabel ?? "Value"}: %{y:.2f}<extra></extra>`,
  },
], [data, yLabel]);
```

- [ ] **Step 2: Override hovermode to "closest" in layout**

In the `layout` memo (lines 33–41), add `hovermode: "closest"`:

```tsx
const layout = useMemo<Partial<Plotly.Layout>>(() => ({
  ...BASE_LAYOUT,
  hovermode: "closest",
  height,
  xaxis: { ...BASE_LAYOUT.xaxis },
  yaxis: {
    ...BASE_LAYOUT.yaxis,
    title: yLabel ? { text: yLabel, font: { size: 10, color: CHART_COLORS.textMuted } } : undefined,
  },
}), [height, yLabel]);
```

- [ ] **Step 3: Run TypeScript check**

```bash
npm run type-check
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/features/charts/BarChart.tsx
git commit -m "feat(charts): add units hover tooltip and closest hovermode to BarChart"
```

---

## Task 4: AreaChart — labeled axes in hover

**Files:**
- Modify: `src/components/features/charts/AreaChart.tsx:19–30`

### What changes
The area trace has no `hovertemplate`. Used in FuelTab as "Cumulative Fuel Used vs Distance" where x is distance (km) and y is fuel (L). Default hover shows raw numbers. We add labeled hover.

- [ ] **Step 1: Add hovertemplate to the area trace**

In `plotTraces` memo (lines 19–30), add `hovertemplate`:

```tsx
const plotTraces = useMemo<Plotly.Data[]>(() => [
  {
    x: data.map((d) => d.x),
    y: data.map((d) => d.y),
    type: "scatter" as const,
    mode: "lines",
    fill: "tozeroy",
    name: yLabel ?? "Value",
    line: { color: CHART_COLORS.primary, width: 1.5 },
    fillcolor: CHART_COLORS.primaryFill,
    hovertemplate: `${xLabel ?? "X"}: %{x:.2f}<br>${yLabel ?? "Y"}: %{y:.2f}<extra></extra>`,
  },
], [data, xLabel, yLabel]);
```

Note: `xLabel` is added to the dep array — the current dep array `[data, yLabel]` is missing it. Add it: `[data, xLabel, yLabel]`.

- [ ] **Step 2: Run TypeScript check**

```bash
npm run type-check
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/features/charts/AreaChart.tsx
git commit -m "feat(charts): add labeled axes hover tooltip to AreaChart"
```

---

## Task 5: HistogramChart — labeled hover

**Files:**
- Modify: `src/components/features/charts/HistogramChart.tsx:37–45`

### What changes
The histogram trace has no `hovertemplate`. Default shows bin range + count. We label the x-axis category from `xLabel` prop.

**Important Plotly limitation:** For histogram traces, `%{x}` gives Plotly's internal bin-range representation (e.g., `"(0.12, 0.18]"`) — it is **not** a float and `%{x:.2f}` is invalid and will produce `NaN`. Use `%{x}` bare (no format specifier). `%{y}` correctly gives the bin count.

- [ ] **Step 1: Add hovertemplate to the histogram trace**

In `plotTraces` memo (lines 37–45), add `hovertemplate`:

```tsx
const plotTraces = useMemo<HistogramData[]>(() => [
  {
    x: data,
    type: "histogram" as const,
    nbinsx: bins,
    name: xLabel ?? "Distribution",
    marker: { color: CHART_COLORS.primaryFill, line: { color: CHART_COLORS.primary, width: 1 } },
    hovertemplate: `${xLabel ?? "Value"}: %{x}<br>Count: %{y}<extra></extra>`,
  },
], [data, bins, xLabel]);
```

- [ ] **Step 2: Run TypeScript check**

```bash
npm run type-check
```

Expected: no errors. `hovertemplate` is allowed on histogram via the extended `HistogramData` type (which is `Plotly.Data & { nbinsx?: number }` — `hovertemplate` is already part of `Plotly.Data`).

- [ ] **Step 3: Commit**

```bash
git add src/components/features/charts/HistogramChart.tsx
git commit -m "feat(charts): add labeled hover tooltip to HistogramChart"
```

---

## Task 6: Verify all charts build cleanly

- [ ] **Step 1: Full build**

```bash
npm run build
```

Expected: exits 0. No TypeScript or Next.js build errors.

- [ ] **Step 2: Verify lint**

```bash
npm run lint
```

Expected: exits 0.

- [ ] **Step 3: Final commit if any lint auto-fixes were applied**

Only commit if lint produced changes:
```bash
git add -p
git commit -m "chore(charts): lint fixes after tooltip additions"
```
