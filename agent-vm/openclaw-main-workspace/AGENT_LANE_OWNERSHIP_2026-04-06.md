# Agent Lane Ownership — 2026-04-06

## Bound agents observed on Discord

Channel-bound specialists:
- `ops`
- `coder`
- `researcher`
- `concierge`
- `strategist`
- `vault-keeper`
- `security`

Catch-all/default guild route:
- `main`

---

## Practical ownership model

### main — Right Hand
Owns:
- general orchestration
- bootstrap/meta coordination
- ambiguous requests
- cross-lane stitching
- things that do not clearly belong elsewhere

Should delegate to:
- specialists when a lane is clearly defined

### ops
Owns:
- services
- bring-up
- system integration behavior
- runtime health
- deployment-ish and environment-ish tasks

### coder / codex / tech-lead family
Owns:
- implementation work
- repo changes
- MCP/tooling changes tied to code workflows
- structured codebase modifications

### researcher
Owns:
- repo/document research
- ecosystem scanning
- intel synthesis
- turning vague external questions into grounded findings

### strategist
Owns:
- planning
- lane design
- sequencing
- tradeoff framing

### vault-keeper
Owns:
- vault structure
- note quality
- knowledge hygiene
- long-term memory organization

### security
Owns:
- hardening
- audits
- risk review
- exposure and auth concerns

### concierge
Owns:
- user-facing convenience flows
- routing and lightweight handoff support
- helpful coordination work that is not deep implementation

---

## Higher-order leads

### life-lead
Owns personal/home lanes, can delegate to:
- chief-of-staff
- finance
- wellness

### business-lead
Owns business lanes, can delegate to:
- biz-dev
- account-manager
- creative-director
- marketer
- writer

### tech-lead
Owns technical coordination, can delegate to:
- coder
- codex
- architect
- researcher
- ops
- security

### quality-lead
Owns review/critique/quality, can delegate to:
- prompt-engineer
- devils-advocate
- strategist
- vault-keeper
- analyst
- pm

---

## Current smell

There are many defined agents, but only a subset appear to have strong real-world lane bindings today.
That means the system is ahead of its actual social/runtime usage.

Not fatal. Just means:
- documented potential > current operational clarity

---

## Recommended lane policy

### Default rule
If a request is clearly one of these, send it there:
- runtime/system → ops
- coding/building → coder/codex
- research/intel → researcher
- planning/architecture sequencing → strategist
- vault/knowledge → vault-keeper
- hardening/risk → security

Otherwise let `main` own it.

### Important constraint
Avoid having `main`, `ops`, `strategist`, and `researcher` all answer the same class of question in parallel unless explicitly orchestrated.
That creates lane mush.

---

## Bottom line

The environment already has a decent lane architecture.
The missing piece is not more agents — it is enforcing clearer ownership so requests route predictably.
