---
title: "Stream-of-Consciousness"
space: wiki
tags: ["architecture","stream","discord"]
source: manual
---

# Stream-of-Consciousness

The Stream layer posts narrative updates to Discord channels on a cadence controlled by the Babysitter.

## Components

| Module | Purpose |
|--------|---------|
| `Ema.Stream.Manager` | GenServer managing tick counters, incidents, transitions, intents, thoughts |
| `Ema.Stream.Babysitter` | Stream babysitter integration |
| `Ema.Stream.ChannelManager` | Discord channel lifecycle (create, archive, set topic) |
| `Ema.Feedback.Broadcast` | Bridge between internal events and Stream.Manager |

## Discord Channels (7 semantic streams)

| Channel | Cadence | Content |
|---------|---------|---------|
| `#system-heartbeat` | 5min | Narrative state snapshots; silent if all-clear |
| `#pipeline-flow` | 20min | Pipeline state transitions; skips if no changes |
| `#agent-thoughts` | 10min | Active agent session summaries |
| `#intent-stream` | 15min | New intents/goals; skips if empty |
| `#memory-writes` | Event-driven | Session memory extractions |
| `#intelligence-layer` | 40min | Synthesized observations; skips if nothing to say |
| `#babysitter-digest` | Adaptive 10-40min | Single-channel synthesis of system state |

## Recording API (Internal)

The Stream.Manager exposes recording functions consumed by other subsystems:

| Function | Purpose |
|----------|---------|
| `record_incident(description)` | High-urgency alerts |
| `record_transition(from, to, label)` | State transitions |
| `record_intent(intent)` | Goal/intent logging |
| `record_thought(session_id, summary)` | Agent thoughts |
| `record_memory_write(entry, tags)` | Memory extractions |
| `tick_now()` | Force immediate emission |
| `snapshot()` | Get current state |

## How Cadence Works

The Babysitter's StreamTicker controls when each stream emits. Stream.Manager accumulates events between ticks. When a tick fires:

1. ChannelPolicy checks emission tier (hot/medium/quiet)
2. If tier allows emission, Manager renders content for that stream
3. Content posted to Discord via webhook
4. Event broadcast to PubSub for WebSocket listeners

## CLI Mirror

```bash
ema watch                    # All streams, polling
ema watch -c heartbeat       # System heartbeat only
ema watch -c pipeline        # Pipeline flow only
ema watch -c babysitter      # Digest only
```

The CLI's `watch` command polls the daemon REST API and renders the same semantic lanes that Discord receives.

## Related

- [[Babysitter System]]
- [[EMA Architecture Overview]]
