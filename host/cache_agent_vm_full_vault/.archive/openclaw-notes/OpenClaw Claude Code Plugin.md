---
title: "OpenClaw Claude Code Plugin"
created: 2026-03-14
updated: 2026-03-16
type: reference
status: active
confidence: 0.80
confidence_updated: 2026-03-18
source: reference
tags: [claude-code, containers, multi-agent, openclaw]
summary: "Allows [[OpenClaw]] agents to spawn isolated Claude Code sessions in rootless Podman containers. Each session runs with `--dangerously-skip-permission"
---
# OpenClaw Claude Code Plugin

> Run Claude Code CLI sessions in isolated containers as an [[OpenClaw]] tool.

---

## What It Does

Allows [[OpenClaw]] agents to spawn isolated Claude Code sessions in rootless Podman containers. Each session runs with `--dangerously-skip-permissions` inside hard containment.

| Field | Value |
|---|---|
| **Source** | [13rac1/openclaw-plugin-claude-code](https://github.com/13rac1/openclaw-plugin-claude-code) |
| **Status** | Not installed — available for future use |
| **Requires** | Podman (rootless) or Docker, [[OpenClaw]] >= 2025.1.0 |

## Current Approach

We don't use this plugin. Instead, Right Hand spawns Claude Code directly via `sessions_spawn` or background `exec` with `--print --permission-mode bypassPermissions`. This works well for our single-VM setup without the overhead of container isolation per coding session.

## Tools Provided (if installed)

| Tool | Purpose |
|---|---|
| `claude_code_start` | Launch a background Claude Code task |
| `claude_code_status` | Check job status |
| `claude_code_output` | Read/tail job output |
| `claude_code_cancel` | Stop a running job |
| `claude_code_cleanup` | Remove idle sessions |
| `claude_code_sessions` | List all active sessions |

## Related Notes

- [[Reference/System Services]] — current service setup
- [[Agents/OpenClaw]] — gateway configuration

#openclaw #claude-code #containers #multi-agent
