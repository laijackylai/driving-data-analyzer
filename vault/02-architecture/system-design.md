---
doc_type: architecture
area: system-design
status: draft
owner: architect
created: 2026-07-23
updated: 2026-07-23
related: []
---

# System Design

> `draft` — this document has not yet had a formal architecture pass. The application already
> exists (Next.js 16 App Router, React 19, TypeScript strict, Tailwind CSS 3); this file should
> be treated as "not yet written," not "the architecture is unknown." The as-built structure is
> documented in the root `CLAUDE.md` ("Project Structure" / "Key Files") until an architect
> agent formally captures it here — do not duplicate it prematurely.

## Status
`draft`. No ADRs exist yet for this project (see [[../04-decisions/README]]).

## As-built reference (until formalized here)
See root `CLAUDE.md`:
- `src/app/api/analyze/route.ts` — CSV/JSON upload → analysis pipeline
- `src/lib/data/` — parsing (`obd2Parser.ts`), analysis (`obd2Analyzer.ts`, `cobbAnalyzer.ts`),
  derived metrics (`deriveMetrics.ts`), validation (`obd2Validators.ts`)
- `src/components/features/tabs/` — one tab component per metric category
- `src/types/index.ts` — shared types

## Known open architectural questions
- REQ-7 (data-source profile system: attributes→plots vs. car→plots, auto-detect vs. manual,
  whether a DB is warranted) — needs `/research` before this file is filled in for that area.
- REQ-8 (local storage: Dexie/IndexedDB, client vs. server render split by plot cost) — same.

## Related
- [[data-model]]
- [[api-contracts]]
- [[non-functional-requirements]]
- [[../00-product/requirements]]
