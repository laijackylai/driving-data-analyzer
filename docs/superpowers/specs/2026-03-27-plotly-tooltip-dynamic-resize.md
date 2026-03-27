# Plotly Tooltip Dynamic Resize — Design Spec

**Date:** 2026-03-27
**Status:** Approved

---

## Problem

The Plotly unified hover tooltip on `TimeSeriesChart` currently shows:

```
125.3                        ← raw elapsed-seconds header (unreadable)
Short-term (%): ⏱ 2:05      ← trace name badge + formatted time (wrong column)
87.40                        ← value on its own line
Long-term (%): ⏱ 2:05
-1.50
```

Two issues:
1. **Format**: time appears in the trace body row instead of a header; value is on a separate line instead of paired with the metric name.
2. **Width / truncation**: Plotly's default `namelength: 15` truncates trace names in the hover badge, causing content to be cropped.

---

## Goal

```
⏱ 2:05                  ← formatted time, shown once
Short-term (%): 3.21    ← metric name: value
Long-term (%): −1.50    ← metric name: value
```

---

## Approach — Option A (index-aware template)

### `src/lib/chartTheme.ts`

No changes required. All chart `hovertemplate` strings already use `<extra></extra>` to suppress the coloured trace-name badge, so Plotly's `namelength` truncation does not apply.

### `src/components/features/charts/TimeSeriesChart.tsx`

**Change 1 — index-aware hovertemplate in `plotTraces` memo:**

Change `traces.map((trace) => { ... })` to `traces.map((trace, index) => { ... })` and build the template based on index:

```tsx
hovertemplate: index === 0
  ? `⏱ %{customdata[0]}<br>%{fullData.name}: %{y:.2f}<extra></extra>`
  : `%{fullData.name}: %{y:.2f}<extra></extra>`,
```

- Trace 0 shows: formatted time on line 1, then `name: value` on line 2.
- Traces 1+ show: `name: value` only — no repeated time.
- `<extra></extra>` on all traces suppresses the coloured badge (name is already inline).

**Change 2 — suppress raw x-axis unified header in layout memo:**

Add `hoverformat: " "` to the `xaxis` override in the layout memo:

```tsx
xaxis: {
  ...BASE_LAYOUT.xaxis,
  type: "linear",
  title: { ... },
  hoverformat: "",   // ← suppress the raw-seconds unified header
  range: xAxisRange,
  tickvals,
  ticktext,
},
```

`hoverformat: ""` (empty string) causes Plotly to render the unified header as blank, hiding the raw elapsed-seconds value while keeping the unified hover box layout intact.

---

## Scope

| File | Change |
|------|--------|
| `src/components/features/charts/TimeSeriesChart.tsx` | Index-aware `hovertemplate` + `hoverformat: ""` on xaxis |

`src/lib/chartTheme.ts` — no changes needed.

No changes to ScatterChart, BarChart, AreaChart, HistogramChart, or any tab components.

---

## Known Limitations

**Time header can disappear mid-hover.** Each trace is independently LTTB-downsampled using its own field as the importance signal (source: `TimeSeriesChart.tsx` lines 43–45). This means trace 0's x-coordinates after downsampling do not align with those of other traces. When the user hovers over a point that exists in trace 1+ but not in trace 0's downsampled set, Plotly has no row to render for trace 0 — so the time line is silently absent. This is an ordinary-use scenario, not a rare edge case. The result is a tooltip showing `name: value` rows without a time header. Acceptable as a known constraint of the index-0 approach.

**Event markers appear in the unified tooltip.** The event markers trace uses `hoverinfo: "text"`, which in `x unified` mode shows the event label (e.g., "Harsh braking") as a row in the shared tooltip box. This is intentional and desirable — it gives context when hovering near an event marker. No change needed.
