---
title: "Vault Audit 2026-04-05"
type: reference
created: 2026-04-05
tags: [vault-audit, maintenance]
summary: "Automated vault health audit: broken links, orphans, stale notes"
---

# Vault Audit — 2026-04-05

## Summary

| Metric | Count |
|--------|-------|
| Total notes | 2605 |
| Total wikilinks | 7156 |
| Broken wikilinks | 1497 |
| Orphan notes (no incoming links) | 1901 |
| Stale notes (>90 days) | 0 |
| Vault age | ~25 days (oldest file: 2026-03-10) |

> **Note:** No notes exceed 90 days old — the vault was created ~25 days ago. Stale detection will become relevant in future audits.

## Broken Wikilinks

Total: **1497** broken references across 463 files.

### By Directory

| Directory | Broken Links |
|-----------|-------------|
| `Research` | 348 |
| `LCM Summaries` | 165 |
| `Skills` | 105 |
| `Projects` | 75 |
| `Research/Tools` | 68 |
| `Agents` | 66 |
| `System` | 66 |
| `Architecture` | 61 |
| `Trajan/message-harvests` | 56 |
| `Resources` | 42 |
| `Agents/Host-Context` | 38 |
| `Operations` | 34 |
| `Projects/System Buildout` | 32 |
| `Reference` | 30 |
| `Reference/Prompt Engineering` | 27 |
| `Trajan` | 23 |
| `Templates` | 20 |
| `Research/AI-Knowledge` | 17 |
| `(root)` | 15 |
| `Inbox` | 14 |
| `Reference/prompts` | 12 |
| `Agents/Evolution` | 11 |
| `Reference/agents` | 11 |
| `System/Channel Context` | 11 |
| `Agents/Performance` | 8 |
| `Agents/Sessions/archive/2026-03-16` | 8 |
| `Reference/metaprompting` | 8 |
| `Projects/agentic-dev-env-OS` | 7 |
| `Research/ArXiv` | 7 |
| `Agent Knowledge` | 5 |
| `Agents/Templates` | 5 |
| `Operations/Post-Mortems` | 5 |
| `Ops` | 5 |
| `Research/AI-Knowledge/Obsidian Integration` | 5 |
| `Security` | 5 |
| `Agents/Modules` | 4 |
| `Daily Notes` | 4 |
| `Research/AI-Agents` | 4 |
| `Research/Tools/Archive` | 4 |
| `System/Evolution Reports` | 4 |
| `Tools` | 4 |
| `Trajan/Goals` | 4 |
| `Codebases` | 3 |
| `Projects/EMA` | 3 |
| `Research/AI-Knowledge/Claude Code Plugins` | 3 |
| `Research/Design` | 3 |
| `Research/agent-prompting` | 3 |
| `System/Intelligence Notes` | 3 |
| `Agent-Learnings` | 2 |
| `Agents/Templates/coder` | 2 |
| `Agents/Templates/researcher` | 2 |
| `Agents/Templates/threat-analyst` | 2 |
| `Decisions` | 2 |
| `Reference/configurations` | 2 |
| `Research/GitHub-Trending` | 2 |
| `Research/Videos` | 2 |
| `Session Summaries` | 2 |
| `System/Operations` | 2 |
| `Agents/Evolution/coder` | 1 |
| `Agents/Evolution/main` | 1 |
| `Agents/Evolution/researcher` | 1 |
| `Agents/Evolution/researcher/snapshots` | 1 |
| `Agents/Templates/code-reviewer` | 1 |
| `Agents/Templates/documentation-writer` | 1 |
| `Agents/Templates/ops` | 1 |
| `Agents/Templates/test-researcher` | 1 |
| `Architecture/Intelligence-Integrations` | 1 |
| `Reference/Learnings` | 1 |
| `Reference/awesome-lists` | 1 |
| `Reference/tools` | 1 |
| `Reference/workflows` | 1 |
| `Research/AI-Knowledge/Archive` | 1 |
| `Research/Daily Digest` | 1 |
| `_hubs` | 1 |

### Full List (first 200)

| File | Line | Broken Link |
|------|------|-------------|
| `Agent Knowledge/Agent Knowledge.md` | 21 | `[[Agent Knowledge/coder\]]` |
| `Agent Knowledge/Agent Knowledge.md` | 22 | `[[Agent Knowledge/researcher\]]` |
| `Agent Knowledge/Agent Knowledge.md` | 23 | `[[Agent Knowledge/devils-advocate\]]` |
| `Agent Knowledge/Agent Knowledge.md` | 24 | `[[Agent Knowledge/ops\]]` |
| `Agent Knowledge/Agent Knowledge.md` | 25 | `[[Agent Knowledge/security\]]` |
| `Agent-Learnings/openclaw-env-stale-apikey-auth-conflict.md` | 79 | `[[oauth-guardian]]` |
| `Agent-Learnings/openclaw-env-stale-apikey-auth-conflict.md` | 80 | `[[dispatch-engine]]` |
| `Agents/Claude Code Bot.md` | 101 | `[[2026-03-16_0624_desk]]` |
| `Agents/Claude Code Bot.md` | 103 | `[[Daily]]` |
| `Agents/Claude Code Bot.md` | 105 | `[[Log]]` |
| `Agents/Claude Code Bot.md` | 111 | `[[v3]]` |
| `Agents/Evolution/README.md` | 25 | `[[Agents/Evolution/test-agent]]` |
| `Agents/Evolution/README.md` | 26 | `[[Agents/Evolution/test-researcher]]` |
| `Agents/Evolution/coder.md` | 47 | `[[immutable-safety-baseline-coder-position]]` |
| `Agents/Evolution/coder/2026-03-16.md` | 40 | `[[github-intel-favorites]]` |
| `Agents/Evolution/concierge.md` | 39 | `[[2026-03-16-0841-concierge]]` |
| `Agents/Evolution/main/2026-03-16.md` | 47 | `[[Self-learning]]` |
| `Agents/Evolution/ops.md` | 39 | `[[research-round-3-deprecation-and-advancement-analysis]]` |
| `Agents/Evolution/ops.md` | 40 | `[[2026-03-16-1806-trajans-office]]` |
| `Agents/Evolution/ops.md` | 41 | `[[ai-landscape-2026-03-16]]` |
| `Agents/Evolution/researcher/2026-03-16.md` | 37 | `[[github-intel-favorites]]` |
| `Agents/Evolution/researcher/snapshots/2026-03-16-063002.md` | 56 | `[[QMD semantic search]]` |
| `Agents/Evolution/security.md` | 40 | `[[qa-prompts-security-testing]]` |
| `Agents/Evolution/security.md` | 41 | `[[self-evolution-security-audit]]` |
| `Agents/Evolution/strategist.md` | 41 | `[[ai-landscape-2026-03-17]]` |
| `Agents/Evolution/vault-keeper.md` | 40 | `[[research-round-3-deprecation-and-advancement-analysis]]` |
| `Agents/Host-Context/Prompt Library Sources.md` | 19 | `[[Agent Delegation Prompt]]` |
| `Agents/Host-Context/Prompt Library Sources.md` | 19 | `[[Code Review Prompt]]` |
| `Agents/Host-Context/Prompt Library Sources.md` | 19 | `[[Role - Architect]]` |
| `Agents/Host-Context/Prompt Library Sources.md` | 19 | `[[Role - Planner]]` |
| `Agents/Host-Context/Prompt Library Sources.md` | 19 | `[[Role - Reviewer]]` |
| `Agents/Host-Context/Prompt Library Sources.md` | 25 | `[[Agent Delegation Prompt]]` |
| `Agents/Host-Context/Prompt Library Sources.md` | 25 | `[[Context Synthesis Prompt]]` |
| `Agents/Host-Context/Prompt Library Sources.md` | 25 | `[[Role - Implementer]]` |
| `Agents/Host-Context/Prompt Library Sources.md` | 25 | `[[Role - Project Manager]]` |
| `Agents/Host-Context/Prompt Library Sources.md` | 25 | `[[Task Breakdown Prompt]]` |
| `Agents/Host-Context/Prompt Library Sources.md` | 31 | `[[Chain of Thought Template]]` |
| `Agents/Host-Context/Prompt Library Sources.md` | 31 | `[[Role - Architect]]` |
| `Agents/Host-Context/Prompt Library Sources.md` | 31 | `[[Role - Researcher]]` |
| `Agents/Host-Context/Prompt Library Sources.md` | 37 | `[[Code Review Prompt]]` |
| `Agents/Host-Context/Prompt Library Sources.md` | 37 | `[[Codebase Exploration Prompt]]` |
| `Agents/Host-Context/Prompt Library Sources.md` | 37 | `[[Debugging Prompt]]` |
| `Agents/Host-Context/Prompt Library Sources.md` | 37 | `[[Role - Reviewer]]` |
| `Agents/Host-Context/Prompt Library Sources.md` | 43 | `[[Release Readiness Prompt]]` |
| `Agents/Host-Context/Prompt Library Sources.md` | 43 | `[[Risk Analysis Prompt]]` |
| `Agents/Host-Context/Prompt Library Sources.md` | 43 | `[[Sprint Planning Prompt]]` |
| `Agents/Host-Context/Prompt Library Sources.md` | 49 | `[[Chain of Thought Template]]` |
| `Agents/Host-Context/Prompt Library Sources.md` | 49 | `[[Meta-Prompt Generator]]` |
| `Agents/Host-Context/Prompt Library Sources.md` | 55 | `[[Agent Delegation Prompt]]` |
| `Agents/Host-Context/Prompt Library Sources.md` | 61 | `[[Codebase Exploration Prompt]]` |
| `Agents/Host-Context/Prompt Library Sources.md` | 61 | `[[Release Readiness Prompt]]` |
| `Agents/Host-Context/Prompt Library Sources.md` | 69 | `[[Implementation Planning Prompt]]` |
| `Agents/Host-Context/Prompt Library Sources.md` | 69 | `[[PRD Generation Prompt]]` |
| `Agents/Host-Context/Prompt Library Sources.md` | 87 | `[[Decision Record Template]]` |
| `Agents/Host-Context/Prompt Library Sources.md` | 93 | `[[Code Review Prompt]]` |
| `Agents/Host-Context/Research - Agentic Development Patterns 2026.md` | 36 | `[[Role - Planner]]` |
| `Agents/Host-Context/Research - Agentic Development Patterns 2026.md` | 55 | `[[Role - Architect]]` |
| `Agents/Host-Context/Research - Agentic Development Patterns 2026.md` | 55 | `[[Role - Implementer]]` |
| `Agents/Host-Context/Research - Agentic Development Patterns 2026.md` | 55 | `[[Role - Reviewer]]` |
| `Agents/Host-Context/Research - Agentic Development Patterns 2026.md` | 107 | `[[Workflow - Session Memory]]` |
| `Agents/Host-Context/Research - Agentic Development Patterns 2026.md` | 174 | `[[Role - Reviewer]]` |
| `Agents/Host-Context/Research - Agentic Development Patterns 2026.md` | 203 | `[[Workflow - Goal Cascade]]` |
| `Agents/Host-Context/Research - Agentic Development Patterns 2026.md` | 207 | `[[Role - Project Manager]]` |
| `Agents/Host-Context/Research - Agentic Development Patterns 2026.md` | 280 | `[[Role - Architect]]` |
| `Agents/MEMORY.md` | 20 | `[[agent roster]]` |
| `Agents/MEMORY.md` | 34 | `[[agent-memory-model-hermes]]` |
| `Agents/Modules/README.md` | 39 | `[[usage patterns]]` |
| `Agents/Modules/discord-output.md` | 55 | `[[-]]` |
| `Agents/Modules/vault-interaction.md` | 29 | `[[wikilink]]` |
| `Agents/Modules/vault-management.md` | 21 | `[[wikilink]]` |
| `Agents/OpenClaw.md` | 109 | `[[12-Factor]]` |
| `Agents/OpenClaw.md` | 113 | `[[2026-03-16_0830_🔧]]` |
| `Agents/OpenClaw.md` | 114 | `[[Cron]]` |
| `Agents/OpenClaw.md` | 115 | `[[Persistence]]` |
| `Agents/OpenClaw.md` | 116 | `[[—]]` |
| `Agents/OpenClaw.md` | 117 | `[[2026-03-16_0830_🛡️]]` |
| `Agents/OpenClaw.md` | 118 | `[[Secrets]]` |
| `Agents/OpenClaw.md` | 119 | `[[in]]` |
| `Agents/OpenClaw.md` | 120 | `[[Plaint]]` |
| `Agents/Performance/README.md` | 21 | `[[Agents/Performance/auto-generated]]` |
| `Agents/Performance/README.md` | 24 | `[[Agents/Performance/test-agent]]` |
| `Agents/Performance/README.md` | 25 | `[[Agents/Performance/test-researcher]]` |
| `Agents/Performance/concierge.md` | 21 | `[[2026-03-16-0841-concierge]]` |
| `Agents/Performance/strategist.md` | 23 | `[[ai-landscape-2026-03-17]]` |
| `Agents/Performance/universal-orchestrator.md` | 44 | `[[AI]]` |
| `Agents/Performance/universal-orchestrator.md` | 45 | `[[Landscape]]` |
| `Agents/Performance/universal-orchestrator.md` | 46 | `[[2026-03-17]]` |
| `Agents/Sessions/archive/2026-03-16/2026-03-16_0701_📊 System Buildout — .md` | 11 | `[[agent roster]]` |
| `Agents/Sessions/archive/2026-03-16/2026-03-16_0701_📊 System Buildout — .md` | 20 | `[[agent roster]]` |
| `Agents/Sessions/archive/2026-03-16/2026-03-16_0701_📊 System Buildout — .md` | 31 | `[[agent roster]]` |
| `Agents/Sessions/archive/2026-03-16/2026-03-16_0830_🛡️ Secrets in Plaint.md` | 25 | `[[openclaw config]]` |
| `Agents/Sessions/archive/2026-03-16/2026-03-16_0830_🛡️ Secrets in Plaint.md` | 25 | `[[openclaw config]]` |
| `Agents/Sessions/archive/2026-03-16/2026-03-16_0830_🛡️ Secrets in Plaint.md` | 27 | `[[openclaw config]]` |
| `Agents/Sessions/archive/2026-03-16/2026-03-16_0830_🛡️ Secrets in Plaint.md` | 34 | `[[openclaw config]]` |
| `Agents/Sessions/archive/2026-03-16/2026-03-16_0830_🛡️ Secrets in Plaint.md` | 35 | `[[openclaw config]]` |
| `Agents/Skill Proposals.md` | 215 | `[[2026-03-14]]` |
| `Agents/Templates/README.md` | 40 | `[[usage patterns]]` |
| `Agents/Templates/archived-souls-2026-03-16.md` | 34 | `[[2026-03-16_0648_🧪]]` |
| `Agents/Templates/archived-souls-2026-03-16.md` | 35 | `[[Delegation]]` |
| `Agents/Templates/archived-souls-2026-03-16.md` | 36 | `[[Test]]` |
| `Agents/Templates/archived-souls-2026-03-16.md` | 37 | `[[—]]` |
| `Agents/Templates/code-reviewer/SOUL.md` | 89 | `[[agent-tester-multi-model-soul-md-testing]]` |
| `Agents/Templates/coder/SOUL.md` | 93 | `[[agent-tester-multi-model-soul-md-testing]]` |
| `Agents/Templates/coder/capabilities.md` | 39 | `[[communication patterns]]` |
| `Agents/Templates/documentation-writer/SOUL.md` | 89 | `[[agent-tester-multi-model-soul-md-testing]]` |
| `Agents/Templates/ops/SOUL.md` | 88 | `[[agent-tester-multi-model-soul-md-testing]]` |
| `Agents/Templates/researcher/SOUL.md` | 83 | `[[agent-tester-multi-model-soul-md-testing]]` |
| `Agents/Templates/researcher/capabilities.md` | 63 | `[[wikilinks]]` |
| `Agents/Templates/test-researcher/SOUL.md` | 89 | `[[agent-tester-multi-model-soul-md-testing]]` |
| `Agents/Templates/threat-analyst/SOUL.md` | 54 | `[[threat model]]` |
| `Agents/Templates/threat-analyst/SOUL.md` | 75 | `[[threat model]]` |
| `Agents/_index.md` | 50 | `[[2026-03-16_0648_🧪 Delegation Test —]]` |
| `Agents/_index.md` | 55 | `[[2026-03-16_0831_🔧 Cron Persistence —]]` |
| `Agents/_index.md` | 56 | `[[2026-03-16_0835_🔧 Cron Persistence —]]` |
| `Agents/_index.md` | 64 | `[[2026-03-16_0624_desk]]` |
| `Agents/_index.md` | 65 | `[[2026-03-16_0625_desk]]` |
| `Agents/_index.md` | 67 | `[[2026-03-16_0626_📚 Vault Maintenance]]` |
| `Agents/_index.md` | 70 | `[[2026-03-16_0701_📊 System Buildout —]]` |
| `Agents/_index.md` | 71 | `[[2026-03-16_0723_system-buildout-mar1]]` |
| `Agents/_index.md` | 72 | `[[2026-03-16_0727_overview]]` |
| `Agents/_index.md` | 73 | `[[2026-03-16_0823_🔄 Cross-Agent Handof]]` |
| `Agents/_index.md` | 74 | `[[2026-03-16_0824_🔄 Cross-Agent Handof]]` |
| `Agents/_index.md` | 75 | `[[2026-03-16_0824_🔌 Agent-to-Discord D]]` |
| `Agents/_index.md` | 77 | `[[2026-03-16_0827_🌅 Morning Pitches —]]` |
| `Agents/_index.md` | 78 | `[[2026-03-16_0827_📋 Vault Maintenance]]` |
| `Agents/_index.md` | 79 | `[[2026-03-16_0829_📋 Vault Maintenance]]` |
| `Agents/_index.md` | 80 | `[[2026-03-16_0830_📋 Vault Maintenance]]` |
| `Agents/_index.md` | 82 | `[[2026-03-16_0831_📋 Vault Maintenance]]` |
| `Agents/_index.md` | 83 | `[[2026-03-16_0832_📋 Vault Maintenance]]` |
| `Agents/_index.md` | 84 | `[[2026-03-16_0832_🔧 Cron Persistence —]]` |
| `Agents/_index.md` | 85 | `[[2026-03-16_0833_📋 Vault Maintenance]]` |
| `Agents/_index.md` | 86 | `[[2026-03-16_0833_🔧 Cron Persistence —]]` |
| `Agents/_index.md` | 87 | `[[2026-03-16_0833_🛡️ Secrets in Plaint]]` |
| `Agents/_index.md` | 88 | `[[2026-03-16_0834_📋 Vault Maintenance]]` |
| `Agents/_index.md` | 89 | `[[2026-03-16_0834_🔧 Cron Persistence —]]` |
| `Agents/_index.md` | 90 | `[[2026-03-16_0834_🛡️ Secrets in Plaint]]` |
| `Agents/_index.md` | 91 | `[[2026-03-16_0835_🛡️ Secrets in Plaint]]` |
| `Agents/_index.md` | 92 | `[[2026-03-16_0836_🔧 Cron Persistence —]]` |
| `Agents/_index.md` | 93 | `[[2026-03-16_0841_concierge]]` |
| `Agents/_index.md` | 94 | `[[2026-03-16_0842_Claude Code: nudeg m]]` |
| `Agents/_index.md` | 95 | `[[2026-03-16_0843_🛡️ Secrets in Plaint]]` |
| `Agents/_index.md` | 97 | `[[2026-03-16_0844_concierge]]` |
| `Agents/_index.md` | 98 | `[[2026-03-16_0845_Claude Code: Perfect]]` |
| `Agents/_index.md` | 99 | `[[2026-03-16_0845_concierge]]` |
| `Agents/_index.md` | 100 | `[[2026-03-16_0849_🛡️ Secrets in Plaint]]` |
| `Agents/_index.md` | 101 | `[[2026-03-16_0850_🛡️ Secrets in Plaint]]` |
| `Agents/_index.md` | 102 | `[[2026-03-16_0853_🛡️ Secrets in Plaint]]` |
| `Agents/_index.md` | 103 | `[[2026-03-16_0854_🛡️ Secrets in Plaint]]` |
| `Agents/mistakes.md` | 45 | `[[project-obsidian-vault]]` |
| `Agents/project_obsidian_vault.md` | 30 | `[[usage patterns]]` |
| `Agents/project_obsidian_vault.md` | 45 | `[[QMD semantic search]]` |
| `Agents/project_obsidian_vault.md` | 51 | `[[2026-03-16_0701_📊]]` |
| `Agents/project_obsidian_vault.md` | 53 | `[[Buildout]]` |
| `Agents/project_obsidian_vault.md` | 54 | `[[—]]` |
| `Agents/project_system_buildout_mar16.md` | 20 | `[[agent roster]]` |
| `Agents/project_system_buildout_mar16.md` | 40 | `[[2026-03-16_0701_📊]]` |
| `Agents/project_system_buildout_mar16.md` | 42 | `[[Buildout]]` |
| `Agents/project_system_buildout_mar16.md` | 43 | `[[—]]` |
| `Agents/prompt-engineer.md` | 16 | `[[metaprompting patterns]]` |
| `Agents/reference_oauth_guardian.md` | 252 | `[[Secrets]]` |
| `Agents/tools.md` | 42 | `[[mcp-tool-search-installation]]` |
| `Architecture/Agent Architecture Overview.md` | 28 | `[[2.0]]` |
| `Architecture/Agent Architecture Overview.md` | 29 | `[[-]]` |
| `Architecture/Agent Architecture Overview.md` | 30 | `[[ByteDance]]` |
| `Architecture/Agent-Queue-System.md` | 175 | `[[Dispatch Protocol]]` |
| `Architecture/Auto-Knowledge Architecture.md` | 45 | `[[agent roster]]` |
| `Architecture/Auto-Knowledge Architecture.md` | 66 | `[[-]]` |
| `Architecture/Auto-Knowledge Architecture.md` | 67 | `[[NousResearch]]` |
| `Architecture/Auto-Knowledge Architecture.md` | 68 | `[[Overnight]]` |
| `Architecture/Auto-Knowledge Architecture.md` | 69 | `[[Summary]]` |
| `Architecture/Auto-Knowledge Architecture.md` | 70 | `[[2026-03-14]]` |
| `Architecture/Auto-Knowledge Architecture.md` | 74 | `[[1]]` |
| `Architecture/Auto-Knowledge Architecture.md` | 75 | `[[-]]` |
| `Architecture/Auto-Knowledge Architecture.md` | 76 | `[[Self-Organizing]]` |
| `Architecture/Auto-Knowledge Architecture.md` | 77 | `[[Systems]]` |
| `Architecture/Auto-Knowledge Architecture.md` | 78 | `[[Analysis]]` |
| `Architecture/Claude Agent SDK Migration.md` | 426 | `[[Agent Team Orchestration]]` |
| `Architecture/Design Decisions.md` | 172 | `[[3]]` |
| `Architecture/Design Decisions.md` | 173 | `[[-]]` |
| `Architecture/Design Decisions.md` | 174 | `[[Deprecation]]` |
| `Architecture/Design Decisions.md` | 175 | `[[and]]` |
| `Architecture/Design Decisions.md` | 176 | `[[Advancement]]` |
| `Architecture/Design Decisions.md` | 177 | `[[Analysis]]` |
| `Architecture/Design Decisions.md` | 205 | `[[Usage patterns]]` |
| `Architecture/Design Decisions.md` | 222 | `[[agent roster]]` |
| `Architecture/Discord Server Architecture v3.md` | 64 | `[[Self-learning]]` |
| `Architecture/Discord Server Architecture v3.md` | 121 | `[[Evolution signals]]` |
| `Architecture/Discord Server Architecture v4.md` | 69 | `[[Self-learning]]` |
| `Architecture/Discord Server Architecture v4.md` | 95 | `[[reddit-intel-deep-sweep-2026-03-18]]` |
| `Architecture/Discord UX Philosophy.md` | 192 | `[[AGENTS.md]]` |
| `Architecture/EMA Full Integration Roadmap.md` | 164 | `[[wikilinks]]` |
| `Architecture/Future-Frontend-UX-Spec.md` | 235 | `[[...]]` |
| `Architecture/Future-Frontend-UX-Spec.md` | 255 | `[[target]]` |
| `Architecture/Independent AI System Design.md` | 241 | `[[-z "$last_activity"]]` |
| `Architecture/Independent AI System Design.md` | 245 | `[[$age -gt $STALE_THRESHOLD]]` |
| `Architecture/Independent AI System Design.md` | 287 | `[[$HOUR -ge 22]]` |
| `Architecture/Independent AI System Design.md` | 366 | `[[$(( NOW - LAST_HEARTBEAT )) -gt 7200]]` |
| `Architecture/Independent AI System Design.md` | 464 | `[[$HOUR -ge 22]]` |
| `Architecture/Independent AI System Design.md` | 483 | `[["$NIGHT_MODE" == "true"]]` |
| `Architecture/Integrations Roadmap.md` | 61 | `[[goals-aspirations]]` |
| ... | ... | *(1297 more)* |

## Orphan Notes (No Incoming Links)

Total: **1901** notes with no incoming wikilinks from other notes.

### Top 20 Oldest Orphans

| File | Last Modified |
|------|--------------|
| `Agents/Host-Context/Research - Agentic Development Patterns 2026.md` | 2026-03-12 |
| `Templates/Daily Template.md` | 2026-03-12 |
| `Templates/Project Template.md` | 2026-03-12 |
| `Templates/Weekly Review Template.md` | 2026-03-12 |
| `Reference/Learnings/Learnings & Gotchas.md` | 2026-03-12 |
| `Trajan/Contacts/Contacts & People.md` | 2026-03-12 |
| `Reference/Learnings/2026-03-13 - Vault instructions dont self-enforce.md` | 2026-03-14 |
| `System/vault-reference-snippet.md` | 2026-03-14 |
| `Claude-Code-Bot/sessions/2026-03-18_0601_agent-logs.md` | 2026-03-19 |
| `Claude-Code-Bot/sessions/2026-03-18_0631_github-interesting.md` | 2026-03-19 |
| `Claude-Code-Bot/sessions/2026-03-18_0635_github-interesting.md` | 2026-03-19 |
| `Claude-Code-Bot/sessions/2026-03-18_0639_github-interesting.md` | 2026-03-19 |
| `Claude-Code-Bot/sessions/2026-03-19_0227_concierge.md` | 2026-03-19 |
| `Claude-Code-Bot/sessions/2026-03-19_0228_concierge.md` | 2026-03-19 |
| `Claude-Code-Bot/sessions/2026-03-19_0229_concierge.md` | 2026-03-19 |
| `Research/MemOS-Integration-Analysis.md` | 2026-03-19 |
| `Research/anthropic-81k-agent-design-signals.md` | 2026-03-19 |
| `System/Overnight Digest 2026-03-19.md` | 2026-03-19 |
| `Daily Notes/briefing-2026-03-19.md` | 2026-03-19 |
| `Trajan/Priorities.md` | 2026-03-20 |

### Orphans by Directory

| Directory | Orphan Count |
|-----------|-------------|
| `LCM Summaries` | 1253 |
| `Research/Ingested` | 111 |
| `Session Summaries` | 108 |
| `System/Intelligence Notes` | 92 |
| `Research` | 61 |
| `System` | 53 |
| `Claude-Code-Bot/sessions` | 26 |
| `Daily Notes` | 24 |
| `Architecture` | 15 |
| `Trajan/message-harvests` | 12 |
| `Agent Knowledge/researcher` | 11 |
| `Inbox` | 10 |
| `Architecture/Intelligence-Integrations` | 9 |
| `Operations` | 8 |
| `Research/AI-Knowledge` | 6 |
| `Projects` | 6 |
| `_hubs` | 6 |
| `Templates` | 5 |
| `Claude-Code-Memory` | 5 |
| `Agent-Learnings` | 5 |
| `Agent Knowledge/coder` | 5 |
| `Research/Competitive` | 5 |
| `Operations/Post-Mortems` | 5 |
| `Projects/EMA` | 4 |
| `Research/AI-Agents` | 4 |

## Recommendations

1. **Broken links (1497):** Many appear to be references to archived/moved notes (Roles, Prompts, Blueprints). Consider creating redirect stubs or cleaning up references.
2. **Orphan notes (1901):** 73% of notes have no incoming links. High-value directories to link-audit first:
   - `LCM Summaries` (1253 orphans)
   - `Research/Ingested` (111 orphans)
   - `Session Summaries` (108 orphans)
   - `System/Intelligence Notes` (92 orphans)
   - `Research` (61 orphans)
3. **Stale notes:** Not applicable yet — vault is <30 days old. Re-run audit after 2026-07-01.
4. **Session notes** and **daily notes** are expected orphans — consider excluding from future audits.

---
*Generated by vault-keeper audit agent, 2026-04-05.*