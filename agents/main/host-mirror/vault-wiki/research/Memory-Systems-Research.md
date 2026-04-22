---
title: "Memory Systems Research"
type: reference
created: 2026-04-06
tags: [research, memory, architecture, ema]
summary: "Memory architecture comparison across 10+ systems, informing EMA design"
---

# Memory Systems Research

## Top Contenders

| System | Stars | Key Feature | Notes |
|---|---|---|---|
| **graphiti** (getzep) | 23.9K | Real-time knowledge graphs | Strong graph approach |
| **Letta/MemGPT** | 21.7K | Stateful agents, self-improving memory | Closest to EMA vision |
| **OpenViking** | 15.9K | Context database, filesystem paradigm | L0/L1/L2 tiers |
| **MemOS** | 7.4K | Memory OS, OpenClaw plugin | 72% lower token usage |

## MCP-Based Approaches

- **Claude-mem**: MCP memory server
- **Engram**: Persistent memory via MCP
- **SQLite-memory**: Structured persistent memory

## Specialized Approaches

| System | Key Feature |
|---|---|
| **Supermemory** | Static/dynamic profile split, relationship tracking, auto-forgetting |
| **Ori-Mnemos** | ACT-R cognitive decay model (37 stars, niche but interesting) |
| **EdgeHDF5** | Rust HDF5, 380us search at 100K memories |

## Architectural Patterns

- **Three-Tier Architecture**: Reconstructed as Mirror System with 4 features
- Common pattern: hot/warm/cold memory tiers with decay

## EMA Decision

Native implementation:
- **IntentStore** -- captures user intents
- **OutcomeStore** -- tracks results and feedback
- **ContextAssembler** -- rebuilds working context from stores

Rationale: No existing system combines local-first, vault-centric storage, cognitive decay modeling, and autonomous context assembly in a single package.
