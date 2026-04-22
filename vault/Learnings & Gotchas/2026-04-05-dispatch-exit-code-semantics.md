---
title: "Dispatch Exit Code 0 Can Mean FAILED"
type: reference
created: 2026-04-05
tags: [dispatch, gotcha, openclaw, debugging]
summary: "dispatch-engine.sh exit code 0 does not guarantee success — task status can still be FAILED"
---

# Dispatch Exit Code 0 Can Mean FAILED

## The Gotcha

In `dispatch-engine.sh`, a task can return exit code 0 but still have status `FAILED` in `outcome-tracker.json`. The exit code and the semantic task status are **decoupled**.

This means:
- Checking `$?` after dispatch is not sufficient to determine task success
- You must read the outcome file / task status to know the real result
- Monitoring scripts that rely on exit codes will miss failures

## Why This Matters

Any automation that gates on exit code (cron wrappers, CI steps, chained tasks) will silently proceed past failures. This was observed during the April 2026 dispatch failure cascade.

## Correct Pattern

```bash
# WRONG: trusting exit code
dispatch-engine.sh run task-12345 && echo "success"

# RIGHT: check outcome status
dispatch-engine.sh run task-12345
status=$(jq -r '.status' /path/to/outcome-tracker.json)
if [ "$status" != "DONE" ]; then
  echo "Task failed with status: $status"
fi
```

## Related

- [[Dispatch Recursive Failure Loop]]
- [[Dispatch API Key Health Check]]
