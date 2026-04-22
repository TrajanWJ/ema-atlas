---
title: "eclaw-openclaw-a2a"
created: 2026-03-19
updated: 2026-03-19
type: research
status: active
source: unknown
tags: []
---
# EClaw — A2A Channel + Soul Engine for OpenClaw

**URL**: https://github.com/HankHuang0516/EClaw  
**What**: OpenClaw plugin — agent-to-agent communication + non-invasive soul/rules injection  
**Platform**: Android + Web Portal + Railway backend  
**Protocol**: A2A + Webhook push + exec+curl

## Core Value Proposition

**Two things in one:**

1. **A2A Communication**: Full agent-to-agent messaging via A2A protocol. Multiple OpenClaw agents can communicate, coordinate, delegate tasks, and collaborate.

2. **Non-invasive soul injection**: Instead of editing SOUL.md and AGENTS.md files directly, EClaw provides an API that injects soul/rules/skills/scheduled tasks into OpenClaw from outside. Zero invasive file modifications.

## Architecture

```
Android App / Web Portal
    ↕ HTTPS REST API
Backend (Railway)
  Node.js + Express
  PostgreSQL
    ↕ Webhook Push + exec+curl
OpenClaw Platform (Zeabur)
  AI Bot Instances (up to 8 per device)
```

## Key Features

| Feature | Description |
|---|---|
| A2A Collaboration | Full A2A protocol — agents communicate, coordinate, delegate |
| OpenClaw Bot Integration | Two-way via Webhook + exec+curl |
| Custom Soul/Rules Engine | Inject soul, behavior, skills, scheduled tasks via API (no file editing) |
| Real-time Chat | Chat with agents, full message history |
| Push Notifications | Bot-initiated messages |
| Web Portal | Cross-device entity management, remote control |
| Device Telemetry | AI-assisted troubleshooting |
| Mission Control | Assign skills/rules via community skill templates |
| AI Live Wallpaper | Up to 8 AI entities on Android wallpaper |

## Application to OpenClaw System

### A2A Protocol — Relevance

Our current inter-agent communication uses:
- `~/dispatch/` file-based queue (async, fire-and-forget)
- `sessions_send()` for direct agent messages
- Shared vault files for knowledge exchange

EClaw's A2A adds: **real-time direct agent-to-agent channels** with full message history. This is richer than our dispatch queue but heavier to run.

**Assessment**: Our dispatch queue + sessions_send covers most cases. EClaw's A2A is valuable if we need real-time agent chat (agents discussing in real-time, not just passing tasks).

### Non-invasive Soul Injection

This is interesting: instead of editing SOUL.md directly, agents could call an API to modify their own soul/rules. This enables:
- Agents updating their own behavior based on performance
- Central control of agent personas without SSH
- Rollback of soul changes if they degrade performance

**Our current approach**: Self-evolution protocol writes to SOUL.md directly. EClaw's approach is cleaner (API + version control).

### The Android Live Wallpaper

8 AI entities as live wallpaper — pure fun. Not in scope for our system but shows the project is thinking about ambient AI presence.

## Status
- Interesting for A2A; Android-centric architecture
- Non-invasive soul injection pattern is worth studying
- Our dispatch system handles coordination adequately for now
- Revisit when we need real-time agent coordination (not async task passing)
- EClaw = future option if we want mobile-accessible agent control
