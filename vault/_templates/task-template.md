---
doc_type: task
task_id: TASK-XXXX
title: <short title>
status: draft
owner: <single agent or human name>
reviewer: <qa-engineer or human, blank until review>
priority: P0|P1|P2|P3
dependencies: []
created: YYYY-MM-DD
updated: YYYY-MM-DD
related: []
---

# TASK-XXXX: <short title>

## Objective
<One or two sentences: what must be true when this task is done.>

## Background
<Why this task exists. Link the approved requirement/ADR it derives from.>
- Requirement: [[../00-product/requirements]]
- Architecture/ADR: [[../04-decisions/ADR-template]]

## Context manifest
- **Required files** (must read before acting): <list>
- **Optional reference files**: <list>
- **Explicitly excluded areas**: <list — what NOT to read/touch>
- **Expected outputs**: <files this task must produce/modify>
- **Maximum write scope**: <exact paths this owner may write>

## In scope
- <bullet list>

## Out of scope
- <bullet list>

## Acceptance criteria
- [ ] <testable criterion 1>
- [ ] <testable criterion 2>

## Interfaces / contracts
<Link or quote the exact API/data/UI contract this task must satisfy. If none exists yet, this
task cannot leave `draft`.>

## Write scope
<Exact file/path globs this task's owner may modify. Must not overlap another concurrently
active task's write scope.>

## Test requirements
- <unit/integration/contract/accessibility/smoke as applicable>

## Security considerations
- <secrets, authz/authn, data exposure, injection, etc. — or "none identified" with reasoning>

## Assumptions
- <explicit assumptions made, and by whom>

## Blockers
- <none, or a description + which document conflict/dependency is blocking, + escalation target>

## Implementation evidence
<Filled in by the developer: changed files, commands run, results, assumptions, known
limitations.>

## QA evidence
<Filled in by qa-engineer: tests run, results, traceability matrix link, verdict.>

## Approval history
| Date | Decision | By | Notes |
|------|----------|----|-------|
|      |          |    |       |

## Handoff notes
<Use [[../_templates/handoff-template]] format. Most recent handoff first.>
