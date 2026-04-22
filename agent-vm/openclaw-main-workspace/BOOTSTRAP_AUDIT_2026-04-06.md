# Bootstrap Audit — 2026-04-06

## Executive summary

This machine is already heavily instrumented. It is not a greenfield bootstrap; it is a live orchestration host with:

- OpenClaw gateway running as a user service
- Discord and Telegram enabled
- EMA-related services and MCP bridges present
- Mature cron-driven automation
- Claude Code + Codex + MCP ecosystems configured
- Obsidian/vault integrations already in place

The work is **not** “install everything.”
The work is to:

1. inventory and normalize what already exists
2. remove dangerous or stale config
3. reduce operator friction by consolidating entrypoints
4. convert implicit glue into explicit bring-up docs/scripts

---

## What exists now

### Core CLIs confirmed

- `openclaw` 2026.3.13
- `claude` 2.1.76
- `codex` 0.115.0
- `gh`, `git`, `node`, `npm`, `python3`, `uv`, `bun`
- `docker`, `jq`, `yq`, `ripgrep`, `fzf`, `sqlite3`, `ffmpeg`
- `tailscale` installed but currently off

### High-value directories / systems already present

- `~/.openclaw`
- `~/.claude`
- `~/.codex`
- `~/vault`, `~/obsidian-vault`
- `~/bin`, `~/scripts`, `~/services`, `~/projects`
- `~/.config/systemd/user`

### OpenClaw state

- gateway service enabled and running
- dashboard reachable on LAN
- ACP enabled via `acpx`
- many agents already defined
- Discord + Telegram enabled
- heartbeat enabled for main agent
- memory search configured
- thread bindings enabled on Discord

### Existing automation surfaces

#### systemd user services
- `openclaw-gateway.service`
- `oauth-credentials-watcher.service`
- `ema-observer.service`
- `claudeforge.service`
- `opentabs.service` exists but is disabled

#### cron
Large existing cron surface with watchdogs, dispatch engine, vault sync, integrity scans, research loops, proposal workflows, transcript scanning, OAuth automation, queue loaders, and more.

#### MCP / agent integrations
- Claude MCP: `ema`, `qmd`, `vault-filesystem`
- Codex MCP: `ema`, `filesystem`, `memory`, `context7`, `git`, `fetch`, `playwright`, `sequential-thinking`, `codebase-memory-mcp`
- local helpers present: `fastmcp`, `mcp`, `playwright`, `codebase-memory-mcp`, `tiny-agents`

#### Hook surfaces
Claude hooks present under `~/.claude/hooks`, including:
- startup hooks
- safety check hook
- tool-use trace hook
- vault post-write hook
- custom hook directories

---

## Biggest findings

## 1) Security posture is much looser than it should be for a live orchestration host

OpenClaw status reports critical findings, including:

- Control UI allowed origins contains wildcard
- Control UI device auth disabled
- Discord/Telegram group policy open while powerful tools are exposed
- Telegram DMs open
- gateway bound on LAN

### Why this matters
This host is already configured for broad orchestration. Combined with open group policies and powerful tool exposure, prompt-injection or untrusted-room misuse risk is real.

### Priority
**P0**

---

## 2) Inline credentials and secrets are embedded directly in config

`~/.openclaw/openclaw.json` currently contains inline tokens / API material rather than consistently using secret refs/env-only indirection.

### Why this matters
- harder rotation
- greater accidental leakage risk
- config file becomes too sensitive to inspect/share/backup casually

### Priority
**P0**

---

## 3) Plugin config drift exists

OpenClaw warns that plugin entries exist for:
- `lossless-claw`
- `opik-openclaw`

…but they are currently reported as not found.

At the same time, installs metadata still references them.

### Likely interpretation
Install metadata and active load path have drifted; this is not catastrophic, but it creates noisy status, uncertainty, and bootstrap confusion.

### Priority
**P1**

---

## 4) Automation is powerful but fragmented

There are at least four automation planes active at once:

1. systemd user services
2. cron jobs
3. OpenClaw internal hooks / heartbeat / agents
4. Claude/Codex MCP + hooks ecosystem

### Why this matters
This is a classic “works, but nobody has one mental model” situation.

### Priority
**P1**

---

## 5) MCP is already strong, but inconsistent across tools

Claude MCP is relatively narrow.
Codex MCP is much richer.

That means the machine has capability, but not yet a single coherent MCP baseline across agents/tools.

### Priority
**P1**

---

## 6) Tailscale installed but currently off

Potentially important because gateway is LAN-bound and dashboard is LAN-reachable.
If remote/admin flows are intended, Tailscale should likely be the preferred secure exposure path rather than broad/open UI policies.

### Priority
**P2**

---

## Bring-up recommendations

## Phase 0 — Stabilize and de-risk

1. tighten OpenClaw security posture
   - remove wildcard allowed origins
   - re-enable device auth for control UI
   - change `discord.groupPolicy` and `telegram.groupPolicy` from `open` to `allowlist` unless intentionally public
   - reconsider open DM policies
   - reduce exposed runtime/fs/elevated tool surface in open rooms

2. move inline secrets out of `~/.openclaw/openclaw.json`
   - convert to env/secret refs consistently
   - document canonical secret sources

3. resolve stale plugin entries
   - either reinstall missing plugins properly
   - or remove dead entries/installs metadata references

## Phase 1 — Normalize bootstrap surfaces

1. create one canonical bring-up script or checklist for:
   - gateway
   - observer/frontend
   - credential watcher
   - MCP readiness
   - cron restore / dispatch state

2. document service ownership
   - what belongs to systemd
   - what belongs to cron
   - what belongs to OpenClaw hooks/heartbeat
   - what belongs to Claude/Codex local config

3. define startup truth
   - what must auto-start
   - what is optional
   - what should stay manual

## Phase 2 — MCP unification

Target a shared baseline across tools:

- EMA
- filesystem
- fetch
- git
- context7
- memory / codebase-memory (where appropriate)
- playwright/browser MCP only where actually useful

Then decide whether to maintain:
- one shared MCP manifest source
- or generated per-tool manifests

## Phase 3 — Hook / markdown / vault integration cleanup

Consolidate and document:

- Claude hooks
- vault post-write behavior
- markdown processing (`qmd`, markdownify, csvw2markdown)
- Obsidian / vault sync flows
- transcript-to-knowledge flows

## Phase 4 — Operator UX

Build one operator-facing bootstrap doc with:

- “how to verify healthy state in 60 seconds”
- “how to restart everything safely”
- “how to recover after reboot”
- “how to approve OAuth / credential drift”
- “where logs live”

---

## Suggested safe auto-start set

These are reasonable to auto-start:

- `openclaw-gateway.service`
- `oauth-credentials-watcher.service`
- `ema-observer.service` (if this host is supposed to serve the frontend continuously)

Potentially auto-start, but only if actively used:

- `opentabs.service`
- browser relay / browser-related helpers
- extra MCP daemons that can instead be launched on demand

Should remain explicit / reviewed:

- anything exposing public network surfaces
- anything that changes external state automatically
- aggressive self-modifying repair jobs
- security-sensitive auto-approval flows

---

## Concrete next actions

### Best immediate actions
1. fix OpenClaw security-critical config
2. clean stale plugin config
3. write a canonical bring-up/runbook
4. unify MCP manifests across Claude/Codex/OpenClaw-facing tooling
5. review cron inventory and classify jobs by owner/purpose

### Nice follow-ups
- add a single `bootstrap-status` script
- add a single `bootstrap-restart` script
- add a service/dependency map
- add a logs index doc

---

## Notes

This host is not lacking power.
It is lacking **consolidation, hardening, and one-source-of-truth docs**.
That’s good news: the leverage is already here.
