---
title: "Custom Scripts Inventory"
type: reference
created: 2026-04-06
tags: [operations, scripts, tooling, bin]
summary: "Complete inventory of 30+ custom scripts in ~/bin/ organized by function"
---

# Custom Scripts Inventory

All scripts located in `~/bin/`.

## Health & Monitoring

| Script | Purpose |
|--------|---------|
| `gateway-watchdog.sh` | Monitors OpenClaw gateway, restarts on failure |
| `session-watchdog.sh` | Monitors active sessions, alerts on stuck/dead sessions |
| `system-watchdog.sh` | System-level health checks (disk, memory, load) |
| `session-health.sh` | Reports session health metrics |
| `memory-pressure.sh` | Monitors memory usage, alerts on pressure |

## Authentication

| Script | Purpose |
|--------|---------|
| `oauth-guardian.sh` | OAuth token lifecycle management |
| `auto-login.py` | Automated login flow |
| `refresh-claude-token.sh` | Refreshes Claude API authentication token |

## Dispatch & Task Execution

| Script | Purpose |
|--------|---------|
| `dispatch-engine.sh` | Core dispatch engine -- routes tasks to agents |
| `dispatch-task.sh` | Submits a task to the dispatch system |
| `feed-emit.sh` | Emits events to the activity feed |
| `thread-response-wrapper.sh` | Wraps threaded responses for Discord delivery |

## Knowledge & Vault

| Script | Purpose |
|--------|---------|
| `auto-knowledge-capture.sh` | Automatically captures knowledge from sessions |
| `skill-vault-sync.sh` | Syncs OpenClaw skills to vault documentation |
| `landscape-capture.sh` | Captures competitive/technology landscape data |
| `qmd-context.sh` | Builds QMD context for queries |
| `vault-frontmatter-enforce.sh` | Enforces frontmatter standards on vault notes |
| `vault-autolink.sh` | Auto-generates wikilinks in vault notes |
| `doc-staleness-check.sh` | Flags stale documentation |
| `vault-refresh.sh` | Refreshes vault indexes and metadata |
| `vault-freshness.sh` | Reports on vault content freshness |

## Research

| Script | Purpose |
|--------|---------|
| `reddit-intel.sh` | Scrapes Reddit for intelligence on tracked topics |
| `competitive-scan.sh` | Competitive analysis scanning |
| `research-implement-pipeline.sh` | End-to-end research-to-implementation pipeline |

## Agent Management

| Script | Purpose |
|--------|---------|
| `create-agent.sh` | Spawns a new agent instance |
| `agent-dashboard.sh` | Displays agent status dashboard |
| `agent-replay.sh` | Replays agent session logs |
| `skill-recommender.sh` | Recommends skills based on task context |

## Discord Integration

| Script | Purpose |
|--------|---------|
| `reaction-dispatch.sh` | Dispatches tasks based on Discord reactions |
| `webhook-manager.sh` | Manages Discord webhook lifecycle |
| `progress-stream.sh` | Streams progress updates to Discord |
| `cross-channel-backlinker.sh` | Creates cross-references between Discord channels |

## System & Recovery

| Script | Purpose |
|--------|---------|
| `post-restart-fixup.sh` | Runs recovery tasks after VM restart |
| `cron-restore.sh` | Restores cron jobs from backup |
| `morning-briefing.sh` | Generates morning status briefing |
| `daily-briefing.sh` | Generates daily summary briefing |

## Coordination & Meta

| Script | Purpose |
|--------|---------|
| `context-compiler.sh` | Compiles context for agent handoffs |
| `peer-review-engine.sh` | Automated peer review of agent output |
| `decision-tracker.sh` | Tracks decisions and their rationale |
| `correction-tracker.sh` | Tracks corrections for learning |
| `self-improvement-hook.sh` | Hooks into feedback loops for self-improvement |
| `cron-orchestra.sh` | Orchestrates cron job scheduling and conflicts |
| `smart-alerts.sh` | Intelligent alerting with dedup and escalation |

## Memory

| Script | Purpose |
|--------|---------|
| `mem.sh` | Typed memory operations with relationship tracking |
| `memory-extract.sh` | Extracts memory entries from session logs |
| `memory-pressure.sh` | Memory usage monitoring and alerting |

## Related

- [[Infrastructure-Map]] -- where these scripts run
- [[Critical-Lessons]] -- lessons learned from script failures
