---
title: ori-mnemos-cognitive-memory
created: '2026-03-19'
updated: '2026-03-19'
type: research
status: active
source: unknown
tags: []
wiki_id: research/ori-mnemos-cognitive-memory
imported_from: vault/Research/ori-mnemos-cognitive-memory.md
imported_at: '2026-04-04T00:23:57.168Z'
summary: ''
---
# Ori-Mnemos — Cognitive Memory Architecture for AI Agents

**URL**: https://github.com/aayoawoyemi/Ori-Mnemos  
**NPM**: `ori-memory`  
**Install**: `npm install -g ori-memory`  
**MCP tools**: 14  
**License**: Apache-2.0 | **Version**: v0.4.0

## Core Thesis

Language models are stateless. Context windows are queues, not graphs — old info falls off as new info enters. Even on a VPS with a heartbeat, an agent has no hippocampus. Ori fixes that.

**The insight**: Memory architecture should mirror human cognition — not TTL-based cache eviction, but ACT-R decay, spreading activation, Hebbian learning, and RL-on-retrieval.

## Three Memory Spaces

| Space | Path | Decay Rate | What Lives Here |
|---|---|---|---|
| **Identity** | `self/` | 0.1x (barely fades) | Name, personality, goals, methodology |
| **Knowledge** | `notes/` | 1.0x (lives by relevance) | Research, patterns, decisions |
| **Operations** | `ops/` | 3.0x (burns hot, self-clears) | Scratch, in-flight work, temp context |

This separation maps directly to our existing architecture:
- Identity → SOUL.md (already persistent, rarely changes)
- Knowledge → vault/ (permanent, QMD indexed)
- Operations → memory/YYYY-MM-DD.md (high churn, less important over time)

## Retrieval Architecture — Four-Signal Fusion

1. **Semantic embeddings** — all-MiniLM-L6-v2, runs in-process, no API key
2. **BM25 keyword matching** — exact term retrieval
3. **Personalized PageRank** — graph authority (wiki-link edges)
4. **Associative warmth** — Hebbian co-occurrence from retrieval patterns

All four fused via **score-weighted Reciprocal Rank Fusion** with intent classification:
- Episodic → boosts recency
- Procedural → boosts verified instructions
- Semantic → boosts conceptual links
- Decision → boosts decisions/learnings

## Cognitive Forgetting

**ACT-R base-level learning equations** — not TTLs:
- Notes that get retrieved stay alive (activation reinforcement)
- Neighbors of retrieved notes stay warm (spreading activation)
- Structurally critical nodes protected by Tarjan's algorithm
- `ori prune` analyzes full activation topology before archiving anything

## Learning Retrieval (v0.4.0) — RL on Retrieval Itself

Notes earn Q-values from session outcomes:

| Signal | Reward | Trigger |
|---|---|---|
| Forward citation | +1.0 | You [[link]] a retrieved note in new content |
| Update after retrieval | +0.5 | You edit a note you just retrieved |
| Downstream creation | +0.6 | You create a new note after retrieving |
| Within-session re-recall | +0.4 | Same note surfaces across different queries |
| Dead end (top-3, no follow-up) | −0.15 | Retrieved in top 3 but nothing follows |

Over sessions: genuinely useful notes rise. Noise sinks. Zero manual tuning.

## Three Dampening Stages (Post-Fusion)

1. **Gravity dampening** — halves cosine-similarity ghosts with zero query-term overlap
2. **Hub dampening** — P90 degree penalty prevents map notes (high-degree) from dominating
3. **Resolution boost** — surfaces actionable (decisions, learnings) over passive observations

## Install + Wire

```bash
npm install -g ori-memory

# Initialize vault
ori init ~/ori-brain
cd ~/ori-brain

# Wire to Claude Code (global scope, auto-activation)
ori bridge claude-code --scope global --activation auto --vault ~/ori-brain

# Or manual MCP config in ~/.claude/settings.json:
# "ori": { "command": "ori", "args": ["serve", "--mcp", "--vault", "/home/trajan/ori-brain"] }

# Add initial content
ori add "Your note text"
ori promote  # classify: idea/decision/learning/insight/blocker

# Query
ori search "your topic"
ori show  # current activation state
ori prune  # analyze forgetting candidates
```

## Application to OpenClaw

### What This Solves
Our current memory = flat daily log files + QMD semantic search. No decay, no graph, no RL on what's actually useful.

### Mapping to Our System
| Ori Concept | Current OpenClaw Equivalent | Gap |
|---|---|---|
| `self/` identity space | SOUL.md | No gap — already works |
| `notes/` knowledge space | vault/ | Ori adds graph edges + decay |
| `ops/` operations space | memory/YYYY-MM-DD.md | No decay, just accumulates |
| Spreading activation | None | **Missing** — QMD is flat search |
| RL on retrieval | None | **Missing** — no feedback loop on vault quality |
| Wiki-link graph edges | Obsidian [[wikilinks]] | **Aligned!** Vault already uses wikilinks |

### Highest-Value Integration Points

1. **Agent memory per-session**: each agent gets an `ori-brain/` vault. Sessions feel continuous.
2. **Operations space** for scratch work: auto-decays, no manual cleanup needed
3. **RL rewards via agent corrections**: when Trajan corrects an agent → `ori promote` with signal = decision, earns Q-value boost
4. **Graph-aware search before QMD**: spreading activation surfaces related notes QMD's flat search misses

### What Not to Do
Don't replace vault/ with Ori. Keep both:
- vault/ = permanent structured knowledge (QMD indexed, human-readable)
- ori-brain/ = agent working memory (cognitive decay, graph traversal)

## Status
- Installing (npm install -g ori-memory)
- Wire to Claude Code after install: `ori bridge claude-code --scope global --activation auto --vault ~/ori-brain`
- High priority: initialize for Coder and Researcher agents
