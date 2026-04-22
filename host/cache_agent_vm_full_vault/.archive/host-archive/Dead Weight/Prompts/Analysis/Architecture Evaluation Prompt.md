# Architecture Evaluation Prompt

Sources: [affaan-m/everything-claude-code](https://github.com/affaan-m/everything-claude-code), [mitsuhiko/agent-prompts](https://github.com/mitsuhiko/agent-prompts), [trailofbits/claude-code-config](https://github.com/trailofbits/claude-code-config), [SEI ATAM Method](https://www.sei.cmu.edu/library/architecture-tradeoff-analysis-method-collection/)

**When to use**: Before designing a new system, evaluating an existing architecture, or making significant structural changes.

---

## Prompt

Evaluate the architecture of this system/component. Use the ATAM-inspired four-phase approach below.

**Subject**: `[describe the system, component, or proposed design]`

### Phase 1: Current State Analysis
- What patterns are currently in use?
- What are the component boundaries and interfaces?
- Where are the coupling points?
- What is the data flow?
- What are the existing constraints (technical, organizational, regulatory)?

### Phase 2: Quality Attribute Scenarios (ATAM)

Evaluate the architecture against these quality attributes using concrete scenarios. For each, define a stimulus, environment, and expected response.

| Quality Attribute | Scenario Template |
|---|---|
| **Performance** | Under [load], the system responds within [latency] at [percentile] |
| **Availability** | When [component] fails, the system [degrades/recovers] within [time] |
| **Modifiability** | Adding [feature type] requires changes to [N] modules in [time] |
| **Security** | When [attack type] occurs, the system [prevents/detects/recovers] |
| **Testability** | A developer can write and run tests for [component] in [time] without [external dependency] |
| **Deployability** | A change can go from commit to production in [time] with [rollback capability] |
| **Scalability** | The system handles [10x current load] with [acceptable degradation] |

**For each scenario, assess:**
- Does the current architecture satisfy this scenario?
- What architectural decisions support or hinder it?
- What are the sensitivity points (small changes with large impact)?
- What are the tradeoff points (improving one attribute degrades another)?

### Phase 3: Design Proposal
For each proposed change or new component:
- Component responsibilities and boundaries
- API contracts between components
- Data ownership and flow
- Error handling and failure modes
- Deployment and operational model

**Next.js/React Architecture Considerations:**
- Server vs. Client component boundaries — where does the split happen?
- Data fetching strategy (RSC, route handlers, server actions, SWR/React Query)
- Caching layers (Next.js cache, CDN, database query cache)
- State management scope (URL state, server state, client state)
- Middleware chain design (auth, rate limiting, redirects)

### Phase 4: Trade-off Analysis
For each significant decision:
- **Option A**: Description, pros, cons, risk
- **Option B**: Description, pros, cons, risk
- **Recommendation**: Which option and why
- **Reversibility**: How hard is it to change this later?
- **Cost of Being Wrong**: What happens if this decision is incorrect?

### Red Flags to Check
- [ ] Big Ball of Mud (no clear boundaries)
- [ ] Tight coupling (changes cascade across modules)
- [ ] God objects (too many responsibilities in one component)
- [ ] Circular dependencies
- [ ] Premature optimization
- [ ] Missing error boundaries (React) or error handling layers
- [ ] No observability (logging, metrics, tracing)
- [ ] Single points of failure
- [ ] Distributed monolith (microservice boundaries but monolith coupling)
- [ ] Shared mutable state across components
- [ ] Missing Data Access Layer (database calls scattered through components)
- [ ] No clear API versioning strategy

### Architecture Decision Record (ADR) Output

```
## ADR-NNNN: [Decision Title]

**Status**: Proposed | Accepted | Deprecated | Superseded
**Date**: [date]

### Context
[What forces are at play? What is the problem?]

### Decision
[What is the change being proposed or decided?]

### Quality Attributes Affected
[Which ATAM quality attributes does this impact, and how?]

### Consequences
**Positive**: [benefits]
**Negative**: [costs, tradeoffs]
**Risks**: [what could go wrong]

### Alternatives Considered
[What other options were evaluated and why were they rejected?]
```
