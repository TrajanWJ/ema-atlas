---
type: knowledge
wiki_id: system/architecture/agent-handoff-envelope
imported_from: vault/Architecture/agent-handoff-envelope.md
imported_at: '2026-04-04T00:23:56.781Z'
tags: []
summary: ''
---
# Agent Handoff Metadata Envelope

**Created:** 2026-03-19  
**Status:** Proposed Standard  
**Author:** Right Hand / Research Sweep  

---

## Problem Statement

Downstream agents confidently process garbage from failed upstream agents. When a research agent times out, hits errors, or only partially completes a task, the next agent in the chain has no signal — it sees output and assumes it's complete and reliable. This causes:

- Scout processing a "research report" that's actually an error message
- Right Hand summarizing half-collected data as if it were comprehensive
- Coder implementing specs based on incomplete requirements
- Silent quality degradation with no traceability

**Root cause:** Agent handoffs carry only payload, no metadata about the payload's reliability.

---

## Solution: Metadata Envelope

Every agent-to-agent handoff MUST include a metadata envelope alongside the payload. The envelope travels as a header block at the top of the output, or as a separate `envelope.json` file when the payload is a file/directory.

---

## Schema

```json
{
  "agent": "researcher",
  "task_id": "uuid-or-descriptive-id",
  "completed": true,
  "sources_expected": 5,
  "sources_hit": 4,
  "confidence": 0.85,
  "gaps": ["source X timed out"],
  "output_type": "research_report",
  "next_agent": "right-hand"
}
```

### Field Definitions

| Field | Type | Required | Description |
|---|---|---|---|
| `agent` | string | ✅ | Identity of the sending agent (e.g., `"researcher"`, `"scout"`) |
| `task_id` | string | ✅ | Unique or descriptive task identifier for tracing |
| `completed` | boolean | ✅ | `true` = task fully done; `false` = partial/failed |
| `sources_expected` | integer | optional | How many sources/inputs were planned |
| `sources_hit` | integer | optional | How many were actually retrieved/processed |
| `confidence` | float | ✅ | 0.0–1.0 self-assessed reliability of the output |
| `gaps` | string[] | ✅ | List of known gaps, timeouts, or missing pieces (empty array = none) |
| `output_type` | string | ✅ | Machine-readable type: `research_report`, `code_patch`, `analysis`, `data_extract`, `summary`, `error` |
| `next_agent` | string | optional | Intended recipient if known |

### Confidence Calibration Guide

| Range | Meaning | Receiver action |
|---|---|---|
| 0.9–1.0 | High confidence, complete | Trust and proceed |
| 0.7–0.9 | Mostly complete, minor gaps | Proceed with noted gaps |
| 0.5–0.7 | Partial — notable gaps | Flag to user, fill gaps if possible |
| 0.0–0.5 | Low quality / failed | Do NOT use as primary source; surface to user |

---

## Usage Examples

### Example 1: Successful Research Handoff

Researcher → Right Hand:

```
---ENVELOPE---
{
  "agent": "researcher",
  "task_id": "memos-integration-sweep-2026-03-19",
  "completed": true,
  "sources_expected": 6,
  "sources_hit": 6,
  "confidence": 0.92,
  "gaps": [],
  "output_type": "research_report",
  "next_agent": "right-hand"
}
---END-ENVELOPE---

# MemOS Integration Analysis
...
```

### Example 2: Partial Completion

Scout → Researcher (3 of 5 URLs fetched):

```
---ENVELOPE---
{
  "agent": "scout",
  "task_id": "fetch-mcp-registry-pages",
  "completed": false,
  "sources_expected": 5,
  "sources_hit": 3,
  "confidence": 0.55,
  "gaps": ["npmjs.com rate-limited", "modelcontextprotocol.io returned 403"],
  "output_type": "data_extract",
  "next_agent": "researcher"
}
---END-ENVELOPE---
```

### Example 3: Hard Failure

Any agent → Right Hand:

```
---ENVELOPE---
{
  "agent": "coder",
  "task_id": "refactor-memory-layer",
  "completed": false,
  "sources_expected": 1,
  "sources_hit": 0,
  "confidence": 0.0,
  "gaps": ["compilation error in module A, blocking all downstream work"],
  "output_type": "error",
  "next_agent": "right-hand"
}
---END-ENVELOPE---
```

---

## Implementation Priority

### Phase 1 — Highest-Risk Handoffs (adopt first)

1. **Researcher → Right Hand** — Research reports are most often processed as authoritative; most damage from bad quality
2. **Scout → Researcher** — Scout fetches feed directly into research pipelines; partial fetches silently corrupt analysis
3. **Orchestrator → any specialist** — Orchestrator routes tasks; bad routing with missing context cascades

### Phase 2 — All other agents

4. Coder → Right Hand (code review output)
5. Ops → Right Hand (health check summaries)
6. Security → Right Hand (audit findings)
7. Vault Keeper → any (cross-references)

---

## Receiver Protocol

When you receive a handoff:

1. **Check `completed`** — if `false`, do not present output as authoritative
2. **Check `confidence`** — if < 0.7, surface gaps explicitly to user before proceeding
3. **Log gaps** — always include envelope gaps in your own output/memory
4. **Propagate envelope** — when handing off further, merge gaps from upstream envelope into yours

---

## File-Based Handoffs

When payload is a file or directory (e.g., a generated codebase), include `envelope.json` at root:

```
handoff/
  envelope.json
  output.md  (or code/, data/, etc.)
```

---

## Related

- [[HEARTBEAT]] — health check protocol
- [[Agent Roster]] — agent identities and responsibilities
- [[Deep-Research-Sweep-2026-03-19]] — sweep that motivated this spec
