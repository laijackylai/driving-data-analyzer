---
doc_type: architecture
area: api-contracts
status: draft
owner: architect
created: 2026-07-23
updated: 2026-07-23
related: []
---

# API Contracts

> `draft`. As-built: `POST src/app/api/analyze/route.ts` accepts multipart form-data (10MB
> limit), validates the CSV, returns `OBD2AnalysisResult` (see `src/types/index.ts`). This is the
> only API route today. Formalize here once a change to this contract is actually proposed —
> until then this file should not fork from the as-built route.

## Status
`draft` — no contract changes proposed yet.

## Related
- [[system-design]]
- [[data-model]]
