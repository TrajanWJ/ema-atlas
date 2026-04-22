# Bootstrap Ownership Map

## Goal

Explain which automation plane owns which kind of work.
This exists to prevent accidental duplication and hidden coupling.

---

## 1. systemd user services

Use for:

- long-running daemons
- services that should survive independently of chat traffic
- frontend/API processes
- credential watchers / bridges

Current examples:

- `openclaw-gateway.service`
- `oauth-credentials-watcher.service`
- `ema-observer.service`
- `claudeforge.service`

Not ideal for:

- minute-by-minute polling logic better handled by cron
- chat-context-dependent logic

---

## 2. cron

Use for:

- deterministic schedules
- signal generation
- periodic maintenance
- queue feeders
- integrity checks
- log rotation / janitorial work

Current observed categories:

### watchdogs / health
- gateway watchdog
- session watchdog
- system watchdog
- auto-resume

### knowledge / indexing
- memory-pressure
- qmd update/embed
- ontology sync

### dispatch / orchestration
- signal-to-queue
- dispatch schedule
- dispatch engine
- proactive task generator
- dispatch heartbeat

### research / intel
- reddit intel
- competitive scan
- github trending intel
- research pipeline
- vault research loop

### vault / maintenance
- vault autocommit
- session janitor
- vault janitor
- stale task cleanup
- tmp/log cleanup

### agent learning / mining
- transcript scanner
- agent learning sync
- evolution loop
- session tree volatile check

### OAuth / auth glue
- host OAuth sync
- OAuth auto-approve

---

## 3. OpenClaw internal automation

Use for:

- agent heartbeats
- hooks tied to agent lifecycle
- tool-aware internal automations
- routing / thread bindings / session behavior

Current examples:

- main heartbeat
- internal hook entries
- channel bindings
- thread bindings
- agent-to-agent orchestration

---

## 4. Claude / Codex local ecosystems

Use for:

- workstation-local coding workflows
- local MCP access in those tools
- tool-specific hooks and project memory
- local developer UX, not core platform ownership

Current examples:

- `~/.claude/hooks/*`
- `~/.claude/mcp.json`
- `~/.codex/config.toml`
- Codex/Claude local sessions, memory, project state

---

## Default ownership rules

### Prefer systemd when
- the process should always be up
- it is a daemon or service endpoint

### Prefer cron when
- exact timing matters
- the task is periodic and batchable
- the task should run even without active chat

### Prefer OpenClaw heartbeat/hooks when
- the task depends on agent context
- the task is part of conversational orchestration

### Prefer Claude/Codex local config when
- the behavior is tool-local
- it should not become platform-wide operational truth

---

## Smells to avoid

- same task triggered by both cron and heartbeat
- same integration configured differently in Claude and Codex with no canonical source
- daemon behavior implemented as fragile cron loops
- secret handling split between inline config and env with no rule
