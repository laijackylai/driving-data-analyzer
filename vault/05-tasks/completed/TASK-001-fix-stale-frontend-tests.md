---
doc_type: task
task_id: TASK-001
title: Fix stale test expectations from in-progress derived-metrics work (frontend/test layer)
status: released
owner: frontend-developer
reviewer: qa-engineer
priority: P1
dependencies: []
created: 2026-07-23
updated: 2026-07-23
related: [TASK-002]
---

# TASK-001: Fix stale test expectations from in-progress derived-metrics work (frontend/test layer)

## Objective
`npm test` passes with zero failures in `categoryIcon.test.tsx` and `DashboardView.test.tsx`,
without weakening either test's intent — both failures are stale expectations/fixtures left
behind by in-progress work (REQ-6), not bugs in the production code they test.

## Background
- Requirement: [[../../00-product/requirements]] (REQ-6 — in-progress derived-metrics/COBB work)
- Diagnosed by orchestrator on 2026-07-23 (see Assumptions): confirmed both failures are
  test-side staleness, not production regressions.

## Context manifest
- **Required files**: `src/test/categoryIcon.test.tsx`, `src/components/ui/CategoryIcon.tsx`,
  `src/test/DashboardView.test.tsx`, `src/types/index.ts` (`DerivedMetrics` shape),
  `src/lib/data/deriveMetrics.ts` (to see every field `DerivedMetrics` now requires)
- **Optional reference files**: `src/components/features/tabs/EngineTab.tsx` (consumer of
  `derived.thermalDelta`, the field whose absence in the test mock caused the crash)
- **Explicitly excluded areas**: `src/lib/data/cobbAnalyzer.ts` and
  `src/test/cobbAnalyzer.test.ts` — owned by [[TASK-002-fix-cobb-injector-test|TASK-002]] (backend-developer), do not touch.
- **Expected outputs**: two corrected test files; no production code changes expected (if you
  find you need one, stop and record why in Blockers rather than silently expanding scope).
- **Maximum write scope**: `src/test/categoryIcon.test.tsx`, `src/test/DashboardView.test.tsx`
  only.

## In scope
- `categoryIcon.test.tsx`: update `"has 11 categories total"` and
  `"includes all expected categories"` to match the real, current `CATEGORY_ORDER` (19 entries,
  including the 8 `cobb*` categories added for COBB support) — verify the exact list against
  `src/components/ui/CategoryIcon.tsx`, don't hardcode from memory.
- `DashboardView.test.tsx`: extend `makeMockResult()`'s `derived` fixture to include every field
  `DerivedMetrics` now requires (`thermalDelta`, `torqueSplit`, `ratioError`,
  `torqueConverterSlip`, `volumetricEfficiency`, `stftStability`) with type-correct values
  (empty arrays are fine unless a specific test asserts on their contents).

## Out of scope
- Any change to `src/lib/data/deriveMetrics.ts` or other production logic — it is already
  correct (verified: it unconditionally populates every `DerivedMetrics` field).
- `cobbAnalyzer.ts`/`cobbAnalyzer.test.ts` (TASK-002).
- Any new feature work (local storage, summary cards, landing redesign, etc.).

## Acceptance criteria
- [ ] `categoryIcon.test.tsx`'s two assertions match the real `CATEGORY_ORDER` array exactly
      (count and contents), verified by reading the source, not guessed.
- [ ] `DashboardView.test.tsx`'s `makeMockResult()` fixture includes all `DerivedMetrics` fields;
      the EngineTab-crash test case no longer throws.
- [ ] `npm test` reports 0 failures.
- [ ] `npm run type-check` still clean.
- [ ] No file outside the declared write scope was modified (`git status` before/after).

## Interfaces / contracts
`DerivedMetrics` in `src/types/index.ts` is the contract the mock fixture must satisfy;
`CATEGORY_ORDER` in `src/components/ui/CategoryIcon.tsx` is the contract the category test must
assert against. Neither contract changes in this task — only the tests catch up to them.

## Write scope
`src/test/categoryIcon.test.tsx`, `src/test/DashboardView.test.tsx`.

## Test requirements
Run `npm test` and `npm run type-check`; paste actual output into Implementation evidence.

## Security considerations
None identified — test-file-only change, no user input handling, no secrets involved.

## Assumptions
- Confirmed by orchestrator (2026-07-23): `computeDerivedMetrics()` in `deriveMetrics.ts` has a
  single return path and always populates all fields — the `EngineTab` crash is caused solely by
  the test's hand-written mock object predating the new fields, not a real production code path
  that can produce a `DerivedMetrics` object missing them.

## Blockers
- none

## Implementation evidence
**Files changed** (both within declared write scope; no other files touched):
- `src/test/categoryIcon.test.tsx`
- `src/test/DashboardView.test.tsx`

**Diagnosis verification (read before editing, not guessed):**
- Read `src/components/ui/CategoryIcon.tsx` directly. `CATEGORY_ORDER` (lines 322-343) has
  **19** entries exactly:
  `summary, overview, engine, fuel, transmission, power, drivingBehavior, abs, awd, electrical,
  airIntake, cobbEngine, cobbBoost, cobbAFR, cobbPower, cobbKnock, cobbWastegate, cobbInjector,
  cobbAVCS` — confirms the task's stated count (11 original + 8 `cobb*`).
- Read `DerivedMetrics` in `src/types/index.ts` (lines 436-449) and `computeDerivedMetrics()` in
  `src/lib/data/deriveMetrics.ts` (lines 249-264). Confirmed the interface requires 12 fields
  total and `computeDerivedMetrics` has a single return path populating all of them
  unconditionally (no branch can produce a partial object) — matches the task's Assumptions.
  The 6 fields missing from the test mock were: `thermalDelta: ThermalDeltaPoint[]`,
  `torqueSplit: TorqueSplitPoint[]`, `ratioError: RatioErrorPoint[]`,
  `torqueConverterSlip: TorqueConverterSlipPoint[]`, `volumetricEfficiency: OBD2DataPoint[]`,
  `stftStability: TimeSeriesRow[]`. No test in `DashboardView.test.tsx` asserts on the contents
  of any `derived.*` field, so empty arrays (`[]`) are type-correct and sufficient per the task's
  own guidance.

**Changes made:**
1. `categoryIcon.test.tsx`: `"has 11 categories total"` → `"has 19 categories total"`, assertion
   changed from `toBe(11)` to `toBe(19)`; `"includes all expected categories"`'s `expected` array
   extended with the 8 `cobb*` entries in the exact source order above.
2. `DashboardView.test.tsx`: `makeMockResult()`'s `derived` fixture extended with
   `thermalDelta: [], torqueSplit: [], ratioError: [], torqueConverterSlip: [],
   volumetricEfficiency: [], stftStability: []` alongside the pre-existing fields.

**Commands run and actual output:**

`npm run type-check` (clean, no output other than the command echo):
```
> driving-data-analyzer@0.1.0 type-check
> tsc --noEmit
```

`npx vitest run src/test/categoryIcon.test.tsx src/test/DashboardView.test.tsx` (isolated,
repeated twice for stability): both runs → `PASS (25) FAIL (0)`. (One earlier isolated run showed
a single transient failure in the pre-existing, untouched test
`"returns to LANDING when home button is clicked from DASHBOARD"` — a timing-sensitive test using
real timers/`vi.waitFor` that does not touch any `derived.*` field I changed; re-running twice
more reproduced 0 failures both times, indicating pre-existing flakiness unrelated to this fix,
not a regression introduced by it.)

`npm test` (full suite, run three times for stability):
```
 Test Files  1 failed | 11 passed (12)
      Tests  2 failed | 112 passed (114)
```
The 2 failures are both in `src/test/DotLoader.test.tsx` (`"renders 'Analyzing...' text"` and
`"applies staggered animation delays to dots"`) — a file entirely outside this task's write scope
and outside its diagnosed root cause (not related to `CATEGORY_ORDER` or `DerivedMetrics`).
Confirmed via `git diff -- src/components/features/DotLoader.tsx`: this file has **no** uncommitted
changes (last touched in commit `73351e5`), so this failure is a pre-existing defect unconnected
to the in-progress REQ-6/COBB work this task and TASK-002 were scoped to fix. Neither
`categoryIcon.test.tsx` nor `DashboardView.test.tsx` appear in any failure list across three
repeated full-suite runs — both files this task owns are consistently green.

**Assumptions:**
- Per task Assumptions section: `computeDerivedMetrics()` always populates all `DerivedMetrics`
  fields; the mock fixture, not production code, was stale. Verified directly (see above).
- Empty-array values for the 6 new mock fields are acceptable per the task's own guidance, since
  no existing `DashboardView.test.tsx` assertion inspects `derived.*` contents.

**Known limitations / discovery to flag for orchestrator:**
- `npm test` does **not** report 0 failures repo-wide: 2 failures remain in
  `src/test/DotLoader.test.tsx`, a file outside this task's and TASK-002's declared write scopes
  and outside the orchestrator's original 6-failure diagnosis (2 attributed to this task, 4 to
  TASK-002/`cobbAnalyzer`). This task's two *owned* acceptance criteria (the `categoryIcon.test.tsx`
  and `DashboardView.test.tsx` fixes) are fully met and verified; the global "0 failures" bullet
  is blocked only by this unrelated, pre-existing `DotLoader` issue, which is outside my write
  scope (`src/test/categoryIcon.test.tsx`, `src/test/DashboardView.test.tsx` only) and outside
  this task's declared production-code exclusions, so I have not touched it. Recommend the
  orchestrator open a separate task for `DotLoader.tsx`/`DotLoader.test.tsx` if repo-wide green is
  required before release.
- `git status` before and after: confirmed only `src/test/categoryIcon.test.tsx` and
  `src/test/DashboardView.test.tsx` were modified by this work (both files were already showing
  as `M` before I started, being part of the same in-progress uncommitted branch — I only added
  to that existing diff, did not create it). No file outside the declared write scope was touched.

## QA evidence
**Independent verification performed 2026-07-23 by qa-engineer.** Implementation evidence was not
trusted; every claim below was re-derived from source and re-run.

**Diagnosis re-verification:**
- Read `src/components/ui/CategoryIcon.tsx` lines 322-343 directly: `CATEGORY_ORDER` has exactly
  19 entries, in the order:
  `summary, overview, engine, fuel, transmission, power, drivingBehavior, abs, awd, electrical,
  airIntake, cobbEngine, cobbBoost, cobbAFR, cobbPower, cobbKnock, cobbWastegate, cobbInjector,
  cobbAVCS`. Compared byte-for-byte against `src/test/categoryIcon.test.tsx`'s `expected` array
  (lines 21-26) and `toBe(19)` assertion (line 17) — exact match.
- Read `DerivedMetrics` in `src/types/index.ts` lines 436-449: confirmed 12 fields total. Read
  `makeMockResult()`'s `derived` fixture in `src/test/DashboardView.test.tsx` lines 108-123:
  contains all 12 fields (`wheelSpeedDiffs, cvtEffectiveRatio, fuelBySpeedBucket, engineZones,
  awdEngagementEvents, fuelDistanceSeries, thermalDelta, torqueSplit, ratioError,
  torqueConverterSlip, volumetricEfficiency, stftStability`) — exact match to the interface.

**Write-scope compliance:**
- `git diff -- src/test/categoryIcon.test.tsx`: 4 insertions/2 deletions, confined exactly to the
  `"has 19 categories total"` rename/count change and the 8 `cobb*` entries appended to `expected`
  — matches the claimed diagnosis, no unrelated changes.
- `git diff -- src/test/DashboardView.test.tsx`: 7 insertions/1 deletion — the 6 new `derived.*`
  fields plus one incidental `totalDistance: 5 as number | null` type-cast (harmless, same file,
  within declared write scope).
- `git diff --stat -- src/components/ui/CategoryIcon.tsx`: empty (no uncommitted changes) —
  confirms the forbidden production file was not touched.
- `git status --short` shows many other files modified (REQ-6 in-progress work: `deriveMetrics.ts`,
  `types/index.ts`, various `*Tab.tsx` files, etc.) — these are unrelated to this task's write
  scope and not a violation per the task-lead's framing; `deriveMetrics.ts`'s diff is a pure
  112-line addition (no deletions), consistent with being in-progress REQ-6 feature work this task
  correctly left untouched.

**Commands run (verbatim):**
- `npm run type-check` → clean, only the command echo (`tsc --noEmit`), zero errors.
- `npx vitest run src/test/categoryIcon.test.tsx src/test/DashboardView.test.tsx`, run 1 →
  `PASS (24) FAIL (1)` — the failing test was
  `DashboardView state machine returns to LANDING when home button is clicked from DASHBOARD`,
  `TestingLibraryElementError: Unable to find an element by: [data-testid="landing-view"]` inside a
  `vi.waitFor`. Runs 2, 3, 4 (immediately following, no changes in between) → `PASS (25) FAIL (0)`
  each time.
- `npm test` (full suite), run 1 → `Test Files 12 passed (12)`, `Tests 114 passed (114)`. Run 2 →
  `12 passed (12)` / `114 passed (114)`. Run 3 → `12 passed (12)` / `114 passed (114)`. Run 4 →
  `Test Files 1 failed | 11 passed (12)`, `Tests 1 failed | 113 passed (114)` — same
  `"returns to LANDING when home button is clicked from DASHBOARD"` failure, same error signature.
  Run 5 → `12 passed (12)` / `114 passed (114)`.
- Net across all runs (2 isolated-file + 5 full-suite = 7 total): the flake appeared in 2 of 7 runs
  (~29%), always the same single test, always the same error.

**Flake root-cause check (independent):** Read the failing test body
(`src/test/DashboardView.test.tsx` lines 230-259): it drives a `userEvent` click, a `vi.waitFor`
poll for the dashboard state, a second click on a "return to landing" button, then a second
`vi.waitFor` poll for `landing-view` to reappear, relying on real timers and a `PixelizeEffect`
mock's `setTimeout(onComplete, 0)`. This is a classic async-timing race, unrelated to
`CATEGORY_ORDER` or any `derived.*` field. Confirmed `git diff --stat -- src/components/features/
DashboardView.tsx` is empty (the production component under test has zero uncommitted changes),
ruling out this task, TASK-002, TASK-003, or REQ-6 WIP as the cause. This task's own diff to
`DashboardView.test.tsx` (lines 68 and 115-123) is nowhere near the flaky test's body (lines
230-259). **Verdict: pre-existing, unrelated to this task.**

**Acceptance criteria (independently verified):**
| # | Criterion | Verdict |
|---|-----------|---------|
| 1 | `categoryIcon.test.tsx` assertions match real `CATEGORY_ORDER` exactly | PASS — verified byte-for-byte against source |
| 2 | `DashboardView.test.tsx` mock includes all `DerivedMetrics` fields; EngineTab crash gone | PASS — all 12 fields present; both owned files run clean in isolation across repeated runs |
| 3 | `npm test` reports 0 failures | PARTIAL — repo-wide, not guaranteed on every run due to the pre-existing `DashboardView.test.tsx` timing-race flake (2/7 runs observed), which is independently confirmed unrelated to this task (production component untouched, flaky test's body not in this task's diff). Both files this task owns are consistently green whenever the flake does not fire, and the flake never touches `categoryIcon.test.tsx`. |
| 4 | `npm run type-check` clean | PASS |
| 5 | No file outside declared write scope modified | PASS — `git diff --stat` confirms `CategoryIcon.tsx` untouched; only the two declared test files show task-attributable diffs |

**Overall verdict: PASS (recommend approve).** All criteria owned by this task are met; criterion
3's repo-wide caveat is a pre-existing, independently-confirmed-unrelated defect, not a regression
introduced by this task. Recommend a follow-up task be opened against
`DashboardView.test.tsx`'s flaky test (see also TASK-003's QA evidence, same flake characterized
there).

## Approval history
| Date | Decision | By | Notes |
|------|----------|----|-------|
| 2026-07-23 | created (draft) | orchestrator | via scripts/create-task.py |
| 2026-07-23 | draft → ready | orchestrator | Root cause diagnosed, scope and write scope confirmed non-overlapping with TASK-002 |
| 2026-07-23 | qa-review → approved | orchestrator | Verified QA evidence present and complete (independent re-derivation, write-scope compliance, acceptance-criteria table); verdict PASS with documented, independently-confirmed-unrelated DashboardView.test.tsx flake caveat (tracked separately as TASK-004). Not advanced to released — underlying diffs remain uncommitted and release requires explicit human approval. |
| 2026-07-23 | approved → released | human + orchestrator | Human release sign-off given 2026-07-23 (bundled with REQ-6 work-in-progress commit); underlying diffs committed to master in the same batch. |

## Handoff notes
### Handoff: TASK-001 — orchestrator → frontend-developer
1. **Task and objective**: fix two stale frontend test failures without touching production code.
2. **Inputs reviewed**: `npm test` output, `deriveMetrics.ts`, `CategoryIcon.tsx`,
   `DashboardView.test.tsx`, `categoryIcon.test.tsx`.
3. **Work completed**: root-caused both failures to test staleness; wrote this task.
4. **Files created or changed**: this task file.
5. **Decisions made**: scoped as frontend-developer's task since both files are
   component/test-layer; excluded the `cobbAnalyzer` fix (domain logic → TASK-002).
6. **Assumptions**: see Assumptions above.
7. **Evidence and commands run**: `npm run type-check` (clean), `npx vitest run` (6 failures,
   traced per-file).
8. **Test results**: 108 passing / 6 failing before this task; this task should bring 2 of those
   6 to passing.
9. **Known limitations**: does not touch the other 4 failures (TASK-002's scope).
10. **Remaining risks**: none identified.
11. **Recommended next owner**: `frontend-developer`, then `qa-engineer`.
12. **Required human decisions**: none for this task.

### Handoff: TASK-001 — frontend-developer → qa-engineer
1. **Task and objective**: fix stale expectations in `categoryIcon.test.tsx` (wrong
   `CATEGORY_ORDER` count/contents) and `DashboardView.test.tsx` (mock `derived` fixture missing
   6 `DerivedMetrics` fields, crashing `EngineTab`).
2. **Inputs reviewed**: this task file, `src/components/ui/CategoryIcon.tsx`,
   `src/types/index.ts` (`DerivedMetrics`), `src/lib/data/deriveMetrics.ts`
   (`computeDerivedMetrics`), `src/components/features/tabs/EngineTab.tsx`,
   `src/test/categoryIcon.test.tsx`, `src/test/DashboardView.test.tsx`.
3. **Work completed**: updated both test files to match the current, verified source contracts;
   ran full and isolated test suites plus type-check multiple times to confirm stability; see
   Implementation evidence above for full command output.
4. **Files created or changed**: `src/test/categoryIcon.test.tsx`,
   `src/test/DashboardView.test.tsx` (both within declared write scope; no production code
   touched). No other file modified — verified via `git status` before/after.
5. **Decisions made**: used empty arrays (`[]`) for the 6 new `derived.*` mock fields, per the
   task's own guidance, since no test in the file asserts on their contents.
6. **Assumptions**: see Implementation evidence above (mirrors the task's stated Assumptions,
   independently re-verified by reading source).
7. **Evidence and commands run**: `npm run type-check` (clean); `npx vitest run
   src/test/categoryIcon.test.tsx src/test/DashboardView.test.tsx` (repeated — `PASS (25) FAIL
   (0)` both times after one transient/pre-existing flake in an untouched test); `npm test` full
   suite (repeated 3x) — consistently `2 failed | 112 passed (114)`, both failures in
   `src/test/DotLoader.test.tsx`, outside this task's scope. Full output pasted in
   Implementation evidence above.
8. **Test results**: both files this task owns are green across repeated runs. Repo-wide `npm
   test` is not fully green (2 pre-existing failures in `DotLoader.test.tsx`, unrelated to this
   task or TASK-002 — see Known limitations).
9. **Known limitations**: `DotLoader.test.tsx` (2 failures) is unrelated to REQ-6/derived-metrics
   work, outside this task's write scope and diagnosed root cause, and was not touched — file has
   no uncommitted changes (`git diff` clean, last touched at commit `73351e5`), confirming it's a
   separate pre-existing defect, not something introduced by this task or the in-progress COBB
   work. Recommend orchestrator open a separate task if repo-wide 0 failures is required.
10. **Remaining risks**: the one observed transient failure in
    `"returns to LANDING when home button is clicked from DASHBOARD"` (isolated-file run only, not
    reproduced on 2 follow-up runs, and not touched by this task's edits) suggests mild timing
    flakiness in that pre-existing test; not a regression from this change, but worth watching if
    QA sees it recur.
11. **Recommended next owner**: `qa-engineer` (via orchestrator).
12. **Required human decisions**: none for this task's owned scope. Human/orchestrator decision
    needed only on whether the `DotLoader.test.tsx` discovery warrants a new task before release.

### Handoff: TASK-001 — qa-engineer → orchestrator
1. **Task and objective**: independently verify TASK-001's fix without trusting developer claims.
2. **Inputs reviewed**: this task file, `src/components/ui/CategoryIcon.tsx`,
   `src/types/index.ts`, `src/lib/data/deriveMetrics.ts`, `src/test/categoryIcon.test.tsx`,
   `src/test/DashboardView.test.tsx`, `git diff`/`git status` output, `DashboardView.tsx`.
3. **Work completed**: re-derived the diagnosis from source (did not trust implementation
   evidence text), re-ran type-check and targeted/full test suites multiple times, verified
   write-scope compliance via `git diff --stat` on all four production files named in the QA
   assignment, and independently traced the repo-wide flaky test to confirm it is unrelated.
4. **Files created or changed**: this task file's QA evidence section, this Handoff notes entry,
   frontmatter `status` and `updated`.
5. **Decisions made**: verdict PASS with a documented caveat on the repo-wide "0 failures"
   criterion (attributable to a pre-existing, independently-confirmed-unrelated flake, not a
   regression from this task).
6. **Assumptions**: none beyond what's recorded in QA evidence above.
7. **Evidence and commands run**: see QA evidence section — full command output and pass/fail
   counts recorded verbatim.
8. **Test results**: both owned test files pass consistently; the flake (unrelated) surfaced in
   2 of 7 total runs performed during this verification.
9. **Known limitations**: repo-wide `npm test` is not guaranteed green on every run due to the
   flake; this is out of this task's write scope and not something QA can fix.
10. **Remaining risks**: recommend a follow-up task to fix the `DashboardView.test.tsx` timing
    race before it causes false-negative CI signals.
11. **Recommended next owner**: `orchestrator` (to advance to `approved`/`released` and to decide
    on opening a follow-up task for the flake).
12. **Required human decisions**: whether to require the flake fixed before release, and whether
    to open a follow-up task for it now.
