---
name: memory-systems
description: Short-term, long-term, and graph-based memory architectures for agents — when to use each and how they compose.
triggers:
  - agent memory
  - long term memory
  - short term memory
  - knowledge graph
  - persistent memory
  - recall
---

# Goal

Choose the right memory layer for a given fact and wire it to the agent so the fact is recalled at the right time, not at every turn.

## Inputs

- The fact to remember (decision, preference, entity, relationship, observation)
- The actor and project scope
- The expected recall pattern (every turn? once per project? semantic search?)
- The cost of being wrong if the memory is stale

## Workflow

1. **Pick the layer.** EMA has four memory layers; use the cheapest one that fits:
   - **Working memory** (in-prompt) — facts needed for the next 1–3 turns. Lives in the user turn. No persistence.
   - **Session memory** (`Ema.Agents.AgentMemory`) — facts for the current conversation. Compressed when >20 messages. Lost on session end.
   - **Typed long-term memory** (`Ema.Memory`) — actor/project-scoped facts with explicit types (preference, decision, fact, observation). Persists across sessions, rendered into prompts via `Ema.Memory.format_context_for_prompt/2`.
   - **Graph memory** (`Ema.SecondBrain` + vault links) — entities and relationships discoverable via `[[wikilinks]]`. Use when the answer depends on traversal ("what depends on X?").
2. **Type the entry.** Untyped memory rots. Every entry needs: type, scope (actor + optional project), source (which turn or tool produced it), and a confidence.
3. **Set a TTL or invalidation rule.** Preferences are forever. Observations decay. Decisions are pinned until explicitly revoked.
4. **Wire the recall.** Working memory is automatic. Session memory needs no wiring. Long-term memory must be pulled in `ContextManager.build_memory_block/2`. Graph memory is queried on demand via vault search MCP resource.
5. **Test the round trip.** Write the fact, start a new session, ask a question that requires it. If recall fails, the layer was wrong or the entry was untyped.

## Output Contract

Every memory write must produce a record with: `{type, scope, content, source, confidence, inserted_at}`. Reads must be filterable by all of these. No untyped blob storage.

## Common Failure Modes

- **One layer for everything.** Putting working facts in long-term memory pollutes every future prompt. Putting decisions in session memory loses them on restart.
- **Untyped entries.** "Trajan likes dark mode" without a type cannot be queried by future skills.
- **Forever facts.** Observations marked as decisions never decay. The agent will defend stale data against the user.
- **No source.** When recall is wrong, you cannot trace the bad entry without a source pointer.
- **Recall at every turn.** Pulling the full memory block every turn wastes tokens. Filter by relevance to the current message.

## See Also

- `daemon/lib/ema/memory.ex`
- `daemon/lib/ema/agents/agent_memory.ex`
- `daemon/lib/ema/second_brain/`
- Skill: `data-structure-protocol`
