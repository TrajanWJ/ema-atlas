# @ema/cli

Command-line surface for the EMA 0.0.5 daemon.

Speaks the shell-protocol defined in
`packages/contracts/ipc/shell-protocol.md` over a WebSocket to
`ws://127.0.0.1:49555`. The full product-contract command grammar lives
in `docs/cli/see-agent-work.md`; wave 1 ships only a handful of the
commands as actually-executing and stubs the rest.

## Install

From the repo root:

```
NODE_EXTRA_CA_CERTS=/etc/ssl/cert.pem pnpm install
pnpm --filter @ema/cli build
```

That emits `apps/cli/dist/bin.js` with a `#!/usr/bin/env node` hashbang.

## CLI doctrine (post-cwt-absorption, 2026-05-07)

EMA's CLI is `ema`. Per `~/Desktop/AGENTS.md` and
`docs/decisions/2026-05-07-cwt-absorbed-by-ema.md`, all record families below
the org/space layer (`client`, `project`, `queue_item`, `lane`, `mission`,
`campaign`, `responsibility`, `vcalendar`, `checkup`, `handoff`, `problem`,
`solution`, `execution`, `dependency`) live in the EMA daemon and surface via
`ema` verbs:

- Orchestration: `ema next`, `ema lane`, `ema queue`, `ema mission`,
  `ema agent orient`, `ema tl about`, `ema vcalendar tick`, `ema status`.
- Cockpit (project/client/work registry, formerly cwt's surface):
  `ema cockpit next`, `ema cockpit client list`,
  `ema cockpit project list --client=<id>`, `ema cockpit capture`,
  `ema cockpit responsibility list` / `add`.

`~/.local/bin/cwt` is a thin alias for `ema cockpit "$@"`. There is no
separate cwt CLI surface. The earlier two-binary "multi-first-command"
doctrine is dissolved.

## Invoke

The canonical invocation in development is the global `ema` wrapper:

```
ema <command>                           # global launcher, runs from any cwd
```

The wrapper lives at `~/.local/bin/ema`. It resolves the active build via
`EMA_HOME` (default `~/Desktop/Active builds/EMA-0.0.5`) and execs
`apps/cli/dist/bin.js`. To target a different build for one shell:

```
EMA_HOME="$HOME/Desktop/Active builds/EMA-0.0.6" ema next --json
```

If the wrapper isn't installed, two equivalent fallbacks work from inside the
build root:

```
pnpm cli <command>                      # root script, via pnpm --filter
node apps/cli/dist/bin.js <command>     # direct
```

Every command accepts `--json` to emit NDJSON instead of pretty text.

## Commands

### Wave 1 — execute end-to-end

- `ema ping` — hello + ping, prints RTT in ms. Exits 0 on success; exit 2
  if the daemon is unreachable.
- `ema status` — subscribes, waits for the `topbar` projection, prints
  the current org / space / project.
- `ema events tail [--family <name>] [--since <txid>]` — streams event
  envelopes as JSON lines. Ctrl-C to quit. `--since` is accepted for
  forward-compat; v0 has no resume-from-txid semantic.
- `ema cwt status` — inspects the `current-work-tracker-trajan` shared-files
  projection.
- `ema cwt ingest --dry-run` — previews CWT project, lane, queue, and problem
  promotion without writing daemon events.
- `ema cwt ingest --all` — commits supported CWT lane, queue, and problem
  records through daemon command writers. Re-runs are idempotent via the
  `cwt.shared_files:<cwt-id>` source marker.

### Wave 1 — documented grammar, stubbed behavior

- `ema swarm list` / `ema swarm show --swarm <name>` — print a
  "not yet implemented" note and exit 0. See
  `docs/cli/see-agent-work.md` for the full grammar
  (`list | show | start | pause | stop | status | report`).

### Always available

- `ema help` — lists every command with a one-line summary.

## Daemon not running?

If `ema ping` errors with `daemon not reachable`, start it:

```
bash scripts/dev-daemon.sh
```

## Structure

```
apps/cli/
  src/
    bin.ts                # argv dispatch
    ws-client.ts          # hello, command, ping, subscribe (drop-aware)
    args.ts               # tiny long-flag parser
    output.ts             # pretty vs --json NDJSON
    commands/
      ping.ts
      status.ts
      events.ts
      swarm.ts
      cwt.ts
      help.ts
  tsconfig.json
  tsup.config.ts          # esm, node20, hashbang banner
  package.json            # bin: ema -> dist/bin.js
```
