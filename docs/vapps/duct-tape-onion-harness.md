# duct-tape-onion-harness (vApp)

> **Vocabulary.** "Duct Tape/Harness" is EMA's canonical name for the AI
> dispatch seam and execution registry described below — the surface, the
> control-plane consumer, and the daemon-side `provider_supervisor` together.
> It sits inside the project-scoped Agent Workspace; it is not the Cockpit
> (which is the client/project workbench) and it does not own the holodeck or
> vDesktop shell. For the canonical glossary, see the `Vocabulary` section in
> the EMA-0.0.6 `AGENTS.md`.

## One-line

The central AI dispatch router for EMA. Every AI/LLM call the system
makes — whether it goes to a local llama.cpp model, a vLLM server, a
managed Claude Code CLI session, or the OpenAI HTTP API — is dispatched
through this surface, observed through the same event families, and
governed by the same plane semantics.

## Product Purpose

EMA needs one place where AI calls happen. Without it, every vApp,
agent, and orchestrator builds its own brittle path to whichever model
or CLI it prefers; observability, cost tracking, rate-limiting, and
swap-the-backend become impossible. Duct Tape is the surface and the
control-plane consumer that gives EMA a single dispatch seam.

Two adapter shapes share that seam:

1. **Session adapter** — manages a long-lived subprocess / PTY / browser
   profile. Examples: Hermes, Codex CLI, Claude Code CLI, Gemini CLI,
   Browser-Claude (Playwright profile, later wave),
   Browser-ChatGPT (Playwright profile, later wave). Reuses the
   provider's existing local authentication (`oauth-cli-coder` pattern).
   No token proxying.
2. **Inference adapter** — single HTTP request/response (or SSE stream)
   to a model API. Examples: Anthropic API (usage-based), OpenAI API
   (usage-based), local vLLM, local llama.cpp, Ollama, LMStudio, plus
   any **OpenAI-compatible** endpoint (Together, Groq, Fireworks,
   OpenRouter, self-hosted). One generic adapter handles all
   OpenAI-compatible endpoints; provider-specific quirks live in
   per-provider config, not per-provider code.

Both shapes emit the same `dispatch.*`, `execution.*`, `tool.*` events.
The orchestrator never sees adapter shape; it sees a normalized
`Dispatch → Execution → Events → Transcript` lifecycle.

The architecture should not be duct tape internally. Adapters
encapsulate all fragility around terminal TUI parsing, HTTP retries,
streaming protocols, or browser automation. Surface code only renders.

## Provider Catalog (v1)

Every provider declares its kind, auth model, capabilities, and routing
hints in a `connector` record. The vApp shows them all in one grid.

### Session-shape providers
- `hermes`             — Hermes CLI session (PTY)
- `codex`              — Codex CLI session (PTY)
- `claude-code`        — Claude Code CLI session (PTY)
- `gemini-cli`         — Gemini CLI session (PTY)
- `browser-claude`     — Playwright persistent profile (later wave)
- `browser-chatgpt`    — Playwright persistent profile (later wave)

### Inference-shape providers
- `anthropic-api`      — usage-based; messages API; supports prompt caching, tools, vision, thinking
- `openai-api`         — usage-based; chat completions + responses API; tools, vision, structured outputs
- `vllm-local`         — local vLLM server; OpenAI-compatible
- `llama-cpp-local`    — local llama.cpp server; OpenAI-compatible
- `ollama-local`       — local Ollama; OpenAI-compatible (via `/v1`)
- `lmstudio-local`     — local LM Studio; OpenAI-compatible
- `openai-compat`      — generic OpenAI-compatible endpoint (Together, Groq,
  Fireworks, OpenRouter, custom self-hosted) — one per configured base URL

### Routing hints
Each connector declares:
- `latency_class`      — `interactive` / `batch` / `background`
- `cost_class`         — `free-local` / `usage-based` / `subscription-cli`
- `placement`          — `local` / `remote` / `peer`
- `context_window`     — max input tokens
- `supports`           — `[tools, vision, json_mode, thinking, streaming, prompt_caching]`
- `model_ids`          — provider-specific list of model identifiers

The orchestrator's job (later wave) is to pick a provider that matches
the dispatch's required capabilities + budget + privacy class.

## Owned or Rendered Objects

Duct Tape owns no canonical truth. It renders daemon-owned records and
the events those records emit.

Rendered families (post-Wave-A vocabulary; older `dispatch.*` /
`execution.*` names are dual-emitted for one release of back-compat —
see §"Chronicle Links" below):

- `actor`              — the human or agent submitting work
- `device`             — the machine a dispatch runs on (resolves `host_id`)
- `dispatch`           — a unit of work submitted to a provider
- `Thread`             — top-level conversation (was `Session`); branded
  `ThreadId` at the type level
- `Turn`               — one round inside a Thread (was implicit
  `turns: number`); branded `TurnId`, lifecycle `turn.started` →
  `turn.completed | turn.aborted`
- `Item`               — per-turn unit (message, tool call, file change,
  reasoning); branded `ItemId`, lifecycle `item.started` →
  `item.completed`, classified by `CanonicalItemType`
- `Request`            — user-approval prompt (was the `permissions.request`
  push); branded `RequestId`, classified by `CanonicalRequestType`
  (`command_execution_approval`, `file_change_approval`,
  `tool_user_input`, `auth_tokens_refresh`, `unknown`); lifecycle
  `request.opened` → `request.resolved`
- `lane`               — orchestrator lane the work belongs to
- `handoff`            — cross-actor handoff requests
- `attachment`         — source files / transcripts captured per dispatch
- `connector`          — provider connection state across all 13+ providers
  (six session-shape + seven inference-shape; see Provider Catalog above)

Branded ID types live at
`Active builds/duct-tape-onion-harness/code/web/server/types/ids.ts`
(server) and `web/src/lib/ids.ts` (frontend mirror): `ThreadId`,
`TurnId`, `ItemId`, `RequestId`, `EventId`. Cheap nominal guard, no
runtime cost.

Every dispatch carries:

- `host_id` — which machine runs it. `"local"` (router picks),
  `"trajan-mbp"` / `"trajan-studio"` (explicit device id from
  `device.*` records), `"peer:<id>"` (peer placement), or
  `"remote:<id>"` (managed remote runtime). Locking a dispatch to a
  device pins it; if the device is unreachable the dispatch queues
  until reachable or `timeout_s` elapses.
- `cwd` — working directory. For session-shape providers, the spawned
  process inherits it. For inference-shape providers, it's metadata
  only (passed into the prompt context if relevant; the model never
  executes in it).
- `repo_root?` — git repo root if applicable (informs commit / diff
  capture).
- `target_files?` — explicit files (relative to `cwd`) the dispatch is
  allowed/expected to touch. Open question: advisory vs. hard-restrict
  on session adapters' `permissions.fs_read/fs_write`.

Daemon-side (out of scope for this vApp; documented for clarity): an
`ema_dispatch` bounded context owns writers for `dispatch.*`,
`execution.*`, `tool.*`, plus a `provider_supervisor` that holds the
managed PTY / browser-profile sessions.

## Truths Exposed

- which providers are configured and their connector status (`unset`,
  `authenticated`, `running`, `blocked`, `unreachable`)
- active and recent dispatches across all providers
- live execution state per dispatch (started / streaming / blocked /
  ended / failed)
- per-execution transcript and tool-invocation timeline
- which lane / handoff / actor a dispatch belongs to
- linked attachments (source files, transcripts) via git-ema
- CLI equivalents for every action

## Human Actions (wave 1)

- list providers and their connector status
- create a connector for a provider (real or stubbed)
- submit a `dispatch` against a provider with: prompt, role, target files,
  permissions, timeout, success criteria
- watch the live execution event stream
- send additional input into an active execution (when the provider
  supports it)
- pause / resume / stop an execution
- attach captured transcripts to the parent lane via the shared attach
  dialog
- request a handoff out of the current execution into another lane

Every action emits a daemon event from a documented family. The vApp
itself never writes truth.

## Agent Actions (CLI parity)

Every UI action above has a CLI counterpart in `apps/cli/`:

- list providers
- show connector status
- submit dispatch
- stream execution
- send input
- stop execution
- list active dispatches
- mark execution ready for review
- request handoff
- attach artifacts

CLI parity is part of the contract, not an afterthought.

## Plane / State Ownership

**Control-plane.** Duct Tape renders state owned by the daemon's
`ema_dispatch` bounded context plus shared workspace records (lanes,
handoffs). It does not introduce a new authority. Grep for `Repo.insert`
or `Repo.update` in surface code; expected count is zero.

## Project / Space scope

Per project. Each EMA project may pack Duct Tape with its own provider
set and connector state. Org-level provider defaults inherit down.

## Permission roles

- `dispatch.read`     — see dispatches and live executions
- `dispatch.submit`   — submit new dispatches
- `dispatch.control`  — pause / resume / stop active executions
- `connector.manage`  — add / remove provider connectors
- `transcript.read`   — read transcripts (gated separately because
  transcripts can contain external secrets / PII)

## Surfaces it embeds in

- Launchpad        — full-page mode with provider grid + dispatch composer
- HQ               — embed showing N active dispatches with quick stop
- native desktop   — Tauri shell, with native window per active execution
  optional (browser-backed providers may need a visible tab)
- web              — full parity except for browser-backed providers that
  require a controlled local browser profile

## Runtime Context

Duct Tape's surface code consumes the shell-protocol from
`packages/contracts/ipc/shell-protocol.md`. The daemon's
`provider_supervisor` (Rust harness, supervised by the Gleam daemon)
owns:

- one managed PTY per terminal-backed session
- one Playwright persistent profile per browser-backed session
  (later wave)
- transcript writers
- backpressure + heartbeat
- crash isolation per provider

Surface receives `dispatch.*`, `execution.*`, and `tool.*` projections;
it issues `command` IPC messages to start, send, pause, resume, stop.

## Chronicle Links

Event families this vApp uses (all in
`packages/contracts/events/catalog.v0.md`). Wave A (t3code
cross-pollination) renamed several event kinds; the harness dual-emits
the old + new for one release so the surface doesn't break mid-deploy.
After Wave C the legacy names retire.

Session / Thread lifecycle:

- `session.started`            (unchanged)
- `session.configured`         (was `session.scope_granted`)
- `session.state.changed`      (was `session.idle`; `payload.state`
                                 = `"ready"` for the idle case)
- `session.exited`             (was `session.ended`)
- `thread.state.changed`       (was `session.archived`;
                                 `payload.state="archived"`)

Turn / Item lifecycle:

- `turn.started`               (was `execution.started`)
- `content.delta`              (was `execution.token_chunk`;
                                 `payload.streamKind="assistant_text"`,
                                 also covers `reasoning_text` etc.)
- `item.started`               (was `execution.tool_call`;
                                 `payload.itemType` per
                                 `CanonicalItemType` — defaults to
                                 `dynamic_tool_call`)
- `item.completed`             (was `execution.tool_result`)
- `turn.completed`             (was `execution.ended`)
- `turn.aborted`               (was `execution.failed`;
                                 `payload.reason`)

Token usage + audit:

- `thread.token-usage.updated` — discrete snapshot fired once per turn
  boundary with `tokens_in` / `tokens_out` / `cached_input_tokens` /
  `reasoning_output_tokens` / `cost_usd_micro` / `turn_n`. Lets the
  analytics layer subscribe to deltas instead of polling
  `session.update`.

Request / approval round-trip (was `permissions.request` push +
`permissions.respond` method):

- `request.opened` (push)      — `RequestId`, `CanonicalRequestType`,
                                 plus the legacy `scope` field for
                                 back-compat
- `request.resolved` (push)    — symmetrical close-out so audit /
                                 analytics see every round-trip end
- `request.respond` (method)   — RPC that resolves a pending request;
                                 `permissions.respond` is registered as
                                 an alias for one release

Cross-cutting (still daemon-owned):

- `dispatch.started`           (Hermes seam — daemon-owned)
- `dispatch.ended`             (daemon-owned)
- `tool.*`                     (per-tool invocation envelope)
- `handoff.*`                  (when a dispatch hands off)
- `attachment.linked`          (when transcripts are attached)
- `connector.*`                (provider connection lifecycle)

Any `dispatch.*` / `turn.*` event that references an attachment or
transcript MUST be preceded by `attachment.linked` so git-ema remains
the canonical attachment store.

## Anti-silo rule

Duct Tape must not:

- spawn processes from the surface (all spawning happens in the daemon
  or harness)
- store transcripts outside `attachment` records
- proxy, extract, or repackage provider OAuth tokens
- bypass provider account controls
- depend on fragile provider-specific UI selectors outside adapter
  boundaries
- inspect connector internals (treat connector state as opaque)

Duct Tape MUST:

- submit normalized `dispatch` records
- consume normalized projections
- attach transcripts through the shared attach dialog
- expose every action through the documented CLI

## Architecture Principle

Prefer stable programmatic interfaces first, terminal automation second,
browser DOM automation third. Adapters live behind contracts so the
implementation can switch to official headless modes, SDKs, ACP, MCP, or
app-server APIs without changing orchestrator behavior.

## Non-Goals (first build)

- no proxying / extracting / repackaging provider OAuth tokens
- no bypassing provider account controls
- no autonomous-by-default browser extension surfaces
- no fragile provider-specific UI selectors outside adapter boundaries
- no cloud service before the local shared-agent workflow works

## System-wide AI routing (the seam EMA depends on)

Every other EMA module that needs an AI call goes through Duct Tape's
dispatch API. This includes:

- **vApps** — Blueprint, See Agent Work, Threads, etc. — all submit
  `dispatch` records when they want LLM output, never call providers
  directly
- **Daemon-internal agents** — babysitter / scope advisor / intelligence
  layer / honcho integration — submit dispatches with a daemon `actor`
- **Orchestrator** — turns lanes/missions into provider-routed dispatches
- **CLI commands** — `ema dispatch <provider> <prompt>` is the single
  entry point for shell-level AI calls

This makes Duct Tape **the** AI seam, not just a vApp surface. The
"vApp" lens is the human/agent UI over a control-plane primitive that
the rest of the system depends on.

## Pressure-check answers

Required by `Projects/EMA/atlas/howto/add-a-vapp.md`.

1. **What objects does it own or render?** Renders `dispatch`,
   `execution`, `tool`, `actor`, `lane`, `handoff`, `attachment`,
   `connector`. Owns none.
2. **What truths does it expose?** Provider connector status across all
   session-shape and inference-shape providers, live dispatch/execution
   state, transcripts, lane/handoff context, cost + token usage per
   execution, CLI equivalents.
3. **What actions can humans take?** List providers, create connectors,
   submit dispatches, stream/send/pause/resume/stop executions, attach
   transcripts, request handoffs, run stress-test batches.
4. **What actions can agents take through CLI?** Full parity (see Agent
   Actions section). The CLI surface is also how daemon-internal modules
   call AI — `ema dispatch ...` is the single inbound seam.
5. **What chronicle / review / memory links exist?** `dispatch.*`,
   `execution.*`, `tool.*`, `handoff.*`, `attachment.linked`,
   `connector.*` event families. Transcripts attach through git-ema.
6. **What host / runtime / workstream context can it show?** Per-project
   provider set, per-connector authentication status + cost-class +
   latency-class + placement, per-execution provider + model + actor +
   lane + cumulative tokens + cumulative cost, per-dispatch role +
   permissions + timeout + success criteria.
7. **How does it avoid being decorative?** It is the **only** path for
   AI calls in the system. Every dispatch in EMA goes through it.
   Without it, the system has no AI capability — agents, vApps,
   orchestrator, and human prompts all have nowhere to land.

## Cross-references

- `Projects/EMA/atlas/howto/add-a-vapp.md` — playbook
- `packages/contracts/events/catalog.v0.md` — event families
- `packages/contracts/ipc/shell-protocol.md` — daemon ↔ surface IPC
- `Active builds/duct-tape-onion-harness/code/.agents/shared/project-brief.md`
  — full design background
- `Active builds/duct-tape-onion-harness/code/docs/strategy/user-intent.md`
  — captured user intent + direction changes
- `docs/vapps/see-agent-work.md` — sibling vApp with overlapping
  `lane` / `handoff` / `actor` rendering responsibilities
- `docs/vapps/git-ema.md` — canonical attachment store this vApp links
  transcripts through
