---
title: "Babysitter System"
space: wiki
tags: ["architecture","babysitter","observability"]
source: manual
---

# Babysitter System

The most polished subsystem in EMA. Provides adaptive observability with semantic lane classification, dynamic cadence, emission tiers, and operator takeover.

## Components

| Module | Type | Purpose |
|--------|------|---------|
| `Ema.Babysitter.StreamTicker` | GenServer | Per-stream cadence management with activity scoring |
| `Ema.Babysitter.TakeoverManager` | GenServer | Operator takeover state machine |
| `Ema.Babysitter.ChannelPolicy` | Module | Emission tier decisions (hot/medium/quiet) |
| `Ema.Babysitter.StreamChannels` | Module | Semantic lane definitions and metadata |

## Semantic Lanes

Each stream belongs to a semantic lane that determines its behavior:

| Lane | Purpose | Example Streams |
|------|---------|----------------|
| `operator_rollup` | High-level system summaries | #babysitter-digest |
| `operations` | Infrastructure status | #system-heartbeat |
| `attention` | Items needing human attention | #pipeline-flow |
| `intelligence` | AI observations and synthesis | #intelligence-layer |
| `memory` | Knowledge capture events | #memory-writes |
| `thought` | Agent internal reasoning | #agent-thoughts |
| `intent` | Goal and intent tracking | #intent-stream |

## Cadence Buckets

| Bucket | Interval | When |
|--------|----------|------|
| `realtime` | ~30s | High activity or operator demand |
| `rapid` | ~2min | Active work detected |
| `steady` | ~10min | Normal operation |
| `default` | ~20min | Quiet periods |

Cadence adapts automatically based on:
- Weighted activity scoring from recent samples
- Token pressure awareness (backs off when budget constrained)
- Idle detection (quiets when no activity for extended period)
- Manual override via PUT endpoint

## Emission Tiers

ChannelPolicy selects emission tier per tick:

| Tier | Behavior |
|------|----------|
| `hot` | Emit immediately, rich content, full detail |
| `medium` | Emit with condensed content |
| `quiet` | Skip unless significant change detected |

## Takeover State Machine

Operators can override automatic cadence:

```
idle → active (POST /takeover/activate)
active → idle (POST /takeover/release)
active → idle (auto-release after timeout)
```

During takeover, automatic cadence decisions are suspended. The operator controls tick timing directly.

## REST API (8 endpoints)

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/babysitter` | List all streams with cadence state |
| GET | `/api/babysitter/:stream` | Single stream snapshot |
| PUT | `/api/babysitter/:stream` | Update stream config (override cadence) |
| POST | `/api/babysitter/:stream/activity` | Ingest activity event |
| POST | `/api/babysitter/:stream/tick` | Force a tick |
| GET | `/api/babysitter/:stream/takeover` | Takeover status |
| POST | `/api/babysitter/:stream/takeover/activate` | Activate takeover |
| POST | `/api/babysitter/:stream/takeover/release` | Release takeover |

## WebSocket

**Channel:** `babysitter:*` (one of 16+ implemented WebSocket channels in EMA)

- Join returns initial snapshot of all streams
- Pushes `stream_updated` events with full cadence/emission state
- Subscribes to PubSub topic `babysitter:<stream>`

## PubSub Topics

| Topic | Event | Purpose |
|-------|-------|---------|
| `babysitter:<stream>` | `{:babysitter_stream_updated, rendered}` | Per-stream updates |
| `babysitter:all` | `{:babysitter_stream_updated, rendered}` | Fan-out to all listeners |

## Discord Integration

Stream.Manager posts to 7 Discord channels on each tick:

| Channel | Cadence | Content |
|---------|---------|---------|
| `#system-heartbeat` | 5min | Narrative state snapshots |
| `#pipeline-flow` | 20min | Pipeline state transitions |
| `#agent-thoughts` | 10min | Active agent session summaries |
| `#intent-stream` | 15min | New intents/goals |
| `#memory-writes` | Event-driven | Session memory extractions |
| `#intelligence-layer` | 40min | Synthesized observations |
| `#babysitter-digest` | Adaptive 10-40min | Single-channel synthesis |

## CLI

```bash
ema watch                    # Live dashboard (polls all channels)
ema watch -c babysitter      # Babysitter-only view
ema watch -c heartbeat       # System heartbeat only
```

## Why It Matters

The babysitter is what makes EMA observable. Without it, you have 3 agents, 2 host crons, and dozens of OTP processes running blind. With it, you get adaptive narrative about what the system is doing, automatically tuned to how much is happening.

**Note:** Channel delivery (Discord posting) depends on Discord webhook configuration. If webhooks are not configured, stream ticks still run but emissions are not delivered externally.

## Related

- [[EMA Architecture Overview]]
- [[Dispatch Engine]]
- [[Stream-of-Consciousness]]
