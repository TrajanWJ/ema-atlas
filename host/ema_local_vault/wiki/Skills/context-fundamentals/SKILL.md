---
name: context-fundamentals
description: Anatomy of context in agent systems — what fills the window, why ordering matters, and how each piece earns its tokens.
triggers:
  - context window
  - prompt structure
  - system prompt
  - context budget
  - token budget
---

# Goal

Give an EMA agent a working mental model of context: the slots that exist, what each one is for, and how to decide what belongs in the window for a given turn.

## Inputs

- The user's current message or seed prompt
- The active actor, project, and intent (if any)
- Recent conversation history
- Available tools and MCP resources
- A token budget (default 6,000 for proposal stages, 12,000 for chat)

## Workflow

1. **Identify the slots.** Every Claude call has the same anatomy:
   - System prompt (role + rules + verification protocol)
   - Loaded skills (just-in-time domain knowledge)
   - Memory block (typed long-term memory for this actor/project)
   - Tools (function specs)
   - Conversation history (compressed when long)
   - User message (the actual ask)
2. **Allocate the budget.** Use `Ema.Intelligence.ContextBudget.allocate/1`. Don't eyeball it. Default split for proposals: 35% project, 25% proposals, 25% tasks, 15% memory.
3. **Score for relevance, not recency.** Use focus terms from the seed/user message. Drop items below the relevance floor before truncating.
4. **Order by recency last, importance first.** Put the most load-bearing context near the top of the user turn. Recent < important.
5. **Prefer pull over push.** If the data is large and only sometimes needed (vault search, similar proposals), expose it as an MCP resource and let Claude pull it. See `ContextManager.mcp_resources/0`.
6. **Verify it fits.** Estimate tokens before sending. If you blow the budget, drop the lowest-relevance section, not the most recent.

## Output Contract

The agent should be able to answer:
- Which slot did each piece of context come from?
- Why was it included over the alternative?
- What did it cost in tokens, and was the budget honored?

When generating code that touches context, every section must be tagged with its source and have a budget. No anonymous string concatenation into a prompt.

## Common Failure Modes

- **Stuffing the system prompt.** Anything that changes per-turn does not belong in the system prompt — it belongs in the user turn or an MCP resource.
- **Ordering by recency only.** The most recent message is rarely the most important. Score by relevance.
- **No budget.** Without `ContextBudget`, prompts grow until they hit the model's hard limit and silently truncate the wrong end.
- **Hidden dependencies.** Pulling context inside a helper function with no logging makes degradation invisible. Log every section's size.
- **Forgetting the verification protocol.** It must appear in every agent prompt — see `ContextManager.verification_protocol/0`.

## See Also

- `daemon/lib/ema/claude/context_manager.ex`
- `daemon/lib/ema/intelligence/context_budget.ex`
- Skill: `context-degradation`
- Skill: `context-compression`
