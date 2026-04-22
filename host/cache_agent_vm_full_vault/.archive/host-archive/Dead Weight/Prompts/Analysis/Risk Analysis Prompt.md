# Risk Analysis Prompt

Sources: [tayyabakmal1/qa-prompt-library](https://github.com/tayyabakmal1/qa-prompt-library), [mitsuhiko/agent-prompts](https://github.com/mitsuhiko/agent-prompts), [SafetyCulture 5x5 Risk Matrix](https://safetyculture.com/topics/risk-assessment/5x5-risk-matrix)

**When to use**: Before starting a new feature, sprint, or project. Before major refactoring. Before releases.

---

## Prompt

Analyze the following feature/project for risks. Be thorough but focused.

**Subject**: `[describe the feature, change, or project]`

### Evaluate across these dimensions:

**1. Technical Risks**
- What could break in the existing system?
- What dependencies are fragile or unmaintained?
- Where are the complexity hotspots?
- What edge cases are likely to cause failures?
- Are there performance bottlenecks at expected scale?

**Next.js/React-Specific Technical Risks:**
- Server/client component boundary violations (importing client hooks in server components)
- Hydration mismatches between SSR and client render
- Middleware chains that silently fail or short-circuit
- ISR/SSG cache invalidation issues in production
- API route cold starts under load (serverless timeout risks)
- State management across page navigations (lost form state, stale context)

**2. Integration Risks**
- What existing systems does this touch?
- What APIs or contracts could break?
- Are there database migration risks?
- What downstream consumers could be affected?
- Are there third-party API rate limits or SLA risks?

**3. Security Risks**
- Does this introduce new attack surface?
- Are there authentication/authorization changes?
- Is user input being handled in new ways?
- Are there data privacy implications?
- Does this touch payment processing or PII?
- Are Server Actions properly validating inputs? (see [[Security Review Prompt]])

**4. Operational Risks**
- Can this be rolled back if it fails?
- What monitoring/alerting gaps exist?
- Are there deployment sequence dependencies?
- What happens if a dependency goes down?
- Is there a graceful degradation path?

**5. Scope Risks**
- Is the scope well-defined or likely to creep?
- Are there ambiguous requirements?
- What stakeholder assumptions haven't been validated?
- Does this feature have "one more thing" risk (unbounded iteration)?

**6. Data Risks**
- Are there migration risks (data loss, corruption, rollback difficulty)?
- Does this change data schemas consumed by other services?
- Are there data consistency risks during deployment?
- GDPR/privacy implications of new data collection?

### Risk Scoring Matrix

Rate each risk on two axes (1-5 scale):

**Likelihood**: 1=Rare, 2=Unlikely, 3=Possible, 4=Likely, 5=Almost Certain
**Impact**: 1=Negligible, 2=Minor, 3=Moderate, 4=Major, 5=Critical

| Score Range | Level | Action Required |
|-------------|-------|-----------------|
| 16-25 | **Critical** (Red) | Must mitigate before proceeding |
| 10-15 | **High** (Orange) | Mitigation plan required in sprint |
| 5-9 | **Medium** (Yellow) | Monitor, mitigate if low-cost |
| 1-4 | **Low** (Green) | Accept and monitor |

### For each risk identified, provide:
- **Risk Score**: Likelihood (1-5) x Impact (1-5) = Score
- **Mitigation**: Specific action to reduce the risk
- **Detection**: How we'll know if this risk materializes
- **Owner**: Who is responsible for the mitigation
- **Contingency**: What we do if the risk occurs despite mitigation

### Output format:

| Risk | L | I | Score | Level | Mitigation | Detection |
|------|---|---|-------|-------|------------|-----------|
| ... | 4 | 5 | 20 | Critical | ... | ... |
| ... | 3 | 3 | 9 | Medium | ... | ... |

Top 3 risks highlighted for immediate attention, with specific action items and owners assigned.
