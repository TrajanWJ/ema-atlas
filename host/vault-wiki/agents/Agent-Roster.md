---
title: "Agent Roster"
type: reference
created: 2026-04-06
tags: [agents, roster, dispatch]
summary: "All 29 configured agents with roles, fitness scores, and dispatch heuristics"
---

# Agent Roster

29 agents configured across 6 categories.

## Core

| Agent | Role |
|---|---|
| **main** | Right Hand -- primary dispatch target |
| **researcher** | Research and analysis |
| **coder** | Implementation |
| **ops** | Infrastructure and operations |
| **concierge** | User-facing coordination |

## Specialist

| Agent | Role |
|---|---|
| **browser-automation** | Web scraping, testing |
| **codex** | Code generation via Codex |
| **architect** | System design |
| **prompt-engineer** | Prompt crafting and optimization |
| **strategist** | Strategic planning |

## Review

| Agent | Role |
|---|---|
| **security** | Security review |
| **devils-advocate** | Challenge assumptions |
| **quality-lead** | Quality assurance |
| **analyst** | Data analysis |

## Management

| Agent | Role |
|---|---|
| **pm** | Project management |
| **chief-of-staff** | Coordination and oversight |
| **tech-lead** | Technical direction |

## Utility

| Agent | Role |
|---|---|
| **vault-keeper** | Knowledge base maintenance |
| **community-scout** | Reddit/Discord monitoring |

## CLI / Integration

claude, claude-code, claudecode, default

## Fitness Scores

| Agent | Score |
|---|---|
| Prompt Engineer | 1.00 |
| Ops | 0.92 |
| Researcher | ~0.85 |
| Coder | ~0.50 |
| Vault Keeper | 0.36 |

Scores inform dispatch heuristics -- higher score = more reliable for that task type. Each agent has identity colors and Discord routing configuration.
