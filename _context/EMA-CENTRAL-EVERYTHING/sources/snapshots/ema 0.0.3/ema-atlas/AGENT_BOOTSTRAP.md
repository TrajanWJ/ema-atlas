# Agent Bootstrap

How a fresh agent on a fresh machine joins the EMA/Hermes work. Two paths
depending on what's already on the machine.

> **Self-check first.** Before you do anything else, run `./scripts/probe.sh`
> (added in this pack) — it prints which path you are on.

---

## Path A — Machine already has EMA installed

You should see:
- a clone of the canonical EMA repo (typically `~/Projects/ema/`)
- `daemon/` directory with `mix.exs`, `lib/ema/control_plane/`, etc.
- a `workspace/shared/` directory inside that repo
- maybe a running Hermes API server on localhost

**Do this:**

1. `cd` into the EMA repo, run `git status`, `git log -20`. Check whether
   you are on a working branch or detached.
2. `cat docs/AGENT-CONTRACT.md` — internalize capability locality.
3. `cat docs/HERMES-EMA-AI-ENGINE-INTERFACE-PLAN.md`
4. `cat docs/HERMES_HARNESS_DRIVER_REGISTRY.md`
5. `ls workspace/shared/exports/` — read the latest
   `HERMES_EMA_LINEAGE_META_HARNESS_AUDIT_*.md`.
6. Check Hermes: `curl -fsS http://localhost:<hermes-port>/health || echo "Hermes not running"`.
7. Read the canonical rule on a sticky note in your head:
   **EMA owns truth. Hermes owns execution. Surfaces do not own state.**

You can now skip the rest of this file and go to `AGENT_TRAVERSAL.md`.

---

## Path B — Machine does NOT have EMA installed

You are bootstrapping the *ecosystem* on this machine so it can work with EMA.
Do this top-to-bottom; nothing here mutates anyone else's machine.

### B.1 — Workspace layout

```
~/ema-workspace/
  ├─ transfer-pack/          # this repo (the one you're reading)
  ├─ ema/                    # the canonical EMA repo, when cloned
  ├─ scratch/                # your throwaway working dir
  └─ shared/                 # symlink-target for workspace/shared once EMA is local
```

```bash
mkdir -p ~/ema-workspace/{scratch,shared}
cd ~/ema-workspace
# this transfer pack
[ -d transfer-pack ] || git clone https://github.com/TrajanWJ/ema-transfer-pack-20260422-060938.git transfer-pack
cd transfer-pack && git fetch --all && cd ..
```

### B.2 — Toolchain

EMA is Elixir/Phoenix on BEAM. Install once:

| OS | Command |
|---|---|
| macOS (Homebrew) | `brew install elixir erlang postgresql@16 git gh node` |
| Debian/Ubuntu | `sudo apt install -y elixir erlang-dev postgresql git gh nodejs` |
| Arch | `sudo pacman -S elixir postgresql git github-cli nodejs` |

Verify: `elixir --version && erl -version && psql --version && gh --version`.

For the surface stack (TypeScript/Discord/web): `node -v` ≥ 20, `pnpm` or
`npm`. For the eventual Next.js Launchpad/HQ shell: same Node, plus the
Vercel CLI is recommended (`npm i -g vercel`).

### B.3 — GitHub auth

```bash
gh auth status || gh auth login
git config --global user.name  "$(git config user.name  || echo 'me')"
git config --global user.email "$(git config user.email || echo 'me@local')"
```

### B.4 — Pull the canonical EMA codebase

The EMA repo proper is **not** in this transfer pack. To work on EMA itself
you need the live repo. The transfer pack mirrors a sanitized snapshot under
`codebase-ema` for read-only reference. Two options:

```bash
# Option 1: live repo (requires access)
gh repo clone TrajanWJ/ema ~/ema-workspace/ema

# Option 2: read-only snapshot from this transfer pack
cd ~/ema-workspace/transfer-pack
git worktree add ../ema-snapshot codebase-ema
ls ../ema-snapshot/code/ema/
```

### B.5 — First-run sanity (Path B continued)

If you have the live repo:

```bash
cd ~/ema-workspace/ema
mix deps.get
mix compile
# DB (only if your task needs it)
mix ecto.create && mix ecto.migrate
# daemon
iex -S mix
```

The daemon's supervision tree (`lib/ema/application.ex`) should boot the
control_plane, sessions, and babysitter trees. If those modules are missing,
your snapshot is older than the canonical lineage — fall back to
`codebase-ema` from the transfer pack.

### B.6 — Hermes

Hermes is a separate runtime. On the original agent-vm it ran as an HTTP API
server speaking the contract documented in
`code/ema/docs/HERMES-EMA-AI-ENGINE-INTERFACE-PLAN.md`. If you don't have
Hermes locally, the EMA daemon can run with the `simulated-tui` driver only
(see `code/ema/docs/HERMES_HARNESS_DRIVER_REGISTRY.md`). That is enough to
exercise control-plane logic without execution.

### B.7 — Shared workspace symlink

```bash
ln -snf ~/ema-workspace/ema/workspace/shared ~/ema-workspace/shared
```

This keeps the human-and-agent durable state at one stable path even if you
move the EMA clone.

---

## Both paths — finish here

Read these in order, all live in this transfer pack on `main`:

1. `MACBOOK_AGENT_HANDOFF_MASTER.md` — the single-file passover brief
2. `SYSTEM_GRAPH.md` — the lineage graph
3. `AGENT_TRAVERSAL.md` — how to load context efficiently from the graph
4. `05-fresh-context-project-app-model.md` — newest user-direct PRD framing
5. `04-agent-orchestration-and-shared-workspace-briefing.md`
6. `03-architectural-evolution-and-major-decisions.md`
7. `02-project-transfer-brief.md`
8. `01-best-prompt-and-answer.md` — example of the joining prompt

Then internalize:

> **EMA owns truth. Hermes owns execution. Surfaces do not own state.**

You are bootstrapped.

---

## What this bootstrap deliberately does NOT do

- Does **not** install or modify the canonical EMA repo for you.
- Does **not** start any peer/P2P transport — that work is deferred until
  local semantics are pinned (see `graph/edges/transport.md`).
- Does **not** seed any production data — the `recovery-*` branch is fixture
  material only.
- Does **not** make architectural decisions on your behalf — see
  `graph/edges/identity.md` for the open ones.
