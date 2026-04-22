---
title: "CTA Session Tree"
type: system-doc
created: 2026-03-24
tags: [cta, sessions, branching, agents, architecture]
summary: "Conversation Tree Architecture — session branching, context flow, auto-drift detection"
---

# CTA Session Tree

Conversation Tree Architecture (CTA) replaces flat linear sessions with a tree structure. Sessions can branch when topics drift or context pressure builds, and child sessions merge summaries back upstream when they close.

## Architecture

```
Root Session (right-hand)
├── Child: Side investigation [auto-drift] → merged, summary flows up
├── Child: Quick lookup [volatile] → expires after 1h
└── Child: Deep research [manual] → active
    └── Grandchild: Sub-topic [auto-drift]
```

### Key Concepts

- **Nodes** = sessions in a tree. Each has a parent (except root) and children.
- **Branch types**: `manual` (user-initiated), `auto-drift` (drift scorer triggered), `volatile` (ephemeral, auto-expires)
- **Merge policy**: When a child closes, its `upstreamSummary` propagates to the parent.
- **Context flow**: Parent context informs children; child summaries enrich parents.

## State Store

`/home/trajan/vault/System/session-tree.json` — flock-protected JSON file.

```json
{
  "version": 1,
  "nodes": { "<id>": { ... } },
  "root": "<id>",
  "lastUpdated": "ISO8601"
}
```

### Node Schema

| Field | Type | Description |
|---|---|---|
| `id` | `sess_<8hex>` | Unique session ID |
| `parentId` | string/null | Parent node ID |
| `label` | string | Human-readable session label |
| `agentId` | string/null | Agent responsible for this session |
| `createdAt` | ISO8601 | Creation timestamp |
| `closedAt` | ISO8601/null | When closed |
| `status` | `active\|merged\|purged` | Lifecycle state |
| `nodeType` | `manual\|auto-drift\|volatile` | How the branch was created |
| `branchPoint.turnIndex` | int/null | Turn where branch occurred |
| `branchPoint.trigger` | string | What caused the branch |
| `branchPoint.contextSummary` | string | Context at branch time |
| `mergePolicy` | `summarize` | How to merge back to parent |
| `upstreamSummary` | string/null | Summary propagated from/to parent |
| `children` | array | Child node IDs |
| `volatileExpiresAt` | ISO8601/null | Expiry for volatile nodes |

## CLI Reference

All commands: `/home/trajan/bin/session-tree.sh <command> [args]`

### `add` — Create a new session node

```bash
session-tree.sh add "Label" [--parent <id>] [--agent <agentId>] [--volatile] [--type manual|auto-drift|volatile]
```

- Without `--parent`: creates a root node (or standalone root)
- `--volatile`: sets 1-hour expiry, nodeType=volatile
- Returns the new node ID to stdout

### `close` — Close a session

```bash
session-tree.sh close <id> [--merge-summary "text"] [--discard]
```

- Default: status → `merged`
- `--merge-summary`: propagates summary to parent's `upstreamSummary`
- `--discard`: status → `purged` (no merge)

### `get` — Print node as JSON

```bash
session-tree.sh get <id>
```

### `children` — List child nodes

```bash
session-tree.sh children <id>
```

Output: `<id>  [status]  <label>` per line

### `path` — Print root-to-node path

```bash
session-tree.sh path <id>
```

### `tree` — ASCII tree visualization

```bash
session-tree.sh tree
```

Status icons: `●` active, `✓` merged, `✗` purged, `◌` other

### `volatile-check` — Find expired volatile nodes

```bash
session-tree.sh volatile-check
```

Exit code 1 if expired nodes found. Runs via cron every 30 minutes.

### `gc` — Garbage collect old nodes

```bash
session-tree.sh gc
```

Purges nodes with status `merged` or `purged` that closed >30 days ago.

### `stats` — Tree statistics

```bash
session-tree.sh stats
```

Shows counts by status and depth distribution.

## Drift Scoring

`/home/trajan/bin/drift-score.sh <initial_intent> <recent_context>`

Local-only drift detection using:
- **Content word containment** (40%): fraction of original intent terms retained in recent context
- **Bigram overlap** (20%): phrase-level similarity
- **TF-IDF cosine similarity** (30%): distributional similarity
- **Question ratio shift** (10%): change in question vs statement balance

Output: single float `0.0`-`1.0` (higher = more drift). No API keys needed.

## Auto-Branch Check

`/home/trajan/bin/auto-branch-check.sh <session_id> <initial_intent> <recent_context>`

Exit codes:
- `0` — no branch needed
- `1` — drift branch needed (drift > 0.65), prints suggested label
- `2` — context pressure branch (>70% of 200k tokens), prints label

## Cron

```
*/30 * * * * session-tree.sh volatile-check >> session-tree-expiry.log
```

Registered in `/home/trajan/config/crons.conf` under "CTA Session Tree" section.

## Design Decisions

1. **File-based state** over database: simple, greppable, fits vault ecosystem
2. **flock for concurrency**: multiple agents may modify tree simultaneously
3. **Environment variables for data passing**: avoids shell injection in python heredocs
4. **Local-only drift scoring**: no API dependencies, works offline
5. **Containment over Jaccard**: asymmetric similarity better captures "are we still on the original topic?"
6. **Upstream summary propagation**: child insights automatically enrich parent context

## Integration Points

- [[Session Architecture]] — CTA extends the existing session model
- [[Dispatch Architecture Review]] — branch creation can trigger dispatch tasks
- [[Agent Capabilities Matrix]] — agents can be assigned to specific branches
