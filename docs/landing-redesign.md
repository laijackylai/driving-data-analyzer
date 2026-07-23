# Landing Page Redesign — Design Spec

## Overview

Replace the current `DashboardView`-as-homepage with a dedicated full-screen landing page. The landing and dashboard are **state-driven views within a single route** (`/`), not separate pages.

---

## Layout

Single viewport, no scroll. Consistent **24px padding** (mobile) / **32px padding** (desktop) from all edges.

```
┌─────────────────────────────────────────────┐
│  OBD2Charts              [round logo]       │  ← top bar
│                                             │
│                                             │
│                                             │
│              ┌──────────┐                   │
│              │  upload   │                   │  ← slightly above center
│              │  (icon)   │                   │
│              └──────────┘                   │
│                [Demo]                       │  ← smaller, below upload
│                                             │
│                                             │
│                                             │
│                          ┌─────────────────┐│
│                          │ description text ││  ← bottom-right
│                          └─────────────────┘│
└─────────────────────────────────────────────┘
```

**Vertical positioning:** Upload button sits ~40% from the top (slightly above optical center), anchored by the bottom-right text block.

---

## Components

### Top Bar

| Element | Position | Details |
|---------|----------|---------|
| "OBD2Charts" | Top-left | **Doto** font (Google Fonts), `font-weight: 600`, `text-sapphire-100`. Pixel/dot-matrix aesthetic — matches the automotive instrument cluster theme. |
| Logo placeholder | Top-right | 40px round `div`, `bg-sapphire-800` border `border-glass-edge`, centered "?" or generic icon. Will be replaced with actual logo later. |

### Upload Button (center)

- **Shape:** Rounded square, ~88px × 88px, `rounded-2xl`
- **Style:** `glass-card` base with `glow-sapphire` hover effect
- **Icon:** Placeholder upload arrow (SVG), 32px, `text-sapphire-300`
- **No label** — icon only
- **Interaction:**
  - Click → opens native file picker (`.csv`)
  - The **entire page** is a drag-and-drop zone. On drag-over, show a full-screen overlay with dashed border and "Drop CSV file" hint text
- **Hover:** Scale 1.05, border brightens to `glass-edge-hover`, subtle `glow-sapphire`

### Demo Button

- **Position:** Centered below upload button, 12px gap
- **Style:** Text button, `text-xs font-medium text-sapphire-500 hover:text-sapphire-300`, underline on hover
- **Label:** "Demo"
- **Behavior:** Fetches `/examples/example-drive.csv`, creates a `File` object, triggers the same `handleFileSelect` flow as a real upload

### Bottom-Right Description

- **Position:** Bottom-right corner, max-width ~320px, right-aligned text
- **Font:** Geist Sans, `text-xs`, `text-sapphire-500`, `leading-relaxed`
- **Content (blend of technical and consumer-friendly):**

  > Analyze your driving data from OBD2 sensors. Upload a CSV export to explore engine performance, fuel efficiency, transmission behavior, power output, driving dynamics, braking, AWD, electrical systems, and air intake — all visualized in one dashboard.

---

## Fonts

### Changes from current

| Role | Current | New |
|------|---------|-----|
| Brand name ("OBD2Charts") | Outfit | **Doto** (Google Fonts) — pixel/dot-matrix display |
| Display headings | Outfit | Outfit (keep) |
| Body / UI text | DM Sans | **Geist Sans** (`next/font/google` or `geist` package) |
| Monospace | JetBrains Mono | JetBrains Mono (keep) |

**Why Doto:** Pixelated/dot-matrix letterforms evoke retro digital instrument clusters. Against the sapphire dark palette with glass-morphism, it creates a high-contrast brand anchor without competing with the data-dense dashboard.

**Why Geist Sans:** Clean geometric sans-serif. Echoes Doto's grid-based DNA while being highly readable at small sizes. Pairs well with dark UI and monospace data displays. Slightly more personality than Inter, less decorative than DM Sans.

### Font loading

Add to `layout.tsx`:
```tsx
import { Doto } from "next/font/google";
import { GeistSans } from "geist/font/sans";
// or use next/font/google if Geist is available there
```

Update CSS variables:
- `--font-brand: var(--font-doto)` — used only for "OBD2Charts"
- `--font-body: var(--font-geist-sans)` — replaces DM Sans globally

Update `tailwind.config.ts`:
```ts
fontFamily: {
  brand: ["var(--font-doto)", "monospace"],
  display: ["var(--font-outfit)", "system-ui", "sans-serif"],
  body: ["var(--font-geist-sans)", "system-ui", "sans-serif"],
  mono: ["var(--font-jetbrains)", "monospace"],
}
```

---

## State Machine

The page has two states managed by React state (not routing):

```
┌──────────┐   upload/demo    ┌────────────┐
│ LANDING  │ ───────────────► │ ANALYZING  │
│          │                  │ (dots)     │
└──────────┘                  └─────┬──────┘
      ▲                             │ success
      │                             ▼
      │  home button          ┌────────────┐
      │  (clears state)       │ DASHBOARD  │
      └────────────────────── │            │
                              └────────────┘
```

| State | View |
|-------|------|
| `LANDING` | Full-screen landing (no result, not analyzing) |
| `ANALYZING` | Pixelated transition → dot progress indicator |
| `DASHBOARD` | Current `DashboardContent` with sticky tab bar + timeline |

**Home button:** Added to the **far right of the `TimelineSlider`** (after the existing Reset button). Simple house SVG icon. On click: clears all analysis state (`result`, `timeSeries`, `gps`, `derived`, `thresholds`, `error`) → returns to `LANDING`.

---

## Transitions

### Landing → Analyzing (pixelated dissolve)

When upload starts:
1. Landing content fades out with a **pixel-dissolve effect**: render landing as a grid of small squares (~8×8px cells) that randomly disappear over ~600ms
2. Implementation: CSS `clip-path` grid or canvas-based pixel mask, staggered random delays
3. After dissolve completes, show centered **dot loading indicator**

### Analyzing → Dashboard

1. Dot indicator fades out (200ms)
2. Dashboard content fades up (`animate-fade-up`, already exists in codebase)

### Dashboard → Landing (home button)

1. Quick fade-out (200ms)
2. Landing fades in (300ms)
3. No pixel effect on return — keep it fast

### Dot Loading Indicator

- **3 dots**, each 8px circle, `bg-sapphire-400`
- Staggered bounce animation (0ms, 150ms, 300ms delay)
- Centered on screen where upload button was
- Below dots: `text-xs text-sapphire-500` "Analyzing..."

---

## Full-Page Drag & Drop

The entire viewport is a drop zone (not just the upload button area).

| State | Visual |
|-------|--------|
| Default | No indicator |
| Dragging over page | Full-screen overlay: `bg-sapphire-950/80 backdrop-blur-sm`, dashed border inset 24px, centered upload icon + "Drop CSV file here" text |
| File dropped | Triggers `handleFileSelect`, overlay dismisses |

Implemented with `onDragEnter`/`onDragOver`/`onDragLeave`/`onDrop` on the root container.

---

## Responsive Behavior

| Breakpoint | Adjustments |
|------------|-------------|
| Mobile (<640px) | 24px padding, upload button 72px, description text left-aligned full-width at bottom |
| Tablet/Desktop (≥640px) | 32px padding, upload button 88px, description bottom-right |

The landing page should **never scroll** — all content fits in one viewport. If the viewport is very short (landscape phone), reduce vertical gaps proportionally.

---

## Color Palette (no changes)

All existing design tokens apply. The landing page uses:
- `bg-sapphire-950` background (matches `layout.tsx`)
- `pearl-overlay` and `grain-overlay` (already in layout)
- `glass-card` for the upload button
- `text-sapphire-*` scale for text hierarchy
- `glow-sapphire` for interactive hover states

---

## File Changes Summary

| File | Change |
|------|--------|
| `src/app/layout.tsx` | Add Doto + Geist Sans fonts, update CSS variables |
| `tailwind.config.ts` | Add `font-brand`, update `font-body` to Geist Sans |
| `src/app/page.tsx` | Remains thin wrapper, renders `DashboardView` |
| `src/components/features/DashboardView.tsx` | Add landing/dashboard state toggle, landing UI, full-page drop zone, pixelated transition, home button integration |
| `src/components/features/LandingView.tsx` | **New** — extracted landing page component |
| `src/components/features/PixelTransition.tsx` | **New** — pixel dissolve animation component |
| `src/components/features/DotLoader.tsx` | **New** — three-dot loading indicator |
| `src/components/features/TimelineSlider.tsx` | Add home button (house icon) at far right |
| `src/components/features/FileUpload.tsx` | May be simplified or removed (upload logic moves to landing) |

---

## Testing

### Unit Tests

| Test file | Coverage target | What it tests |
|-----------|----------------|---------------|
| `LandingView.test.tsx` | 100% | Renders brand name, logo placeholder, upload button, demo button, description text. Click upload triggers file picker. Click demo fetches example CSV. |
| `PixelTransition.test.tsx` | 100% | Renders children, applies dissolve class on `active` prop, calls `onComplete` after animation, handles unmount during animation. |
| `DotLoader.test.tsx` | 100% | Renders 3 dots, shows "Analyzing..." text, applies staggered animation delays. |
| `TimelineSlider.test.tsx` | Update existing | Home button renders, click clears state (calls `onHomeClick`), disabled state when on landing. |
| `DashboardView.test.tsx` | Update existing | State machine: landing → analyzing → dashboard → landing (home). Full-page drag-and-drop overlay appears/disappears. Error state returns to landing-compatible view. |

### Functional / Integration Tests

| Test | What it verifies |
|------|-----------------|
| Upload flow (file picker) | Click upload → select file → pixelated transition → dots → dashboard renders with data |
| Upload flow (drag & drop) | Drag file over page → overlay appears → drop → transition → dashboard |
| Demo flow | Click Demo → fetch example CSV → same transition → dashboard with example data |
| Home button | From dashboard → click home icon on timeline → state clears → landing page visible |
| Error handling | Upload invalid file → error shown → can retry or click Demo |
| Responsive | Landing fits viewport at 375px, 768px, 1280px widths without scroll |
| Font loading | Doto renders for brand name, Geist Sans for body text |
| Drag-and-drop edge cases | Drag non-CSV → error message. Drag over then leave → overlay dismisses. Multiple rapid drops → only first processed. |
