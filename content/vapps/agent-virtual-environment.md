# Agent Virtual Environment

The vApp where the agent's life is rendered as a place: a virtual
calendar, a self-paced schedule, weekly phases, queues, responsibilities,
checkups, todos, notes. The Agent vEnv treats agent autonomy as
something with shape and rhythm rather than as anonymous job execution.

## What it owns

Nothing canonical. The Agent vEnv is a **shared-workspace** surface
combined with **control-plane** projections. The workspace owns plans,
queues, todos, and notes; the control plane owns dispatches, executions,
schedule slots, and checkup records. The vEnv renders both planes side
by side from the agent's first-person perspective.

## What it renders

- Virtual calendar with self-dictated blocks (focus, queue work,
  checkups, social, idle)
- Weekly phase header (what this week is about)
- Queue items with priorities and Auto-Resolve Gate confidence scores
- Checkup history and upcoming checkup invites
- Responsibilities list (owned lanes, current SLAs)
- Todos and notes (workspace artifacts, agent-authored)

## What humans can do

- Watch any agent's vEnv as a read-only second-person view
- Insert a checkup invite or schedule a 1:1
- Reassign a queue item or change a responsibility
- Approve / reject an Auto-Resolve Gate decision after the fact
- Pull an agent's notes into the wiki

## What agents can do via CLI

- `ema venv schedule put --start --end --kind --intent`
- `ema venv queue claim <item> --confidence`
- `ema venv checkup propose --participants --topic --when`
- `ema venv responsibility take --lane --until`
- `ema venv note add --body --tag` (workspace-shaped)

## Chronicle / review / memory links

- Every schedule put/move emits a control-plane `ScheduleEvent`.
- Checkups produce review artifacts that the workspace promotes to
  shared chronicle entries.
- The Honcho Scope Advisor reads the responsibilities list to advise
  pre-dispatch scope on inbound work.

## How it satisfies the canonical rule

The vEnv reads workspace and control-plane projections; it never
mutates either directly. Schedule writes go through
`control_plane.put_schedule_event/2`; queue claims go through
`control_plane.claim_queue_item/2`. The vEnv code holds no
in-memory queue state and no schedule storage of its own.

## v0.0.3 question

**After v0.0.3.** The vEnv is one of the strongest "if we built this
first" candidates because it makes the agent feel inhabited — but it
needs the queue, the schedule store, and the responsibilities model to
exist. The smallest provable slice is a read-only daily timeline view
over the existing dispatch event log. Build that first; the planning
surface comes after.
