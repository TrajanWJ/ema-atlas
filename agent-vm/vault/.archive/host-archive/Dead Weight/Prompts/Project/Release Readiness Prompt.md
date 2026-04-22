# Release Readiness Prompt

Sources: [tayyabakmal1/qa-prompt-library](https://github.com/tayyabakmal1/qa-prompt-library), [Comfy-Org/comfy-claude-prompt-library](https://github.com/Comfy-Org/comfy-claude-prompt-library), [trailofbits/claude-code-config](https://github.com/trailofbits/claude-code-config), [Octopus Deploy Deployment Checklist](https://octopus.com/devops/software-deployments/deployment-checklist/)

**When to use**: Before cutting a release. Before deploying to production. As a final quality gate.

---

## Prompt

Perform a comprehensive release readiness assessment for the following release.

**Release**: `[version or description]`
**Changes included**: `[PR list, changelog, or commit range]`

### Code Quality Gate
- [ ] All tests passing (unit, integration, E2E)
- [ ] Test coverage at or above 80%
- [ ] No CRITICAL or HIGH severity issues open
- [ ] All code reviewed and approved
- [ ] Linters and type checkers pass with zero warnings
- [ ] No TODO/FIXME items in changed files (or tracked as issues)
- [ ] No `console.log` or debug code in production paths

### Security Gate
- [ ] Dependency audit clean (no known HIGH/CRITICAL CVEs)
- [ ] No hardcoded secrets in codebase
- [ ] OWASP Top 10:2025 checklist reviewed for changed areas
- [ ] Security review completed for auth/input/API changes
- [ ] Supply chain verified (pinned deps, lock file current)
- [ ] Security headers configured (CSP, HSTS, X-Frame-Options)
- [ ] Environment variables validated (no missing required vars)

### Performance Gate
- [ ] No performance regressions (benchmarks compared)
- [ ] Database queries optimized (no N+1, all indexed)
- [ ] Bundle size within limits (frontend)
- [ ] Load tested at expected scale
- [ ] Core Web Vitals within targets (LCP < 2.5s, INP < 200ms, CLS < 0.1)

### Documentation Gate
- [ ] API documentation updated
- [ ] CHANGELOG updated
- [ ] Migration guide written (if breaking changes)
- [ ] README reflects current state
- [ ] Environment variable documentation updated

### Deployment Checklist

**Pre-deployment:**
- [ ] Database migrations tested (forward AND backward)
- [ ] Feature flags configured (if gradual rollout)
- [ ] Environment variables set in production
- [ ] Deployment branch matches expected state
- [ ] Notify stakeholders of deployment window

**During deployment:**
- [ ] Run database migrations first (if any)
- [ ] Deploy application
- [ ] Verify health check endpoint responds
- [ ] Smoke test critical user paths
- [ ] Monitor error rates for first 15 minutes

**Post-deployment verification:**
- [ ] All health checks green
- [ ] Error rate stable (not increasing vs. pre-deploy baseline)
- [ ] Key user flows working (login, primary features, payments if applicable)
- [ ] Performance metrics within normal range
- [ ] No unexpected log patterns

### Rollback Plan

Every deployment must have a tested rollback plan before proceeding.

```
Rollback Trigger Thresholds:
- Error rate increase > 5% over baseline → investigate
- Error rate increase > 10% over baseline → rollback
- Any CRITICAL error in new code paths → immediate rollback
- P50 latency increase > 50% → investigate
- Any data integrity issue → immediate rollback

Rollback Steps:
1. [ ] Revert to previous deployment version
2. [ ] Run backward database migration (if migration was deployed)
3. [ ] Verify rollback successful (health checks, smoke tests)
4. [ ] Notify stakeholders
5. [ ] Create incident report

Rollback Owner: [name]
Rollback ETA: [expected time to complete rollback]
Data considerations: [any data created between deploy and rollback]
```

### Monitoring Verification

Confirm these monitoring capabilities exist for the new release:

| Monitor | Tool | Alert Threshold |
|---------|------|-----------------|
| Error rate | Sentry / logging | > 1% of requests |
| Response time | APM / metrics | p95 > 2x baseline |
| Uptime | Health check | Any failure |
| Database performance | Query monitoring | Slow query > 1s |
| Resource usage | Infrastructure metrics | CPU > 80%, Memory > 85% |
| Business metrics | Analytics | Conversion drop > 10% |

### Validation Scans
Run all validation scans:
- Accessibility audit (`npx lighthouse --only-categories=accessibility`)
- Dead code detection (`npx depcheck`)
- Dependency freshness check (`pnpm audit`)
- Performance benchmark comparison
- Build size comparison vs. previous release

### Release Decision
Based on gate results:
- **GO**: All gates pass, rollback plan tested
- **CONDITIONAL GO**: Minor issues tracked, no blockers, rollback plan ready
- **NO GO**: Critical issues found — list blockers and remediation plan with timeline
