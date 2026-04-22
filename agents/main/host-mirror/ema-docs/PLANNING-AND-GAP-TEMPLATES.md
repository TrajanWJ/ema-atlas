# EMA Planning + Gap Templates

Status: initial template pack
Date: 2026-04-13

## Candidate Intent Template

```markdown
---
id: CINT-001
plane: planning
subtype: candidate_intent
status: draft
created: 2026-04-13
updated: 2026-04-13
author: human
summary: "Short summary"
connections:
  - { target: "[[planning/aspirations/ASP-001-example]]", relation: derived_from }
  - { target: "[[canon/specs/BLUEPRINT-PLANNER]]", relation: references }
tags: [planning, candidate-intent]
---

# CINT-001 — Title

## Intent

## Why now

## Parent / child structure

## Related canon

## Related reality

## Related gaps

## Promotion path
```

## Planning Node Template

```markdown
---
id: PLAN-001
plane: planning
subtype: planning_node
status: draft
created: 2026-04-13
updated: 2026-04-13
author: human
summary: "Short summary"
connections: []
tags: [planning, schematic]
---

# PLAN-001 — Title

## Scope

## Desired shape

## Sub-plans / candidate intents

## Related canon targets

## Related runtime surfaces

## Blocking gaps
```

## Aspiration Template

```markdown
---
id: ASP-001
plane: planning
subtype: aspiration
status: active
created: 2026-04-13
updated: 2026-04-13
source_type: manual|detected
summary: "Short summary"
connections: []
tags: [planning, aspiration]
---

# ASP-001 — Title

## Source signal

## Expanded aspiration

## Time horizon

## Candidate directions

## Linked planning artifacts
```

## Gap Template

```markdown
---
id: GAP-PR-001
plane: gap
subtype: planning_reality
status: open
severity: high
created: 2026-04-13
updated: 2026-04-13
summary: "Short statement of the gap"
resolution_target: planning
connections: []
tags: [gap, planning-reality, high-priority]
---

# GAP-PR-001 — Title

## Gap statement

## Why it matters

## Canon refs

## Planning refs

## Reality refs

## Proposed resolution

## Resolution path
```

## Promotion Candidate Template

```markdown
---
id: PROMO-001
plane: planning
subtype: promotion_candidate
status: draft
created: 2026-04-13
updated: 2026-04-13
promotion_target: canon|proposal|goal|execution|review
summary: "Short summary"
connections: []
tags: [planning, promotion-candidate]
---

# PROMO-001 — Title

## Candidate artifact

## Why it is mature

## Evidence

## Objections / unknowns

## Proposed target

## Next promotion step
```
