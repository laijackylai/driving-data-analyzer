  ---
  Frontend Redesign Plan: OBD2 Dashboard

  Design Direction

  Aesthetic: Premium automotive instrument cluster meets modern data dashboard. Think deep sapphire blue pearl paint finish with the lustrous depth of metallic automotive paint. Red accents evoke
  performance gauges and warning indicators. The feel should be technical, precise, and premium - like sitting behind the wheel of a high-end vehicle.

  Typography: We'll use a distinctive display font (e.g., DM Sans or Outfit for headings, JetBrains Mono for data values) to give it a technical, engineered quality.

  Key Visual Elements: Pearl-like gradient overlays, subtle grain texture for depth, glowing red accent indicators, card glass-morphism against dark sapphire backgrounds.

  ---
  Stage 1: Design Foundation

  Goal: Establish the color system, typography, and CSS variables.

  Files:
  - tailwind.config.ts — Custom sapphire blue pearl palette + red accent scale
  - src/app/globals.css — CSS variables, font imports, pearl gradient utilities, grain texture overlay
  - src/app/layout.tsx — Font loading via next/font

  Color Palette:
  ┌──────────────┬─────────┬─────────────────────┐
  │    Token     │   Hex   │         Use         │
  ├──────────────┼─────────┼─────────────────────┤
  │ sapphire-950 │ #0a1628 │ Page background     │
  ├──────────────┼─────────┼─────────────────────┤
  │ sapphire-900 │ #0f2240 │ Card backgrounds    │
  ├──────────────┼─────────┼─────────────────────┤
  │ sapphire-800 │ #163060 │ Elevated surfaces   │
  ├──────────────┼─────────┼─────────────────────┤
  │ sapphire-700 │ #1e4080 │ Hover states        │
  ├──────────────┼─────────┼─────────────────────┤
  │ sapphire-500 │ #3670c6 │ Primary interactive │
  ├──────────────┼─────────┼─────────────────────┤
  │ sapphire-400 │ #5a92db │ Text emphasis       │
  ├──────────────┼─────────┼─────────────────────┤
  │ sapphire-200 │ #b8d4f0 │ Body text           │
  ├──────────────┼─────────┼─────────────────────┤
  │ sapphire-100 │ #dce8f5 │ Headings            │
  ├──────────────┼─────────┼─────────────────────┤
  │ red-500      │ #ef4444 │ Highlight/alert     │
  ├──────────────┼─────────┼─────────────────────┤
  │ red-400      │ #f87171 │ Accent glow         │
  └──────────────┴─────────┴─────────────────────┘
  ---
  Stage 2: Core UI Components

  Goal: Redesign all shared components with the new design system.

  Files to modify/create:
  - src/components/ui/Card.tsx — Glass-morphism cards with sapphire tint and subtle border glow
  - src/components/ui/Button.tsx — Sapphire primary, red accent variant
  - src/components/ui/Tabs.tsx — Horizontal scrollable tab bar with active indicator animation, mobile-optimized touch targets
  - src/components/features/MetricCard.tsx — Redesigned with value color coding (green/yellow/red ranges), subtle unit labels, compact mobile layout
  - src/components/ui/SafetyGauge.tsx — NEW — Animated radial gauge for safety score (SVG arc with gradient stroke)
  - src/components/ui/CategoryIcon.tsx — NEW — Icon set for each of the 9 categories (engine, air, fuel, power, motion, transmission, ABS, AWD, electrical)

  ---
  Stage 3: Dashboard Layout & Navigation

  Goal: Build the main dashboard shell with category navigation.

  Files:
  - src/app/dashboard/page.tsx — Complete redesign

  Layout (mobile-first):
  ┌─────────────────────────────┐
  │  Header: Trip Summary Bar   │  ← Compact: duration, distance, date
  ├─────────────────────────────┤
  │  Safety Score Gauge          │  ← Animated radial gauge, centered
  ├─────────────────────────────┤
  │  Category Tab Bar ←scroll→  │  ← Horizontal scroll on mobile
  ├─────────────────────────────┤
  │                             │
  │  Category Metric Grid       │  ← 1-col mobile, 2-col tablet, 3-col desktop
  │                             │
  ├─────────────────────────────┤
  │  Session Details Footer     │
  └─────────────────────────────┘

  Category Tabs (9 total):
  1. Motion (default) — speed, distance, braking, acceleration
  2. Engine — RPM, load, coolant, oil temp, timing
  3. Fuel — consumption, fuel rate, trims, cost
  4. Air Intake — MAF, boost, throttle, manifold pressure
  5. Power — fuel-based power, MAF-based power
  6. Transmission — CVT temp, gear ratio, pulley speeds
  7. ABS/Stability — wheel speeds, steering angle
  8. AWD — solenoid currents
  9. Electrical — battery voltage

  ---
  Stage 4: API & Data Flow Update

  Goal: Return full OBD2AnalysisResult to the frontend.

  Files:
  - src/app/api/analyze/route.ts — Return both OBD2AnalysisResult (for new dashboard) and keep backward-compatible AnalysisResult
  - src/app/dashboard/page.tsx — Update state type to OBD2AnalysisResult

  API Response Shape:
  {
    success: true,
    result: OBD2AnalysisResult,  // Full 9-category result
    dataPointsCount: number,
  }

  ---
  Stage 5: Category Detail Panels

  Goal: Build out all 9 category views with their metrics.

  Files:
  - src/components/features/CategoryMetrics.tsx — Redesign with new MetricCard style
  - src/components/features/CategoryPanel.tsx — NEW — Wrapper that handles empty states, category descriptions, and metric grid layout per category

  Per-Category Features:
  - Only metrics with data are shown (null values hidden or shown as "No data")
  - Metrics grouped logically within each category (e.g., Engine: performance group + temperature group)
  - Red highlight on warning values (high coolant temp, low battery, harsh events)
  - Compact 2-column grid on mobile, expanding to 3 on desktop

  ---
  Stage 6: Animations & Micro-interactions

  Goal: Add motion and polish for a premium feel.

  Details:
  - Page load: Staggered fade-up for metric cards (CSS animation-delay)
  - Safety gauge: Animated arc fill on mount (CSS keyframes)
  - Tab switching: Content crossfade transition
  - Metric cards: Subtle scale on hover (desktop)
  - File upload: Progress indicator with sapphire gradient
  - Number formatting: Animated count-up for key values (safety score, speed, distance)

  Implementation: CSS-only animations where possible; potentially add framer-motion if React-level orchestration is needed.

  ---
  Stage 7: Mobile Refinements & Final Polish

  Goal: Ensure flawless mobile experience and visual consistency.

  Details:
  - Touch-optimized tab targets (min 44px height)
  - Swipe gesture support for category navigation (optional)
  - Bottom sheet pattern for session details on mobile
  - Proper safe-area handling for notched devices
  - Final visual QA: gradient consistency, font sizing, spacing rhythm
  - Dark mode as the primary (sapphire-based), optional light variant

  ---
  Implementation Order & Dependencies

  Stage 1 (Foundation)
      ↓
  Stage 2 (UI Components)
      ↓
  Stage 3 (Dashboard Layout)  ←→  Stage 4 (API Update)
      ↓                              ↓
  Stage 5 (Category Panels) ←───────┘
      ↓
  Stage 6 (Animations)
      ↓
  Stage 7 (Mobile Polish)

  Estimated file count: ~12 files modified/created
  No external dependencies required beyond what's already installed (Next.js 16, React 19, Tailwind 3, clsx, tailwind-merge). Framer-motion optional for Stage 6.