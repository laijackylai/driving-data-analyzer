---
doc_type: product
area: vision
status: active
owner: human
created: 2026-07-23
updated: 2026-07-23
related: []
---

# Product Vision

> Reverse-engineered from the existing `README.md`, `CLAUDE.md`, and `docs/` as of 2026-07-23 —
> this project already exists and is mid-development. This document records the vision as
> currently understood; the human product owner should correct it rather than treat it as fixed.

## Vision statement
A privacy-first, client-side web tool for analyzing vehicle telemetry logs (OBD2/OBDLink and
COBB AccessPORT data logs) to surface driving behavior, safety, and performance-tuning insights.
Originally scoped around generic OBD2 driving-behavior analysis (speed, acceleration, braking,
safety score); has since grown a second, more specialized use case: analyzing COBB AccessPORT
data logs for AWD/CVT tuning diagnostics (Subaru-specific: torque split, wastegate, AFR, AVCS,
injector duty cycle, thermal deltas, torque-converter slip — see `docs/plan/tr580-awd-research.md`
and the 8 COBB tabs in `src/components/features/tabs/`).

## Non-goals (as currently understood)
- Not a cloud service today: "all data processing happens on your device" (README) — no backend
  persistence exists yet (`docs/plan/local_storage.md` proposes adding client-side history).
- Not currently pursuing an Azure data-engineering pipeline for this app. `docs/plan/azure.md` is
  unrelated personal study material (Azure Data Engineer certification readiness notes), not a
  deployment plan for this product — flagged here so it isn't mistaken for a real requirement.
- Not yet decided whether this is a personal tool or something aimed at a wider market —
  `docs/plan/MVP.md` explicitly asks this question and is unresolved.

## Open strategic question
`docs/plan/MVP.md`: is the current feature set worth pursuing as an MVP toward some market, and
if so, what's missing, what value does it bring, and what would make it distinctive? This is a
live, unresolved product question, not yet answered by the human product owner.

## Related
- [[requirements]]
- [[success-metrics]]
- [[assumptions]]
