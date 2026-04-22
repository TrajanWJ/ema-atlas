---
name: multi-agent-patterns
description: Orchestrator, peer-to-peer, and hierarchical patterns for multi-agent systems — when each fits and how they fail.
triggers:
  - multi agent
  - orchestrator
  - sub agent
  - delegation
  - agent network
  - parallel agents
---

# Goal

Pick a multi-agent topology that matches the work and avoid the failure modes specific to each.

## Inputs

- The task and its decomposition (or lack of one)
- The number of independent sub-tasks
- The shared state requirement
- The latency budget
- The cost budget

## Workflow

1. **Try one agent first.** Most "needs multi-agent" problems are single-agent problems with bad context. Add a multi-agent layer only when one agent provably cannot fit the work in its window.
2. **Pick the topology by shape:**
   - **Orchestrator** (one planner + N workers): the work decomposes into independent sub-tasks with no cross-talk. The planner reads results and synthesizes. Best for fan-out / fan-in.
   - **Hierarchical** (planner → mid-managers → workers): the decomposition itself is large enough to need decomposition. Rare. Often a sign you should reduce scope.
   - **Peer-to-peer** (agents talk to each other): the agents have different specialties and need to negotiate. Highest failure rate; use only when specialties are real and disjoint.
   - **Pipeline** (A → B → C, no branching): sequential transformation with stage-specific prompts. EMA's proposal pipeline (Generator → Refiner → Debater → Tagger) is this.
3. **Define the contract per edge.** Every handoff needs: input shape, output shape, error shape, timeout. If you cannot write the contract, you do not have a multi-agent system, you have a hope.
4. **Pick the coordination substrate.** EMA uses Phoenix.PubSub for pipeline stages. Use it. Do not invent new coordination via shared files.
5. **Bound the fan-out.** Each parent agent should dispatch ≤5 children. Beyond that, errors cascade and you lose the ability to reason about correctness.
6. **Verify before merging.** Each child output goes through verification before the parent uses it. See skill `evidence-before-claims`.

## Output Contract

A multi-agent design must specify, per agent: role, tools, max turns, timeout, output schema, and the parent it reports to. A diagram is not enough.

## Common Failure Modes

- **Multi-agent as a workaround for bad prompts.** If one agent cannot do it, two confused agents will not either.
- **Implicit coordination.** "Agent A will know what to do" is not a contract. Write the contract.
- **Unbounded fan-out.** A planner that spawns 50 children produces 50 ways to fail.
- **Peer-to-peer without disjoint specialties.** Two general agents talking to each other loop until the budget is gone.
- **No verification at handoff.** Trusting a sub-agent's "done" is the second-hand AI failure mode. Verify the artifact, not the claim.
- **Shared mutable state.** Agents writing to the same DB row without locking corrupt each other.

## See Also

- `daemon/lib/ema/proposal_engine/` (pipeline example)
- `daemon/lib/ema/agents/`
- Skill: `evidence-before-claims`
- Skill: `tool-design`
