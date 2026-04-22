---
title: "Query Layer"
created: 2026-04-01
type: system
status: active
tags: [query-layer, wiki, structured-data, frontmatter, search]
summary: "Structured query interface over the wiki. Queries frontmatter fields (type, status, tags, stack, category) across all pages. Inspired by Fibery's code-query model."
---

# Query Layer

The wiki's structured query interface. Instead of just searching prose, query by typed frontmatter fields across all 2400+ pages.

## How It Works

Every wiki page has YAML frontmatter with typed fields:

```yaml
---
title: "ExecuDeck"
type: codebase
status: active
stack: [next.js-16, react-19, zustand]
category: executive-ai
tags: [codebase, executive, generative-ui]
related: [EMA, ClaudeForge]
---
```

The query layer (`~/bin/wiki-query.sh`) parses these fields and filters.

## Usage

```bash
# By type
wiki-query.sh type=codebase
wiki-query.sh type=research

# By status
wiki-query.sh type=codebase status=active

# By tag
wiki-query.sh tags=discord

# By stack
wiki-query.sh stack=react

# By category
wiki-query.sh category=agent-infra

# Date filter
wiki-query.sh type=research --since 2026-03-01

# JSON output (for agents)
wiki-query.sh type=codebase --json

# Meta queries
wiki-query.sh --stats        # wiki statistics
wiki-query.sh --list-types   # all entity types
wiki-query.sh --list-tags    # all tags
wiki-query.sh --list-stacks  # all tech stacks
```

## For Agents

Agents can use the query layer to answer structured questions:

| Question | Query |
|---|---|
| "What codebases use Next.js?" | `wiki-query.sh stack=next.js` |
| "What's planned?" | `wiki-query.sh status=planned` |
| "What research is recent?" | `wiki-query.sh type=research --since 2026-03-20` |
| "What's in the agent-infra category?" | `wiki-query.sh category=agent-infra` |
| "What client work exists?" | `wiki-query.sh category=client-work` |

## Complementary Search Methods

| Method | Best For |
|---|---|
| **Query Layer** | Structured questions about known entity types |
| **QMD semantic search** | Natural language "find me stuff about X" |
| **grep** | Exact text matching, fast |
| **Ontology graph** | Relationship traversal between entities |

## Design Inspiration

Based on [[Research/EMA-Wilson-Deep-Research-2026-03-31|Fibery's Smart Agent]] benchmark — code-query over structured data beats prompt-only approaches by 2x. The query layer brings the same principle to the wiki.

## Future: EMA Integration

In [[EMA]], the query layer evolves into a full Fibery-style agent query interface where the AI can write and execute structured queries over typed entities in real-time. The wiki's frontmatter-based approach is the foundation.
