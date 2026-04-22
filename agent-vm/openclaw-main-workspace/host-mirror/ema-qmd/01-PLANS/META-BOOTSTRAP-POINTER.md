# Meta-bootstrap pointer

The canonical meta-bootstrap decision for "make t3code the backbone of EMA and run the daemon independently" lives at:

**`10-DECISIONS/2026-04-13-META-BOOTSTRAP-T3CODE-AS-EMA-BACKBONE.md`**

That decision doc is the read-first for every v1.1 planning pass that touches:
- runtime architecture (daemon lifecycle, transport, Effect adoption)
- orchestration (decider/projector/reactor, event sourcing)
- persistence (event log + projections, data migration from `loop_*`)
- sub-project sequencing (A = backbone, C = vApp contract + chat port)
- vApp contract (not yet defined, blocks chat port)

## Sub-project status

- **A — backbone extraction + independent daemon:** decision locked, spec pending, brainstorm next.
- **C — vApp contract + t3code-chat as reference vApp:** decision locked, spec pending, depends on A spec being frozen before C brainstorm starts in earnest.
- **D+ — reshape remaining EMA domains onto the spine, port other vApps:** follow-up passes, out of scope for the meta-bootstrap.

## Do not

- Treat `services/core/loop/` as a separate project. The loop reshape IS the backbone merge.
- Keep Fastify+ws as the transport. Decision is Effect RPC over ws, verbatim from t3code.
- Start implementation before A's spec is committed.
