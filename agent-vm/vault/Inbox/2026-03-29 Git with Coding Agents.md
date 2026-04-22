---
type: auto-captured
source: session-transcript
captured: 2026-03-29T23:15:00Z
session: transcript-scanner
tags: [git, coding-agents, claude-code, workflow, simon-willison]
score: 3
---

# Git with Coding Agents — Practical Guide

## Source
Simon Willison's practical guide on using Git effectively with AI coding agents.

## Why This Matters
Trajan runs Claude Code / coding agents extensively on the agent-vm and via host-claude. Git discipline with agents is a real operational concern — agents can create messy histories, forget to commit, or clobber work.

## Key Practices (Simon Willison's recommendations)

### Commit Frequently
- Ask the agent to commit after each logical step, not just at the end
- Small commits make it easy to `git bisect` or `git revert` when agent output goes wrong

### Use Branches
- Always work on a feature branch, never directly on main
- If the agent goes off the rails, `git checkout main` and start over cheaply

### Review Diffs Before Accepting
- `git diff` before every commit — don't just accept the agent's summary
- Agents often touch files they weren't asked to, especially config and test files

### Stash as a Checkpoint
- `git stash` before giving a risky instruction; `git stash pop` or `git stash drop` after evaluating the result

### Meaningful Commit Messages
- Instruct the agent to write descriptive commit messages, not "update files"
- The commit history becomes a log of what the agent actually did

### `.gitignore` Before Agents Touch Anything
- Ensure `.gitignore` is solid before starting — agents sometimes add build artifacts, `.env` files, etc.

## Relevance to This Setup

| Pattern | Applies To |
|---|---|
| Branch per task | All host-claude coding tasks |
| Commit after each step | Instruct coding agents in task prompts |
| Review diffs | Right Hand should request `git diff` output from coder agents before marking complete |
| Stash checkpoints | Before risky refactors or agent experiments |

## Related
- [[TOOLS.md]] — host-claude routing
- [[AGENTS.md]] — coder agent dispatch
- [[vault/Trajan/Preferences.md]] — coding workflow preferences

## Follow-Up
- Consider adding "commit after each logical step" to the default coder agent task template in AGENTS.md
- Simon Willison's post: https://simonwillison.net/2025/Mar/12/coding-agents-git/ (verify URL)
