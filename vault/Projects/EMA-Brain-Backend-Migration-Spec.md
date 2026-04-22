---
title: "EMA Brain Backend Migration Spec"
created: 2026-04-04
updated: 2026-04-04
type: architecture
status: active
priority: high
confidence: 0.91
tags: [ema, bridge, claude, codex, sessions, migration, architecture]
summary: "Spec for building EMA-native Claude/Codex session management as shadow backends, tested in parallel with OpenClaw, with staged approval-gated cutover."
related: ["[[Projects/EMA-Native-Ecosystem-Migration]]", "[[Projects/EMA Phase 2 Corrected Roadmap]]"]
---

# EMA Brain Backend Migration Spec

> **Goal:** Replace OpenClaw as the agent brain hub with EMA-native session management.
> Keep OpenClaw running the whole time. Shadow test → approval-gated cutover.

---

## What Trajan Is Asking For

Right now every agent brain call goes:

```
EMA → OpenClaw Gateway (OAuth) → Anthropic/OpenAI
```

The ask: build EMA's own session management layer that can drive Claude and Codex directly — TUI simulation, CLI invocation, session lifecycle — and **test it in the shadow** until it works as well as OpenClaw does. Then flip the switch with Trajan's explicit sign-off.

OpenClaw stays live the whole time. No big-bang cutover.

---

## What Already Exists

EMA already has the scaffolding — it just needs to be finished and wired up:

| Module | Status | What it does |
|---|---|---|
| `Ema.Claude.Bridge` | ✅ Live | Routes AI calls via SmartRouter |
| `Ema.Claude.SmartRouter` | ✅ Live | Picks provider/model/account per task |
| `Ema.Claude.AccountManager` | ✅ Live | Tracks per-account rate limits + rotation |
| `Ema.Claude.ProviderRegistry` | ✅ Live | Registers available provider adapters |
| `Ema.Claude.Adapters.ClaudeCli` | ✅ Live | Wraps `claude --print --output-format stream-json` |
| `Ema.Claude.Adapters.CodexCli` | ✅ Live | Wraps `codex exec --full-auto` via Port + PTY |
| `Ema.Claude.Adapters.OpenClaw` | ✅ Live | Wraps `openclaw agent` CLI |
| `Ema.Claude.Adapters.OpenRouter` | ✅ Live | HTTP to api.openrouter.ai |
| `Ema.Claude.Adapters.Ollama` | ✅ Live | HTTP to local Ollama |
| `Ema.Claude.Adapters.ApiKey` | ❌ Missing | Direct Anthropic API (no CLI wrapper) |
| `Ema.Sessions` | ❌ Missing | Persistent multi-turn session registry |
| `Ema.Sessions.TuiProxy` | ❌ Missing | Simulated TUI state machine |
| `Ema.Sessions.Monitor` | ❌ Missing | Shadow testing + comparison |

The gap is **sessions** (stateful multi-turn) and **shadow testing infrastructure**.

---

## Architecture: What Gets Built

### 1. `Ema.Sessions` — Session Registry

The missing piece: EMA needs a way to own session state, not just fire-and-forget calls.

```elixir
defmodule Ema.Sessions do
  @moduledoc """
  Registry for stateful AI sessions.
  
  A session = one continuous conversation with a model:
  - Has an ID (UUID)
  - Tracks turn history
  - Backed by one or more adapters (primary + shadow)
  - Exposes Phoenix.PubSub events on "sessions:<id>"
  """
  
  # Create a new session
  def create(opts \\ []) :: {:ok, session_id}
  
  # Send a message into an active session
  def send(session_id, message, opts \\ []) :: {:ok, response} | {:error, reason}
  
  # Stream a message (callback-based)
  def stream(session_id, message, on_event, opts \\ []) :: :ok | {:error, reason}
  
  # End a session and clean up
  def close(session_id) :: :ok
  
  # Get session state
  def get(session_id) :: {:ok, session} | {:error, :not_found}
end
```

Each session is an Elixir process supervised by `Ema.Sessions.Supervisor`. Sessions time out after configurable idle period. History stored in SQLite for replay/audit.

---

### 2. `Ema.Sessions.TuiProxy` — Simulated TUI

The problem: Claude Code and Codex are designed as interactive TUI tools. When EMA calls them via Erlang Port, they may expect a TTY, keyboard input, and terminal sequences.

**TUI Proxy** simulates the terminal layer so EMA can drive them headlessly:

```elixir
defmodule Ema.Sessions.TuiProxy do
  @moduledoc """
  Simulates a terminal session for interactive CLI agents (Claude Code, Codex).
  
  Wraps `script(1)` or a PTY library to give the subprocess a real TTY.
  Handles:
  - ANSI escape sequence stripping (for readable output)
  - Interactive prompt detection (e.g., "Continue? [Y/n]")
  - Auto-response rules (configurable yes/no/custom per prompt pattern)
  - Session recording (for debug replay)
  - Timeout + force-exit on hang
  """
  
  # Detected interactive prompts → auto-response rules
  @auto_responses [
    {~r/Continue\? \[Y\/n\]/i, "Y\n"},
    {~r/Overwrite.*\[y\/N\]/i, "y\n"},
    {~r/\[y\/n\]/i, "y\n"},
    {~r/Press Enter to continue/, "\n"},
    {~r/Do you trust/, "1\n"},   # Codex trust prompts
  ]
end
```

For **Claude Code** (`claude --print`): PTY not required. `--print --output-format stream-json --permission-mode bypassPermissions` gives clean JSONL. The ClaudeCli adapter already handles this correctly.

For **Codex** (`codex exec --full-auto`): PTY required. The CodexCli adapter has `maybe_wrap_with_pty/2` but needs `TuiProxy` to handle the interactive prompts that appear even in full-auto mode.

---

### 3. `Ema.Sessions.ApiKey` Adapter — Direct Anthropic (No CLI)

Instead of shelling out to `claude` binary, hit the API directly:

```elixir
defmodule Ema.Claude.Adapters.ApiKey do
  @behaviour Ema.Claude.Adapter
  
  # POST https://api.anthropic.com/v1/messages
  # Headers: x-api-key, anthropic-version, content-type
  # Supports streaming via text/event-stream
  # Multi-turn: maintains message history in session state
  # No PTY needed. No subprocess. Pure HTTP.
  
  # Why this matters:
  # - No CLI version dependency
  # - No OAuth fragility
  # - True multi-turn via conversation_id in request
  # - Proper token counting from API response
  # - Works when claude binary isn't installed (e.g., on server)
end
```

This is the cleanest long-term adapter. Also covers the OAuth-ban risk permanently.

---

### 4. `Ema.Sessions.Monitor` — Shadow Testing

This is the key piece that makes the cutover safe.

```elixir
defmodule Ema.Sessions.Monitor do
  @moduledoc """
  Shadow-tests EMA native sessions against the live OpenClaw baseline.
  
  Every request handled by OpenClaw (current production) is ALSO sent 
  to an EMA native session. Responses are compared. Divergences are logged.
  
  Modes:
  - :shadow   — both run, OpenClaw response is used, EMA response is compared
  - :canary   — X% of requests route to EMA native, Y% to OpenClaw
  - :primary  — EMA native is primary, OpenClaw is fallback on failure
  - :ema_only — OpenClaw is fully bypassed (final state, needs approval)
  """
  
  # Comparison metrics tracked per adapter pair:
  # - Response quality score (via judge prompt, sampled at 10%)
  # - Latency p50/p95/p99
  # - Error rate
  # - Token usage
  # - Tool call fidelity (did EMA call the same tools?)
end
```

Shadow mode runs **automatically** during Phase 1. The Monitor writes a daily diff report to `vault/Research/Infrastructure/ema-brain-shadow-report-YYYY-MM-DD.md`.

---

### 5. Session HQ — Virtual App in EMA

A new EMA virtual app showing live session state:

```
Session HQ
├── Active Sessions
│   ├── researcher-20260404-abc123  [claude-cli] Running  45s  ████░░ 
│   ├── coder-20260404-def456       [codex]      Running  12s  ██░░░░
│   └── main-20260404-ghi789        [openclaw]   Idle     2m   ──────
├── Shadow Comparison
│   ├── Last 24h: 47 requests shadowed
│   ├── Quality match: 94.2%        ✅ above threshold (90%)
│   ├── Latency delta: +340ms avg   ⚠️  EMA slower (PTY overhead)
│   └── Errors: 0 native / 0 openclaw
├── Adapter Health
│   ├── claude-cli      ✅ healthy (claude 2.1.76)
│   ├── codex           ✅ healthy (codex 0.115.0)
│   ├── api-key         ❌ no key configured
│   └── openclaw        ✅ healthy (gateway:18789 up)
└── Controls
    ├── [Shadow Mode ✓] [Canary 10%] [Primary] [EMA Only ⚠]
    └── [Approve Cutover] ← requires Trajan action
```

---

## Migration Phases

### Phase 1: Shadow (Weeks 8-9) — No approval needed, starts automatically

1. Build `Ema.Sessions` + `Ema.Sessions.Supervisor`
2. Build `Ema.Sessions.TuiProxy` (PTY wrapper for Codex)
3. Build `Ema.Claude.Adapters.ApiKey` (direct Anthropic HTTP)
4. Wire `Ema.Sessions.Monitor` in shadow mode
5. Every OpenClaw call also runs through native EMA session silently
6. Daily shadow report generated

**Success criteria for Phase 1 exit:**
- Quality match ≥ 90% over 7 days
- Error rate ≤ OpenClaw error rate
- All task types covered (research, code, general)

### Phase 2: Canary (Week 10) — Trajan approves moving to canary

1. 10% of NEW sessions route to EMA native
2. OpenClaw handles 90%
3. Monitor compares live
4. Increase to 25%, 50%, 75% as confidence builds

**Success criteria:** 2 weeks of canary at ≥50% with no quality regression.

### Phase 3: Primary (Week 11) — Trajan approves

1. EMA native handles all new sessions
2. OpenClaw on fallback (tried if EMA fails)
3. OpenClaw OAuth profiles kept but not primary

### Phase 4: EMA Only (Week 12+) — Final approval

1. OpenClaw gateway still runs (browser, TTS, mobile)
2. Agent brain calls bypass OpenClaw entirely
3. Auth: API key for Anthropic, Codex OAuth (separate) for OpenAI

---

## What This Doesn't Replace

OpenClaw keeps these permanently:
- `browser` tool (Playwright control)
- `canvas` (node canvas rendering)
- `tts` (text-to-speech)
- Mobile companion app node pairing
- Discord/Telegram channel routing (until EMA has its own bot — Week 9)

---

## Implementation Order

```
Week 8:
  [x] Ema.Claude.Adapters.ApiKey        (direct Anthropic, ~80 lines)
  [ ] Ema.Sessions.Supervisor            (supervision tree)
  [ ] Ema.Sessions (basic registry)      (ETS + SQLite persistence)
  [ ] Ema.Sessions.TuiProxy              (PTY wrapper + auto-response)
  [ ] Wire into SmartRouter              (shadow target alongside primary)

Week 9:
  [ ] Ema.Sessions.Monitor               (comparison + reporting)
  [ ] Shadow mode on by default          
  [ ] Session HQ virtual app             (live dashboard)
  [ ] Daily shadow reports to vault

Week 10:
  [ ] Canary mode (10% → 50%)           [APPROVAL GATE]
  
Week 11:
  [ ] Primary mode                       [APPROVAL GATE]

Week 12:
  [ ] EMA Only                           [APPROVAL GATE]
```

---

## Open Questions

1. **Multi-turn with ClaudeCli:** `--print` mode doesn't support stdin after start. Multi-turn needs `--session-id` + new Port per turn. Is that acceptable latency? Alternative: use ApiKey adapter for multi-turn, ClaudeCli for one-shot.

2. **Codex PTY on headless server:** `script -q -c "codex exec ..." /dev/null` works locally. Does it work on agent-vm? Test early.

3. **Session HQ auth:** Should session controls (approve cutover, etc.) require Discord confirmation or EMA dashboard action?

4. **OpenClaw session replay:** When shadow-testing, we need to replay the exact same prompt to both. Tool call results will differ (EMA won't have OpenClaw's tool set). How do we handle tool-dependent responses in comparison?

---

## Sources

- `~/shared/inbox-host/vm--ema-bridge-files/` — existing Bridge/Adapter architecture
- `vault/Projects/EMA-Native-Ecosystem-Migration.md` — parent migration plan
- `vault/Projects/EMA Phase 2 Corrected Roadmap` — week-by-week context
- `~/.openclaw/agents/architect/workspace/EMA-VIRTUAL-APP-INTEGRATION-SPEC.md` — virtual app contract

---

## Addendum: Credential Surface (added 2026-04-04)

### The two auth paths

**Path A: API keys** — static secrets for cloud providers
- Anthropic (`sk-ant-api03-...`) → `ApiKey` adapter
- OpenAI (`sk-...`) → sets `OPENAI_API_KEY` env for Codex CLI subprocess
- OpenRouter (`sk-or-...`) → `OpenRouter` adapter

**Path B: EMA connected nodes** — remote EMA instances authed into the routing mesh
- Erlang distribution over Tailscale (already in `NodeCoordinator`)
- Node-to-node auth: HMAC token, rotates hourly, no external PKI
- Remote node advertises: which CLI tools it has, which providers are keyed, current load
- SmartRouter can route a session to remote node when local is rate-limited or missing a tool

### `Ema.Credentials` module

Encrypted SQLite store. On `add_key`: validates live, encrypts, persists, feeds `AccountManager`. On startup: loads all active keys into `AccountManager`. Env fallback: `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, `OPENROUTER_API_KEY` are still checked if SQLite has nothing.

### Settings UI

Credentials tab shows:
- API key table (provider, name, status, last validated) — values never shown, only masked
- Connected nodes table (node name, installed CLIs, keyed providers, session load)
- Session mode toggle (shadow → canary → primary → ema_only) with confirmation

### REST surface

```
GET/POST/DEL  /api/credentials
POST          /api/credentials/:id/validate
GET           /api/nodes
GET           /api/nodes/:node/health
```
