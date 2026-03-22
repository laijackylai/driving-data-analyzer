# Scroll-Based Layout with Timeline Slider

**Date:** 2026-03-22
**Status:** Draft

## Summary

Redesign the OBD2 Dashboard from a tab-switching layout to a single-page scroll layout. All chart sections render on one page. A sticky tab bar at the top scrolls to sections. A sticky timeline range slider at the bottom filters time across all charts. Charts lazy load via IntersectionObserver.

## Goals

1. Lazy load all charts individually (IntersectionObserver, load when ~200px from viewport)
2. All chart sections visible on one scrollable page — clicking a tab smooth-scrolls to that section
3. Sticky tab bar at top of page, highlights current section on scroll
4. Sticky timeline range slider at bottom — dual-handle, speed-colored heatmap track, sole source of time filtering

## Non-Goals

- Virtual scrolling (overkill for 10 sections)
- Chart-level zoom/pan/brush interactions (removed — timeline slider is the only time filter)
- Swipe navigation between tabs (removed — no longer relevant)

## Page Layout

```
┌─────────────────────────────────┐
│  Header (OBD2 Dashboard title)  │  ← scrolls away
│  FileUpload                     │  ← scrolls away
│  Trip Summary chips             │  ← scrolls away
│  SafetyGauge                    │  ← scrolls away
├─────────────────────────────────┤
│  Tab Bar (sticky top)           │  ← sticky top-0, z-50
├─────────────────────────────────┤
│                                 │
│  #summary — CategoryPanel grid  │
│  #overview — charts             │
│  #engine — charts               │
│  #fuel — charts                 │
│  #transmission — charts         │
│  #power — charts                │
│  #drivingBehavior — charts      │
│  #abs — charts                  │
│  #awd — charts                  │
│  #electrical — charts           │
│  #airIntake — charts            │
│                                 │
├─────────────────────────────────┤
│  Timeline Slider (sticky bottom)│  ← sticky bottom-0, z-50
└─────────────────────────────────┘
```

**Tab order:** Summary, Overview, Engine, Fuel, Transmission, Power, Driving, ABS, AWD, Electrical, Air Intake

## Design Sections

### 1. Summary Section

- First section, anchored to the "Summary" tab
- Contains 9 CategoryPanels (Engine, Fuel, Transmission, Power, Driving Behavior, ABS, AWD, Electrical, Air Intake)
- Desktop: `grid-cols-4` (4+4+1 layout)
- Mobile: `grid-cols-2`
- Overview does not have a CategoryPanel — it has the SafetyGauge + trip summary which sit above the sticky tab bar

### 2. Lazy Loading via ChartWrapper

IntersectionObserver lives inside `ChartWrapper` — it already manages skeleton/loaded state.

- `rootMargin: "200px"` — starts loading 200px before entering viewport
- `hasEntered` ref: once true, stays true (no unloading/remounting)
- Before `hasEntered`: renders skeleton placeholder at correct height, children do not mount
- After `hasEntered`: children render, existing MutationObserver skeleton logic handles the Plotly mount transition
- Two-phase loading: skeleton (not in view) → skeleton (in view, Plotly mounting) → chart visible
- No changes needed to individual chart components or tab components

### 3. Active Section Tracking — `useActiveSection` Hook

New hook: `src/hooks/useActiveSection.ts`

- Takes an array of section IDs, returns the currently active one
- Single IntersectionObserver with `threshold: 0`
- Negative `rootMargin` accounts for sticky tab bar height (top) and timeline bar height (bottom)
- When multiple sections visible, picks the one closest to the top of the visible zone
- Debounced to avoid flickering during fast scrolls
- On tab click: scrolls to section via `scrollIntoView({ behavior: 'smooth' })` with offset for sticky tab bar height
- Suppresses observer briefly during programmatic scroll to prevent highlight flickering

### 4. Sticky Tab Bar

- `TabsList` becomes a standalone sticky nav: `sticky top-0 z-50`
- Semi-transparent backdrop blur so content scrolls behind cleanly
- `TabsTrigger` onClick scrolls to the corresponding section instead of switching tab state
- Active trigger highlights based on `useActiveSection` output
- `TabsContent` no longer used — sections render directly in the page
- Existing fade-edge gradients for horizontal overflow remain

### 5. Timeline Slider — `TimelineSlider` Component

New file: `src/components/features/TimelineSlider.tsx`

**Visual layout:**
```
┌──────────────────────────────────────────────────┐
│  00:00    [===colored heatmap track====]   12:34 │
│            ◄|                       |►    [Reset]│
│         left handle          right handle        │
└──────────────────────────────────────────────────┘
```

**Speed heatmap track:**
- Background bar colored by speed at each time point
- ~200-300 segments across track width
- Color scale matching RouteMap: green (<30 km/h), amber (30-80), red (>80)
- Selected range: full opacity. Outside range: dimmed (~0.3 opacity)

**Handles + interaction:**
- Two drag handles — initially at far left (start) and far right (end)
- Dragging a handle updates `setTimeRange()` via existing `useTimeRange` context
- Dragging area between handles moves the window (size unchanged)
- Touch-friendly: 44px minimum hit area on handles
- `requestAnimationFrame` throttling for smooth drag updates

**Reset button:**
- Positioned on the right side of the timeline slider
- Resets handles to full extent → `timeRange` becomes `{ start: null, end: null }`
- Replaces the old `ResetZoomButton` from the top bar

**Integration:**
- Reads/writes the same `TimeRangeContext` — the slider IS the time range
- When handles at full extent: no filtering applied
- Pure HTML/CSS + pointer events — no external library

**Sticky positioning:**
- `sticky bottom-0 z-50` with backdrop blur
- Respects safe-area insets on mobile (`pb-safe`)

### 6. Chart Interaction Changes

**Removed from charts:**
- Plotly zoom/pan/relayout handlers (TimeSeriesChart)
- Box-select handler (ScatterChart)
- All interactive selection/filtering

**Kept on charts:**
- Hover tooltips to show data values
- Read-only visualization

**RouteMap:** Unchanged — still dims segments outside time range (read-only).

**BarChart, AreaChart, HistogramChart:** Unchanged — no time range interaction.

## File Changes

### Modified Files

| File | Changes |
|------|---------|
| `DashboardView.tsx` | Major refactor: remove Tabs conditional rendering, render all sections flat, add sticky tab bar + timeline slider, remove swipe handlers, remove ResetZoomButton from top bar |
| `ChartWrapper.tsx` | Add IntersectionObserver for lazy loading, gate children behind `hasEntered` |
| `TimeSeriesChart.tsx` | Remove zoom/pan/relayout handlers, keep hover tooltips only |
| `ScatterChart.tsx` | Remove box-select handler, keep hover tooltips only |
| `Tabs.tsx` | TabsList becomes sticky scroll-nav, TabsTrigger onClick scrolls to section, TabsContent unused |
| `useTimeRange.tsx` | No changes (same context, different producer) |

### New Files

| File | Purpose |
|------|---------|
| `src/hooks/useActiveSection.ts` | IntersectionObserver for active section tracking |
| `src/components/features/TimelineSlider.tsx` | Sticky bottom range slider with speed heatmap |

### Removed

| Item | Notes |
|------|-------|
| `useSwipe` usage in DashboardView | Hook file can stay, just remove usage |
| `ResetZoomButton` component | Functionality moves into TimelineSlider |
| Plotly zoom/selection handlers | Charts become read-only with tooltips |

## Unchanged

- Individual tab components (OverviewTab, EngineTab, etc.) — render charts as before, minus CategoryPanel
- RouteMap — stays read-only, dims segments outside time range
- BarChart, AreaChart, HistogramChart — no time range interaction
- `useTimeRange.tsx` — same context API
- Type definitions
