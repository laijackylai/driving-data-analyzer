---
doc_type: index
area: home
updated: 2026-07-23
---

# HOME — Driving Data Analyzer

Obsidian vault for this project's agent-team operating system (adopted 2026-07-23 from
`laijackylai/agt_1`). This is a real, already-in-development product — see root `README.md` for
the user-facing product description and root `CLAUDE.md` for the as-built code structure and
developer commands.

## Start here
- [[CURRENT_STATE|Current State]] — what is true right now
- [[00-product/vision|Vision]] · [[00-product/requirements|Requirements]] ·
  [[00-product/success-metrics|Success Metrics]] · [[00-product/assumptions|Assumptions]]
- [[05-tasks/BACKLOG|Task Backlog]]
- [[07-qa/test-strategy|QA Test Strategy]] · [[07-qa/traceability-matrix|Traceability Matrix]]

## Not yet formalized (draft — as-built code is the real source until these are written)
- [[02-architecture/system-design|System Design]] · [[02-architecture/data-model|Data Model]] ·
  [[02-architecture/api-contracts|API Contracts]] ·
  [[02-architecture/non-functional-requirements|NFRs]]
- [[03-ui-ux/user-flows|User Flows]] · [[03-ui-ux/design-system|Design System]] ·
  [[03-ui-ux/accessibility|Accessibility]]
- [[04-decisions/README|Decisions (ADR log)]] — empty; no ADRs yet
- [[08-releases/release-template|Release Template]] · [[08-releases/rollback-template|Rollback
  Template]]
- [[09-retrospectives/retrospective-template|Retrospective Template]]

## Source-of-truth hierarchy
Same as `agt_1`: explicit human decision → approved product requirements → approved ADRs/
architecture → approved contracts → active task spec → implementation notes → research
material. This project's pre-existing `docs/plan/` and `docs/superpowers/plans/` notes are
working material, not canonical — promote anything that should persist into `vault/`. See root
`CLAUDE.md`'s "Agent-team operating system" section for how this interacts with this repo's own
prior conventions.

## Right now
Two parallel tasks are stabilizing in-progress uncommitted work before anything new starts — see
[[05-tasks/BACKLOG]]. Several other directions are proposed but not yet approved (local storage,
summary-card redesign, landing-page redesign, MVP/market-viability strategy) — see
[[00-product/requirements]] REQ-7 through REQ-11.
