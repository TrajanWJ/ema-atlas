# Sprint Planning Prompt

Sources: [tayyabakmal1/qa-prompt-library](https://github.com/tayyabakmal1/qa-prompt-library), [sdi2200262/agentic-project-management](https://github.com/sdi2200262/agentic-project-management), [Mountain Goat Software - Fibonacci Estimation](https://www.mountaingoatsoftware.com/blog/why-the-fibonacci-sequence-works-well-for-estimating), [DORA Metrics](https://dora.dev/guides/dora-metrics-four-keys/)

**When to use**: Beginning of a sprint or development cycle. When organizing a batch of work items.

---

## Prompt

Plan and structure a development sprint for the following work items.

**Sprint Duration**: `[1 week / 2 weeks]`
**Work Items**: `[list features, bugs, tech debt items]`
**Team Velocity**: `[story points completed in last 3 sprints, or "unknown" if first sprint]`

### Story Point Estimation

Use the Fibonacci scale (1, 2, 3, 5, 8, 13, 21) for relative effort estimation. Points reflect complexity + effort + uncertainty, not hours.

| Points | Meaning | Reference |
|--------|---------|-----------|
| 1 | Trivial change, < 1 hour, zero uncertainty | Fix a typo, update a constant |
| 2 | Small task, well-understood, minimal risk | Add a field to a form, update styling |
| 3 | Moderate task, clear path, low risk | New API endpoint with tests, simple component |
| 5 | Significant work, some uncertainty | Feature with multiple components, data flow changes |
| 8 | Large task, meaningful uncertainty | New integration, complex state management |
| 13 | Very large, high uncertainty — consider splitting | Multi-system feature, schema migration |
| 21 | Epic-sized — MUST split before starting | Should not exist in a sprint backlog |

**Estimation process:**
1. Pick a reference story the team agrees on (e.g., "adding a CRUD endpoint = 3 points")
2. Estimate each item relative to the reference — "Is this bigger or smaller?"
3. If estimates diverge by more than one Fibonacci step, discuss to surface hidden complexity
4. Never convert points to hours — they measure relative complexity, not time

### Velocity Tracking

| Sprint | Planned Points | Completed Points | Velocity |
|--------|---------------|-----------------|----------|
| N-2 | ? | ? | ? |
| N-1 | ? | ? | ? |
| Current | ? | (in progress) | — |
| **Rolling Avg** | — | — | **?** |

**Planning with velocity:**
- Plan sprint capacity at 70-80% of rolling average velocity (buffer for unknowns)
- First sprint without data: start with 60% of total estimated capacity
- If velocity varies by more than 30% sprint-to-sprint, investigate causes

### Day 1: Planning
- Review backlog and acceptance criteria for each item
- Estimate effort using Fibonacci scale per item
- Identify dependencies between items
- Flag items needing clarification
- Assign items to phases/agents
- Total planned points must not exceed velocity capacity

### Days 2-3: Setup and Early Work
- Environment and tooling configuration
- Write initial tests for ready stories (TDD)
- Begin implementation of items with no dependencies

### Days 4-8: Active Development
- Daily check: What was completed? What's blocked? What's next?
- Track metrics:
  - Story points completed (burndown)
  - Test execution rate
  - Automation coverage
  - Bug discovery rate
  - Items completed vs. planned

### Days 9-10: Integration and Testing
- Integration testing across completed features
- End-to-end user journey validation
- Regression test suite execution
- Performance validation

### Day 11: Stabilization
- Bug fixes only (no new features)
- Test completion checklist
- Documentation updates

### Day 12: Review
- Demo completed work
- Test summary and quality metrics
- Automation coverage report

### Day 13: Retrospective
Use [[Retrospective Prompt]] for structured reflection.

### DORA Metrics to Track

These four metrics (from Google's DevOps Research and Assessment) correlate with high-performing teams. Speed and stability are not tradeoffs — top performers excel at both.

| Metric | What It Measures | Elite Target |
|--------|-----------------|--------------|
| **Deployment Frequency** | How often code reaches production | On-demand (multiple/day) |
| **Lead Time for Changes** | Commit to production | < 1 hour |
| **Change Failure Rate** | Deployments causing failures | < 5% |
| **Time to Restore** | Recovery from production failure | < 1 hour |
| **Deployment Rework Rate** | Rework after deployment (added 2024) | Minimal |

### Sprint Quality Checklist
- [ ] All acceptance criteria met
- [ ] Tests written and passing (80%+ coverage)
- [ ] No CRITICAL or HIGH bugs open
- [ ] Documentation updated
- [ ] Code reviewed and approved
- [ ] Performance validated
- [ ] Security checklist passed
- [ ] Story points completed tracked for velocity calculation
