---
title: "OpenClaw System Environment"
type: reference
created: 2026-04-06
tags: [openclaw, archived, environment, tools, infrastructure]
summary: "Complete system environment documentation from TOOLS.md - machine specs, services, skills, auth, and integrations"
---

# OpenClaw System Environment

Historical documentation of the OpenClaw runtime environment and tooling.

## Machine Specs

- **Host:** agent-vm (KVM virtual machine)
- **IP:** 192.168.122.10
- **OS:** Ubuntu, Linux 6.8.0-101-generic (x64)
- **RAM:** 14 GB
- **vCPUs:** 6
- **User:** trajan (NOPASSWD sudo)
- **Node:** v22.22.1
- **OpenClaw:** v2026.3.12

## Key Paths

| Path | Purpose |
|------|---------|
| `/home/trajan/vault/` | Obsidian knowledge vault |
| `/home/trajan/skills/` | ClawHub-installed skills |
| `~/.openclaw/` | OpenClaw config and state |
| `~/.openclaw/agents/main/workspace/` | Main agent workspace |
| `/usr/bin/claude` | Claude Code CLI |
| `/usr/bin/openclaw` | OpenClaw CLI |

## Services

| Service | Port | Management |
|---------|------|------------|
| openclaw-gateway | 18789 | `sudo systemctl restart openclaw-gateway` |
| Claude Code | CLI | `claude /login` to re-auth |
| QMD | cron/30min | `qmd update && qmd embed` |

## Authentication

- Claude Max subscription with OAuth tokens (`sk-ant-oat01-*`)
- Token auto-synced every 30min via cron
- Auth-profiles format: `version: 1`, `type: "token"`, field `token` (NOT `accessToken`)
- Recovery: `claude /login` on VM, then `/home/trajan/bin/refresh-claude-token.sh`

## Execution Config

- `security=full` -- all commands allowed
- `ask=off` -- no approval prompts
- `host=gateway` -- exec on local machine
- Wildcard allowlist for all agents

### Obfuscation Detection (Hardcoded)

OpenClaw had a hardcoded obfuscation detector that forced approval prompts regardless of settings for:
- `curl/wget | sh/bash` (pipe remote to shell)
- `base64 -d | sh` (decode + exec)
- `eval` with encoded input
- Process substitution from remote
- Octal/hex escape sequences

Workaround: download files first, then execute separately.

## Installed Skills (34 total)

### Bundled (11)
coding-agent, discord, github, gh-issues, clawhub, healthcheck, session-logs, skill-creator, tmux, video-frames, weather

### ClawHub Installed (23)
agent-browser, agent-team-orchestration, agentic-workflow-automation, auto-knowledge, clawdefender, clawsec, config-guardian, deep-research-pro, deep-scraper, discord-voice, fast-browser-use, knowledge-graph, obsidian-conversation-backup, obsidian-ontology-sync, obsidian-openclaw, openclaw-anything, openclaw-guardian-ultra, openclaw-mcp-plugin, security-audit-toolkit, system-resource-monitor, tiktok-analyzer, x-twitter-scraper

## Plugins

| Plugin | Purpose |
|--------|---------|
| memory-core | BM25 memory search + session memory |
| llm-task | Structured sub-task delegation |
| lobster | Resumable multi-step workflows |

## Claude Code Integration Pattern

```bash
# Foreground (quick tasks)
cd /path/to/project && claude --permission-mode bypassPermissions --print 'task'

# Background (long tasks)
bash workdir:~/project background:true command:"claude --permission-mode bypassPermissions --print 'task'"
```

Rules: Never spawn Claude Code inside `~/.openclaw/`, use `--print --permission-mode bypassPermissions`

## Vault Structure (Historical)

- `Research/` -- evaluated technologies, deep dives
- `Reference/` -- setup guides, service docs
- `Configuration/` -- Docker Stack, Networking
- `Architecture/` -- System Overview, Design Decisions
- `Operations/` -- Quick Reference, VM Management
- `Security/` -- Hardening, Threat Model
- `Agents/` -- Agent docs, platform docs
- `Logs/` -- Setup Log

## Related

- [[OpenClaw System Overview]]
- [[OpenClaw Cron and Automation]]
