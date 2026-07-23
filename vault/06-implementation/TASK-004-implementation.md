---
doc_type: implementation-note
task_id: TASK-004
agent: frontend-developer
date: 2026-07-23
---

# TASK-004 — Implementation note

See [[../05-tasks/review/TASK-004-stabilize-dashboardview-flake|TASK-004]] for full task context.
This note summarizes the same evidence recorded in that task's "Implementation evidence" section.

## Changed files
- `src/test/DashboardView.test.tsx` (only file changed — write scope respected). The file already
  carried an uncommitted TASK-001 diff (mock fixture extension, `totalDistance` type widening and
  added `derived` fixture fields) before this task started; that diff was left untouched, this
  task's change was added on top of it.

No production code was changed. `src/components/features/DashboardView.tsx` was read as the
required read-only reference and confirmed to have zero uncommitted git diff both before and
after this task.

## What changed and why
The task's Background section characterized the root cause as a race between the `PixelizeEffect`
mock's `setTimeout(onComplete, 0)` and `vi.waitFor` polling, and its In-scope section preferred
converting that mock's completion signal to `vi.useFakeTimers()`/an equivalent deterministic
mechanism. I tried the equivalent-mechanism route first: replacing the mock's render-body
`setTimeout(onComplete, 0)` with a `useEffect` tied to `targetSnapshotUrl` (no real timer at all).
Testing that change in isolation (`npx vitest run ... -t "returns to LANDING when home button"`,
15 runs) showed it made the failure **worse** — 15/15 failed, consistently, with the DOM ending
up completely empty at timeout. That result disproved the mock-timer hypothesis as the (sole)
root cause, so I reverted the mock to its original form and instrumented the test directly with
temporary `console.log(document.body.innerHTML)` calls (removed before finalizing) to see the
actual DOM at each step.

That revealed the real defect: the test's first `vi.waitFor` (after the initial upload click)
only asserted `"landing-view"` and `"pixelize-effect-out"` were **absent** from the DOM — a
condition that is equally true (a) once DASHBOARD is genuinely reached, and (b) the entire time
`viewState` is still `"analyzing"` and the dashboard snapshot hasn't been captured yet (still
rendering `"pixelize-effect-in"`). The waitFor could resolve while still in state (b), before
`viewState` had actually reached `"dashboard"` — at which point `DashboardView`'s own real 50ms
snapshot-capture `setTimeout` (production code, unrelated to the `PixelizeEffect` mock) was still
pending. The test would then click the home button while that real timer was still in flight,
and its eventual resolution could interleave with the DASHBOARD → LANDING transition and
occasionally leave the DOM inconsistent instead of showing `"landing-view"`.

The fix: added `expect(screen.queryByTestId("dot-loader")).not.toBeInTheDocument()` to that first
`vi.waitFor`, alongside the existing `"landing-view"` absence check (removed the
`"pixelize-effect-out"` check as no longer the useful signal). `dot-loader` is rendered
exclusively inside DashboardView's `viewState === "analyzing"` branch, so its absence is an
unambiguous signal that `viewState` has genuinely left `"analyzing"` — the identical
`dot-loader` + `landing-view` absence combination already used successfully by the passing
`"clicking a tab button in DASHBOARD calls scrollToSection"` test in the same file. The
`PixelizeEffect` mock itself was left in its original form. No fake timers were used in the
final fix. The test still genuinely exercises and asserts the DASHBOARD → LANDING transition via
the home button; only the precondition wait was tightened.

## Commands run and results
- `npx vitest run src/test/DashboardView.test.tsx -t "returns to LANDING when home button"`,
  isolated, 15 runs: **15/15 passed** (before the fix: 100% failure rate under the disproved
  mock-timer change, and QA's originally-reported ~29% failure rate on the unmodified code).
- `npx vitest run src/test/DashboardView.test.tsx` (full file, 15 tests), 20 runs: **20/20 runs,
  PASS (15) FAIL (0)** every time (exceeds the required 10-run bar).
- `npm test` (full repo suite), 5 runs: **5/5 runs, 12 test files passed, 114/114 tests passed**
  every time.
- `npm run type-check`: clean, no output.
- `git status` before and after: identical — 21 pre-existing modified files (REQ-6/TASK-001-003
  WIP, untouched) + 28 pre-existing untracked files (untouched). `git diff --
  src/test/DashboardView.test.tsx` confirms the only new hunk is the one described above, on top
  of the pre-existing TASK-001 hunks.

## Assumptions
- `DashboardView.tsx`'s current transition/effect behavior (including the real 50ms
  snapshot-capture `setTimeout` and its `active`/cleanup guard) is intentional and correct; the
  defect was entirely in the test's own synchronization logic, not production code. Confirmed via
  read-only inspection and the empty `git diff --stat` for that file, consistent with the task's
  Background note.

## Known limitations
- This fix targets exactly the one test named in the task. A couple of other DASHBOARD-reaching
  tests in the same file use a similarly `pixelize-effect-out`-absence-based wait and were not
  reported as flaky by QA, so they were left unmodified per the task's "all other tests continue
  to pass unmodified" acceptance criterion. The same theoretical ambiguity-window exists there in
  principle; flagged for QA/orchestrator awareness only, not fixed speculatively here.

## Status
Task moved to `implementation-complete`. The named flaky test's stability is verified well beyond
the required bar (20 consecutive full-file runs vs. the required 10; 5/5 full-suite runs as
required; clean type-check). QA evidence is left for `qa-engineer`.
