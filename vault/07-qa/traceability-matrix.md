---
doc_type: qa
area: traceability-matrix
status: active
owner: qa-engineer
created: 2026-07-23
updated: 2026-07-23
related: []
---

# Requirement → Task → Test Traceability Matrix

| Requirement | Task | Acceptance criterion | Test | Result | QA report |
|-------------|------|----------------------|------|--------|-----------|
| REQ-6 | [[../05-tasks/completed/TASK-001-fix-stale-frontend-tests\|TASK-001]] | categoryIcon.test.tsx matches real CATEGORY_ORDER | `npm test -- categoryIcon` | pass | [[reports/TASK-001-qa-report\|TASK-001]] |
| REQ-6 | [[../05-tasks/completed/TASK-001-fix-stale-frontend-tests\|TASK-001]] | DashboardView mock fixture includes all DerivedMetrics fields, no EngineTab crash | `npm test -- DashboardView` | pass | [[reports/TASK-001-qa-report\|TASK-001]] |
| REQ-6 | [[../05-tasks/completed/TASK-001-fix-stale-frontend-tests\|TASK-001]] | `npm test` reports 0 failures (repo-wide) | `npm test` x5 | partial — 4/5 clean; unrelated pre-existing `DashboardView.test.tsx` timing flake in 1/5, not caused by this task | [[reports/TASK-001-qa-report\|TASK-001]] |
| REQ-6 | [[../05-tasks/completed/TASK-002-fix-cobb-injector-test\|TASK-002]] | analyzeCobbInjector fuel-cut-event count genuinely verified at 2 events | `npm test -- cobbAnalyzer` | pass (9/9) | [[reports/TASK-002-qa-report\|TASK-002]] |
| test-debt (pre-existing, unrelated) | [[../05-tasks/completed/TASK-003-fix-dotloader-test\|TASK-003]] | DotLoader test matches real rendered text + real opacity-based stagger mechanism | `npm test -- DotLoader` | pass (4/4) | [[reports/TASK-003-qa-report\|TASK-003]] |
| test-debt (pre-existing, unrelated) | [[../05-tasks/completed/TASK-003-fix-dotloader-test\|TASK-003]] | `npm test` reports 0 failures repo-wide | `npm test` x5 | partial — DotLoader itself green in every run; unrelated pre-existing `DashboardView.test.tsx` timing flake in 1/5 runs | [[reports/TASK-003-qa-report\|TASK-003]] |
| test-debt (pre-existing, unrelated) | [[../05-tasks/review/TASK-004-stabilize-dashboardview-flake\|TASK-004]] | `DashboardView.test.tsx > returns to LANDING when home button is clicked from DASHBOARD` is stable, no `vi.waitFor` race | `npx vitest run src/test/DashboardView.test.tsx` x13 consecutive + `npm test` x5 | **fixed** — 13/13 isolated full-file runs clean (15/15 tests each), 5/5 full-suite runs clean (114/114 each); root cause independently confirmed (ambiguous `vi.waitFor` precondition satisfiable immediately post-upload-click, not a real-timer race as originally assumed); replaced with unambiguous `dot-loader`-absence signal, verified deterministic via the test's `PixelizeEffect` mock never invoking `onBeforeComplete` | [[reports/TASK-004-qa-report\|TASK-004]] |

Back to [[test-strategy]].
