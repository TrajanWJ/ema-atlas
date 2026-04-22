---
title: "Dispatch Status Nag Injection Protocol"
source: swift-claude-code todoReminderThreshold pattern
created: 2026-03-19
type: architecture
tags: [dispatch, orchestration, nag-injection, status-tracking, SOUL]
---

# Dispatch Status Nag Injection Protocol

Adapted from swift-claude-code's `todoReminderThreshold` pattern (see [[swift-claude-code-teardown#Todo Nag Injection]]).

## Problem

Subagents go silent. Orchestrators lose visibility into whether work is progressing, blocked, or abandoned. Without periodic status signals, the dispatch system can't make routing decisions.

## Mechanism

After **N=3 consecutive turns** without a status update from a subagent, the orchestrator injects a nag message into the next tool result envelope:

```
⚠️ Update your dispatch status.
```

This is injected as an additional text block appended to the tool results the agent receives — identical to how swift-claude-code injects "Update your todos." into tool results.

## Tracking

Each subagent slot maintains a `turns_without_status` counter:

```
turns_without_status = 0  # per subagent slot

on_agent_turn(agent_id, message):
    if contains_status_signal(message):
        turns_without_status[agent_id] = 0  # RESET
    else:
        turns_without_status[agent_id] += 1

    if turns_without_status[agent_id] >= 3:
        inject_nag(agent_id)
```

## Reset Conditions

The counter resets to 0 when the agent's message contains any of:
- `status:` (case-insensitive) — explicit status line
- `DONE` — task completion signal
- `BLOCKED` — explicit block declaration
- `NEEDS_CONTEXT` — context request signal

These are the same signals used in our dispatch envelope format.

## Implementation

### In-loop injection (orchestrator pseudocode)

```python
NAG_THRESHOLD = 3

for slot in active_subagents:
    if slot.turns_without_status >= NAG_THRESHOLD:
        tool_results.append("⚠️ Update your dispatch status.")
        # Don't reset — keep nagging until agent actually updates
```

### CLI tracker

Use `~/bin/nag-tracker.sh` for shell-level tracking:

```bash
# Increment (default — call after each agent turn with no status)
nag-tracker.sh agent-scout-01

# Check if nag is needed
nag-tracker.sh agent-scout-01 --check
# prints "NAG" if >= 3, "OK" otherwise

# Reset after receiving status update
nag-tracker.sh agent-scout-01 --reset
```

Counter state stored in `~/.nag-counters/<agent-id>`.

## Integration Points

- **dispatch/orchestrator.sh** — check counter after each subagent turn
- **dispatch/envelope format** — nag injected as additional text in tool result block
- **`<background-results>` contract** — nag can also be injected via background results XML (see [[background-results-contract]])

## Design Notes

- Do NOT reset on nag injection — keep nagging until the agent actually sends a status signal
- Threshold of 3 is empirically validated by swift-claude-code (same value)
- Nag text is deliberately short — it's a nudge, not a lecture
- Works with both synchronous and async dispatch patterns
