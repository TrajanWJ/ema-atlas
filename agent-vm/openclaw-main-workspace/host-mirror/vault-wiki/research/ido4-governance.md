---
title: ido4-governance
created: '2026-03-19'
updated: '2026-03-19'
type: research
status: active
source: unknown
tags: []
wiki_id: research/ido4-governance
imported_from: vault/Research/ido4-governance.md
imported_at: '2026-04-04T00:23:57.161Z'
summary: ''
---
# ido4 — Development Governance Platform

**URL**: https://github.com/ido4-dev/ido4  
**Stats**: 51 MCP tools, 1074 tests, TypeScript  
**Install**: `npm install @ido4/mcp` or `claude --plugin-dir ./packages/plugin`

## Core Concept

AI agents can write code. ido4 answers: **who ensures they follow your methodology?**

Traditional PM tools track work. ido4 **governs it in real time**. Rules are not suggestions — they are TypeScript validation code that the agent's own tool environment enforces. No hallucination, no bypass.

## The 5 Governance Principles

### 1. Epic Integrity
All tasks in an epic MUST be in the same wave. Shipping auth tokens in wave-002 but RBAC in wave-003 = incomplete security model. `EpicIntegrityValidation` blocks this deterministically.

### 2. Active Wave Singularity  
Only one wave active at a time. Focus. One wave to completion, then the next.

### 3. Dependency Coherence
A task's wave must be ≥ its dependencies' waves. Can't start the second floor before the foundation.

### 4. Self-Contained Execution
Each wave contains all dependencies for its own completion. No external blockers mid-wave.

### 5. Atomic Completion
A wave is complete ONLY when ALL tasks reach Done. 90% ≠ complete.

## Business Rule Engine (BRE)

27 validation steps across 5 categories, run on every task transition:

| Category | What It Validates |
|---|---|
| Workflow | Status transitions, state machine paths, required fields |
| Dependencies | Completion checks, circular detection, cascade analysis |
| Governance | Wave assignment, epic integrity, active wave singularity |
| Quality Gates | PR reviews, test coverage, security scans, task locks |
| Risk | AI suitability assessment, risk level enforcement |

Every validation = real TypeScript code execution, not LLM reasoning.

## Multi-Agent Coordination

**Registration**: Each agent registers with role + capabilities. Attribution on every action.

**Task Locking**: Exclusive locks before work begins (30min, configurable). Prevents duplicate effort.

**Intelligent Work Distribution** — `get_next_task` scores candidates on 4 dimensions:
- Cascade Value (0-40): how many tasks unblock downstream?
- Epic Momentum (0-25): how close is the epic to completion?
- Capability Match (0-20): does agent's declared capabilities match task?
- Dependency Freshness (0-15): was a dependency recently completed? (fresh context)

All scores **deterministic** — computed from graphs, ratios, vectors, timestamps. No LLM reasoning.

**Complete-and-Handoff**: atomic approve → release lock → identify newly unblocked → recommend next agent → suggest completing agent's next task.

## Application to OpenClaw

### Direct mappings:
- **Wave** → Sprint / Phase in dispatch system
- **Epic** → Project or feature cluster
- **Task Locking** → `~/dispatch/locks/<task-id>.lock`
- **BRE** → Validation in dispatch-engine.sh before spawning
- **Audit Trail** → Dispatch done/failed logs already exist
- **Work Distribution Score** → `priority` + `capability` fields in task JSON

### Governance rules we can enforce:
1. Don't spawn Task B if Task A (dep) is still in `active/`
2. Lock file prevents two agents running same task
3. Wave singularity: only one project phase active at a time
4. Cascade value: dispatcher prefers tasks that unblock the most others

### ido4 Anti-Patterns (apply to OpenClaw):
| Anti-Pattern | OpenClaw Prevention |
|---|---|
| Two agents on same task | Lock files in ~/dispatch/locks/ |
| Agent starts with incomplete deps | Dependency check in dispatch-engine.sh |
| Agents work on low-value tasks | Priority scoring with cascade_value field |
| No visibility into agent activity | Dispatch done/ logs + shared-state/ |

## Status
- Documented, not installed (requires GitHub Project V2, GITHUB_TOKEN)
- High value for: multi-agent Coder orchestration, quality gates on PRs
- Install when: actively running 3+ coding agents on same project
