<!-- wiki-id: ema:source-intake-pattern-routing-2026-05-10 -->
<!-- see-also: ema:workspace-source-intake-contract, ema:source-intake-query-log-2026-05-10, ema:source-intake-source-inventory-2026-05-10 -->

# Source Intake Pattern Routing - 2026-05-10

This table routes donor patterns into EMA entity families and Proslync product
objects. It is intentionally mechanism-first: the reusable part is named before
any implementation task is queued.

| Pattern ID | Source refs | Pattern | Target object/entity | Conflict strategy | Route | Verification expected |
|---|---|---|---|---|---|---|
| `pattern:20260510-public-relay-fallback` | `source:20260510-iroh` | Dial by stable peer identity; try direct path, fall back to public relay. | `device.hosting_enabled`, org host-set transport. | LWW host status + append-only reachability events. | ADR now; sidecar code deferred. | ADR link + later sidecar smoke. |
| `pattern:20260510-crdt-prose` | `source:20260510-automerge`, `source:20260510-yjs` | Collaborative prose/data can be soft-merged when represented as CRDT document state. | Blueprint prose, source cards, agent reports. | CRDT prose. | Conflict-policy ADR now; queue implementation. | Multi-host merge harness later. |
| `pattern:20260510-awareness-not-persistence` | `source:20260510-yjs` | Presence/awareness should not be canonical persisted state. | Cockpit cursors, live actor status, vApp presence. | ephemeral/lww, not durable event truth. | queue. | Cockpit projection smoke. |
| `pattern:20260510-otel-semconv` | `source:20260510-opentelemetry-spec` | Agent/swarm operations should emit portable spans/events rather than bespoke logs only. | `execution.registry`, `dispatch.registry`, `chronicle.activity`. | append-only telemetry events. | queue Option 1. | `ema doctor --strict` + trace fixture. |
| `pattern:20260510-openfeature-evaluation` | `source:20260510-openfeature-spec` | Feature-flag decisions should expose evaluation details and hooks. | `feature_flag.evaluation`, rollout gates, persistence flags. | append-only evaluations + LWW flag config. | queue. | CLI JSON round-trip. |
| `pattern:20260510-rebac-tuples` | `source:20260510-openfga` | Authorization can be modeled as relation tuples and tested separately from app code. | Capability tokens, actor scope grants, approval access. | uniqueness on `(actor, scope, ttl)` plus append-only audit. | park/rewrite-only. | model tests before code. |
| `pattern:20260510-nil-disclosure-object` | `source:20260510-ncaa-nil-assist`, `source:20260510-ncaa-disclosure`, `source:20260510-ftc-endorsement` | NIL deal records need disclosure timing, contractual context, and clear social disclosure evidence. | Proslync NIL Deal, Disclosure Review, Brand HQ evidence card. | append-only evidence + LWW review status. | build/continue. | app/backend/cockpit proof. |
| `pattern:20260510-competitor-compliance-positioning` | `source:20260510-athliance` | Public competitor language centers compliance risk mitigation for athletes, schools, and brands. | Proslync AD buyer positioning, Mrs. Wilson P/S answers. | source-card prose. | queue/presentation. | source card reviewed. |

## Routing Rule

If a source produces a pattern but no target object/entity, park it. If a source
produces a target object but no verification path, queue it as source-needed
instead of implementation-ready.
