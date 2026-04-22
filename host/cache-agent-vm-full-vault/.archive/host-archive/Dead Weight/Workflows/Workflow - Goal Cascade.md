# Workflow: Goal Cascade

Connecting 3-year vision to daily tasks using obsidian-claude-pkm goal cascading.

---

## The Cascade

```
3-Year Vision
    ↓
Yearly Goals (3-5 major outcomes)
    ↓
Projects (each linked to a yearly goal)
    ↓
Monthly Milestones (measurable checkpoints)
    ↓
Weekly Plan (concrete deliverables)
    ↓
Daily Tasks (today's ONE Big Thing)
```

## Setup (One-Time)

### 1. Install obsidian-claude-pkm
```bash
# Clone the repo
git clone https://github.com/kepano/obsidian-claude-pkm.git
# Follow install instructions for Claude Code skill integration
```

### 2. Adopt existing vault
```
/adopt
```
This scans the existing vault structure and maps it for the PKM system.

### 3. Onboard with personal context
```
/onboard
```
Configure:
- Name and preferences
- Weekly review day (e.g., Sunday)
- 3-year vision statement
- Yearly goals (3-5)

### 4. Create initial goal files
The onboarding process creates:
- `Goals/3-Year Vision.md` — long-term direction
- `Goals/YYYY Goals.md` — this year's goals
- `Goals/Projects/` — project notes linked to goals

### 5. Link existing projects
Connect existing project notes to goals:
- [ ] [[ExecuDeck]] → linked to relevant yearly goal
- [ ] Future projects → created via `/project` command

## Daily Cadence

### Morning (5 min)
```
/daily
```
This surfaces:
- **ONE Big Thing** — the most important task for today
- **Active projects** — status from project notes
- **Incomplete tasks** — carried from yesterday
- **Calendar context** — meetings or deadlines

Use this to set intention before opening Claude Code for development.

### During Work
Development work happens through [[Workflow - Daily Development]]. The goal cascade provides direction:
- Each coding task should connect to a project
- Each project connects to a yearly goal
- If work doesn't connect to a goal, question whether it should be done now

### Evening (5 min, optional)
```
/daily evening
```
This captures:
- What actually got attention today
- Whether the ONE Big Thing was completed
- Blockers or decisions needed for tomorrow
- Quick reflection on the day

## Weekly Review

### Run the review (30 min)
```
/weekly
```

### The Collect-Reflect-Plan cycle:

**Collect (10 min)**
- [ ] Review all session logs from the week in `Session Log/`
- [ ] Check project notes for phase progress updates
- [ ] Note any decisions made (ADRs created this week)
- [ ] Capture any loose threads or open questions

**Reflect (10 min)**
- [ ] Which projects got attention? Which were neglected?
- [ ] Are projects still aligned with yearly goals?
- [ ] Any projects that should be paused, dropped, or re-prioritized?
- [ ] What worked well this week? What didn't?

**Plan (10 min)**
- [ ] Set ONE Big Thing for next week
- [ ] Assign specific project phases to specific days (roughly)
- [ ] Identify any research or decisions needed before implementation
- [ ] Update project notes with planned next steps

## Monthly Check

### Run the review (45 min)
```
/monthly
```

**Quarterly milestone check:**
- [ ] Review yearly goals — on track, behind, or ahead?
- [ ] Check each project's phase progress against timeline
- [ ] Are the right projects active? Reprioritize if needed
- [ ] Update `Goals/YYYY Goals.md` with progress notes

**Vault maintenance** (see [[Workflow - Knowledge Growth]]):
- [ ] Audit vault for outdated notes
- [ ] Archive stale content
- [ ] Update tool status fields

## Integration with Development Workflow

### How goals connect to code

```
Yearly Goal: "Ship ExecuDeck v1.0"
    ↓
Project: [[ExecuDeck]]
    ↓
Phase: "Phase 2 — Core Command System"
    ↓
Weekly Plan: "Implement command palette this week"
    ↓
Daily Task: "Build CommandPalette component with Ctrl+K toggle"
    ↓
Claude Code session → TDD → commit → session log
```

### Commands Reference

| Cadence | Command | What It Does | Time |
|---|---|---|---|
| Daily | `/daily` | Morning planning + evening reflection | 5 min |
| Weekly | `/weekly` | Collect/Reflect/Plan cycle | 30 min |
| Monthly | `/monthly` | Quarterly milestone check | 45 min |
| On demand | `/project` | Create/track a goal-linked project | 10 min |
| Smart | `/review` | Routes to daily/weekly/monthly by context | varies |

### Goal-Aligner Agent
The goal-aligner audits whether current work aligns with stated goals:
```
/review alignment
```
This checks:
- Are active projects linked to yearly goals?
- Is time distribution matching priority order?
- Are any goals getting zero attention?

## Creating a New Goal-Linked Project

```
/project
```

This creates a project note that:
1. Links to a specific yearly goal
2. Defines measurable milestones
3. Breaks into phases
4. Connects to the weekly review cycle

Then follow [[Workflow - New Project Setup]] to create the code project and CLAUDE.md.

## Goal Cascade Checklist

### Initial Setup
- [ ] obsidian-claude-pkm installed
- [ ] `/adopt` run on existing vault
- [ ] `/onboard` completed with vision and goals
- [ ] Existing projects linked to goals
- [ ] Weekly review day configured

### Ongoing Habits
- [ ] `/daily` every morning before coding
- [ ] Session logs created at end of each work day
- [ ] `/weekly` review on designated day
- [ ] `/monthly` review at month boundaries
- [ ] Project notes updated as phases complete

## See Also

- [[Workflows MOC]]
- [[obsidian-claude-pkm]] — the PKM skill system powering the cascade
- [[Workflow - Daily Development]] — daily coding loop
- [[Workflow - Session Memory]] — how sessions feed the cascade
- [[My Stack Decisions]] — where project-level technology decisions live

#workflow #goals #pkm
