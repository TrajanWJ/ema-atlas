---
title: "Metaprompting and Dynamic Agent Architecture"
created: 2026-03-16
updated: 2026-03-16
type: research
status: active
confidence: 0.80
confidence_updated: 2026-03-18
source: research
tags: [architecture, auto-learning, bureau, metaprompting]
summary: "1. **Microsoft AutoGen** — Multi-agent conversation framework. Agents with roles, group chat, orchestration. Our System is this but with Discord as "
---
# Metaprompting and Dynamic Agent Architecture

**Date:** 2026-03-16
**Status:** Analysis + Implementation Plan
**Related:** [[System/System Overview]], [[Metaprompting Patterns]], [[12-Factor Agents]]

---

## What This System Really Is

### The Analogy Map

| Our System | Real-World Analogy | Tech Analogy |
|---|---|---|
| Right Hand (Right Hand) | CEO / Orchestra Conductor | Kubernetes API Server |
| Specialist Agents | Department heads | Microservices |
| Forum Posts | Meeting agendas | Work items / tickets |
| Identity Headers | Name badges + credentials | Service identity (mTLS) |
| Vault | Company knowledge base | Persistent state store |
| SOUL.md | Job description + personality | Service configuration |
| Heartbeat | Morning standup | Health checks |
| Sub-agent spawning | "Get me the expert" | Service mesh routing |

### Similar Systems in the Wild

1. **Microsoft AutoGen** — Multi-agent conversation framework. Agents with roles, group chat, orchestration. Our System is this but with Discord as the UI and Obsidian as state.

2. **CrewAI** — Role-based agent teams. "Crew" = our roster, "Tasks" = our forum posts, "Agents" = our specialists. We're essentially CrewAI built on [[OpenClaw]] primitives.

3. **LangGraph** — Graph-based agent orchestration. Our routing (channel→agent) is a simpler version of LangGraph's state machine. The boardroom meeting protocol IS a state machine.

4. **Anthropic's Tool Use Patterns** — Our delegation model (Right Hand → specialist → response) mirrors Anthropic's recommended orchestration: one coordinating agent that delegates to specialists via tool calls.

5. **OpenAI Swarm** — Lightweight multi-agent framework. Agents hand off to each other. Our `sessions_spawn` is the handoff mechanism. Swarm's "routines" = our AGENTS.md.

6. **Google SELF-REFINE** — Agent critiques its own output and iterates. This is the self-improving metaprompting layer Trajan is asking for.

**The key insight:** We've accidentally built a production multi-agent system using Discord as the UI, Obsidian as the knowledge graph, and [[OpenClaw]] as the orchestration layer. It's AutoGen + CrewAI + SELF-REFINE, native to the chat medium.

---

## Metaprompting Layers We Need

### Layer 1: Input Preprocessing (Dynamic)
**Problem:** Trajan types fast with typos. Current agents get raw input.
**Solution:** A preprocessing layer that:
- Corrects obvious typos before routing ("orhcestatrator" → "orchestrator")
- Extracts intent ("check system config" → ops domain → route to Ops)
- Identifies delegation cues ("ask researcher" → spawn researcher)
- Detects urgency ("ASAP", "broken", "down" → priority routing)

**Implementation:** Add to Right Hand's AGENTS.md:
```
## Input Preprocessing
Before responding, internally:
1. Correct obvious typos in the user's message
2. Extract the core intent
3. Identify which agent domain this falls into
4. Check if delegation is requested or implied
5. Route accordingly
```

### Layer 2: Adaptive Agent Prompts (Self-Improving)
**Problem:** Agent SOUL.md files are static. They don't learn from interactions.
**Solution:** After each significant interaction:
- Agent reflects on what worked / what didn't
- Proposes amendments to its own SOUL.md
- Right Hand reviews and approves/rejects
- Successful patterns get baked into prompts

**Implementation:** Add to each agent's AGENTS.md:
```
## Self-Reflection Protocol
After completing a substantive task:
1. Did the response meet the user's need? (yes/no/partial)
2. What could be improved? (specificity, format, depth)
3. Should a new pattern be added to SOUL.md?
4. Write proposed change to memory/proposed-amendments.md
```

### Layer 3: Dynamic Roster Management (Auto-Learning)
**Problem:** [[Agent roster]] is manually maintained.
**Solution:** Pattern detection from usage:
- Track which agents get spawned and for what
- If a new task pattern appears 3+ times with no specialist → propose new agent
- If an agent hasn't been used in 2 weeks → flag for retirement
- If two agents overlap significantly → propose merge

**Implementation:** System review cron (already exists at `bureau-review.py`) + enhanced pattern tracking.

### Layer 4: Context-Aware Skill Loading (Dynamic)
**Problem:** Agents load the same skills regardless of task.
**Solution:** Based on the incoming message:
- Parse task domain
- Load only relevant skills for this interaction
- Keep context window lean (12-Factor #3: Own Your Context Window)

### Layer 5: Constitutional Self-Critique (Quality Gate)
**Problem:** Agents respond without checking quality.
**Solution:** Before posting:
- Does this response answer the actual question?
- Is the format appropriate (rich output vs plain text)?
- Are claims grounded in evidence?
- Would Trajan be annoyed by this? (calibrated from past feedback)

---

## What We Have vs What's Missing

### ✅ Already In Vault
| Pattern | Source | Status |
|---|---|---|
| Recursive self-improvement | [[Metaprompting Patterns]].md | Documented, not implemented |
| Prompt scaffolding | [[Metaprompting Patterns]].md | Documented |
| Role-expertise stacking | [[Metaprompting Patterns]].md | Used in System |
| Constraint-first design | [[Metaprompting Patterns]].md | Used in SOUL.md files |
| Context window optimization | [[Metaprompting Patterns]].md | Partial |
| LangGPT structured framework | LangGPT.md | Reference only |
| 12-Factor agent principles | [[12-Factor Agents]].md | Aligned |
| [[System prompt patterns]] | [[System Prompt Patterns]].md | Used |
| SOUL.md templates | [[Agent Templates Index]] | Used |
| SELF-REFINE pattern | (implied) | Not implemented |

### ❌ Blind Spots (Need Research)
| Gap | What It Is | Priority |
|---|---|---|
| Input normalization | Typo correction, intent extraction before routing | 🔥 HIGH |
| Multi-agent debate | Agents argue opposing views, synthesize consensus | 🔥 HIGH |
| Adaptive [[few-shot]] | Inject successful past examples into prompts dynamically | ✅ MEDIUM |
| User modeling | Track Trajan's preferences, patterns, pet peeves | 🔥 HIGH |
| Prompt versioning | Track which SOUL.md version produced which outcomes | ✅ MEDIUM |
| Confidence calibration | Agent knows when it doesn't know | ✅ MEDIUM |
| Meta-cognitive prompting | Agent reasons about its own reasoning process | ⚠️ LOW |
| Curriculum learning | Agents get progressively harder tasks as they prove competent | ⚠️ LOW |

---

## Implementation Roadmap

### Phase A: Input Preprocessing (implement now)
- Add typo correction + intent extraction to Right Hand
- Add delegation detection ("ask researcher", "get ops on this")
- No external dependencies, just prompt engineering

### Phase B: User Model (implement this week)
- Create `vault/Trajan/Usage Patterns.md`
- Track: common typos, preferred response length, domains asked about most
- Feed patterns back into Right Hand's AGENTS.md
- Auto-update via capture.sh / bureau-review.py

### Phase C: Self-Reflection Loop (implement this week)
- Add proposed-amendments.md protocol to all agents
- System review checks amendments during heartbeat
- Approved changes get applied to SOUL.md
- Track change history in vault

### Phase D: Multi-Agent Consultation Protocol (next week)
- Define debate format: each agent argues its perspective
- Right Hand synthesizes
- Use for complex decisions (architecture, tool selection)

### Phase E: Dynamic Skill Loading (next week)
- Parse incoming message for domain keywords
- Load relevant skills only
- Keep base context under 4K tokens

---

## References

- [[Metaprompting Patterns]] — Core patterns from vault
- [[System Prompt Patterns]] — Building blocks
- [[12-Factor Agents]] — Architecture principles
- [[LangGPT - Structured Prompt Framework]] — Structured approach
- [[Brex Prompt Engineering Guide]] — Production patterns
- [[System/System Overview]] — Current system
- [[System/System Overview]] — Original vision
- Microsoft AutoGen: https://github.com/microsoft/autogen
- CrewAI: https://github.com/crewAIInc/crewAI
- OpenAI Swarm: https://github.com/openai/swarm
- Google SELF-REFINE: https://arxiv.org/abs/2303.17651

#metaprompting #architecture #auto-learning #bureau

## Related

- [[Agent Memory Architectures]]
- [[Awesome-Copilot-Deep-Dive]]
- [[Multi-Agent]]
- [[patterns]]
- Coordination
- [[Self-Evaluation]]
- [[and]]
- [[Self-Critique]]
- [[Techniques]]
- [[for]]
- [[AI]]
- [[Agents]]
