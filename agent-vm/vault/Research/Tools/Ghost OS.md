---
title: "Ghost OS"
created: 2026-03-16
updated: 2026-03-16
type: research
status: active
confidence: 0.80
confidence_updated: 2026-03-18
source: research
tags: [ai-agents, computer-use, macos, mcp, tools]
summary: "Ghost OS gives AI agents full computer-use on macOS by reading the accessibility tree — structured, labeled data about every element in every app. W"
---
# Ghost OS

> Full computer-use for AI agents. [[Self-learning]] workflows. Native macOS. No screenshots required.

## Info

| Field | Value |
|---|---|
| **Repo** | https://github.com/ghostwright/ghost-os |
| **Stars** | ~985 |
| **Language** | Swift |
| **License** | MIT |
| **Category** | Computer Use / AI Agent Automation |
| **Date Found** | 2026-03-16 |
| **Version** | v2.2.1 (March 2026) |

## Description

Ghost OS gives AI agents full computer-use on macOS by reading the accessibility tree — structured, labeled data about every element in every app. When the AX tree isn't enough (web apps, dynamic content), it falls back to a local vision model (ShowUI-2B) for visual grounding.

Key innovation: **[[self-learning]] recipes**. Show Ghost OS how to do something once (send an email, download a paper), and it synthesizes a parameterized, replayable JSON recipe. A frontier model figures out the workflow once; a small model runs it forever.

## Relevance to Stack

- **MCP compatible** — works with Claude Code, Cursor, VS Code, or any MCP client
- **Claude Code integration** — tagged with `claude-code` topic, designed to extend agent capabilities beyond the terminal
- **Complements [[OpenClaw]]** — [[OpenClaw]] operates browser DOM; Ghost OS operates native macOS apps (Slack, Finder, Messages, etc.)
- **Local-first** — data never leaves the machine, aligns with self-hosted philosophy
- **[[Self-learning]]** — recipes are JSON, transparent, editable, versionable

## Pros

- Accessibility tree approach is more reliable than screenshot-based computer use
- [[Self-learning]] recipes avoid repeated expensive reasoning
- MCP protocol means it plugs into existing Claude Code workflows
- MIT licensed, actively maintained (updated hours ago)
- Native macOS performance — no Docker, no VM overhead
- Companion project "Shadow" adds 14-modality capture and on-device LLM inference

## Cons

- macOS only — no Linux/Windows support (not useful on the agent VM itself)
- Requires macOS 14+ and Swift 6.2
- Needs accessibility and input monitoring permissions
- Still under 1k stars — relatively new project
- Vision fallback model (ShowUI-2B) adds ~2GB download

## Install

```bash
brew install ghostwright/ghost-os/ghost-os
ghost setup
```

## Links

- [[Self-Hosted AI Agent Platforms 2026]]
- [[My Stack Decisions]]

#tools #computer-use #ai-agents #macos #mcp
