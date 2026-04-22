---
title: "Proposal Pipeline"
intent_level: 3
intent_kind: task
intent_status: active
intent_priority: 2
project: ema
parent: "[[EMA-OS]]"
tags: ["feature", "proposals", "pipeline", "ai"]
---

# Proposal Pipeline

9-stage AI proposal generation and review pipeline.

## What
Scheduler to Generator to Refiner to Debater to Tagger to Combiner. KillMemory tracks killed patterns. Seeds drive generation. Human approves/redirects/kills.

## Status
Fully operational. All stages wired via PubSub.

## Related
- [[related::Execution-Engine]] -- approved proposals create executions
