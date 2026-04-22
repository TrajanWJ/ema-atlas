---
title: "Cross-Pollination Registry"
tags: ["reference", "github", "patterns"]
---

# Cross-Pollination Registry

Curated GitHub repos worth stealing patterns from for EMA. Trimmed 2026-04-12 — purged ~80% of prior list (Tier 2/3 noise, Tauri/Elixir-specific picks, and aspirational study repos).

> **Stack pivot in progress:** EMA is moving to a TypeScript / Electron monorepo. Repos previously kept for Tauri-traffic-lights, Elixir-Oban, Glass-CSS, and Phoenix-channels patterns have been removed — they no longer apply. Future picks should bias toward Node/TS, Electron, and SQLite-on-Node sources.

## Active List (preliminary)

### Personal productivity / ADHD-aware

| Repo | Why it's here |
|------|---------------|
| [mduffster/utility-explorer](https://github.com/mduffster/utility-explorer) | Personal CLI for ADHD workflows. Block tracking with **weekly** (not daily) targets, morning/evening routines, optional Gmail/Calendar/Git harvest, AI focus recommendations. Closest sibling to EMA's task model. |
| [super-productivity/super-productivity](https://github.com/super-productivity/super-productivity) | Open-source timeboxing + deep-work + GitHub/GitLab/Jira integration. Prior art for cross-tool integration layer. |
| [ActivityWatch/activitywatch](https://github.com/ActivityWatch/activitywatch) | Cross-platform passive time tracking. Reference for "what was I actually doing" harvesters. |
| [XargsUK/awesome-adhd](https://github.com/XargsUK/awesome-adhd) | Curated index. Use as a rabbit-hole, not a source. |

### Brain dump / second brain / quick capture

| Repo | Why it's here |
|------|---------------|
| [gnekt/My-Brain-Is-Full-Crew](https://github.com/gnekt/My-Brain-Is-Full-Crew) | **EMA's closest conceptual sibling.** ~2.7k⭐. 8 specialized agents + 14 skills managing an Obsidian vault. Single conversational interface with dispatcher routing, custom agent builder, "built for people who are drowning" framing. Read end to end. |
| [rashadphz/brain-dump-ai](https://github.com/rashadphz/brain-dump-ai) | Brain-dump → structured notes via AI. Pattern source for the BrainDump → Proposal seed transform. |
| [auxclawdbot/taskflow](https://github.com/auxclawdbot/taskflow) | Tiny but uncannily aligned. Markdown-first project mgmt with SQLite index, bidirectional sync, zero deps (`node:sqlite`). Direct reference for the wiki↔DB projector pattern. |

### Goal / habit / dashboard prior art

| Repo | Why it's here |
|------|---------------|
| [onejgordon/flow-dashboard](https://github.com/onejgordon/flow-dashboard) | Goal + task + habit tracker + personal dashboard. **Unmaintained** — read for the schema/model only. Prior art for goal-task-habit linkage. |

### Agent orchestration / parallel coding agents

| Repo | Why it's here |
|------|---------------|
| [shep-ai/shep](https://github.com/shep-ai/shep) | CLI + web dashboard orchestrating parallel AI coding agents in isolated worktrees. Prompt-to-PR pipeline, CI watch, auto-fix, 100% local SQLite, agent-agnostic (Claude Code / Cursor / Gemini). Pattern source for the dispatcher / execution lifecycle. |
| [johannesjo/parallel-code](https://github.com/johannesjo/parallel-code) | Desktop app: every AI coding agent gets its own git branch + worktree automatically. Same author as super-productivity. UX reference for the desktop side of multi-agent isolation. |
| [roboticforce/sugar](https://github.com/roboticforce/sugar) | Discover → Resolve → Verify → Ship pipeline for labeled GitHub issues. Persistent SQLite memory across 7 memory types, MCP integration. Pattern source for memory-typing and the resolution pipeline shape. |
| [wshobson/agents](https://github.com/wshobson/agents) | Multi-agent orchestration for Claude Code. Worth scanning for agent role taxonomy. |
| [codeninja/oauth-cli-coder](https://github.com/codeninja/oauth-cli-coder) | OAuth-flow CLI coder. Reference for CLI auth/identity patterns. |

## Removed from prior registry

The following were dropped on 2026-04-12 because they targeted the old Tauri/Elixir/Glass stack or were aspirational study repos:

- **Tier 1:** langfuse, chainlit, oban, posting, trogon, toolong, broot, tauri-ui
- **Tier 2:** obsidian-dataview, obsidian-projects, plane, juggl, breadcrumbs, rivet, agentops
- **Tier 3:** dify, zed, affine, tldraw, appflowy, livebook, Loop Habits, harlequin, yazi, superfile
- **Already integrated:** k9s, lazydocker, nb, aider, fabric, dooit, codex-design-tokens

If a removed repo turns out to apply to the Electron/TS rebuild, re-add it with a fresh "why" line — don't restore the old framing.
