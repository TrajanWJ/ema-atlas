---
title: "Cross-Pollination"
space: wiki
tags: ["architecture", "knowledge", "cross-pollination", "sync"]
source: manual
---

# Cross-Pollination

How knowledge flows between the three environments: host machine, EMA daemon, and agent VM. Strict guardrails prevent generated content from overwriting curated knowledge.

## The Three Environments

| Environment | Role | Primary paths |
|-------------|------|--------------|
| **Host machine** | Human-rich source. Richest long-horizon knowledge. | `~/vault/`, `~/Documents/obsidian_first_stuff/twj1/`, `~/Projects/*/`, `~/shared/inbox-host/` |
| **EMA daemon** | Selective convergence layer. Typed, indexed, provenance-tracked. | `~/.local/share/ema/vault/`, `~/.local/share/ema/ema.db` |
| **Agent VM** | Agent-operational. High-churn, provisional, useful for continuity. **Currently offline.** | `~/shared/inbox-vm/`, `~/Desktop/JarvisAI/vault/`, agent session `.jsonl` files |

## Flow: host_machine -> EMA

| What flows | How | Landing zone |
|------------|-----|-------------|
| Curated vault notes, architecture blueprints, stack decisions | QMD search (read-only) or selective file copy | `vault/imports/host/` or direct wiki reference via path |
| Project docs, CLAUDE.md files | IntentionFarmer SourceRegistry discovery | Harvested intents (level 4-5 in intents table) |
| Archived research, prompt library sources | Manual import or scheduled sync | `vault/imports/host/` with provenance labels |
| Operator preferences, conventions | Referenced in CLAUDE.md hierarchy | **Never copied** — referenced in place |

**Key paths read by EMA:**

| Host path | Content | Access method |
|-----------|---------|--------------|
| `~/vault/` | 168 QMD-indexed docs (architecture, stack decisions, project notes, patterns) | QMD MCP `search` / `vector_search` / `deep_search` |
| `~/Documents/obsidian_first_stuff/twj1/` | Legacy Obsidian (Agent Context, AI Knowledge, Session Logs, Workflows) | Read-only ingest. Indexed by QMD. Not writable by agents. |
| `~/Projects/*/` | Project repos with CLAUDE.md, docs/, .superman/ | Read per-project, scoped by project_id |
| `~/shared/inbox-host/` | Cross-VM artifacts (bridge files, course outputs, brainstorm HTMLs) | Selective ingest with provenance labels |

## Flow: agent_vm -> EMA

> **Note:** Agent-VM knowledge flows are currently dormant (VM offline). The paths and mechanisms below remain accurate but are not actively running.

| What flows | How | Landing zone |
|------------|-----|-------------|
| Session memory, execution notes | IntentionFarmer harvest pipeline | Harvested intents -> `intents` table |
| Scratch analyses, temporary syntheses | Selective import (manual or agent-triggered) | `vault/imports/agent-vm/` |
| Distilled lessons from active runs | Execution completion -> outcome recording | `intent_events` lineage + intent metadata |
| Superman research, OpenClaw patterns | One-time reference reads | Inform schema design (already consumed) |

**Key paths read by EMA:**

| Agent VM path | Content | Access method |
|---------------|---------|--------------|
| `~/shared/inbox-vm/` | Cross-VM artifacts (synthesis docs, agent integration design) | Selective ingest, provisional until promoted |
| `~/Desktop/JarvisAI/vault/` | Agent VM vault (architecture, agents, research, operations, security) | Read-only reference |
| `~/Desktop/superman/` | Superman IDE source (intent-engine.ts, intent-graph.ts) | Code reference (pattern source for porting) |
| Agent session `.jsonl` files | Claude Code, Codex CLI session histories | Harvested by IntentionFarmer SessionWatcher |

## Flow: EMA -> host_machine

| What flows | How | Landing zone |
|------------|-----|-------------|
| Promoted insights, stable wiki updates | Explicit operator promotion command | Host vault curated sections |
| Architectural syntheses | Export from `wiki/` when stabilized | Host vault `Architecture/` |
| Intent summaries, retrospectives | `ema intent export` -> markdown | Host vault `Session Log/` or `Projects/` |
| Crystallized workflows | Workflow crystallization pipeline (deferred) | Host vault `Workflows/` |

## Flow: EMA -> agent_vm

| What flows | How | Landing zone |
|------------|-----|-------------|
| Execution-ready context bundles | ContextInjector + Dispatcher delegation packets | Agent working directory |
| Intent projections | MCP `ema_get_intents` tool | Agent session context |
| Task-local memory packets | Execution dispatch enrichment | `.superman/intents/<slug>/` in project |
| Distilled project context | Superman.Context.for_project/2 | Agent prompt injection |

## Guardrails

Six rules that prevent knowledge corruption:

1. **No curated overwrite by generated.** Host machine curated docs are never overwritten by generated projections. `wiki/Architecture/` and `wiki/User/` are propose-only for agents.

2. **Provisional until promoted.** Agent VM scratch material and imported content start as provisional. They land in `vault/imports/` or `vault/intents/`, not `vault/wiki/`.

3. **Provenance labels always.** Imported material keeps source, date, and fingerprint in `imports/_provenance.md`. Every `intent_link` carries a `provenance` field. Every `intent_event` carries an `actor` field.

4. **No blind merge.** Semantically conflicting sources surface to the operator rather than being silently merged.

5. **Generated lands in generated spaces.** Generated notes go to `vault/intents/`, `vault/system/state/`, or `vault/imports/` — not `vault/wiki/` — unless explicitly promoted.

6. **Promotion requires thresholds.** Promotion into curated wiki requires operator confirmation for level 0-2 content. Lower-confidence intents require confirmation thresholds (readiness >= 0.7, item_count >= 3 for clusters; 5+ executions at 70%+ for crystallization).

## Default Posture

**Ingest and link first. Promote and rewrite later.**

The system should always prefer to reference, index, and link external knowledge rather than copy it wholesale. Copying creates staleness risk. Promotion is a deliberate act, not an automatic pipeline output.

## Landing Zone Summary

| Content type | Lands in | Promoted to |
|-------------|----------|-------------|
| Host curated docs | Referenced via QMD / filesystem MCP | N/A (already authoritative) |
| Host project docs | Harvested intents (level 4-5) | Parent intents via clustering |
| Agent VM scratch | `vault/imports/agent-vm/` | `vault/wiki/` after operator review |
| Agent VM sessions | `intents` table via harvest pipeline | Higher-level intents via confirmation |
| Generated projections | `vault/intents/`, `vault/system/state/` | N/A (always regenerable) |
| Execution outcomes | `intent_events` lineage | Retrospectives in `vault/archive/` |

## Actual Paths on Disk

### EMA-managed knowledge (read/write)

```
~/.local/share/ema/vault/wiki/          Curated wiki (55 pages)
~/.local/share/ema/vault/intents/       Generated intent projections
~/.local/share/ema/vault/imports/host/  Imported host knowledge
~/.local/share/ema/vault/imports/agent-vm/  Imported agent VM knowledge
~/.local/share/ema/vault/system/state/  SystemBrain state snapshots
~/.local/share/ema/vault/archive/       Immutable historical records
~/.local/share/ema/vault/projects/ema/  Project-local specs/plans/notes
~/.local/share/ema/ema.db              SQLite database (intents, intent_links, intent_events, etc.)
```

### Host machine knowledge (read-only from EMA's perspective)

```
~/vault/                                QMD-indexed knowledge base
~/Documents/obsidian_first_stuff/twj1/  Legacy Obsidian vault
~/Projects/ema/docs/                    Repo documentation
~/Projects/ema/daemon/.superman/intents/  Execution scratchpads (40+ folders)
~/shared/inbox-host/                    Cross-VM artifacts
```

### Agent VM knowledge (read-only from EMA's perspective, harvested via pipeline)

```
~/shared/inbox-vm/                      Cross-VM artifacts
~/Desktop/JarvisAI/vault/              Agent VM vault
~/Desktop/superman/                     Superman IDE source
~/.claude/projects/**/*.jsonl           Claude Code session files
```

## Related Pages

- [[Knowledge-Topology]] — the three core truths and canonical vs derived rules
- [[Vault-Structure]] — detailed vault directory layout and folder discipline
- [[Context-Assembly]] — how cross-pollinated knowledge is selected for execution
- [[Intent-System]] — the Intent Engine that drives knowledge flow
