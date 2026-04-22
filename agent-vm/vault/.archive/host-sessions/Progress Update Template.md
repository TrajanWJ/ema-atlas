# Progress Update Template

Sources: [sdi2200262/agentic-project-management](https://github.com/sdi2200262/agentic-project-management), [tayyabakmal1/qa-prompt-library](https://github.com/tayyabakmal1/qa-prompt-library)

**When to use**: Mid-sprint check-ins, status updates, or when resuming work after a break.

---

## Template

```markdown
# Progress: [Project/Feature] — YYYY-MM-DD

## Overall Status: On Track | At Risk | Blocked

**Project**: [[Project Name]]
**Milestone**: [current milestone or sprint name]
**Target Date**: [if applicable]

## Phase Progress
| Phase | Status | % Complete | Blockers |
|-------|--------|------------|----------|
| Phase 1: Foundation | Complete | 100% | None |
| Phase 2: Core Logic | In Progress | 60% | None |
| Phase 3: Integration | Not Started | 0% | Waiting on Phase 2 |
| Phase 4: Polish | Not Started | 0% | Waiting on Phase 3 |

## Milestone Tracking

<!-- Update this section each progress update to show trajectory -->
| Date | Milestone | Status | Notes |
|------|-----------|--------|-------|
| YYYY-MM-DD | MVP feature set | Planned | — |
| YYYY-MM-DD | Internal demo | Planned | — |
| YYYY-MM-DD | Beta release | Planned | — |

## Completed Since Last Update
- [x] [Task 1] — [PR link or file paths]
- [x] [Task 2] — [PR link or file paths]

## Currently Working On
- [ ] [Task 3] — [expected completion]
- [ ] [Task 4] — [expected completion]

## Blocked Items

| Item | Blocker | Type | Owner | Since | Escalation |
|------|---------|------|-------|-------|------------|
| ... | ... | Technical / External / Decision | ... | YYYY-MM-DD | [who to escalate to] |

### Blocker Escalation Format
> **BLOCKED**: [Item] has been blocked for [N days] by [blocker].
> **Impact**: [what can't proceed until resolved].
> **Ask**: [specific action needed from specific person].
> **Workaround**: [temporary alternative, if any].

## Dependencies & External Waits

| Dependency | Type | Status | Expected Resolution | Fallback |
|-----------|------|--------|-------------------|----------|
| [API access] | External | Waiting | YYYY-MM-DD | [mock data] |
| [Design specs] | Internal | In Review | YYYY-MM-DD | [build placeholder UI] |
| [Package release] | Open Source | PR merged, unreleased | [unknown] | [pin to commit hash] |

## Risks Identified
| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| ... | Low/Med/High | Low/Med/High | ... |

## Quality Metrics
- Test coverage: [X%]
- Open bugs: [count by severity]
- Code review status: [all reviewed / pending]

## Next Priorities
1. [Most important next task]
2. [Second priority]
3. [Third priority]

## Needs From Human
- [Decision needed]
- [Access or permissions needed]
- [Clarification needed]

## Tags
#progress #[project-name] #[phase]
<!-- QMD keywords: [project name, feature names, technologies involved] -->
```

---

## Tips for Effective Progress Updates

1. **Link to the project note**: Always include `[[Project Name]]` so QMD can connect updates to the project
2. **Be specific about blockers**: "Waiting on API" is less useful than "Waiting on Stripe webhook signing secret from DevOps (asked 2026-03-09)"
3. **Track velocity**: If you have multiple progress updates, comparing completed items across updates shows pace
4. **Escalation threshold**: If a blocker persists across 2+ progress updates, use the escalation format
