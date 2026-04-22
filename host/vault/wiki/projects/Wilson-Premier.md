---
title: "Wilson Premier"
type: reference
created: 2026-04-06
tags: [project, client, real-estate, hospitality, multi-agent, ai-platform, python]
summary: "Multi-agent AI platform for Craig Wilson's real estate and hospitality businesses"
---

# Wilson Premier

Multi-agent AI platform serving Craig Wilson's real estate and hospitality operations at Smith Mountain Lake, Virginia. Covers two rental properties and associated business operations.

## Status

- Phase 0: requirements review
- Web design: active/delivering
- AI services: in pipeline

## Properties

- **Suite Retreat** — 400 Backcove
- **Suite View** — 399 Backcove

## Tech Stack

- **AI Backend**: Python, OpenAI Agents SDK
- **Orchestration**: n8n workflow automation
- **Database**: PostgreSQL with pgvector for embeddings
- **Cache**: Redis
- **Infrastructure**: Docker Compose
- **Frontend**: React / Next.js

## Key Features

- Multi-agent architecture for different business functions
- Vector search over property/guest data via pgvector
- n8n for no-code workflow automation between agents
- Containerized deployment via Docker Compose

## Architecture Decisions

- OpenAI Agents SDK chosen for structured multi-agent coordination
- pgvector enables semantic search over property listings and guest communications
- n8n provides visual workflow builder for non-technical business logic changes
- Docker Compose for reproducible multi-service deployment

## Related

- [[EMA]] — personal AI platform with similar multi-agent patterns
- [[LetMeScale]] — another client-facing web project
- [[Dispatch-System]] — task dispatch patterns applicable to agent coordination
