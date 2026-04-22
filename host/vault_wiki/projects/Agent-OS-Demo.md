---
title: "Agent OS Demo"
type: reference
created: 2026-04-06
tags: [project, agent-os, demo, knowledge-graph, vanilla-js]
summary: "Interactive web app demo showcasing the Agent OS concept with multiple views"
---

# Agent OS Demo

Interactive web application demonstrating the Agent OS concept. Provides multiple views into an agent-driven operating system: communications, workspace, knowledge graph, chat, personal productivity, proposals, and mission pipelines.

## Status

- v7 to v8 upgrade

## Location

`/home/trajan/Projects/agent-os-demo`

## Tech Stack

- **Frontend**: Vanilla JS, HTML, CSS
- **Backend**: Express.js bridge server

## Key Features / Views

- **Bridge** — communications hub for agent-to-agent and agent-to-human messaging
- **Tasks** — workspace for managing and tracking work items
- **Graph** — knowledge graph with force-directed physics visualization
- **Talk** — chat interface for conversational interaction
- **Life** — personal productivity dashboard
- **Proposals** — structured proposal review and approval
- **Missions & Pipelines** — multi-step workflow orchestration

## Architecture Decisions

- Vanilla JS chosen for zero-dependency simplicity in a demo context
- Express.js bridge provides lightweight API layer
- Force-directed graph uses physics simulation for organic knowledge visualization
- View-based architecture lets each concern live in its own module

## Related

- [[EMA]] — production evolution of the Agent OS concept
- [[ExecuDeck]] — executive command environment with overlapping orchestration goals
- [[Knowledge-Vault]] — knowledge graph data source for the Graph view
- [[Dispatch-System]] — task pipeline system feeding into Missions & Pipelines view
