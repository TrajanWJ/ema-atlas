# Discovery Log Template

Sources: [mitsuhiko/agent-prompts](https://github.com/mitsuhiko/agent-prompts), [Comfy-Org/comfy-claude-prompt-library](https://github.com/Comfy-Org/comfy-claude-prompt-library), [sdi2200262/agentic-project-management](https://github.com/sdi2200262/agentic-project-management)

**When to use**: After research sessions, codebase exploration, technology evaluation, or any session where new knowledge was gained.

---

## Template

```markdown
# Discovery: [Topic] — YYYY-MM-DD

## Category
<!-- Pick one primary category -->
- **Type**: Tool | Pattern | Gotcha | Optimization | Integration | Architecture | Workflow

## Research Question
What were we trying to find out?

## Sources Consulted
- [Source 1]: [URL or file path] — [reliability assessment]
- [Source 2]: [URL or file path] — [reliability assessment]
- [Source 3]: [URL or file path] — [reliability assessment]

## Key Findings

### Finding 1: [Title]
**Evidence**: [What we found]
**Confidence**: High / Medium / Low
**Implication**: [What this means for our work]

### Finding 2: [Title]
**Evidence**: [What we found]
**Confidence**: High / Medium / Low
**Implication**: [What this means for our work]

### Finding 3: [Title]
**Evidence**: [What we found]
**Confidence**: High / Medium / Low
**Implication**: [What this means for our work]

## Conflicts or Contradictions
- [Where sources disagreed and how we resolved it]

## Gaps
- [What we still don't know]
- [What needs further investigation]

## Actionable Conclusions
1. [Specific action to take based on findings]
2. [Specific action to take based on findings]

## Action Items

| Action | Target Note | Priority | Done? |
|--------|------------|----------|-------|
| Update convention | [[Convention Name]] | High/Med/Low | [ ] |
| Create new note | [proposed title] | High/Med/Low | [ ] |
| Modify workflow | [[Workflow Name]] | High/Med/Low | [ ] |
| Add to stack decisions | [[My Stack Decisions]] | High/Med/Low | [ ] |
| Create ADR | ADR-NNNN | High/Med/Low | [ ] |

## Related Notes
- [[linked note 1]]
- [[linked note 2]]

## Tags
#discovery #[category] #[domain] #[project]
<!-- QMD keywords: [terms for future searchability] -->
<!-- Example: QMD keywords: websocket, real-time, polling alternative, SSE comparison -->
```

---

## Category Guide

| Category | When to Use | Example |
|----------|------------|---------|
| **Tool** | Found a new tool, library, or plugin | "Discovered Turborepo for monorepo builds" |
| **Pattern** | Learned a design pattern or best practice | "React Server Components data fetching pattern" |
| **Gotcha** | Hit a bug, limitation, or undocumented behavior | "Zustand persist middleware loses Date objects" |
| **Optimization** | Found a performance improvement technique | "QMD chunking reduces token usage by 80%" |
| **Integration** | Learned how two tools connect | "Obsidian MCP bridge + Claude Code vault access" |
| **Architecture** | Discovered architectural insight | "Event sourcing vs CRUD for audit trails" |
| **Workflow** | Found a better way to work | "TDD with Vitest watch mode + Superpowers" |

## QMD Discoverability

Discoveries are among the most-searched session log types. Maximize findability:

1. **Title the finding, not the session**: "WebSocket Gotchas in Next.js" not "Research Session"
2. **Use category tags**: `#gotcha`, `#pattern`, `#tool-discovery`
3. **Add QMD keywords**: Include synonyms and related terms someone might search
4. **Link to the decision it influenced**: If this discovery led to an ADR, link it
