# `ema recovery`

Read-only recovery tools for finding source-bearing backups, worktrees, stale
lanes, queue mirrors, handoffs, donor fragments, and lost implementation
material across the Desktop.

The command never mutates donor projects. It reports candidates so they can be
promoted into `docs/recovery/desktop-wide-recovery-ledger.md` and then ported
into modern EMA implementation paths.

## Scan

```bash
ema recovery scan --json
ema recovery scan --kind ema-swarm-worktree --json
ema recovery scan --kind stale-queue,stale-lane --confidence high --json
```

Flags:

- `--json` emits a single JSON object.
- `--limit <n>` limits candidate count after ranking.
- `--max-depth <n>` controls donor tree traversal depth.
- `--source <path[,path]>` overrides the default Desktop source roots.
- `--kind <kind[,kind]>` filters by candidate kind.
- `--confidence high|medium|low` filters by confidence.

Default source roots:

- `~/Desktop/Active builds`
- `~/Desktop/Projects`
- `~/Desktop/Space shared files-uploads-vDesktop-vFilesystem-root`

## Candidate Kinds

- `ema-swarm-worktree`
- `atlas-doctrine`
- `harness-donor`
- `vapp-sketch`
- `stale-lane`
- `stale-queue`
- `handoff-fragment`
- `native-companion-donor`
- `pre-port-archive`
- `shell-donor`
- `projection-fragment`
- `vapp-inspiration`
- `lost-work`
- `desktop-fragment`

## Output Shape

```json
{
  "ok": true,
  "command": "desktop-recovery-scan",
  "summary": {
    "candidates": 10,
    "high_confidence": 10,
    "dirty_worktrees": 3,
    "by_kind": {
      "ema-swarm-worktree": 10
    }
  },
  "worktrees": [],
  "candidates": []
}
```

Use the `worktrees` array to detect active dirty work and the `candidates`
array to select donor material for a modern EMA port.
