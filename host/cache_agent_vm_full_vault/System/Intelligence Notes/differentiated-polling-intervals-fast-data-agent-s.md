---
title: Differentiated Polling Intervals — Fast Data Polls Frequently, Slow Data Polls Less Often
type: reference
status: active
created: 2026-03-20
updated: 2026-04-06
source: intelligence extraction + Agent-OS frontend implementation context + realtime architecture cross-reference
confidence: 0.9
tags: [frontend, polling, realtime, performance, bridge, ux]
summary: Realtime UI best practice: poll fast-changing, operator-critical data more frequently than slow-changing collections. Example: agent status every 5s, queue/proposals every 10s. Reduces bridge load and pointless repainting while keeping the UI feeling alive.
related:
  - [[Agent-OS-Frontend]]
  - [[Phoenix WebSocket + React 19 + Zustand — HQ Pattern Research]]
  - [[Agent-OS UX Competitive Deep Dive]]
---

# Differentiated Polling Intervals — Fast Data Polls Frequently, Slow Data Polls Less Often

> The goal of polling is not “freshest possible data at all times.” The goal is to spend update budget where humans can actually feel the difference.

This note expands a small extracted tactic into a broader realtime UX/performance pattern.

---

## Executive Summary

Not all UI data changes at the same rate, and not all stale data hurts the user equally.

So instead of polling everything on one global interval, split data by **freshness sensitivity**.

### Example from the original pattern
- **agent status** every **5s**
- **queue / proposals** every **10s**

### Why it works
Because:
- agent status feels “live” and benefits from faster updates
- queue depth and proposal lists usually tolerate slower refresh
- the bridge/server avoids unnecessary duplicate work
- the frontend avoids excessive re-renders for low-volatility data

The deeper principle is:

> **Poll by volatility and user importance, not by implementation convenience.**

---

## The Problem This Solves

A single fixed polling interval across all data types creates predictable waste.

### If the interval is too fast
- bridge/server load rises unnecessarily
- repeated requests return unchanged payloads
- browser rendering churn increases
- logs/network traffic get noisy
- battery/network usage can worsen on mobile

### If the interval is too slow
- live surfaces feel dead
- operator trust drops (“is the system actually working?”)
- important state changes appear late
- users over-refresh manually

### If one interval is used for everything
You usually get the worst compromise:
- fast enough to be wasteful for slow-changing data
- still not fast enough for the things that most need to feel live

That is why differentiated polling is a real design pattern, not just a micro-optimization.

---

## Core Principle

Classify data by two axes:

### 1. Volatility
How often does this data actually change?

### 2. Perceptual importance
How much does the user's experience degrade if this data is stale for a few extra seconds?

That gives you better polling decisions than “everything every 5 seconds.”

---

## Example Classification Model

## Tier A — fast / operator-critical
Poll more frequently.

Typical examples:
- agent online/offline/running state
- currently active task progress
- streaming execution state
- “needs your input” blockers
- current system health if the UI is acting as a live control panel

Good interval range:
- ~2s to 5s when polling is unavoidable

### Why
These are the things users watch in real time.
If they feel stale, the whole product feels stale.

---

## Tier B — medium / situationally important
Poll at a moderate cadence.

Typical examples:
- queue depth
- active task list
- proposal counts
- recent completions
- alert counters

Good interval range:
- ~5s to 15s depending on churn

### Why
Fresh enough matters, but sub-second or very high-frequency polling does not usually improve user perception much.

---

## Tier C — slow / context data
Poll infrequently or only on demand.

Typical examples:
- historical records
- archived proposals
- configuration lists
- analytics summaries
- static metadata / reference lists

Good interval range:
- 30s+, manual refresh, or fetch-on-view

### Why
Polling this aggressively is almost pure waste.

---

## The Original Agent-OS Example

The extracted implementation guidance was:

> In `workbench.js initWorkbench()`, split `setInterval` calls by data freshness requirement: agents at 5000ms, queue + proposals at 10000ms.

That is a solid local example because it maps nicely to the above tiers.

### Why agent status deserves the faster interval
- it is often displayed prominently
- humans infer system liveness from it
- it changes more often during active runs
- delayed changes create confusion (“is that agent still running?”)

### Why queue/proposals can tolerate slower refresh
- they are collections, not heartbeat indicators
- they often change in bursts, not continuously
- a 10-second delay rarely harms actual decision-making

So the original tactical split is sound.

---

## Polling vs WebSockets / Push

Differentiated polling is valuable, but it is still a fallback compared with push-based realtime where available.

### Best general hierarchy

#### 1. Push / WebSocket / channels for truly live state
Use for:
- execution updates
- streaming logs
- agent lifecycle events
- task progress changes

#### 2. Polling for slower summaries and backstops
Use for:
- counts
- derived rollups
- proposal lists
- resilience against missed events or disconnected sockets

#### 3. On-demand fetch for cold data
Use for:
- archives
- deep detail panels
- rarely changing settings/reference pages

### Why this matters locally
The nearby Phoenix WebSocket note already points toward a better long-term pattern:
- socket/channel for live execution state
- store-managed connection lifecycle
- client-side filtered event flow

That means differentiated polling is best thought of as:
- a good current pattern for REST-heavy surfaces
- and a complementary strategy even after sockets exist

Not a permanent excuse to poll everything forever.

---

## Where This Pattern Helps Most

## 1. Bridge or control-room UIs
Operator dashboards where some elements must feel alive, but many panels can refresh more lazily.

## 2. Multi-panel apps
If a page contains:
- agent status
- queue summaries
- proposal lists
- system metrics
- archives

a single global interval is almost guaranteed to be wrong.

## 3. Transitional systems
Especially useful while migrating from:
- file/REST polling
to
- richer event-driven realtime infrastructure

## 4. Resource-constrained bridges
If the backend is a lightweight bridge process, reducing pointless polling directly helps stability.

---

## Better Than Two Fixed Intervals: Adaptive Polling

The 5s/10s split is good, but there are even better versions of the pattern.

## Pattern A — visibility-aware polling
If the tab or panel is hidden:
- back off polling

Example:
- visible tab: 5s
- hidden tab: 30s or paused

### Why
There is no reason to poll aggressively for UI the user cannot currently see.

---

## Pattern B — state-aware polling
Poll faster when the system is active, slower when it is idle.

Example:
- active agent running: 3–5s
- no active work: 15–30s

### Why
Freshness matters more during active execution than during idle periods.

---

## Pattern C — focus-aware polling
Poll a selected/expanded item more aggressively than the rest of the list.

Example:
- active task detail panel: 2–3s
- overall queue summary: 10s

### Why
Humans usually care most about the thing they are currently inspecting.

---

## Pattern D — error/backoff-aware polling
If the bridge/API starts failing:
- back off intervals automatically
- show degraded-state UX instead of hammering the server

### Why
A struggling backend should not be punished by client retry storms.

---

## Recommended Polling Matrix

A useful default matrix for an operator UI might look like this:

| Data Type | Example | Suggested Strategy |
|---|---|---|
| Streaming execution | logs, progress, running task state | WebSocket / push preferred; polling only as fallback |
| Agent liveness/status | active/idle/offline | 3–5s while visible |
| Active task list | running + blocked tasks | 5–10s |
| Queue / proposals | pending work, counts | 10–15s |
| System metrics | CPU/mem/disk | 10–30s depending on page role |
| Historical records | archives, completed items | 30s+ or manual |
| Static config/reference | agent cards, roles, settings | on load or manual refresh |

This is much closer to how people actually perceive “fresh enough.”

---

## UX Benefits

Differentiated polling is not only about performance.
It improves the feel of the product.

### 1. The UI feels alive where it matters
Status surfaces refresh quickly enough to create trust.

### 2. Less visual churn in low-priority areas
Slow-changing panels stop flickering or reordering unnecessarily.

### 3. Better mental model
The user learns what is “live” versus what is a slower summary.

### 4. Lower manual refresh impulse
If critical panels stay fresh, users are less likely to hammer refresh themselves.

---

## Backend / System Benefits

### 1. Lower bridge load
Fewer unnecessary requests for low-volatility endpoints.

### 2. Better scalability
More panels can coexist without creating silly polling storms.

### 3. Cleaner observability
Logs and API traces show more meaningful traffic patterns.

### 4. Easier prioritization
Backend resources naturally get allocated more to what matters most.

---

## Failure Modes / Anti-Patterns

## 1. One interval for everything
Convenient to code, usually wrong for users and infrastructure.

## 2. Over-optimizing freshness for invisible data
Polling archives and analytics every few seconds is usually waste.

## 3. Polling faster than the backend can produce meaningful change
If the source updates every 10 seconds, polling every second is just duplication.

## 4. No backoff on failures
This can turn a degraded backend into a fully overwhelmed backend.

## 5. Mistaking polling for realtime architecture
Polling can support a live-feeling product, but it is not the same as proper event-driven state.

## 6. Re-rendering entire pages on every poll
Even with differentiated intervals, frontend update granularity still matters.

---

## Implementation Guidance

A clean implementation usually means:
- separate fetch functions by data class
- separate timers/subscriptions by freshness class
- clear teardown on page unmount/navigation
- visible offline/degraded state when polling fails repeatedly

### Minimal pseudocode

```js
const FAST_MS = 5000
const SLOW_MS = 10000

const fastTimer = setInterval(fetchAgentStatus, FAST_MS)
const slowTimer = setInterval(() => {
  fetchQueue()
  fetchProposals()
}, SLOW_MS)
```

### Better version
Use:
- visibility checks
- adaptive intervals
- abortable fetches
- request coalescing / dedupe
- local state diffing before repaint

That turns a simple tactic into a sustainable realtime pattern.

---

## Relationship to the Wider System

This note fits with a broader local architecture pattern:
- use push where realtime truly matters
- use polling where summaries/backstops are enough
- store durable state elsewhere
- prioritize operator cognition, not just implementation convenience

That is also why the pattern belongs next to frontend/realtime notes rather than staying a lonely intelligence extraction.

---

## Bottom Line

Differentiated polling intervals are a small pattern with outsized leverage.

The key lesson is:

> **freshness should be allocated intentionally**.

Poll fast for the things users read as liveness.  
Poll slower for summaries and collections.  
Use push when you truly need realtime.  
Back off when nobody is looking or when the system is struggling.

That is how you build a UI that feels live without acting wasteful.

---

## Source Lineage

### Direct origin
- extracted from `task-75abbaaf.txt` on 2026-03-20

### Supporting local context
- [[Agent-OS-Frontend]]
- [[Phoenix WebSocket + React 19 + Zustand — HQ Pattern Research]]
- frontend realtime/operator UX notes

#frontend #polling #realtime #performance #bridge #ux
