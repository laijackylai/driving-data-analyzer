---
doc_type: component-design
component: <name>
status: proposed
owner: architect
created: YYYY-MM-DD
related: []
---

# Component: <name>

## Responsibility
<Single, bounded responsibility. If you need "and" to describe it, it's probably two components.>

## Boundaries
- Depends on: <components/services>
- Depended on by: <components/services>
- Explicitly does NOT: <bullet list — scope exclusions>

## Interfaces
<Link to [[../api-contracts]] entries this component implements/consumes.>

## Data owned
<Link to [[../data-model]] entities this component owns (single writer).>

## Non-functional requirements
<Link to [[../non-functional-requirements]] items relevant to this component.>

## Failure modes and handling
- <failure mode> → <handling/degradation strategy>

## Open questions
- <anything unresolved, and who must resolve it>
