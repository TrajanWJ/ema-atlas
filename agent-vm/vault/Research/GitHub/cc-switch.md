---
title: "cc-switch: GitHub Research"
type: research
created: 2026-04-01
confidence: 0.88
tags: [github, claude, session-management, cli, mcp, openclaw, tauri, desktop-app]
summary: "Cross-platform desktop GUI managing Claude Code, OpenClaw, Codex, Gemini CLI, OpenCode: provider switching, MCP sync, session history."
---

# cc-switch: Research Report
*Sources: 2 total (2 primary — direct repo fetch, 0 secondary)*
*Confidence: High | Date: 2026-04-01*

## Summary

CC Switch is a cross-platform desktop application (Tauri 2 / React 18 / Rust) that provides a unified GUI for managing five AI CLI tools: Claude Code, OpenClaw, Codex, Gemini CLI, and OpenCode. It handles provider configuration switching, MCP server management with cross-app sync, session history browsing, cloud sync, and cost tracking — eliminating manual config file editing. With 36.5k stars and v3.12.3, it is actively maintained and highly popular. It has direct relevance to OpenClaw and agent system configuration workflows.

## Findings

### What It Does

CC Switch solves the problem of managing multiple AI CLI tools that each require separate configuration files. Rather than manually editing `~/.claude/`, `~/.openclaw/`, or provider JSON files, users manage everything from a single desktop application with a visual interface.

Core capabilities:
- **One-click provider switching** — 50+ built-in provider presets (OpenAI, Anthropic, Ollama, Azure, etc.)
- **Unified MCP management** — Single panel managing MCP servers across all four apps, with bidirectional sync and Deep Link import support
- **Cross-app config sync** — `CLAUDE.md`, `AGENTS.md`, `GEMINI.md` synced across apps with backfill protection
- **Session history** — Browse, search, and restore conversation history across all CLI tools
- **Local proxy mode** — Format conversion between provider APIs, hot-switching, auto-failover
- **Cloud sync** — Dropbox, OneDrive, iCloud, WebDAV for config portability
- **Usage/cost dashboard** — Token tracking and spend analytics

### OpenClaw-Specific Integration

CC Switch treats OpenClaw as a first-class citizen alongside Claude Code. Explicitly documented:

- **Workspace Editor** — Edits OpenClaw agent files including `AGENTS.md` and `SOUL.md` with Markdown preview
- **Provider sync** — "One config syncs to multiple apps (OpenCode, OpenClaw)"
- **MCP sync** — MCP server configs propagate to OpenClaw alongside other tools

This means cc-switch could serve as a management layer for OpenClaw agent configuration, particularly for syncing providers and MCP servers across environments. The mention in context ("Build MCP server and wire up cc-switch and CLI to call invisible Claude CLI for session management") suggests it's being evaluated as the configuration backbone for multi-agent session management.

### Relevance to Agent Systems / MCP / Vault / Automation

**High relevance** across several dimensions:

| Dimension | Relevance | Notes |
|---|---|---|
| Agent system config | High | Manages AGENTS.md / SOUL.md directly |
| MCP server management | High | Unified MCP panel with cross-app sync |
| Session management | Medium-High | Browse/restore session history across apps |
| Vault integration | Low-Medium | No direct vault support, but CLAUDE.md sync is adjacent |
| Automation | Medium | Primarily GUI-driven; no CLI scripting API documented |

The "invisible Claude CLI" phrasing in the task context suggests the intended use is programmatic: either cc-switch exposes an API/CLI interface for scripted session management, or the goal is to use it to configure providers that agents then call headlessly. This warrants deeper investigation into whether cc-switch has a CLI mode or REST API.

### Quality Signals

- **Stars**: 36,500 — exceptional for a CLI tooling project; indicates broad adoption
- **Forks**: 2,200 — active derivative development
- **Commits**: 1,348 — sustained development history
- **Version**: 3.12.3 — mature versioning, not a prototype
- **Tech stack**: Tauri 2 + Rust + React 18 — modern, well-chosen stack for a cross-platform desktop app
- **License**: MIT — permissive, no commercial restrictions
- **Platform support**: Windows 10+, macOS 12+, Linux (Ubuntu 22.04+) — production-grade cross-platform

Assessment: This is a high-quality, actively maintained project. The star count and fork count are well above typical tooling projects. Not a toy or experiment.

### Potential Limitations / Concerns

- **GUI-first design**: The application appears primarily visual. Whether it exposes a programmatic API for agent-driven configuration is unclear from the README alone. The "call invisible Claude CLI" use case may require cc-switch to have a headless/daemon mode that hasn't been confirmed.
- **Config coupling**: Syncing configs across multiple tools is powerful but creates a single point of failure. An agent that misconfigures cc-switch could affect all five CLI tools simultaneously.
- **Blast radius**: Any change propagated via cc-switch's cross-app sync hits multiple tools. Agents interacting with it should do so carefully.

## Key Takeaways

- CC Switch is the most capable known tool for unified management of Claude Code + OpenClaw configuration, MCP servers, and session state
- The direct support for `AGENTS.md` and `SOUL.md` editing makes it directly relevant to this OpenClaw deployment
- Investigate whether cc-switch exposes a CLI or REST API for programmatic/headless use — this is the critical unknown for the "invisible Claude CLI session management" use case
- Star count (36.5k) and maturity (v3.12.3) make this a safe dependency choice

## Open Questions

1. Does cc-switch have a headless/CLI mode for programmatic invocation?
2. Is there a REST or IPC API for agent-driven provider switching?
3. How does cc-switch store session data — is it queryable without the GUI?
4. What specifically does the MCP Deep Link import format look like?

## Sources

1. [T1] [farion1231/cc-switch — GitHub](https://github.com/farion1231/cc-switch) — Primary repo page, star count, description
2. [T1] [farion1231/cc-switch README.md (raw)](https://raw.githubusercontent.com/farion1231/cc-switch/main/README.md) — Full README, feature list, OpenClaw integration details

## Related Notes

- [[openclaw-mcp]] — MCP server for OpenClaw; cc-switch manages MCP configs that could include this
- [[obsidian-mcp-server]] — Another MCP server managed via cc-switch's unified panel
