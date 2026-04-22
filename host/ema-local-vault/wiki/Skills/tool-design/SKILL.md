---
name: tool-design
description: Build tools agents can actually use — clear names, narrow contracts, useful errors, and outputs the next turn can act on.
triggers:
  - tool design
  - function calling
  - agent tools
  - mcp tool
  - tool spec
---

# Goal

Design a tool an agent will use correctly on the first try, without you having to coach it through error recovery.

## Inputs

- The capability you want to expose
- The agent's typical question that should trigger this tool
- The data the tool needs and produces
- The cost and side effects of calling it

## Workflow

1. **Name it like an English verb phrase.** `search_vault` not `vault_handler`. `create_brain_dump_item` not `bd_create`. The name alone should answer "when do I call this?"
2. **Write the description for the agent, not the developer.** First sentence: when to call it. Second: what it returns. Third: what it does NOT do (negative space prevents misuse). Keep under 200 tokens.
3. **Narrow the contract.** Required parameters only. No "options" bag. Every parameter typed and described. If you need 10 parameters, you have 10 tools.
4. **Make outputs structured and small.** Return JSON, not prose. Return IDs and titles, not full bodies — let the agent fetch detail with a second call if needed. Big outputs poison the next turn.
5. **Make errors actionable.** Bad: `{"error": "failed"}`. Good: `{"error": "task_not_found", "id": "task_abc", "hint": "use list_tasks to see valid ids"}`. The agent should be able to recover without asking the user.
6. **Make it idempotent or label it destructive.** If calling twice is unsafe, the description must say so and the tool should require a confirmation parameter.
7. **Test it in isolation.** Spin up a session with only this tool and 5 prompts that should trigger it. If the agent picks the wrong tool or wrong arguments, the description is wrong.

## Output Contract

A tool spec is shippable when:
- Name is verb-phrase
- Description has the three sentences (when / returns / does-not-do)
- All parameters typed, described, required-or-optional explicit
- Output schema documented
- Error shapes enumerated
- Idempotency labeled
- One round-trip example in the description

## Common Failure Modes

- **Tools named after the implementation.** `pg_query` is a developer name. The agent does not know what pg is.
- **Kitchen-sink tools.** One tool with 12 modes is 12 broken tools.
- **Prose outputs.** Agents re-parse prose every turn and get it wrong.
- **Silent failures.** Returning `null` on error trains the agent to ignore failures.
- **Missing negative space.** If you do not say "this does not create the entity," the agent will assume it does.
- **No examples.** A description without an example is a riddle.

## See Also

- `daemon/lib/ema/mcp/server.ex`
- `daemon/lib/ema/agents/agent_worker.ex`
- Skill: `prompt-engineering`
