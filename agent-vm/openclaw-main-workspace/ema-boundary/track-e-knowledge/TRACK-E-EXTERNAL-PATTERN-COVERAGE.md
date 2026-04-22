# Track E External Pattern Coverage

## Purpose
Map specific useful patterns from GitNexus and graphify into EMA-native Track E capabilities.

## Source notes
### Graphify signals observed
- multimodal corpus ingest
- deterministic AST pass + semantic extraction pass
- persistent graph artifacts (`graph.json`, report, HTML)
- confidence tags: EXTRACTED / INFERRED / AMBIGUOUS
- graph report as high-level orientation layer
- query/path/explain interactions
- update/watch mode
- export and MCP-serving workflow
- wiki generation from graph

### GitNexus signals observed
- local-first code intelligence graph
- CLI + MCP + web UI split
- single command analyze/update flow
- multi-repo registry and group support
- query/context/impact/detect-changes/rename/cypher workflows
- contract extraction and cross-repo query
- auto wiki generation
- repo-specific skill generation
- stale index awareness and reindex model

## EMA adoption map

### 1. Multilayer graph coverage
**EMA requirement**: broader than code graph only.
- code structure
- semantic canon
- planning graph
- runtime/execution graph
- review/provenance graph
- gap/contradiction graph
- surface/read-model graph

Decision: **Adopt and expand** beyond both donors.

### 2. Confidence-tagged relations
Graphify’s EXTRACTED / INFERRED / AMBIGUOUS pattern should map into EMA relation confidence + trust posture.

Decision: **Adopt**.

### 3. Structural + semantic multi-pass extraction
Graphify’s deterministic structure pass plus semantic pass is useful.
GitNexus’s parser-heavy code understanding is also useful.

Decision: **Adopt conceptually**.
EMA should support:
- deterministic extraction where possible
- semantic/LLM enrichment where useful
- explicit distinction between observed and inferred

### 4. Query/path/explain workflows
Graphify’s query/path/explain interaction model is strong for operator and agent workflows.

Decision: **Adopt** as Track E graph query UX target.

### 5. MCP-friendly graph access
Both donor systems push graph knowledge into agent context via MCP or always-on files.

Decision: **Adopt**.
Track E should expose graph- and projection-level queries to agents.

### 6. Graph report summary layer
Graphify’s report gives a compressed orientation layer.
GitNexus also offers contextual summaries/resources.

Decision: **Adopt**.
EMA should generate:
- graph report / orientation digest
- per-perspective summaries
- object summaries
- repo/service/project summaries where relevant

### 7. Multi-repo / multi-domain grouping
GitNexus repository groups are directly relevant.
EMA needs broader grouping:
- repos
- services
- plans
- projects
- tracks
- surfaces

Decision: **Adopt and generalize**.

### 8. Blast radius / impact analysis
GitNexus’s impact and detect-changes flows are strong.
EMA should provide analogous impact reasoning across:
- code
- plans
- proposals
- runtime changes
- canon changes
- surface changes

Decision: **Adopt in generalized form**.

### 9. Auto wiki generation
Both donors imply graph-to-doc projection value.
EMA already wants canon-backed wiki rendering.

Decision: **Adopt**.

### 10. Watch/reindex/staleness
Graphify update/watch and GitNexus stale-index awareness are both important.
EMA equivalent should be:
- source freshness
- stale projections
- stale graph segments
- refresh/reingest jobs

Decision: **Adopt**.

### 11. Community / cluster detection
Both systems leverage graph community structure.

Decision: **Adopt cautiously**.
Useful for:
- concept clusters
- blueprint regions
- surface clusters
- repo/service groupings
But should not become the only organizing principle.

### 12. Repo-specific skills / context generation
GitNexus generates repo-specific skills; graphify creates orientation guidance.

Decision: **Adopt selectively**.
EMA should generate scoped context packs and maybe agent-readable briefings from graph slices.

## Coverage matrix

| Pattern | EMA should cover? | Native / Integrated / Deferred | Notes |
|---|---|---|---|
| Confidence-tagged edges | Yes | Native | Core epistemic feature |
| Query/path/explain | Yes | Native | Core graph UX |
| Graph report digest | Yes | Native | Operator + agent orientation |
| MCP graph access | Yes | Native | Important for agent use |
| Multi-repo grouping | Yes | Native later | Generalize to multi-domain grouping |
| Blast radius analysis | Yes | Native later | Reuse across code + plans + runtime |
| Auto wiki generation | Yes | Native | Already aligned with Track E |
| Watch/update/reindex | Yes | Native later | Freshness + refresh jobs |
| Multimodal ingest | Partial initially | Deferred/Integrated | Start with docs/text, broaden later |
| Deterministic AST extraction | Useful | Integrated/Deferred | More relevant for code-specific subflows |
| Raw Cypher exposure | Maybe | Deferred | Only if graph backend makes it worthwhile |
| Browser-only graph UI mode | Nice-to-have | Deferred | not core to Track E spine |

## Specific gaps EMA must not miss
- confidence distinction between observed and inferred knowledge
- graph query workflows more precise than global search
- stale graph/projection awareness
- impact analysis across changing structures
- grouped / scoped graph traversal
- generated orientation summaries for agents/humans
- ability to treat EMA itself as analyzable corpus
