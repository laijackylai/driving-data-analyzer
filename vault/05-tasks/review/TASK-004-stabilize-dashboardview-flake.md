---
doc_type: task
task_id: TASK-004
title: Stabilize flaky DashboardView return-to-LANDING test
status: approved
owner: frontend-developer
reviewer: qa-engineer
priority: P2
dependencies: []
created: 2026-07-23
updated: 2026-07-23
related: [TASK-001, TASK-003]
---

# TASK-004: Stabilize flaky DashboardView return-to-LANDING test

## Objective
`src/test/DashboardView.test.tsx`'s `"DashboardView state machine > returns to LANDING when home
button is clicked from DASHBOARD"` test passes reliably on every run (no intermittent failures),
without weakening what it verifies, so repo-wide `npm test` can become a trustworthy release gate.

## Background
- Requirement: none specific — this is a test-stability/QA-housekeeping fix, not tied to a REQ.
  It surfaced as a shared, independently-confirmed side-finding during QA verification of
  TASK-001, TASK-002, and TASK-003 (all now `approved`; see their QA evidence sections).
- QA's characterization (2026-07-23, qa-engineer, reported via TASK-001/003 QA evidence,
  independently confirmed by orchestrator before opening this task): across 7 test-run
  invocations during that QA session (5 full-suite + 2 isolated-file runs), this single test
  failed 2 times (~29%), always with the identical error:
  `TestingLibraryElementError: Unable to find an element by: [data-testid="landing-view"]` inside
  a `vi.waitFor` poll. The test body (`src/test/DashboardView.test.tsx`, approximately lines
  230-259) drives a `userEvent` click, a `vi.waitFor` poll for the dashboard state, a second click
  on a "return to landing" button, then a second `vi.waitFor` poll for `landing-view` to
  reappear — relying on real timers and a `PixelizeEffect` mock's `setTimeout(onComplete, 0)`.
  This is a classic async-timing race between the mocked effect's real-timer callback and
  Testing Library's `vi.waitFor` polling, not a logic bug.
- Confirmed independently unrelated to TASK-001/002/003 or the in-progress REQ-6/COBB work:
  `git diff --stat -- src/components/features/DashboardView.tsx` shows zero uncommitted changes
  (the production component under test is untouched), and none of the three tasks' diffs touch
  the flaky test's body. QA recommended exactly one follow-up task for this (not duplicated
  across TASK-001/002/003) — this is that task.

## Context manifest
- **Required files**: `src/test/DashboardView.test.tsx` (the full state-machine describe block,
  and specifically the `"returns to LANDING when home button is clicked from DASHBOARD"` test,
  ~lines 230-259), `src/components/features/DashboardView.tsx` (read-only reference — understand
  the real `PixelizeEffect`/transition mechanism the test is racing against).
- **Optional reference files**: any `PixelizeEffect` mock setup elsewhere in the test file or a
  shared test-setup file, if one exists; other passing tests in the same describe block, for
  the established fake-timer/act pattern already used elsewhere in this suite (see TASK-003's
  `DotLoader.test.tsx` fix, which used `vi.useFakeTimers()` + `vi.advanceTimersByTime()` +
  `act(...)` successfully for a similar interval/timer race).
- **Explicitly excluded areas**: `src/components/features/DashboardView.tsx` — read-only; it has
  zero uncommitted changes and is confirmed not the source of the flake. Do not modify it or any
  other production component. Do not touch `src/test/categoryIcon.test.tsx`,
  `src/test/cobbAnalyzer.test.ts`, or `src/test/DotLoader.test.tsx` (TASK-001/002/003, already
  `approved`).
- **Expected outputs**: a corrected, deterministic version of the one flaky test in
  `src/test/DashboardView.test.tsx`. No new files expected.
- **Maximum write scope**: `src/test/DashboardView.test.tsx` only.

## In scope
- Stabilize `"returns to LANDING when home button is clicked from DASHBOARD"` so it no longer
  races real timers. Preferred approach (per QA's recommendation): convert the test to
  `vi.useFakeTimers()` and explicitly `vi.advanceTimersByTime(...)` past the `PixelizeEffect`
  mock's `setTimeout(onComplete, 0)` before asserting on `landing-view`, wrapping timer advances
  in `act(...)` as needed — mirroring the pattern already used successfully in
  `src/test/DotLoader.test.tsx` (TASK-003). An equivalent fix (e.g. restructuring the `vi.waitFor`
  assertion, or awaiting on a more reliable signal) is acceptable if it achieves the same
  determinism; use your judgment, but the mechanism must not still depend on a real-timer race.
- Preserve the test's original intent: verifying that clicking the home/return button from
  DASHBOARD state genuinely transitions the UI back to the LANDING view.
- Verify no regression to the rest of `DashboardView.test.tsx`'s state-machine tests.

## Out of scope
- Any change to `DashboardView.tsx` or any other production component.
- Any other test file.
- Any new feature work.

## Acceptance criteria
- [ ] `"returns to LANDING when home button is clicked from DASHBOARD"` (rename if the mechanism
      changes what it asserts) passes on at least 10 consecutive isolated runs
      (`npx vitest run src/test/DashboardView.test.tsx`, repeated) with zero failures.
- [ ] The fix does not rely on real-timer races (`vi.useFakeTimers()` or an equivalent
      deterministic mechanism is used for the `PixelizeEffect` transition).
- [ ] All other tests in `src/test/DashboardView.test.tsx` continue to pass unmodified.
- [ ] `npm test` (full suite) run at least 5 times shows this test passing every time.
- [ ] `npm run type-check` still clean.
- [ ] No file outside `src/test/DashboardView.test.tsx` was modified (`git status` before/after).

## Interfaces / contracts
None changed — `DashboardView.tsx`'s real transition behavior (via `PixelizeEffect`) is the
contract; the test must observe it deterministically rather than racing it.

## Write scope
`src/test/DashboardView.test.tsx` only.

## Test requirements
Run `npx vitest run src/test/DashboardView.test.tsx` repeated at least 10 times, plus full
`npm test` repeated at least 5 times, plus `npm run type-check`; paste actual output into
Implementation evidence.

## Security considerations
None identified — test-file-only change, no user input handling, no secrets involved.

## Assumptions
- `DashboardView.tsx`'s current transition/effect behavior is correct and unrelated to this
  flake; only the test's synchronization with it needs to change. If inspection reveals the
  component itself has a genuine bug (not just a test racing a real timer), stop and escalate
  rather than papering over it with a test that tolerates broken behavior.
- QA's root-cause characterization (real-timer race between `vi.waitFor` polling and the
  `PixelizeEffect` mock's `setTimeout(onComplete, 0)`) is accurate, per independent confirmation
  across two separate QA verification passes (TASK-001 and TASK-003 QA evidence, same finding).

## Blockers
- none

## Implementation evidence

**Changed file**: `src/test/DashboardView.test.tsx` only (write-scope compliant — see `git status`
diff below).

**Root cause (revised from the task's working assumption)**: initial investigation followed the
task's stated preferred mechanism — the `PixelizeEffect` mock's `setTimeout(onComplete, 0)` fired
from the mock's render body. I first replaced it with a `useEffect`-based, timer-free completion
signal (deterministic, tied to `targetSnapshotUrl`). Running the isolated test 15x under that
change showed the failure became *more* frequent and fully deterministic-looking (~every run,
DOM ending up completely empty), which proved that mechanism was not the real (or at least not
the only) source of the race, so I reverted the mock to its original `setTimeout(onComplete, 0)`
form and instrumented the test directly (temporary `console.log(document.body.innerHTML)` calls,
removed before finalizing) to see the actual DOM at each step. That revealed the true bug: the
test's first `vi.waitFor` after the initial upload click only asserted that `"landing-view"` and
`"pixelize-effect-out"` were **absent** — a condition that is trivially true both (a) once
DASHBOARD is genuinely reached, and (b) the entire time `viewState` is still `"analyzing"` with
the dashboard snapshot not yet captured (still rendering `"pixelize-effect-in"`, not `"-out"`).
The waitFor could therefore resolve prematurely, before `viewState` had actually reached
`"dashboard"`, at which point the production `DashboardView`'s real 50ms snapshot-capture
`setTimeout` (in its own `useEffect`, unrelated to the `PixelizeEffect` mock) was still in flight.
The test would then click the home button while that real timer was still pending, and its
eventual (possibly-late) resolution could interleave with the DASHBOARD → LANDING transition,
occasionally leaving the DOM in an inconsistent state instead of showing `"landing-view"`.

**Fix applied**: changed the first `vi.waitFor` in the
`"returns to LANDING when home button is clicked from DASHBOARD"` test to additionally assert
`queryByTestId("dot-loader")` is absent (instead of relying on `"pixelize-effect-out"` absence).
`dot-loader` is rendered exclusively inside DashboardView's `viewState === "analyzing"` branch, so
its absence is an unambiguous signal that `viewState` has genuinely left `"analyzing"` and
reached `"dashboard"` — the identical combination (`dot-loader` + `landing-view` absence) already
used successfully by the passing `"clicking a tab button in DASHBOARD calls scrollToSection"`
test in the same file. No fake timers were needed; the `PixelizeEffect` mock itself was left
unchanged (its original `setTimeout(onComplete, 0)` mechanism was not, in the end, the source of
the flake — confirmed empirically above). The test still genuinely asserts the DASHBOARD →
LANDING transition via the home button; only the *precondition* wait (confirming DASHBOARD was
actually reached before clicking home) was tightened. No rename needed since what the test
verifies is unchanged.

**Commands run and results** (all from `"/Users/laijackylai/Documents/claude/driving data
analyzer"`):

- `npx vitest run src/test/DashboardView.test.tsx -t "returns to LANDING when home button"` — run
  15 times isolated (single test only): **15/15 passed** (before the fix, this same isolated
  invocation reproduced the failure 100% of the time, ~1850ms duration each time, empty DOM at
  failure — confirming the fix addresses the actual defect, not just reduces its probability).
- `npx vitest run src/test/DashboardView.test.tsx` (full file, 15 tests) — run 20 times: **20/20
  runs, PASS (15) FAIL (0) every time** (exceeds the 10-run bar in the task's acceptance
  criteria and test requirements).
- `npm test` (full repo suite) — run 5 times: **5/5 runs, 12 test files passed, 114/114 tests
  passed every time** (exceeds the 5-run bar).
- `npm run type-check` — clean, no output (no type errors).
- `git status` before starting: 21 modified files (pre-existing REQ-6/TASK-001/002/003 WIP,
  untouched by me) + 28 untracked files (pre-existing, untouched). `git status` after finishing:
  identical file list — same 21 modified files, same 28 untracked files; `src/test/
  DashboardView.test.tsx` was already among the 21 (carrying TASK-001's mock-fixture-extension
  diff, per the handoff note) both before and after — I only added to its existing diff, per
  `git diff -- src/test/DashboardView.test.tsx`, which shows exactly: the pre-existing TASK-001
  hunks (lines ~68, ~115-123, `totalDistance` type widening and added `derived` fixture fields,
  untouched by me) plus my one new hunk (the `"returns to LANDING when home button..."` test's
  comment + first `vi.waitFor` assertion swap from `pixelize-effect-out` to `dot-loader`). No
  file outside `src/test/DashboardView.test.tsx` was modified.

**Assumptions**: per the task's own Assumptions section, if inspection had revealed a genuine bug
in `DashboardView.tsx` itself I was to stop and escalate rather than paper over it. That did not
happen here — `DashboardView.tsx`'s actual runtime behavior is correct; the 50ms real-timer
snapshot capture is an intentional (if test-unfriendly) design already guarded by its own
`active`/cleanup pattern. The defect was entirely in the test's own synchronization logic (an
ambiguous wait condition), not in production code. `DashboardView.tsx` was read-only throughout
and has zero uncommitted changes (confirmed via `git diff --stat -- src/components/features/
DashboardView.tsx` returning empty), consistent with the task's own background note.

**Known limitations**: this fix targets exactly the one flaky test named in the task. The other
DASHBOARD-reaching tests in the same file (e.g. "transitions to DASHBOARD on successful
analysis") use a similar `pixelize-effect-out`-absence-only wait and were not reported as flaky
by QA and were out of this task's scope, so they were left unmodified per "All other tests in
`src/test/DashboardView.test.tsx` continue to pass unmodified" — but the same theoretical
ambiguity-window exists there in principle; QA/orchestrator may want to note this as a possible
future low-priority hardening if it's ever observed to flake (out of scope to fix speculatively
here).

## QA evidence
**Independent verification performed 2026-07-23 by qa-engineer.** The developer's revised root
cause (diverging from the task's original working assumption about the `PixelizeEffect`-mock
timer) was not trusted at face value; the state machine, the mock, and the exact diff were traced
by hand before accepting the diagnosis.

**Root-cause verdict: CONFIRMED (and the ambiguity is even more direct than described).**
- Read `DashboardView.tsx` in full. `dot-loader` (line 491-495) is gated by
  `viewState === "analyzing" && showDotLoader`. `showDotLoader` starts `true` (line 343) and is
  only ever set `false` by `handleBeforeDashboardReveal`, which is wired to `PixelizeEffect`'s
  `onBeforeComplete` prop (line 487).
- Read the test file's `PixelizeEffect` mock (lines 39-53): it destructures only
  `{ targetSnapshotUrl, onComplete }` — `onBeforeComplete` is never referenced or invoked by the
  mock. So in this test suite's mocked environment, `showDotLoader` never flips to `false` during
  "analyzing"; `dot-loader`'s presence/absence is therefore governed purely by
  `viewState === "analyzing"` vs. not — an unambiguous DASHBOARD-reached signal in this specific
  test context, exactly as claimed. Cross-checked the same `dot-loader` + `landing-view` absence
  combination in the adjacent, already-passing `"clicking a tab button in DASHBOARD calls
  scrollToSection"` test (lines 287-290) — identical pattern, confirming it wasn't invented for
  this fix.
- Verified the *old* condition's ambiguity is not merely theoretical but near-immediate:
  `PixelizeEffect` (rendered unconditionally the instant `viewState` becomes `"analyzing"`, line
  481-489) renders `pixelize-effect-in` (not `"-out"`) until `dashboardSnapshotUrl` is set, which
  requires the production 50ms capture `setTimeout` (line 455-470) to fire *after* `hasAllData`
  becomes true. Meanwhile `landing-view` unmounts synchronously the instant `viewState` leaves
  `"landing"`, i.e. immediately on the upload click, before `analyzeFile`'s fetch even resolves.
  So the old condition (`landing-view` absent AND `pixelize-effect-out` absent) was satisfiable
  essentially immediately after the upload click — well before the mocked fetch resolves, let
  alone before the dashboard is genuinely reached — meaning the original `vi.waitFor` provided
  close to zero real synchronization value. This independently confirms (and strengthens) the
  developer's diagnosis: the flake was a genuine test-precondition bug, not a coincidental rare
  timing overlap.
- The fix does not weaken the test: the final assertion (`vi.waitFor` for `landing-view` to
  reappear after the home-button click, lines 268-270) is untouched — the test still genuinely
  exercises and asserts the real DASHBOARD → LANDING transition. Only the *precondition* wait
  (confirming DASHBOARD was actually reached before clicking home) was tightened.

**Write-scope compliance:**
- `git diff -- src/test/DashboardView.test.tsx`: 21 insertions/3 deletions total — confirmed the
  pre-existing TASK-001 hunks (lines ~68, ~115-123: `totalDistance` type widening, 6 added
  `derived` fixture fields) are untouched, and the only new hunk is the explanatory comment plus
  the `pixelize-effect-out` → `dot-loader` assertion swap inside the one named test. No other
  test body was touched.
- `git diff --stat -- src/components/features/DashboardView.tsx src/components/features/
  PixelizeEffect.tsx`: both empty — confirms neither production file was modified.
- `git status --short`: identical tracked-file list to the one recorded during TASK-001/002/003
  QA verification (same 20 modified files, no new ones) — confirms no file outside
  `src/test/DashboardView.test.tsx` was touched by this task.
- The two new vault files (`vault/05-tasks/review/TASK-004-stabilize-dashboardview-flake.md`,
  `vault/06-implementation/TASK-004-implementation.md`) are the only vault additions attributable
  to this task (vault/ is untracked as a whole in git, consistent with prior sessions).

**Commands run (verbatim):**
- `npm run type-check` → clean, `tsc --noEmit`, zero errors.
- `npx vitest run src/test/DashboardView.test.tsx` (full file, 15 tests), run **13 times
  consecutively** (exceeds the required ≥10): **13/13 runs → `PASS (15) FAIL (0)`**, zero
  failures observed. (Previously, before this fix, TASK-001/003's QA characterization found this
  same file's flaky test failing in ~29% of runs — i.e. roughly 1 failure per 3-4 runs. Seeing 13
  consecutive clean runs here, where a pre-fix baseline would statistically be expected to show
  2-4 failures, is strong evidence the fix is effective, not merely lucky.)
- `npm test` (full repo suite), run **5 times** (exceeds the required ≥3): **5/5 runs → `Test
  Files 12 passed (12)`, `Tests 114 passed (114)`** every time. Zero failures across all 5 runs.

**Acceptance criteria (independently verified):**
| # | Criterion | Verdict |
|---|-----------|---------|
| 1 | Named test passes on ≥10 consecutive isolated runs | PASS — 13/13 clean (isolated full-file runs) |
| 2 | Fix does not rely on real-timer races | PASS — verified the fix uses a deterministic DOM-state signal (`dot-loader` absence, gated by `viewState`), not a timer; independently confirmed this signal is unambiguous in the test's mocked environment |
| 3 | All other tests in the file continue to pass unmodified | PASS — diff confirms no other test body touched; all 15 tests in the file passed in every one of the 13 isolated runs |
| 4 | `npm test` (full suite) run ≥5 times shows this test passing every time | PASS — 5/5 full-suite runs, 114/114 every time |
| 5 | `npm run type-check` still clean | PASS |
| 6 | No file outside `src/test/DashboardView.test.tsx` modified | PASS — `git diff --stat`/`git status` confirm `DashboardView.tsx` and `PixelizeEffect.tsx` are untouched, and the tracked-file modification list is unchanged from the prior QA session's baseline |

**Overall verdict: PASS (recommend approve).** All six acceptance criteria independently
confirmed with no caveats. The revised root-cause diagnosis (departing from the task's original
working assumption about the `PixelizeEffect` mock timer) was independently re-derived from
source and confirmed correct — in fact the ambiguity in the old wait condition is more immediate
and severe than the developer's writeup describes, which further supports that this is a genuine
fix rather than a coincidental stabilization. Recommend closing the traceability-matrix row for
this flake as fixed, attributed to TASK-004.

## Approval history
| Date | Decision | By | Notes |
|------|----------|----|-------|
| 2026-07-23 | created (draft) | orchestrator | via scripts/create-task.py |
| 2026-07-23 | draft → ready | orchestrator | Root cause and write scope already established via QA's independent, repeated characterization during TASK-001/003 verification (production component confirmed untouched); no new diagnosis needed before starting. |
| 2026-07-23 | ready → active → implementation-complete | frontend-developer | Investigated, revised the root-cause diagnosis after empirical testing disproved the task's working assumption about the `PixelizeEffect` mock timer, fixed the actual defect (ambiguous `vi.waitFor` precondition), and verified stability: 15/15 isolated runs, 20/20 full-file runs, 5/5 full-suite runs, clean type-check. See Implementation evidence. |
| 2026-07-23 | implementation-complete → qa-review → approved | qa-engineer / orchestrator | Independent QA PASS: root cause confirmed by tracing DashboardView state machine; 13/13 full-file runs + 5/5 full suites green; write scope clean. Advanced to approved per QA evidence (see QA evidence section and vault/07-qa/reports/TASK-004-qa-report.md). |

## Handoff notes
### Handoff: TASK-004 — orchestrator → frontend-developer

1. **Task and objective**: stabilize the one intermittently-flaky test in
   `src/test/DashboardView.test.tsx` (`"returns to LANDING when home button is clicked from
   DASHBOARD"`) so `npm test` can become a trustworthy repo-wide release gate.
2. **Inputs reviewed**: TASK-001, TASK-002, and TASK-003's QA evidence sections (all three
   independently characterized this same flake and confirmed it is unrelated to their own
   work), `vault/CURRENT_STATE.md`, this task file.
3. **Work completed**: opened this task consolidating QA's repeated recommendation (made
   identically in TASK-001 and TASK-003's QA evidence) into a single follow-up rather than
   duplicating it three times.
4. **Files created or changed**: this task file.
5. **Decisions made**: scoped as a standalone P2 test-stability task rather than folding into
   TASK-001/003 (both already `approved`) or blocking their approval on it — QA and the
   orchestrator both independently confirmed the flake is pre-existing and unrelated to all
   three reviewed tasks' write scopes.
6. **Assumptions**: see Assumptions above.
7. **Evidence and commands run**: none run directly by the orchestrator for this task; relying on
   QA's already-independently-verified characterization (2 of 7 runs failing, identical error,
   `DashboardView.tsx` production diff empty) recorded in TASK-001 and TASK-003's QA evidence
   sections.
8. **Test results**: not yet attempted for this task specifically; see Background for the
   flake's observed failure rate (~29%, 2/7 runs) during prior QA sessions.
9. **Known limitations**: none yet — task not started.
10. **Remaining risks**: if the real root cause turns out to be in `DashboardView.tsx` itself
    rather than purely a test-synchronization issue, this task's write scope (test file only)
    would not be sufficient — escalate per the Assumptions section rather than expanding scope
    silently.
11. **Recommended next owner**: `frontend-developer`, then `qa-engineer`.
12. **Required human decisions**: none for this task's own scope. (Separately, whether
    repo-wide `npm test` should be treated as a hard release gate before or after this task
    lands is a human/orchestrator call for release planning, not required to start this task.)

### Handoff: TASK-004 — frontend-developer → qa-engineer

1. **Task and objective**: stabilize the intermittently-flaky
   `"returns to LANDING when home button is clicked from DASHBOARD"` test in
   `src/test/DashboardView.test.tsx` without weakening what it verifies.
2. **Inputs reviewed**: this task file (Context manifest, In/Out of scope, Acceptance criteria),
   `src/test/DashboardView.test.tsx` in full, `src/components/features/DashboardView.tsx`
   (read-only reference), `src/test/DotLoader.test.tsx` (referenced fake-timer pattern from
   TASK-003, ultimately not needed here), `src/hooks/useCountUp.ts` (checked for RAF/timer
   interactions before ruling out a fake-timers approach).
3. **Work completed**: reproduced the flake's likely mechanism, tried the task's preferred
   fake-timer-adjacent approach (converting the `PixelizeEffect` mock's `setTimeout` to a
   `useEffect`), empirically disproved it as the root cause (isolated-run failure rate went from
   ~29%/nonzero to ~100% under that change), reverted it, root-caused the actual defect via
   temporary DOM-dump instrumentation, and applied a one-line assertion fix (see Implementation
   evidence for full detail). Removed all temporary debug instrumentation before finalizing.
4. **Files created or changed**: `src/test/DashboardView.test.tsx` (one test's precondition
   `vi.waitFor` assertion — see diff in Implementation evidence); this task file (Implementation
   evidence, Approval history, Handoff notes, frontmatter `status`/`updated`).
5. **Decisions made**: kept the original `PixelizeEffect` mock mechanism (`setTimeout(onComplete,
   0)`) unchanged rather than the task's stated-preferred `vi.useFakeTimers()`/timer-replacement
   approach, because (a) empirical testing showed it was not the actual root cause and (b) this
   file's DASHBOARD-reached render path exercises `useCountUp`'s real `requestAnimationFrame`/
   `setTimeout` loops (via `AnimatedNumber`), so faking timers globally for this test would have
   entangled unrelated RAF-driven animation state, adding risk for no benefit once the real
   defect (an ambiguous wait condition) was identified and fixed directly. This is exercising the
   task's own allowance for "an equivalent fix... if it achieves the same determinism" combined
   with "use your judgment."
6. **Assumptions**: see Implementation evidence — confirmed no production bug; `DashboardView.tsx`
   was not modified and has zero uncommitted diff, consistent with the task's Background section.
7. **Evidence and commands run**: see Implementation evidence for exact commands and results.
8. **Test results**: isolated flaky-test-only runs 15/15 passed (previously ~100% failing once
   the disproved fix was in place, and per QA's original characterization ~29% failing on the
   original code); full-file runs 20/20 passed (15 tests each); full-suite `npm test` 5/5 runs
   passed (114/114 tests each); `npm run type-check` clean.
9. **Known limitations**: see Implementation evidence — the same theoretical wait-ambiguity
   pattern exists in a couple of other, non-flaky tests in this file; left unmodified as out of
   scope, flagged for QA/orchestrator awareness only.
10. **Remaining risks**: low. The fix is a precondition-tightening change to one test's own
    assertion, verified well beyond the required stability bar (20 consecutive full-file runs vs.
    the required 10; 5 full-suite runs as required). No production code touched.
11. **Recommended next owner**: `qa-engineer` (independent QA verification per this repo's
    approval gates), then orchestrator for `implementation-complete` → `qa-review` → `approved`.
12. **Required human decisions**: none identified for this task's own scope.

### Handoff: TASK-004 — qa-engineer → orchestrator
1. **Task and objective**: independently verify TASK-004's flake fix, including the developer's
   revised (task-assumption-diverging) root-cause diagnosis, without trusting it at face value.
2. **Inputs reviewed**: this task file, `vault/06-implementation/TASK-004-implementation.md`,
   `src/components/features/DashboardView.tsx` (full read: state machine, `showDotLoader`,
   `PixelizeEffect` wiring, 50ms capture `setTimeout`), `src/test/DashboardView.test.tsx` (full
   file, especially the fixed test and the reference `"clicking a tab button"` test), the
   `PixelizeEffect` mock, `git diff`/`git status` output.
3. **Work completed**: traced the state machine and mock by hand to confirm `dot-loader` absence
   is genuinely unambiguous in this test's mocked environment (mock never calls
   `onBeforeComplete`, so `showDotLoader` never flips independently of `viewState`); further
   verified the *old* condition's ambiguity was near-immediate (satisfiable right after the
   upload click, before the mocked fetch even resolves), which is stronger evidence than the
   developer's own writeup claimed; confirmed the final assertion (actual DASHBOARD→LANDING
   transition) was untouched, so the test wasn't weakened; ran 13 consecutive isolated full-file
   runs and 5 full-suite runs, plus type-check; verified write-scope via git diff/status.
4. **Files created or changed**: this task file's QA evidence section, this Handoff notes entry,
   frontmatter `status` and `updated`; `vault/07-qa/reports/TASK-004-qa-report.md` (new);
   `vault/07-qa/traceability-matrix.md` (updated row for this flake).
5. **Decisions made**: verdict PASS with no caveats; recommend closing the traceability-matrix
   flake row as fixed/attributed to TASK-004.
6. **Assumptions**: none beyond what's recorded in QA evidence above.
7. **Evidence and commands run**: see QA evidence section — exact commands and pass counts
   recorded verbatim.
8. **Test results**: 13/13 isolated full-file runs clean (15/15 tests each); 5/5 full-suite runs
   clean (114/114 tests each); type-check clean.
9. **Known limitations**: as the developer already disclosed, a couple of other DASHBOARD-reaching
   tests in this file use a similar `pixelize-effect-out`-absence-only wait and share the same
   theoretical ambiguity window in principle, but were not reported as flaky and are out of this
   task's scope — not fixed speculatively here, per the developer's own note.
10. **Remaining risks**: low — the same class of ambiguous-wait pattern exists elsewhere in this
    file (see Known limitations) but has not been observed to flake; worth a low-priority future
    hardening pass if it ever is.
11. **Recommended next owner**: `orchestrator` (to advance to `approved`/`released`, and to close
    the traceability-matrix flake row as resolved).
12. **Required human decisions**: none — this closes out the flake QA identified during
    TASK-001/003 verification.
