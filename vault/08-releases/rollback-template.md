---
doc_type: rollback
release_id: RELEASE-XXXX
status: draft
owner: release-engineer
created: YYYY-MM-DD
related: []
---

# Rollback Procedure: RELEASE-XXXX

## Trigger conditions
<Concrete signals that mean "roll back now" — error rate thresholds, failed smoke test, etc.>

## Rollback steps
1. <step>
2. <step>

## Data/migration rollback
<How to reverse any migration included in this release. If a migration is not reversible, this
must say so explicitly and name the mitigation (e.g., backup restore procedure) — a release with
an irreversible, unmitigated migration should not have been approved.>

## Verification after rollback
<How to confirm the rollback succeeded.>

## Owner during rollback
<Who executes this — always a human decision to trigger; this document only prepares the
mechanics.>
