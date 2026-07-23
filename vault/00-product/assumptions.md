---
doc_type: product
area: assumptions
status: active
owner: human
created: 2026-07-23
updated: 2026-07-23
related: []
---

# Product Assumptions

- **ASSUMPTION-1**: This is currently a personal/hobbyist tool (COBB AccessPORT + OBDLink data
  from the owner's own vehicle, likely Subaru given AWD/CVT/TR580-specific analysis) rather than
  a multi-tenant product. Made by: orchestrator, 2026-07-23, confidence: high. Risk if wrong:
  architecture decisions (no auth, no per-user storage) would need revisiting for REQ-11.
- **ASSUMPTION-2**: `docs/plan/azure.md` is unrelated personal certification study material, not
  a deployment target for this app. Made by: orchestrator, 2026-07-23, confidence: high (content
  is a generic ADF/Databricks/Delta Lake curriculum with no reference to this app's actual data
  or code). Risk if wrong: low — flagged for human confirmation, not acted on.
- **ASSUMPTION-3**: The in-progress uncommitted graphs/COBB derived-metrics work (REQ-6) is close
  to correct — type-check is clean and only 6/114 tests fail, all traced to stale test
  expectations/fixtures rather than broken production logic (verified 2026-07-23; see
  [[../05-tasks/BACKLOG]]). Risk if wrong: a "fix the test" task would actually be masking a real
  bug — mitigated by QA independently re-deriving expected values rather than just satisfying
  the assertions.

## Related
- [[vision]]
- [[requirements]]
