---
doc_type: index
area: research
---

# 01 — Research

Independent research reports produced by the `research-technical` and `research-critical`
agents, one pair per research question, written **before** either agent sees the other's
conclusions. See [[../../.claude/agents/research-technical|research-technical]] and
[[../../.claude/agents/research-critical|research-critical]] for their mandates.

- Template: [[templates/research-report-template]]
- Naming: `<topic-slug>-technical.md` and `<topic-slug>-critical.md`
- Scratch/PoC work: `scratch/` (not canonical, safe to delete)

Research may proceed without human approval. Its conclusions become input to the
[[../02-architecture/system-design|architect]], who must explicitly address any disagreement
between the two reports (see `CLAUDE.md` source-of-truth hierarchy).

Back to [[../HOME|HOME]].
