---
title: Dispatch System
created: '2026-04-01'
type: codebase
status: active
stack:
  - bash
  - jq
  - jsonl
host: agent-vm
path: ~/dispatch/
category: agent-infra
tags:
  - codebase
  - dispatch
  - task-queue
  - inter-agent
  - pipeline
summary: >-
  Task routing and inter-agent communication. JSONL-based task queue, dispatch
  engine, completion hooks, channel sweep, chain execution.
related:
  - OpenClaw Agent System
  - Intelligence Layer
wiki_id: codebases/Dispatch_System
imported_from: vault/Codebases/Dispatch System.md
imported_at: '2026-04-04T00:23:56.822Z'
---

# Dispatch System

Task routing and inter-agent communication on agent-vm.

## Components

| Script | Purpose | Status |
|---|---|---|
| `dispatch-engine.sh` | Core task execution engine | ✅ Solid |
| `dispatch-task.sh` | Individual task runner | ✅ Working |
| `channel-sweep.sh` | Discord channel polling | ✅ Pass |
| `dispatch-chain.sh` | Task chaining | ⚠️ Not wired |
| `knowledge-gap-scanner.sh` | Gap detection | ⚠️ Variable scoping bug |
| `knowledge-loop.sh` | Knowledge automation | ⚠️ Not in cron |
| `dispatch-notify.sh` | Discord notifications | ✅ Working |

## File Structure

- `~/dispatch/queue/` — Pending tasks
- `~/dispatch/active/` — In-progress tasks
- `~/dispatch/done/` — Completed tasks
- `~/dispatch/results/` — Task outputs
- `~/dispatch/inter-agent/` — Agent mailbox
- `~/dispatch/feed.jsonl` — Activity feed

## Known Issues (from audit 2026-03-19)

1. Two competing chain mechanisms (dispatch-chain.sh vs completion-hook pipelines)
2. 3 scripts not wired to cron
3. Variable scoping bug in knowledge-gap-scanner.sh

## Related

- [[OpenClaw Agent System]] — Parent system
- [[Intelligence Layer]] — Pre-spawn intelligence
