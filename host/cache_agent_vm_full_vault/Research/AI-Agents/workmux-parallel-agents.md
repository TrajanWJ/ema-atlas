---
title: "workmux — Parallel Agent Development with Git Worktrees"
created: 2026-04-04
updated: 2026-04-04
type: research
status: active
tags: [EMA, git-worktrees, tmux, parallel-agents, developer-tooling]
---

# workmux — Parallel Agent Git Worktree Manager

> **Source:** https://github.com/raine/workmux  
> **Docs:** https://workmux.raine.dev  
> **Researched:** 2026-04-04 by Right Hand  
> **Verdict: Skip for EMA. Useful for Trajan's host projects (execudeck, proslync) if he runs multiple agents there. Not applicable to the VM agent architecture.**

---

## What workmux Does

workmux = `git worktree add` + `tmux new-window` + lifecycle glue, as a single Rust CLI.

**What git worktree alone doesn't do:**
- Doesn't copy `.env` files into the new worktree
- Doesn't symlink `node_modules` (each worktree would need its own install)
- Doesn't create or configure tmux windows/panes
- Doesn't run `post_create` hooks (mix deps.get, npm install, etc.)
- Doesn't provide `workmux merge` — which does: git merge, close tmux window, delete worktree dir, delete local branch — in one command
- No dashboard for monitoring multiple running agents
- No `/worktree` skill for delegating tasks to an agent in a named worktree

**Full workflow:**
```bash
workmux add fix-proposal-engine    # creates worktree + tmux window + runs hooks + starts agent
# ... agent works in isolation on its own branch ...
workmux merge                      # merge, cleanup, close window — done
```

**Config (`.workmux.yaml`):**
```yaml
agent: claude
panes:
  - command: <agent>
    focus: true
  - split: horizontal   # shell pane
post_create:
  - mix deps.get        # for Elixir projects
files:
  copy:
    - .env
  symlink:
    - node_modules      # only relevant for Node
```

**Dashboard:** TUI for viewing all active agent windows, their status, diffs, sending commands.

**Sandbox mode:** Can wrap each worktree in a container or VM. Optional, adds friction.

**Agent status in tmux window names:** Integrates with Claude Code to show ✓/✗/⏳ in the window title.

**LLM branch naming:** `workmux add "fix the proposal scoring bug"` → auto-generates branch name via LLM.

**Supported terminals:** tmux (primary), kitty, WezTerm, Zellij.

---

## EMA's Current Parallel Agent Setup

**EMA lives on the VM** (`~/Projects/ema/`), not on the host. Trajan's host projects (execudeck, proslync, etc.) live at `~/Desktop/Coding/Projects/` on FerrissesWheel.

**How parallel coding tasks work today on EMA:**

Right Hand dispatches coding work via `~/bin/host-claude.sh` for host projects, or direct `claude --print --permission-mode bypassPermissions` on the VM for VM work.

For EMA specifically (Phase 2 build per `PHASE2_EXECUTION_PLAN.md`):
- EMA dispatches tasks to itself via its own task system (proposal → intent → dispatch → Coder agent)
- Coder agents run on the VM via Claude Code, working directly in `~/Projects/ema/`
- No worktrees currently — agents share the same working directory
- No parallel branch isolation

**The "agents stepping on each other" problem:**
Currently real. If two Coder agents are dispatched to EMA simultaneously, they both modify files in `~/Projects/ema/` on the same branch. This causes conflicts, confusion, and corrupted state. The Phase 2 execution plan tries to serialize dispatch to avoid this (one intent at a time), but that's a workaround not a solution.

---

## Could workmux Help EMA?

**The honest answer: only marginally, and the fit is awkward.**

### What it would solve
- Isolation between parallel agent tasks on EMA: each feature branch gets its own worktree dir, agents can't stomp each other's files
- Automated `mix deps.get` on worktree creation
- Clean merge lifecycle

### Why it's a bad fit

**1. EMA's dispatch is programmatic, not interactive.**  
workmux is a human-invoked CLI tool. The workflow is: human runs `workmux add feature-name`, human monitors dashboard, human runs `workmux merge`. EMA needs to dispatch agents *from its own task system* — that means programmatic worktree creation, not manual CLI invocation. You'd have to script around workmux to get it into an automated dispatch loop, at which point you're basically reimplementing `git worktree add` with extra steps.

**2. The tmux window model is for human monitoring, not agent orchestration.**  
EMA's agents run headlessly via `claude --print` piped through `host-claude.sh` or direct exec. They don't need or use tmux windows. The dashboard and window-per-task model assumes a human is watching tabs. EMA's equivalent is Discord output and TASKS.md.

**3. Elixir support is unconfirmed but doable.**  
workmux is not Node-centric — the `post_create` hooks and file operations are generic. You can run `mix deps.get` and copy `.env` just as well as `npm install`. But the killer feature (symlink `node_modules` for fast setup) doesn't apply. Elixir worktree setup is just `mix deps.get` — that's already fast and a non-issue.

**4. EMA is building its own Campaign system (Feature 9)** that will handle multi-agent parallelism with topology graphs. That's the right layer for parallel agent isolation in EMA's context — not a CLI tool.

---

## Where workmux IS a Good Fit

**Trajan's host projects** (execudeck, proslync, etc.) if he ever wants to run multiple Claude Code agents in parallel on the same repo. That's exactly the use case workmux was built for: human developer + tmux + multiple agent-per-branch workflows. One command setup, one command cleanup, dashboard for monitoring.

Install: `brew install raine/workmux/workmux` on the host.

---

## Comparable Tools

| Tool | Approach | Fit |
|---|---|---|
| `git worktree` + shell scripts | DIY | Works, more control, more work |
| **workmux** | Opinionated CLI glue | Best for interactive human + agent workflows |
| tmuxp / tmuxinator | tmux layout templates only | No worktree support |
| agent-tmate | tmate-based remote agent sharing | Different problem (remote access, not isolation) |
| EMA Campaign Manager | Programmatic topology | Right layer for EMA's needs |

---

## Recommendation

**Skip for EMA's core dispatch pipeline.** The architecture mismatch is fundamental — workmux is interactive CLI, EMA needs programmatic dispatch.

**Consider for the host** if Trajan starts running multiple Claude Code agents on the same host repo in parallel. Install is one brew command, zero config needed to get value.

**For EMA's parallel agent problem:** the real fix is Campaign Manager (Feature 9) with proper worktree-per-task automation baked into the dispatch contract. When that ships, it can call `git worktree add` directly in the Elixir dispatch layer without needing workmux as an intermediary.

---

## Links

- Repo: https://github.com/raine/workmux
- Docs: https://workmux.raine.dev
- Blog intro: https://raine.dev/blog/introduction-to-workmux/
- EMA Campaign Manager spec: `~/Projects/ema/docs/NEW_FEATURES_SPEC.md` (Feature 9)
- EMA Phase 2 execution plan: `~/Projects/ema/docs/PHASE2_EXECUTION_PLAN.md`
