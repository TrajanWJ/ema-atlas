# Vision

> **EMA is a shared human-agent operating environment.** Humans and agents
> inhabit the same workspace state. Execution is explicit, traceable, and
> routable. Docs/wiki/canvas collaboration is first-class. Organizations
> and spaces scope people, agents, work, and permissions. Multiple surfaces
> can observe and control the same underlying system. Execution can be
> dispatched across harnesses and eventually peers.
>
> *Source:* `MACBOOK_AGENT_HANDOFF_MASTER.md` §4 (Likely Inference,
> consistent across `02-project-transfer-brief.md` §2 and
> `03-architectural-evolution-and-major-decisions.md`).

This file exists so a fresh agent can paste **one paragraph** into a
context window and have the right north star. Everything else in the repo
is grounding, history, or implementation pressure for that paragraph.

## What this vision is *not*

- Not a coding bot.
- Not a Discord bot.
- Not a docs site, despite the atlas surface looking like one.
- Not a hosted SaaS chat product (org/space/peer model implies multi-host).
- Not "yet another AI agent framework" — agents are participants in a
  workspace, not the product.

## What this vision is *bound by*

The canonical rule, carried forward verbatim from the EMA daemon's own
`AGENT-CONTRACT.md`:

> **EMA owns truth. Hermes owns execution. Surfaces do not own state.**

Every architectural decision documented in this repo can be traced back
to that rule. If a proposal seems to violate it, the rule wins — file a
question against [`OPEN_QUESTIONS.md`](OPEN_QUESTIONS.md) before "fixing".

## What's not yet decided

The vision is settled. The implementation choices that realize it are
not. The 10 questions in [`OPEN_QUESTIONS.md`](OPEN_QUESTIONS.md) are
where the vision meets unresolved implementation pressure.

## The atlas as expression

The repo is now also the **EMA Atlas** Next.js app
([`README.md`](README.md), [`ATLAS_NOTES.md`](ATLAS_NOTES.md)). The atlas
is the deliverables hub for the prep stage — it presents the vision, the
parts, three competing futures per part, the open questions, and the
graph that connects them. It is not a deflection from building EMA — it
is part of the build. The atlas exists so the build doesn't lose the
shape.

## When v0.0.3 arrives

The next concrete implementation lands in `TrajanWJ/ema` as v0.0.3 on
**Gleam/BEAM**. See [`EMA_V0_0_3_PREP.md`](EMA_V0_0_3_PREP.md) (in
progress) for the prep spec. Until then, this atlas is the primary surface
through which the vision is expressed.

## See also

- [`AGENT_QUICKREF.md`](AGENT_QUICKREF.md) — single-page everything
- [`MACBOOK_AGENT_HANDOFF_MASTER.md`](MACBOOK_AGENT_HANDOFF_MASTER.md) — full passover brief
- [`05-fresh-context-project-app-model.md`](05-fresh-context-project-app-model.md) — newest user PRD framing
- [`SYSTEM_GRAPH.md`](SYSTEM_GRAPH.md) — lineage map
