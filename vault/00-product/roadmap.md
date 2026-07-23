---
doc_type: product
area: roadmap
status: approved
owner: human
created: 2026-07-23
updated: 2026-07-23
related: ["[[requirements]]", "[[vision]]", "[[../05-tasks/BACKLOG]]"]
---

# Product Roadmap

> Approved by the human 2026-07-23 (brainstorming session, option A of three proposed).
> Driving goals: **engine health** (trends across sessions, not just per-session snapshots)
> and **car handling dynamics** (drivetrain behavior + chassis/cornering + driver inputs).
> Car scope: **multi-car, me first** — build for the owner's Subaru (TR580 CVT, COBB
> AccessPORT) now, keep parsers/metrics car-agnostic, defer the full profile system to
> Phase 5.

Each phase feeds the next; a phase starts only when the previous phase's exit criteria are
met. Phases 3 and 4 are explicitly swappable — Phase 4 has no dependency on Phase 2/3
storage. Every phase goes through the normal operating-system flow: `/research` where noted,
`/plan-feature` for architecture + task breakdown, human approval gates as defined in
`CLAUDE.md`.

## Phase 0 — Stabilize (in flight)

Close out the destabilized REQ-6 working state before anything new starts.

- Finish TASK-001, TASK-002 (both `implementation-complete`, awaiting independent QA) and
  TASK-003 (`ready`).
- Commit the uncommitted derived-metrics/COBB work currently sitting on `master`.
- Exit criteria: repo-wide `npm test` green, working tree clean, REQ-6 work-in-progress
  committed and reviewable.

## Phase 1 — Finish REQ-6 derived metrics

Complete the derived-metrics work: thermal delta (oil vs. coolant), AWD torque-split
estimate, CVT/AT gear-ratio error, torque-converter slip, volumetric efficiency, STFT
stability — plus their dyno/heatmap charts. Serves both driving goals directly.

- Source: `docs/plan/graphs.md`, `docs/plan/graphs-decisions.md`.
- Exit criteria: REQ-6 marked `[shipped]` in [[requirements]], charts rendering for both
  OBDLink and COBB inputs where the underlying PIDs exist, tests green.

## Phase 2 — Session storage (REQ-8)

Client-side persistence of analyzed sessions so trends become possible. Hard dependency for
Phase 3.

- `/research` first: storage engine (Dexie/IndexedDB suggested in
  `docs/plan/local_storage.md`), retention (last N sessions), which computations run
  client-side vs. server-side per plot cost, schema versioning for stored sessions.
- Exit criteria: uploaded sessions persist across browser restarts, session list UI,
  re-opening a stored session skips re-upload.

## Phase 3 — Engine-health trends

Cross-session health dashboard: knock trend, fuel-trim drift, thermal behavior,
boost/wastegate health. Per-system health scores and degradation signals ("is knock getting
worse? are fuel trims drifting?").

- Depends on Phase 2 (needs stored history).
- `/research` recommended: which signals are mechanically meaningful for engine health vs.
  noise, thresholds per signal.
- Exit criteria: a health view that compares the current session against stored history and
  flags degradation.

## Phase 4 — Handling dynamics

Chassis and driver-input analysis on top of the drivetrain metrics from Phase 1.

- GPS-derived cornering/braking g (accuracy caveats — derived from GPS + speed, no steering
  or lateral sensors in OBD2), driver-input smoothness, WOT-event analysis (extends
  `wotDetection.ts`), TR580 drivetrain deep-dive (research already in
  `docs/plan/tr580-awd-research.md`).
- No storage dependency — swappable with Phase 3 if priorities shift.
- Exit criteria: cornering/braking analysis rendered for GPS-bearing logs, driver-input
  smoothness metrics, TR580-specific drivetrain views.

## Phase 5 — Data-source profile system (REQ-7)

Multi-car support: the same plots working across OBDLink, COBB, and future car/logger
combinations.

- `/research` first: auto-detect vs. user-selected profile, whether a database is warranted,
  profile schema ("attributes → plots" vs. "car → plots" — open question in
  `docs/plan/cobb_support.md`).
- Exit criteria: a second car/logger profile can be added without touching chart code.

## Parked

- **REQ-9** (summary-card redesign) and **REQ-10** (landing redesign, branch
  `landing-redesign` exists): fold in opportunistically alongside phase work; not phases of
  their own.
- **REQ-11** (MVP / market strategy): revisit after Phase 5 — multi-car support is what
  makes a wider audience realistic. Human-owned decision.

Back to [[../HOME|HOME]].
