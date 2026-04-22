---
id: "9820eae8-9abf-455a-bb56-4d30502e0c45"
title: ""
space: wiki
tags: []
source: manual
---

---
title: Intent→Execution Wiring Blueprint
tags: [architecture, intents, execution, wiring, critical]
source: session-2026-04-07
---

# Intent → Execution Closure Blueprint

## Current State: DISCONNECTED
Intent folder → IntentParser → KnowledgeGraph → (GAP) → Proposal → (MANUAL) → Execution → (GAP) → Tasks

## Target State: CLOSED LOOP
Intent → auto-generate proposals → UNIFY phase → auto-decompose tasks → dispatch via DAG → execute → reflect → UNIFY reconciliation → feedback to seeds → better intents

## 4 Patterns to Wire

### 1. AutoDecomposer (on proposal approval)
Coordinator agent breaks approved proposal into 5-10 tasks with dependencies.
Calls DependencyGraph.set_dependencies() to wire edges.

### 2. Mandatory UNIFY Phase (3 variants)
- Pre-decomposition: verify spec completeness before breaking into tasks
- Post-execution: compare actual vs planned, update proposal.validation_score
- Mid-execution: if 2x estimated time, pause and reassess

### 3. Execution DAG with Resume
Persist step-level state in DB. On crash, query running/waiting executions and resume from last checkpoint. Saga compensations for multi-step failures.

### 4. Error Classification + Recovery
5 levels: SYNTAX → auto-fix | RUNTIME → debugger | LOGIC → hypothesis | ENVIRONMENT → install | SPECIFICATION → replan
60-80% auto-recovery for SYNTAX/ENVIRONMENT.

## Success Metrics
- Intent→Execution: manual 6-8h → autonomous 10-30min
- Proposal→Tasks: manual → automated <1min  
- Failure recovery: 0% → 60-80% auto
- Task resumption: manual rebuild → DAG resume <5min
