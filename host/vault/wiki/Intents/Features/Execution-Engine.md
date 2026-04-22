---
title: "Execution Engine"
intent_level: 3
intent_kind: task
intent_status: implementing
intent_priority: 2
project: ema
parent: "[[EMA-OS]]"
tags: ["feature", "execution", "dispatch", "runtime"]
---

# Execution Engine

Execution-first runtime: dispatch, track, harvest results.

## What
Every unit of work is an Execution DB row linked to an intent. Dispatcher builds structured delegation packets, invokes Claude CLI, harvests results back into intent folders.

## Status
Backend operational. Frontend (ExecutionsApp) not yet built.

## Related
- [[depends-on::Actor-Workspace]] -- executions stamped with actor_id
- [[related::Proposal-Pipeline]] -- approved proposals create executions
