# Interactive Charts & GPS Map — Design Spec

## Overview

Add interactive time-series charts, scatter plots, histograms, and a GPS route map to the OBD2 driving data analyzer dashboard. Charts are organized into 9 tabs with linked brushing (selecting a time range on any chart highlights the corresponding GPS segment and syncs all charts). All thresholds and tooltips are specific to the **2024 Subaru Impreza RS** (2.5L FB25 naturally aspirated, CVT, symmetrical AWD).

### Libraries
- **Charts**: `react-plotly.js` + `plotly.js` — rich interactivity (zoom, pan, hover crosshairs, range selection, WebGL for large datasets)
- **Map**: `react-leaflet` + `leaflet` with OpenStreetMap tiles (CartoDB Dark Matter dark theme, free)
- Both dynamically imported (`next/dynamic`, `ssr: false`) for Next.js compatibility

### Aesthetic Direction
Luxury automotive cockpit HUD — extends the existing sapphire glass-morphism system.

- **Plotly traces**: Gradient fills under lines, subtle glow matching sapphire palette
- **Threshold bands**: Frosted semi-transparent fills (not flat rectangles)
- **Chart grid**: Near-invisible `sapphire-800` hairlines
- **Hover tooltips**: Custom glass-morphism style (backdrop-blur, border glow) matching MetricCard
- **Map tiles**: CartoDB Dark Matter (dark, minimal labels)
- **Route trace**: 4px glowing polyline with drop-shadow, color gradient along path
- **Scatter points**: Outer glow on hover, size varies by secondary metric
- **Time range selection**: Frosted glass highlight band (pearl-sheen aesthetic)
- **Axis labels**: DM Sans font, `sapphire-200` color
- **Chart backgrounds**: Transparent (glass-morphism Card provides depth)
- **Pop accent**: Subaru WR Red `#E0202C` — used for danger zones, redline shading, harsh event markers, critical data point hover glow

---

## Data Architecture

### Extended API Response

`POST /api/analyze` response changes from:

```ts
{ success: true; result: OBD2AnalysisResult }
```

to:

```ts
interface ExtendedAnalysisResponse {
  success: true;
  result: OBD2AnalysisResult;          // existing — unchanged
  timeSeries: TimeSeriesDataPoint[];    // pivoted wide-form data per ~1s bucket
  gps: GPSDataPoint[];                 // lat/lon/altitude/speed per ~1s bucket
  derived: DerivedMetrics;             // new server-side computations
  thresholds: ThresholdConfig;         // 2024 Impreza RS thresholds
}
```

### New Types (`src/types/index.ts`)

```ts
// TimeSeriesDataPoint is the existing OBD2DataPoint — already computed internally
// by the analyzer but currently discarded. Will be returned in the response.

interface GPSDataPoint {
  timestamp: number;
  lat: number;
  lon: number;
  altitude?: number;
  gpsSpeed?: number;
}

interface DerivedMetrics {
  wheelSpeedDiffs: { timestamp: number; frontRearDelta: number; leftRightDelta: number }[];
  cvtEffectiveRatio: { timestamp: number; ratio: number }[];
  fuelBySpeedBucket: { bucket: string; avgConsumption: number; sampleCount: number }[];
  engineZones: { timestamp: number; zone: 'eco' | 'normal' | 'sport' }[];
  awdEngagementEvents: { timestamp: number; current: number; duration: number }[];
}

interface ThresholdConfig {
  [metricKey: string]: {
    normal: [number, number];
    warning: [number, number];
    danger: [number, number];
  };
}
```

### GPS Parsing (`src/lib/data/gpsParser.ts`)

The CSV has `LATITUDE` and `LONGITUDE` columns on every row, plus `Altitude (GPS)` and `Speed (GPS)` as PID entries. The parser:
1. Extracts lat/lon from every row with valid coordinates
2. Deduplicates by ~1s timestamp buckets (matching time-series bucketing)
3. Merges altitude and GPS speed from PID rows into nearest GPS point

### Derived Metrics (`src/lib/data/deriveMetrics.ts`)

Computed server-side from the time-series array:

- **Wheel speed differentials**: `(avgFront - avgRear)` and `(avgLeft - avgRight)` per timestamp
- **CVT effective ratio**: `primaryPulleySpeed / secondaryPulleySpeed` per timestamp
- **Fuel by speed bucket**: Average `instantFuelRate` grouped into 0-30, 30-60, 60-90, 90+ km/h
- **Engine zones**: Classify each timestamp by RPM + load: eco (<2000 RPM, <30% load), sport (>4000 RPM or >70% load), normal (everything else)
- **AWD engagement events**: Timestamps where solenoid actual current exceeds 150mA baseline, grouped into contiguous events with duration

### Payload Size

~101K CSV rows → ~3000 bucketed time-series points + ~3000 GPS points ≈ ~500KB JSON. Acceptable for single-session upload. Future optimization: Largest-Triangle-Three-Buckets downsampling if needed.

---

## 2024 Subaru Impreza RS Thresholds

Engine: 2.5L FB25 naturally aspirated boxer. No turbo/boost. Redline 6200 RPM.

| Parameter | Normal | Warning | Danger |
|-----------|--------|---------|--------|
| Engine RPM | 0–5000 | 5000–6000 | >6000 |
| Coolant temp | 80–100°C | 100–108°C | >108°C |
| Oil temp | 80–110°C | 110–125°C | >125°C |
| CVT temp | 60–100°C | 100–120°C | >120°C |
| Battery voltage | 13.8–14.6V | 12.5–13.8V or >14.6V | <12.5V or >15.0V |
| Intake vacuum | -0.8 to -0.2 bar | -0.2 to 0 bar | >0 bar (sensor fault) |
| Knock correction | 0° | -1° to -3° | < -3° |
| Short-term fuel trim | -5% to +5% | ±5–10% | > ±10% |
| Long-term fuel trim | -5% to +5% | ±5–8% | > ±8% |
| MAF air flow | 2–40 g/s | >40 g/s | >50 g/s |

Stored in `src/lib/data/thresholds.ts` as a typed config object. Used by both server (safety score) and client (chart annotations).

---

## Tab Structure & Chart Specifications

### Tab 1: Overview

| Chart | Type | X | Y | Details |
|-------|------|---|---|---------|
| Route Map | Leaflet polyline | lon | lat | Colored by speed gradient (green→amber→subaru-red). CartoDB Dark Matter tiles. Click segment → set time range. Start/end custom SVG markers. |
| Speed Profile | Time-series line | time | km/h | GPS speed + OBD speed overlaid. Subaru-red markers for harsh braking, amber for rapid acceleration. |

Plus existing safety gauge and trip summary chips.

### Tab 2: Engine Health

| Chart | Type | X | Y | Details |
|-------|------|---|---|---------|
| RPM over time | Time-series line | time | rpm | Subaru-red shading above 6000 (redline zone). |
| Load vs RPM | Scatter | rpm | load % | Color = throttle %. Reveals operating efficiency clusters. |
| Temps over time | Dual-axis line | time | °C | Coolant (left axis) + Oil (right axis). Warning/danger bands. |
| Knock correction | Time-series bar | time | degrees | Subaru-red bars for events below -3°. |
| Timing advance vs RPM | Scatter | rpm | degrees | Normal envelope visible as point density. |

### Tab 3: Fuel System

| Chart | Type | X | Y | Details |
|-------|------|---|---|---------|
| Fuel trims over time | Dual line | time | % | Short-term + Long-term. Threshold bands at ±5%, ±8%, ±10%. |
| Fuel/Air ratio | Line | time | ratio | Reference line at stoichiometric (14.7:1). |
| Consumption vs speed | Scatter | km/h | L/100km | Efficiency sweet spot. Trend line overlay. |
| Consumption by speed bucket | Bar | bucket | L/100km | 4 bars: 0-30, 30-60, 60-90, 90+. |
| Cumulative fuel used | Area | distance (km) | litres | Gradient fill, slope = consumption rate. |

### Tab 4: Transmission (CVT)

| Chart | Type | X | Y | Details |
|-------|------|---|---|---------|
| CVT temp over time | Line | time | °C | Warning/danger bands. |
| Actual vs Target gear ratio | Overlay line | time | ratio | Divergence = CVT response lag. |
| Pulley speeds | Dual line | time | rpm | Primary + Secondary. |
| CVT effective ratio | Line (derived) | time | ratio | primaryPulleySpeed / secondaryPulleySpeed. |
| Lock-up duty ratio | Line | time | % | Torque converter clutch engagement. |

### Tab 5: Driving Behavior

| Chart | Type | X | Y | Details |
|-------|------|---|---|---------|
| Acceleration histogram | Histogram | g-force | count | Bins -1g to +1g. Subaru-red for harsh (< -0.4g, > 0.3g). |
| Speed vs RPM | Scatter | rpm | km/h | Color = gear ratio. Driving efficiency. |
| Throttle over time | Line | time | % | Aggressive inputs visible as spikes. |
| Power output | Line | time | hp | MAF-based. Peak annotations. |
| Throttle vs acceleration | Scatter | throttle % | g-force | Throttle response character. |

### Tab 6: ABS / Stability

| Chart | Type | X | Y | Details |
|-------|------|---|---|---------|
| 4-wheel speed | 4 overlaid lines | time | km/h | FL, FR, RL, RR. Divergence = slip/ABS activation. |
| Front-rear differential | Line (derived) | time | km/h delta | Positive = front faster. Spikes = traction events. |
| Left-right differential | Line (derived) | time | km/h delta | Spikes during cornering. |
| Steering angle vs speed | Scatter | km/h | degrees | Cornering behavior profile. |

### Tab 7: AWD System

| Chart | Type | X | Y | Details |
|-------|------|---|---|---------|
| Solenoid current over time | Dual line | time | mA | Actual vs Set. Gap = controller response. |
| AWD engagement vs steering | Scatter | steering ° | mA | AWD activation during turns. |

### Tab 8: Electrical

| Chart | Type | X | Y | Details |
|-------|------|---|---|---------|
| Battery voltage over time | Line | time | V | Warning/danger bands. Subaru-red glow below 12.5V. |

### Tab 9: Air Intake

| Chart | Type | X | Y | Details |
|-------|------|---|---|---------|
| MAF air flow over time | Line | time | g/s | Threshold bands. |
| Intake vacuum over time | Line | time | bar | Threshold bands. Positive = sensor fault (subaru-red). |
| Intake air temp over time | Line | time | °C | Ambient reference. |
| Manifold pressure vs RPM | Scatter | rpm | kPa | Vacuum leaks visible as outliers. |

---

## Linked Brushing

### Shared State: `useTimeRange` hook

```ts
interface TimeRangeState {
  start: number | null;  // null = full range
  end: number | null;
  source: 'chart' | 'map' | 'reset';
}
```

### Interaction Flow

1. **User zooms/brushes on any Plotly chart** → `onRelayout` fires → updates `useTimeRange` → all charts on current tab re-render with new xaxis range → RouteMap highlights corresponding GPS segment
2. **User clicks a segment on RouteMap** → `onClick` fires → updates `useTimeRange` → all charts across all tabs sync to that time window
3. **User switches tabs** → `useTimeRange` persists → new tab's charts render with same range
4. **Reset zoom button** → clears time range to full extent

### Cross-chart Sync (same tab)

All Plotly time-series charts on the same tab share the same x-axis range via `useTimeRange`. When one chart's `onRelayout` fires with a new `xaxis.range`, all sibling charts update. Scatter plots (which aren't time-based on x-axis) highlight points that fall within the selected time range.

---

## Component Architecture

### New Files

```
src/
├── components/
│   ├── ui/
│   │   ├── ChartWrapper.tsx          # Shared Plotly container: loading state,
│   │   │                               responsive resize, dark theme, export button
│   │   └── MetricTooltip.tsx         # Info icon + glass-morphism popover with
│   │                                   metric explanation
│   ├── features/
│   │   ├── charts/
│   │   │   ├── TimeSeriesChart.tsx    # Generic time-series line (configurable traces,
│   │   │   │                           threshold bands, dual-axis, event markers)
│   │   │   ├── ScatterChart.tsx       # Generic scatter (color-by, size-by, click-select,
│   │   │   │                           time-range highlighting)
│   │   │   ├── HistogramChart.tsx     # Distribution (bins, highlight zones)
│   │   │   ├── BarChart.tsx           # Categorical bar (speed buckets)
│   │   │   ├── AreaChart.tsx          # Cumulative area
│   │   │   └── RouteMap.tsx           # Leaflet: GPS track, color gradient, segment
│   │   │                               selection, linked brushing, dark tiles
│   │   ├── tabs/
│   │   │   ├── OverviewTab.tsx
│   │   │   ├── EngineTab.tsx
│   │   │   ├── FuelTab.tsx
│   │   │   ├── TransmissionTab.tsx
│   │   │   ├── DrivingBehaviorTab.tsx
│   │   │   ├── ABSTab.tsx
│   │   │   ├── AWDTab.tsx
│   │   │   ├── ElectricalTab.tsx
│   │   │   └── AirIntakeTab.tsx
│   │   └── (existing components unchanged)
├── hooks/
│   └── useTimeRange.ts               # Shared time range state for linked brushing
├── lib/
│   └── data/
│       ├── deriveMetrics.ts           # Server-side derived metric computations
│       ├── gpsParser.ts              # Extract GPS data from CSV
│       ├── thresholds.ts             # 2024 Impreza RS threshold definitions
│       └── metricTooltips.ts         # Tooltip content for all metrics
```

### Lazy Loading Strategy

- `react-plotly.js` imported via `next/dynamic` with `ssr: false` (Plotly requires `window`)
- `react-leaflet` + `leaflet` also dynamically imported
- Each tab component lazy-loaded — only active tab's charts render
- Plotly loaded once, shared across all chart components

---

## Metric Tooltips

Every chart title and metric card gets an info icon (`ⓘ`) that shows a glass-morphism popover on hover/tap.

### Tooltip Structure

```ts
interface MetricTooltip {
  what: string;      // 1-2 sentence plain-english explanation
  good: string;      // Normal values for 2024 Impreza RS
  bad: string;       // What indicates a problem and possible causes
  lookFor: string;   // Patterns or trends to watch
}
```

### Tooltip Content (`src/lib/data/metricTooltips.ts`)

All values specific to the 2024 Subaru Impreza RS (2.5L FB25 NA, CVT, symmetrical AWD).

#### Engine

**Engine RPM**
- What: How fast the engine crankshaft is spinning. Higher RPM = more power but more wear and fuel usage.
- Good: 700-800 idle, 1500-3500 cruising. The FB25 is most efficient around 2000-2500 RPM.
- Bad: Sustained >5000 RPM accelerates wear. >6000 is near redline (6200).
- Look for: RPM that won't drop at idle (vacuum leak), sudden spikes without throttle input (transmission slip).

**Engine Load**
- What: How hard the engine is working as a percentage of its maximum capacity.
- Good: 15-30% cruising on flat road, 40-60% moderate acceleration.
- Bad: Sustained >80% without heavy acceleration or hill climbing.
- Look for: High load at low speed (dragging brakes, low tire pressure), load that never drops below 20% at idle (sensor issue).

**Coolant Temperature**
- What: Temperature of the liquid cooling your engine. The thermostat regulates this to an optimal range.
- Good: 80-100°C — engine is at normal operating temperature.
- Bad: >108°C — engine is overheating. Could indicate low coolant, failed thermostat, or radiator blockage.
- Look for: Temp climbing steadily during a drive (cooling degradation), never reaching 80°C (thermostat stuck open), erratic swings (air in cooling system).

**Oil Temperature**
- What: Temperature of the engine oil. Oil thins as it heats, reducing its protective ability.
- Good: 80-110°C. Oil reaches operating temp slower than coolant — normal to lag behind.
- Bad: >125°C — oil is breaking down. Risk of accelerated engine wear.
- Look for: Oil temp significantly higher than coolant temp (oil cooler issue), oil temp rising without coolant rising (oil level low).

**Timing Advance**
- What: How early the spark plug fires before the piston reaches top dead center. The ECU adjusts this for optimal power and efficiency.
- Good: 5-25° depending on load and RPM. Higher advance at light load, lower under heavy load.
- Bad: Very low or negative values sustained (ECU retarding timing due to knock).
- Look for: Sudden drops correlating with knock correction events (engine detecting detonation).

**Knock Correction**
- What: The ECU pulling back ignition timing because it detected engine knock (detonation). Knock damages pistons and bearings.
- Good: 0° — no knock detected.
- Bad: < -3° — significant knock. Causes include low octane fuel, carbon buildup, or overheating.
- Look for: Consistent knock at specific RPM ranges (carbon buildup), knock only on hot days (heat-related), knock during heavy load (fuel octane too low).

#### Air Intake

**MAF Air Flow Rate**
- What: Mass of air entering the engine per second, measured by the Mass Air Flow sensor. The ECU uses this to calculate fuel injection.
- Good: 2-5 g/s at idle, 15-35 g/s cruising, up to 40 g/s at full throttle.
- Bad: >40 g/s sustained is unusual for the NA FB25. Very low readings at higher RPM suggest a dirty MAF sensor.
- Look for: Readings that don't scale with RPM (dirty or failing MAF), sudden drops to zero (intermittent connection).

**Intake Vacuum (Calculated Boost)**
- What: Pressure in the intake manifold relative to atmospheric. On your NA engine, this should always be negative (vacuum). The engine creates vacuum by sucking air through the throttle.
- Good: -0.8 to -0.2 bar. Deeper vacuum at idle and light throttle; closer to 0 at wide-open throttle.
- Bad: Positive values should never occur on an NA engine — indicates a sensor fault.
- Look for: Vacuum that doesn't go deep at idle (vacuum leak), erratic readings (intake gasket leak).

**Intake Air Temperature**
- What: Temperature of air entering the engine. Cooler air is denser and makes more power.
- Good: Roughly ambient temperature to ambient +20°C (heat soak from engine bay).
- Bad: Extremely hot intake air (>60°C) reduces power and can cause knock.
- Look for: Temp rising significantly during stop-and-go (heat soak), dropping on highway (ram air effect).

**Manifold Pressure**
- What: Absolute pressure inside the intake manifold in kPa. Atmospheric is ~101 kPa; engine vacuum pulls this lower.
- Good: 20-40 kPa at idle, 60-80 kPa cruising, 90-100 kPa at wide-open throttle.
- Bad: High pressure at idle (>50 kPa) suggests a vacuum leak.
- Look for: Pressure that doesn't drop at idle (vacuum leak), pressure that doesn't rise with throttle (clogged intake).

**Throttle Position**
- What: How far the throttle plate is open, as a percentage. Controls how much air enters the engine.
- Good: 0-5% at idle, 10-25% normal driving, 50-100% hard acceleration.
- Bad: Never reaching 0% at idle (sticky throttle body), erratic at steady state (throttle position sensor issue).
- Look for: Sudden spikes indicate aggressive driving style. Smooth gradients indicate economical driving.

#### Fuel System

**Short-Term Fuel Trim**
- What: Real-time adjustment the ECU makes to fuel injection based on oxygen sensor feedback. Positive = adding fuel (lean correction), negative = removing fuel (rich correction).
- Good: -5% to +5% — small corrections are normal.
- Bad: > ±10% — the ECU is making large corrections. Lean (positive): vacuum leak, weak fuel pump, clogged injector. Rich (negative): leaking injector, faulty O2 sensor.
- Look for: Consistently positive (lean condition — check for vacuum leaks), consistently negative (rich — check injectors).

**Long-Term Fuel Trim**
- What: The ECU's learned, persistent fuel correction. Represents a sustained deviation from expected fuel needs.
- Good: -5% to +5%.
- Bad: > ±8% — the engine has a persistent fuel delivery issue the ECU is compensating for.
- Look for: Gradually drifting over time (wear-related issue like aging O2 sensor), sudden jump (new problem like a cracked vacuum hose).

**Fuel/Air Ratio**
- What: The commanded ratio of fuel to air. Stoichiometric (ideal) is 14.7:1 for gasoline.
- Good: ~1.0 (equivalence ratio) during normal driving. Slightly rich during acceleration, lean during deceleration.
- Bad: Sustained rich (>1.05) or lean (<0.95) at steady state.
- Look for: Matches with fuel trim data — if both show lean, confirms a real lean condition.

**Instant Fuel Consumption**
- What: How much fuel the engine is using right now, in litres per hour.
- Good: 0.5-1.0 L/h at idle, 3-8 L/h cruising, up to 15+ L/h at full throttle.
- Bad: High consumption at idle (>1.5 L/h) may indicate a fuel system issue.
- Look for: Correlate with throttle and speed — high fuel at low throttle suggests efficiency problems.

#### Power

**Power from MAF**
- What: Estimated engine power output calculated from the mass air flow rate. Approximate but useful for trends.
- Good: 1-5 hp at idle, 20-60 hp cruising, up to 150-180 hp at peak (FB25 rated 182 hp).
- Bad: Peak power significantly below expected — could indicate intake restriction, exhaust restriction, or sensor error.
- Look for: Power that doesn't scale with RPM and throttle (engine issue), power peaks at unexpected RPM (tuning issue).

#### Vehicle Motion

**Vehicle Speed**
- What: Speed reported by the vehicle's wheel speed sensors via OBD2.
- Good: Matches GPS speed within ±3 km/h. Discrepancies indicate wheel size difference or sensor issue.
- Bad: Large divergence from GPS speed (wrong tire size, ABS sensor fault).
- Look for: OBD consistently higher than GPS (tires smaller than stock), consistently lower (tires larger).

**Vehicle Acceleration**
- What: Rate of speed change measured in g-force. 1g = 9.8 m/s2. Positive = accelerating, negative = braking.
- Good: -0.2g to +0.2g for smooth driving. Up to ±0.4g for spirited but safe driving.
- Bad: < -0.4g harsh braking, > 0.3g rapid acceleration — increases wear on tires, brakes, CVT, and fuel consumption.
- Look for: Frequency of harsh events. Many harsh braking events may indicate following too closely or poor anticipation.

#### Transmission (CVT)

**CVT Temperature**
- What: Temperature of the Continuously Variable Transmission fluid. The Lineartronic CVT is sensitive to heat.
- Good: 60-100°C during normal driving.
- Bad: >120°C — CVT fluid breaks down, causing accelerated belt/chain wear. The CVT is the most expensive drivetrain component to replace.
- Look for: Temp climbing during sustained hill climbs or towing (CVT stress), temp that won't cool down on highway (fluid level low or cooler blocked).

**Actual vs Target Gear Ratio**
- What: The CVT's actual operating ratio vs what the ECU commanded. The CVT continuously varies rather than shifting through fixed gears.
- Good: Actual closely tracks target with minimal lag.
- Bad: Large or persistent gap between actual and target (CVT belt slip, hydraulic pressure issue).
- Look for: Sudden ratio changes without throttle input (CVT hunting), actual ratio that won't reach target (belt slip).

**Primary / Secondary Pulley Speed**
- What: Rotational speed of the CVT's input (primary) and output (secondary) pulleys. Their ratio determines the effective gear.
- Good: Both scale smoothly with vehicle speed and RPM.
- Bad: Primary spinning much faster than expected relative to secondary (belt slip).
- Look for: Sudden discrepancies between the two (slipping), smooth ratio changes (healthy CVT operation).

**Lock-Up Duty Ratio**
- What: How much the torque converter clutch is engaged. 0% = fully open (slipping for smooth starts), 100% = fully locked (direct drive for efficiency).
- Good: 0% at low speed, transitioning to 60-100% at cruising speed.
- Bad: Never reaching high lock-up at highway speed (increased fuel consumption, heat buildup).
- Look for: Frequent lock/unlock cycling (torque converter shudder — common CVT issue).

#### ABS / Stability

**Wheel Speeds (FL, FR, RL, RR)**
- What: Individual speed of each wheel measured by ABS sensors. Used by the ABS, traction control, and stability control systems.
- Good: All four wheels within 1-2 km/h of each other during straight-line driving.
- Bad: One wheel significantly different (ABS sensor fault, tire size mismatch, brake dragging).
- Look for: Momentary divergence during cornering is normal (outer wheels go faster). Sustained divergence in a straight line is a problem.

**Front-Rear Wheel Speed Differential**
- What: Derived metric: average front wheel speed minus average rear wheel speed. Indicates traction distribution.
- Good: Near zero during normal driving. Small positive values during acceleration (front wheels unloaded slightly).
- Bad: Large sustained differential (drivetrain binding, incorrect tire sizes front vs rear).
- Look for: Spikes during acceleration on slippery surfaces (traction control intervening), correlation with AWD engagement.

**Left-Right Wheel Speed Differential**
- What: Derived metric: average left wheel speed minus average right wheel speed.
- Good: Near zero in straight lines. Diverges during turns (outer wheels travel further).
- Bad: Sustained non-zero in straight lines (brake dragging, alignment issue, tire pressure imbalance).
- Look for: Correlation with steering angle (normal cornering) vs no steering input (problem).

**Steering Angle**
- What: Angle of the steering wheel measured by the steering angle sensor. Used by stability control.
- Good: Any value — this is driver input, not a health metric.
- Bad: N/A — no warning thresholds.
- Look for: Correlate with wheel speed differentials and AWD engagement to understand vehicle dynamics during cornering.

#### AWD System

**AWD Solenoid Current (Actual / Set)**
- What: Current flowing to the AWD coupling solenoid. Higher current = more torque sent to rear wheels. The Impreza RS uses an active AWD system that varies front/rear torque split.
- Good: Low current (50-100 mA) during straight-line dry driving. Higher current during cornering, acceleration, or slippery conditions.
- Bad: Actual significantly different from set (solenoid or wiring issue). Always at maximum (system stuck engaged).
- Look for: AWD engaging during hard cornering (normal), engaging on dry straight roads (could indicate wheel speed sensor issue triggering false traction demand).

#### Electrical

**Battery Voltage**
- What: Voltage at the battery terminals while the engine is running. The alternator should maintain charging voltage above battery resting voltage.
- Good: 13.8-14.6V with engine running — alternator is charging properly.
- Bad: <12.5V (alternator not charging, belt slipping, dying alternator), >15.0V (voltage regulator failure — risks damaging electronics).
- Look for: Voltage dropping under electrical load (weak alternator), voltage sagging at idle but recovering at RPM (belt tension), gradual decline over a drive (alternator failing).

---

## Lazy Loading Strategy

- `react-plotly.js` via `next/dynamic({ ssr: false })` — Plotly requires `window`
- `react-leaflet` + `leaflet` also dynamically imported
- Each tab component lazy-loaded: only the active tab's charts render
- Plotly loaded once per session, shared across chart components

---

## Design Tokens Addition

Add to `tailwind.config.ts`:

```ts
colors: {
  'subaru-red': {
    DEFAULT: '#E0202C',
    light: 'rgba(224, 32, 44, 0.15)',   // fills, threshold bands
    medium: 'rgba(224, 32, 44, 0.4)',    // glows, active states
    dark: 'rgba(224, 32, 44, 0.8)',      // text, strong accents
  }
}
```

Usage: danger threshold bands, redline zones, harsh event markers, critical hover glows, danger metric card accents.
