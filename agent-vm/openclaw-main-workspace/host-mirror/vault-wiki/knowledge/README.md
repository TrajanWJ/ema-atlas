---
title: README
created: '2026-03-16'
updated: '2026-03-16'
type: knowledge
status: active
confidence: 0.8
confidence_updated: 2026-03-18T00:00:00.000Z
source: system-generated
tags:
  - decisions
  - ops
  - projects
  - research
summary: >-
  This is the **persistent truth** of the entire agent system. Every agent reads
  from and writes to this vault. Discord forums are the working state; th
wiki_id: knowledge/README
imported_from: vault/README.md
imported_at: '2026-04-04T00:23:56.904Z'
---
# Trajan's Knowledge Vault

This is the **persistent truth** of the entire agent system. Every agent reads from and writes to this vault. Discord forums are the working state; this vault is what survives.

## How Agents Should Use This Vault

1. **On startup:** Read `Trajan/Preferences.md` and recent files in your domain
2. **During work:** Reference existing knowledge before creating new
3. **After work:** Write findings here, run `qmd update && qmd embed`
4. **Always:** Use `[[wikilinks]]` for cross-references

## Structure

| Directory | Purpose | Who Writes |
|---|---|---|
| `Trajan/` | User preferences, decisions, [[communication patterns]] | Right Hand (primary), all agents |
| `Architecture/` | System design, [[design decisions]], server structure | Right Hand, Researcher |
| `Research/` | Deep dives, evaluations, analysis, papers | Researcher (primary) |
| `Projects/` | Per-project workspaces mirroring Active Conversations | Right Hand creates, all agents contribute |
| `Operations/` | Ops logs, incidents, health checks, runbooks | Ops (primary) |
| `Agents/` | [[Agent roster]], capabilities, performance data | Right Hand, Orchestrator |
| `System/` | [[Usage patterns]], [[evolution signals]], cron backups, channel context | All agents (auto-tracked) |
| `Skills/` | Installed skill documentation (one note per skill) | Auto-synced by skill-vault-sync |
| `Security/` | Security audits, [[Hardening]] notes, threat models | Security agent |
| `Business/` | Business planning, strategy notes | Right Hand |
| `Configuration/` | Config snapshots and references | Ops, Right Hand |
| `Reference/` | External reference material, specs | Researcher |
| `Standards/` | Coding standards, style guides, conventions | Coder, Right Hand |
| `Logs/` | Operational logs, audit trails | Automated |
| `Daily Notes/` | Per-day session notes and activity logs | All agents |
| `Agent-Learnings/` | [[Self-learning]] captures from agent interactions | Automated (message-harvester, correction-tracker) |
| `Claude-Code-Bot/` | [[Claude Code Bot]] configuration and docs | Right Hand |
| `Claude-Code-Memory/` | Claude Code memory snapshots | Automated |
| `Sourced-HQ-inspo/` | Curated inspiration and reference implementations | Researcher, Scout |
| `ontology-sync/` | Auto-generated entity graph data | Ontology sync cron |
| `_deprecated/` | Retired files (never delete, move here) | Any agent |

## Key Principles

- **Vault is truth, agents are disposable** — Sessions die. Knowledge persists.
- **Working state ⇄ persistent truth** — Forums mirror vault, vault mirrors forums
- **Self-documenting** — Every section has a README or header explaining its purpose
- **Auto-learning** — Agents capture insights, preferences, and patterns automatically
- **Never delete** — Move to `_deprecated/` instead

## Search

```bash
qmd search "your query"     # Semantic search across all vault files
qmd update && qmd embed     # Reindex after writes
```

## Forum ⇄ Vault Mapping

| Forum/Channel | Vault Section |
|---|---|
| #projects threads | `Projects/{name}/` |
| #ops threads | `Operations/{incident}/` |
| #research threads | `Research/{topic}.md` |
| #decisions posts | `Trajan/Decisions.md` |
| Active Conversations | `Projects/{name}/` (promoted) |
| Agent work anywhere | Domain-appropriate section |
