# Connected Graph Best Practices

Type: guide
Plane: canon
Status: active

## Purpose
Define the best-practice rules for making the EMA deliverable behave like a connected graph rather than a pile of markdown files.

## Core rules
### 1. Every durable page needs an addressable role
Each substantial page should clearly communicate:
- what it is
- which plane it belongs to
- whether it is current truth, planning, gap, or comparison
- which major objects it touches

### 2. Every durable page needs outward links
Each substantial page should link to:
- at least one parent/index page
- at least one sibling or adjacent concept page
- at least one implementation, gap, or decision page when relevant

### 3. Every durable page needs inbound links
No important page should be orphaned.
Each should be linked from at least one of:
- track seed
- artifact index
- object registry
- decisions index
- implementation index
- gap index

### 4. Links should express semantics, not just navigation
Prefer link groups like:
- Related concepts
- Depends on
- Implemented by
- Gaps / tensions
- Imported from
- Promoted into

This makes the graph more meaningful.

### 5. Provenance matters
Whenever a page derives from repo reading, host inspection, Discord decision synthesis, or cross-pollination mining, say so.
Graph nodes with no provenance become untrustworthy.

### 6. Freshness matters
A good graph distinguishes:
- current truth
- historical reference
- migration scaffolding
- speculative planning

### 7. Canonical names matter
Repeat stable names for major objects consistently:
- workstream
- proposal
- execution
- chronicle
- review
- code-session
- repo-binding
- machine
- service
- planning-node
- research-item

Consistent names create a stronger implicit graph.

## Anti-patterns
- orphan pages
- indexes that list pages without describing them
- pages that only say "see X" and add no value
- pages with no plane/status/provenance clues
- duplicate concepts split across multiple vague files
- decorative graph language without actual link discipline

## Related
- [TWO-WAY-LINKING-CONVENTION](./TWO-WAY-LINKING-CONVENTION.md)
- [GRAPH-KNOWLEDGE-SYSTEM](./GRAPH-KNOWLEDGE-SYSTEM.md)
- [SOURCE-OF-TRUTH-HIERARCHY](../04-CANON/SOURCE-OF-TRUTH-HIERARCHY.md)
