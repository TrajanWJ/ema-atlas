---
title: MCP Graph Workflow
tags:
  - architecture
  - mcp
  - task-management
  - orchestration
created: '2026-03-20'
status: watch-repos
install_status: not-available
source: 'https://github.com/DiegoNogueiraDev/mcp-graph-workflow'
type: knowledge
wiki_id: system/architecture/mcp-graph-workflow
imported_from: vault/Architecture/mcp-graph-workflow.md
imported_at: '2026-04-04T00:23:56.790Z'
summary: ''
---

# MCP Graph Workflow

## Overview

MCP server that converts PRD text files into persistent SQLite task graphs. Provides structured task decomposition, dependency tracking, and multi-agent orchestration through graph-based workflows.

## Key Capabilities

- **PRD-to-Graph Pipeline**: Parses PRD text files into persistent SQLite task graphs with dependency edges
- **26 MCP tools, 44 REST endpoints**: Comprehensive API surface for task management and orchestration
- **Semantic search + RAG over tasks**: Vector-based retrieval over task descriptions and context
- **Sprint planning**: Built-in sprint management and task scheduling
- **Web dashboard**: Browser-based UI for task visualization and management
- **70-85% token reduction**: Context tiers allow selective loading, dramatically reducing token usage
- **Multi-agent mesh orchestration**: Agents coordinate through the task graph as shared state

## Integration Points

- Serena (code editing agent)
- GitNexus (repo intelligence)
- Context7 (context management)
- Playwright (browser automation / testing)

## Why Relevant

Formalizes the manual dispatch-based task decomposition pattern currently used in OpenClaw. Instead of ad-hoc task tracking via files and Discord, this provides a structured graph with dependencies, priorities, and semantic search. The multi-agent mesh orchestration pattern aligns with fleet coordination goals.

## Install Status

**Not available** as of 2026-03-20:

- npm: Not published to registry
- PyPI: No matching distribution found
- GitHub repo (`DiegoNogueiraDev/mcp-graph-workflow`): Returns 404 -- repo may be private, renamed, or not yet published
- GitHub releases: No releases found

**Action**: Watch for public release. The repo URL may have changed or the project may still be in private development. Periodically re-check:
- `https://github.com/DiegoNogueiraDev/mcp-graph-workflow`
- npm: `mcp-graph-workflow`
- PyPI: `mcp-graph-workflow`
