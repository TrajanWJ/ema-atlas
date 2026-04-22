# Track E Doc Ingestion Inventory

## Purpose
Identify which existing EMA documents should be imported into Track E, at what priority, and into which planes.

## Priority 0 — Import first
| Source | Plane(s) | Why |
|---|---|---|
| `CANONICAL_ARCHITECTURE.md` | canon, reality, surface | core authority map |
| `INTENT_SCHEMA.md` | intention-building, canon | current intent contract |
| `ema-boundary/EMA-KNOWLEDGE-AND-ORCHESTRATION-ARCHITECTURE.md` | canon, planning, gap, surface | current multi-plane synthesis |
| `wiki/projects/EMA.md` | surface, canon mirror | project summary mirror |
| `wiki/intents/ema-root.md` | surface, intention mirror | root intent mirror |

## Priority 1 — Import next
| Source | Plane(s) | Why |
|---|---|---|
| `ema-v1-1-program-plan.md` | planning, subprojects | full-program context |
| `EMA_INTENT_BOOTSTRAP_API_SPEC.md` | reality, implementation | concrete intent service shape |
| `EMA_INTENT_BOOTSTRAP_IMPLEMENTATION_MAP.md` | planning, implementation | bridge doc |
| `ema-host-wiki-engine-integration-plan.md` | planning, gap | wiki/EMA bridge |
| `ema-shared-context-contract.md` | canon, runtime | shared context substrate |

## Priority 2 — Import as supporting evidence
| Source | Plane(s) | Why |
|---|---|---|
| `execution-event-schema.md` | runtime, provenance | execution lineage |
| `execution-event-state-spec.md` | runtime, provenance | event semantics |
| `host-truth-domain-spec.md` | reality, canon | host truth semantics |
| `host-truth-state-machine.md` | reality, runtime | current truth transitions |
| `memory-authority-decision.md` | canon, governance | memory authority decision |

## Import rules
- treat docs as `source` + `artifact` first
- derive `claim`, `concept`, `canon`, `blueprint`, or `intent` objects explicitly
- preserve provenance to exact source doc
- detect contradiction between imported docs and newer docs/runtime claims
- do not treat mirrored wiki pages as stronger authority than source docs or runtime truth
