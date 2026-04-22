# QMD

> Local hybrid search engine for markdown — BM25 + vector + reranking. 60-95% token reduction vs grep.

## Quick Info

| Field | Value |
|---|---|
| **GitHub** | [tobi/qmd](https://github.com/tobi/qmd) |
| **Stars** | 14,400+ |
| **By** | Tobi Lutke (Shopify CEO) |
| **Version** | v2.0.1 (Mar 2026, confirmed Apr 2026) |
| **License** | MIT |
| **Runtime** | Node.js ≥22 / Bun ≥1.0.0 |

## How It Works

Three search modes:

1. **`search`** — Keyword-only (BM25) via SQLite FTS5
2. **`vsearch`** — Semantic similarity via embeddings
3. **`query`** — Hybrid with expansion, RRF fusion, and LLM re-ranking

### Search Pipeline (query mode)

1. Query expansion (original 2x weight + LLM-generated variations)
2. Parallel retrieval across FTS and vector indexes
3. Reciprocal Rank Fusion (RRF, k=60)
4. Top 30 candidates kept
5. LLM re-ranking via logprobs
6. Position-aware blending (top 3: 75% retrieval / 25% reranker)

### Smart Chunking

~900-token chunks with 15% overlap at natural markdown break points (headers, paragraph boundaries, code block edges).

## MCP Tools

| Tool | Purpose |
|---|---|
| `query` | Hybrid search with sub-query types (lex/vec/hyde), RRF fusion, reranking |
| `get` | Document retrieval by path or ID with fuzzy matching |
| `multi_get` | Batch retrieval via glob patterns or ID lists |
| `status` | Index health and collection metadata |

Source: [README — MCP section](https://github.com/tobi/qmd#mcp)

## Local Models

Auto-downloaded to `~/.cache/qmd/models/` (~2GB total):

| Model | Size | Purpose |
|---|---|---|
| embeddinggemma-300M-Q8_0 | ~300MB | Document embeddings |
| qwen3-reranker-0.6b-q8_0 | ~640MB | Result re-ranking |
| qmd-query-expansion-1.7B-q4_k_m | ~1.1GB | Query variants |

Override embedding model via `QMD_EMBED_MODEL` env var (Qwen3-Embedding recommended for CJK languages).

## Install

```bash
npm install -g @tobilu/qmd    # or: bun install -g @tobilu/qmd
qmd collection add ~/Documents/obsidian_first_stuff/twj1 --name vault
qmd update && qmd embed
```

### As Claude Code MCP Server (in `~/.claude/mcp.json`)

```json
{
  "qmd": {
    "command": "/usr/bin/qmd",
    "args": ["mcp"]
  }
}
```

Standard stdio transport. For HTTP mode, add `--http --daemon` flags (port 8181, keeps models in VRAM).

### Auto-Reindex (cron every 30m)

```bash
*/30 * * * * qmd update --quiet && qmd embed --quiet
```

## SDK Usage

Can be imported as a Node.js/Bun library:

```typescript
import { createStore } from '@tobilu/qmd'
const store = await createStore({ dbPath: './index.sqlite', config: {...} })
const results = await store.search({ query: "..." })
```

Exports unified `search()` plus lower-level `searchLex()` and `searchVector()`.

## Gotchas

- **Model switching** — re-embedding required (`qmd embed -f`) when changing embedding models; vectors aren't cross-compatible
- **macOS** — needs Homebrew SQLite for extension support
- **Database location** — `~/.cache/qmd/index.sqlite` stores all index data
- **210 open issues** as of Mar 2026 — active development, expect rough edges

## Current Setup (INSTALLED)

- **Version:** 2.0.1
- **Collection:** vault (2609 files indexed, 10466 chunks embedded)
- **Index size:** 76.3 MB at `~/.cache/qmd/index.sqlite`
- **Models:** ~2GB total (auto-downloaded)
- **MCP:** configured in `~/.claude/mcp.json` — `qmd mcp` (no daemon/HTTP flags)
- **Cron:** auto-reindex every 30 minutes via `flock -n /tmp/qmd.lock timeout 300 bash -c "qmd update && qmd embed"`
- **Last verified:** 2026-04-12

## Obsidian Integration

**obsidian-qmd plugin** ([achekulaev/obsidian-qmd](https://github.com/achekulaev/obsidian-qmd)):
- Wraps QMD CLI inside Obsidian
- Auto-indexes on file changes with debouncing
- Requires Bun runtime ≥1.0.0

## Full Stack: QMD + sync-claude-sessions + /recall

1. [[sync-claude-sessions]] captures conversations as markdown
2. QMD indexes those + your vault for semantic search
3. `/recall` skill pulls relevant past context before new sessions
4. Eliminates cold starts and re-explaining past decisions

## See Also

- [[sync-claude-sessions]] — session export companion
- [[claude-mem]] — alternative memory approach (SQLite + ChromaDB)
- [[Obsidian-Claude Connectivity]] — central integration reference

#claude-code #search #semantic #token-optimization #essential
