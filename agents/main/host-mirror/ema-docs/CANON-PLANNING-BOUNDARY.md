# EMA Canon / Planning / Reality Boundary

Status: active operating rule
Date: 2026-04-13

## Executive rule

EMA must keep a hard distinction between:

1. **Canon truth**
2. **Planning / blueprint / intention-building**
3. **Implemented operational reality**
4. **The gap between them**

Agents must not collapse these into one storage plane.

## 1. Canon truth

Canon is the semantically authoritative target and ruling layer.

Canonical examples:
- `ema-genesis/canon/specs/*`
- `ema-genesis/canon/decisions/*`
- `ema-genesis/_meta/CANON-STATUS.md`
- other explicit canon rulings in `ema-genesis/_meta/*`

Canon answers questions like:
- what EMA is supposed to be
- which architectural direction wins when docs disagree
- which decisions are active and durable

Canon is **not** the place for:
- scratch planning
- active decomposition notes
- temporary implementation strategy
- session-local intention shaping
- unverified reality claims

## 2. Planning / blueprint / intention-building

This plane holds shaping information that helps move EMA forward without pretending to already be canon or reality.

Planning examples:
- `docs/BLUEPRINT.md`
- planning docs under `docs/planning/*`
- GAC / blueprint queue material
- explicit implementation plans
- aspiration capture and intention-building notes
- next-step operator handoff docs

Planning answers questions like:
- what should we build next
- how should we decompose the work
- what intent structure should exist
- what blueprint questions or blockers remain

Planning is **not** canon unless explicitly promoted.
Planning is **not** runtime truth unless verified in code/runtime/docs and promoted into operating-reality docs.

## 3. Implemented operational reality

This plane describes what is actually real now in the host system.

Reality examples:
- `docs/OPERATING-REALITY.md`
- `docs/GROUND-TRUTH.md`
- `docs/backend/*`
- active runtime code in `services/`, `workers/`, `apps/electron/`, `apps/renderer/`
- operational persistence in `~/.local/share/ema/ema.db`

Reality answers questions like:
- what is actually running
- what entities/services exist now
- what the current source-of-truth hierarchy is
- what interfaces can safely rely on today

Reality is **not** canon.
Reality is **not** planning.
Reality may lag canon or diverge from older plans.

## 4. Gap layer

The gap layer is the explicit delta between:
- canonical target
- current planning / blueprint
- implemented reality

This layer should be tracked on purpose.

Gap examples:
- implementation gaps
- canon/reality drift
- planning/reality drift
- unresolved design contradictions
- explicit boundary docs and reconciliation reports

The gap is not accidental noise. It is one of EMA's most important orientation layers.

## Promotion rules

### Planning -> Canon
Only promote planning material into canon when there is an explicit ruling / accepted decision / approved canonical update.

### Reality -> Canon
Reality does not automatically become canon just because it exists.
Implementation can inform canon, but canon changes require explicit promotion.

### Planning -> Reality
A plan becomes reality only after verification against current code/runtime/storage behavior.

## Agent rules

All agents working in EMA should follow these rules:

- Do not write plans or aspirations into canon files unless the task is explicitly canonical promotion.
- Do not treat planning docs as if they are already implemented truth.
- Do not treat current runtime behavior as proof that canon changed.
- When discussing a feature or subsystem, name which plane you are talking about: `canon`, `planning`, `reality`, or `gap`.
- If a statement mixes planes, separate it before continuing.

## Recommended shorthand

When writing updates, prefer labels like:
- `Canon:`
- `Plan:`
- `Reality:`
- `Gap:`

This keeps agent reasoning honest and reduces storage pollution.

## Current project implication

For the current EMA phase:
- `ema-genesis/` remains the canonical semantic target
- `docs/BLUEPRINT.md` and related planning docs are planning/intention-building surfaces
- `docs/OPERATING-REALITY.md`, `docs/GROUND-TRUTH.md`, and `docs/backend/*` describe current reality
- future work should explicitly maintain the gap between Genesis ambition and current TypeScript/Electron implementation
