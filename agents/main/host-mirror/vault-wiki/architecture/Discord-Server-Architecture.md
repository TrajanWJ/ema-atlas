---
title: "Discord Server Architecture"
type: reference
created: 2026-04-06
tags: [architecture, discord, infrastructure, bots]
summary: "Discord server infrastructure, channels, bots, and agent identity system"
---

# Discord Server Architecture

## Server Identity

- **Guild ID:** 1482230800916287710

## Bot Accounts

| Bot | ID | Purpose |
|---|---|---|
| traclaw1 | 1482234846934990918 | Primary bot, Right Hand agent |
| claudecode_seedofarsonVM | 1482938994022158430 | Secondary bot, 2x rate limit capacity |

Two OAuth accounts provide double Discord API rate limit capacity (see [[Architecture-Decisions-Log#AD-008]]).

## Channel Architecture

18+ channels organized by function:

| Channel | Purpose |
|---|---|
| general | Primary interaction surface |
| cool-discord | Curated Discord discoveries and patterns |
| sourced-hq-inspo | High-quality sourced inspiration |
| github-interesting | Notable GitHub repos and activity |
| dashboard | System status and metrics |
| openclaw-setup | OpenClaw configuration and status |
| interviewer | Interview prep and practice |
| skill-audit | Skill tracking and gap analysis |
| vault-feed | Vault changes and new content notifications |
| next-steps | Prioritized action items |
| logs | System and agent logs |
| agent-standards | Agent behavior standards and guidelines |

### Dynamic Channels

Created and destroyed as needed for specific workflows:

- discord-v5-config-repair
- red-team-criticals
- mac-mini-migration
- dispatch-queue-clearing

## Agent Identity System

Seven agent identities, each with a distinct color:

| Agent | Color | Hex |
|---|---|---|
| Right Hand | Amber | #E8A838 |
| Researcher | Teal | #2BA89E |
| Coder | Green | #57A773 |
| Ops | Slate | #6C7A89 |
| Security | Red | #E74C3C |
| Vault Keeper | Purple | #9B59B6 |
| Scout | Orange | #E67E22 |

### Identity Bar Format

Every agent message begins with an identity bar:

```
{emoji} **{Name}** . #{channel} . {mode}
> delegation routing line
```

Example:
```
:sparkles: **Right Hand** . #general . direct
> delegated from: Orchestrator | task: vault-sync
```

## EMA Integration Options

Two approaches evaluated for connecting EMA to Discord:

- **Option A (Nostrum native):** EMA connects to Discord directly via the Nostrum Elixir library. Native integration, full control, but adds Discord as a direct dependency of EMA.

- **Option B (OpenClaw proxy):** EMA communicates through OpenClaw, which handles Discord rendering. Keeps EMA surface-independent (aligns with [[Architecture-Decisions-Log#AD-003]]) but adds a hop.
