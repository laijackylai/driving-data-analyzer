---
doc_type: product
area: requirements
status: active
owner: human
created: 2026-07-23
updated: 2026-07-23
related: []
---

# Product Requirements

> Reverse-engineered from existing README/CLAUDE.md/docs as of 2026-07-23. Requirements already
> shipped are marked `[shipped]`; requirements only proposed in `docs/plan/*.md` are marked
> `[proposed]` and are **not yet approved** — treat them as candidates for `/plan-feature`, not
> as committed scope.

## Requirements

- **REQ-1** `[shipped]`: Accept CSV/JSON upload of OBD2 driving-data logs (long-form,
  semicolon-delimited OBD2/OBDLink format — see `docs/OBD2_DATA_STRUCTURE.md`) and parse into a
  wide-form time series. Priority: P0.
- **REQ-2** `[shipped]`: Compute driving-behavior/performance metrics across categories (engine,
  fuel, transmission, power, driving behavior, ABS, AWD, electrical, air intake, etc. — 19
  categories today per `CATEGORY_ORDER` in `src/components/ui/CategoryIcon.tsx`). Priority: P0.
- **REQ-3** `[shipped]`: Compute an overall 0–100 safety score with harsh-braking/rapid-
  acceleration event detection. Priority: P0.
- **REQ-4** `[shipped]`: All processing happens client/server-side within the app's own request
  lifecycle — no third-party data services, no persistence between sessions today. Priority: P0.
- **REQ-5** `[shipped]`: Accept COBB AccessPORT data logs as a second input profile, with
  COBB-specific analysis and 8 dedicated tabs (Engine, Boost, AFR, Power, Knock, Wastegate,
  Injector, AVCS) — see `docs/plan/cobb_support.md`. Priority: P0 (merged to master).
- **REQ-6** `[in progress, uncommitted]`: Derive additional cross-cutting metrics — thermal delta
  (oil vs. coolant), AWD torque split estimate, CVT/AT gear-ratio error, torque-converter slip,
  volumetric efficiency, short-term-fuel-trim stability — and surface them via dyno/heatmap
  charts. Source: `docs/plan/graphs.md`. Priority: P1. **Currently destabilized**: see
  [[../05-tasks/BACKLOG]] — 6 failing tests / 1 runtime crash sit on top of this work uncommitted.
- **REQ-7** `[proposed, unresolved questions]`: Data-source profile system — either "attributes →
  plots" or "car → plots" mapping so the same plots work across OBDLink and COBB inputs (and
  future car/logger combinations). Open question in `docs/plan/cobb_support.md`: auto-detect vs.
  user-selected profile; whether a database is warranted "at this scale." Priority: unset —
  needs `/research` before architecture.
- **REQ-8** `[proposed]`: Client-side local history — persist the last 10 analyzed sessions so
  users don't have to re-upload. Open questions in `docs/plan/local_storage.md`: storage engine
  (Dexie/IndexedDB suggested), and which computations run client-side vs. server-side per plot
  cost. Priority: unset.
- **REQ-9** `[proposed]`: Redesign per-graph summary cards to sit beside each chart rather than
  as a top-of-page strip (`docs/plan/summary_card.md` — currently just a one-line note, not yet
  fully specified). Priority: unset.
- **REQ-10** `[proposed]`: Landing page redesign (`docs/landing-redesign.md`, branch
  `landing-redesign` already exists). Priority: unset.
- **REQ-11** `[strategic, unresolved]`: Determine whether/how to position this as an MVP for a
  wider audience beyond personal use (`docs/plan/MVP.md`). Priority: unset — human decision, not
  delegable to research/architecture until direction is given.

## Explicitly not a requirement
`docs/plan/azure.md` describes an unrelated personal Azure Data Engineer certification exercise.
It is not a deployment requirement for this application — see [[vision]].

## Traceability
REQ-6 is the only requirement with an open task right now — see [[../05-tasks/BACKLOG]].
Sequencing for REQ-6/7/8 and the parked status of REQ-9/10/11 was decided by the human on
2026-07-23 — see [[roadmap]] (REQ-6 → Phase 1, REQ-8 → Phase 2, REQ-7 → Phase 5;
REQ-9/10/11 parked).

## Related
- [[vision]]
- [[roadmap]]
- [[success-metrics]]
- [[assumptions]]
