---
doc_type: architecture
area: data-model
status: draft
owner: architect
created: 2026-07-23
updated: 2026-07-23
related: []
---

# Data Model

> `draft`. As-built types live in `src/types/index.ts` (`OBD2Reading`, `OBD2DataPoint`,
> `OBD2AnalysisResult`, `DerivedMetrics`, COBB-specific point/metric types). This file becomes
> the canonical contract once REQ-7 (data-source profile system) and REQ-8 (local storage schema)
> get a `/research` + `/plan-feature` pass — until then, `src/types/index.ts` is the source of
> as-built truth and this file should not fork from it speculatively.

## Status
`draft` — no formal data-model ADR yet.

## Related
- [[system-design]]
- [[api-contracts]]
- [[../00-product/requirements]]
