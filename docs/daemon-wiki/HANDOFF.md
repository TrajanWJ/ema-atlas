# EMA Task Handoff

EMA uses PubSub-based handoff for real-time task chaining within the daemon, and file-based dispatch chaining for shell-level workflows. No file-based mailbox system — OTP handles lifecycle.

## PubSub Handoff (Daemon)

All inter-module communication flows through `Phoenix.PubSub` on topic namespaces:

```elixir
# Proposal pipeline handoff
Phoenix.PubSub.broadcast(Ema.PubSub, "proposals:pipeline", {:proposals, :generated, proposal})
Phoenix.PubSub.broadcast(Ema.PubSub, "proposals:pipeline", {:proposals, :refined, proposal})
Phoenix.PubSub.broadcast(Ema.PubSub, "proposals:pipeline", {:proposals, :debated, proposal})
Phoenix.PubSub.broadcast(Ema.PubSub, "proposals:pipeline", {:proposals, :scored, proposal})
Phoenix.PubSub.broadcast(Ema.PubSub, "proposals:pipeline", {:proposals, :queued, proposal})
```

Each stage GenServer subscribes to the previous stage's event and processes it autonomously.

## Proposal Pipeline as Handoff Chain

The canonical handoff pattern in EMA is the proposal pipeline:

```
Scheduler
  → Generator (creates raw proposal via Claude)
    → Refiner (improves clarity and structure)
      → Debater (challenges with counter-arguments)
        → Scorer (evaluates quality on 4 dimensions)
          → Tagger (classifies and sets status to :queued)
            → Frontend (user approves/redirects/kills)
```

Each stage is a GenServer under `Ema.ProposalEngine.Supervisor` (rest_for_one strategy). If Generator crashes, all downstream stages restart — no orphaned subscribers.

## Session Fork/Resume

`Ema.Claude.SessionManager` supports multi-turn session continuity with fork/resume:

```elixir
# Fork a session at a specific point
{:ok, forked} = SessionManager.fork_session(session_id, fork_point: message_index)
# Creates new AiSession with parent_id linking back to original

# Resume continues from where the session left off
{:ok, resumed} = SessionManager.resume_session(session_id)
# Loads full message history and continues the conversation
```

Fork/resume enables:
- Branching exploration (try approach A and B from the same context)
- Recovery from failed runs (resume from last good state)
- Superman continuity (attach session context to external tool calls)

## Dispatch Chaining (Shell)

For shell-based workflows, completed tasks can trigger follow-up dispatches:

### dispatch-completion-hook.sh

Runs after each task completes. Checks if the task is part of a pipeline and queues the next step:

```bash
# Task completes → check for pipeline
pipeline=$(jq -r '.pipeline_id // empty' "$DONE_DIR/$task_id.json")
if [[ -n "$pipeline" ]]; then
  next_step=$(get_next_step "$pipeline" "$task_id")
  cp "$next_step" ~/dispatch/queue/
fi
```

### Result Forwarding

Task results in `~/dispatch/results/` are available to downstream tasks:
- The next task in a pipeline receives the previous task's result path in its `context` field
- Cross-pollination: the ProposalEngine's Combiner reads results to synthesize new seeds

## Handoff Patterns

### Sequential Pipeline
```
Task A (research) → result → Task B (implement) → result → Task C (review)
```
Each step depends on the previous. Managed by pipeline JSON in `~/dispatch/pipelines/`.

### Parallel Fan-Out
```
Task A → spawns Task B + Task C + Task D in parallel
         → results collected → Task E (synthesis)
```
Used by research workflows. `parallel-dispatch.sh` handles fan-out.

### Event-Driven
```
VaultWatcher detects change → PubSub → GapScanner runs → PubSub → Proposal seed created
```
Fully reactive within the OTP tree. No polling needed.
