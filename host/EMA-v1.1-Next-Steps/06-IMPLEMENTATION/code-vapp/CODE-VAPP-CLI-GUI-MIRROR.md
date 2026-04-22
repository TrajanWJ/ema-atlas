# Code vApp CLI↔GUI Mirror

## Principle
The Code vApp must support the same active code session in both CLI and GUI.

## CLI should support
- attach to provider session
- attach to terminal session
- inspect workstream state
- send command/turn/input
- inspect artifacts/diffs/checkpoints
- bind/rebind repo/worktree/machine context

## GUI should support
- live terminal / simulated terminal view
- session timeline / replay
- workstream/context panel
- diff/review/checkpoint controls
- provider/runtime/session visibility
- repo/worktree/environment controls

## Shared truth
- same session/workstream IDs
- same chronicle events
- same checkpoint/diff lineage
- same machine/repo bindings
- same approval/review state
