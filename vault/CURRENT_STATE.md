---
doc_type: state
owner: orchestrator
updated: 2026-07-23
---

# Current State

This file has two parts. The section above the AUTO-GENERATED markers is maintained by hand (or
by the orchestrator/human narratively) and is never touched by tooling. The section between the
markers is rebuilt by `scripts/update-current-state.py` from task frontmatter.

## Manually maintained context

Agent-team operating system adopted 2026-07-23 (see root `CLAUDE.md`). The app itself predates
this: Next.js OBD2/COBB driving-data analyzer, already substantially built (see root `README.md`
and `docs/`). At adoption time the repo had 4 unpushed local commits and significant uncommitted
work-in-progress on derived-metrics/COBB charts (REQ-6) that left 6/114 tests failing —
TASK-001/TASK-002 exist to stabilize that before anything new starts. Several other directions
(local storage, summary-card redesign, landing redesign, MVP strategy) are proposed in
`docs/plan/` but not yet approved — see [[05-tasks/BACKLOG]] "Future candidates" and
[[00-product/requirements]] REQ-7–11. No architecture/ADRs exist yet for this project.

Roadmap approved by human 2026-07-23 — see [[00-product/roadmap]]. Phases: 0 stabilize
(current), 1 finish REQ-6 derived metrics, 2 session storage (REQ-8), 3 engine-health
trends, 4 handling dynamics, 5 profile system (REQ-7). REQ-9/10/11 parked. Goals: engine
health trends + handling dynamics; multi-car later, owner's Subaru first.

Phase 0 (stabilize) completed 2026-07-23: TASK-001/002/003/004 all released on explicit human
sign-off (TASK-004 — the DashboardView flake fix surfaced during QA — signed off later the same
day). Repo-wide `npm test` green and stable (114/114). REQ-6 WIP and the agent-OS vault committed
to `master` the same day; GPS coordinates in `public/examples/example-drive.csv` anonymized
(random unrecorded offset) before commit — original kept locally in `debug/` (untracked).
Phase 1 (finish REQ-6 derived-metrics charts for OBDLink + COBB inputs) kicked off 2026-07-23
via `/plan-feature`.

History note: TASK-001/002/003 were independently QA-verified 2026-07-23 (verdict PASS on each),
advanced through `approved`, and `released` the same day on explicit human sign-off; their source
diffs are committed (REQ-6 batch). QA's verification also surfaced a shared, independently-confirmed
pre-existing flake in `DashboardView.test.tsx` (unrelated to all three tasks), fixed as TASK-004
(also released 2026-07-23). The earlier QA-housekeeping note about stale `active/TASK-00x` wikilinks
was resolved 2026-07-23 — see [[05-tasks/BACKLOG]].

## Auto-generated summary

<!-- BEGIN AUTO-GENERATED: DO NOT EDIT BELOW THIS LINE -->

_Last rebuilt by `scripts/update-current-state.py`. 4 task file(s) found._

### Active (0)
_None._

### Blocked (0)
_None._

### In review (0)
_None._

### Approved / released (4)
| Task | Title | Status | Owner | Reviewer | Priority | Path |
|------|-------|--------|-------|----------|----------|------|
| TASK-001 | Fix stale test expectations from in-progress derived-metrics work (frontend/test layer) | released | frontend-developer | qa-engineer | P1 | `vault/05-tasks/completed/TASK-001-fix-stale-frontend-tests.md` |
| TASK-002 | Fix stale cobbAnalyzer fuel-cut-event test fixture | released | backend-developer | qa-engineer | P1 | `vault/05-tasks/completed/TASK-002-fix-cobb-injector-test.md` |
| TASK-003 | Fix stale DotLoader test (pre-existing, unrelated to REQ-6) | released | frontend-developer | qa-engineer | P2 | `vault/05-tasks/completed/TASK-003-fix-dotloader-test.md` |
| TASK-004 | Stabilize flaky DashboardView return-to-LANDING test | released | frontend-developer | qa-engineer | P2 | `vault/05-tasks/completed/TASK-004-stabilize-dashboardview-flake.md` |

<!-- END AUTO-GENERATED -->

Back to [[HOME]].
