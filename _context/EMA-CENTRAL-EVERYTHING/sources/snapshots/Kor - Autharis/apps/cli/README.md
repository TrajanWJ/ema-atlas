# @autharis/cli

Autharis command-line interface. Lane **G2** of the Autharis swarm.

Built with [oclif](https://oclif.io) v4. Consumes the typed [`@autharis/sdk`](../../packages/sdk).

## Install locally

From this directory:

```sh
pnpm install
pnpm build
bash scripts/install-local.sh   # pnpm link --global, exposes `autharis`
```

Or run without linking:

```sh
node ./bin/run.mjs --help
```

## Configuration

The CLI reads environment variables:

| Var                | Default                    | Notes                        |
| ------------------ | -------------------------- | ---------------------------- |
| `AUTHARIS_API_URL` | `http://localhost:4010`    | Base URL for the Fastify API |
| `AUTHARIS_API_KEY` | _unset_                    | Optional bearer token        |

## Commands

### `autharis swarm status`

Parses `autharis/_shared/lanes.md` (the swarm lock sheet) and prints a colorized
table: **Lane | Status | Holder | Short name**. Flags:

- `--file, -f` — override the lanes file path
- `--status, -s` — filter by status (`open`, `held`, `in-review`, `landed`, `blocked`)

```sh
autharis swarm status
autharis swarm status --status open
```

### `autharis talent list`

Calls `client.talent.list()`.

```sh
autharis talent list
autharis talent list --status Active --page 1 --page-size 20
```

### `autharis invoice export <id>`

Calls `client.invoices.get(id)` and emits a plain-text receipt suitable for
piping — no ANSI codes.

```sh
autharis invoice export inv_123 > invoice.txt
```

### `autharis job create`

Interactive prompts (title, category, hours/week, rate range, skills, etc.),
then POSTs via `client.jobs.create()`. Prompt helper uses `node:readline` — no
inquirer dependency.

## Smoke check

```sh
pnpm typecheck   # tsc --noEmit -p tsconfig.json
```

## Files

- `src/index.ts` — oclif entry re-export
- `src/commands/**` — commands
- `src/lib/config.ts` — env + SDK client factory
- `src/lib/lanes.ts` — typed lanes.md parser
- `src/lib/ansi.ts` — hand-rolled ANSI helpers + table renderer
- `src/lib/prompt.ts` — readline prompt helpers
- `bin/run.mjs`, `bin/run.cmd` — launchers
- `scripts/install-local.sh` — pnpm link wrapper
