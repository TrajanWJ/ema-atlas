# Session Summary Template

Sources: [sdi2200262/agentic-project-management](https://github.com/sdi2200262/agentic-project-management), [affaan-m/everything-claude-code](https://github.com/affaan-m/everything-claude-code), [Comfy-Org/comfy-claude-prompt-library](https://github.com/Comfy-Org/comfy-claude-prompt-library), [GitHub Copilot Memory System](https://github.blog/ai-and-ml/github-copilot/building-an-agentic-memory-system-for-github-copilot/)

**When to use**: End of every working session. Captures state for future session continuity.

---

## Format Options

Use **Compact** for short sessions (< 30 min, minor changes). Use **Verbose** (full template) for substantial sessions.

### Compact Format

```markdown
# Session: YYYY-MM-DD — [Brief Title]
**Project**: [name] | **Duration**: ~Xm | **Tokens**: ~Xk in / ~Xk out
**Did**: [1-2 sentence summary of what was accomplished]
**Decided**: [key decision, if any]
**Next**: [immediate next action]
**Tags**: #session #project-name #domain-tag
```

### Verbose Format (Full Template)

```markdown
# Session: YYYY-MM-DD — [Brief Title]

## Status
- **Project**: [[Project Name]]
- **Phase**: [current phase]
- **Duration**: [approximate time]
- **Context resets**: [number of /clear or compactions]

## Token Usage
- **Input tokens**: ~[X]k
- **Output tokens**: ~[X]k
- **Cache reads**: ~[X]k
- **Cost estimate**: ~$[X.XX]
- **Compactions**: [count] (context preserved? yes/no)

## What Was Accomplished
- [Concrete deliverable 1 — file paths changed]
- [Concrete deliverable 2 — file paths changed]
- [Concrete deliverable 3 — file paths changed]

## Decisions Made
| Decision | Rationale | Reversible? |
|----------|-----------|-------------|
| ... | ... | Yes/No |

> For significant decisions, create a separate [[Decision Record Template|ADR]].

## Issues Encountered
- [Issue 1]: [Resolution or current status]
- [Issue 2]: [Resolution or current status]

## Key Files Modified
- `path/to/file1` — [what changed]
- `path/to/file2` — [what changed]

## Conventions Applied
- [[Coding Standards]] — [which rules were relevant]
- [[Testing Philosophy]] — [if tests were written]
- [[Git Workflow Standards]] — [if commits/PRs were made]

## Next Session: Immediate Actions
1. [First thing to do next session]
2. [Second priority]
3. [Third priority]

## Open Questions
- [Question needing human input]
- [Question needing research]

## Learnings to Capture
- [Pattern discovered — update relevant convention note?]
- [Tool capability learned]
- [Codebase knowledge gained]

## Memory Log Flags
- important_findings: [true/false]
- compatibility_issues: [true/false]
- blocked_items: [list or none]

## QMD Search Tags
#session #[project-name] #[domain] #[technology]
<!-- QMD keywords: [comma-separated terms a future session might search for] -->
<!-- Example: QMD keywords: auth, zustand, state management, login flow -->
```

---

## QMD Discoverability Tips

Future sessions find past sessions via QMD search. To maximize recall:

1. **Use specific tags**: `#auth`, `#database`, `#deployment` not just `#session`
2. **Add QMD keywords**: HTML comments with terms someone might search for
3. **Name files descriptively**: `2026-03-11 - Auth Flow with Zustand.md` not `2026-03-11 - Session.md`
4. **Link to project notes**: `[[ExecuDeck]]` creates graph connections QMD can traverse
5. **Cross-reference decisions**: Link to ADRs so searches for the decision find the session
