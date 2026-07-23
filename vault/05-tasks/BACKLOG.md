---
doc_type: index
area: backlog
owner: orchestrator
updated: 2026-07-23
---

# Backlog

## Lifecycle
```
draft → ready → active → blocked → implementation-complete → qa-review →
changes-requested → approved → released
```

## Active
| Task | Title | Owner | Status | Priority | Dependencies |
|------|-------|-------|--------|----------|--------------|
_None._

## Blocked
| Task | Title | Owner | Blocked on | Priority |
|------|-------|-------|-----------|----------|
_None._

## In review
| Task | Title | Owner | Reviewer | Priority |
|------|-------|-------|----------|----------|
_None currently in qa-review. TASK-001/002/003 passed QA and moved to Approved below._

## Approved (awaiting release)
| Task | Title | Owner | Reviewer | Priority | Approved date |
|------|-------|-------|----------|----------|----------------|
| [[review/TASK-004-stabilize-dashboardview-flake\|TASK-004]] | Stabilize flaky DashboardView return-to-LANDING test | frontend-developer | qa-engineer | P2 | 2026-07-23 |

TASK-004 (the DashboardView flake QA surfaced during TASK-001/003 verification) was implemented
and QA-verified PASS 2026-07-23: real root cause was an ambiguous `vi.waitFor` precondition, not
the assumed `PixelizeEffect` mock-timer race (empirically disproved); fix asserts `dot-loader`
absence instead. 13/13 full-file runs + 5/5 full suites (114/114) green. Its code change is
committed with the REQ-6 batch; the task awaits explicit human release sign-off only.

**QA housekeeping — resolved 2026-07-23**: qa-engineer wrote formal QA reports
(`vault/07-qa/reports/TASK-00{1,2,3,4}-qa-report.md`) and filled in
`vault/07-qa/traceability-matrix.md`; stale lane wikilinks repaired after each move
(mechanical link fixes, main session on behalf of human). `validate-agent-system.py` passes.

## Completed
| Task | Title | Owner | Completed date |
|------|-------|-------|-----------------|
| [[completed/TASK-001-fix-stale-frontend-tests\|TASK-001]] | Fix stale test expectations from in-progress derived-metrics work (frontend/test layer) | frontend-developer | 2026-07-23 |
| [[completed/TASK-002-fix-cobb-injector-test\|TASK-002]] | Fix stale cobbAnalyzer fuel-cut-event test fixture | backend-developer | 2026-07-23 |
| [[completed/TASK-003-fix-dotloader-test\|TASK-003]] | Fix stale DotLoader test (pre-existing, unrelated to REQ-6) | frontend-developer | 2026-07-23 |

All three QA-verified PASS and `approved` 2026-07-23, then `released` the same day on explicit
human sign-off (bundled with the REQ-6 commit); task files moved to `completed/` per lane
convention. Repo-wide `npm test` is green (114/114, stable across repeated runs incl. TASK-004's
flake fix).

## Future candidates (sequenced by roadmap — need `/research` + `/plan-feature` before tasks)
Sequencing decided 2026-07-23 — see [[../00-product/roadmap]]: REQ-6 → Phase 1, REQ-8 →
Phase 2, engine-health trends → Phase 3, handling dynamics → Phase 4, REQ-7 → Phase 5;
REQ-9/10/11 parked. Do not create task files for these without a `/plan-feature` pass.

| Requirement | Source | Notes |
|---|---|---|
| REQ-7 data-source profile system | `docs/plan/cobb_support.md` | Open questions: auto-detect vs. manual profile selection; whether a DB is warranted |
| REQ-8 local storage (last 10 sessions) | `docs/plan/local_storage.md` | Storage engine (Dexie suggested), client/server render split by plot cost |
| REQ-9 summary-card redesign | `docs/plan/summary_card.md` | Only a one-line note today — needs `/plan-feature` or a UI/UX pass before it's actionable |
| REQ-10 landing-page redesign | `docs/landing-redesign.md`, branch `landing-redesign` | Branch already exists — bring under this task process rather than starting fresh |
| REQ-11 MVP / market-viability strategy | `docs/plan/MVP.md` | Strategic, human-owned — not delegable to research/architecture until direction is given |

Back to [[../HOME|HOME]].
