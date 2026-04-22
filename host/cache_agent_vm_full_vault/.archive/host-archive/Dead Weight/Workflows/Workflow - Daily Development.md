# Workflow: Daily Development

Morning start through work through end-of-day session log.

---

## Morning Start (10 min)

### 1. Orient in Obsidian
- [ ] Open Obsidian
- [ ] Run `/daily` (obsidian-claude-pkm) — surfaces ONE Big Thing for the day and active projects
- [ ] Review project note in `Trajan's Projects/` for current phase and blockers
- [ ] Check yesterday's session log in `Session Log/` for handover notes

### 2. Open Development Environment
```bash
cd ~/Desktop/Coding/Projects/[active-project]
claude
```
Claude automatically reads:
- Project `CLAUDE.md` (local conventions, commands, architecture)
- Obsidian vault via MCP bridge on port 22360 (decisions, research, standards)
- `.claude/agents/` for any project-specific subagents

### 3. Context Recovery
If continuing from a previous session:
```
Read the most recent session log for [project name] and pick up
where we left off. Check the handover notes for next steps.
```
If starting fresh work:
```
Review the implementation plan in docs/superpowers/plans/ and
identify the next unfinished phase.
```

## Development Session

### Working Loop
```
┌─────────────────────────────────────────┐
│  Pick task from plan / daily note        │
│         ↓                                │
│  Write failing test (TDD)                │
│         ↓                                │
│  Implement minimum to pass               │
│         ↓                                │
│  Refactor for quality                    │
│         ↓                                │
│  Commit atomically                       │
│         ↓                                │
│  Next task or review checkpoint          │
└─────────────────────────────────────────┘
```

### Tools Available During Session

| Tool | Purpose | When |
|---|---|---|
| `superpowers:brainstorming` | Design exploration | Before implementation, when approach is unclear |
| `superpowers:writing-plans` | Create implementation plan | Before multi-step work |
| `superpowers:test-driven-development` | TDD workflow | Every coding task |
| `superpowers:systematic-debugging` | Debug stuck issues | After 2 failed fix attempts |
| `superpowers:verification-before-completion` | Final check | Before marking any task done |
| QMD search | Find past decisions/sessions | When a related topic was discussed before |
| Context7 MCP | Library documentation | When using an unfamiliar API |
| CodeGraphContext MCP | Code relationship analysis | When understanding dependencies |

### Forced Agent Dispatches (mandatory)

These fire automatically per `~/.claude/CLAUDE.md`. Agent definitions: `~/.claude/agents/`.

| When | Agent Dispatched | What Happens |
|------|-----------------|-------------|
| After writing/modifying code | `code-reviewer` | Reviews diff against Coding Standards + Security Standards |
| Test failure or error | `debugger` | 4-phase root cause analysis, checks Learnings & Gotchas |
| Architecture/design decision needed | `architect` | Evaluates 2-3 options, creates ADR in Session Log |
| Before multi-step feature work | `planner` | Fibonacci-sized phases, critical path identified |
| Code touches auth/secrets/APIs | `security-auditor` | OWASP Top 10 audit, must pass before commit |
| Evaluating tools or libraries | `researcher` | Checks vault AI Knowledge first, then npm/GitHub/Context7 |
| Session ending | `vault-optimizer` | Cross-references, gap detection, session log compliance |

**How to dispatch:** `Agent(subagent_type="general-purpose", prompt="Read ~/.claude/agents/[name].md for your instructions. [context]")`

### Decision Points During Work

**Need architecture decision?**
→ Dispatch `architect` agent → creates ADR in Session Log

**Need to research unfamiliar tool/library?**
→ Dispatch `researcher` agent → checks vault first, then external sources

**Need to evaluate multiple approaches?**
→ Use `superpowers:brainstorming`, then dispatch `architect` for the design decision

**Hit a bug that won't resolve?**
→ Dispatch `debugger` agent → 4-phase analysis. If fix takes >5 min, gotcha captured automatically.

### Review Checkpoints
After each phase completion or significant change, the `code-reviewer` agent dispatch is mandatory (see table above). For full orchestrated reviews: `/orchestrate review [description]`.

### Multi-Project Days
If working on more than one project:
1. Complete current task to a stable stopping point
2. Commit and push current project
3. Create a brief handover note in the session log
4. Switch project directory
5. Start new Claude Code session (separate context)

## Session End (10 min)

### 1. Review and Commit
```bash
git status                    # What's uncommitted?
git diff                      # Review changes
git add [specific files]      # Stage intentionally
git commit -m "descriptive message"
```

### 2. Create Session Log
Create a session summary in `Session Log/` using [[Session Summary Template]]:
- File name: `YYYY-MM-DD - Brief Title.md`
- What was accomplished
- Decisions made
- Blockers or open questions
- Next steps (handover for tomorrow)

### 3. Update Project Note
Update the project note in `Trajan's Projects/`:
- [ ] Check off completed tasks in phase checklist
- [ ] Add entry to Development Log table
- [ ] Note any new blockers or decisions

### 4. Index for Future Sessions
```bash
# Sync session exports for QMD indexing
# sync-claude-sessions handles this automatically via SessionEnd hook
# Verify QMD has indexed:
qmd search "[today's project topic]"
```

### 5. Evening Reflection (optional)
- [ ] Run `/daily` evening mode — summarizes what got attention today
- [ ] Note any blockers or decisions needed for tomorrow in the daily note
- [ ] If a milestone was hit, update the phase checklist in the project note

## Quick Reference: Daily Commands

```bash
# Morning
cd ~/Desktop/Coding/Projects/[project]
claude

# During work
git add [files] && git commit -m "message"   # Atomic commits

# End of day
qmd search "topic"                            # Verify indexing
```

## See Also

- [[Workflows MOC]]
- [[Workflow - Session Memory]] — how session logs create cross-session context
- [[Workflow - Goal Cascade]] — connecting daily work to bigger goals
- [[Workflow - Research to Implementation]] — when daily work hits a research need

#workflow #daily #development
