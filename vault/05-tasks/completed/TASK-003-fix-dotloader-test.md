---
doc_type: task
task_id: TASK-003
title: Fix stale DotLoader test (pre-existing, unrelated to REQ-6)
status: released
owner: frontend-developer
reviewer: qa-engineer
priority: P2
dependencies: []
created: 2026-07-23
updated: 2026-07-23
related: []
---

# TASK-003: Fix stale DotLoader test (pre-existing, unrelated to REQ-6)

## Objective
`npm test` passes for `src/test/DotLoader.test.tsx` without changing `DotLoader.tsx`'s actual
behavior — the test currently asserts against an older version of the component that no longer
exists in the codebase.

## Background
- Requirement: [[../../00-product/requirements]] — this is a test-debt fix, not tied to a
  specific REQ; it surfaced while stabilizing TASK-001/TASK-002 (REQ-6) but is confirmed
  **pre-existing and unrelated**: `git diff -- src/components/features/DotLoader.tsx` shows zero
  uncommitted changes (last touched at commit `73351e5`), so this drift predates the current
  in-flight work.
- Root cause (diagnosed by orchestrator, 2026-07-23, by reading both files):
  1. Test `"renders 'Analyzing...' text"` asserts `screen.getByText("Analyzing…")` (the
     literal string "Analyzing…" with a single ellipsis character). The component renders
     `LABELS[labelIndex]` where `LABELS[0] === "Analyzing"` (no ellipsis) as its own `<p>`, and
     renders three separately animated `.` characters in adjacent `<span data-testid="dot">`
     elements — it never renders a literal "Analyzing…" string.
  2. Test `"applies staggered animation delays to dots"` asserts each `[data-testid='dot']`
     element has an inline `animationDelay` style (`0ms`/`150ms`/`300ms`). The component has no
     `animationDelay` style anywhere — dot visibility is driven by React state (`dotCount`,
     incremented every 400ms via `setInterval`) toggling `opacity-100`/`opacity-0` Tailwind
     classes, not a CSS animation-delay stagger.
  Both are the same class of issue as TASK-001/002: the component was rewritten at some point
  and its tests were never updated to match.

## Context manifest
- **Required files**: `src/components/features/DotLoader.tsx` (read-only reference),
  `src/test/DotLoader.test.tsx`.
- **Optional reference files**: none.
- **Explicitly excluded areas**: do not modify `DotLoader.tsx` — its current behavior (cycling
  label text + JS-interval-driven dot opacity) is the intended, committed design; this task
  brings the test in line with it, not the other way around. Do not touch
  `src/test/categoryIcon.test.tsx`, `src/test/DashboardView.test.tsx`, or
  `src/test/cobbAnalyzer.test.ts` (TASK-001/002, already implementation-complete).
- **Expected outputs**: corrected `src/test/DotLoader.test.tsx`.
- **Maximum write scope**: `src/test/DotLoader.test.tsx` only.

## In scope
- Fix `"renders 'Analyzing...' text"` to assert what the component actually renders at initial
  mount — the label text "Analyzing" (no ellipsis) rendered as its own element, distinct from
  the separately rendered dot spans. Preserve the test's original intent (verify the loading
  label is visible) rather than deleting the assertion.
- Fix `"applies staggered animation delays to dots"` to assert the real stagger mechanism: at
  initial render `dotCount` starts at `1`, so `dots[0]` should have the `opacity-100` class and
  `dots[1]`/`dots[2]` should have `opacity-0`. If you want to verify the *staggering* itself
  (not just initial state), you may use `vi.useFakeTimers()` / `vi.advanceTimersByTime(400)` to
  advance and assert the next dot lights up — use your judgment on how much coverage is worth
  adding, but do not leave the test asserting a mechanism (`animationDelay`) that doesn't exist.

## Out of scope
- Any change to `DotLoader.tsx` or any other component.
- Any other test file.

## Acceptance criteria
- [x] `"renders 'Analyzing...' text"` (rename if the assertion changes what it actually checks)
      passes against the real component, verified by reading `DotLoader.tsx` first.
- [x] `"applies staggered animation delays to dots"` (rename if needed) passes against the real
      opacity-class-based mechanism, not a nonexistent `animationDelay` style.
- [x] The other two DotLoader tests (`"renders three dots"`, `"accepts custom className"`)
      continue to pass unmodified.
- [~] `npm test` reports 0 failures repo-wide (this closes out the last of the original 6). — All
      4 DotLoader tests pass reliably in every run. However, repo-wide `npm test` is *not*
      consistently green: an intermittent, pre-existing flake in `src/test/DashboardView.test.tsx`
      (`"returns to LANDING when home button is clicked from DASHBOARD"`, a `vi.waitFor` timing
      race) surfaced in 2 of 3 full-suite runs during this task. That file is out of this task's
      write scope (owned by TASK-001/002) and was not touched. See Blockers below.
- [x] No file outside `src/test/DotLoader.test.tsx` was modified.

## Interfaces / contracts
None — `DotLoader.tsx`'s actual rendered output/behavior is the contract; the test must match it.

## Write scope
`src/test/DotLoader.test.tsx`.

## Test requirements
Run `npm test -- DotLoader` and then the full `npm test`; paste real output into Implementation
evidence.

## Security considerations
None identified — test-file-only change.

## Assumptions
- `DotLoader.tsx`'s current behavior is intentional/correct (it's committed, unrelated to any
  in-flight work) — this task fixes the test to match it. If inspection reveals the component
  itself is actually broken (not just differently designed than the old test expected), stop and
  escalate rather than papering over it with a test that asserts broken behavior.

## Blockers
- none for this task's own scope (both target DotLoader tests fixed and stable).
- **Escalation/FYI for orchestrator**: repo-wide `npm test` is not fully green — an intermittent
  flake in `src/test/DashboardView.test.tsx` (`"returns to LANDING when home button is clicked
  from DASHBOARD"`), failing 2 of 3 full-suite runs performed during this task with
  `TestingLibraryElementError: Unable to find an element by: [data-testid="landing-view"]` inside
  a `vi.waitFor`. This is unrelated to DotLoader, is not one of the original 6 failures this task
  was scoped to fix, and lives in a file outside this task's write scope (owned by TASK-001/002),
  so it was not modified here. Recommend the orchestrator open a follow-up task against
  `DashboardView.test.tsx`'s owner rather than treating TASK-003 as incomplete.

## Implementation evidence
**Changed files**: `src/test/DotLoader.test.tsx` only (no other file touched).

**Confirmation of real component behavior (read before editing)**: `src/components/features/
DotLoader.tsx` renders `LABELS[labelIndex]` (initially `"Analyzing"`, no ellipsis) as its own
`<p>`, and renders three `<span data-testid="dot">.</span>` elements whose visibility is driven by
`dotCount` (state, initialized to `1`, incremented every 400ms via `setInterval`) toggling
`opacity-100`/`opacity-0` Tailwind classes via `cn(...)`. No `animationDelay` style exists anywhere
in the component. `git diff --stat -- src/components/features/DotLoader.tsx` showed zero
uncommitted changes both before and after this task, confirming the component itself was never
touched.

**Changes made to `src/test/DotLoader.test.tsx`**:
1. `"renders 'Analyzing...' text"` → renamed to `"renders the 'Analyzing' label text"`; assertion
   changed from `screen.getByText("Analyzing…")` to `screen.getByText("Analyzing")` (matches
   the real, ellipsis-free label text rendered in its own element, preserving the original intent
   of verifying the loading label is visible).
2. `"applies staggered animation delays to dots"` → renamed to `"applies staggered opacity classes
   to dots as dotCount advances"`; replaced the nonexistent `animationDelay` style assertions with
   assertions against the real `opacity-100`/`opacity-0` class mechanism. Added `vi.useFakeTimers()`
   + `vi.advanceTimersByTime(400)` (wrapped in `act(...)`) to additionally verify the stagger
   actually advances over two 400ms ticks (dot 1 lit → dots 1+2 lit → all 3 lit), not just the
   initial-render state, per the task's optional guidance. `vi.useRealTimers()` restored in a
   `finally` block.
3. `"renders three dots"` and `"accepts custom className"` left unmodified, as required.

**Commands run and exact output**:

`npm test -- DotLoader` (isolated):
```
 Test Files  1 passed (1)
      Tests  4 passed (4)
   Start at  00:19:21
   Duration  1.68s (transform 159ms, setup 120ms, import 229ms, tests 101ms, environment 806ms)
```
Repeated 3 additional times back-to-back (00:26:04, 00:26:07, 00:26:09) — identical
`4 passed (4)` every time, confirming stability of the new/changed tests.

`npm test` (full repo-wide suite), run 1:
```
 ❯ src/test/DashboardView.test.tsx (15 tests | 1 failed) 3542ms
   × returns to LANDING when home button is clicked from DASHBOARD 1656ms
   TestingLibraryElementError: Unable to find an element by: [data-testid="landing-view"]
   ... await vi.waitFor(() => { expect(screen.getByTestId("landing-view")).toBeInTheDocument(); })

 Test Files  1 failed | 11 passed (12)
      Tests  1 failed | 113 passed (114)
```
`npm test`, run 2 (immediately after, no code changes in between):
```
 Test Files  12 passed (12)
      Tests  114 passed (114)
```
`npm test`, run 3:
```
 Test Files  1 failed | 11 passed (12)
      Tests  1 failed | 113 passed (114)
   (same DashboardView `returns to LANDING when home button is clicked from DASHBOARD` failure)
```
All 4 DotLoader tests passed in every one of these full-suite runs and every isolated run
(counted within the 113/114 passing totals). The only failure observed, and only intermittently
(1 of 3 runs), was `DashboardView.test.tsx > returns to LANDING when home button is clicked from
DASHBOARD` — a `vi.waitFor` timing race in a file this task is explicitly forbidden from touching
(`src/test/DashboardView.test.tsx`, owned by TASK-001, which already has its own uncommitted
diff). This is a pre-existing flaky test unrelated to DotLoader, not one of the original 6
failures this task set out to fix, and outside this task's write scope — flagged below rather than
worked around.

**Assumptions**: `DotLoader.tsx`'s current behavior (cycling label text, JS-interval-driven dot
opacity via `dotCount`) is intentional/correct, per the task's stated assumption; nothing in the
component looked broken, so the test was fixed to match it rather than escalating.

**Known limitations**: The added fake-timer assertions only exercise two 400ms ticks (dotCount
1→2→3); they do not cover the wrap-around back to 1 or the separate 1000ms label-cycling interval,
since the task's acceptance criteria only required fixing the two broken assertions, not full
coverage of every interval in the component.

**Out-of-scope finding (not fixed by this task, flagged for visibility)**: `src/test/
DashboardView.test.tsx`'s `"returns to LANDING when home button is clicked from DASHBOARD"` test
is intermittently flaky (failed 2 of 6 total `npm test` invocations run during this task,
including one after this task's changes were already in place and stable). This is unrelated to
DotLoader and outside this task's write scope (`src/test/DashboardView.test.tsx` belongs to
TASK-001/002), so it was not modified — noting it here only so the orchestrator/QA is aware it may
surface on a future `npm test` run.

## QA evidence
**Independent verification performed 2026-07-23 by qa-engineer.** Implementation evidence was not
trusted; the component and test were re-read and re-run directly.

**Diagnosis re-verification:** Read `src/components/features/DotLoader.tsx` in full. Confirmed:
- `LABELS[0] === "Analyzing"` (no ellipsis), rendered as its own `<p>` element, initial
  `labelIndex` state is `0`.
- Three `<span data-testid="dot">.</span>` elements toggle `opacity-100`/`opacity-0` Tailwind
  classes via `cn(...)` based on `dotCount` state (initialized to `1`, incremented `(n % 3) + 1`
  every 400ms via `setInterval`).
- No `animationDelay` inline style exists anywhere in the component.

Compared against `src/test/DotLoader.test.tsx`: `"renders the 'Analyzing' label text"` now asserts
`screen.getByText("Analyzing")` (matches, no ellipsis) — correct.
`"applies staggered opacity classes to dots as dotCount advances"` asserts initial state
(`dots[0]` = `opacity-100`, `dots[1]`/`dots[2]` = `opacity-0`, matching `dotCount` initialized to
`1`), then uses `vi.useFakeTimers()` + `vi.advanceTimersByTime(400)` twice to verify the stagger
genuinely advances (dot 2 lights at 400ms, dot 3 at 800ms) — matches the component's real
`setInterval(400ms)` mechanism exactly, and restores real timers in a `finally` block. Both
untouched tests (`"renders three dots"`, `"accepts custom className"`) were confirmed unmodified
via diff (below).

**Write-scope compliance:**
- `git diff -- src/test/DotLoader.test.tsx`: 35 insertions/10 deletions, confined to the import
  line (added `vi`, `act`) and the two rewritten test bodies — the other two tests are byte-for-byte
  unchanged in the diff.
- `git diff --stat -- src/components/features/DotLoader.tsx`: empty (no uncommitted changes) —
  confirms the forbidden production file was not touched, and the component's real behavior is
  exactly as read above, unmodified by this task.

**Commands run (verbatim):**
- `npm test -- DotLoader` →
  ```
  Test Files  1 passed (1)
       Tests  4 passed (4)
  ```
- `npm run type-check` (repo-wide, shared with TASK-001/002 verification) → clean, `tsc --noEmit`,
  zero errors.
- Full `npm test`, 5 runs performed during this QA session (shared verification across all three
  tasks):
  - Run 1: `12 passed (12)` / `114 passed (114)`
  - Run 2: `12 passed (12)` / `114 passed (114)`
  - Run 3: `12 passed (12)` / `114 passed (114)`
  - Run 4: `1 failed | 11 passed (12)` / `1 failed | 113 passed (114)` — failure was
    `DashboardView.test.tsx > returns to LANDING when home button is clicked from DASHBOARD`
  - Run 5: `12 passed (12)` / `114 passed (114)`

  All 4 `DotLoader.test.tsx` tests passed in every one of these 5 full-suite runs, and in 4
  additional isolated `npx vitest run` invocations targeting `DashboardView`/`categoryIcon`
  (unrelated to DotLoader but run in the same session) — DotLoader was never implicated in any
  failure.

**Flake characterization (repo-wide, shared finding across TASK-001/002/003):** Across 7 total
test-run invocations during this QA session (5 full-suite + 2 isolated-file runs targeting
`categoryIcon.test.tsx`+`DashboardView.test.tsx`), the single test
`"DashboardView state machine > returns to LANDING when home button is clicked from DASHBOARD"`
failed 2 times (~29%), always with the identical error
(`TestingLibraryElementError: Unable to find an element by: [data-testid="landing-view"]` inside
`vi.waitFor`). Independently confirmed unrelated to DotLoader: `git diff --stat -- src/components/
features/DashboardView.tsx` is empty (production component untouched by any of the three tasks or
REQ-6 WIP); the failing test's body (lines 230-259 of `DashboardView.test.tsx`) uses real timers,
`userEvent`, and a `vi.waitFor` poll around a `PixelizeEffect` mock's `setTimeout(onComplete, 0)` —
a timing race with no relationship to `DotLoader`, `CATEGORY_ORDER`, or `cobbAnalyzer`.
**Recommendation: open a follow-up task against `DashboardView.test.tsx`'s owner (frontend-
developer, per TASK-001) to stabilize this test** (e.g., convert to fake timers or restructure the
`vi.waitFor` assertions) before treating repo-wide `npm test` as a reliable release gate. This
should **not** block approval of TASK-001, TASK-002, or TASK-003, none of which introduced or can
fix this defect within their declared write scopes.

**Acceptance criteria (independently verified):**
| # | Criterion | Verdict |
|---|-----------|---------|
| 1 | `"renders 'Analyzing...' text"` (renamed) passes against real component | PASS — verified component renders "Analyzing" (no ellipsis) as its own element |
| 2 | `"applies staggered animation delays to dots"` (renamed) passes against real opacity-class mechanism | PASS — verified component has no `animationDelay`; test now asserts the real `opacity-100`/`opacity-0` + `dotCount`/`setInterval(400ms)` mechanism, confirmed via fake-timer advancement matching the real interval |
| 3 | Other two DotLoader tests continue to pass unmodified | PASS — diff confirms these two test bodies are unchanged; all 4 tests pass, `4/4` in every run |
| 4 | `npm test` reports 0 failures repo-wide | PARTIAL (as the task itself already disclosed with `[~]`) — DotLoader's own 4 tests are green in every run; the remaining repo-wide instability is the pre-existing, independently-confirmed-unrelated `DashboardView.test.tsx` flake (2/7 runs this session), not attributable to this task |
| 5 | No file outside `src/test/DotLoader.test.tsx` modified | PASS — `DotLoader.tsx` diff is empty |

**Overall verdict: PASS (recommend approve).** All criteria owned by this task are fully met;
criterion 4's repo-wide caveat was already honestly disclosed by the developer (marked `[~]`) and
is independently confirmed here to be a pre-existing, unrelated defect. Recommend the orchestrator
open exactly one follow-up task for the `DashboardView.test.tsx` flake (not three duplicate ones —
this finding is shared across TASK-001/002/003's QA evidence).

## Approval history
| Date | Decision | By | Notes |
|------|----------|----|-------|
| 2026-07-23 | created (draft) | orchestrator | via scripts/create-task.py |
| 2026-07-23 | draft → ready | orchestrator | Root cause diagnosed while reviewing TASK-001's completion report; confirmed pre-existing and unrelated to REQ-6 via git diff |
| 2026-07-23 | qa-review → approved | orchestrator | Verified QA evidence present and complete (independent re-verification of component behavior, write-scope compliance, acceptance-criteria table). Verdict PASS; repo-wide DashboardView.test.tsx flake caveat independently confirmed unrelated (now tracked as TASK-004). Not advanced to released — underlying diffs remain uncommitted and release requires explicit human approval. |
| 2026-07-23 | approved → released | human + orchestrator | Human release sign-off given 2026-07-23 (bundled with REQ-6 work-in-progress commit); underlying diffs committed to master in the same batch. |

## Handoff notes
### Handoff: TASK-003 — orchestrator → frontend-developer
1. **Task and objective**: fix the last 2 of the original 6 failing tests (DotLoader), unrelated
   to REQ-6, discovered as a side-finding while frontend-developer worked TASK-001.
2. **Inputs reviewed**: `DotLoader.tsx`, `DotLoader.test.tsx`, `git diff` confirming
   `DotLoader.tsx` has no uncommitted changes.
3. **Work completed**: root-caused both failures to a component rewrite that predates all
   current in-flight work; wrote this task.
4. **Files created or changed**: this task file.
5. **Decisions made**: separate task rather than folding into TASK-001, since it's a distinct,
   pre-existing, unrelated defect — avoids retroactively expanding a completed task's scope.
6. **Assumptions**: see Assumptions above.
7. **Evidence and commands run**: read of both files; TASK-001's completion report's `npm test`
   output (`Test Files 1 failed | 11 passed`, both failures in `DotLoader.test.tsx`).
8. **Test results**: 2 of the original 6 failures traced here; 4 already fixed by TASK-001/002.
9. **Known limitations**: none.
10. **Remaining risks**: none identified.
11. **Recommended next owner**: `frontend-developer`, then `qa-engineer`.
12. **Required human decisions**: none for this task.

### Handoff: TASK-003 — frontend-developer → qa-engineer (via orchestrator)
1. **Task and objective**: fix the two stale `DotLoader.test.tsx` assertions that no longer match
   `DotLoader.tsx`'s real (unmodified) behavior.
2. **Inputs reviewed**: `DotLoader.tsx` (read in full to confirm real behavior first),
   `DotLoader.test.tsx`, this task file, `git status`/`git diff --stat` before and after.
3. **Work completed**: renamed and rewrote the 2 broken tests to assert the label text without an
   ellipsis and the real `opacity-100`/`opacity-0` class mechanism (with fake-timer coverage of the
   stagger advancing); left the other 2 tests untouched; confirmed `DotLoader.tsx` was never
   modified.
4. **Files created or changed**: `src/test/DotLoader.test.tsx` (only file in write scope,
   confirmed via `git status`); `vault/06-implementation/TASK-003-implementation.md` (new);
   this task file's Implementation evidence / Blockers / status / Handoff notes sections.
5. **Decisions made**: added optional fake-timer stagger coverage (task allowed but didn't
   require this) since it was low-cost and strengthens the fix beyond just matching initial
   render state; did not attempt to fix the unrelated `DashboardView.test.tsx` flake since it's
   outside this task's write scope and belongs to TASK-001/002.
6. **Assumptions**: see "Assumptions" section above — `DotLoader.tsx`'s current behavior is
   intentional/correct.
7. **Evidence and commands run**: `npm test -- DotLoader` x4 (always `4 passed (4)`); `npm test`
   (full suite) x3 (`114 passed (114)` once, `1 failed | 113 passed (114)` twice, same
   `DashboardView.test.tsx` flake each time); `git diff --stat` and `git status` before/after
   confirming only `DotLoader.test.tsx` changed. Full output in Implementation evidence above and
   in `vault/06-implementation/TASK-003-implementation.md`.
8. **Test results**: DotLoader: 4/4 passing, stable across all runs. Repo-wide: 113-114/114
   passing depending on the unrelated `DashboardView` flake (out of scope).
9. **Known limitations**: fake-timer coverage only exercises 2 of the possible `dotCount` ticks;
   the 1000ms label-cycling interval isn't separately tested (not required by acceptance criteria).
10. **Remaining risks**: `DashboardView.test.tsx`'s intermittent flake (unrelated, pre-existing,
    out of scope) may cause `npm test` to occasionally show 1 failure irrespective of this task's
    changes — QA should not attribute that failure to DotLoader/TASK-003.
11. **Recommended next owner**: `qa-engineer` (via orchestrator).
12. **Required human decisions**: whether to open a follow-up task for the `DashboardView.test.tsx`
    flake (recommended, but not this task's call to make).

### Handoff: TASK-003 — qa-engineer → orchestrator
1. **Task and objective**: independently verify TASK-003's DotLoader test fix without trusting
   developer claims, and characterize the repo-wide `DashboardView.test.tsx` flake.
2. **Inputs reviewed**: this task file, `src/components/features/DotLoader.tsx`,
   `src/test/DotLoader.test.tsx`, `src/components/features/DashboardView.tsx`,
   `src/test/DashboardView.test.tsx` (the flaky test's body), `git diff`/`git status` output.
3. **Work completed**: re-read `DotLoader.tsx` to independently confirm its real rendered output
   and mechanism; verified the rewritten test assertions match; verified `DotLoader.tsx` has zero
   uncommitted diff; ran the targeted test and 5 full-suite runs (shared verification session
   across TASK-001/002/003); independently traced and characterized the `DashboardView.test.tsx`
   flake (2 of 7 total runs this session) and confirmed via `git diff` that the production
   component under test is untouched, ruling out any of the three tasks or REQ-6 WIP as the cause.
4. **Files created or changed**: this task file's QA evidence section, this Handoff notes entry,
   frontmatter `status` and `updated`.
5. **Decisions made**: verdict PASS; recommend a single follow-up task for the flake (not
   duplicated across all three task files' recommendations).
6. **Assumptions**: none.
7. **Evidence and commands run**: see QA evidence section — full command output and pass/fail
   counts recorded verbatim, including the flake characterization shared with TASK-001/002.
8. **Test results**: DotLoader's 4 tests pass in every run (isolated and full-suite) performed
   during this QA session; repo-wide flake unrelated to this task fired in 2/7 total runs.
9. **Known limitations**: none for this task's own scope.
10. **Remaining risks**: the `DashboardView.test.tsx` flake remains open and unfixed; recommend a
    follow-up task before relying on `npm test` as a hard release gate.
11. **Recommended next owner**: `orchestrator` (to advance to `approved`/`released` and to decide
    on opening the recommended follow-up task for the flake).
12. **Required human decisions**: whether to open a follow-up task for the
    `DashboardView.test.tsx` flake before release (recommended), and whether release can proceed
    given the flake is confirmed pre-existing/unrelated to all three reviewed tasks.
