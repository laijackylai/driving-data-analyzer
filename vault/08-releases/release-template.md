---
doc_type: release
release_id: RELEASE-XXXX
status: draft
owner: release-engineer
human_approval: false
human_approved_by: null
human_approved_date: null
created: YYYY-MM-DD
tasks: []
related: []
---

# Release Record: RELEASE-XXXX

## Scope
<Which tasks/ADRs are included. Every task listed must have `status: approved` and a QA report.>
- Tasks: [[../05-tasks/BACKLOG]]
- QA reports: [[../07-qa/reports/README]]

## Build verification
| Check | Command | Result |
|-------|---------|--------|
| Build |         |        |
| Lint  |         |        |

## Migration plan
<Migrations included, order, and rollback path — link [[rollback-template|rollback plan]].>

## Configuration & secrets checklist
<Never record secret values. Only whether each required secret/config is present and where it is
managed.>
- [ ] Required environment variables identified (names only)
- [ ] Secrets confirmed present in the target secret store (not copied here)
- [ ] No secrets found in diff/staged files

## Observability checklist
- [ ] Logs/metrics/traces in place for new/changed behavior
- [ ] Alerts updated if needed

## Backup status
<Confirm backups exist/are current for anything this release could damage.>

## Smoke test plan / results
| Check | Result |
|-------|--------|

## Known risks
<Anything not fully mitigated, carried into the release consciously.>

## Human approval
`human_approval: false` until a human explicitly approves. This field is **recorded**, not
granted, by the release engineer.

| Date | Approved by | Decision | Notes |
|------|-------------|----------|-------|

## Handoff
Use [[../_templates/handoff-template]].
