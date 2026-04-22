---
id: "e18cc7aa-6c6c-4989-9976-eb58f005ef31"
title: "Superman-IDE Code Intelligence"
space: wiki
tags: ["superman","code-intel","tools"]
source: manual
---

# Superman-IDE

> **Status:** The standalone Superman-IDE Express server (port 3000) has been superseded by native EMA daemon integration via `Ema.Superman.*` modules (Context, KnowledgeGraph, IntentParser, Fallback, Supervisor) running inside the Phoenix daemon. The API and start instructions below are retained as historical reference.

> **Note:** The three-layer `.superman/` directory structure is documented in [[Superman-System]].

AST-powered code intelligence engine, originally at `~/Desktop/superman`.

## Capabilities

- **Language support:** Parses 10+ languages with ast-grep
- **Knowledge graph:** libgraph (pure Elixir) + ETS persistence
- **Gap detection:** 8 types, 4 severity levels
- **4-stage retrieval:** BM25 → embeddings → graph → rerank
- **Autonomous loop:** Up to 5 improvement iterations per run
- **MCP integration:** 8 tools exposed to Claude Code

## API

Express server on port 3000.

| Endpoint | Purpose |
|----------|---------|
| `GET /api/health` | Health check |
| `POST /api/index` | Index a repository |
| `POST /api/ask` | Ask about codebase |
| `GET /api/gaps` | Detected code gaps |
| `GET /api/flows` | Code flow analysis |
| `POST /api/apply` | Apply changes |
| `POST /api/simulate` | Simulate changes |

## EMA Integration

Superman provides context injection for executions:
1. `Superman.Context.for_project/2` assembles project context
2. Injected into execution prompts via `prepend_superman_context/2`
3. Intent graph tracked via `.superman/intents/` folder structure

## Start

```bash
cd ~/Desktop/superman
npm run server   # API on :3000
npm run dev      # Dev on :3001
```

## Related

- [[EMA Architecture Overview]]
- [[Execution System]]
