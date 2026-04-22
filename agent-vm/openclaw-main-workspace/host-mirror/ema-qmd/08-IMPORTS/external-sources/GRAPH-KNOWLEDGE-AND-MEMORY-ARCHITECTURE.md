# Graph Knowledge and Memory Architecture

Type: architecture-note
Plane: planning
Status: active

## Core synthesis
The imported systems suggest EMA should have a layered knowledge architecture:

### Layer 1 — raw source corpus
- docs
- code
- chat/session traces
- images/PDFs/media
- runtime events

### Layer 2 — extracted structure
- entities
- relationships
- call graph / repo graph
- citations / provenance
- temporal episodes

### Layer 3 — EMA canonical objects
- workstreams
- intentions
- proposals
- executions
- traces
- sessions
- artifacts
- memory objects
- machine/service/repo bindings

### Layer 4 — navigable surfaces
- wiki pages
- graph explorer
- code vApp
- review/chronicle surfaces
- HQ / Launchpad

## Principle
EMA should not confuse extracted graph structure with canonical truth.
Extracted graph informs canonical objects; canonical objects drive operator-facing truth.

## Related
- [GRAPH-KNOWLEDGE-SYSTEM](../../05-WIKI/GRAPH-KNOWLEDGE-SYSTEM.md)
- [SOURCE-OF-TRUTH-HIERARCHY](../../04-CANON/SOURCE-OF-TRUTH-HIERARCHY.md)
