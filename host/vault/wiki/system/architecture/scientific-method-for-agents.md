---
title: Scientific Method for Agents — Applying SciTeX to OpenClaw
created: '2026-03-18'
updated: '2026-03-18'
type: knowledge
status: active
source: unknown
wiki_id: system/architecture/scientific-method-for-agents
imported_from: vault/Architecture/scientific-method-for-agents.md
imported_at: '2026-04-04T00:23:56.795Z'
tags: []
summary: ''
---

# Scientific Method for Agents — Applying SciTeX to OpenClaw

**Status:** Design document · March 2026
**Inspired by:** [SciTeX](https://github.com/ywatanabe1989/scitex-python) Clew verification system

## Core Principle

> "The question shifts from 'could this be reproduced?' to 'has this been verified?'"

Every agent task is an experiment. Every finding requires evidence. Every claim needs a source chain.

## The Agent-as-Scientist Model

### 1. Session Tracking (= @stx.session)

Every agent run should log:
| Field | Example |
|-------|---------|
| **Input** | User prompt, context provided |
| **Model** | anthropic/claude-sonnet-4-6 |
| **Timestamp** | 2026-03-18T16:30:00Z |
| **Tools called** | web_fetch × 3, web_search × 1 |
| **Sources consulted** | URLs fetched, vault files read |
| **Output** | Summary written, files created |
| **Status** | DONE / DONE_WITH_CONCERNS / BLOCKED |

**Implementation:** Already partially in `memory/YYYY-MM-DD.md` session logs. Formalize into structured frontmatter.

### 2. Evidence Chains (= Clew Hash-Chain DAGs)

For web sources, the chain is:
```
Claim in vault → Source URL → Fetch timestamp → Content hash at time of fetch
```

Every vault research note should include:
- **Sources section:** URLs with access dates
- **Confidence level:** High (multiple corroborating sources), Medium (single authoritative source), Low (inference/single blog post)
- **What was NOT found:** Negative results are data too

### 3. Reproducible Prompts (= YAML Recipes)

SOUL.md + SKILL.md = the "recipe" for an agent's behavior.

Treat them as versioned artifacts:
- Date-stamped changes (already in self-evolution protocol)
- Before/after comparisons on task quality
- Parameterized: the same SKILL.md should produce similar outputs given similar inputs

### 4. Structured Experiments

When researching or building, use this template:

```markdown
## Experiment: [Topic]
**Hypothesis:** [What we expect to find/achieve]
**Method:** [Tools used, search queries, pages consulted]
**Findings:** [What was actually found]
**Evidence:** [Sources with URLs and dates]
**Confidence:** [High/Medium/Low with reasoning]
**Unknowns:** [What remains unclear]
**Next steps:** [Follow-up work needed]
```

### 5. The Vault as Manuscript

| Manuscript Element | Vault Equivalent |
|-------------------|-----------------|
| Abstract | README.md / index files |
| Literature Review | Research/ directory |
| Methods | Architecture/ design docs |
| Results | Projects/ status files |
| Discussion | Trajan/Decisions.md |
| Bibliography | Source links in every note |

### 6. Methodology Documentation

Every research output should include a "How I Found This" section:
- What was searched (queries used)
- What was consulted (URLs, vault files)
- What was tried but failed (dead ends)
- What was NOT searched (scope boundaries)

This prevents the "confident hallucination" failure mode — if evidence is thin, say so explicitly.

## Verification Levels for Agents

| Level | What | Cost | When |
|-------|------|------|------|
| L0 Source check | Does the URL still exist? | Low | On vault reads |
| L1 Claim check | Does the source still say what we claimed? | Medium | Periodic |
| L2 Re-research | Search again from scratch, compare findings | High | On contradiction |

## Implementation Priorities

1. **Now:** Add confidence levels to all Scout/Researcher outputs
2. **Now:** Include source URLs with access dates in vault writes
3. **Soon:** Structured "experiment" template for research tasks
4. **Later:** Automated source freshness checking
5. **Later:** Cross-reference validation (do multiple sources agree?)

## Anti-Patterns to Avoid

- ❌ Stating facts without sources
- ❌ High confidence on single-source findings
- ❌ Summarizing without preserving the original data
- ❌ "I found that X" without explaining HOW you found it
- ❌ Treating absence of evidence as evidence of absence

## Related
- [[SciTeX Concepts]] — Source framework
- [[Auto-Prompt Optimization]] — Self-improving agent prompts
- [[AdalFlow Concepts]] — Trainable prompt parameters
