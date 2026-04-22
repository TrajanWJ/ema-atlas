# Architecture 3: Knowledge-First

> Obsidian vault as the central nervous system — all AI tools orbit the knowledge graph.
> Status: **CHOSEN** (see [[My Stack Decisions]])

---

## Core Principle

The knowledge base is the primary artifact, not the code. AI tools serve the vault — reading context from it, writing discoveries back to it, and using it as the shared memory layer across all sessions and projects.

This inverts the typical "code-first" pattern where documentation is an afterthought. Here, structured knowledge drives better AI outputs because every prompt carries curated context.

---

## How It Works

```
                    ┌─────────────────────┐
                    │   Obsidian Vault     │
                    │   (knowledge graph)  │
                    └─────────┬───────────┘
                              │
              ┌───────────────┼───────────────┐
              │               │               │
     ┌────────▼──────┐ ┌─────▼─────┐ ┌───────▼───────┐
     │ Claude Code   │ │ Claudian  │ │ CloudCLI      │
     │ CLI           │ │ Sidebar   │ │ Web UI        │
     │ (projects)    │ │ (vault)   │ │ (mobile/24-7) │
     └────────┬──────┘ └─────┬─────┘ └───────────────┘
              │               │
     ┌────────▼───────────────▼────────┐
     │        Shared Context Layer      │
     │  MCP (22360) │ QMD │ kepano     │
     │  claude-mem  │ CLI │ skills     │
     └─────────────────────────────────┘
```

### Layer 1: Knowledge Graph (Obsidian)

The vault holds:
- **Project notes** — current state, architecture, decisions (e.g., [[ExecuDeck]])
- **Conventions** — coding standards, review prompts, role definitions
- **Research** — tool evaluations, architecture blueprints, comparisons
- **Session logs** — what was done, what was discovered, what failed
- **Workflows** — reusable checklists and procedures

Every piece of knowledge is wikilinked, creating a navigable graph that both humans and AI can traverse.

### Layer 2: Access Methods

| Method | Tool | Speed | Best For |
|---|---|---|---|
| MCP Bridge | [[obsidian-claude-code-mcp]] | Moderate | Structured read/write from Claude Code |
| Semantic Search | [[QMD]] | Fast | Finding relevant notes by meaning |
| Sidebar Chat | [[Claudian]] | Interactive | Working inside Obsidian directly |
| CLI Commands | [[Obsidian CLI]] | 54x vs grep | Bulk operations, fast lookups |
| Format Skills | [[obsidian-skills (kepano)]] | N/A | Correct markdown/canvas output |

### Layer 3: Persistence & Memory

| Mechanism | Purpose |
|---|---|
| Session logs in vault | Human-readable history |
| [[claude-mem]] | Cross-session AI memory |
| [[sync-claude-sessions]] → QMD | Searchable session archive |
| CLAUDE.md files | Per-project conventions |
| [[obsidian-claude-pkm]] | Goal cascading (3-year → daily) |

---

## Implementation in Trajan's Stack

### What's Already Connected

1. **Obsidian vault** at `~/Documents/obsidian_first_stuff/twj1/` — structured with `Agent Context/`, `AI Knowledge/`, `Trajan's Projects/`, `Session Log/`, `Workflows/`
2. **Claudian v1.3.68** — Claude Code embedded in Obsidian sidebar
3. **obsidian-claude-code-mcp v1.1.8** — MCP bridge on port 22360
4. **QMD v2.0.1** — hybrid search with vault indexed
5. **kepano skills** — format-aware markdown, bases, canvas, CLI, defuddle
6. **Superpowers v5.0.1** — 14 development workflow skills
7. **Context7** — API documentation for coding agents
8. **CodeGraphContext** — code graph analysis MCP

### What's Pending

- claude-mem (persistent cross-session memory)
- sync-claude-sessions (session export to vault)
- obsidian-claude-pkm (goal cascading)
- everything-claude-code (65+ skills pack)
- Dippy + Lasso hooks (safety layer)

See [[Installation Playbook]] for setup steps.

---

## Knowledge Flow Patterns

### Pattern 1: Research → Decision → Implementation

```
1. Research tools/patterns → write notes in AI Knowledge/
2. Compare options → create decision record (ADR)
3. Update My Stack Decisions with rationale
4. Install and configure (Installation Playbook)
5. Write session log documenting what worked
```

### Pattern 2: Session Context Loading

```
1. Claude starts session
2. Reads CLAUDE.md (project conventions)
3. QMD searches for relevant past sessions
4. Loads role/prompt from Agent Context/ if needed
5. Works with full context, not from scratch
```

### Pattern 3: Knowledge Capture

```
1. During work, discover something useful
2. Write to Session Log/ or update relevant note
3. QMD indexes it automatically (30-min cron)
4. Next session can find it via semantic search
```

---

## Why Knowledge-First Beats Code-First

| Dimension | Code-First | Knowledge-First |
|---|---|---|
| Context quality | Whatever's in the repo | Curated, cross-project knowledge |
| Session continuity | Starts cold each time | Warm start via QMD + memory |
| Decision tracking | Lost in commit messages | Explicit decision records |
| Tool integration | Per-project config | Centralized in vault |
| Learning capture | Nowhere | Session logs + discoveries |
| Reusability | Copy-paste | Wikilinked, searchable |

---

## Success Metrics

| Metric | How to Measure | Target |
|---|---|---|
| Context reuse | Sessions that load prior context via QMD | >50% of sessions |
| Decision traceability | Architecture decisions with linked ADRs | 100% of major decisions |
| Session warm-start | Time from `claude` to productive work | <30 seconds |
| Knowledge freshness | Session logs written within 24h of work | >80% of sessions |
| Token efficiency | Reduction from QMD vs raw grep | 60-95% (per QMD benchmarks) |
| Cross-project insight | Notes referenced from multiple projects | Growing over time |

## Evaluation Criteria

- **Is context improving outputs?** Compare AI suggestions with and without vault context
- **Is knowledge accumulating?** Check vault growth rate and link density
- **Is retrieval working?** Test QMD search accuracy on known queries
- **Are sessions building on each other?** Review session logs for forward references

---

## Related

- [[My Stack Decisions]] — what was chosen and why
- [[Installation Playbook]] — setup steps
- [[Obsidian-Claude Connectivity]] — technical integration details
- [[ExecuDeck]] — first project using this architecture

#architecture #knowledge-first #chosen
