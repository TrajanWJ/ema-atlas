---
title: "Wiki as Agent Memory Layer Intent"
type: intent
status: active
priority: medium
project: Wiki
created: 2026-04-04
updated: 2026-04-04
summary: "Every agent session creates a wiki page. Agent's next session starts with recent session pages as context. Wiki replaces scattered Agent Knowledge/ files."
tags: [wiki, agents, memory, context, intent]
intent_type: architecture
---

# Wiki as Agent Memory Layer Intent

## Goal
Wiki is persistent agent memory. Sessions create pages. Pages feed next sessions. Agents can search their own history.

## Current State
Agent learnings scattered across:
- vault/Agent Knowledge/{agent}/*.md
- vault/Agent-Learnings/*.md
- MEMORY.md (session-level only)
- agent-performance.md (fitness scores)

Nothing queryable by agents at dispatch time. Memory dies with context window.

## Target State
- Every significant agent session → type:session-summary wiki page (auto-created)
- Dispatch → wiki injects relevant recent session pages
- Agents search: `wiki_search(agent:researcher, topic:wiki-engines)`
- Evolution: pages tagged with impact scores feed fitness tracking

## Implementation
- OpenClaw session end hook: write session summary to wiki
- wiki_context() includes last 3 session pages for that agent
- Agent learnings auto-appended to agent profile page

## Status
- [ ] Session end hook in OpenClaw
- [ ] Agent profile pages (type:agent-profile) created
- [ ] wiki_context includes agent memory
