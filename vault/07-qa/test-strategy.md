---
doc_type: qa
area: test-strategy
status: active
owner: qa-engineer
created: 2026-07-23
updated: 2026-07-23
related: []
---

# Test Strategy

## As-built tooling
- Unit/component: Vitest + Testing Library (`npm test`)
- E2E: Playwright (`npm run test:e2e`)
- Type safety: `npm run type-check` (tsc --noEmit, strict)
- Lint: `npm run lint`

## Current baseline (2026-07-23)
114 tests total, 108 passing, 6 failing — all traced to stale test expectations/fixtures from
the in-progress graphs/COBB work (REQ-6), not production-logic bugs (see
[[../05-tasks/BACKLOG]] and [[traceability-matrix]]). Every task must leave `npm test` at least
as green as it found it — never comment out or loosen an assertion to make it pass without
recording why in the task's QA evidence.

## Related
- [[traceability-matrix]]
- [[reports/README|QA reports]]
