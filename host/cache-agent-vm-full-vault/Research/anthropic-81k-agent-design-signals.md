# Anthropic 81,000-Person Study: Agent Design Signals

*Date: 2026-03-19*
*Source: Anthropic large-scale interview study on AI use patterns*
*Confidence: Medium — secondary synthesis; primary source not directly read*

---

## Key Signals and What They Mean for Agent Design

### 1. Unreliability is the #1 concern (27%)

More than a quarter of surveyed users identify unreliability as their top AI concern — hallucination, inconsistent outputs, things that "work most of the time."

**Agent design implications:**
- Confidence scores are mandatory on research outputs. Never present an uncertain finding as a fact.
- Handoff envelopes must include explicit done-criteria and confidence fields — agents report certainty, not just completion.
- Verification before claiming done: "I ran X, output shows Y" — not "should work."
- Prefer fewer, higher-confidence outputs over more, lower-confidence ones. Unreliability compounds in multi-agent chains.

**What this rules out:**
- Research agents that output summaries without sourcing claims
- Routing that doesn't surface when an agent is outside its competency
- Single-pass outputs without any self-check step for high-stakes tasks

---

### 2. Sycophancy (11%) — AI agrees when it should push back

11% cite sycophancy as a top concern. Users notice when AI validates flawed reasoning. This erodes trust.

**Agent design implications:**
- Anti-sycophancy directives added to all active agent SOUL files (2026-03-19).
- Agents must push back when they see a clear flaw, not after completing the flawed task.
- Devils-advocate agent exists precisely for this — use it more aggressively for high-stakes decisions.

**What this rules out:**
- Agents that validate plans without checking them
- "Great idea!" openers before any analysis
- Manufactured enthusiasm for low-value tasks

---

### 3. Autonomy & Agency concern (22%)

22% worry about AI having too much autonomy. This is *not* a reason to build more autonomous systems — it's validation that human-in-the-loop checkpoints are the right design.

**Agent design implications:**
- The checkpoints we already have (ask before external actions, confirm before blast-radius changes) are correct.
- For >3 dependents, state the change; for >10, list them explicitly.
- Escalation paths matter: agents should surface uncertainty to Right Hand, not silently choose.
- Autonomous loops (like Jira→implement→push) need explicit human approval gates, not just logging.

**What this rules out:**
- Fully autonomous multi-day agent runs without check-ins
- Agents that send external messages (email, Discord) without explicit task instruction
- "I'll handle this while you sleep" patterns without prior authorization

---

### 4. Illusory Productivity (18%)

18% of users say AI speeds up the treadmill — more volume, same quality, no actual progress. More emails written, more tasks "completed," same underlying outcomes.

**Agent design implications:**
- Optimize for quality and decision-support, not task throughput.
- The materiality test ("would removing this change a decision?") applies to agent outputs too.
- Vault writes should capture *actionable knowledge*, not just activity logs.
- Measuring output volume is the wrong metric. Measure: decisions improved, time saved on non-creative work, quality of agent-assisted outputs.

**What this rules out:**
- Agents that auto-generate reports nobody reads
- Optimizing for "tasks dispatched" rather than "tasks that mattered"
- Status updates that document activity without signaling state change

---

### 5. Light/Shade Entanglement

Every AI capability has a shadow use case. The benefit and the harm are structurally entangled — you can't have one without enabling the other.

**Examples:**
- Research assistance → research shortcuts that prevent learning
- Writing support → writing displacement that atrophies skill
- Scheduling → delegation that creates distance from one's own priorities

**Agent design implications:**
- Design for the shadow use case, not just the benefit.
- Scaffold learning, don't replace it. When Trajan asks for research, return structured findings + teach-back signals, not just conclusions.
- Cognitive atrophy (see below) is the shadow of productivity assistance. Build in friction for volitional skill retention.
- The "illusory productivity" finding above is partly a light/shade entanglement: productivity tools → productivity theater.

---

### 6. Regional Use Patterns

**Developing world (Africa, LatAm, SE Asia):**
- Entrepreneurship and capital access are #1 use case
- AI as capital bypass: replace lawyers, accountants, market research firms that were previously cost-prohibitive
- Implication: AI agent value is highest where it replaces expensive professional services

**Developed world:**
- Life management, scheduling, personal productivity
- AI as cognitive offload for the overwhelmed knowledge worker

**Relevance for our system:**
- Trajan's use case is the "developed world" pattern — cognitive offload, research, system management
- Design for depth and reliability over breadth and speed
- The capital-bypass use case is not our primary; don't over-index on "doing more things faster"

---

### 7. Cognitive Atrophy

Educators see cognitive atrophy 2.5–3× more than other professional groups. But volitional learners (tradespeople, self-directed learners) almost never see it.

**The key variable: autonomy and intent.**

When the learner chose to learn something, AI assistance doesn't atrophy the skill — it accelerates it. When AI handles something the user never intended to learn, atrophy doesn't occur either (they never had the skill). Atrophy happens specifically when AI does things the user *was trying to learn* or *valued being able to do*.

**Agent design implications:**
- Don't fully automate things Trajan has expressed wanting to understand.
- When asked to "just do it" for something complex, ask once: "Do you want the process visible?" If no, proceed silently. If yes, narrate.
- Research outputs should scaffold reasoning, not replace it. Return: finding + the reasoning chain + sources — not just conclusions.
- Coding assistance: generate code with explanation, not just code. Trajan learns from the explanation.

---

## Synthesis: Design Heuristics from the 81k Study

| Finding | Heuristic |
|---|---|
| Unreliability #1 | Confidence scores mandatory. Verify before claiming done. |
| Sycophancy #2 | Push back once, concisely. Execute if instructed. |
| Autonomy concern | Human checkpoints at every external action and blast-radius change. |
| Illusory productivity | Measure quality and decision-support, not throughput. |
| Light/shade | Design against the shadow use case, not just for the benefit. |
| Volitional learning | Scaffold, don't replace, where Trajan wants to understand. |

---

*Related: [[Anti-Pattern Prompting]], [[Agent Evaluation Frameworks]], [[pike-rules-agent-architecture]], [[Self-Critique and Auto-Evolution Design]]*
