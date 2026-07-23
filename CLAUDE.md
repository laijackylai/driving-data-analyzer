# Claude Instructions

## Commands

```bash
npm run dev          # Start dev server (Next.js)
npm run build        # Production build
npm start            # Start production server
npm run lint         # ESLint
npm run type-check   # TypeScript check (tsc --noEmit)
```

## Project Context

OBD2 driving data analyzer — upload CSV files of OBD2 sensor readings, analyze driving behavior across 9 categories (engine, fuel, power, motion, etc.), and display a safety score dashboard.

**Stack:** Next.js 16 (App Router), React 19, TypeScript (strict), Tailwind CSS 3

## Project Structure

```
src/
├── app/
│   ├── api/analyze/route.ts      # POST endpoint: CSV upload → OBD2AnalysisResult
│   ├── dashboard/page.tsx        # Client-side dashboard ("use client")
│   ├── page.tsx                  # Landing page
│   ├── layout.tsx                # Root layout (Geist Sans, JetBrains Mono fonts)
│   └── globals.css               # Tailwind directives + glass-morphism + safe-area utilities
├── components/
│   ├── ui/                       # Generic: Button, Card, Tabs, CategoryIcon (SafetyGauge exists but not used in dashboard)
│   └── features/                 # Feature: FileUpload, CategoryPanel, CategoryMetrics, MetricCard
├── lib/
│   ├── utils.ts                  # cn(), formatFileSize(), formatDuration()
│   └── data/
│       ├── obd2Parser.ts         # CSV parsing (splitOBD2Line, parseOBD2CSV)
│       ├── obd2Analyzer.ts       # Analysis algorithms per category
│       ├── obd2Validators.ts     # Input validation and type guards
│       ├── pidConstants.ts       # OBD2 Parameter ID mappings
│       └── transformers.ts       # Long-form → wide-form data pivoting
├── hooks/
│   ├── useCountUp.ts             # Animated number counter
│   └── useSwipe.ts               # Touch/swipe gesture handler
└── types/
    └── index.ts                  # OBD2Reading, OBD2DataPoint, OBD2AnalysisResult, AnalysisResult
```

## Key Files

- **API route** (`src/app/api/analyze/route.ts`): Accepts multipart form-data (10MB limit), validates CSV, returns `OBD2AnalysisResult`
- **Types** (`src/types/index.ts`): All shared interfaces — start here to understand data shapes
- **PID constants** (`src/lib/data/pidConstants.ts`): Maps OBD2 parameter IDs to names/categories

## Code Style

- Path alias: `@/*` → `./src/*` for all imports
- Use `cn()` from `@/lib/utils` for conditional Tailwind classes
- UI components (`src/components/ui/`) are generic and reusable; feature components can be specific
- Prefer Server Components; use `"use client"` only when needed (dashboard, interactive components)
- Define all types in `src/types/index.ts`; use interfaces over type aliases for objects
- Custom design tokens in `tailwind.config.ts`: sapphire palette, accent colors, glass-morphism shadows

## Environment

- Copy `.env.example` → `.env.local` for local development
- No external services — all processing is in-memory, no data persisted

## Gotchas

- **OBD2 CSV format**: Long-form (timestamp, PID name, value, units) — not one-row-per-reading. `splitOBD2Line` handles quoted fields and trailing semicolons
- **Timestamps are seconds** (Unix float with microsecond precision), not milliseconds
- **PID-keyed architecture**: Data pivoted from long-form to wide-form (`OBD2DataPoint`) with all PID fields optional
- **Glass-morphism CSS**: Requires `backdrop-filter` browser support; graceful degradation for older browsers
- **Safe area insets**: CSS env() variables used for notched mobile devices with fallbacks
- **Deleted files**: `src/lib/data/analyzer.ts` and `validators.ts` were replaced by `obd2Analyzer.ts`, `obd2Parser.ts`, `obd2Validators.ts`

## Agent-team operating system (added 2026-07-23)

This repo now also runs the reusable multi-agent operating system from `laijackylai/agt_1`:
`.claude/agents/` (orchestrator, research-technical/critical, architect, ui-ux, frontend/backend/
data-infra developers, qa-engineer, release-engineer), `.claude/commands/` (`/start-project`,
`/research`, `/plan-feature`, `/implement-task`, `/review-task`, `/release-check`), an Obsidian
vault at `vault/`, and validation tooling at `scripts/`+`tests/`.

- **Everything above this section is this project's own pre-existing convention and stays
  authoritative** — the OS does not override it.
- Canonical product/architecture/task state now lives in `vault/`, not only in `docs/plan/` or
  chat. `docs/plan/` and `docs/superpowers/plans/` remain valid working notes; anything that
  should persist as a decision gets promoted into `vault/`.
- Approval gates (architecture needs human sign-off, QA is independent, release needs human
  sign-off) apply from here forward. See root-level `vault/HOME.md` for navigation and
  `agt_1`'s `README.md` for the full workflow explanation.
- Run `python3 scripts/validate-agent-system.py` and `python3 -m unittest discover -s tests -v`
  after any change to `.claude/`, `vault/` structure, or the scripts themselves.