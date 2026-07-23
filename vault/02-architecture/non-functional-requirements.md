---
doc_type: architecture
area: non-functional-requirements
status: draft
owner: architect
created: 2026-07-23
updated: 2026-07-23
related: []
---

# Non-Functional Requirements

> `draft`. Known as-built constraints, not yet formalized as measurable NFRs:
> - Privacy: "all data processing happens on your device" (README) — no server-side persistence
>   today. Any future feature (REQ-8 local storage) must not silently violate this without a
>   human decision.
> - Data volume: OBD2 logs run ~138,000 records/hour (docs/OBD2_DATA_STRUCTURE.md); COBB logs at
>   ~50Hz produce similar or higher density — parsing/derivation performance matters.
> - File size limit: 10MB enforced at the API route today.

## Related
- [[system-design]]
- [[../00-product/success-metrics]]
