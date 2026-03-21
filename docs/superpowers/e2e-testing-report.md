# E2E Testing Report — Interactive Charts Feature

**Date:** 2026-03-20
**Branch:** `feature/interactive-charts`
**Tool:** Playwright MCP (browser automation)
**Test data:** `input/2026-03-17 18-27-59.csv` (9.45 MB, 13,255 data points, 3h 48m drive)

---

## Summary

| Area | Status | Notes |
|------|--------|-------|
| Landing page | PASS | Loads correctly, "Go to Dashboard" link works |
| File upload | PASS | Browse button triggers file chooser, CSV accepted |
| API analysis | PASS | Returns result with timeSeries, GPS, derived metrics, thresholds |
| Overview tab | PASS | GPS map + Speed Profile chart render |
| Engine tab | PASS | 5 charts (RPM, Load vs RPM, Coolant & Oil Temp, Knock Correction, Timing Advance vs RPM) |
| Fuel tab | PASS | 5 charts (Fuel Trims, Fuel Rate, Fuel Consumption, Fuel by Speed Bucket, Cumulative Fuel) |
| Transmission tab | PASS | 6 charts (CVT Temp, Gear Ratio, Pulley Speeds, CVT Effective Ratio, Lock-Up Duty, Turbine vs RPM) |
| Power tab | PASS | 4 charts (Power from Fuel, Power from MAF, Power scatter plots) |
| Driving tab | PASS | 2 charts (Acceleration Distribution histogram, Speed vs RPM scatter) |
| ABS / Stability tab | PASS | 4 charts (4-Wheel Speed, Front-Rear Diff, Left-Right Diff, Steering vs Speed scatter) |
| AWD tab | PASS | 2 charts (Solenoid Current, AWD Engagement) |
| Electrical tab | PASS | 1 chart (Battery Voltage with threshold bands) |
| Air Intake tab | PASS | 4 charts (MAF, Boost, Intake Temp, Throttle Position) |
| Metric tooltips | PASS | Info button shows What/Good/Bad/Look For content |
| Console errors | PASS | Zero JS errors across all tabs |
| Console warnings | PASS | Zero warnings |
| Total charts rendered | **34 Plotly + 1 Leaflet map = 35 interactive charts** |

---

## Bug Found & Fixed

### BUG-001: Charts not rendering — ChartWrapper deadlock (CRITICAL, FIXED)

**Symptom:** All chart areas showed empty space (headers visible but no chart content). Zero Plotly charts and zero Leaflet maps in the DOM after page load.

**Root cause:** `ChartWrapper` used a conditional render pattern that created a deadlock:
- When `showSkeleton` was true, it rendered the skeleton **instead of** children
- But children (containing `<Plot>` or `<MapContainer>`) could never mount to trigger the MutationObserver
- The fallback checked for `window.Plotly` which isn't set by `plotly.js-basic-dist-min`
- Leaflet maps had no detection path at all (only checked for `.js-plotly-plot`)

**Fix applied in `src/components/ui/ChartWrapper.tsx`:**
1. Changed from conditional render (`skeleton ? ... : children`) to overlay pattern (`children` always renders, skeleton overlays on top with `z-10`)
2. Added `.leaflet-container` to the MutationObserver check alongside `.js-plotly-plot`
3. Removed the `setInterval` fallback checking `window.Plotly` (no longer needed)
4. Removed unused `Plot` re-export and `next/dynamic` import

---

## UX Findings (Non-blocking)

### UX-001: Tab bar overflow without scroll indicator

**Observation:** The 10-tab bar overflows its container (1178px content in 940px width). It has `overflow: auto` so it's scrollable, but there's no visual indicator that more tabs exist to the right. "Electrical" and "Air Intake" tabs are hidden on default viewport.

**Impact:** Low — users may not discover the last 2 tabs.

**Suggested fix:** Add fade gradient or scroll arrows at the edges of the tab bar when content overflows.

### UX-002: Tab label text duplication in accessibility tree

**Observation:** Tab text content appears duplicated in the accessibility snapshot (e.g., "OverviewMap", "EngineEngine", "FuelFuel"). This is because both the icon's `alt` text and the visible label are concatenated. Purely cosmetic in the accessibility tree — screen readers would read both.

**Impact:** Low — affects screen reader experience only.

**Suggested fix:** Add `aria-hidden="true"` to the icon or use `aria-label` on the tab button.

### UX-003: Fuel Trims chart visual density

**Observation:** The Fuel Trims chart on the Fuel tab appears very dense with overlapping traces due to the high data point count. The short-term trim line (amber) creates visual noise.

**Impact:** Low — data is correct, just visually busy.

**Suggested fix:** Consider increasing LTTB downsampling aggressiveness for fuel trim data, or using a lower opacity.

---

## Test Environment

- **Browser:** Chromium (Playwright MCP)
- **Viewport:** 1024x768 (default)
- **Next.js:** 16.1.6 (Turbopack)
- **Node.js:** Local development server
- **OS:** macOS Darwin 25.2.0
