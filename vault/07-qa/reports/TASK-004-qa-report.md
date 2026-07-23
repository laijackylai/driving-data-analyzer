---
doc_type: qa-report
task_id: TASK-004
status: final
author_agent: qa-engineer
verdict: approved
created: 2026-07-23
related: [TASK-001, TASK-003]
---

# QA Report: TASK-004

## Scope
Independent verification of TASK-004's fix to the intermittently-flaky
`"returns to LANDING when home button is clicked from DASHBOARD"` test in
`src/test/DashboardView.test.tsx`, against the task's six acceptance criteria. The developer's
root-cause diagnosis diverged from the task's original working assumption (disproving the
`PixelizeEffect`-mock-timer theory via empirical testing and instead finding an ambiguous
`vi.waitFor` precondition) — this divergence was not trusted at face value and was independently
re-derived from the state machine, the mock, and the exact diff.

## Test results
| Test level | Command | Result | Notes |
|------------|---------|--------|-------|
| Regression (isolated, full file) | `npx vitest run src/test/DashboardView.test.tsx`, 13 consecutive runs | 13/13 → `PASS (15) FAIL (0)` every time | Exceeds required ≥10 runs; pre-fix baseline (per TASK-001/003 QA) was ~29% failure rate, so 13/13 clean is strong evidence of a genuine fix |
| Regression (full suite) | `npm test`, 5 runs | 5/5 → `114 passed (114)` every time | Exceeds required ≥3 runs |
| Type check | `npm run type-check` | PASS (clean `tsc --noEmit`, zero errors) | |
| Write-scope check | `git diff --stat` on `DashboardView.tsx`, `PixelizeEffect.tsx` | both empty | Confirms forbidden production files untouched |

## Acceptance criteria coverage
| Criterion | Test | Result |
|-----------|------|--------|
| Named test passes on ≥10 consecutive isolated runs | 13 consecutive `npx vitest run` full-file invocations | PASS |
| Fix does not rely on real-timer races | Traced `dot-loader`'s gating (`viewState === "analyzing" && showDotLoader`) and confirmed the test's `PixelizeEffect` mock never calls `onBeforeComplete`, so `showDotLoader` never flips independently — `dot-loader` absence is a deterministic DOM-state signal tied to `viewState`, not a timer | PASS |
| All other tests in the file continue to pass unmodified | `git diff` confined to one test's body; all 15 tests passed in every isolated run | PASS |
| `npm test` (full suite) run ≥5 times, this test passes every time | 5/5 full-suite runs, 114/114 tests every time | PASS |
| `npm run type-check` still clean | `npm run type-check` | PASS |
| No file outside `src/test/DashboardView.test.tsx` modified | `git diff --stat`/`git status`, unchanged from prior QA-session baseline | PASS |

## Failures
None.

## Proposed fixes (if any)
None needed for this task. Noting (as the developer already disclosed) that a couple of other
DASHBOARD-reaching tests in the same file share the same theoretical ambiguous-wait pattern in
principle but have not been observed to flake; out of this task's scope, not fixed speculatively.

## Verdict
`approved`

## Root-cause verdict
**CONFIRMED**, and independently found to be more clear-cut than the developer's own writeup
states: the old wait condition (`landing-view` absent AND `pixelize-effect-out` absent) was
satisfiable almost immediately after the upload click — well before the mocked fetch even
resolves — because `landing-view` unmounts the instant `viewState` leaves `"landing"` while
`pixelize-effect-out` never renders until the production 50ms snapshot-capture `setTimeout`
completes. The old `vi.waitFor` therefore provided close to no real synchronization value. The
replacement signal (`dot-loader` absence) is unambiguous specifically because the test's
`PixelizeEffect` mock never invokes the `onBeforeComplete` prop that would otherwise let
`showDotLoader` diverge from `viewState` — verified by reading the mock's destructured props.
This is the same `dot-loader` + `landing-view` combination already used successfully by the
adjacent, non-flaky `"clicking a tab button in DASHBOARD"` test. The test's actual assertion
(the real DASHBOARD → LANDING transition after the home-button click) was not touched or
weakened — only the precondition wait was tightened.

## Handoff
Use [[../../_templates/handoff-template|handoff-template]] — see the task file's Handoff notes
section (qa-engineer → orchestrator) for the full structured handoff.
