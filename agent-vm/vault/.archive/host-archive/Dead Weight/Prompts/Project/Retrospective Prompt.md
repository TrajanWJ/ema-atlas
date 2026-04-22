# Retrospective Prompt

Sources: [tayyabakmal1/qa-prompt-library](https://github.com/tayyabakmal1/qa-prompt-library), [sdi2200262/agentic-project-management](https://github.com/sdi2200262/agentic-project-management), [Parabol - Sprint Retrospective Ideas](https://www.parabol.co/resources/sprint-retrospective-ideas/)

**When to use**: End of sprint, end of project, after a significant incident, or after completing a major feature.

---

## Prompt

Conduct a structured retrospective on the following work period.

**Period**: `[sprint dates, project name, or feature]`
**Participants**: `[human, agent roles involved]`

### Choose a Retrospective Format

Pick the format that matches the situation. Each surfaces different insights.

**Start / Stop / Continue** — Best for routine sprints with clear improvement areas.
| Start Doing | Stop Doing | Continue Doing |
|------------|------------|----------------|
| New practices to adopt | Practices that waste time or cause harm | Practices that are working well |

**4Ls (Liked, Learned, Lacked, Longed For)** — Best after milestones, releases, or project completion. Balances emotional reflection with practical improvements.
| Liked | Learned | Lacked | Longed For |
|-------|---------|--------|------------|
| What went well, felt good | New knowledge gained | What was missing, gaps | What we wish we had |

**Timeline Retrospective** — Best after complex sprints with multiple events. Walk through the sprint chronologically, marking events as positive (above line) or negative (below line), then identify patterns.

**Sailboat** — Best for visual thinkers and when looking ahead. Wind = what propels us forward. Anchor = what holds us back. Rocks = risks ahead. Sun = what makes work enjoyable.

**Mad / Sad / Glad** — Best after difficult sprints or team friction. Surfaces emotional responses that other formats miss.

### Standard Reflection Questions

#### What Went Well
- What practices should we continue?
- What tools or workflows saved time?
- What decisions proved correct?
- What agent delegations worked effectively?

#### What Didn't Go Well
- Where did we struggle or waste time?
- What decisions were wrong in hindsight?
- Where did communication break down?
- What agent tasks failed or needed excessive iteration?

#### What We Learned
- New patterns or techniques discovered
- Codebase knowledge gained
- Tool capabilities discovered
- Limitations identified

### Metrics Review

**Sprint Metrics:**
| Metric | Target | Actual | Trend |
|--------|--------|--------|-------|
| Story points planned | ? | ? | -- |
| Story points completed | ? | ? | -- |
| Velocity (rolling avg) | ? | ? | -- |
| Test coverage | 80% | ? | -- |
| Bugs found in review | — | ? | -- |
| Tasks completed | ? | ? | -- |

**Agent-Specific Metrics:**
| Metric | Target | Actual | Trend |
|--------|--------|--------|-------|
| Context resets needed | — | ? | -- |
| Agent delegation success rate | — | ? | -- |
| Tasks requiring re-work | < 20% | ? | -- |
| Phases completed per session | — | ? | -- |

**DORA Metrics (if tracking):**
| Metric | Last Sprint | This Sprint | Trend |
|--------|------------|-------------|-------|
| Deployment frequency | ? | ? | -- |
| Lead time for changes | ? | ? | -- |
| Change failure rate | ? | ? | -- |
| Time to restore | ? | ? | -- |

### Action Items

For each improvement:
```
Action: [specific change to make]
Owner: [who will do this]
When: [by when]
Measure: [how we'll know it worked]
```

**Action item quality test:** Each action must be specific (not "be better at X"), have an owner, have a deadline, and have a way to verify it happened. Limit to 3-5 actions per sprint — too many guarantees none get done.

### Process Improvements
- Context management: Were sessions efficient? Too many resets?
- Memory/knowledge: What should be captured for future sessions?
- Delegation: Should any tasks be split differently?
- Tools: Any new tools or MCP servers to evaluate?

### Carry Forward
Update the following based on learnings:
- [[Coding Standards]] — any new conventions?
- [[Architecture Principles]] — any new patterns?
- [[Testing Philosophy]] — any gaps found?
- Agent role definitions — any adjustments needed?
- [[Sprint Planning Prompt]] — adjust velocity or estimation approach?
