# EMA Workspace Prep and Wiring Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the Desktop EMA workspace route agents, humans, and swarms to the real 0.0.6 runtime while preserving the existing dirty implementation slice.

**Architecture:** Treat `/Users/trajanm4air/Desktop` as the EMA instance root, `Projects/` as durable records, and `Active builds/EMA-0.0.6/` as the current implementation root. Cleanup is documentation, resolver, and verification hygiene first; destructive cleanup, folder deletion, and git history decisions stay out of this pass.

**Tech Stack:** EMA CLI (`ema`), Gleam/BEAM daemon, Next.js web shell, Tauri desktop shell, Markdown project records.

---

### Task 1: Align Agent Entrypoint Docs

**Files:**
- Modify: `/Users/trajanm4air/Desktop/AGENTS.md`
- Modify: `/Users/trajanm4air/Desktop/CLAUDE.md`
- Modify: `/Users/trajanm4air/Desktop/Active builds/README.md`
- Modify: `/Users/trajanm4air/Desktop/Projects/EMA/README.md`
- Modify: `/Users/trajanm4air/Desktop/Projects/EMA/atlas/README.md`
- Modify: `/Users/trajanm4air/Desktop/Active builds/EMA-0.0.6/AGENTS.md`

- [ ] **Step 1: Replace current EMA runtime pointers**

  Update current EMA build references from `0.0.5` to `0.0.6` in the files above, while keeping `0.0.5` described as prior history that must be preserved.

- [ ] **Step 2: Preserve the project/build distinction**

  Ensure the docs continue to say `EMA` is the project, `0.0.6` is a build, `Projects/EMA/atlas/` is the project atlas, and no `Projects/EMA-0.0.6/`, `Projects/atlas/`, or Desktop-level `EMA-atlas/` should be created.

- [ ] **Step 3: Verify stale active pointers are gone from entrypoint docs**

  Run:

  ```bash
  rg -n "current (active code|build record|implementation work|runtime work).*0\\.0\\.5|EMA_HOME=Active builds/EMA-0\\.0\\.5|default .*Active builds/EMA-0\\.0\\.5" \
    /Users/trajanm4air/Desktop/AGENTS.md \
    /Users/trajanm4air/Desktop/CLAUDE.md \
    /Users/trajanm4air/Desktop/Active\ builds/README.md \
    /Users/trajanm4air/Desktop/Projects/EMA/README.md \
    /Users/trajanm4air/Desktop/Projects/EMA/atlas/README.md \
    /Users/trajanm4air/Desktop/Active\ builds/EMA-0.0.6/AGENTS.md
  ```

  Expected: no matches that describe `0.0.5` as current.

### Task 2: Confirm Workspace Wiring

**Files:**
- Read-only: `/Users/trajanm4air/.local/bin/ema`
- Read-only: `/Users/trajanm4air/Desktop/Projects/EMA/project.md`
- Read-only: `/Users/trajanm4air/Desktop/Projects/EMA/code`

- [ ] **Step 1: Verify the CLI wrapper target**

  Run:

  ```bash
  sed -n '1,80p' /Users/trajanm4air/.local/bin/ema
  ```

  Expected: `EMA_HOME_DEFAULT="$HOME/Desktop/Active builds/EMA-0.0.6"`.

- [ ] **Step 2: Verify the project symlink**

  Run:

  ```bash
  readlink /Users/trajanm4air/Desktop/Projects/EMA/code
  ```

  Expected: `../../Active builds/EMA-0.0.6`.

- [ ] **Step 3: Verify runtime listeners**

  Run:

  ```bash
  lsof -nP -iTCP -sTCP:LISTEN | rg "(49555|5173|27182)"
  ```

  Expected: daemon on `127.0.0.1:49555` and web on `*:5173`; companion `127.0.0.1:27182` is expected only when the native companion is running.

### Task 3: Record Remaining Non-Destructive Follow-Ups

**Files:**
- Modify only if a new follow-up is found: daemon queue via `ema queue add`
- Read-only: `/Users/trajanm4air/Desktop/Active builds/EMA-0.0.6/docs/orchestration/STATUS.md`

- [ ] **Step 1: Check EMA-scoped next action**

  Run:

  ```bash
  ema next --project EMA --json
  ema agent meta-progress --json
  ```

  Expected: a ready queue item or lane is visible; no chat-only follow-up remains.

- [ ] **Step 2: Queue remaining drift instead of widening this pass**

  If resolver metadata still reports `Active builds/EMA-0.0.5` for EMA after doc cleanup, add:

  ```bash
  ema queue add --project EMA \
    --title "Fix EMA resolver active-build metadata drift from 0.0.5 to 0.0.6" \
    --why "Docs, wrapper, symlink, and runtime processes point to EMA 0.0.6, but some daemon workspace-scope projections still report EMA 0.0.5." \
    --done-when "ema agent orient --project EMA --json reports Active builds/EMA-0.0.6 and orientation docs no longer route agents through 0.0.5." \
    --source "docs/superpowers/plans/2026-05-10-ema-workspace-prep-and-wiring.md" \
    --json
  ```

  Expected: a daemon queue item id is returned.

### Task 4: Verification Gate

**Files:**
- Read-only verification over changed docs and active runtime.

- [ ] **Step 1: Check for broken Markdown conflict markers**

  Run:

  ```bash
  rg -n "[<]{7}|[=]{7}|[>]{7}" \
    /Users/trajanm4air/Desktop/AGENTS.md \
    /Users/trajanm4air/Desktop/CLAUDE.md \
    /Users/trajanm4air/Desktop/Active\ builds/README.md \
    /Users/trajanm4air/Desktop/Projects/EMA/README.md \
    /Users/trajanm4air/Desktop/Projects/EMA/atlas/README.md \
    /Users/trajanm4air/Desktop/Active\ builds/EMA-0.0.6/AGENTS.md \
    /Users/trajanm4air/Desktop/Active\ builds/EMA-0.0.6/docs/superpowers/plans/2026-05-10-ema-workspace-prep-and-wiring.md
  ```

  Expected: no matches.

- [ ] **Step 2: Verify current web shell still responds**

  Run:

  ```bash
  curl -sS -I http://localhost:5173 | sed -n '1,12p'
  ```

  Expected: HTTP `200 OK` from Next.js.

- [ ] **Step 3: Summarize without claiming repo-wide cleanliness**

  Report changed files, commands run, and remaining known drift. Do not claim the broad dirty implementation slice is clean unless `git status --short` proves it.
