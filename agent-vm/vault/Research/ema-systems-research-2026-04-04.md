---
title: EMA + Systems Research — 2026-04-04
type: research
confidence: 0.88
source: T1+T2
tags: [ema, honcho, agents, bridge, cross-pollination, audit]
summary: Honcho v3 confirmed managed-only. Bridge async spec ready. Agent audit reveals 4 agents missing .learnings and vault/Agent-Learnings/tools.md doesn't exist despite being referenced at startup.
created: 2026-04-04
author: Researcher agent
---

# EMA + Systems Research — 2026-04-04
*Sources: 8 total (3 primary vault docs, 2 live fetched, 3 direct system inspection)*  
*Confidence: 0.88 | Brave API unavailable — web research limited to direct fetches*

---

## Summary

Most of the heavy EMA architectural work was already done yesterday (2026-04-03) — Honcho decision doc, Bridge async spec, Superman context format, and blocker ranking are all in the wiki. The real gaps are in the **agent layer**: 4 agents have no `.learnings/`, the `vault/Agent-Learnings/tools.md` file doesn't exist despite being referenced at startup by 3 agents, and the main agent (most active) accumulates zero persistent learning. Honcho v3 confirmed active as managed-only service; self-hosting is v2/no-reasoning-layer only.

---

## Honcho Decision

### What Honcho v3 Actually Is (Verified from docs.honcho.dev)

Honcho is an **open-source memory library with a managed cloud service** built by Plastic Labs. Architecture:
- **Workspaces** → **Peers** → **Sessions** → **Messages**
- Background reasoning models run on messages and generate **Representations** — structured conclusions about a Peer (user, agent, object, or anything else)
- Query via `.chat()` at 5 pricing tiers: $0.001 (single lookup) → $0.50 (exhaustive research-grade)
- Python: `pip install honcho-ai` / `uv add honcho-ai`
- TypeScript: `npm install @honcho-ai/sdk`
- $100 free credits on signup, ~$0.04/run at typical single-user volume

**Self-hosting status:** v3 docs confirm managed-only. The `plasticlabs/honcho:latest` Docker image (v2) exists but lacks the Deriver/reasoning layer — it's a structured conversation store, not a user modeling system.

### Existing Analysis (vault doc is solid)

`/wiki/spaces/default/system/architecture/Intelligence-Integrations/HONCHO-DECISION.md` contains a thorough 3-way analysis written 2026-04-03:
- Managed v3 score: 0.78
- Self-hosted v2 score: 0.42  
- Skip/local reflexion score: 0.71

### Recommendation: Confirmed

**Skip in Week 7. Implement `Ema.ReflexionStore` locally. Re-evaluate managed v3 in Week 8.**

Rationale from today's research:
1. v3 is confirmed managed-only — no Docker option exists without losing the reasoning layer
2. $100 free credits = months of runway at single-user volume (verify: ~2500 dispatches at $0.04)
3. Data privacy remains the crux: vault content + agent outputs leave the machine
4. The v3 API is clean — migration from local reflexion would take ~2 hours when/if needed
5. Week 7 plate is full (Bridge async is the actual critical blocker)

**Decision trigger to switch:** Scope creep from agents 2+ times in a week, OR cross-project pattern detection becomes needed, OR Week 8 reflexion quality proves insufficient.

---

## Agent Audit Results

| Agent | .learnings | Files | Cross-reads | Skills | Gaps |
|---|---|---|---|---|---|
| **main** | ❌ NONE | — | 12 (MEMORY.md management) | Full set (60+) | No persistent learning at all — worst gap in fleet |
| **researcher** | ✅ | ERRORS, FEATURES, LEARNINGS | 2 (minimal) | 9 skills | Doesn't read vault/Agent-Learnings at startup |
| **coder** | ✅ | ERRORS, FEATURES, LEARNINGS | 9 | 5 skills | Startup reads patterns+mistakes+tools — tools.md missing |
| **codex** | ✅ | LEARNINGS only | 3 | N/A | No ERRORS.md, no FEATURE_REQUESTS.md |
| **ops** | ✅ | ERRORS, FEATURES, LEARNINGS | 4 | 11 skills | Reads tools.md — file doesn't exist |
| **security** | ❌ NONE | — | 5 | 5 skills | No .learnings/, reads vault patterns but can't write back |
| **strategist** | ❌ NONE | — | 2 (roster, preferences only) | 1 (`skills` dir empty) | No vault/Agent-Learnings reads, no learning mechanism at all |
| **prompt-engineer** | ❌ NONE | — | 11 | 5 skills | Reads patterns+mistakes but no .learnings/ to write findings |
| **vault-keeper** | ✅ | ERRORS, FEATURES, LEARNINGS | 3 | Memory skills | Doesn't read vault/Agent-Learnings at startup |

### Critical Finding: vault/Agent-Learnings/tools.md Does Not Exist

Three agents (coder, ops, security) reference `vault/Agent-Learnings/tools.md` at startup. The file doesn't exist. This is a **silent failure** — agents skip it or error without logging. Every dispatch to these agents is starting with a missing knowledge input.

Files that DO exist in vault/Agent-Learnings/:
- `patterns.md` ✅
- `mistakes.md` ✅ (populated today with 5 fleet-wide failure patterns)
- `agent-os-talk-channel-id-bug.md`
- `auto-knowledge-gated-broken.md`
- `openclaw-env-stale-apikey-auth-conflict.md`

`tools.md` is absent. Needs creation.

---

## Cross-Pollination Gaps

### Gap 1: main agent has no .learnings (HIGH PRIORITY)
Main agent is the most dispatched, most context-aware agent in the fleet. It accumulates zero persistent learning. Every pattern discovered by Right Hand dies with the session. This is structurally the biggest learning gap in the entire stack.
**Fix:** Create `~/.openclaw/agents/main/workspace/.learnings/` with LEARNINGS.md, ERRORS.md. Add startup read instructions to SOUL.md.

### Gap 2: vault/Agent-Learnings/tools.md missing (HIGH PRIORITY)
Referenced at startup by coder, ops, security — file doesn't exist. Silent failure.
**Fix:** Create the file with initial content from known tool patterns. Seed it from coder's .learnings (best tooling knowledge).

### Gap 3: researcher doesn't read vault/Agent-Learnings (MEDIUM)
Researcher SOUL.md has only 2 cross-reads — neither reads from vault/Agent-Learnings/patterns.md or mistakes.md. Researcher is a knowledge producer but not a knowledge consumer. Ironic.
**Fix:** Add startup reads to researcher SOUL.md identical to coder/ops/security pattern.

### Gap 4: strategist has no learning infrastructure at all (MEDIUM)
No .learnings/, no vault/Agent-Learnings reads at startup, only reads roster.md and Preferences.md. The strategist makes high-stakes decisions but learns nothing from past decisions.
**Fix:** Create .learnings/, add vault/Agent-Learnings reads, add session-end logging protocol.

### Gap 5: vault-keeper doesn't read vault/Agent-Learnings (LOW)
Vault-keeper manages the knowledge base but doesn't read the agent-learnings section at startup. Should be reading it — it's in their domain.
**Fix:** Add vault/Agent-Learnings reads to vault-keeper SOUL.md startup protocol.

### Gap 6: codex missing ERRORS.md and FEATURE_REQUESTS.md (LOW)
Only has LEARNINGS.md. Pattern: codex-specific errors should be tracked separately from learnings.
**Fix:** Create both files. Add failure categorization protocol.

### What's in patterns.md that should be in more SOUL.md files
From vault/Agent-Learnings/patterns.md:
- Auto-retry failed dispatch tasks (Ops — already has it)
- research-prompt-rotator.sh installed and cron'd
These are ops-specific. No researcher/coder patterns yet documented.

### What's in mistakes.md that all agents should know
Five fleet-wide failures documented as of today:
1. Thin task spec → failure (58%→25% success rate collapse)
2. Silent failure when no .learnings/ exists
3. Codex answering from model reasoning without CLI execution
4. Vault Agent-Learnings missing mistakes.md (now fixed)
5. coder.failed cluster from 2026-03-19 (missing architecture context in dispatch)

**Gap:** mistakes.md content is not surfaced in researcher SOUL.md or vault-keeper SOUL.md at startup. Only coder, ops, security, codex, and prompt-engineer read it.

---

## EMA Architecture Findings

### Bridge Async Pattern (Status: Design Complete, Not Implemented)

Full design doc at `/wiki/spaces/default/system/architecture/Intelligence-Integrations/BRIDGE-ASYNC-PATTERN.md`:
- **Current state:** `Ema.Claude.Runner` is sync/blocking — HTTP request hangs for 2-5 minutes
- **Target:** 202 Accepted + `execution_id` → WebSocket subscription → streaming events via Phoenix PubSub
- **Pattern:** Event stream (Phoenix PubSub → WebSocket) — low complexity, Phoenix infra already exists
- **Cancellation:** SIGTERM to Port subprocess via GenServer `stop` message
- **Superman integration:** Superman receives events via PubSub subscription directly

This is BLOCKER #1 from `vault/Projects/EMA/BLOCKERS-RANKED.md`. Code sketch exists in the design doc. Ready for Coder agent.

### Superman Context (Status: Design Complete, Not Implemented)

Full spec at `/wiki/spaces/default/system/architecture/Intelligence-Integrations/SUPERMAN-CONTEXT-FORMAT-SPEC.md`:
- Canonical JSON schema defined (meta, identity, intents, constraints, vault_items, tasks, executions, campaigns)
- Token budget: 2000 tokens, builder: `Superman.Context`
- Source ranking: superman_file (1.0) > vector_index (0.8) > live_state (varies)
- Two injection points: pre-dispatch prompt enrichment + `/api/projects/:id/context` endpoint
- Design-complete, ready for implementation in Week 7

### Campaign.Flow (Status: Not Written)

BLOCKER #3 in the ranked list. Campaign state machine hasn't been written. Required for Dispatch Board feature. No implementation exists in `/home/trajan/Projects/ema/` (only `cli/` and `docs/` found — actual Elixir app location unclear from surface scan).

**Action needed:** Coder agent should locate the EMA Elixir app root, identify the Campaign context/schema, and write the Flow state machine. The design exists in EMA architecture docs.

### FastAPI async background task pattern (Local context only — web search unavailable)

The Bridge design doc already specifies the Elixir-native equivalent pattern (Phoenix PubSub + Task.Supervisor). No need to research FastAPI equivalent — EMA is Elixir/Phoenix, not Python/FastAPI. The pattern in the Bridge doc is correct.

### SQLite context injection for LLM agents

Wiki search engine (localhost:8093) uses FTS5 — already implemented. The vault QMD semantic search runs every 30min. The gap is wiring wiki API into OpenClaw agent dispatch (noted in MEMORY.md: "MCP server at /home/trajan/wiki/mcp/server.py (not yet wired into OpenClaw)"). This is a different implementation need than SQLite injection — the infrastructure exists, the wiring doesn't.

---

## Recommended Action Plan

### Immediate (before Week 7 dev starts)

1. **Create vault/Agent-Learnings/tools.md** — 3 agents silently fail to load it at startup. 15-minute fix.
2. **Create main agent .learnings/** — Most active agent learns nothing persistently. Create directory + LEARNINGS.md + ERRORS.md, add startup read to SOUL.md.
3. **Add researcher startup reads** — Add vault/Agent-Learnings reads to researcher SOUL.md (2 lines, 5 minutes).

### Week 7 Dev

4. **Bridge async** — Implement Phoenix PubSub dispatch (BLOCKER #1). Design doc ready. Assign to Coder.
5. **Tauri daemon auto-start fix** — Verify the claimed fix actually works (BLOCKER #2). Quick verify.
6. **Campaign.Flow state machine** — Write it (BLOCKER #3). Prerequisite for Dispatch Board.
7. **Superman.Context module** — Implement per spec. Unlocks `/api/projects/:id/context`.
8. **Wire wiki MCP** — Connect `/home/trajan/wiki/mcp/server.py` to OpenClaw gateway.

### Week 8 Evaluate

9. **Honcho managed v3 decision** — Only trigger if: scope creep 2+ times, cross-project patterns needed, or local reflexion proves insufficient. $100 credits available, 2-hour integration.

---

## Open Questions

- Where is the actual EMA Elixir application root? (`/home/trajan/Projects/ema/` only has `cli/` and `docs/`). Need the `lib/ema/` directory to implement Bridge async.
- Is the vault/wiki migration (vault → wiki/spaces/default/) complete enough to deprecate vault QMD runs? Or are both needed indefinitely?
- Has the Tauri daemon auto-start fix been verified or only claimed? BLOCKERS-RANKED rates confidence at 0.90 that it's broken.

---

## Sources
1. [T1] `/wiki/spaces/default/system/architecture/Intelligence-Integrations/HONCHO-DECISION.md` — Three-way analysis of Honcho options, recommendation to skip Week 7
2. [T1] `/wiki/spaces/default/system/architecture/Intelligence-Integrations/BRIDGE-ASYNC-PATTERN.md` — Async dispatch design with code sketches
3. [T1] `/wiki/spaces/default/system/architecture/Intelligence-Integrations/SUPERMAN-CONTEXT-FORMAT-SPEC.md` — Superman context format spec
4. [T1] `/vault/Projects/EMA/BLOCKERS-RANKED.md` — Ranked blockers analysis
5. [T1] Direct system inspection — agent .learnings/ directories, SOUL.md cross-reads
6. [T2] `docs.honcho.dev/v3/documentation/introduction/overview` — Honcho v3 official docs, confirmed managed-only
7. [T2] `docs.honcho.dev/v3/documentation/introduction/quickstart` — SDK install + pricing
8. [T2] `honcho.dev` — Pricing tiers confirmed ($0.001–$0.50 per query tier)
