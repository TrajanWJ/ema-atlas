<!-- wiki-id: ema:source-intake-source-inventory-2026-05-10 -->
<!-- see-also: ema:workspace-source-intake-contract, ema:source-intake-query-log-2026-05-10, ema:source-intake-pattern-routing-2026-05-10 -->

# Source Intake Inventory - 2026-05-10

Retrieval date: 2026-05-10. This is a seed inventory, not a final literature
review. License posture controls code import; pattern posture controls whether a
source may shape ADRs, queues, and product-object deltas.

| Source ID | Title | Origin | Type | License posture | Confidence | Pattern extracted | Target route |
|---|---|---|---|---|---|---|---|
| `source:20260510-iroh` | Iroh primary repo | https://github.com/n0-computer/iroh | primary_repo | direct-port-allowed for compatible snippets; rewrite-only for EMA transport topology | verified | Public-key dialing, direct QUIC path first, public relay fallback, protocol crates. | ADR source + Track 6 later. |
| `source:20260510-automerge` | Automerge primary repo | https://github.com/automerge/automerge | primary_repo | direct-port-allowed only after file-level review; rewrite-only for entity model | verified | CRDT document model, compact sync protocol, local-first persistence posture. | Conflict-policy ADR + soft-entity queue. |
| `source:20260510-yjs` | Yjs primary repo/docs | https://github.com/yjs/yjs | primary_repo | source-needed for code import; inspiration-only now | verified | Shared types, network-agnostic sync, awareness/presence separation. | Conflict-policy ADR + prose/cursor entities. |
| `source:20260510-opentelemetry-spec` | OpenTelemetry specification repo | https://github.com/open-telemetry/opentelemetry-specification | primary_repo | direct-port-allowed for semantic references; no code import needed | verified | Cross-language telemetry spec, traces/metrics/logs, semantic conventions. | Option 1 telemetry queue. |
| `source:20260510-openfeature-spec` | OpenFeature specification | https://github.com/open-feature/spec | primary_repo | direct-port-allowed for spec references; no code import needed | verified | Vendor-neutral feature flag API, hooks, evaluation details. | Feature-flag object model queue. |
| `source:20260510-openfga` | OpenFGA primary repo/docs | https://github.com/openfga/openfga | primary_repo | rewrite-only for EMA capability model | verified | Relationship-based authorization model, tuple-oriented permissions, model testing. | Capability-token design notes. |
| `source:20260510-ncaa-nil-assist` | NCAA NIL Assist student-athlete surface | https://nilassist.ncaa.org/student-athletes/ | official_docs | inspiration-only | verified | NIL activity disclosure, provider review, education surface. | Proslync source cards. |
| `source:20260510-ncaa-disclosure` | NCAA NIL disclosure/transparency announcement | https://www.ncaa.org/news/2024/1/10/media-center-division-i-council-approves-nil-disclosure-and-transparency-rules.aspx | official_docs | inspiration-only | verified | Deal disclosure timing, transparency, template contract/terms education. | Proslync disclosure objects. |
| `source:20260510-ftc-endorsement` | FTC Endorsement Guides FAQ | https://consumer.ftc.gov/business-guidance/resources/ftcs-endorsement-guides-what-people-are-asking | official_docs | inspiration-only | verified | Clear/conspicuous disclosure, advertiser/endorser responsibility, athlete examples. | Proslync content/disclosure QA. |
| `source:20260510-athliance` | Athliance public product surface | https://athliance.com/ | vendor_page | inspiration-only | verified | NIL compliance risk mitigation, brand/school disclosure workflow positioning. | Competitor/source card. |

## Import Fence

No code is imported from these sources in this pass. All entries are source
cards, ADR evidence, or queue-routing inputs unless a later track adds
file-level license review and provenance.
