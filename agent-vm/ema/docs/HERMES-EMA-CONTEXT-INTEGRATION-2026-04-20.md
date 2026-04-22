# Hermes ↔ EMA Context Integration Digest

Generated from local VM-visible sources on 2026-04-20.

## Boundary / reality check

This digest reflects what is currently visible on the **agent VM filesystem**.

Observed from this VM:
- EMA CLI exists at `/home/trajan/Projects/ema/cli`
- EMA daemon was **not reachable** at `localhost:4488` during this pass
- The visible EMA codebase on this VM includes the older Elixir/Phoenix `daemon/` tree and the `claudeforge/` tree
- A host-reconciled decision doc claims the active host-side EMA runtime later became a **TypeScript-first Electron/services/workers stack**, but that code is **not present in the VM-visible repo snapshot I inspected**

Implication:
- Treat this digest as **integrated context from available local truth**, with one explicit unresolved discrepancy: **docs describe a newer host runtime than the code snapshot visible here**.

---

## Source set used

### EMA / legacy EMA
- `/home/trajan/Projects/ema/docs/EMA-FULL-CONTEXT.md`
- `/home/trajan/Projects/ema/docs/EMA-MASTER-SPEC.md`
- `/home/trajan/Projects/ema/docs/OPENCLAW-EMA-DECISIONS-2026-04-13-HOST-RECONCILED.md`
- `/home/trajan/Projects/ema/daemon/lib/ema/claude/provider_registry.ex`
- `/home/trajan/Projects/ema/daemon/lib/ema/surfaces/discovery.ex`
- `/home/trajan/Projects/ema/daemon/lib/ema/surfaces/peer_registry.ex`
- `/home/trajan/Projects/ema/daemon/lib/ema/surfaces/session_pool.ex`

### ClaudeForge / legacy remote-agent surface
- `/home/trajan/Projects/ema/claudeforge/SPEC.md`
- `/home/trajan/Projects/ema/claudeforge/CLAUDE.md`
- plus previously inspected provider/session files in `packages/server/src/` and `packages/shared/src/`

### Hermes
- `/home/trajan/.hermes/hermes-agent/gateway/platforms/api_server.py`
- `/home/trajan/.hermes/hermes-agent/website/docs/user-guide/features/provider-routing.md`
- local Hermes config/auth observations from this VM session

### place.org / place.org + OpenClaw architecture
- `/home/trajan/vault/Projects/place.org.md`
- `/home/trajan/wiki/spaces/default/system/architecture/place-org-openclaw-fork-architecture.md`

---

## Integrated understanding

## 1. EMA’s architectural role

Across the EMA specs, the intended role is consistent even when implementation details drift:
- EMA is the **operator workspace / control plane**
- EMA owns **runtime truth** for intents, proposals, executions, outcomes, session bindings, dispatch state, and surface bindings
- EMA should not let Discord/UI/surfaces become competing sources of truth
- EMA should preserve semantic understanding in the vault/wiki while keeping live execution state in a control-plane runtime

The useful split from `EMA-MASTER-SPEC.md`:
- **Semantic layer** → vault/wiki
- **Runtime layer** → EMA control-plane state
- **Execution layer** → provider wrappers, sessions, dispatch engine, worktrees
- **Surface layer** → Discord / GUI / CLI / ClaudeForge / OpenClaw / other bindings

That split is exactly the right starting point for Hermes integration.

---

## 2. What legacy EMA already solved that we should keep

From the visible Elixir daemon tree, EMA already had the right instincts:

### Provider registry
`provider_registry.ex` already models:
- ranked provider candidates
- preflight checks
- health memory
- retry / fallback behavior
- async execution result broadcasting
- direct Claude path as primary with Codex as ordinary fallback

This is not throwaway. It is the conceptual ancestor of the engine router we want.

### Discovery surface
`discovery.ex` already models boot-time enumeration of:
- Claude CLI
- Codex CLI
- OpenClaw / gateway
- Ollama
- peer/network-adjacent surfaces
- session store facts for Claude and Codex

That discovery pass is the right shape for a Hermes-backed execution substrate too.

### Session pool
`session_pool.ex` captures an important latency optimization:
- prewarmed sessions for hot models / hot providers
- overflow sessions when the warm pool is exhausted

This should survive as a generic engine primitive, not remain Claude-only.

### Peer registry
`peer_registry.ex` already encodes:
- peer discovery
- capability advertisement
- dispatch-to-peer semantics
- per-peer surface availability, auth, and load

That maps directly onto the user request for distribution across an EMA shared organizational network.

---

## 3. What ClaudeForge contributed

ClaudeForge is the clearest local example of a practical **session/surface runtime**.

The important patterns:
- one machine, many sessions
- Discord ↔ web UI ↔ terminal all mirror the same session
- category/path maps to project/location
- session channel maps to a backend agent session
- provider-neutral event envelope feeds both Discord and web UI
- a provider registry hides Claude vs Codex differences behind one interface

From earlier code inspection, ClaudeForge already had:
- explicit provider registry
- session records carrying provider identity
- normalized streaming event types like `tool_use`, `tool_result`, `done`, `error`

This is the cleanest local precedent for the **surface/session orchestration** half of the Hermes↔EMA interface.

---

## 4. What Hermes contributes

Hermes is strongest where legacy EMA was thin:
- provider-agnostic LLM runtime
- multi-platform gateway
- tool execution loop
- configurable provider/auth handling
- API server exposing OpenAI-compatible `/v1/chat/completions` and `/v1/responses`
- session continuity hooks like `X-Hermes-Session-Id` and response-history storage
- built-in support for CLI/gateway/API-server surfaces from one agent runtime

Hermes therefore makes sense as the **AI engine / execution backbone**, while EMA remains the **control plane and lineage authority**.

That is the clean split.

---

## 5. What place.org contributes

The place.org docs are not about inference directly, but they contribute two important system-design constraints:

### Additive-only integration
From the place.org × OpenClaw fork architecture:
- the fork should mostly **add** features, not deeply rewrite upstream
- integration should happen through narrow, explicit extension points
- UI/surface additions should be separable from the upstream app core

This is highly relevant.

For Hermes↔EMA, the safest approach is:
- keep Hermes largely intact as runtime/backbone
- add an EMA-specific engine adapter / control-plane bridge
- keep EMA-specific orchestration logic out of Hermes core where possible

### Surfaces are not truth
place.org reinforces the same principle as EMA:
- UI surfaces are affordances, not authority

That means Discord / web / CLI / place.org-integrated views should all remain projections over EMA/Hermes state, not owners of it.

---

## 6. Main discrepancy to carry forward

There is one major architecture discrepancy:
- local docs say the host-active EMA evolved into a newer **TS-first runtime-fabric/services** architecture
- the VM-visible repo snapshot I inspected still exposes the older **Elixir daemon** as the concrete codebase

So for implementation planning, the safest stance is:
- preserve the **role model** from EMA docs
- reuse the **patterns** from legacy Elixir EMA and ClaudeForge
- design the Hermes engine interface so it can terminate either in:
  - legacy EMA daemon-ish control plane, or
  - newer TS runtime-fabric / services backend

In other words: the interface layer must be **backend-contract stable** even if EMA’s internal implementation keeps changing.

---

## 7. Synthesis for the new architecture

The target split should be:

### EMA owns
- intent/proposal/execution/outcome lineage
- policy and routing constraints
- canonical session metadata
- peer registry / organizational topology
- operator-facing truth
- semantic mirror into docs/vault/wiki

### Hermes owns
- model/provider execution
- tool-running agent loop
- provider auth + adapter specifics
- API-compatible inference surface
- long-running agent sessions / subagents
- gateway/platform adapters

### Interface layer owns
- translation between EMA execution records and Hermes runs/sessions
- provider capability normalization
- session binding + continuation semantics
- worktree/session placement rules
- event normalization and lifecycle streaming
- peer-dispatch envelopes

---

## 8. Required provider classes from the user request

The requested engine needs to unify these kinds of execution backends:
- Codex / Kodex
- Anthropic / Claude direct integration
- Claude CLI / Claude Code
- direct API integrations
- simulated/mock backend
- host-machine code-fork/session management like T3
- optional API-key-based providers
- peer-distributed execution across the EMA org network

These should be represented as **drivers under one engine contract**, not as unrelated special cases.

---

## 9. Recommended next move

Build a dedicated `Hermes ↔ EMA AI Engine Interface Layer` that:
1. preserves EMA as source of orchestration truth
2. uses Hermes as the execution backbone
3. absorbs the useful parts of legacy EMA provider/session logic
4. borrows ClaudeForge’s normalized session/event model
5. stays additive the way the place.org fork architecture recommends

A concrete implementation plan is in the companion doc:
- `/home/trajan/Projects/ema/docs/HERMES-EMA-AI-ENGINE-INTERFACE-PLAN.md`
