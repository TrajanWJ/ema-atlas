---
name: context-compression
description: Compression strategies for long agent sessions — when to summarize, what to drop, and how to preserve the load-bearing facts.
triggers:
  - long session
  - conversation history
  - summarize
  - compress
  - memory pressure
  - token limit
---

# Goal

Keep a long-running agent session inside its token budget without losing the facts and decisions that future turns will depend on.

## Inputs

- The full conversation history (messages with role + content + timestamps)
- The current token count
- The model's effective context limit (use 75% of hard limit as the trigger)
- A list of "pinned" facts that must survive any compression pass

## Workflow

1. **Detect pressure early.** Trigger compression at 75% of the limit, not 95%. Late compression forces aggressive cuts and loses fidelity.
2. **Classify each turn.** Every message is one of: decision (load-bearing), exchange (clarifying back-and-forth), tool result (data), or chitchat. Decisions are pinned. Chitchat is dropped first.
3. **Compress in tiers:**
   - Tier 1: drop chitchat and tool results older than the last decision.
   - Tier 2: summarize exchange clusters into one paragraph each, keeping decisions verbatim.
   - Tier 3: replace the early history with a structured summary (goals, decisions, open questions, blockers).
4. **Preserve identifiers.** Every entity ID, file path, URL, and exact quote must survive compression. Paraphrasing these breaks future tool calls.
5. **Write the summary into memory, not just the prompt.** Use `Ema.Memory` so the next session starts warm. The compressed summary is also the artifact that survives a crash.
6. **Verify after compression.** Spot-check: can the agent still answer "what did we decide about X?" after the compression pass?

## Output Contract

A compressed history is acceptable only if:
- Total tokens are below 70% of the limit (leaves headroom for response)
- All pinned decisions appear verbatim
- All entity IDs and file paths are preserved
- The summary is dated and labeled "compressed N original turns into M summary lines"

## Common Failure Modes

- **Compressing too late.** At 95% you have no room to write the summary itself.
- **Summarizing decisions.** A paraphrased decision is a wrong decision. Always verbatim.
- **Dropping tool results blindly.** The most recent tool result is often what the next turn needs.
- **No round-trip check.** If you cannot ask the agent a question that depends on the dropped content and get a correct answer, you compressed the wrong thing.
- **Compression without persistence.** If the summary lives only in the prompt, a crash loses it. Write to `Ema.Memory`.

## See Also

- `daemon/lib/ema/agents/agent_memory.ex`
- `daemon/lib/ema/memory.ex`
- Skill: `memory-systems`
