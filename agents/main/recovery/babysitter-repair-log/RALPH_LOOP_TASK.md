## Task
Repair and operationalize the entire Discord channel self-nudge and continuation system for this install.

This loop owns the end-to-end channel task, not just one lane.
It should repeatedly:
1. inspect the current blocker state
2. repair the highest-leverage substrate issue
3. verify one real continuation/self-nudge behavior end to end
4. expand only after a working baseline is proven
5. keep continuity across lane activation, session bindings, cron wiring, config validity, and actual delivered follow-up behavior

## Current Known Problem
The strongest recurring failure is that Discord lane continuation can be fully wired yet still not actually run, because `~/.openclaw/openclaw.json` reverts `channels.telegram.streaming` and `channels.discord.streaming` into an invalid shape before execution.

## Priorities
- Stop the config rewriter or any substrate-level source of state corruption
- Restore valid live OpenClaw config
- Verify at least one lane actually runs and either posts or returns `NO_REPLY`
- Then verify scheduled continuation behavior, not just manual runs
- Then widen rollout across other lanes

## Completion Criteria
When done, output exactly: TASK_COMPLETE

Completion means all of the following are true:
- at least one canonical lane has real end-to-end self-nudge behavior verified
- the immediate config corruption loop is neutralized or contained
- lane continuation survives scheduled execution, not just manual invocation
- the system has a clear next rollout set for more lanes

## Block Criteria
If the task cannot proceed without human intervention, output one of:
- TASK_BLOCKED
- NEEDS_HUMAN
- CANNOT_COMPLETE

Use those only for real blocking conditions, not routine uncertainty.
