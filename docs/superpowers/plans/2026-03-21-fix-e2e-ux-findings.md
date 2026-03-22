# Fix E2E UX Findings Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the three UX findings (UX-001, UX-002, UX-003) from the e2e testing report, then run thorough Playwright verification.

**Architecture:** Three independent fixes — dynamic scroll-fade gradients on tab bar, `aria-hidden` on decorative icons, and per-chart LTTB downsampling for fuel trims. Each fix is isolated to 1-2 files with no cross-dependencies.

**Tech Stack:** React 19, TypeScript, Tailwind CSS, Plotly.js, Playwright MCP

---

## File Structure

| Action | File | Responsibility |
|--------|------|----------------|
| Modify | `src/components/ui/Tabs.tsx:79-110` | Dynamic fade gradients on TabsList |
| Modify | `src/components/ui/CategoryIcon.tsx:18-28` | Add `aria-hidden="true"` to all SVGs |
| Modify | `src/lib/data/downsample.ts:8` | Export existing `lttb` function for reuse by chart components |
| Modify | `src/components/features/charts/TimeSeriesChart.tsx` | Accept optional `maxPoints` prop, downsample before render |
| Modify | `src/components/features/tabs/FuelTab.tsx:30-42` | Pass `maxPoints` to Fuel Trims chart |

---

## Chunk 1: UX-001 — Dynamic Tab Bar Scroll Indicators

### Task 1: Make fade gradients conditional on scroll position

The current `TabsList` (Tabs.tsx:85-108) renders left and right fade gradients unconditionally. They should only appear when there is scrollable content in that direction.

**Files:**
- Modify: `src/components/ui/Tabs.tsx:79-110`

- [ ] **Step 1: Understand current behavior (TDD waiver: UI scroll behavior cannot be unit-tested; verified via Playwright in Chunk 4)**

The current code at `Tabs.tsx:86-94` renders two static `<div>` gradients unconditionally. We need to:
- Track scroll position of the inner scroll container via `scrollRef`
- Hide left gradient when `scrollLeft === 0`
- Hide right gradient when scrolled fully right (`scrollLeft + clientWidth >= scrollWidth`)

Note: `useState` and `useCallback` are already imported in `Tabs.tsx` (lines 7, 13) — no new imports needed.

- [ ] **Step 2: Implement dynamic fade gradients**

Replace the `TabsList` component body (lines 79-110 of `src/components/ui/Tabs.tsx`) with scroll-aware gradients.

**Important:** Always use `scrollRef` (stable via `useRef`) for scroll state logic — never `resolvedRef` which is recalculated each render and would cause exhaustive-deps violations. The forwarded `ref` is only for external consumers.

```tsx
const TabsList = forwardRef<HTMLDivElement, TabsListProps>(
  ({ className, ...props }, ref) => {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(false);

    const updateScrollState = useCallback(() => {
      const el = scrollRef.current;
      if (!el) return;
      setCanScrollLeft(el.scrollLeft > 0);
      setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 1);
    }, []); // scrollRef is stable — no deps needed

    useEffect(() => {
      const el = scrollRef.current;
      if (!el) return;
      updateScrollState();
      el.addEventListener("scroll", updateScrollState, { passive: true });
      const ro = new ResizeObserver(updateScrollState);
      ro.observe(el);
      return () => {
        el.removeEventListener("scroll", updateScrollState);
        ro.disconnect();
      };
    }, [updateScrollState]);

    return (
      <div ref={ref} className="relative">
        {/* Fade edges — only visible when scrollable in that direction */}
        <div
          className={cn(
            "pointer-events-none absolute left-0 top-0 bottom-0 w-6 z-10",
            "bg-gradient-to-r from-sapphire-950 to-transparent",
            "transition-opacity duration-200",
            canScrollLeft ? "opacity-100" : "opacity-0"
          )}
          aria-hidden="true"
        />
        <div
          className={cn(
            "pointer-events-none absolute right-0 top-0 bottom-0 w-6 z-10",
            "bg-gradient-to-l from-sapphire-950 to-transparent",
            "transition-opacity duration-200",
            canScrollRight ? "opacity-100" : "opacity-0"
          )}
          aria-hidden="true"
        />

        <div
          ref={scrollRef}
          role="tablist"
          className={cn(
            "flex gap-1 overflow-x-auto px-1 py-1 scrollbar-none",
            "bg-sapphire-900/50 rounded-xl border border-[rgba(54,112,198,0.1)]",
            "-webkit-overflow-scrolling-touch",
            className
          )}
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          {...props}
        />
      </div>
    );
  }
);
```

Key changes from current code:
- Remove broken `resolvedRef` pattern — use `scrollRef` for scroll state, forward `ref` to outer wrapper
- Add `useState` for `canScrollLeft` / `canScrollRight`
- Add `updateScrollState` callback with empty deps (scrollRef is stable)
- Add `useEffect` with scroll listener + `ResizeObserver` (handles initial load and resize)
- Conditionally apply `opacity-0` / `opacity-100` with `transition-opacity duration-200`

- [ ] **Step 3: Verify with dev server**

Run: `npm run dev`
Open dashboard, upload CSV, check that:
- On initial load (Overview tab selected, scrolled left): left gradient is hidden, right gradient is visible
- Scroll tabs right: both gradients visible
- Scroll fully right: right gradient hidden, left gradient visible

- [ ] **Step 4: Run type check**

Run: `npm run type-check`
Expected: No errors

- [ ] **Step 5: Commit**

```bash
git add src/components/ui/Tabs.tsx
git commit -m "fix(ux): make tab bar scroll indicators dynamic (UX-001)"
```

---

## Chunk 2: UX-002 — Fix Accessibility Tree Duplication

### Task 2: Add `aria-hidden` to CategoryIcon SVGs

The `CategoryIcon` SVGs are decorative — adjacent text labels provide the accessible name. Adding `aria-hidden="true"` prevents screen readers from announcing both icon content and text.

**Files:**
- Modify: `src/components/ui/CategoryIcon.tsx:18-28`

- [ ] **Step 1: Add `aria-hidden="true"` to the shared iconProps (TDD waiver: accessibility attribute — verified via Playwright accessibility snapshot in Chunk 4)**

In `src/components/ui/CategoryIcon.tsx`, line 18, add `aria-hidden` to the `iconProps` object:

```tsx
  const iconProps = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.5,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    className: cn("shrink-0", className),
    "aria-hidden": true as const,
  };
```

This single change covers all 11 SVG icons (10 categories + default fallback) since they all spread `{...iconProps}`.

- [ ] **Step 2: Run type check**

Run: `npm run type-check`
Expected: No errors

- [ ] **Step 3: Verify with Playwright accessibility snapshot**

Use Playwright MCP to take an accessibility snapshot of the tab bar after uploading data. Verify tab buttons now read as single labels (e.g., "Overview") not duplicated (e.g., "OverviewMap").

- [ ] **Step 4: Commit**

```bash
git add src/components/ui/CategoryIcon.tsx
git commit -m "fix(a11y): add aria-hidden to decorative CategoryIcon SVGs (UX-002)"
```

---

## Chunk 3: UX-003 — Per-Chart Downsampling for Fuel Trims

### Task 3: Add per-chart `maxPoints` support to `TimeSeriesChart`

Currently all time series data is downsampled once at the API level to 5000 points (downsample.ts:56). The Fuel Trims chart has two overlapping traces that create visual noise. We need per-chart downsampling so charts with multiple dense traces can use a lower threshold.

**Files:**
- Modify: `src/lib/data/downsample.ts` — export `lttb` for reuse
- Modify: `src/components/features/charts/TimeSeriesChart.tsx` — accept `maxPoints`, downsample per-trace
- Modify: `src/components/features/tabs/FuelTab.tsx:30-42` — pass `maxPoints={2000}` to Fuel Trims chart

**TDD waiver:** Visual density is not unit-testable — verified via Playwright screenshot comparison in Chunk 4. The LTTB algorithm itself is already proven (existing `downsample.ts`); we're only wiring it into a new call site.

- [ ] **Step 1: Export the generic `lttb` function from downsample.ts**

In `src/lib/data/downsample.ts`, change line 8 from:
```ts
function lttb<T>(...)
```
to:
```ts
export function lttb<T>(...)
```

- [ ] **Step 2: Add `maxPoints` prop to `TimeSeriesChart`**

In `src/components/features/charts/TimeSeriesChart.tsx`:

Add to the `TimeSeriesChartProps` interface (after `startTime: number;`):
```ts
  /** Per-chart LTTB downsampling threshold. If set, each trace is downsampled to this many points. */
  maxPoints?: number;
```

Add import at top:
```ts
import { lttb } from "@/lib/data/downsample";
```

In the `plotTraces` useMemo (line 55), add downsampling before the trace loop. **Important:** Pre-filter rows with defined values for the trace field *before* calling LTTB — using `0` for missing values would corrupt triangle-area calculations and distort which points are preserved. Replace the trace mapping logic:

```tsx
  const plotTraces = useMemo(() => {
    const result: Plotly.Data[] = traces.map((trace) => {
      // Filter to rows that have a defined value for this trace's field
      const defined = data.filter((d) => typeof d[trace.field] === "number");

      // Per-chart downsampling if maxPoints is set
      const source = maxPoints && defined.length > maxPoints
        ? lttb(defined, maxPoints, (d) => d.timestamp, (d) => d[trace.field] as number)
        : defined;

      const xs: string[] = [];
      const ys: number[] = [];
      for (const d of source) {
        xs.push(formatTimestamp(d.timestamp, startTime));
        ys.push(d[trace.field] as number);
      }
      return {
        x: xs,
        y: ys,
        type: "scatter" as const,
        mode: trace.mode ?? "lines",
        name: trace.name,
        line: { color: trace.color ?? CHART_COLORS.primary, width: 1.5 },
        fill: (trace.fill ? "tozeroy" : undefined) as Plotly.PlotData["fill"],
        fillcolor: trace.fill ? (trace.color ?? CHART_COLORS.primaryFill) : undefined,
        yaxis: trace.yaxis ?? "y",
      };
    });
```

Add `maxPoints` to the useMemo dependency array (line 98):
```ts
  }, [data, traces, eventMarkers, startTime, maxPoints]);
```

- [ ] **Step 3: Pass `maxPoints` to Fuel Trims chart**

In `src/components/features/tabs/FuelTab.tsx`, add `maxPoints={2000}` to the Fuel Trims `TimeSeriesChart` (line 30-42):

```tsx
        <TimeSeriesChart
          data={timeSeries}
          traces={[
            { field: "shortTermFuelTrim", name: "Short-term (%)", color: CHART_COLORS.primary },
            { field: "longTermFuelTrim", name: "Long-term (%)", color: CHART_COLORS.amber, yaxis: "y2" },
          ]}
          thresholdKey="shortTermFuelTrim"
          thresholds={thresholds}
          yAxisLabel="Short-term %"
          y2AxisLabel="Long-term %"
          height={280}
          startTime={startTime}
          maxPoints={2000}
        />
```

- [ ] **Step 4: Run type check**

Run: `npm run type-check`
Expected: No errors

- [ ] **Step 5: Verify visually**

Run: `npm run dev`
Upload CSV, navigate to Fuel tab. The Fuel Trims chart should look noticeably less dense — traces should be distinguishable without excessive overlap. Other charts (without `maxPoints`) should be unaffected.

- [ ] **Step 6: Commit**

```bash
git add src/lib/data/downsample.ts src/components/features/charts/TimeSeriesChart.tsx src/components/features/tabs/FuelTab.tsx
git commit -m "fix(ux): add per-chart LTTB downsampling, reduce fuel trims density (UX-003)"
```

---

## Chunk 4: Comprehensive Playwright E2E Verification

### Task 4: End-to-end verification of all three fixes

Use Playwright MCP to verify all fixes work correctly across the full dashboard.

**Pre-requisites:** Dev server running (`npm run dev`)

- [ ] **Step 1: Navigate to app and upload test data**

1. Navigate to `http://localhost:3000`
2. Click "Go to Dashboard"
3. Upload test CSV via file chooser (`input/2026-03-17 18-27-59.csv`)
4. Wait for analysis to complete

- [ ] **Step 2: Verify UX-001 — Dynamic scroll indicators**

Use `browser_evaluate` to inspect DOM class names — accessibility snapshots cannot detect CSS `opacity-0`/`opacity-100` state.

1. Use `browser_evaluate` to query the two gradient `<div>` elements inside the tab bar's `.relative` wrapper. Check their `className` for `opacity-0` vs `opacity-100`:
   ```js
   // Get gradient divs (first two children of the .relative wrapper around the tablist)
   const wrapper = document.querySelector('[role="tablist"]').parentElement;
   const [leftGrad, rightGrad] = [wrapper.children[0], wrapper.children[1]];
   return {
     leftHasOpacity0: leftGrad.className.includes('opacity-0'),
     rightHasOpacity0: rightGrad.className.includes('opacity-0'),
   };
   ```
2. On initial load (Overview selected): left should have `opacity-0`, right should have `opacity-100`
3. Click on "Air Intake" tab (last tab — forces scroll right)
4. Re-run evaluate: left should have `opacity-100`, right should have `opacity-0`
5. Click on "Overview" tab (forces scroll left)
6. Re-run evaluate: left `opacity-0`, right `opacity-100`
7. Take screenshot for evidence

- [ ] **Step 3: Verify UX-002 — Accessibility tree**

1. Take accessibility snapshot of the tab bar
2. Verify each tab button's accessible name is a single label (e.g., "Overview", "Engine", "Fuel") — NOT duplicated (e.g., "OverviewMap", "EngineEngine")
3. Verify all 10 tabs are present in the accessibility tree with correct roles (`tab`, `aria-selected`)

- [ ] **Step 4: Verify UX-003 — Fuel Trims chart density**

1. Click on "Fuel" tab
2. Wait for charts to render
3. Take screenshot of the Fuel Trims chart
4. Visually confirm traces are distinguishable and not excessively overlapping
5. Verify chart still has data (not empty from over-aggressive downsampling)

- [ ] **Step 5: Verify no regressions — Full tab walkthrough**

Walk through every tab to confirm no regressions:

1. **Overview** — GPS map + Speed Profile chart render
2. **Engine** — 5 charts render
3. **Fuel** — 5 charts render (including the modified Fuel Trims)
4. **Transmission** — 6 charts render
5. **Power** — 4 charts render
6. **Driving** — 2 charts render
7. **ABS / Stability** — 4 charts render
8. **AWD** — 2 charts render
9. **Electrical** — 1 chart renders
10. **Air Intake** — 4 charts render

For each tab: verify chart count, check for empty chart areas, check console for JS errors.

- [ ] **Step 6: Check console for errors/warnings**

1. Check browser console messages
2. Verify zero JS errors
3. Verify zero warnings
4. Document any new console output

- [ ] **Step 7: Final screenshots**

Take screenshots of:
1. Tab bar with left gradient hidden (scrolled to start)
2. Tab bar with both gradients visible (scrolled to middle)
3. Fuel Trims chart (showing reduced density)
4. Any tab with charts rendered (general health check)

- [ ] **Step 8: Commit any test artifacts and update report**

```bash
git add docs/superpowers/e2e-screenshots/
git commit -m "test: playwright e2e verification of UX fixes"
```

Note: Do NOT use `git add -A` — it would stage unrelated screenshot artifacts and potentially large binaries from the project root. Only stage specific test output files.
