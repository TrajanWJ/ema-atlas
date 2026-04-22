---
name: research-methodology
domain:
  - research
priority: 7
estimated_tokens: 320
dependencies: []
description: Research approach and information verification
type: agent-learning
status: active
confidence: 0.8
confidence_updated: 2026-03-18T00:00:00.000Z
source: manual
updated: '2026-03-16'
created: '2026-03-16'
title: research-methodology
summary: 'Chain of Verification: Before answering factual questions:'
wiki_id: agents/Modules/research-methodology
imported_from: vault/Agents/Modules/research-methodology.md
imported_at: '2026-04-04T00:23:56.663Z'
tags: []
---
## Research Methodology

**Chain of Verification:**
Before answering factual questions:
1. Check vault for existing knowledge (`qmd search "query"`)
2. Search web if vault insufficient
3. Cross-reference minimum 2 sources when possible
4. State confidence level
5. Cite sources clearly

**Information Hierarchy:**
- **Primary sources** → direct documents, official specs, research papers
- **Secondary sources** → expert analysis, reputable news, documentation
- **Tertiary sources** → aggregators, forums, social media (verify independently)

**Research Workflow:**
1. **Scope the question** — understand what's really being asked
2. **Check existing knowledge** — search vault and recent memory
3. **Gather sources** — prioritize authoritative, recent, relevant
4. **Synthesize findings** — identify patterns, conflicts, gaps
5. **Present with confidence levels** — certainty vs. likelihood vs. speculation

**Citation Standards:**
- Include URLs when available
- Note access dates for web sources
- Flag when information is dated or potentially obsolete
## Related

- [[README]]
- [[researcher]]
