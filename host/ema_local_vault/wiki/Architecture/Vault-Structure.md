---
title: "Vault Structure"
space: wiki
tags: ["architecture", "vault", "knowledge", "structure"]
source: manual
---

# Vault Structure

The EMA vault at `~/.local/share/ema/vault/` is a selective, typed convergence layer. Not a raw mirror of everything — a curated knowledge surface with strict folder discipline.

## Directory Layout (actual on-disk structure)

```
~/.local/share/ema/vault/
├── wiki/                           <- CURATED, operator-facing
│   ├── Architecture/               11 pages (EMA overview, dispatch, intents, etc.)
│   ├── User/                       4 pages (profile, stack decisions, learnings, setup)
│   ├── Projects/                   4 pages (EMA, ProSlync, place.org, active projects)
│   ├── Agents/                     2 pages (agent network, OpenClaw)
│   ├── Apps/                       5 pages (brain dump, tasks, vault, focus, pipes)
│   ├── Tools/                      2 pages (CLI reference, Superman-IDE)
│   ├── Operations/                 6 pages (quick ref, infra, audit, Claude Code setup)
│   ├── Contacts/                   1 page (Craig Wilson)
│   └── _index.md                   Master MOC (updated on every write)
│
├── intents/                        <- GENERATED, semantic working projections
│   ├── by-project/
│   │   └── ema/                    Intent notes mirroring wiki/Projects/ structure
│   ├── by-level/                   Zoom view (vision/ goal/ project/ feature/)
│   ├── by-status/                  Kanban view (active/ blocked/ complete/)
│   └── _index.md                   Auto-generated MOC
│
├── imports/                        <- IMPORTED, source-labeled mirrors
│   ├── host/                       Selective extracts from host machine knowledge
│   └── agent-vm/                   Selective extracts from agent VM workspace
│
├── projects/
│   └── ema/
│       ├── notes/                  Project-local working notes
│       ├── plans/                  Implementation plans
│       └── specs/                  Working specifications
│
├── system/
│   ├── state/                      Machine-generated state reports (SystemBrain)
│   ├── history/
│   │   ├── decisions/              Decision records
│   │   └── digests/                Periodic digests
│   ├── meta/                       System metadata
│   └── patterns/                   Detected patterns
│
├── research-ingestion/             Research material staging area
├── user-preferences/               User preference files
│
└── archive/                        <- IMMUTABLE, append-only historical
    ├── sessions/                   Archived session summaries
    ├── retrospectives/             Completed intent retrospectives
    └── promoted/                   Snapshots of promoted content (before edit)
```

## Folder Discipline

| Folder | Canonical? | Rebuildable? | Agent-writable? | Purpose |
|--------|-----------|-------------|-----------------|---------|
| `wiki/` | **Yes** | No | **Limited** (see below) | Curated operator knowledge |
| `intents/` | No | Yes | Full | Generated projections from intents DB |
| `imports/` | No | Yes | Full | Source-labeled mirrors of external knowledge |
| `projects/ema/` | Partial | No | Full | Project-local working specs, plans, notes |
| `system/state/` | No | Yes | Full | Machine-generated state reports |
| `system/history/` | Yes | No | Append-only | Decision records, digests |
| `system/meta/` | No | Yes | Full | System metadata |
| `system/patterns/` | No | Yes | Full | Detected patterns |
| `research-ingestion/` | No | Yes | Full | Research staging |
| `user-preferences/` | Yes | No | Propose only | User preferences |
| `archive/` | **Yes** | No | **Append-only** | Historical records, never overwritten |

### Wiki Agent-Writability Rules

Not all wiki sections have the same write permissions:

| Wiki Section | Agent Access |
|-------------|-------------|
| `wiki/Projects/` | Full write — agent can create and update project docs |
| `wiki/Apps/` | Full write — agent can document app changes |
| `wiki/Architecture/` | **Propose only** — agent drafts, operator approves |
| `wiki/User/` | **Propose only** — personal preference pages |
| `wiki/Operations/` | Full write — operational docs track system state |
| `wiki/Agents/` | Full write — agent self-documentation |
| `wiki/Tools/` | Full write — tool documentation |
| `wiki/Contacts/` | Propose only — personal contacts |

## Execution Layer (on-disk, separate from vault)

```
daemon/.superman/intents/<slug>/    <- DERIVED, execution scratchpads
├── intent.md                       Created on brain dump
├── status.json                     Updated on execution completion
├── execution-log.md                Appended per execution run
└── result.md                       Written on completion
```

These folders are managed by `Ema.Executions.IntentFolder` and are project-local (inside the repo working directory), not in the vault.

## Knowledge Spaces Outside the Vault

EMA reads from but does not own these locations:

| Location | Content | Access |
|----------|---------|--------|
| `~/Projects/ema/docs/` | Repo architecture docs, specs, plans | Read-only reference |
| `~/Projects/ema/daemon/.superman/intents/` | 40+ execution scratchpad folders | Read/write (IntentFolder) |
| `~/vault/` | QMD-indexed host knowledge base (168 docs) | Read-only (QMD MCP) |
| `~/Documents/obsidian_first_stuff/twj1/` | Legacy Obsidian vault | Read-only ingest |
| `~/shared/inbox-host/` | Cross-VM artifacts | Selective ingest |

## Managed By

| Component | Responsibility |
|-----------|---------------|
| `Ema.SecondBrain.VaultWatcher` | Polls vault dir every 5s, syncs file changes to DB |
| `Ema.SecondBrain.GraphBuilder` | Parses `[[wikilinks]]`, maintains link graph in DB |
| `Ema.SecondBrain.SystemBrain` | Auto-writes state files to `system/state/` with 5s debounce |
| `Ema.Vault.VaultBridge` | Bridge between vault filesystem and EMA domain logic |
| `Ema.Executions.IntentFolder` | Manages `.superman/intents/<slug>/` disk operations |

## Related Pages

- [[Knowledge-Topology]] — the three core truths and bridge rules
- [[Cross-Pollination]] — how knowledge flows between host, EMA, and agent_vm
- [[Context-Assembly]] — how vault content is selected for execution context
