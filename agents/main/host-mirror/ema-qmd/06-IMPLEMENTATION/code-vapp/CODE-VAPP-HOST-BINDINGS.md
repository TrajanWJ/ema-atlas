# Code vApp Host Bindings

## Host-aware bindings needed
- machine binding
- repo path binding
- worktree binding
- shell/pty binding
- provider runtime binding
- environment profile binding

## Why
The Code vApp only becomes truly useful if code sessions are grounded in real host context:
- which machine
- which repo
- which worktree
- which runtime/provider
- which secrets/environment profile

## Required behaviors
- reattach after restart
- surface stale/missing bindings clearly
- preserve workstream identity even when session IDs churn
