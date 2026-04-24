# Runtime Git Policy

The runtime repo at `runtime/EMA-0.0.5--4-24/` is the provenance boundary for
EMA 0.0.5 implementation work.

## Branch Discipline

- `main` is the integration branch.
- Each worker session uses a named branch for its lane:
  `lane/<lane-id>-<short-topic>`.
- One lane owns one disjoint file set. If the lane needs another file set, the
  coordinator updates the lane prompt before work continues.
- Workers do not amend, squash, or rewrite commits that another session may
  have based work on.
- Workers do not force-push shared branches.

## Worktree Discipline

Concurrent sessions should use separate worktrees instead of sharing one dirty
checkout:

```sh
git worktree add ../EMA-0.0.5--4-24-<lane-id> -b lane/<lane-id>-<short-topic>
```

Before closing a lane:

```sh
git status --short --branch
git diff --check
git log --oneline --max-count=5
```

## History Hygiene

- Generated dependencies and build outputs stay out of history.
- `.ema-dev/logs/`, `.ema-dev/pids/`, local SQLite files, pid files, and local
  logs stay out of history.
- Secrets, OAuth tokens, device keys, private keys, and `.env` files never enter
  history.
- If a secret is discovered in tracked content, stop and flag it before making
  additional commits.
