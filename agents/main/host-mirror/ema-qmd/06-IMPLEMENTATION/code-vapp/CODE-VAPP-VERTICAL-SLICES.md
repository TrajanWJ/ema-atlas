# Code vApp Vertical Slices

## Slice 1 — Local CLI agent attachment
- attach to local provider/agent session
- bind session to EMA workstream
- expose same identity in GUI

## Slice 2 — Live/simulated terminal mirror
- PTY-backed terminal session
- GUI mirror over same session
- chronicle events on key transitions

## Slice 3 — Repo/worktree/machine binding
- bind code session to real machine + repo + worktree
- persist binding and restore after restart

## Slice 4 — Diff/checkpoint/review loop
- produce checkpoints/diffs
- review in GUI
- preserve lineage in Chronicle/Review

## Slice 5 — Secrets/runtime profile integrity
- environment/provider secret references
- runtime profile selection
- safe reattachment/restart behavior
