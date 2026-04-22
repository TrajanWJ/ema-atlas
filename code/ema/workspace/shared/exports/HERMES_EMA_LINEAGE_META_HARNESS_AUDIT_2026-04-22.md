# Hermes / EMA Lineage + Meta-Harness Audit

**Generated:** 2026-04-22 UTC  
**Machine boundary:** `agent-vm`  
**Scope:** Recover the four old EMA lineages from local evidence, search past sessions for relevance, inspect current Hermes/OpenClaw/ClaudeForge state on the machine, and synthesize a grounded path for making Hermes the top-level execution harness that EMA dispatches through.

---

## 1. Boundary and sources used

This audit is grounded in:

- live machine checks on `agent-vm`
- current Hermes config under `/home/trajan/Desktop/hermes-discord-bot/.hermes/`
- EMA repo under `/home/trajan/Projects/ema`
- current and older ClaudeForge repos:
  - `/home/trajan/Projects/ema/claudeforge`
  - `/home/trajan/Desktop/Coding/Projects/claude-remote-discord`
- OpenClaw residue under `~/.openclaw`
- vault/wiki/host-vault notes on the VM
- past-session recall via `session_search`

This is **VM-visible truth**, not host-global truth.

---

## 2. The likely four canonical EMA lineages

### Lineage 1 — placeOS / place.org lineage
**Role:** earliest visible world-model: browser-native desktop OS / personal workspace / local-first surface.

**Evidence:**
- `/home/trajan/staging/host-vault/Session Log/2026-03-20 - place.org v0.1 through v0.5 Build Session.md`
- `/home/trajan/staging/host-vault/Trajan's Projects/place.org.md`
- `/home/trajan/wiki/spaces/default/projects/place.org-openclaw-vision.md`
- `/home/trajan/wiki/spaces/default/system/architecture/place-org-openclaw-fork-architecture.md`

**Why it matters now:**
This lineage contributes the **desktop/workspace metaphor**, local-first instincts, and operator UX ambition.

### Lineage 2 — EMA daemon lineage
**Role:** daemon-first Elixir/Phoenix control plane and system-of-record model.

**Evidence:**
- `/home/trajan/Projects/ema/README.md`
- `/home/trajan/Projects/ema/daemon/mix.exs`
- `/home/trajan/wiki/spaces/default/codebases/EMA.md`
- `/home/trajan/Projects/ema/docs/EMA-MASTER-SPEC.md`
- `/home/trajan/Projects/ema/docs/AGENT-CONTRACT.md`

**Why it matters now:**
This lineage contributes the **authority boundary**: EMA owns truth, routing intent, execution lineage, and operator state.

### Lineage 3 — ClaudeForge / TypeScript operator-surface lineage
**Role:** Discord/web operator shell around CLI agent runtimes, with provider abstraction and normalized event streaming.

**Evidence:**
- `/home/trajan/Projects/ema/claudeforge/README.md`
- `/home/trajan/Projects/ema/claudeforge/CLAUDE.md`
- `/home/trajan/wiki/spaces/default/codebases/ClaudeForge.md`
- `/home/trajan/Desktop/Coding/Projects/claude-remote-discord/packages/server/src/providers/hermes-provider.ts`

**Why it matters now:**
This lineage contributes the **surface shell pattern**: Discord/web stay as surfaces, while the runtime sits behind a provider boundary.

### Lineage 4 — EMA mesh / current p2p BEAM lineage
**Role:** current strategic direction: peer-aware, P2P-first, organizational execution mesh.

**Evidence:**
- `/home/trajan/wiki/spaces/default/system/architecture/EMA P2P Organization Mesh.md`
- `/home/trajan/wiki/spaces/default/system/architecture/EMA Mesh Architecture.md`
- `/home/trajan/Projects/ema/daemon/lib/ema_web/router.ex`
- `/home/trajan/Projects/ema/daemon/lib/ema_web/controllers/surfaces_controller.ex`

**Why it matters now:**
This lineage contributes the **future topology**: Hermes should not just run local sessions; it should become a peer-dispatchable execution substrate under EMA control.

---

## 3. What past sessions already established

Past-session recall strongly reinforced:

1. **Hermes is already the practical execution backbone candidate.**
2. **EMA should remain canonical for control-plane truth.**
3. **OpenClaw has useful Discord-native/operator patterns, but should not remain the durable state container.**
4. **ClaudeForge already proved the provider-abstraction seam.**
5. **A Hermes-backed provider existed previously in the older ClaudeForge repo and was later lost/regressed in the EMA copy.**

Most relevant sessions:
- `20260420_203535_dc55588e`
- `20260420_203449_6a66e9ce`
- `20260420_224132_e58785b5`
- `20260421_234545_a24a13f8`
- `20260421_180551_074c182d`

---

## 4. Current Hermes state on this machine

### Live/runtime facts
- Hermes CLI is installed and active.
- Current working home for this bot is:
  - `/home/trajan/Desktop/hermes-discord-bot/.hermes`
- Current model config:
  - `provider: openai-codex`
  - `default: gpt-5.4`
- API server is enabled and was verified live.
- API server listens on loopback and exposes OpenAI-compatible routes.

### Important current config facts
From `/home/trajan/Desktop/hermes-discord-bot/.hermes/config.yaml`:
- `toolsets: [hermes-cli]`
- delegation exists, but is not explicitly tuned:
  - `delegation.provider: ''`
  - `delegation.model: ''`
  - `delegation.base_url: ''`
  - `delegation.api_key: ''`
  - `delegation.max_iterations: 50`
- skills external mount points are empty:
  - `skills.external_dirs: []`

### What Hermes already gives you
Hermes already has native support for:
- API server mode
- session continuity via `X-Hermes-Session-Id`
- subagent delegation via `delegate_task`
- ACP/editor integration
- tool-progress events over SSE
- skills + memory + session recall
- gateway proxying / split-surface topologies

**Bottom line:** Hermes is already capable of being the **execution substrate**. What is missing is the explicit EMA-native orchestration layer and restored frontend/provider seam.

---

## 5. Current OpenClaw state on this machine

OpenClaw still contains high-value lineage artifacts, but also high-risk auth/runtime residue.

### High-value import targets
- agent roster and routing ideas in `~/.openclaw/openclaw.json`
- orchestration/memory protocol notes in:
  - `/home/trajan/wiki/spaces/default/openclaw/OpenClaw Protocols.md`
  - `/home/trajan/wiki/spaces/default/openclaw/OpenClaw Agent Workspace Guide.md`
  - `/home/trajan/wiki/spaces/default/openclaw/OpenClaw System Overview.md`
- historical task/session residue in:
  - `~/.openclaw/tasks/runs.sqlite`
  - `~/.openclaw/agents/main/sessions/`

### Things that should **not** be imported directly
- raw auth/device state
- provider secrets
- paired-device records
- permissive runtime policy copied verbatim
- broad memory-search roots copied without review

### Correct extraction stance
Import:
- handoff protocol
- memory tiering rules
- watchdog / delegation timeout ideas
- named-role semantics
- operator continuity patterns

Do **not** import:
- tokens
- auth state
- raw device trust
- unsafe access-control defaults

---

## 6. ClaudeForge seam: what exists, what regressed

### The important discovery
The **older** ClaudeForge repo already had a Hermes backend provider:
- `/home/trajan/Desktop/Coding/Projects/claude-remote-discord/packages/server/src/providers/hermes-provider.ts`
- `/home/trajan/Desktop/Coding/Projects/claude-remote-discord/packages/server/src/providers/index.ts`
- `/home/trajan/Desktop/Coding/Projects/claude-remote-discord/packages/shared/src/types.ts`

That provider:
- talks to Hermes over `/v1/chat/completions`
- uses `X-Hermes-Session-Id`
- maps `hermes.tool.progress` into frontend tool events
- preserves frontend-owned local session identity

### Current EMA ClaudeForge regression
Current EMA ClaudeForge has lost that seam:
- `/home/trajan/Projects/ema/claudeforge/packages/shared/src/types.ts`
  - only `"claude" | "codex"`
- `/home/trajan/Projects/ema/claudeforge/packages/server/src/providers/index.ts`
  - only registers Claude + Codex

### Why this matters
This is the cleanest concrete proof that **Hermes does not need to replace the frontend**. It can sit behind the provider boundary and become the execution harness while Discord/web remain surface owners.

---

## 7. The clean architectural reading

The best synthesis from the evidence is:

### EMA should own
- proposals
- execution lineage
- routing policy
- peer topology
- operator state
- project/session bindings
- host-truth and control-plane truth

### Hermes should own
- session execution
- tool calling
- model/provider selection
- skills/memory
- delegation/subagents
- API server / runtime surfaces
- ACP/editor integrations

### ClaudeForge / Discord / web should own
- UX surface
- channel/category/session mirroring
- operator affordances
- frontend session metadata

### OpenClaw should contribute
- historical protocols
- role semantics
- operator continuity patterns
- swarm/handoff lessons

But **not** remain the state authority.

---

## 8. How Hermes can become the native top-level meta-harness

There are two viable layers here.

### Layer A — Hermes as execution substrate under EMA authority
This is the cleanest immediate model.

Flow:
1. EMA creates/owns execution records.
2. EMA selects a target driver/runtime.
3. EMA dispatches into Hermes through a stable engine interface.
4. Hermes runs the work using:
   - native provider APIs
   - CLI wrappers
   - ACP-backed sessions
   - delegated subagents
   - remote/peer execution adapters later
5. Hermes streams normalized lifecycle events back.
6. EMA records outcomes and remains source of truth.

### Layer B — Hermes as meta-harness over multiple harnesses
This is the stronger long-term model and matches what you asked for.

Hermes should not just call models. It should become a **harness router** that can dispatch to:
- native Hermes execution
- Claude CLI / Claude Code style sessions
- Codex CLI sessions
- ACP-compatible external agents
- simulated/TUI-backed harnesses
- peer-hosted remote harnesses

That means Hermes grows a concept above “provider”:

- **provider** = model/backend API
- **driver** = runtime/harness implementation
- **harness** = session-capable execution environment

So the future stack wants:
- EMA = control plane
- Hermes = harness router + execution substrate
- drivers = `hermes-native`, `claude-cli`, `codex-cli`, `acp-external`, `peer-remote`, `simulated`

---

## 9. Recommended driver taxonomy

Introduce a driver/harness registry roughly like:

- `hermes-native`
  - direct Hermes execution + tools + memory + skills
- `codex-oauth`
  - current Hermes provider path
- `codex-cli`
  - shell/TUI/PTY session wrapper
- `claude-api`
  - direct Anthropic/API provider path
- `claude-cli`
  - Claude Code / Claude CLI wrapper
- `acp-external`
  - ACP-bridged editor/runtime sessions
- `simulated-tui`
  - screen-driven wrapper for harnesses without a native API
- `peer-remote`
  - send work to a remote Hermes/EMA peer

This lets Hermes become the **top-level harness bus**, not just another bot.

---

## 10. Simulated TUI / CLI harness dispatch

This is feasible, but it should be treated as a driver class with hard boundaries.

### Good use cases
- Claude Code / CLI-like agents
- Codex CLI when direct API path is not enough
- legacy terminal-native agents
- cases where the runtime’s best interface is an interactive session, not an HTTP API

### Requirements
- PTY-backed session management
- durable session ID mapping
- stdout/stderr/event normalization
- interrupt/abort semantics
- prompt injection boundary
- output summarization / transcript capture
- tool/result extraction when only text is available

### Correct architecture
Do **not** bury this inside Discord or frontend code.
It should sit as a Hermes driver layer so the same harness can be reached from:
- EMA control plane
- ClaudeForge frontend
- API consumers
- peer dispatch
- future BEAM-native orchestration

---

## 11. Immediate repo-level opportunities

### Opportunity 1 — restore Hermes provider in current EMA ClaudeForge
Low drama, high leverage.

Do this by porting/adapting:
- old `hermes-provider.ts`
- old provider registration
- old `ProviderName = "claude" | "codex" | "hermes"`

Into:
- `/home/trajan/Projects/ema/claudeforge/packages/server/src/providers/`
- `/home/trajan/Projects/ema/claudeforge/packages/shared/src/types.ts`
- related session manager seams if needed

### Opportunity 2 — formalize an EMA ↔ Hermes engine contract
There is already a strong starting point:
- `/home/trajan/Projects/ema/docs/HERMES-EMA-AI-ENGINE-INTERFACE-PLAN.md`

Next step is to evolve it from “engine/provider” into **engine/harness/driver** language.

### Opportunity 3 — import OpenClaw protocols into repo-owned docs, not runtime state
Capture:
- handoff contract
- memory layering
- orchestration roles
- watchdog semantics

Inside EMA/Hermes-owned docs and skills.

### Opportunity 4 — create an explicit harness registry in EMA
EMA should be able to choose execution targets based on:
- locality
- tool needs
- auth availability
- peer placement
- desired UX surface

---

## 12. Recommended phased plan

### Phase 0 — lineage lock
- treat the four lineages above as the current canonical storyline
- avoid letting docs drift back into “these are separate projects” confusion

### Phase 1 — restore practical Hermes backend path
- restore Hermes provider in current EMA ClaudeForge
- verify Discord/web can run Hermes-backed sessions again
- keep frontend as surface owner

### Phase 2 — define harness/driver contract
- extend the existing AI engine plan from provider-centric to driver-centric
- model CLI/TUI harnesses and remote peers explicitly
- make session identity fields first-class

### Phase 3 — import OpenClaw lessons safely
- convert OpenClaw protocols into Hermes skills and EMA docs
- do not import raw auth/runtime state

### Phase 4 — build Hermes driver layer
- add driver registry above provider layer
- implement at least:
  - `hermes-native`
  - `claude-cli`
  - `codex-cli`
  - `peer-remote`
- normalize events across all of them

### Phase 5 — BEAM / peer-native integration
- let EMA choose local vs peer dispatch using host-truth, load, and policy
- preserve EMA as the canonical lineage/control plane while Hermes becomes the distributed execution bus

---

## 13. Sharpest current blockers

1. **Current EMA ClaudeForge lost Hermes provider support that older code already had.**
2. **Hermes is powerful locally, but not yet modeled as a driver bus for other harnesses.**
3. **OpenClaw knowledge exists mostly as residue and notes, not clean imported contracts.**
4. **The current Hermes config has no external EMA skill mount and no explicit delegation tuning.**
5. **Some frontend/runtime paths still carry drift and path-handling issues (for example the ClaudeForge `~/.claudeforge` path bug in repo-local state).**

---

## 14. Recommendation in one sentence

**Use EMA as the authoritative control plane, restore Hermes as the active backend/runtime provider in the current ClaudeForge surface, then evolve Hermes upward into a driver-based meta-harness that can dispatch native sessions, CLI/TUI harnesses, and peer-executed runtimes under one normalized event and lineage model.**

---

## 15. Concrete next implementation slice

If you want the smallest high-value build next, it should be:

1. restore Hermes provider in `/home/trajan/Projects/ema/claudeforge`
2. verify it against the live Hermes API server on `127.0.0.1:8642`
3. reintroduce `providerSessionId` continuity
4. emit normalized tool-progress events
5. then add a driver-registry design doc for `claude-cli` / `codex-cli` / `peer-remote`

That would move this from theory back into a working control surface quickly.
