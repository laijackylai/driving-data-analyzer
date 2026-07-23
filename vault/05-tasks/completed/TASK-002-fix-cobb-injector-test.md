---
doc_type: task
task_id: TASK-002
title: Fix stale cobbAnalyzer fuel-cut-event test fixture
status: released
owner: backend-developer
reviewer: qa-engineer
priority: P1
dependencies: []
created: 2026-07-23
updated: 2026-07-23
related: [TASK-001]
---

# TASK-002: Fix stale cobbAnalyzer fuel-cut-event test fixture

## Objective
`analyzeCobbInjector`'s "counts fuel cut events" test in `src/test/cobbAnalyzer.test.ts` passes,
and genuinely exercises multi-event counting (not just "any cut happened") — without changing
`src/lib/data/cobbAnalyzer.ts`, which is already correct.

## Background
- Requirement: [[../../00-product/requirements]] (REQ-6)
- Root cause (diagnosed by orchestrator, 2026-07-23): `analyzeCobbInjector` counts fuel-cut
  *events* via rising-edge detection on `fuelCut > 0` (documented in its own code comment: COBB
  logs at ~50Hz, so counting raw samples would inflate the count ~50x vs. real events). The
  test's fixture has exactly **one** contiguous run of `fuelCut > 0` rows
  (`[0, 4, 4]` → one rising edge), so the correct event count for that fixture is `1`. The test
  asserts `2`. This is a stale/incorrect test expectation, not a logic bug.

## Context manifest
- **Required files**: `src/lib/data/cobbAnalyzer.ts` (read-only reference —
  `analyzeCobbInjector`, lines ~130–158), `src/test/cobbAnalyzer.test.ts`
  (`analyzeCobbInjector` describe block, ~line 84–95), `src/test/cobbAnalyzer.test.ts`'s
  `makePoints` helper (to construct a valid fixture).
- **Optional reference files**: none.
- **Explicitly excluded areas**: `src/test/categoryIcon.test.tsx`, `src/test/DashboardView.test.tsx`
  — owned by [[TASK-001-fix-stale-frontend-tests|TASK-001]] (frontend-developer), do not touch. Do not modify
  `src/lib/data/cobbAnalyzer.ts` itself — it is correct as-is.
- **Expected outputs**: corrected test fixture/assertions in `cobbAnalyzer.test.ts` only.
- **Maximum write scope**: `src/test/cobbAnalyzer.test.ts` only.

## In scope
- Fix the `"counts fuel cut events"` test so it genuinely verifies multi-event counting: extend
  the fixture with a second, *non-contiguous* fuel-cut run (a `fuelCut: 0` gap row between two
  cut runs) so `fuelCutEventCount` of `2` is the correct, meaningful expected value — rather than
  just changing the assertion to `1`, which would reduce this test's coverage of the edge-
  detection logic to "did any cut happen." Keep the existing `maxInjDutyCycle` assertion
  consistent with whatever fixture results.

## Out of scope
- Any change to `analyzeCobbInjector` or any other function in `cobbAnalyzer.ts`.
- TASK-001's files.

## Acceptance criteria
- [x] The fixture contains two clearly separate fuel-cut runs (verifiable by inspection: a
      `fuelCut: 0` row between two `fuelCut > 0` runs).
- [x] `expect(result.fuelCutEventCount).toBe(2)` passes against the real implementation.
- [x] `expect(result.maxInjDutyCycle)` (or equivalent) still asserts a real, correct value from
      the updated fixture.
- [x] `npm test` reports this test passing, and no other `cobbAnalyzer.test.ts` test regresses.
- [x] No file outside `src/test/cobbAnalyzer.test.ts` was modified.

## Interfaces / contracts
None changed — `analyzeCobbInjector`'s behavior is the contract; the test must match it.

## Write scope
`src/test/cobbAnalyzer.test.ts`.

## Test requirements
Run `npm test -- cobbAnalyzer` (or full `npm test`) and paste output into Implementation evidence.

## Security considerations
None identified — test-file-only change.

## Assumptions
- The rising-edge event-counting behavior in `analyzeCobbInjector` is intentional (stated in its
  own code comment) and correct; this task fixes the test to match documented intent, not the
  other way around. If a developer disagrees after inspection, stop and escalate rather than
  silently changing production logic outside this task's write scope.

## Blockers
- none

## Implementation evidence
- **Diagnosis confirmed**: Read `analyzeCobbInjector` in `src/lib/data/cobbAnalyzer.ts`
  (lines 130–158) directly before making any change. Confirmed it counts fuel-cut *events* via
  rising-edge detection on `p.fuelCut > 0` (mirrors `analyzeCobbKnock`'s edge-detection pattern),
  with a code comment explaining COBB's ~50Hz logging rate is why raw-sample counting would
  inflate results ~50x. The old fixture `[fuelCut: 0, 4, 4]` contained exactly one contiguous
  run → correct event count was `1`, but the test asserted `2`. `cobbAnalyzer.ts` was not
  modified — the test fixture was stale, not the implementation.
- **Changed files**: `src/test/cobbAnalyzer.test.ts` only (the `analyzeCobbInjector > counts
  fuel cut events` test). No other file touched.
- **Fix applied**: Strengthened the fixture (did not weaken the assertion) by extending it to 5
  points that form two clearly separate, non-contiguous fuel-cut runs:
  1. `{ injDutyCycle: 50, injPulseWidth: 2.0, fuelCut: 0 }` — no cut
  2. `{ injDutyCycle: 0, injPulseWidth: 0, fuelCut: 4 }` — event 1 starts
  3. `{ injDutyCycle: 0, injPulseWidth: 0, fuelCut: 4 }` — event 1 continues (not a new event)
  4. `{ injDutyCycle: 30, injPulseWidth: 1.5, fuelCut: 0 }` — gap row, ends event 1
  5. `{ injDutyCycle: 0, injPulseWidth: 0, fuelCut: 3 }` — event 2 starts

  `fuelCutEventCount` of `2` is now the genuinely correct expected value (2 rising edges), so
  this test again exercises real multi-event edge-detection coverage instead of "did any cut
  happen." `maxInjDutyCycle` remains `50` (still the max of the `injDutyCycle` values in the
  updated fixture: `[50, 0, 0, 30, 0]`), so that assertion is unchanged and still correct.
- **Commands run and output**:
  - `npm test -- cobbAnalyzer` →
    ```
    > driving-data-analyzer@0.1.0 test
    > vitest run cobbAnalyzer

     RUN  v4.1.1 /Users/laijackylai/Documents/claude/driving data analyzer

     Test Files  1 passed (1)
          Tests  9 passed (9)
       Start at  00:12:00
       Duration  2.79s (transform 297ms, setup 199ms, import 255ms, tests 22ms, environment 1.51s)
    ```
  - `npm test -- cobbAnalyzer --reporter=verbose` (to confirm no other test in the file
    regressed) → all 9 tests in `src/test/cobbAnalyzer.test.ts` passed individually:
    `analyzeCobbBoost > calculates avg and max boost`,
    `analyzeCobbBoost > returns null for missing boost data`,
    `analyzeCobbKnock > counts knock EVENTS by edge transition, not sample count`,
    `analyzeCobbKnock > returns 0 knock events with clean data`,
    `analyzeCobbAFR > calculates AFR deviation from target`,
    `analyzeCobbWastegate > calculates avg and max wastegate position`,
    `analyzeCobbInjector > counts fuel cut events` (the fixed test),
    `analyzeCobbAVCS > calculates avg AVCS positions`,
    `analyzeCobbData > returns all 6 metric categories`.
  - `git status --short src/test/cobbAnalyzer.test.ts` before and after: confirmed only
    `src/test/cobbAnalyzer.test.ts` shows as modified within this task's scope; other
    uncommitted changes present in the repo (from concurrent TASK-001 work and other
    in-progress work) were left untouched.
  - `git diff src/test/cobbAnalyzer.test.ts`: 8 insertions, 4 deletions, confined to the
    `analyzeCobbInjector` describe block.
- **Assumptions**: Per the task's own Assumptions section, the rising-edge event-counting
  behavior in `analyzeCobbInjector` is intentional and correct (documented in its own code
  comment); this task fixed the test to match documented/intended behavior rather than altering
  production logic. No disagreement was found on inspection, so no escalation was needed.
- **Known limitations**: None. All acceptance criteria met:
  - Fixture contains two clearly separate fuel-cut runs (verifiable by inspection — a
    `fuelCut: 0` row between two `fuelCut > 0` runs).
  - `expect(result.fuelCutEventCount).toBe(2)` passes against the real, unmodified
    implementation.
  - `expect(result.maxInjDutyCycle).toBe(50)` still asserts a real, correct value for the
    updated fixture.
  - `npm test` reports this test passing; no other test in `cobbAnalyzer.test.ts` regressed
    (9/9 passing).
  - No file outside `src/test/cobbAnalyzer.test.ts` was modified (confirmed via `git status`
    before and after).

## QA evidence
**Independent verification performed 2026-07-23 by qa-engineer.** Implementation evidence was not
trusted; the edge-detection logic and fixture were traced by hand.

**Diagnosis re-verification:** Read `analyzeCobbInjector` in `src/lib/data/cobbAnalyzer.ts` lines
130-158 directly. Confirmed it counts fuel-cut events via rising-edge detection: a counter
increments only on the transition from `inFuelCutEvent === false` to `p.fuelCut > 0`; consecutive
`fuelCut > 0` rows do not re-increment. Traced the updated fixture in
`src/test/cobbAnalyzer.test.ts` lines 88-94 point by point against this logic:
| point | fuelCut | inFuelCutEvent before | edge? | count after |
|---|---|---|---|---|
| 0 | 0 | false | no | 0 |
| 1 | 4 | false→true | **yes** | 1 |
| 2 | 4 | true (stays true) | no | 1 |
| 3 | 0 | true→false | no | 1 |
| 4 | 3 | false→true | **yes** | 2 |

Final `fuelCutEventCount = 2` — matches `expect(result.fuelCutEventCount).toBe(2)` exactly, and
the fixture genuinely contains two non-contiguous runs (not just "any cut happened"), satisfying
the task's stated intent to strengthen rather than weaken test coverage. `maxInjDutyCycle` =
`max([50, 0, 0, 30, 0]) = 50`, matching `expect(result.maxInjDutyCycle).toBe(50)`.

**Write-scope compliance:**
- `git diff -- src/test/cobbAnalyzer.test.ts`: 8 insertions/4 deletions, confined exactly to the
  `analyzeCobbInjector > counts fuel cut events` test body (fixture + comments) — no unrelated
  changes.
- `git diff --stat -- src/lib/data/cobbAnalyzer.ts`: empty (no uncommitted changes) — confirms the
  forbidden production file was not touched, and `analyzeCobbInjector`'s logic is exactly as read
  above, unmodified by this task.

**Commands run (verbatim):**
- `npm test -- cobbAnalyzer` →
  ```
  Test Files  1 passed (1)
       Tests  9 passed (9)
  ```
- `npm run type-check` (repo-wide, shared with TASK-001/003 verification) → clean, `tsc --noEmit`,
  zero errors.
- Full `npm test` (5 runs performed across this QA session, shared with TASK-001/003
  verification): all 5 runs show `cobbAnalyzer.test.ts`'s 9 tests passing every time; the only
  observed instability across all 5 full-suite runs was the unrelated, pre-existing
  `DashboardView.test.tsx` flake (1 of 5 full-suite runs), which never touches this file.

**Acceptance criteria (independently verified):**
| # | Criterion | Verdict |
|---|-----------|---------|
| 1 | Fixture contains two clearly separate fuel-cut runs | PASS — traced by hand, confirmed above |
| 2 | `expect(result.fuelCutEventCount).toBe(2)` passes against real implementation | PASS — traced by hand against unmodified `analyzeCobbInjector`, and confirmed via test run |
| 3 | `maxInjDutyCycle` still asserts a real, correct value | PASS — `50` is the true max of the updated fixture |
| 4 | `npm test` reports this test passing, no other `cobbAnalyzer.test.ts` test regresses | PASS — 9/9 passing, consistent across all runs |
| 5 | No file outside `src/test/cobbAnalyzer.test.ts` modified | PASS — `cobbAnalyzer.ts` diff is empty |

**Overall verdict: PASS (recommend approve).** All acceptance criteria independently confirmed;
production logic untouched; fixture genuinely exercises multi-event edge-detection rather than
merely "any cut happened."

## Approval history
| Date | Decision | By | Notes |
|------|----------|----|-------|
| 2026-07-23 | created (draft) | orchestrator | via scripts/create-task.py |
| 2026-07-23 | draft → ready | orchestrator | Root cause diagnosed, scope and write scope confirmed non-overlapping with TASK-001 |
| 2026-07-23 | qa-review → approved | orchestrator | Verified QA evidence present and complete (independent edge-detection trace, write-scope compliance, acceptance-criteria table). Verdict PASS, no caveats. Not advanced to released — underlying diffs remain uncommitted and release requires explicit human approval. |
| 2026-07-23 | approved → released | human + orchestrator | Human release sign-off given 2026-07-23 (bundled with REQ-6 work-in-progress commit); underlying diffs committed to master in the same batch. |

## Handoff notes
### Handoff: TASK-002 — orchestrator → backend-developer
1. **Task and objective**: fix one stale domain-logic test fixture without touching production code.
2. **Inputs reviewed**: `cobbAnalyzer.ts` (`analyzeCobbInjector`), `cobbAnalyzer.test.ts`.
3. **Work completed**: root-caused the failure to a fixture with only one contiguous event;
   wrote this task.
4. **Files created or changed**: this task file.
5. **Decisions made**: fix by strengthening the fixture to genuinely test 2 events, not by
   weakening the assertion to 1.
6. **Assumptions**: see Assumptions above.
7. **Evidence and commands run**: `npx vitest run` (this test failing: expected 2, got 1),
   direct read of `analyzeCobbInjector`'s edge-detection loop.
8. **Test results**: 1 of the 6 failing tests traced here.
9. **Known limitations**: none.
10. **Remaining risks**: none identified.
11. **Recommended next owner**: `backend-developer`, then `qa-engineer`.
12. **Required human decisions**: none for this task.

### Handoff: TASK-002 — backend-developer → qa-engineer
1. **Task and objective**: fix the stale `analyzeCobbInjector` "counts fuel cut events" test
   fixture in `src/test/cobbAnalyzer.test.ts` without touching `cobbAnalyzer.ts` production logic.
2. **Inputs reviewed**: full task file; `src/lib/data/cobbAnalyzer.ts` (`analyzeCobbInjector`,
   lines 130–158, read directly to confirm rising-edge diagnosis before editing anything);
   `src/test/cobbAnalyzer.test.ts` in full.
3. **Work completed**: confirmed the orchestrator's diagnosis was correct (old fixture had only
   one contiguous fuel-cut run, so `1` was the true expected count, not `2`); strengthened the
   fixture (per task instructions) to genuinely contain two non-contiguous fuel-cut runs instead
   of weakening the assertion to `1`.
4. **Files created or changed**: `src/test/cobbAnalyzer.test.ts` only (the `analyzeCobbInjector`
   describe block, 8 insertions / 4 deletions). No other file modified.
5. **Decisions made**: added a `fuelCut: 0` gap row (`{ injDutyCycle: 30, injPulseWidth: 1.5,
   fuelCut: 0 }`) plus a second cut row (`{ injDutyCycle: 0, injPulseWidth: 0, fuelCut: 3 }`) to
   the existing 3-point fixture, producing 2 genuine rising edges; kept `maxInjDutyCycle`
   assertion at `50` since that remains the true max across the 5-point `injDutyCycle` series.
6. **Assumptions**: `analyzeCobbInjector`'s rising-edge event-counting is intentional/correct
   per its own code comment (matches `analyzeCobbKnock`'s established pattern) — no disagreement
   found on inspection, so production code was left untouched and no escalation was needed.
7. **Evidence and commands run**: `npm test -- cobbAnalyzer` → `Test Files 1 passed (1)`,
   `Tests 9 passed (9)`; `npm test -- cobbAnalyzer --reporter=verbose` → all 9 individual tests
   listed and passing, including `analyzeCobbInjector > counts fuel cut events`; `git status`
   run before and after editing, and `git diff src/test/cobbAnalyzer.test.ts` inspected to
   confirm the change is confined to the intended describe block. Full outputs recorded above in
   Implementation evidence.
8. **Test results**: 9/9 passing in `src/test/cobbAnalyzer.test.ts`; no regressions in the other
   8 tests in that file.
9. **Known limitations**: none for this task's scope. (Note: the wider repo has other
   uncommitted, in-progress changes from concurrent work — e.g. `src/test/DashboardView.test.tsx`,
   `src/test/categoryIcon.test.tsx` — untouched by this task and out of scope for it.)
10. **Remaining risks**: none identified.
11. **Recommended next owner**: `qa-engineer` (via orchestrator).
12. **Required human decisions**: none for this task.

### Handoff: TASK-002 — qa-engineer → orchestrator
1. **Task and objective**: independently verify TASK-002's fixture fix without trusting developer
   claims.
2. **Inputs reviewed**: this task file, `src/lib/data/cobbAnalyzer.ts`
   (`analyzeCobbInjector`), `src/test/cobbAnalyzer.test.ts`, `git diff`/`git status` output.
3. **Work completed**: traced the rising-edge counting logic by hand against the updated fixture
   point-by-point (table recorded in QA evidence above) to independently confirm
   `fuelCutEventCount === 2` and `maxInjDutyCycle === 50`; verified `cobbAnalyzer.ts` has zero
   uncommitted diff; ran the targeted test and repo-wide full suite.
4. **Files created or changed**: this task file's QA evidence section, this Handoff notes entry,
   frontmatter `status` and `updated`.
5. **Decisions made**: verdict PASS — all acceptance criteria independently confirmed with no
   caveats.
6. **Assumptions**: none.
7. **Evidence and commands run**: see QA evidence section.
8. **Test results**: 9/9 passing in `cobbAnalyzer.test.ts`, consistent across all full-suite runs
   performed during this QA session.
9. **Known limitations**: none for this task.
10. **Remaining risks**: none identified.
11. **Recommended next owner**: `orchestrator` (to advance to `approved`/`released`).
12. **Required human decisions**: none for this task.
