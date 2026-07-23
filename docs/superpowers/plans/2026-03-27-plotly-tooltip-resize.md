# Plotly Tooltip Dynamic Resize Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the TimeSeriesChart unified hover tooltip to show formatted time once at the top followed by `metric: value` rows, replacing the current layout where time appears mid-row and value floats on its own line.

**Architecture:** Two surgical edits to `TimeSeriesChart.tsx` — make `traces.map` index-aware so trace 0 emits the time header line and all traces emit `name: value` on one line; add `hoverformat: ""` to the xaxis layout override to suppress the raw elapsed-seconds header Plotly would otherwise show above the trace rows.

**Tech Stack:** Plotly.js hovertemplate syntax, React `useMemo`, TypeScript strict

---

## File Map

| Action | File | Change |
|--------|------|--------|
| Modify | `src/components/features/charts/TimeSeriesChart.tsx:32` | Add `index` to `traces.map` callback |
| Modify | `src/components/features/charts/TimeSeriesChart.tsx:57` | Replace `hovertemplate` with index-aware version |
| Modify | `src/components/features/charts/TimeSeriesChart.tsx:122–129` | Add `hoverformat: ""` to xaxis override |

No other files change. `src/lib/chartTheme.ts` is untouched.

---

## Current vs Target

**Current** `hovertemplate` (line 57):
```
`⏱ %{customdata[0]}<br>%{y:.2f}<extra>%{fullData.name}</extra>`
```
Produces in unified hover (per trace):
```
[raw seconds e.g. "125.3"]    ← Plotly unified header, unformatted
Short-term (%): ⏱ 2:05        ← badge:template (wrong column)
87.40                          ← value orphaned on own line
Long-term (%): ⏱ 2:05
-1.50
```

**Target** after this plan:
```
                               ← blank (suppressed by hoverformat: "")
⏱ 2:05                         ← trace 0 emits time
Short-term (%): 3.21           ← all traces emit name:value
Long-term (%): −1.50
```

---

## Task 1: Make hovertemplate index-aware and suppress raw x header

**Files:**
- Modify: `src/components/features/charts/TimeSeriesChart.tsx`

This is a pure visual change — Plotly renders these client-side only. There is no meaningful unit test to write. Verification is TypeScript check + production build.

- [ ] **Step 1: Add `index` to the `traces.map` callback (line 32)**

Current (line 32):
```tsx
const result: Plotly.Data[] = traces.map((trace) => {
```

Replace with:
```tsx
const result: Plotly.Data[] = traces.map((trace, index) => {
```

- [ ] **Step 2: Replace hovertemplate with index-aware version (line 57)**

Current (line 57):
```tsx
hovertemplate: `⏱ %{customdata[0]}<br>%{y:.2f}<extra>%{fullData.name}</extra>`,
```

Replace with:
```tsx
hovertemplate: index === 0
  ? `⏱ %{customdata[0]}<br>%{fullData.name}: %{y:.2f}<extra></extra>`
  : `%{fullData.name}: %{y:.2f}<extra></extra>`,
```

**What this does:**
- `index === 0` — first trace shows time on line 1 (`⏱ 2:05`), then `name: value` on line 2
- `index > 0` — subsequent traces show only `name: value`
- `<extra></extra>` on both — hides the coloured badge. The old template put `%{fullData.name}` *inside* `<extra>`, making the name appear as a Plotly-styled badge before the template content and subject to Plotly's 15-char `namelength` truncation. The new template moves the name *inline* into the template body and uses an empty `<extra></extra>`, eliminating both the badge and the truncation.
- `%{fullData.name}` — Plotly resolves this to the trace's `name` prop (e.g. `"Short-term (%)"`)
- `%{y:.2f}` — value rounded to 2 decimal places

Do **not** touch the event-markers `result.push(...)` block below (lines 70–84). It uses `hoverinfo: "text"` and is unaffected by this change.

- [ ] **Step 3: Add `hoverformat: ""` to xaxis in the layout memo (lines 122–129)**

Current xaxis block (lines 122–129):
```tsx
xaxis: {
  ...BASE_LAYOUT.xaxis,
  type: "linear",
  title: { text: "Time (m:ss)", font: { size: 10, color: CHART_COLORS.textMuted } },
  range: xAxisRange,
  tickvals,
  ticktext,
},
```

Replace with:
```tsx
xaxis: {
  ...BASE_LAYOUT.xaxis,
  type: "linear",
  title: { text: "Time (m:ss)", font: { size: 10, color: CHART_COLORS.textMuted } },
  hoverformat: "",
  range: xAxisRange,
  tickvals,
  ticktext,
},
```

`hoverformat: ""` (empty string) suppresses the unified hover box header that Plotly would render showing the raw elapsed-seconds float (e.g., `"125.3"`). The tick labels on the axis are driven by `tickvals`/`ticktext` and are unaffected.

- [ ] **Step 4: Run TypeScript check**

```bash
cd "/Users/laijackylai/Documents/claude/driving data analyzer" && npm run type-check
```

Expected: exits 0. Only the two pre-existing errors in `src/test/DashboardView.test.tsx` (lines 314 and 336) are acceptable — they are unrelated to this change.

- [ ] **Step 5: Run production build**

```bash
cd "/Users/laijackylai/Documents/claude/driving data analyzer" && npm run build
```

Expected: `✓ Compiled successfully` with no new TypeScript or Next.js errors.

- [ ] **Step 6: Commit**

```bash
git add src/components/features/charts/TimeSeriesChart.tsx
git commit -m "fix(charts): show time once + name:value format in TimeSeriesChart hover tooltip"
```
