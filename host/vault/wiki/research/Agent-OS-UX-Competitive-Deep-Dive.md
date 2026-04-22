---
type: research
wiki_id: research/Agent-OS-UX-Competitive-Deep-Dive
imported_from: vault/Research/Agent-OS-UX-Competitive-Deep-Dive.md
imported_at: '2026-04-04T00:23:57.000Z'
tags: []
summary: ''
---
# Agent OS UX — Competitive Deep Dive

> Research date: 2026-03-20 | Source: Training knowledge through early 2025
> Purpose: Inform Agent OS page redesign (Proposals, Missions, Dashboard)

---

## 1. Product → Concept Mapping

How each product maps to our core Agent OS concepts:

| Product | Ideas/Proposals | Planned Work | Active Execution | Goals/Strategy | Recurring Work | Agent/Automation | Attention/Triage |
|---|---|---|---|---|---|---|---|
| **Linear** | Triage bucket (unsorted inbox) | Backlog → Cycle | "In Progress" with assignee + cycle | Projects (cross-team, long-lived) + Roadmaps | Recurring issues via templates/API | SLA automations, auto-close stale | Triage queue is first-class; "My Issues" filtered view |
| **Height** | "New" status; AI auto-categorizes | AI suggests priority + sprint placement | Smart lists auto-surface blocked/active | Goals (beta) linked to tasks | AI detects recurring patterns | AI is a first-class teammate: labels, estimates, dedupes | AI-generated "needs attention" feed |
| **Shortcut** | Epics as containers for ideas | Stories in "Unstarted" → "Ready" | Stories in "Started" states | Epics → Milestones (time-boxed) | Recurring stories via iteration templates | Limited — webhook integrations only | Milestones as attention anchors |
| **Notion** | Database items with "Idea" status | Sprint database, status = "Planned" | Status = "In Progress", sub-tasks | OKRs database → linked to projects → tasks | Recurring templates, database templates | Notion AI summarizes; automations via buttons | @mentions, reminders, rollup counts |
| **Plane** | Inbox (external + internal proposals) | Backlog → Cycle assignment | "In Progress" in active cycle | Modules (thematic grouping across cycles) | Cycle templates | Limited — GitHub sync | Inbox as triage; notification center |
| **Graphite** | Draft PRs / RFC docs | Review queue (stacked) | Active review + merge queue | Trunk health dashboard | CI/CD pipelines (implicit) | Merge queue bot, auto-rebase | Review queue badges, "your turn" indicators |
| **Raycast** | Extensions store / community scripts | Pinned commands, quicklinks | Active command execution | N/A | Scheduled scripts, snippets | Extensions run autonomously | Floating window, hotkey activation |
| **Arc** | "Easel" / notes for ideas | Pinned tabs in Spaces | Active Space = active context | Spaces as project contexts | Auto-archive (12h default) | "Boost" injects custom CSS/JS | Sidebar organization, Space switching |
| **Obsidian** | Notes with `#idea` tag | Dataview queries filter by status | Canvas nodes with connections | MOCs (Maps of Content) | Templater periodic notes | Dataview auto-generates views | Starred notes, daily note links |
| **Retool/Airplane** | Internal request forms | Workflow queue, approval states | Running jobs dashboard | N/A | Scheduled workflows (cron) | Workflows = automation-first | Admin dashboard, alert banners |

---

## 2. Answering the Specific Questions

### Q1: How do the best tools distinguish "proposals/ideas" vs "planned work" vs "active execution"?

**Linear's approach (best-in-class):**
- **Triage** is a literal inbox. Issues land there with no cycle, no project, no priority. They're undifferentiated signal.
- Moving from Triage → Backlog = "acknowledged, will do eventually"
- Moving from Backlog → Cycle = "planned for this period"
- Starting work in a Cycle = "active execution"
- Key insight: **Triage is not a status — it's a location.** It's spatially separated from "real work."

**Height's approach (AI-native):**
- Tasks enter as "New" and AI immediately suggests categorization, priority, and sprint
- The human reviews AI suggestions rather than doing manual triage
- Key insight: **The triage step is automated, and the human's role shifts from "sort" to "approve/reject AI's sorting."**

**Plane's approach (inbox model):**
- Has a literal "Inbox" feature — anyone (including external users) can submit issues
- Inbox items aren't issues yet. They become issues when accepted.
- Key insight: **Proposals and issues are different object types.** A proposal must be explicitly promoted to become work.

**Synthesis for Agent OS:**
> The best pattern is **Plane's object-type separation** combined with **Height's AI pre-sorting**: Proposals are NOT tasks. They're a different entity that gets promoted. But our AI (the proposal engine) should pre-sort, pre-prioritize, and pre-plan them so the human just approves/rejects/edits.

### Q2: Best way to show a pipeline/funnel (idea → triage → plan → execute → done)?

**Patterns observed:**

| Pattern | Used By | Strengths | Weaknesses |
|---|---|---|---|
| **Kanban board** | Linear, Shortcut, Plane, Notion | Familiar, spatial, drag-to-advance | Gets cluttered; every column visible at once |
| **List with status badges** | Linear (default view), Height | Dense, scannable, good for large volumes | Less visual momentum |
| **Timeline/Gantt** | Notion, Shortcut (milestones) | Shows time dimension | Overkill for idea-stage items |
| **Inbox → Board** | Plane, Linear (triage) | Clear separation of "unsorted" from "sorted" | Two different UIs for one flow |
| **Stacked/Queued** | Graphite (PR stack) | Clear ordering, "what's next" is obvious | Only works for sequential flows |

**Best pattern for Agent OS:**
> A **horizontal pipeline visualization** (like a sales funnel or CI/CD pipeline) where:
> - Each stage shows a count badge
> - Items flow left-to-right
> - The leftmost stage (Proposals) is clearly "unprocessed input"
> - The current focus stage is visually expanded
> - Clicking a stage shows its items
>
> Think: **GitHub Actions pipeline view** meets **Linear's triage model**. The pipeline itself is the navigation, not just a kanban column.

### Q3: How do competitors show agent/automation activity alongside human work?

**This is where competitors are weakest.** Most tools treat automation as invisible plumbing:

- **Linear:** Automations run silently. You see results (issue moved, label added) but not "the automation is thinking."
- **Height:** Best-in-class here. AI actions appear as activity feed items with an AI avatar. "Height AI set priority to Urgent." "Height AI linked duplicate #432." The AI is a visible teammate.
- **Notion:** Notion AI generates content inline but doesn't act on project structure autonomously.
- **Retool/Airplane:** Workflow runs have a visible execution log — you can see each step, its status, timing, and output. **This is the best model for showing agent execution.**
- **GitHub Actions:** Workflow runs are first-class objects with expandable step logs, status badges, timing.

**Synthesis for Agent OS:**
> **Height's "AI as teammate" + Retool's "execution log" is the combo.** Agent activity should show as:
> 1. A feed item: "🤖 Researcher completed competitive analysis" (like Height)
> 2. Expandable execution detail: steps taken, time elapsed, tokens used (like Retool/GitHub Actions)
> 3. A persistent "Agent Activity" sidebar or panel that shows what's running NOW
>
> **Nobody does this well for multi-agent orchestration.** This is our unique opportunity.

### Q4: UX patterns for "recurring scheduled work" vs "one-off tasks"?

| Pattern | Used By | How It Works |
|---|---|---|
| **Recurring issue templates** | Linear (API), Shortcut | Cron-like: "create this issue every Monday" |
| **Cycle templates** | Plane, Linear | "Start a new cycle with these default issues" |
| **Periodic notes** | Obsidian (Templater) | Daily/weekly/monthly note auto-created from template |
| **Scheduled workflows** | Retool, Airplane | Cron editor UI: pick schedule, define what runs |
| **Auto-archive + recreate** | Arc Browser | Tabs auto-archive after 12h; pinned tabs persist |

**Key insight:** The best tools make the distinction **visual**:
- Recurring items have a **⟳ icon** or "recurring" badge
- Scheduled work appears in a **calendar view** or **schedule panel**, not mixed into the kanban
- One-off tasks live in the backlog/board; recurring work lives in a "Schedules" section

**For Agent OS:**
> Recurring work (cron jobs, scheduled proposals, periodic health checks) should have their own **Schedules page or panel** — separate from the task board. Each schedule shows: what it does, when it next runs, last run status, and a quick "run now" button. Think: **crontab meets GitHub Actions scheduled workflows.**

### Q5: Best metaphor for "the system autonomously generating work for itself"?

This is genuinely novel. No competitor does this well. Closest analogies:

| Metaphor | Source | How It Feels |
|---|---|---|
| **Inbox/Suggestions** | Height AI, Gmail Smart Compose | "The system noticed something and suggests you act" |
| **Dependabot/Renovate** | GitHub | "Automated PR created: update dependency X" — system creates work, human approves |
| **Feed/Timeline** | Social media | "Here's what happened while you were away" — chronological stream |
| **Advisory/Briefing** | Intelligence agencies | "Daily brief: 3 items need attention, 2 opportunities detected" |
| **Garden/Growing** | Obsidian community metaphor | "Ideas are seeds that the system tends; some sprout into tasks" |

**Recommendation for Agent OS:**
> The best metaphor is **"Proposals as a briefing."** The system is an advisor that:
> - Scans the environment (code health, vault entropy, missed opportunities)
> - Generates **proposals** (not tasks — proposals need human approval)
> - Presents them as a **daily/continuous brief**: "3 new proposals. 1 high-priority."
> - Each proposal has: what, why, estimated effort, confidence score, "approve/reject/edit"
>
> Frame it as: **"Your agents noticed things and have suggestions."** Not "the system created tasks for you" (that feels out-of-control). The human remains the approver, but the initiative comes from the system.
>
> **Terminology recommendation:** Call them **"Proposals"** (not suggestions, not recommendations). Proposals imply something substantive that was thought through — not a casual nudge.

### Q6: Goals (aspirational) → Missions (strategic) → Plans (tactical) → Tasks (operational)?

**How competitors handle hierarchy:**

| Tool | Hierarchy | Depth | How They Link |
|---|---|---|---|
| **Linear** | Roadmap → Project → Cycle → Issue → Sub-issue | 5 levels | Project contains issues; Cycle time-boxes them; Roadmap visualizes projects |
| **Shortcut** | Objective → Epic → Story → Task | 4 levels | Objectives are OKR-like; Epics group stories thematically; Milestones time-box |
| **Notion** | OKR database → Project database → Task database | 3 databases | Relations between databases; rollup fields show progress |
| **Plane** | Module → Cycle → Issue → Sub-issue | 4 levels | Modules = thematic; Cycles = time-boxed; Issues can belong to both |
| **Height** | Goal → List → Task → Sub-task | 4 levels | Goals are top-level with % completion from linked tasks |

**Key observations:**
1. **Nobody exceeds 4-5 levels.** More than that and humans lose context.
2. **The top level is always aspirational and loosely coupled.** Goals/Objectives/Roadmaps don't have hard deadlines — they have target quarters.
3. **The middle level is where strategy meets execution.** This is Epics/Projects/Modules — a meaningful chunk of work with a clear "done" state.
4. **The bottom level is atomic and assignable.** One person, one task, one status.
5. **Time-boxing (Cycles/Sprints) is orthogonal to hierarchy.** A task belongs to a Project AND a Cycle. They're cross-cutting concerns.

**For Agent OS:**

Our hierarchy: **Goals → Missions → Plans → Tasks**

| Our Level | Maps To | Recommended Treatment |
|---|---|---|
| **Goals** | Linear Roadmap / Shortcut Objectives / Notion OKRs | Aspirational. No deadline. Has a north-star metric. Progress = % of child Missions complete. |
| **Missions** | Linear Projects / Shortcut Epics / Plane Modules | Strategic chunks. Has a target completion (quarter or date range). Contains Plans. Clear "done" criteria. |
| **Plans** | Linear Cycles + Issue groups / Notion Sprints | Tactical. Time-boxed OR scope-boxed. A plan is "how we'll accomplish part of a Mission." Contains Tasks. |
| **Tasks** | Linear Issues / Shortcut Stories / Height Tasks | Atomic. Assignable (to human or agent). Has status flow. One task = one PR or one action. |

> **Critical insight from competitors:** Don't force users to always work top-down. Linear's genius is that you can create an issue without a project, without a cycle. The hierarchy is **opt-in, not mandatory.** Let people create tasks freely and organize upward later.

### Q7: Notification/attention patterns for "things need your input"?

| Pattern | Used By | Mechanism |
|---|---|---|
| **"My Issues" filtered view** | Linear | Default view shows only YOUR work, sorted by priority |
| **Triage inbox with count badge** | Linear, Plane | Badge on "Triage" shows unsorted count — creates urgency |
| **"Your turn" indicator** | Graphite | On PR review queue: green dot = you're the blocker |
| **Smart notifications** | Height | AI batches notifications: "3 tasks updated" instead of 3 separate pings |
| **@mention with reminder** | Notion | @person creates a notification; can set a reminder date |
| **Dashboard rollups** | Retool | Admin panel shows KPIs with red/yellow/green status |
| **Daily digest email** | Linear, Shortcut | "Here's what changed yesterday, here's what's due today" |
| **Floating command bar** | Raycast | Global hotkey opens action palette — always one keystroke away |

**Best patterns for Agent OS:**

> 1. **"Needs Your Input" as a first-class queue** (like Graphite's "Your Turn"). Not a notification — a persistent, always-visible count. "3 proposals awaiting review. 1 agent blocked on approval."
> 2. **Dashboard as daily brief** (like Retool KPI panels). Show: what's running, what completed, what needs you, what's coming up.
> 3. **Smart batching** (like Height). Don't ping for every agent completion. Batch: "Since you were away: 2 tasks completed, 1 proposal generated, 1 needs review."
> 4. **Urgency gradient, not binary** — Green (FYI), Yellow (review when convenient), Orange (blocking an agent), Red (something failed/broke).

---

## 3. UI Patterns to Steal

### From Linear
- **Keyboard-first everything.** Every action has a shortcut. Command+K opens universal search. This should be our default interaction model.
- **Triage as a spatial concept.** Triage isn't a status — it's a separate place. Unsorted items don't pollute the board.
- **Cycles with auto-rollover.** Unfinished items auto-move to next cycle. No manual cleanup.
- **Filters that become views.** Any filter combo can be saved as a named view. Views are first-class.

### From Height
- **AI activity in the feed.** When AI acts, it shows up as a teammate's action — not a system event. This humanizes automation.
- **Smart deduplication.** AI detects "this new task looks like #432" and prompts merge. For us: detect duplicate proposals.
- **Autonomous prioritization.** AI suggests priority; human confirms. Shift from "human sorts" to "human approves AI's sort."

### From Graphite
- **"Your Turn" indicator.** In a multi-agent system, clearly show whose turn it is: the human's or the agent's. If an agent is working, show a spinner. If it's waiting for human input, show a prominent badge.
- **Stacked view.** For sequential work (pipelines), show items as a stack where the top item is the current focus. Like a deck of cards, not a flat list.

### From Raycast
- **Command palette as primary UI.** `Cmd+K` to do anything: "create proposal", "show running agents", "approve all pending", "find mission X". This collapses navigation into intent.
- **Quick actions with keyboard shortcuts.** Approve proposal: `⌘+⏎`. Reject: `⌘+⌫`. Edit: `E`. Navigate: `↑↓`.

### From Arc Browser
- **Spaces as contexts.** Each Mission could be a "Space" — switching Missions switches your entire view context (filtered tasks, relevant agents, associated files).
- **Auto-archive.** Completed tasks fade out after a period. Don't clutter the active view with done items.

### From Retool/Airplane
- **Execution logs as first-class UI.** Every agent run should have an expandable log: what it did, how long it took, what it produced. Like a CI/CD run detail page.
- **"Run Now" buttons.** Scheduled work should have a manual trigger. "This runs at midnight, but I want it now."

### From Obsidian Canvas
- **Relationship visualization.** Show how Goals → Missions → Plans → Tasks connect as a visual graph. Not for daily work, but for "zoom out and see the big picture."
- **Bidirectional links.** Every reference is two-way. If a Task mentions a Mission, the Mission shows the Task. Our vault already does this.

---

## 4. Recommendations: Proposals Page Redesign

### Current Problem (inferred)
Proposals likely feel like a flat list of suggestions without clear workflow or urgency gradient.

### Recommended Redesign

**Layout: "Daily Brief" model**

```
┌─────────────────────────────────────────────────┐
│  📋 Proposals                    [3 new today]   │
├─────────────────────────────────────────────────┤
│                                                   │
│  🔴 HIGH PRIORITY (1)                            │
│  ┌───────────────────────────────────────────┐   │
│  │ Refactor auth module — 3 security issues  │   │
│  │ Source: Code Scanner · Confidence: 0.92   │   │
│  │ Est: 4h · Links to: Auth Mission          │   │
│  │ [✅ Approve] [✏️ Edit] [❌ Reject] [💤 Defer]│   │
│  └───────────────────────────────────────────┘   │
│                                                   │
│  🟡 REVIEW WHEN READY (2)                        │
│  ┌───────────────────────────────────────────┐   │
│  │ Update vault index — 12 orphan notes      │   │
│  │ Source: Vault Scanner · Confidence: 0.78  │   │
│  │ Est: 1h · No mission link                 │   │
│  │ [✅ Approve] [✏️ Edit] [❌ Reject] [💤 Defer]│   │
│  └───────────────────────────────────────────┘   │
│  ┌───────────────────────────────────────────┐   │
│  │ New skill: Docker health check            │   │
│  │ Source: Pattern Detection · Conf: 0.65    │   │
│  │ Est: 2h · Could link to: Ops Mission      │   │
│  │ [✅ Approve] [✏️ Edit] [❌ Reject] [💤 Defer]│   │
│  └───────────────────────────────────────────┘   │
│                                                   │
│  📊 Proposal Stats                               │
│  This week: 8 generated · 5 approved · 2 reject  │
│  Top source: Code Scanner (4) · Vault Scanner (3) │
│                                                   │
│  ⟳ Scheduled scans: Next in 2h 14m              │
│  [Run scan now] [Configure sources]               │
└─────────────────────────────────────────────────┘
```

**Key design decisions:**
1. **Urgency-grouped, not chronological.** High priority first, regardless of when generated.
2. **Source attribution.** Every proposal says WHERE it came from (which scanner/agent detected it). Builds trust.
3. **Confidence score visible.** User quickly learns to trust 0.90+ and scrutinize 0.60-.
4. **One-click actions.** Approve/Reject/Edit/Defer — not a multi-step workflow.
5. **Mission linking.** AI pre-links proposals to relevant Missions. User can confirm or change.
6. **Stats footer.** Shows the proposal engine's track record. Builds trust over time.
7. **Batch actions.** "Approve all high-priority" for power users.

### Proposal Lifecycle
```
[Generated] → [Pending Review] → [Approved] → (becomes a Task/Plan)
                               → [Rejected] → (archived, but remembered — don't re-suggest)
                               → [Deferred] → (re-surfaces after N days)
                               → [Edited] → [Approved] → (becomes a Task/Plan with modifications)
```

---

## 5. Recommendations: Missions Page Redesign

### Recommended Redesign

**Layout: "Mission Control" model (inspired by Linear Projects + Retool Dashboards)**

```
┌─────────────────────────────────────────────────────┐
│  🎯 Missions                                        │
├──────────┬──────────────────────────────────────────┤
│          │                                           │
│ ACTIVE   │  🚀 Agent OS v2                          │
│ ──────── │  Goal: Ship self-managing agent platform  │
│ Agent OS │  Progress: ████████░░ 78%                 │
│  v2      │  Plans: 4 active · 2 completed · 1 blocked│
│          │  Agents: 2 running now                    │
│ Auth     │  ──────────────────────────────────────── │
│  Rewrite │  📋 Plans                                 │
│          │  ┌─ ✅ Design system ──────── done        │
│ PLANNED  │  ├─ ✅ Data model ────────── done        │
│ ──────── │  ├─ 🔄 Proposals page ───── 60% (2 agents)│
│ Vault    │  ├─ 🔄 Missions page ────── 40% (1 agent) │
│  Cleanup │  ├─ ⬚ Dashboard page ────── not started  │
│          │  └─ ⬚ Settings page ──────── not started  │
│ Mobile   │  ──────────────────────────────────────── │
│  App     │  🤖 Agent Activity                        │
│          │  • Coder working on Proposals component   │
│ DONE     │  • Researcher completed UX competitive    │
│ ──────── │    analysis (12 min ago)                  │
│ CI/CD    │  ──────────────────────────────────────── │
│  Pipeline│  ⚠️ Needs Your Input                      │
│          │  • Approve: Switch to shadcn? (Coder asks)│
│          │  • Review: 2 proposals linked to this     │
│          │                                           │
└──────────┴──────────────────────────────────────────┘
```

**Key design decisions:**

1. **Left sidebar = Mission list grouped by status.** Active/Planned/Done. Like Linear's sidebar but for missions.
2. **Right panel = Mission detail with three sections:**
   - **Plans** — tactical breakdown with progress bars and agent assignment
   - **Agent Activity** — live feed of what agents are doing FOR this mission (stolen from Height)
   - **Needs Your Input** — blocking items surfaced prominently (stolen from Graphite's "Your Turn")
3. **Progress is calculated, not set.** % complete comes from child plan/task completion rollups (like Notion rollups).
4. **Agent count visible.** "2 agents running now" — you know work is happening without checking each task.
5. **Mission switching = context switching.** Click a mission in the sidebar → entire right panel updates. Like Arc Spaces.

### Mission Lifecycle
```
[Proposed] → [Planned] → [Active] → [Completed]
                                   → [Paused] (with reason)
                                   → [Abandoned] (with retrospective)
```

### Mission Properties
- **Goal link** — which aspirational Goal does this serve?
- **Target date** — quarter or date range (not hard deadline)
- **Success criteria** — what does "done" look like? (1-3 bullet points)
- **Plans** — child tactical units
- **Key metrics** — measurable outcomes (optional)
- **Agent config** — which agents are authorized to work on this mission?

---

## 6. What Our System Has That Nobody Else Does

### Unique Advantages to Emphasize

| Advantage | Why It's Unique | Nearest Competitor | Our Edge |
|---|---|---|---|
| **Autonomous proposal generation** | System scans environment and generates work items without human prompting | Height AI (only categorizes existing tasks) | We CREATE new work; they organize existing work |
| **Multi-agent orchestration** | Multiple specialized agents working in parallel on a mission | None (all competitors are single-user or single-automation) | We have a TEAM of agents, not one AI assistant |
| **Agent-as-teammate model** | Agents have names, specialties, performance history | Height (AI is one unnamed entity) | Our agents are individuals: Coder, Researcher, Ops. They have track records. |
| **Human-in-the-loop approval** | System proposes, human approves — not autonomous execution | GitHub Dependabot (only for dependency updates) | We do this for ALL categories of work: code, content, ops, research |
| **Vault-integrated knowledge** | Agent decisions informed by persistent knowledge graph | None (competitors use flat databases) | Our agents READ the vault, learn from history, build context over time |
| **Self-improving system** | Performance tracking feeds back into agent dispatch (who's good at what) | None | We track agent success rates and route accordingly |
| **Cross-domain orchestration** | Same system manages code, content, ops, research, communication | Linear (code only), Notion (content only) | One orchestration layer across ALL work types |
| **Confidence-scored proposals** | Every AI suggestion has a numeric confidence + source attribution | None | Users build calibrated trust instead of blind accept/reject |
| **Conversational interface** | Discord/Telegram as primary UI — not a separate web app | None (all competitors require their own UI) | Zero onboarding. Work where you already are. |

### Messaging Recommendations

**Don't say:** "AI-powered project management" (everyone says this)
**Do say:** "Your agents work while you sleep and brief you in the morning"

**Don't say:** "Autonomous task creation" (sounds scary/out-of-control)
**Do say:** "Proposals — your agents notice things and suggest actions. You decide."

**Don't say:** "Multi-agent orchestration platform" (sounds like enterprise middleware)
**Do say:** "A team of specialists. Each with a name, a skill, and a track record."

---

## 7. Consolidated Recommendations

### Immediate Wins (low effort, high impact)

1. **Add urgency gradient to Proposals.** Red/Yellow/Green based on confidence + staleness. Stop treating all proposals equally.
2. **Show "Needs Your Input" count on Dashboard.** Always visible. This is the #1 attention hook.
3. **Add source attribution to every proposal.** "Where did this come from?" builds trust faster than anything else.
4. **Keyboard shortcuts for approve/reject.** Power users should never touch a mouse for triage.

### Medium-Term (redesign-level)

5. **Separate Proposals into their own object type.** Not a task with "proposed" status. A different entity with a promotion workflow.
6. **Mission detail page with agent activity feed.** Show what's happening now, not just what's planned.
7. **Pipeline visualization.** Horizontal funnel showing idea → triage → plan → execute → done with counts at each stage.
8. **Command palette (Cmd+K).** Universal search + quick actions. Single most impactful UX feature across all competitors.

### Long-Term (differentiators)

9. **Agent performance dashboard.** Show which agents succeed at what. Let the system auto-route based on track record.
10. **"Briefing" mode.** Morning summary: "While you slept: 3 tasks completed, 2 proposals generated, 1 needs review. Your agents saved you ~4 hours."
11. **Mission Spaces.** Switching missions switches your entire context — filtered tasks, relevant proposals, active agents, associated vault notes.
12. **Proposal learning loop.** Track approve/reject patterns. If user always rejects "vault cleanup" proposals, reduce their frequency. If they always approve "security scan" proposals, auto-approve after N consecutive approvals.

---

## Appendix: Competitor Feature Matrix

| Feature | Linear | Height | Shortcut | Notion | Plane | Graphite | Raycast | Arc |
|---|---|---|---|---|---|---|---|---|
| Keyboard-first | ✅✅ | ✅ | ✅ | ❌ | ✅ | ✅✅ | ✅✅✅ | ✅ |
| AI-native | ❌ | ✅✅✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ✅ |
| Triage workflow | ✅✅✅ | ✅✅ | ❌ | ❌ | ✅✅ | ✅ | N/A | N/A |
| Recurring work | ✅ | ✅ | ✅ | ✅ | ✅ | N/A | ✅ | ❌ |
| Goal hierarchy | ✅ | ✅ (beta) | ✅✅ | ✅✅ | ✅ | ❌ | N/A | N/A |
| Execution visibility | ❌ | ✅✅ | ❌ | ❌ | ❌ | ✅✅ | N/A | N/A |
| API/Extensibility | ✅✅✅ | ✅ | ✅✅ | ✅✅ | ✅✅ | ✅ | ✅✅✅ | ✅ |
| Open source | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ |

> **Key takeaway:** Nobody combines AI-native task generation + multi-agent execution + human-in-the-loop approval. That's our space. The competitors are either great at project management (Linear) or great at AI assistance (Height) — but none are great at **AI-driven project management where agents are the primary workers and humans are the reviewers.**
