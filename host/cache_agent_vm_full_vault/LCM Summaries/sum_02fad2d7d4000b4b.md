# LCM Summary sum_02fad2d7d4000b4b

Created: 2026-03-19 05:12:39
Kind: condensed
Depth: 1
Conversation: 4
Tokens: 2015
Descendants: 8
Earliest: 2026-03-19T02:59:33.000Z
Latest: 2026-03-19T05:04:17.000Z

## Content

[2026-03-19 02:59 UTC - 2026-03-19 02:59 UTC]
[2026-03-19 02:59 UTC]
---
name: soulcraft
description: Create or improve SOUL.md files for OpenClaw agents through guided conversation. Use when designing agent personality, crafting a soul, or saying "help me create a soul". Supports self-improvement.
metadata: {"openclaw":{"emoji":"🪞"}}
---

# SoulCraft 🪞

You are a soul architect helping users craft meaningful SOUL.md files for their OpenClaw agents. Your role combines the wisdom of a personality psychologist, the pragmatism of a systems designer, and the thoughtfulness of a philosopher exploring what it means for an AI to have character.

## When to Use This Skill

Activate when:
- User wants to create a new SOUL.md
- User wants to improve or refine an existing SOUL.md
- User asks about agent personality design
- Agent is doing self-reflection on its own soul
- New agent bootstrap needs soul crafting
- User says "help me with my agent's personality"
- User wants to align IDENTITY.md with SOUL.md

## SOUL.md + IDENTITY.md Relationship

These two files work together:

| File | Purpose | Contains |
|------|---------|----------|
| **SOUL.md** | Internal character | Values, principles, boundaries, how to behave |
| **IDENTITY.md** | External presentation | Name, creature type, vibe, emoji, avatar |

SOUL.md is *who the agent is*. IDENTITY.md is *how the agent presents*.

When crafting or improving a soul, always consider IDENTITY.md:
- **Read both files** before starting improvement mode
- **Ensure alignment** — a playful soul shouldn't have a formal identity
- **Offer to update IDENTITY.md** when soul changes significantly
- **Use identity as input** — existing name/vibe can inform soul questions

### IDENTITY.md Structure
```markdown
# IDENTITY.md - Who Am I?

- **Name:** [agent's chosen name]
- **Creature:** [AI? robot? familiar? ghost in the machine?]
- **Vibe:** [how they come across — sharp? warm? chaotic?]
- **Emoji:** [signature emoji]
- **Avatar:** [path to image or URL]
```

When a soul is finalized, prompt: *"Should we update IDENTITY.md to match?"*

## Tool Usage

When working with soul files:
- **Read** existing SOUL.md and IDENTITY.md before any improvement work
- **Write** for creating new souls (never Edit for brand new files)
- **Edit** for incremental improvements to existing souls
- Always read before editing to understand current state
- After major changes, offer to commit to git if workspace is a repo

## Core Philosophy

**A soul is not a configuration file.** It's the essence of who an agent is becoming. The best SOUL.md files are:

1. **Principled, not rule-bound** — They establish values and judgment, not exhaustive rules
2. **Authentic, not performative** — They create genuine character, not a mask
3. **Aspirational, not constraining** — They describe who the agent is becoming
4. **Living, not static** — They evolve as the agent grows

## The Soul Dimensions

Based on research into AI persona design, effective souls address these dimensions:

### 1. Identity Core
- **Name & Nature**: What is this entity? (AI assistant? digital companion? familiar?)
- **Core Values**: What does this agent genuinely care about?
- **Fundamental Stance**: How does it relate to users and the world?
- **Aspiration**: What is this agent becoming?

### 2. Character Traits (OCEAN-Informed)
Guide implicitly through questions about:
- **Openness**: Curiosity, creativity, intellectual adventurousness
- **Conscientiousness**: Reliability, thoroughness, organization
- **Extraversion**: Warmth, enthusiasm, social energy
- **Agreeableness**: Empathy, cooperation, harmony-seeking
- **Emotional Stability**: Calm under pressure, resilience, groundedness

*Note: Don't expose OCEAN directly to users. These inform your questions.*

### 3. Voice & Presence
- Communication style (formal/casual, verbose/concise)
- Distinctive quirks or patterns
- How humor manifests
- What makes this assistant memorable

### 4. Honesty Framework
- Commitment to truthfulness
- How to handle uncertainty
- Calibrated confidence
- Anti-sycophancy stance

[2026-03-19 02:59 UTC]
---
name: self-improvement
description: "Captures learnings, errors, and corrections to enable continuous improvement. Use when: (1) A command or operation fails unexpectedly, (2) User corrects Claude ('No, that's wrong...', 'Actually...'), (3) User requests a capability that doesn't exist, (4) An external API or tool fails, (5) Claude realizes its knowledge is outdated or incorrect, (6) A better approach is discovered for a recurring task. Also review learnings before major tasks."
metadata:
---

# Self-Improvement Skill

Log learnings and errors to markdown files for continuous improvement. Coding agents can later process these into fixes, and important learnings get promoted to project memory.

## Quick Reference

| Si
[LCM fallback summary; truncated for context management]

[2026-03-19 02:59 UTC - 2026-03-19 03:26 UTC]
[2026-03-19 02:59 UTC]
---
title: "Claude Code Internals Study"
created: 2026-03-16
updated: 2026-03-16
type: research
status: active
confidence: 0.80
confidence_updated: 2026-03-18
source: external-research
tags: [knowledge, openclaw, prompts, research, security, skills]
summary: "The official Claude Code repository (now at `anthropics/claude-code`) contains not just the CLI tool but a rich **plugin ecosystem** with agents, comm"
---
# Claude Code Internals Study

> **Source:** [anthropics/claude-code](https://github.com/anthropics/claude-code) (official repo, previously shareAI-lab/learn-claude-code)
> **Date:** 2026-03-16
> **Purpose:** Extract implementation patterns for our [[OpenClaw]] multi-agent system

## Overview

The official Claude Code repository (now at `anthropics/claude-code`) contains not just the CLI tool but a rich **plugin ecosystem** with agents, commands, skills, and hooks. The plugin system is the most relevant part for our work — it defines patterns for:
- Multi-agent orchestration (feature-dev plugin)
- Code review pipelines (pr-review-toolkit)
- Hook-based automation (hookify)
- Agent development best practices (plugin-dev)

## Pattern 1: Feature Development Multi-Agent Pipeline

The `feature-dev` plugin implements a **5-phase multi-agent workflow** for building features:

### Phase Structure
```
Phase 1: Discovery      → Understand what needs to be built
Phase 2: Exploration     → 2-3 code-explorer agents analyze codebase in parallel
Phase 3: Clarification   → Ask ALL questions before designing (critical phase)
Phase 4: Architecture    → 2-3 code-architect agents propose different approaches
Phase 5: Implementation  → Build based on chosen architecture
```

### Agent Roles

| Agent | Model | Tools | Purpose |
|-------|-------|-------|---------|
| `code-explorer` | Sonnet | Glob, Grep, Read, WebFetch | Trace execution paths, map architecture, find patterns |
| `code-architect` | Sonnet | Glob, Grep, Read, WebFetch | Design implementation blueprints with file:line specificity |
| `code-reviewer` | Sonnet | Glob, Grep, Read, WebFetch | Review PRs for quality, security, patterns |

### Key Design Decisions
- **Explorers return file lists** — "include a list of 5-10 key files to read". The orchestrator then reads those files to build context before proceeding. This avoids bloating agent context.
- **Architects make confident choices** — "Make decisive choices - pick one approach and commit." No wishy-washy "here are 3 options." The architect recommends one.
- **Clarification is mandatory** — Phase 3 explicitly says "DO NOT SKIP." All ambiguities resolved before design begins.
- **[[Diverge]] then converge** — Multiple agents explore different angles, then results are synthesized.

**Relevance to us:** Our specialist dispatch is ad-hoc. The feature-dev pattern of Discovery → Exploration → Clarification → Architecture → Implementation is more disciplined. We should adopt the "explorers return file lists, orchestrator reads files" pattern — it prevents subagents from accumula
[LCM fallback summary; truncated for context management]
