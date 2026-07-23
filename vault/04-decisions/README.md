---
doc_type: index
area: decisions
---

# 04 — Decisions (ADR Log)

Architecture Decision Records, one file per decision: `ADR-0001-<slug>.md`, `ADR-0002-<slug>.md`,
etc. Written by the [[../../.claude/agents/architect|architect]] agent with
`status: proposed`. Only an explicit recorded human decision may change `status` to `accepted`,
`rejected`, or `superseded` (see `CLAUDE.md` approval gates — architecture requires human
approval before development).

- Template: [[ADR-template]]
- Numbering: sequential, zero-padded to 4 digits, never reused.
- An accepted ADR is never edited in place; a change is a new ADR with
  `supersedes: ADR-####` in its frontmatter, and the old ADR gets `status: superseded`.

## Log
| ADR | Title | Status | Date |
|-----|-------|--------|------|
_None yet._

Back to [[../HOME|HOME]].
