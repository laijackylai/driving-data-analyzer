---
doc_type: implementation-note
task_id: TASK-003
agent: frontend-developer
date: 2026-07-23
---

# TASK-003 — Implementation note

See [[../05-tasks/completed/TASK-003-fix-dotloader-test|TASK-003]] for full task context. This note
summarizes the same evidence recorded in that task's "Implementation evidence" section.

## Changed files
- `src/test/DotLoader.test.tsx` (only file changed — write scope respected).

No production code was changed. `src/components/features/DotLoader.tsx` was read directly to
confirm real behavior first (label text has no ellipsis and is a separate element from the dot
spans; dot visibility is driven by `dotCount` state toggling `opacity-100`/`opacity-0` classes, no
`animationDelay` style anywhere) and was confirmed to have zero uncommitted git diff both before
and after this task — it was never touched.

## What changed and why
1. `"renders 'Analyzing...' text"` → renamed `"renders the 'Analyzing' label text"`; assertion
   changed from `screen.getByText("Analyzing…")` to `screen.getByText("Analyzing")` to match the
   real, ellipsis-free label text.
2. `"applies staggered animation delays to dots"` → renamed `"applies staggered opacity classes to
   dots as dotCount advances"`; replaced nonexistent `animationDelay` style assertions with
   assertions on the real `opacity-100`/`opacity-0` classes. Added `vi.useFakeTimers()` +
   `vi.advanceTimersByTime(400)` (wrapped in `act(...)`, restored via `vi.useRealTimers()` in a
   `finally`) to also verify the stagger advances across two 400ms ticks, per the task's optional
   guidance.
3. `"renders three dots"` and `"accepts custom className"` left unmodified.

## Commands run and results
- `npm test -- DotLoader`, run 4x total: consistently `Test Files 1 passed (1)`,
  `Tests 4 passed (4)`.
- `npm test` (full suite), run 3x:
  - Run 1: `Test Files 1 failed | 11 passed (12)`, `Tests 1 failed | 113 passed (114)` — the one
    failure was `DashboardView.test.tsx > "returns to LANDING when home button is clicked from
    DASHBOARD"` (`vi.waitFor` timing race, `Unable to find an element by:
    [data-testid="landing-view"]`).
  - Run 2 (immediately after, no code changes): `Test Files 12 passed (12)`,
    `Tests 114 passed (114)`.
  - Run 3: same single `DashboardView` failure as run 1.
  - All 4 DotLoader tests passed in every one of these runs (counted within the 113/114 passing
    totals). The DotLoader-specific defect this task targeted is fully and reliably fixed.
- `git diff --stat -- src/components/features/DotLoader.tsx src/test/DotLoader.test.tsx
  src/test/DashboardView.test.tsx` confirmed only `DotLoader.test.tsx` carries edits attributable
  to this task; `DashboardView.test.tsx`'s pre-existing diff (from TASK-001) and
  `DotLoader.tsx`'s clean diff were both left untouched.
- `git status` (before and after): confirmed no file outside `src/test/DotLoader.test.tsx` was
  modified by this task.

## Assumptions
- `DotLoader.tsx`'s current behavior (cycling label text via `setInterval`, dot opacity via
  `dotCount` state and Tailwind classes) is intentional and correct — nothing observed while
  reading it looked broken, so the test was brought in line with the component rather than
  escalating.

## Known limitations
- The added fake-timer coverage only exercises two 400ms ticks (`dotCount` 1→2→3); it does not
  cover the wrap-around back to 1 or the separate 1000ms label-cycling interval — out of scope per
  the task's acceptance criteria, which only required fixing the two broken assertions.
- Repo-wide `npm test` is **not** consistently green: an intermittent, pre-existing flake in
  `src/test/DashboardView.test.tsx` (`"returns to LANDING when home button is clicked from
  DASHBOARD"`) surfaced in 2 of 3 full-suite runs during this task. This is the same flaky test
  already flagged (as a one-off, unconfirmed occurrence) in TASK-001's implementation note; this
  task's runs confirm it recurs (2/3 runs) and is not a one-off. It is unrelated to DotLoader,
  outside this task's write scope (owned by TASK-001/002, which already has its own uncommitted
  diff on that file), and was not one of the original 6 failures TASK-003 was scoped to fix. Not
  modified here — flagged in the task file's Blockers section for the orchestrator to open a
  follow-up task.

## Status
Task moved to `implementation-complete`. Both DotLoader-specific acceptance criteria are met and
verified stable across repeated runs. The repo-wide-green criterion is only partially met due to
an out-of-scope, pre-existing flake documented above and in the task's Blockers section. QA
evidence is left for `qa-engineer`.
