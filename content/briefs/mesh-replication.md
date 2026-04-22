# Mesh / Replication / Presence

## The frame

This part is the strategic P2P direction: how EMA grows beyond one
machine without losing the thread. It covers replication boundaries,
authority leases, peer placement, presence between humans and agents,
and what should converge versus what should remain explicitly
arbitrated. Under the canonical rule —
*EMA owns truth. Hermes owns execution. Surfaces do not own state.* —
the mesh introduces a new question: when there are *many* daemons, who
owns *which* truth, and on whose authority does it move?

The frame is constrained by `graph/edges/transport.md`:
*"Distributed semantics must not precede single-node clarity. Add
`placement` to every dispatch before implementing peer-remote drivers."*
This is the single hardest discipline in this part. Every vision below
respects that ordering — none of them recommends shipping a peer mesh
before the local model is crisp — but they differ sharply on what the
*first* mesh move should be, and what it must protect.

## What's already true

- Strategic P2P direction is confirmed in
  `MACBOOK_AGENT_HANDOFF_MASTER.md` §10 ("Current strategic direction
  is explicitly p2p-first / mesh-oriented") and §14 ("Why P2P").
- No code yet — `graph/edges/transport.md` Status: *"No code yet.
  Strategic future."* Capability locality is documented in
  `codebase-ema/code/ema/daemon/lib/ema/` via `AGENT-CONTRACT.md`.
- `Placement` as an explicit field on every dispatch is already
  canonical vocabulary (`GLOSSARY.md` Placement row,
  `graph/edges/transport.md`).
- Required identity separations (including `peer_id`) are listed in
  `02-project-transfer-brief.md` §11 — peer identity is reserved
  vocabulary even before mesh code exists.
- Routing prior art lives at
  `docs-host-vault-agent-modules-routing` (per
  `lib/ema-atlas.ts` part `branches`).
- Vault candidate terms in `GLOSSARY.md` describe a richer mesh model
  already explored in the host vault: **Ghost Space** (ephemeral
  cross-party collaboration with TTL and self-destruct semantics);
  **Distributed AI Delegation** (a rate-limited node routing inference
  through a peer's credentials, sharpening Placement semantics); and
  **MCP Gateway** (the daemon-side server that exposes EMA tools to
  external Claude agents — the outbound boundary that complements
  inbound Driver/Provider). All three are sourced from
  `docs-host-obsidian-vault/...`.

## What's still open

- **Q9: Replication boundary** — which records replicate P2P vs stay
  central. Status: *open, deliberately deferred*. Note in
  `OPEN_QUESTIONS.md`: *"must NOT be answered before Q1, Q2, Q3
  settle."* This is the gating question for everything else in this
  brief.
- Q1: agent identities first-class — without a settled agent identity
  model, peer-side attribution is undefined.
- Q2 / Q8: collaboration sync model — picks the convergence substrate
  (CRDT vs event-log vs hybrid) for any object that crosses peers.
- Which objects deserve CRDT-like convergence vs explicit sequencing
  (`lib/ema-atlas.ts` hard question 1 for this part).
- How much presence EMA should expose between humans and agents
  (hard question 3) — touches both UX and trust model.

## The three futures, expanded

### Narrow First Mesh (mesh-operator-cathedral)

Replication stays deliberately narrow at first: authority leases,
append-only logs, and a tiny set of replica-friendly collaboration
objects. EMA earns trust before it earns complexity. The first mesh
move is small enough to be obviously correct.

- **What this would force you to build first:** an authority-lease
  primitive (who currently holds write authority for object X, for how
  long, with what handoff semantics); append-only event-log
  replication that survives partition; a strict allow-list of
  replica-eligible object types (probably starting with workspace
  artifacts, not control-plane records).
- **What this would force you to give up:** any "everything just
  works peer-to-peer" narrative; the magical use cases that depend on
  Distributed AI Delegation or Ghost Spaces in v1.
- **Smallest provable slice:** two weeks to run two daemons that share
  one Project's workspace artifacts via append-only log replication
  with explicit authority lease — Daemon A holds write authority by
  default, Daemon B can request and receive it for a 30-second window,
  every transfer is an event-log entry. Nothing else replicates.

### Mesh as Lived Co-Presence (mesh-living-workspace)

Replication is framed through collaboration and co-presence rather than
infrastructure abstractions alone. Users understand the mesh through
shared rooms, shared documents, shared activity. **Ghost Space**
(vault-candidate, ephemeral with TTL and self-destruct) becomes the
emblematic surface — the mesh is something users *enter*, not
something they configure.

- **What this would force you to build first:** a presence model that
  shows who else is in a Space across daemons; a Ghost Space lifecycle
  (creation, TTL, expiry, key rotation, self-destruct); a CRDT
  substrate for the object types that live inside Ghost Spaces (Q8
  resolved at least for that subset).
- **What this would force you to give up:** clear separation between
  "looking at" and "participating in" — presence-heavy designs blur
  that line; the audit story for ephemeral spaces is harder by
  construction.
- **Smallest provable slice:** two weeks to spin up a Ghost Space
  spanning two daemons with a 24-hour TTL, one shared canvas
  collaborated on via Yjs, presence pills showing who is in the Space,
  and a self-destruct flow that emits a final attestation event to
  each participating daemon's local log before deleting Space state.

### Peer Commonwealth (mesh-mesh-commonwealth)

EMA becomes a true peer commonwealth with portable work, portable
memory, and relocatable authority. **Distributed AI Delegation**
(vault-candidate) is in scope: a rate-limited node routes inference
through a peer's credentials. **MCP Gateway** (vault-candidate) is the
outbound boundary that lets external Claude agents query EMA's tools
from a peer position. The mesh isn't a feature — it's the architecture.

- **What this would force you to build first:** Q9 *resolved* — an
  explicit catalog of which record types replicate, which stay central,
  and which are peer-leased; an MCP Gateway inside the daemon
  (matching the vault-candidate spec) so peer agents have a
  least-privilege query path; Distributed AI Delegation plumbing so a
  rate-limited daemon can borrow a peer's provider quota under
  capability lease.
- **What this would force you to give up:** the simplicity of "the
  daemon owns its truth" — every truth claim now needs a provenance
  story across peers; the ability to ship without solving secrets,
  conflict, jurisdiction, and governance.
- **Smallest provable slice:** two weeks to ship two daemons in
  separate Orgs, an MCP Gateway exposing one read-only tool
  (`vault.search`) from Org A to Org B's Claude agent, and one
  Distributed AI Delegation call where Org A's rate-limited daemon
  routes a single inference through Org B's provider credential under
  a 1-hour capability lease, every step logged on both sides.

## Decision pressure

1. **CRDT convergence vs explicit sequencing (Q9 dependency)** —
   Convergence wins offline UX; sequencing wins audit and
   conflict-free reasoning.
2. **Replicate workspace artifacts first vs replicate control-plane
   first (Q9)** — Workspace-first is safer; control-plane-first is
   what mesh execution actually needs.
3. **Ghost Spaces in v1 vs durable Spaces only** — Ghost Spaces unlock
   ephemeral collab patterns; durable-only keeps the lifecycle model
   tractable.
4. **MCP Gateway as peer boundary vs internal-only tool exposure** —
   Peer-facing Gateway enables federation; internal-only keeps the
   blast radius small.
5. **Distributed AI Delegation in v1 vs deferred** — In-v1 solves real
   rate-limit and credential-sharing pain; deferred avoids inheriting
   the hardest secrets-and-attribution problem first.
6. **Visible mesh vs invisible mesh** — Visible mesh teaches users
   what's happening; invisible mesh ships a softer product but hides
   trust boundaries until they fail.

## Read next

- `lib/ema-atlas.ts` — part `slug: "mesh-replication"`, visions
  `mesh-operator-cathedral`, `mesh-living-workspace`,
  `mesh-mesh-commonwealth`.
- `graph/edges/transport.md`
- `MACBOOK_AGENT_HANDOFF_MASTER.md` §10, §14
- `02-project-transfer-brief.md` §8, §11, §12 q5
- `docs-host-vault-agent-modules-routing` (routing prior art)
- `docs-host-obsidian-vault/.../EMA Mesh Architecture.md` (Ghost Space,
  Space typed taxonomy)
- `docs-host-obsidian-vault/.../EMA P2P Organization Mesh.md`
  (Distributed AI Delegation)
- `docs-host-obsidian-vault/.../Intelligence-Integrations/MCP-GATEWAY-ARCH.md`
  (MCP Gateway)
- `OPEN_QUESTIONS.md` Q9 (gating), and dependencies Q1, Q2, Q3, Q8
- `codebase-ema/code/ema/daemon/lib/ema/` (current single-node home for
  any future placement / replication code)
