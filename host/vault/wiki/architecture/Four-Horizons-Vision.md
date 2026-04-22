---
title: "Four Horizons Vision"
type: reference
created: 2026-04-06
tags: [architecture, strategy, vision, roadmap]
summary: "Strategic system evolution from queue-driven to full cognitive extension"
---

# Four Horizons Vision

## Horizon 1 (NOW): Queue-Driven

The system operates on explicit queues. Humans and crons generate tasks. Dispatch processes them.

**Key components:**
- `dispatch.sh` v2 -- File-based task dispatch from `~/dispatch/queue/`
- Signal converters -- Transform external events (GitHub webhooks, cron signals, Discord commands) into dispatch tasks
- Feedback loops -- Task outcomes feed back into the system to update priorities, flag failures, and trigger follow-up tasks

**Characteristic:** The system does what it's told, reliably. Human intent must be explicitly decomposed into tasks.

## Horizon 2 (30 days): Intent-Driven

The system understands intent and decomposes it into tasks autonomously.

**Key components:**
- Intent parsing -- Natural language input decomposed into structured task graphs
- Natural language -> decomposed tasks -- "Fix the deployment pipeline" becomes a set of investigation, implementation, and verification tasks
- Autonomous task decomposition -- The system plans multi-step workflows without human decomposition

**Characteristic:** The system understands what you want and figures out the steps. Human provides direction, system provides decomposition.

## Horizon 3: Anticipatory

The system predicts needs before they're expressed.

**Key capabilities:**
- Pattern recognition across past tasks, vault state, and calendar
- Proactive suggestions ("You usually review PRs Monday morning -- 3 are waiting")
- Pre-fetching and pre-computation of likely-needed information
- Anomaly detection ("Deployment hasn't run in 48 hours, usually runs daily")

**Characteristic:** The system acts before being asked, based on learned patterns. Human confirms or redirects rather than initiating.

## Horizon 4: Full Cognitive Extension

The system thinks alongside Trajan as a true cognitive partner.

**Key capabilities:**
- Shared mental models maintained in real-time
- Autonomous research and synthesis on open-ended questions
- Strategic reasoning and second-order consequence analysis
- Continuous background processing of information streams

**Characteristic:** The boundary between human thought and system thought blurs. The system is not a tool but a thinking partner.

## Cross-Cutting: Self-Learning as Core Product (DD-017)

Applies to all horizons. Every session must leave the system measurably smarter.

**Mechanisms:**
- Session outcomes persisted to vault with structured metadata
- Failed approaches recorded as dead ends (prevent re-exploration)
- Successful patterns extracted and codified as SOPs
- Agent performance tracked for routing optimization
- Knowledge gaps identified and queued for research

**Metric:** After N sessions, the system should handle recurring task types faster, with fewer errors, and with less human guidance than it did N sessions ago.
