---
title: "Background Results XML Contract"
source: swift-claude-code drainBackgroundNotifications pattern
created: 2026-03-19
type: architecture
tags: [dispatch, inter-agent, background-results, XML, contract]
---

# Background Results XML Contract

Adapted from swift-claude-code's `drainBackgroundNotifications` pattern (see [[swift-claude-code-teardown#Background Task Injection]]).

## The Contract

All inter-agent result injection uses the `<background-results>` XML wrapper:

```xml
<background-results>
[bg:agent-id] status: DONE | findings: <key point> | confidence: high
</background-results>
```

## Format Specification

### Single result
```xml
<background-results>
[bg:scout-01] status: DONE | findings: Found 3 MCP servers matching criteria | confidence: high
</background-results>
```

### Multiple results (batched)
```xml
<background-results>
[bg:scout-01] status: DONE | findings: Found 3 MCP servers matching criteria | confidence: high
[bg:researcher-02] status: BLOCKED | findings: API rate limited | confidence: n/a
[bg:cron-health] status: DONE | findings: All 4 cron jobs healthy | confidence: high
</background-results>
```

### Fields

| Field | Required | Values |
|-------|----------|--------|
| `agent-id` | Yes | Identifier of the reporting agent |
| `status` | Yes | `DONE`, `BLOCKED`, `NEEDS_CONTEXT`, `PARTIAL` |
| `findings` | Yes | One-line summary of result |
| `confidence` | Yes | `high`, `medium`, `low`, `n/a` |

## API Alternation Rule (Critical)

The Anthropic API requires strict user/assistant message alternation. When injecting background results:

- **If last message is already a user message:** APPEND the `<background-results>` block to it
- **If last message is an assistant message:** Create a new user message containing the block

```python
if messages[-1].role == "user":
    messages[-1].content.append(text(wrapped_xml))
else:
    messages.append(Message(role="user", content=wrapped_xml))
```

**Never create consecutive user messages.** This will cause an API error.

## When to Use

1. **Parallel subagents returning results** — drain all completed agent results before next API call
2. **Dispatch result injection** — orchestrator forwards subagent outputs to the primary agent
3. **Cron job completions** — scheduled tasks reporting back (health checks, builds, scans)
4. **Background command completion** — long-running shell commands finishing

## Timing

Results are drained at the **start of each loop iteration**, before the API call — not after. This ensures the model sees all available context before generating its next response.

```
Loop iteration:
  1. Compact context (micro-compact)
  2. Drain background results  ← HERE
  3. API call
  4. Process tool uses
  5. Nag injection
```

## Implementation

### drain-results.sh

Located at `~/bin/drain-results.sh`. Reads completed results from the inter-agent inbox, formats as `<background-results>` XML, and archives processed files.

```bash
~/bin/drain-results.sh
# Reads ~/dispatch/inter-agent/inbox/*.json
# Outputs <background-results> XML to stdout
# Archives processed files to ~/dispatch/inter-agent/processed/
```

### Inbox JSON format

Each file in `~/dispatch/inter-agent/inbox/` is a JSON object:

```json
{
  "agent_id": "scout-01",
  "status": "DONE",
  "findings": "Found 3 MCP servers matching criteria",
  "confidence": "high",
  "timestamp": "2026-03-19T14:30:00Z"
}
```

## Related

- [[dispatch-nag-protocol]] — nag injection uses the same tool-result injection mechanism
- [[swift-claude-code-teardown]] — source pattern documentation
- [[autoresearch-pattern]] — research agents produce results in this format
