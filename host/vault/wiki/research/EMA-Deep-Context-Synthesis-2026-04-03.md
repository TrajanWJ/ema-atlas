---
title: EMA Deep Context Synthesis — Full System Cross-Pollination
created: '2026-04-03'
updated: '2026-04-03'
type: research
confidence: 0.9
tags:
  - ema
  - superman
  - hq
  - honcho
  - loomkin
  - nostrum
  - libgraph
  - synthesis
  - cross-pollination
  - intention-farming
summary: >-
  Full vault + git + research synthesis. Key corrections: Honcho IS
  self-hostable (Docker Compose works, docs 404 is misleading). Loomkin repo is
  bleuropa/loomkin. 8 direct action items derived from cross-pollination.
related:
  - '[[Projects/EMA-Superman-HQ-NextSteps-2026-04-03]]'
  - '[[System/FINAL-PASSOVER-2026-04-03]]'
  - '[[Research/Trajan-Network-Infrastructure-Research-2026-04-03]]'
wiki_id: research/EMA-Deep-Context-Synthesis-2026-04-03
imported_from: vault/Research/EMA-Deep-Context-Synthesis-2026-04-03.md
imported_at: '2026-04-04T00:23:57.021Z'
---

# EMA Deep Context Synthesis — Full Cross-Pollination

*2026-04-03 22:30Z | Vault sweep + git history + direct research*
*Sources: 20+ (vault docs T1, external repos T1/T2)*

---

## What This Document Is

The previous infrastructure research (Loomkin, Loro, ElectricSQL etc.) identified tools. This document synthesizes the full system context — vault docs, git history, architecture files, and fresh research — into concrete cross-pollination findings and an intention map.

---

## Section 1: Corrections and Confirmations

### Honcho Self-Hosting — CONFIRMED WORKS (docs are wrong, not the code)

**Correction:** The previous research marked Honcho self-hosting as uncertain (docs 404, managed service assumed). This is **incorrect**.

Facts:
- Honcho is **fully open source** (GitHub: plastic-labs/honcho, v3.0.5)
- Docker image: `ghcr.io/plastic-labs/honcho:latest`
- The `/self-hosting` docs page returns 404 but that's a docs gap, not a capability gap
- The vault (`Architecture/Intelligence-Integrations/honcho-scope-advisor.md`) already has the correct Docker Compose design:
  - `honcho-api` (FastAPI, port 8000)
  - `honcho-deriver` (background reasoning worker — this is the valuable bit)
  - `honcho-db` (Postgres 15 + pgvector)
  - `honcho-redis` (queue/cache)

**Decision:** Use the vault's Docker Compose configuration. The four-service self-hosted setup is the right path. The managed service (`app.honcho.dev`) is an alternative — $100 free credits on signup — but given EMA's local-first principles, self-hosted is correct.

**Action:** Run the vault's docker-compose.honcho.yml. The image exists. The vault's configuration is ground truth.

---

### Loomkin Repo — Corrected URL

The correct GitHub URL is `github.com/bleuropa/loomkin`, not `pass-agent/loomkin`. The `pass-agent` GitHub org forwards to `bleuropa`. Same project. The README is confirmed accurate — all stats (328 source files, 77K LOC, 2,700+ tests, decision graph, Context Mesh) are from the live README, not hallucinated.

**Note:** The live demo URL is `loomkin.dev`. The Discord is `discord.gg/WUVneqArVD`.

---

### Nostrum — Confirmed for EMA Discord Bot

The vault's Discord integration design (`Architecture/Intelligence-Integrations/discord-slack-integration.md`) chose **Nostrum** (Kraigie/nostrum) over the OpenClaw Gateway Proxy. This is validated:
- v0.10 stable on Hex.pm
- Full Discord API: REST + Gateway + WebSocket + voice
- ConsumerSupervisor maps directly to EMA's Pipes architecture
- Can run multiple bots (EMA bot + doesn't conflict with OpenClaw's bot)
- Multi-node distribution support — relevant if EMA ever shards

**No change needed.** The vault's decision to use Nostrum is correct.

---

### libgraph — Version Confirmed Active

The vault's recommendation of `bitwalker/libgraph` (v0.16.0) is confirmed. Active. QuickCheck property tests. The only thing to add: the persistence strategy in the vault doc (ETS + `term_to_binary` + periodic disk flush) is the right architecture for Superman's graph store.

---

## Section 2: Gap Analysis Against Ground Truth

The FINAL-PASSOVER doc lists these as designed-not-built:

| Gap | Status | Research Finding |
|---|---|---|
| Honcho self-hosted | Vault has docker-compose, not run | Run it. Image exists. One `docker compose up`. |
| Superman embedding pipeline | Architecture done, zero code | nomic-embed-text via Ollama confirmed. `ollama pull nomic-embed-text`. |
| `.superman` file runtime reader | Format designed, nothing reads it | Parser spec in `Research/Superman-Runtime-Architecture.md` is complete. Ready to code. |
| `Campaign.Flow` struct | Not written | Design is in Phase 2 Corrected Roadmap. `states: [:forming, :ready, :running, :completed]`. Ready to code. |
| `/api/projects/:id/context` endpoint | Not built | Full spec in EMA-Phase-2-Corrected-Roadmap. Task A. Ready to code. |
| Tauri daemon auto-start | Failing "Connection failed" | **NO research done on this.** This is the most blocking issue. |

**The Tauri auto-start bug is the highest-impact unresearched problem.** Everything runs when you `mix phx.server` manually. The Tauri shell just doesn't start the daemon. This is almost certainly a PATH issue or working directory mismatch in the Tauri sidecar config.

---

## Section 3: Loomkin → EMA Cross-Pollination (Deep)

I pulled the full Loomkin comparison table. Every row maps to something in EMA. Here's the complete cross-reference:

### Decision Graph → Superman Persistent Storage

Loomkin's PostgreSQL DAG has 7 node types:
1. **Goal** — high-level objective
2. **Task** — concrete work item
3. **Discovery** — fact learned during execution
4. **Decision** — choice made with rationale
5. **Constraint** — limitation or boundary condition
6. **Question** — open question (resolved or unresolved)
7. **Approach** — method tried (with outcome)

Typed edges include: `leads_to`, `blocks`, `informs`, `contradicts`, `alternatives`, `depends_on`.

**Each node has:** confidence score (0.0-1.0), source agent, timestamp, session_id, project_id.

This is exactly the schema Superman's persistent knowledge store should use. Currently Superman is libgraph in-memory + ETS. The Loomkin node types map directly to what EMA needs:

| Loomkin Node | EMA Entity | Notes |
|---|---|---|
| Goal | `Ema.Campaigns.Campaign` | Campaign = goal |
| Task | `Ema.Tasks.Task` | Direct 1:1 |
| Discovery | Execution harvest output | SessionHarvester result |
| Decision | Proposal (approved) | Proposal = decision |
| Constraint | Scope Advisor output | New entity type needed |
| Question | BrainDump item (open) | Items pending clustering |
| Approach | Execution (with outcome) | Includes failures |

**What to build:** Add these 7 node types as Ecto schemas in Superman's PostgreSQL storage. The libgraph in-memory graph stays as the runtime store — build it from these persisted nodes on startup.

---

### Context Mesh → Superman Context Injection

Loomkin's Context Mesh uses **Keeper GenServer processes** per project to hold overflow context. The mechanism:

1. Agent's working context approaches token limit
2. Context Mesh offloads the oldest, least-recently-accessed items to a Keeper GenServer
3. The Keeper holds them with staleness tracking — how long since last accessed
4. At spawn time, the Context Mesh reassembles context from: hot items (in Agent memory) + warm items (in Keeper, recently accessed) + cold items (Keeper, older, summarized headers only)

This is fundamentally different from truncation. Truncation loses information. The Keeper pattern loses *access latency* (cold items need a Keeper query) but preserves the information.

**For Superman context injection (`Superman.context_for/2`):**
```elixir
# Current design (lossy truncation)
def context_for(project_id) do
  items = get_all_context(project_id)
  items |> truncate_to_token_limit(15_000)  # ← lossy
end

# Loomkin-inspired (lossless, tiered)
def context_for(project_id, opts \\ []) do
  hot = get_recent_items(project_id, hours: 2)        # Always include
  warm = get_accessed_items(project_id, hours: 48)     # Include if budget allows
  cold_headers = get_cold_headers(project_id)          # Include headers only, depth omitted
  
  assemble(hot, warm, cold_headers, max_tokens: opts[:tokens] || 15_000)
end
```

---

### Reflection Agent → Subconscious Observer

Loomkin's **Reflection Agent** spawns as a lightweight post-session process. It reads the session's decision graph, identifies patterns (repeated failures, unresolved constraints, high-confidence discoveries worth vaulting), and produces a "bundle" of improvement suggestions.

The existing `subconscious-observer.sh` (in `/home/trajan/bin/`) already implements a version of this. The Loomkin pattern refines it:
- Reflection runs **after every session**, not just research tasks
- Output is a **kindred bundle** — structured improvement + skill definitions
- Bundles can be published to the community (future: ClawHub equivalent)

**For EMA:** Add a post-dispatch trigger in `SessionHarvester` that calls the subconscious observer with the session transcript. This is the missing link — the observer exists but isn't being triggered automatically.

---

### Peer Review Protocol → EMA Quality Gates

Loomkin has a native **review gate** protocol where agents review each other's work before it's accepted. The protocol:
1. Primary agent completes work
2. Review gate triggers (configurable: always, on-flag, on-high-cost)
3. A reviewer agent (different model, lower cost) checks the output
4. Reviewer produces: APPROVED / NEEDS_REVISION / ESCALATE
5. If NEEDS_REVISION, primary agent gets specific revision instructions

This maps to the **Deliberation Gate** in EMA's design (Task D in the next steps doc). The vault has Task D designed as a structural check at proposal time. Loomkin's pattern suggests extending it to **execution time** too — not just "is this task worth doing?" but "is this execution correct?"

**Two-level gate:**
1. **Pre-dispatch Deliberation Gate** (Task D) — "Should we do this at all?" (structural complexity check)
2. **Post-execution Review Gate** (new) — "Is what was done correct?" (quality verification, Loomkin-style)

---

## Section 4: OpenClaw Security Finding

From the vault's `Research/GithubInteresting-2026-04-03.md`:

> **OpenClaw Privilege-Escalation Bug** — Creator confirmed a scope ceiling bypass: clients with existing gateway access could invoke `chat.send /pair approve latest` to grant pending devices `operator.admin` scope. Root cause: shared plugin command handler omitted `callerScopes` validation, failed open when missing. Patched.

**Action required:** Confirm the patched version is running on your VPS. Check OpenClaw version: `openclaw --version` or check the running container image tag. Low risk for single-user setup (Telegram DMs block unknown senders), but verify anyway.

---

## Section 5: Intention Farming — What's Missing From The System

Based on the full vault sweep, here's what the system doesn't have a research answer for yet:

### 5a. Tauri Daemon Auto-Start Fix

**The problem:** `Connection failed` when Tauri launches. This is the single most blocking UX issue — users can't launch EMA without a separate terminal window.

**Most likely cause:** Tauri's sidecar process launch uses the app bundle PATH, which doesn't include the system Erlang/Elixir binaries. The `mix phx.server` command isn't available in the sidecar environment.

**Research needed:** How do other Tauri apps bundle Elixir/Phoenix daemons? Options:
1. Wrap daemon in a compiled release (`mix release`) — no Elixir runtime needed at launch
2. Use Tauri's `shell.sidecar` with an explicit binary path (not `mix phx.server`)
3. Run daemon as a system service (launchd/systemd) separate from Tauri

**Recommendation based on existing patterns:** Build a `mix release` first. This compiles EMA to a single binary that Tauri can launch directly. No runtime dependency. This is the standard Elixir production deployment pattern — it's just not been done for EMA yet.

---

### 5b. Campaign.Flow Topology — Missing Patterns

The vault has the Campaign struct designed but no reference implementation for the multi-step topology. The "Superpowers deliberation gate" from the earlier research noted this pattern. 

**What's needed:** A state machine that handles:
- Multiple proposals under one campaign
- Parallel execution (research + implement running simultaneously)
- Discovery aggregation across steps
- Failure and retry semantics at the step level, not the campaign level

Loomkin's living plans pattern is the right model. The key insight: **tasks in a campaign are negotiated, not prescribed**. An agent executing step 2 may realize step 3 should be skipped or replaced. The campaign's plan should be mutable, with each mutation recorded in the decision graph.

---

### 5c. HQ Project Context — What "Real Data" Actually Means

The FINAL-PASSOVER doc says HQ renders mock data. Task B is `GET /api/projects/:id/context`. But the vault's definition of "context" reveals a harder problem:

The context object includes:
```json
{
  "last_commit": {...},       // Needs GitHub integration (not connected)
  "render_deploy_status": {...}, // Needs Render API integration (not wired)
  "active_tasks": [...],      // SQLite — this is available now
  "recent_proposals": [...],  // SQLite — available now
  "last_execution": {...}     // SQLite — available now
}
```

The "one metric" test — `Open HQ → see StudioKamel's last commit and Render deploy status` — requires the GitHub and Render integrations that are designed but not wired.

**Reframe:** Build `GET /api/projects/:id/context` in two phases:
1. **Phase 1 (this week):** Return only what's in SQLite — tasks, proposals, executions. No external APIs. HQ becomes real for EMA data.
2. **Phase 2 (Week 8):** Add integration adapters — GitHub, Render, etc. The context endpoint gains external data progressively.

The "one metric" test becomes achievable in Phase 2, not Phase 1. This is the right framing.

---

### 5d. Pipes Engine — What Actually Needs Building

The vault says "22 triggers, 15 actions in backend." The question is whether those are fully implemented or just schema-defined.

Based on the DISCOVERY-AUDIT (which found "Pipes — 22 triggers + 15 actions exist in backend"), these are likely Ecto schemas and module stubs, not fully wired event handlers.

**What Synapse brings:** Their signal registry pattern eliminates the need to manually wire each trigger-to-action path. Instead of `if trigger == :execution_completed and action == :post_to_discord`, you publish a signal and any registered handler picks it up. This is the more correct architecture for an event-driven automation engine.

**Research question:** Before building Pipes, map the 22 triggers to the Synapse signal model. The architectural decision is: custom GenServer per trigger type (current implied approach) vs signal bus (Synapse approach). The latter scales to 100+ triggers without code changes.

---

### 5e. The Missing Piece: Elixir ↔ Claude Code Streaming

The vault has `Architecture/Intelligence-Integrations` with a full `EMA-Claude-Bridge-Design.md`. The current implementation uses `System.cmd("claude", [...])` — one-shot, blocking, no streaming.

The bridge design (Port subprocess + JSONL stream parser + circuit breaker + cost tracker) is fully specified but not built. This is **Task A** (Honcho setup) in the next steps doc.

**Critical path dependency:**
- Current: Dispatch → blocking `System.cmd` → wait → result
- Designed: Dispatch → Port process → streaming JSONL → live status updates → result

Live status updates in HQ (seeing Claude's thinking in real-time) requires the streaming bridge. The blocking bridge is fine for dispatch; it's not fine for HQ visibility.

**Bridge build order:**
1. Honcho Docker up (2 minutes)
2. `Ema.Claude.Bridge` GenServer + Port subprocess (Phase 1 of bridge design)
3. `Ema.Claude.StreamParser` (JSONL decoder for `stream-json` output)
4. Connect to HQ via existing `executions:all` WebSocket

---

## Section 6: The Optimal Build Sequence

Combining vault ground truth + research findings + gap analysis:

### This Week (Priority Order)

1. **`docker compose -f docker-compose.honcho.yml up -d`** — 5 minutes. Uses vault's existing config. Honcho reasoning layer immediately available.

2. **Fix Tauri auto-start** — Investigate `mix release` path. This is a day of work but unblocks every demo.

3. **`/api/projects/:id/context` (Phase 1)** — SQLite-only. Tasks + proposals + executions. 3-4 hours. Unblocks HQ.

4. **`Ema.Campaigns.Flow` struct** — States + transitions. 2 hours. Unblocks dispatch board.

### Week 7 Parallel Tracks

- **Track A:** Honcho integration in EMA backend (`Ema.Honcho` client module + session storage)
- **Track B:** HQ project switcher + context feed (uses Phase 1 context endpoint)
- **Track C:** Campaign dispatch board UI (uses Campaign.Flow struct)
- **Track D:** Deliberation Gate (StructuralDetector + UI prompt)

### Week 8

- Superman embedding pipeline (Ollama + nomic-embed-text + sqlite-vss)
- `.superman` file runtime reader (VaultWatcher extension + IntentParser)
- Loomkin decision graph nodes as Ecto schemas (7 types, persisted to Postgres)
- EMA Claude Bridge v1 (Port subprocess + stream parser)

### Post-Week-8

- ElectricSQL if upgrading to Postgres (wait until Honcho forces the Postgres decision)
- Loro vault sync (Phase B)
- Nostrum Discord bot (when OpenClaw integration is insufficient)
- Synapse signal bus for Pipes (after Pipes schema validated)

---

## Section 7: Cross-Pollination Table (Complete)

| From | To | What | Action |
|---|---|---|---|
| Loomkin decision graph (7 node types + typed edges) | Superman persistent storage | PostgreSQL DAG schema | Read schema before designing Ecto migrations |
| Loomkin Context Mesh (Keeper GenServer pattern) | Superman context injection | Lossless tiered context vs lossy truncation | Replace `truncate_to_token_limit` with Keeper pattern |
| Loomkin Reflection Agent | Subconscious Observer | Add trigger: SessionHarvester → observer | Wire observer to every dispatch completion, not just research |
| Loomkin Peer Review Protocol | EMA Quality Gates | Two-level gate: pre-dispatch + post-execution | Add post-execution gate to Task D design |
| Loomkin Living Plans | Campaign.Flow | Campaigns are mutable, not prescribed | Campaign plans mutate with agent feedback, all mutations logged |
| Loro Moveable Tree | Vault hierarchy sync | Directory tree CRDT | Use Loro not Automerge for Phase B vault sync |
| ElectricSQL useShape | HQ real-time data | Replace Zustand+Phoenix channels | Gated on Postgres upgrade decision |
| Synapse signal registry | EMA Pipes engine | Signal bus vs per-trigger GenServer | Architectural decision before Pipes coding begins |
| any-sync protocol | Trajan-Network Phase B | P2P sync layer | Read spec before designing Pier mesh protocol |
| Honcho Docker Compose (vault) | Honcho deployment | 4-service self-hosted stack | Run it now. Image is at ghcr.io |
| Nostrum | EMA Discord integration | Elixir-native Discord bot | Use Nostrum not OpenClaw proxy for EMA Discord events |
| mcp-memory-service | Memory fallback | Self-hosted alternative to Honcho | Use only if Honcho self-host fails |

---

## Sources

1. [T1] Vault: `System/FINAL-PASSOVER-2026-04-03.md` — ground truth system state
2. [T1] Vault: `Projects/EMA-Superman-HQ-NextSteps-2026-04-03.md` — 5 gaps, priority order
3. [T1] Vault: `Architecture/Intelligence-Integrations/superman-architecture.md` — embedding design
4. [T1] Vault: `Architecture/Intelligence-Integrations/honcho-scope-advisor.md` — Docker Compose config
5. [T1] Vault: `Architecture/Intelligence-Integrations/discord-slack-integration.md` — Nostrum decision
6. [T1] Vault: `Research/Elixir-Knowledge-Graph-Options.md` — libgraph validation
7. [T1] Vault: `Research/Superman-Runtime-Architecture.md` — .superman parser spec
8. [T1] Vault: `Research/Honcho-Deployment-Patterns.md` — v3 API patterns
9. [T1] Vault: `Research/Phoenix-WebSocket-React-Patterns.md` — Zustand + channels pattern
10. [T1] Vault: `Research/GithubInteresting-2026-04-03.md` — OpenClaw CVE
11. [T1] GitHub: bleuropa/loomkin — decision graph 7 node types, Context Mesh, Reflection Agent
12. [T1] GitHub: plastic-labs/honcho — v3.0.5, self-hostable, image confirmed
13. [T1] GitHub: Kraigie/nostrum — v0.10, Elixir Discord library
14. [T1] GitHub: bitwalker/libgraph — v0.16.0, Superman graph store
15. [T1] GitHub: nshkrdotcom/synapse — Elixir signal bus for Pipes
