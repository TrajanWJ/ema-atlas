# Graphify Deeper Notes

Type: import-analysis
Plane: planning
Status: active

## What stands out
Graphify is not just a graph viewer. It is explicitly aimed at turning mixed local corpora into a persistent graph with:
- AST extraction
- multimodal ingestion
- persistent graph JSON
- interactive HTML graph
- audit/report output
- cache-based reprocessing
- extracted vs inferred vs ambiguous edge labeling

## Why this matters for EMA
That is very close to the right ingestion philosophy for the EMA deliverable folder.
The folder should be able to become graph-addressable without losing provenance or honesty.

## Best steals
- persistent graph output as a materialized sidecar, not only live UI state
- confidence/provenance labeling for edges
- multimodal ingestion path
- re-run only changed files via cache/diff discipline
- report layer that explains surprising clusters and questions

## EMA-native adaptation
- split extracted/inferred/ambiguous edges by plane and provenance
- bind graph nodes to canonical EMA object IDs
- generate graph sidecars for wiki/deliverable folders and maybe per-repo code workspaces

## Related
- [GRAPH-KNOWLEDGE-SYSTEM](../../05-WIKI/GRAPH-KNOWLEDGE-SYSTEM.md)
- [OBJECT-REGISTRY](../../05-WIKI/OBJECT-REGISTRY.md)
- [SELF-DESCRIBING-DELIVERABLE](../../02-ARTIFACTS/SELF-DESCRIBING-DELIVERABLE.md)
