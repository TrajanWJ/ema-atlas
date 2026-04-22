---
title: EMA P2P Organization Mesh
created: '2026-04-01'
type: knowledge
status: idea
category: architecture
tags:
  - ema
  - p2p
  - mesh-network
  - distributed-ai
  - organization-os
  - local-first
related:
  - '[[Codebases/EMA]]'
  - '[[Architecture/EMA Dual Backend Architecture]]'
  - '[[Architecture/EMA Claude Bridge Design]]'
wiki_id: system/architecture/EMA_P2P_Organization_Mesh
imported_from: vault/Architecture/EMA P2P Organization Mesh.md
imported_at: '2026-04-04T00:23:56.747Z'
summary: ''
---

# EMA P2P Organization Mesh

## Concept

Multiple EMA instances running across an organization form a **peer-to-peer mesh network** — no central server required. Each user runs their own local-first EMA instance, and nodes connect directly to each other to share data and distribute load.

## Core Value Proposition

Transforms EMA from a **personal OS** (one person's executive layer) into an **organizational OS** (a team's shared intelligence layer) while preserving local-first privacy guarantees.

## Key Capabilities

### Shared Data Sync
- Projects, proposals, and vault notes can be selectively shared across mesh nodes
- No central database or cloud dependency
- Each node controls what it shares and with whom
- Conflict resolution handled at the data layer (CRDTs likely)

### Distributed AI Call Load
The killer feature: **rate-limited nodes route Claude CLI calls through other mesh nodes**.
- If Node A hits Claude API rate limits, it can delegate inference to Node B
- Dramatically reduces the effective rate limit for power users on a team
- Each node's API credentials are never exposed — only results are shared
- Naturally incentivizes mesh participation (you gain capacity by providing capacity)

## Why This Is Interesting

Most "local-first" tools stop at sync. This goes further: the mesh becomes a compute substrate. AI calls are the expensive, rate-limited resource — distributing them across nodes is a genuine unlock that no current personal productivity tool offers.

The organizational angle also makes EMA a viable team product without the privacy/trust compromises of a hosted SaaS platform.

## Open Design Questions

1. **Discovery:** How do nodes find each other? mDNS on LAN? Manual invite codes? A lightweight rendezvous server?
2. **Trust model:** How does a node verify it's talking to a legitimate EMA peer and not a bad actor?
3. **AI delegation protocol:** What's the API contract? Does the delegating node send the full prompt, or just a task ID?
4. **Privacy of delegated calls:** When Node A delegates to Node B, does Node B see the full prompt content?
5. **Incentive alignment:** Is capacity sharing voluntary, automatic, or governed by some accounting mechanism?
6. **Partial mesh:** What happens when only some team members are running EMA? Graceful degradation needed.

## Relationship to Current EMA Architecture

Current EMA (as of 2026-04-01):
- Single-user Tauri desktop app
- Elixir/Phoenix daemon (local only)
- 15 apps, 114+ API routes, 16 WebSocket channels
- Claude Code runner built in

P2P mesh would be a **major new layer** on top of the existing architecture — the daemon would gain a peer discovery + sync module, and the Claude Bridge would gain a delegation protocol.

## Status

Concept only. Trajan had Claude write up the initial vision doc during an EMA session (~2026-04-01 UTC). No design doc, no implementation. Worth exploring as a long-term EMA roadmap item.

---
*Captured from session memory (2026-04-01) — concept surfaced during EMA development work.*
