---
doc_type: implementation-note
task_id: TASK-001
agent: frontend-developer
date: 2026-07-23
---

# TASK-001 — Implementation note

See [[../05-tasks/completed/TASK-001-fix-stale-frontend-tests|TASK-001]] for full task context. This
note summarizes the same evidence recorded in that task's "Implementation evidence" section.

## Changed files
- `src/test/categoryIcon.test.tsx`
- `src/test/DashboardView.test.tsx`

No production code was changed (none was needed — `CategoryIcon.tsx` and `deriveMetrics.ts` were
already correct; only the two test files were stale).

## What changed and why
1. **`categoryIcon.test.tsx`**: `CATEGORY_ORDER` in `src/components/ui/CategoryIcon.tsx` was read
   directly (lines 322-343) and confirmed to contain 19 entries (the original 11 plus 8 `cobb*`
   categories added for COBB Accessport support: `cobbEngine`, `cobbBoost`, `cobbAFR`,
   `cobbPower`, `cobbKnock`, `cobbWastegate`, `cobbInjector`, `cobbAVCS`). Updated
   `"has 11 categories total"` → `"has 19 categories total"` (and its assertion), and extended the
   `expected` array in `"includes all expected categories"` to the full 19-entry list in source
   order.
2. **`DashboardView.test.tsx`**: `DerivedMetrics` (`src/types/index.ts`, lines 436-449) and
   `computeDerivedMetrics()` (`src/lib/data/deriveMetrics.ts`, lines 249-264) were read directly.
   `computeDerivedMetrics` has a single return path that unconditionally populates all 12 fields —
   confirming the crash was caused solely by the hand-written mock in `makeMockResult()` predating
   6 newer fields. Extended the `derived` fixture with `thermalDelta: []`, `torqueSplit: []`,
   `ratioError: []`, `torqueConverterSlip: []`, `volumetricEfficiency: []`, `stftStability: []`.
   Empty arrays are type-correct (`ThermalDeltaPoint[]`, `TorqueSplitPoint[]`, `RatioErrorPoint[]`,
   `TorqueConverterSlipPoint[]`, `OBD2DataPoint[]`, `TimeSeriesRow[]` respectively) and no test in
   the file inspects their contents, only their presence (via `EngineTab`'s `.map()` calls no
   longer throwing on `undefined`).

## Commands run and results
- `npm run type-check` → clean (`tsc --noEmit`, no errors).
- `npx vitest run src/test/categoryIcon.test.tsx src/test/DashboardView.test.tsx` → run twice
  after an initial transient failure in an untouched, pre-existing test; both repeat runs:
  `PASS (25) FAIL (0)`.
- `npm test` (full suite) → run 3x, consistently `Test Files 1 failed | 11 passed (12)`,
  `Tests 2 failed | 112 passed (114)`. The 2 failures are both in `src/test/DotLoader.test.tsx`
  (`"renders 'Analyzing...' text"`, `"applies staggered animation delays to dots"`) — confirmed
  via `git diff -- src/components/features/DotLoader.tsx` to be unmodified (clean diff, last
  touched at commit `73351e5`), i.e. a pre-existing defect unrelated to REQ-6/COBB in-progress
  work and outside both TASK-001's and TASK-002's declared scope.
- `git status` (before and after): only `src/test/categoryIcon.test.tsx` and
  `src/test/DashboardView.test.tsx` carry edits attributable to this task. Both files were already
  showing as modified before this task started (part of the same uncommitted mid-development
  branch) — this task added to, but did not create, that existing diff. No other file was
  touched.

## Assumptions
- `computeDerivedMetrics()` always returns a fully-populated `DerivedMetrics` object (single
  return path, no partial/branching construction) — independently verified by reading the
  function body, matching the task's stated Assumptions.
- Empty-array mock values are acceptable for the 6 new `derived.*` fields since no test asserts on
  their contents (per task guidance).

## Known limitations
- Repo-wide `npm test` is not fully green: 2 failures remain in `src/test/DotLoader.test.tsx`,
  outside this task's write scope (`src/test/categoryIcon.test.tsx`,
  `src/test/DashboardView.test.tsx` only) and outside its diagnosed root cause. Not fixed here;
  flagged for the orchestrator to decide whether a new task is warranted before release.
- One transient failure was observed in the pre-existing (untouched) test
  `"returns to LANDING when home button is clicked from DASHBOARD"` during an isolated-file run
  only; not reproduced across two follow-up runs. Not a regression from this task's changes (that
  test's logic and the `derived.*` fields it doesn't use were both left untouched), but noted for
  QA awareness in case of recurrence.

## Status
Task moved to `implementation-complete`. Both acceptance criteria owned by this task
(`categoryIcon.test.tsx` and `DashboardView.test.tsx` fixes) are met and verified. QA evidence is
left for `qa-engineer`.
