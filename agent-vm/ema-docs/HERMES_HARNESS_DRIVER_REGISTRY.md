# Hermes Harness Driver Registry

**Date:** 2026-04-22  
**Status:** draft implementation design  
**Purpose:** define the runtime-driver layer that lets Hermes act as the top-level execution meta-harness under EMA control.

---

## 1. Why this exists

Hermes already works well as:
- an execution substrate
- an API server
- a tool/runtime host
- a delegation engine

But EMA needs a layer above raw model providers.

A **provider** is not the same thing as a **harness**.

- **Provider** = model/backend source (`openai-codex`, `anthropic-api`, `openrouter`, etc.)
- **Driver** = runtime adapter that knows how to execute work in one concrete harness shape
- **Harness** = the session-capable execution environment itself

EMA should dispatch at the **driver/harness** level, not just at the model-provider level.

---

## 2. Authority boundary

### EMA owns
- proposal / execution lineage
- dispatch policy
- target selection
- peer topology
- operator state
- canonical execution records

### Hermes owns
- session execution
- tool calling
- runtime integration
- provider/model usage inside a driver
- event normalization
- continuation semantics inside a harness

That means:
- EMA asks **what should run, where, and why**
- Hermes decides **how that target driver actually executes**

---

## 3. Registry concept

Introduce a registry of driver records.

Each driver exposes:
- identity
- locality requirements
- session semantics
- supported streaming/event fidelity
- interrupt capability
- tool visibility
- authentication/profile requirements
- placement constraints

### Proposed interface

```ts
interface HarnessDriver {
  id: string;
  kind: "native" | "cli" | "api" | "acp" | "peer" | "simulated";
  supportsResume: boolean;
  supportsStreaming: boolean;
  supportsInterrupt: boolean;
  supportsToolEvents: "full" | "partial" | "synthetic" | "none";
  supportsWorktreeMode: Array<"none" | "reuse" | "fork" | "fresh">;
  hostAffinity: "vm" | "host" | "any" | `peer:${string}`;
  authProfiles: string[];
  canRun(request: EngineRunRequest): Promise<boolean>;
  start(request: EngineRunRequest): Promise<EngineRunHandle>;
  resume(request: EngineRunRequest): Promise<EngineRunHandle>;
  interrupt(handle: EngineRunHandle): Promise<void>;
  stream(handle: EngineRunHandle): AsyncGenerator<EngineEvent>;
}
```

---

## 4. Required first-wave drivers

### 4.1 `hermes-native`
**Kind:** `native`

Use when the work should run directly inside Hermes with native tools, skills, memory, delegation, and API-server continuity.

#### Best for
- normal agent work
- tool-heavy workflows
- memory/skills aware runs
- API-server backed frontend sessions
- cases where Hermes should stay the primary actor

#### Continuity
- `hermes_session_id`
- `response_id` where applicable
- `X-Hermes-Session-Id`

#### Event fidelity
- text streaming: full
- tool events: partial-to-good
- interrupt: best-effort now, stronger later

---

### 4.2 `claude-cli`
**Kind:** `cli`

Wraps Claude Code / Claude CLI style interactive or print-mode execution.

#### Best for
- workflows tightly aligned with Claude Code behavior
- cases where Claude CLI has better ergonomics than raw API access
- host-local coding sessions with established Claude tooling

#### Requirements
- PTY management or print-mode subprocess wrapper
- local session ↔ provider session separation
- transcript/event normalization
- interrupt handling via process signal

#### Event fidelity
- text: full
- tool events: usually partial or synthetic depending on CLI output mode

---

### 4.3 `codex-cli`
**Kind:** `cli`

Wraps Codex CLI / Codex exec/session flows.

#### Best for
- local coding-agent lanes
- workflows where Codex CLI behavior is desired instead of plain API use
- parity with prior ClaudeForge/Codex surface behavior

#### Requirements
- thread/session continuity mapping
- shell/PTY management if interactive
- stdout/event normalization
- policy mapping for sandbox/approval/network

---

### 4.4 `peer-remote`
**Kind:** `peer`

Sends the run to another Hermes/EMA node.

#### Best for
- machine-specific capabilities
- load shedding
- auth/tool locality
- future mesh execution

#### Requirements
- peer capability discovery
- routing policy
- remote event stream relay
- remote execution completion reporting
- explicit degraded/offline handling

#### Core rule
Remote peers are execution locations, not alternate sources of truth.
EMA remains canonical.

---

### 4.5 `simulated-tui`
**Kind:** `simulated`

A fallback driver for harnesses that only expose an interactive CLI/TUI and no stable API/SDK contract.

#### Best for
- legacy harnesses
- experimental agents
- toolchains that only speak terminal UI

#### Risks
- fragile parsing
- weak interrupt semantics
- synthetic tool events only
- prompt/screen drift
- harder recovery guarantees

#### Guardrail
This should be treated as a controlled compatibility layer, not the preferred default.

---

## 5. Optional next-wave drivers

### `claude-api`
Direct Anthropic/API-backed execution without going through Claude CLI.

### `codex-api`
Direct Codex/OpenAI-compatible API execution.

### `acp-external`
Runs work through ACP-connected editor/runtime agents.

### `openai-compatible-api`
Generic adapter for any OpenAI-compatible backend.

These are valuable, but the first-wave set above is the real minimum for the meta-harness vision.

---

## 6. Engine request shape

Suggested EMA → Hermes request unit:

```ts
interface EngineTarget {
  kind: "local" | "peer" | "api" | "cli" | "simulated";
  driverId: string;
  hostAffinity: "vm" | "host" | "any" | `peer:${string}`;
  worktreeMode: "none" | "reuse" | "fork" | "fresh";
  toolPolicy: "inherit" | "restricted" | "none";
  authProfile?: string;
  modelHint?: string;
}

interface EngineRunRequest {
  executionId: string;
  proposalId?: string;
  intentId?: string;
  sessionBindingId?: string;
  target: EngineTarget;
  prompt: string;
  cwd?: string;
  contextRefs?: string[];
  continuation?: {
    mode: "new" | "resume";
    hermesSessionId?: string;
    providerSessionId?: string;
    responseId?: string;
  };
  metadata?: Record<string, unknown>;
}
```

---

## 7. Event normalization contract

Every driver should normalize into one event stream.

### Required event types
- `run.accepted`
- `run.started`
- `session.bound`
- `provider.selected`
- `output.delta`
- `output.message`
- `tool.started`
- `tool.finished`
- `approval.required`
- `run.completed`
- `run.failed`
- `run.interrupted`

### Fidelity rules
- if a driver has native structured tool data, emit it
- if it only has textual hints, emit synthetic tool events and mark them synthetic
- if it has no tool visibility, do not fake confidence; emit only output events

---

## 8. Selection policy

EMA should choose a driver using explicit policy, not vibes.

### Selection inputs
- required tools
- host vs VM locality
- auth/profile availability
- need for resume continuity
- need for strong tool-event fidelity
- operator preference
- peer availability and load

### Example selection logic
- Need native Hermes skills/tools/memory → `hermes-native`
- Need Claude Code exact behavior on host → `claude-cli`
- Need Codex CLI exact behavior → `codex-cli`
- Need remote machine capability → `peer-remote`
- Only interface is a TUI → `simulated-tui`

---

## 9. Session identity model

Keep identity layers separate.

### Canonical layers
- `execution_id` — EMA execution record
- `session_binding_id` — EMA/UI/control-plane binding
- `engine_run_id` — Hermes-side run handle
- `hermes_session_id` — Hermes-native continuity handle
- `provider_session_id` — downstream runtime continuity handle
- `surface_thread_id` / Discord channel/thread id — UX binding only

### Rule
Never conflate local UI session identity with backend continuity identity.

This was already one of the regression points in ClaudeForge and had to be fixed when restoring Hermes.

---

## 10. Driver-specific expectations

| Driver | Resume | Streaming | Tool events | Interrupt | Best role |
|---|---:|---:|---:|---:|---|
| `hermes-native` | yes | yes | partial/full | best-effort | default execution substrate |
| `claude-cli` | yes | yes | partial/synthetic | signal-based | Claude Code-compatible coding lanes |
| `codex-cli` | yes | yes | partial/synthetic | signal-based | Codex coding lanes |
| `peer-remote` | yes | yes | relayed | relayed | mesh execution |
| `simulated-tui` | maybe | maybe | synthetic | weak | compatibility fallback |

---

## 11. Recommended implementation order

### Phase 1
- land `hermes-native` as the formal default driver
- restore Hermes as provider/backend in ClaudeForge surface
- preserve `providerSessionId` separation

### Phase 2
- formalize `claude-cli` and `codex-cli` drivers
- normalize their events into the shared stream

### Phase 3
- add `peer-remote`
- connect to EMA peer topology and host-truth routing

### Phase 4
- add `simulated-tui` as controlled fallback only

---

## 12. Non-goals

This registry should **not**:
- make Discord the source of truth
- duplicate EMA execution lineage inside Hermes
- assume every harness has perfect structured events
- force every runtime into one provider-specific abstraction

---

## 13. Bottom line

The driver registry is the missing layer between:
- **EMA’s control-plane intent**
- and **Hermes’s actual execution machinery**

If Hermes is going to be the top-level meta-harness, it needs to route not only between model providers, but between **execution harnesses**.

That means the correct future abstraction is:

**EMA → Engine target → Hermes driver registry → harness/runtime → normalized event stream → EMA lineage update**
