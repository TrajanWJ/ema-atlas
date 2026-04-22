---
type: reference
domain: system-ops
confidence: 0.95
source: agent:vault-keeper
summary: "SSH-based Claude Code dispatch from agent-vm to host machine with collision detection and report delivery"
created: 2026-03-18
updated: 2026-03-18
aliases: [host-claude, host claude, remote claude]
title: "Host-Claude Workflow"
status: active
---

# Host-Claude Workflow

## Purpose

Dispatches Claude Code tasks to the host machine (FerrissesWheel) from the agent-vm via SSH. Used when work involves host-side files: Trajan's coding projects, host Obsidian vault, or host system configuration.

## Routing Rule

> **Files on VM → local claude. Files on host → host-claude. Never mix.**

When Trajan says "my projects" or "my vault" he means the HOST.

## Usage

```bash
~/bin/host-claude.sh <working-dir> "<prompt>" [timeout_seconds] [--force]
```

### Examples

```bash
# Fix build in a host project
~/bin/host-claude.sh ~/Desktop/Coding/myapp "fix the TypeScript build errors"

# Edit the host vault
~/bin/host-claude.sh ~/Documents/obsidian_first_stuff/twj1 "update the project note"

# Quick task with short timeout
~/bin/host-claude.sh /tmp "list running services" 60

# Force past collision check
~/bin/host-claude.sh ~/Desktop/Coding/myapp "fix build" 600 --force
```

## Features

| Feature | Detail |
|---|---|
| **Collision detection** | Checks for active Claude Code on host via `pgrep`; aborts unless `--force` |
| **Timeout** | Default 600s, configurable per-task; kills remote process on expiry |
| **Large output** | >4KB saved to `~/shared/reports/vm--result-*.md` |
| **Error reports** | Failures saved to `~/shared/reports/vm--error-*.md` |
| **Host notification** | Desktop notification on host when complete |

## Read-Only Host Access

For reading host state without dispatching work:

```bash
ssh host-machine "ls ~/Desktop/Coding/"                    # List projects
ssh host-machine "cat ~/Desktop/Coding/PROJECT/CLAUDE.md"  # Read CLAUDE.md
ssh host-machine "cd ~/Desktop/Coding/PROJECT && git status --short"
~/bin/host-project-index.sh                                # Active projects by recency
```

**Rule:** Read via SSH directly. Write only through `host-claude.sh`.

## Related

- [[Bridge Sync]] — file exchange between VM and host
- [[Host Machine Deep Crawl]] — host filesystem layout
- [[System Overview]] — two-machine architecture
