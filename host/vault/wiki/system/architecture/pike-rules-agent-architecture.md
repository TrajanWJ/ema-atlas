---
type: knowledge
wiki_id: system/architecture/pike-rules-agent-architecture
imported_from: vault/Architecture/pike-rules-agent-architecture.md
imported_at: '2026-04-04T00:23:56.791Z'
tags: []
summary: ''
---
# Pike Rules Applied to Agent Architecture

*Date: 2026-03-19*
*Source: Rob Pike's 5 Rules of Programming, applied to our multi-agent system*

Rob Pike's rules were written for C systems programming in 1989. They're more applicable to agent systems than to most modern software — because the failure modes are identical: premature complexity, unmeasured optimization, and clever algorithms that nobody can debug.

---

## Rule 1: Don't Optimize Routing Until Measured

**Original:** "You can't tell where a program will spend its time. Bottlenecks occur in surprising places, so don't try to second guess and put in a speed hack until you've proven that's where the bottleneck is."

**Applied:** The temptation after seeing kbot's Bayesian skill routing is to add learned routing to our system. Don't. We don't know where our routing fails. We don't have outcome data per task type per agent. We don't know if the bottleneck is routing decisions, agent capability, handoff latency, or something else entirely.

**Constraint:** No new routing logic until we have ≥50 task outcomes with explicit routing labels. No Bayesian routing until static rules demonstrably fail on >20% of tasks.

**Rules out:**
- Adding TrueSkill scoring without first measuring current routing accuracy
- Implementing skill-probability lookup without baseline failure data
- Any "smarter" routing that hasn't been shown to fix a measured problem

---

## Rule 2: Measure Before Tuning

**Original:** "Measure. Don't tune for speed until you've measured, and even then don't unless one part of the code overwhelms the rest."

**Applied:** Agent handoffs are opaque right now. We don't know: what fraction of tasks get routed correctly on first try, how long handoffs take, which agents fail most often and why, or what task types cause confusion. Before tuning any of this, we need instrumentation.

**Constraint:** The first engineering investment in agent optimization must be *measurement infrastructure*, not optimization. Outcome tracker (`memory/outcome-tracker.json`) must be populated with real data before any agent tuning decision is made.

**Rules out:**
- Tuning agent prompts based on intuition rather than failure patterns
- Optimizing handoff envelopes without knowing which fields agents actually use
- Removing or combining agents without knowing their per-task contribution

**What measurement looks like:**
- Log each dispatch: task, agent assigned, time to complete, outcome (success/partial/fail)
- After 50+ tasks, compute: per-agent success rate by task category, routing accuracy (correct agent on first try?), failure modes distribution
- Only then tune

---

## Rule 3: Simple Agents Beat Fancy Ones

**Original:** "Fancy algorithms are slow when n is small, and n is usually small. Fancy algorithms have big constants. Until you know that n is frequently large, don't get fancy."

**Applied:** Our 8-agent roster (Right Hand, Orchestrator, Researcher, Coder, Ops, Security, Vault Keeper, Scout) handles the overwhelming majority of Trajan's tasks. Adding a 9th or 10th agent for a narrow use case introduces routing ambiguity, maintenance overhead, and new failure modes — before we've saturated the current 8.

kbot has 23 agents. We have 8. kbot also has a Bayesian router to manage 23 agents. We don't need 23 agents. We especially don't need a Bayesian router to manage 8.

**Constraint:** Do not add agents until:
1. A task type has failed 3+ times because no current agent can handle it
2. The gap cannot be filled by improving an existing agent's SOUL.md
3. The new agent's domain is clearly non-overlapping with existing agents

**Rules out:**
- Adding specialized agents (e.g., "Finance Agent," "Legal Agent") without demonstrated need
- Splitting existing agents to create more granular routing targets
- Building agent hierarchies before simple flat routing fails

---

## Rule 4: Fancy Algorithms Are Buggier

**Original:** "Fancy algorithms are buggier than simple ones, and they're much harder to debug. Use simple algorithms as long as they can."

**Applied:** A Bayesian router that learns from outcomes sounds elegant. It is also: harder to reason about when it makes wrong decisions, prone to cold-start failure (no data = random routing), dependent on accurate outcome labeling (which we also don't have), and impossible to audit without extensive logging infrastructure.

Our current routing — Right Hand reads the task, applies explicit rules, dispatches — is simple, debuggable, and wrong in predictable ways. Predictable failures are fixable. Learned routing fails in unpredictable ways that compound over time if training data is noisy.

**Constraint:** Explicit rule-based routing is the default. Learned routing requires: ≥200 labeled examples, a defined failure mode in current rules, and an evaluation harness to confirm improvement before deployment.

**Rules out:**
- Replacing routing rules with ML/probabilistic models
- Using embedding similarity for task-to-agent matching
- Any routing system that can't explain its decision in plain text

---

## Rule 5: Data Structures Dominate

**Original:** "Data structures, not algorithms. If you've chosen the right data structures and organized the things well, the algorithms will almost always be self-evident."

**Applied:** The most impactful architectural decision we've made isn't any agent's prompt — it's the handoff envelope format and vault organization. A well-structured handoff envelope (task, context, constraints, done criteria) makes agent behavior predictable regardless of which agent receives it. A well-organized vault means retrieval is a `qmd search` call, not an algorithm.

Before adding retrieval sophistication (GraphQL, graph databases, embedding models), verify the vault structure is sound. Before adding handoff routing complexity, verify the handoff envelope carries the right fields.

**Constraint:** Architectural work on data structures (vault schema, handoff envelope fields, memory tiers) takes priority over algorithmic improvements (smarter retrieval, learned routing). When a retrieval problem surfaces, first ask: "is the data organized correctly?" before asking "do we need a better algorithm?"

**Rules out:**
- Adding vector search before verifying vault structure handles the query load
- Adding graph-based knowledge retrieval before simple semantic search fails
- Storing agent memory in complex schemas before flat markdown proves insufficient

---

## Summary: What These Rules Collectively Impose

| Decision | Without Pike Rules | With Pike Rules |
|---|---|---|
| Bayesian routing | "kbot has it, add it" | "Measure first. 200 examples minimum." |
| New agent | "This task type is growing" | "Show 3 failures current roster can't handle" |
| Graph retrieval | "More powerful than BM25" | "Prove BM25 fails at our query volume first" |
| Learned prompts | "Auto-optimization sounds cool" | "Explicit prompts fail in debuggable ways. Keep them." |
| 23-agent roster | "More specialization = better" | "8 agents, 95%+ coverage. Prove the gap." |

The meta-rule: **complexity must be earned by demonstrated failure of the simpler approach.** Every time we add a fancy system, we are betting that we've correctly identified the bottleneck. Pike's rules are the reminder that we're almost always wrong about where the bottleneck is.

---

*Related: [[bayesian-agent-routing]], [[agent-handoff-envelope]], [[Agent Evaluation Frameworks]]*
