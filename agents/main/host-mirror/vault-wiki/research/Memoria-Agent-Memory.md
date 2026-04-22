---
type: research
tags:
  - AI
  - agents
  - memory
  - versioning
  - MCP
  - OpenClaw
confidence: 0.85
summary: >-
  Memoria by MatrixOrigin is a Rust MCP server giving AI agents Git-level
  versioned memory (snapshots, branches, rollback) via MatrixOne DB. Has native
  OpenClaw plugin.
date: 2026-03-20T00:00:00.000Z
sources: '3 total (2 T1, 1 T2)'
wiki_id: research/Memoria-Agent-Memory
imported_from: vault/Research/Memoria-Agent-Memory.md
imported_at: '2026-04-04T00:23:57.094Z'
---

# Memoria: Git-Level Version Control for AI Agent Memory

*Sources: 3 total (2 T1 primary, 1 T2 institutional) | Confidence: High (0.85) | Date: 2026-03-20*

## Summary

**Memoria** (`matrixorigin/Memoria`) is a persistent memory layer for AI agents built by MatrixOrigin — the same team behind the MatrixOne database. The "Git-level" claim is literal and backed by a real storage primitive: MatrixOne's native Copy-on-Write engine provides zero-copy snapshots, branch/merge/diff, and point-in-time rollback for memory data. It speaks MCP (Model Context Protocol) and has a first-class OpenClaw plugin (`@matrixorigin/memory-memoria`). Currently at v0.1.0, early but real — not vaporware.

## What It Is

- **Type:** Rust CLI + MCP server (not a Python library, not a paper)
- **Author:** MatrixOrigin (established company, 50+ GitHub contributors on MatrixOne alone)
- **Released:** v0.1.0 (current as of March 2026, updated actively)
- **License:** Apache 2.0
- **Repo:** https://github.com/matrixorigin/Memoria
- **Stars:** 45 (small but fresh)
- **Backend:** MatrixOne database (MySQL-compatible HTAP with native vector + fulltext)

## What "Git-Level Version Control" Means Concretely

This is the core differentiator. MatrixOne has a built-in Copy-on-Write engine — the same mechanism that makes Git snapshots cheap. Memoria exposes this to AI agents via MCP tools:

| Git concept | Memoria equivalent | Notes |
|---|---|---|
| `git commit` / snapshot | `memory_snapshot` | Named snapshots, zero-copy |
| `git checkout` (time travel) | `memory_rollback` | Restore to any named snapshot |
| `git branch` | `memory_branch` + `memory_checkout` | Isolated memory spaces for experiments |
| `git merge` | `memory_merge` | Merge a branch's memories back |
| `git diff` | `memory_diff` | Preview branch changes before merge |

**Practical use case (from the README):** "Let's try switching from PostgreSQL to SQLite" → agent creates a `eval_sqlite` branch, experiments with memories on that branch, diffs, then either merges findings or deletes the branch. Main memory is untouched throughout.

## Full Tool Surface

**Core memory:**
`memory_store`, `memory_retrieve`, `memory_search`, `memory_correct`, `memory_purge`, `memory_profile`, `memory_get`, `memory_list`, `memory_stats`, `memory_health`, `memory_forget`

**Git-for-data:**
`memory_snapshot`, `memory_snapshots`, `memory_rollback`, `memory_branch`, `memory_branches`, `memory_checkout`, `memory_merge`, `memory_diff`, `memory_branch_delete`

**Governance (self-maintaining):**
`memory_governance` (quarantine low-confidence, 1h cooldown), `memory_consolidate` (contradiction detection, 30min cooldown), `memory_reflect` (synthesize insights, 2h cooldown), `memory_extract_entities`, `memory_link_entities`, `memory_rebuild_index`

## Memory Types

| Type | Use for | Example |
|---|---|---|
| `semantic` | Project facts, decisions | "Uses Go 1.22 with modules" |
| `profile` | User preferences | "Prefers pytest over unittest" |
| `procedural` | Workflows, how-to | "Deploy: make build && kubectl apply" |
| `working` | Temporary task context | "Currently debugging auth module" |
| `episodic` | Session summaries | "Session: optimized DB, added indexes" |

## vs. mem0 / Mem0

| Dimension | Memoria | mem0 |
|---|---|---|
| Language | Rust | Python |
| Git-level versioning | Native (CoW engine) | File-level at best |
| Hosted option | MatrixOne Cloud (free tier) | mem0.ai API |
| Self-hosted | Yes (Docker, K8s) | Yes |
| Embedding | OpenAI / SiliconFlow / local | OpenAI / Cohere / local |
| OpenClaw plugin | Yes, native (`@matrixorigin/memory-memoria`) | No |
| MCP protocol | Yes | No (custom SDK) |
| Accuracy claim | Not benchmarked yet | +26% vs OpenAI memory |
| Funding | MatrixOrigin (established DB company) | YC-backed |
| Stars (memory layer) | 45 | Much more (Mem0 is ~25K) |

**Assessment:** mem0 is more mature, more widely adopted, and has proven accuracy benchmarks. Memoria is younger but technically more interesting if the git-style branching actually matters for your workflow. The OpenClaw-native plugin is a significant practical advantage for this setup.

## OpenClaw Integration

Has a documented plugin that's installable from npm registry:

```bash
openclaw plugins install @matrixorigin/memory-memoria
openclaw plugins enable memory-memoria

# With MatrixOne running (Docker or cloud):
MEMORIA_DB_URL='mysql://root:111@127.0.0.1:6001/memoria' \
MEMORIA_EMBEDDING_PROVIDER='openai' \
MEMORIA_EMBEDDING_MODEL='text-embedding-3-small' \
MEMORIA_EMBEDDING_API_KEY='sk-...' \
MEMORIA_EMBEDDING_DIM='1536' \
openclaw memoria install
```

The plugin:
- Shells out to the `memoria` Rust binary via MCP stdio
- Installs steering rules into `~/.openclaw/skills`
- Exposes all memory tools to agent tool policy
- Uses `openclaw ltm` as a CLI alias namespace

⚠️ **Critical constraint:** Embedding dimension is locked into DB schema on first MCP server start. Set `MEMORIA_EMBEDDING_DIM` correctly before running.

⚠️ The plugin defaults to **explicit mode** (autoObserve=false): agents must call `memory_store` explicitly. Auto-capture requires `MEMORIA_AUTO_OBSERVE=true` + LLM API config.

## Architecture

```
AI Agent ←→ (MCP stdio) ←→ Memoria MCP Server ←→ MatrixOne DB
                               ├── Storage + retrieval
                               ├── Vector + fulltext hybrid
                               └── Git-for-Data (snap/branch/merge)
```

MatrixOne: MySQL-compatible, runs via Docker. Also available as managed cloud (free tier at cloud.matrixorigin.cn).

## Production Readiness

**Status: Early but functional.** v0.1.0 with active development (repo updated within minutes of the search). Not "experimental research" — it has a release binary, installer script, uninstaller, Docker compose setup, and CI/CD pipeline. The underlying MatrixOne DB is production-grade (50+ contributors, enterprise deployments).

Risks:
- Schema drift between versions (use fresh DB name on upgrades)
- 45 GitHub stars means small community, sparse issue tracker
- `memory_get` is approximated (no direct-by-id in Rust MCP toolset yet)
- `memory_stats` entity counts not available yet

## Key Takeaways

1. **The git-level claim is real.** Zero-copy snapshots and branching come from MatrixOne's CoW engine, not a wrapper around file copies. This is a genuine technical differentiator.
2. **OpenClaw integration exists and is documented.** The `@matrixorigin/memory-memoria` plugin is the most direct path for this setup.
3. **The branching workflow solves a real problem** — isolated memory experiments without polluting main memory state is actually useful for agent iteration.
4. **Biggest risk is maturity.** v0.1.0, 45 stars. If something breaks, you're mostly debugging it yourself.
5. **mem0 is safer for production.** Better documented, larger community, proven benchmarks. Memoria is the technically interesting bet.
6. **If integrating: set embedding dim before first run.** It's schema-locked and migration is painful.

## Steering Rules Available

Memoria ships with agent steering rules covering:
- `memory` — when to store/retrieve/correct/purge
- `session-lifecycle` — bootstrap at conversation start, cleanup at end
- `memory-hygiene` — proactive governance, contradiction resolution
- `memory-branching-patterns` — isolated experiments with branches
- `goal-driven-evolution` — track goals + progress across conversations

## Open Questions

- Actual benchmark numbers vs mem0 (not yet available — project too new)
- What happens on MatrixOne schema upgrades? Migration tooling unclear.
- Multi-agent shared memory: on the TheBuddyDave roadmap but not in matrixorigin/Memoria scope yet
- `local-embedding` feature flag status in the Rust binary (docs say it's optional at build time)

## Sources

1. [T1] [matrixorigin/Memoria](https://github.com/matrixorigin/Memoria) — primary repo, README is comprehensive
2. [T1] [Memoria OpenClaw Plugin README](https://github.com/matrixorigin/Memoria/blob/main/plugins/openclaw/README.md) — full install + config docs
3. [T2] [matrixorigin/matrixone](https://github.com/matrixorigin/matrixone) — underlying DB; context on Git-for-Data technical provenance

## Related Notes

- [[mem0 Agent Memory]] (if exists — mem0 is the main alternative; YC-backed, +26% accuracy)
- [[MCP Protocol]] (Memoria uses MCP for agent tool surface)
- [[MatrixOne Database]] (the storage backend)
- [[OpenClaw Agent Setup]]
