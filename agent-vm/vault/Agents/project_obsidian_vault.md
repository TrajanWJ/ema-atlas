---
name: obsidian-vault-structure
description: Structure of the Obsidian vault on agent-vm — shared between Claude Code and OpenClaw
type: project
status: active
summary: "Agent context file for project_obsidian_vault"
tags: [agent-context]
confidence: 0.60
confidence_updated: 2026-03-18
source: manual
updated: 2026-03-16
created: 2026-03-14
title: "project_obsidian_vault"
---

Vault location: `/home/trajan/vault/`
Both Claude Code and [[OpenClaw]] (Right Hand) have full read/write access.

## Structure

| Directory | Contents |
|---|---|
| `Agents/` | [[OpenClaw]] agent docs, platform docs |
| `Architecture/` | [[System Overview]], [[Design Decisions]], Original Design Spec |
| `Configuration/` | [[Docker Stack]], [[Networking]] |
| `Logs/` | [[Setup Log]] (chronological build history) |
| `Skills/` | 35 installed [[OpenClaw]] skills with README index |
| `Trajan/` | User profile, goals, preferences, decisions |
| `Projects/` | Project tracking, system buildout backlog |
| `System/` | System architecture, [[usage patterns]], channel context |
| `Agent-Learnings/` | Mistakes, patterns, tools learned |
| `Operations/` | [[Quick Reference]], [[VM Management]] |
| `Reference/` | [[OpenClaw Extensions]], [[System Services]], Setup guides |
| `Research/` | [[OpenClaw Research]], Ecosystem, Discord Setup, Self-Hosted AI Platforms, Extensions Deep Dive |
| `Security/` | [[Hardening]], [[Threat Model]] |
| `Sourced-HQ-inspo/` | Agent templates, prompts, workflows, metaprompting, awesome-lists, tools, configs |
| `Claude-Code-Memory/` | Claude Code persistent memory (this directory) |
| `ontology-sync/` | Knowledge graph ontology extracted from vault |

## Integration Points
- [[OpenClaw]] workspace at `~/.openclaw/agents/main/workspace/` — agent reads SOUL.md, TOOLS.md, USER.md on wake
- TOOLS.md references this vault for knowledge access
- ontology-sync extracts entities from vault notes into graph.jsonl
- [[knowledge-graph]] skill maintains atomic facts in workspace `life/areas/`
- [[QMD semantic search]]: `qmd search "query"` for vault content

**How to apply:** This vault is the single source of truth. Both Claude Code and [[OpenClaw]] read/write here. Use wikilinks and tags.

## Related

- [[2026-03-16_0701_📊]]
- [[System]]
- [[Buildout]]
- [[—]]
- [[Agent Memory Architectures]]
