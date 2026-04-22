# Workflows

> How I use Obsidian + Claude Code together. All workflows are **heavily TBD**.

---

## Workflow Dependency Diagram

```
                    ┌─────────────────────┐
                    │  Goal Cascade        │
                    │  (vision → daily)    │
                    └────────┬────────────┘
                             │ surfaces daily priorities
                             ▼
┌──────────────────┐   ┌─────────────────────┐
│  New Project     │──>│  Daily Development   │
│  Setup           │   │  (morning → evening) │
└──────────────────┘   └────┬───────────┬────┘
  creates project note      │           │
  & CLAUDE.md               │           │
                            │           │
              needs research│           │ produces sessions
                            ▼           ▼
                 ┌──────────────┐  ┌─────────────────┐
                 │  Research to │  │  Session Memory  │
                 │  Implement.  │  │  (capture+index) │
                 │  (5 phases)  │  └────────┬────────┘
                 └──────┬──────┘           │
                        │                  │ feeds back into
                        │ discoveries      │ next session
                        ▼                  ▼
                 ┌──────────────────────────────┐
                 │  Knowledge Growth             │
                 │  (discover → note → integrate)│
                 └──────────────────────────────┘
```

## Cross-References

| Workflow | Depends On | Feeds Into |
|----------|-----------|------------|
| [[Workflow - Goal Cascade]] | obsidian-claude-pkm | [[Workflow - Daily Development\|Daily Development]] |
| [[Workflow - New Project Setup]] | [[My Stack Decisions]] | [[Workflow - Daily Development\|Daily Development]] |
| [[Workflow - Daily Development]] | All other workflows | [[Workflow - Session Memory\|Session Memory]] |
| [[Workflow - Research to Implementation]] | [[Workflow - Knowledge Growth\|Knowledge Growth]] | [[Workflow - Knowledge Growth\|Knowledge Growth]], ADRs |
| [[Workflow - Session Memory]] | QMD, sync-claude-sessions, claude-mem | [[Workflow - Daily Development\|Daily Development]] (next session) |
| [[Workflow - Knowledge Growth]] | Vault conventions, MOC files | All workflows (via vault notes) |

---

## Project Workflows

| Workflow | Status |
|---|---|
| [[Workflow - New Project Setup]] | TBD |
| [[Workflow - Daily Development]] | TBD |
| [[Workflow - Research to Implementation]] | TBD |

## Knowledge Workflows

| Workflow | Status |
|---|---|
| [[Workflow - Knowledge Growth]] | TBD |
| [[Workflow - Session Memory]] | TBD |

## Review Workflows

| Workflow | Status |
|---|---|
| [[Workflow - Goal Cascade]] | TBD |

#workflows #tbd
