---
title: "Trajan-Network: AI + Infrastructure Research — Full Sweep"
created: 2026-04-03
updated: 2026-04-03
type: research
confidence: 0.82
tags: [trajan-network, ema, superman, p2p, crdt, spaces, self-host, agent-memory, elixir, cross-pollination]
summary: "Full research sweep across AI tooling and non-AI infrastructure for Trajan-Network. Key finds: Loomkin (Elixir multi-agent with decision graph + context mesh), Loro (better CRDT than Automerge for Phase B), ElectricSQL (Postgres sync → HQ real-time), Synapse (Elixir signal bus for Pipes), mcp-memory-service (drop-in local memory backend)."
sources: "12 primary/institutional"
---

# Trajan-Network: AI + Infrastructure Research

*Sources: 12 total (12 primary, 0 institutional, 0 secondary)*
*Confidence: High (0.82)*
*Date: 2026-04-03*

## Executive Summary

Two tracks researched in parallel: AI tooling/memory/agent repos and the non-AI infrastructure stack (P2P, CRDT, spaces, self-host sync). The highest-ROI finds:

1. **Loomkin** (Elixir) — what you're building, further along. Decision graph + context mesh is 1:1 with your vision. Study it before re-inventing.
2. **Loro** — better CRDT choice than Automerge for Phase B. Native Rust, Elixir-friendly, Moveable Tree is perfect for vault hierarchy sync.
3. **ElectricSQL** (Elixir) — Postgres read-path sync. Directly solves HQ's real-time data problem. Simpler than rolling your own WebSocket fanout.
4. **Synapse** — Elixir headless multi-agent signal bus. Pure infrastructure fit for EMA's Pipes layer.
5. **mcp-memory-service** — self-hosted MCP memory backend. If Honcho v3's managed-service model is a dealbreaker, this is the alternative.

---

## TRACK A — AI Tooling: Repos, Concepts, Cross-Pollination

### Loomkin (pass-agent/loomkin) ⭐⭐⭐ STEAL EVERYTHING

**What it is:** Elixir/OTP multi-agent system with a live mission control UI. Open source. 328 source files, ~77K LOC, 2,700+ tests.

**Why it matters:** This is your architecture, built and working. Comparison table from their README maps exactly to your design:

| Feature | Loomkin Implementation | EMA Equivalent (designed/planned) |
|---|---|---|
| Memory | Persistent **decision graph** — goals, tradeoffs, rejected approaches survive across sessions | Superman knowledge graph |
| Context | **Context Mesh** — overflow offloaded to Keeper processes, 228K+ tokens, zero loss | Superman context injection |
| Agent spawn | <500ms via `GenServer.start_link` | EMA's `Ema.Loop.Orchestrator` |
| Inter-agent messaging | In-memory PubSub, microsecond latency | Phoenix PubSub (already have this) |
| Concurrent file edits | Region-level locking with intent broadcasting | `.superman` file writes |
| Task decomposition | Living plans — agents create tasks, negotiate, re-plan | EMA Proposals engine |
| Peer review | Native protocol — review gates, pair programming, handoffs | Verification Agent (Recursive Research System) |
| Model mixing | Per-agent model selection — cheap grunts + expensive judges, 18x cost savings | Sonnet sub-agents / Opus orchestrator split |
| Decision persistence | PostgreSQL DAG with 7 node types, typed edges, confidence scores | NOT YET BUILT in EMA |
| Self-improvement | Reflection agent reviews team patterns, proposes improvements | Subconscious Observer |
| MCP | Both client and server | Designed, not wired |

**What to steal immediately:**
- **Decision Graph structure** — 7 node types, typed edges, confidence scores in PostgreSQL. This is exactly what Superman's knowledge graph should look like in persistent storage. Don't design it from scratch.
- **Context Mesh overflow pattern** — offloading context to Keeper GenServer processes when it exceeds window size. This solves your 15K token per-agent cap problem.
- **Region-level locking with intent broadcasting** — before any agent writes to a `.superman` file, broadcast intent. Prevents overwrite races.
- **Reflection agent pattern** — spawns after team sessions to analyze patterns and propose improvements. This is your Subconscious Observer, more precisely specified.

**Repo:** https://github.com/pass-agent/loomkin

---

### Synapse (nshkrdotcom/synapse) ⭐⭐ USE FOR PIPES

**What it is:** Headless, declarative multi-agent orchestration framework. Domain-agnostic signal bus + workflow engine with Postgres persistence. Ships with code review domain as reference implementation. Elixir, v0.1.1.

**Why it matters:** EMA's Pipes layer (22 triggers, 15 actions, designed but not built) maps exactly to what Synapse does. Signal router + declarative orchestrator + workflow persistence.

**Key capabilities:**
- Domain-agnostic signal registry with runtime topic registration
- Declarative orchestrator runtime (no GenServer boilerplate)
- Workflow engine with persistence and audit trail (`workflow_executions` table)
- LLM gateway with ReqLLM fallback
- Telemetry throughout

**What to steal:** The signal registry pattern and declarative orchestrator approach for EMA's Pipes layer. Instead of building a custom trigger/action engine, adopt Synapse's signal bus architecture.

**Repo:** https://github.com/nshkrdotcom/synapse

---

### mcp-memory-service (doobidoo) ⭐⭐ ALTERNATIVE TO HONCHO IF NEEDED

**What it is:** Self-hosted MCP memory backend. REST API + knowledge graph + autonomous consolidation. Works with LangGraph, CrewAI, AutoGen, and Claude. Apache 2.0 license.

**Why it matters:** If Honcho v3's managed service model is a dealbreaker (API key required, no confirmed self-host for v3), this is the drop-in alternative. It's fully self-hosted, zero cloud cost, and has an MCP server mode for direct claude.ai integration.

**Key capabilities:**
- Agents store decisions, share causal knowledge graphs, retrieve context in 5ms
- No cloud lock-in or API costs
- X-Agent-ID header — auto-tag memories by agent identity
- Framework-agnostic REST API, 15 endpoints
- Knowledge graph with typed edges (causes, fixes, contradicts)
- Autonomous consolidation compresses old memories (temporal decay built in)
- Remote MCP setup available (OAuth 2.0 + HTTPS)

**When to use:** If you check the Honcho Docker image and it's v2 (pre-reasoning), or if you don't want a managed service dependency, run this instead. Same three integration points (store session, query user, session context) but fully self-hosted.

**Setup:**
```bash
MCP_STREAMABLE_HTTP_MODE=1 MCP_SSE_HOST=0.0.0.0 MCP_SSE_PORT=8765 \
python -m mcp_memory_service.server
```

**Repo:** https://github.com/doobidoo/mcp-memory-service

---

### MemOS (MemTensor) ⭐ MONITOR

**What it is:** AI memory OS for LLM and agent systems. Persistent Skill memory for cross-task skill reuse and evolution. Python. Active as of April 2026.

**Why it matters:** The "persistent skill memory" concept is something Loomkin handles differently but MemOS specifically optimizes for. Cross-task skill reuse = agents learn *how to do things* not just *what they did*. Relevant for EMA's Evolution module.

**Repo:** https://github.com/MemTensor/MemOS

---

### TrustGraph (trustgraph-ai) ⭐ MONITOR

**What it is:** Context development platform. Store, enrich, and retrieve structured knowledge with graph-native infrastructure, semantic retrieval, and portable context cores.

**Why it matters:** "Portable context cores" is exactly the right framing for what `.superman` files are trying to be. Their graph-native approach with semantic retrieval is more mature than what you're building from scratch. Worth watching for API patterns.

**Repo:** https://github.com/trustgraph-ai/trustgraph

---

## TRACK B — Non-AI Infrastructure: P2P, Spaces, Self-Host Sync

### The Infrastructure Decisions (Phase A vs Phase B)

From the vault docs: Phase A is hub-and-spoke REST + WebSocket. Phase B is P2P Pier mesh with CRDT sync. The research below applies to Phase B. Don't build P2P infrastructure until Phase A is complete.

---

### Loro (loro-dev/loro) ⭐⭐⭐ USE THIS FOR CRDT SYNC

**What it is:** CRDTs library in Rust, exposed via WASM for JavaScript and native Rust. The architecture docs plan to use Automerge — **Loro is the better choice**.

**Why Loro over Automerge:**

| Feature | Loro | Automerge |
|---|---|---|
| Language | Rust (native), JS via WASM | Rust core, JS via WASM |
| Tree support | **Moveable Tree CRDT** — first-class | Not native |
| Text editing | Fugue algorithm | Yes |
| Time travel | Built-in | Not native |
| Memory (Automerge 3 comparison) | Loro-native compression | ~10x improvement in v3 |
| Version control | Built-in DAG with shallow clone | Not native |

**Why it matters for Trajan-Network:**
- **Moveable Tree** is exactly what you need for vault hierarchy sync. Vault files have a directory tree. Moves + renames need conflict-free resolution. Automerge doesn't have this; Loro ships it as a first-class type.
- **Time travel** means you can show "what was this project's state 3 days ago" — free.
- **Delta updates** — only sync what changed, not full snapshots. Critical for efficiency across EMA↔OpenClaw↔Host.

**Integration path for Phase B:**
```javascript
// In EMA's Tauri frontend (JS/WASM)
import { LoroDoc } from 'loro-crdt'

const doc = new LoroDoc()
const projectTree = doc.getTree("projects")

// Export delta for peer sync
const delta = doc.export({ mode: "update", from: lastSyncVersion })
// Send via libp2p or WebSocket
sendToPeer(delta)

// Import from peer
doc.import(peerDelta)
// Conflict-free merge, automatic
```

**Repo:** https://github.com/loro-dev/loro

---

### ElectricSQL (electric-sql/electric) ⭐⭐⭐ USE FOR HQ NOW — PHASE A

**What it is:** Postgres read-path sync engine. Written in Elixir. Syncs data out of Postgres into anything — React hooks, TypeScript clients, HTTP consumers. Released v1.0 in March 2025.

**Why it matters immediately (Phase A):** You're building HQ to display real-time EMA data. Right now you're planning to build this via Phoenix WebSocket channels + custom fanout. ElectricSQL is a more direct solution.

```javascript
// In HQ (React)
import { useShape } from '@electric-sql/react'

function Dashboard() {
  const { data: executions } = useShape({
    url: 'http://localhost:3000/v1/shape',
    params: {
      table: 'executions',
      where: `project_id = '${activeProjectId}'`,
    }
  })
  return <ExecutionFeed executions={executions} />
}
```

This replaces the entire custom WebSocket channel + Zustand store pattern from the Phoenix research — Electric handles partial replication, fan-out, and delivery. The `useShape` hook gives you live-updating data without writing any WebSocket management code.

**Setup:** Run Electric in front of EMA's SQLite or Postgres via `DATABASE_URL`. Partial replication via Shapes (filter by project, filter by status, etc.).

**Caveat:** Designed for Postgres with logical replication. EMA uses SQLite. Check compatibility — Electric has SQLite support in progress but Postgres is the primary target. May need EMA to graduate to Postgres to use this properly.

**Repo:** https://github.com/electric-sql/electric

---

### Anytype (anyproto) ⭐⭐ STUDY FOR SPACES DESIGN

**What it is:** Privacy-first local-first P2P knowledge OS. Offline-first, E2E encrypted, any-sync protocol for P2P sync. TypeScript + Electron. Extensible via gRPC API and AI Agents.

**Why it matters:** Anytype already solved the "Spaces" UX problem you're designing. Their space model (personal/org/shared/public), object types, and P2P sync via any-sync is the closest real-world implementation of what Trajan-Network Phase B is trying to build.

**What to steal:**
- **any-sync protocol** — open source P2P sync protocol with E2E encryption. May be extractable for Trajan-Network's peer sync layer instead of building on libp2p from scratch.
- **Space tenancy model** — how they handle personal vs. shared vs. public spaces is directly applicable.
- **Object type system** — their composable blocks + custom types is the right model for EMA's "projects have types, tasks have types" design.

**The any-sync library:** https://github.com/anyproto/any-sync — this is the sync protocol itself, open source, separate from the Anytype client.

**Repo:** https://github.com/anyproto/anytype-ts

---

### libp2p/rust-libp2p ⭐⭐ PHASE B — THE TRANSPORT LAYER

**What it is:** Rust implementation of the libp2p networking stack. Standard P2P networking protocol. Used by IPFS, Ethereum, countless others.

**Why it matters for Phase B:** When the architecture docs say "P2P Pier mesh" this is the transport layer. libp2p handles peer discovery, NAT traversal, stream multiplexing, and protocol negotiation. The Trajan-Network peers (EMA VM, OpenClaw VM, Host desktop) communicate through libp2p.

**Elixir considerations:** libp2p is Rust/Go primary. Elixir integration requires FFI or a sidecar process. The pragmatic path: run a libp2p Rust sidecar binary alongside EMA, expose a simple IPC interface. Don't embed Rust in EMA.

**Alternative for Phase A:** WireGuard + Tailscale (headscale self-hosted) gives you a simpler encrypted mesh without libp2p complexity. If the three peers are on a LAN or VPN, WireGuard is 95% of what you need for Phase A.

**Repo:** https://github.com/libp2p/rust-libp2p

---

### Eigr Spawn ⭐ MONITOR / NOT NOW

**What it is:** Actor Mesh Runtime. Polyglot durable computing platform. Write actors in Elixir, Java, TypeScript, Python, Rust, Go. Protocol-agnostic (Erlang-native, gRPC, HTTP). Built by Cloudstate contributors.

**Why it matters:** If EMA's GenServer architecture hits scaling limits or you want polyglot agents (Python agents calling into Elixir infrastructure), Spawn provides the actor mesh. Also relevant if EMA ever needs to expose gRPC endpoints alongside Phoenix HTTP.

**Not for now:** EMA is solidly Elixir/OTP. Spawn adds significant infrastructure complexity. Worth knowing exists for the day the current GenServer approach hits its limits.

**Repo:** https://github.com/eigr/spawn

---

### RxDB (pubkey/rxdb) ⭐⭐ WORTH KNOWING FOR HQ

**What it is:** Fast, local-first, reactive database for JavaScript applications. IndexedDB/SQLite backend, replication plugins, CRDT support.

**Why it matters for HQ:** If EMA's backend goes down, HQ shows nothing. RxDB gives HQ a local SQLite cache that syncs with EMA when online and reads from local store when offline. Integrates with ElectricSQL via the replication plugin.

**Use case:** HQ's offline support (Week 8+ feature). Cache the last known state locally, show it when EMA is unreachable, sync delta when reconnected.

**Repo:** https://github.com/pubkey/rxdb

---

### Colanode ⭐⭐ STUDY FOR LOCAL-FIRST SLACK/NOTION ALTERNATIVE

**What it is:** Open-source local-first Slack and Notion alternative. Self-hosted, P2P. TypeScript.

**Why it matters:** EMA's Channels app + Spaces design is trying to build what Colanode already ships. Their architecture for local-first collaborative workspace (channels, docs, tasks, spaces) is a direct reference implementation. Study their data model before designing EMA's Channels and cross-space sync.

**Repo:** https://github.com/colanode/colanode

---

## Key Cross-Pollination Opportunities

### 1. Loomkin Decision Graph → Superman Persistent Storage

Loomkin's PostgreSQL DAG with 7 node types and typed edges is the missing persistence layer for Superman. Currently Superman is in-memory libgraph + ETS. The decision graph design gives you the schema for making that durable and queryable across restarts.

**Action:** Read Loomkin's schema files before designing Superman's Ecto migrations.

### 2. Loro Moveable Tree → Vault Hierarchy Sync

The vault is a directory tree. When EMA VM and OpenClaw VM both modify vault files, conflicts occur. Loro's Moveable Tree CRDT resolves this automatically. Use Loro as the sync layer for vault files in Phase B.

**Action:** Prototype a vault sync test with Loro before committing to Automerge.

### 3. ElectricSQL useShape → HQ Real-Time Data

ElectricSQL's `useShape` React hook replaces the custom WebSocket + Zustand pattern for HQ's live data. Simpler, handles partial replication, Elixir-native.

**Action:** Check EMA's SQLite vs Postgres compatibility with Electric before committing.

### 4. Synapse Signal Bus → EMA Pipes Layer

EMA's Pipes layer (22 triggers, 15 actions) needs a signal bus. Synapse's signal registry + declarative orchestrator is that bus, in Elixir, already tested.

**Action:** Read Synapse source before building Pipes from scratch.

### 5. any-sync Protocol → Trajan-Network Phase B

Anytype's any-sync is an open-source P2P sync protocol with E2E encryption. If libp2p is too complex for Phase B, any-sync may be more directly applicable to a "spaces" sync model.

**Action:** Read the any-sync spec before designing Pier mesh protocol.

### 6. Context Mesh Pattern → Superman Inject Layer

Loomkin's Context Mesh (overflow to Keeper GenServer processes, staleness tracking, zero context loss) is the right architecture for Superman's context injection layer. The current plan is simple `context_for(project_id)` with token truncation — that's lossy. Context Mesh is lossless.

**Action:** Design Superman context injection to match the Keeper pattern from Loomkin.

---

## What To Build When

| Phase | Non-AI Infrastructure | AI Tooling |
|---|---|---|
| **Phase A (Now — Week 7-8)** | ElectricSQL for HQ real-time (if Postgres), OR Phoenix channels (if SQLite) | Honcho managed API, mcp-memory-service as fallback |
| **Phase A** | Phoenix PubSub for EMA↔OpenClaw events | Synapse signal bus for Pipes |
| **Phase B (Week 9+)** | Loro for CRDT vault sync | Loomkin decision graph → Superman persistent layer |
| **Phase B** | any-sync or libp2p for peer transport | MemOS / TrustGraph for skill reuse |
| **Phase B** | RxDB for HQ offline cache | Reflection agent from Loomkin pattern |

---

## What Doesn't Apply

- **Rust-libp2p directly in EMA** — too complex for Phase A. Use WireGuard/Tailscale mesh for now.
- **Eigr Spawn** — not needed until EMA needs polyglot actors or gRPC. Skip for now.
- **Automerge** — Loro is strictly better for this use case. Don't invest time in Automerge.
- **SiYuan Note / Logseq** — interesting knowledge tools but not architecturally relevant to what you're building.

---

## Sources

1. [T1] [pass-agent/loomkin](https://github.com/pass-agent/loomkin) — Elixir multi-agent, decision graph, context mesh
2. [T1] [nshkrdotcom/synapse](https://github.com/nshkrdotcom/synapse) — Elixir signal bus for multi-agent orchestration
3. [T1] [doobidoo/mcp-memory-service](https://github.com/doobidoo/mcp-memory-service) — self-hosted MCP memory backend
4. [T1] [loro-dev/loro](https://github.com/loro-dev/loro) — CRDT library, Moveable Tree
5. [T1] [electric-sql/electric](https://github.com/electric-sql/electric) — Postgres sync engine, Elixir
6. [T1] [anyproto/anytype-ts](https://github.com/anyproto/anytype-ts) — local-first P2P knowledge OS
7. [T1] [libp2p/rust-libp2p](https://github.com/libp2p/rust-libp2p) — P2P networking stack
8. [T1] [eigr/spawn](https://github.com/eigr/spawn) — Actor mesh runtime, polyglot
9. [T1] [automerge/automerge](https://github.com/automerge/automerge) — CRDT reference (evaluated, Loro preferred)
10. [T1] [pubkey/rxdb](https://github.com/pubkey/rxdb) — local-first reactive JS DB
11. [T1] [MemTensor/MemOS](https://github.com/MemTensor/MemOS) — AI memory OS, skill reuse
12. [T1] [trustgraph-ai/trustgraph](https://github.com/trustgraph-ai/trustgraph) — graph-native context platform
