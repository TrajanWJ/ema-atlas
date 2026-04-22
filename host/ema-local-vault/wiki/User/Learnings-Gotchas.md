---
title: "Learnings & Gotchas"
space: wiki
tags: ["user","learnings","gotchas"]
source: migrated-from-obsidian
---

# Learnings & Gotchas

Migrated from Obsidian `Learnings & Gotchas/` on 2026-04-06.

## 2026-03-13: Vault Instructions Don't Self-Enforce

**Context:** After 2 days of setting up comprehensive CLAUDE.md with forced agent dispatches, session logging, gotcha capture, and project note updates.

**Problem:** None of the "mandatory" behaviors were happening. No session logs, no gotchas, no agent dispatches, no project note updates.

**Root cause:** CLAUDE.md instructions are soft text, not programmatic enforcement. Under context pressure, instruction-following degrades. When coding in project dirs, vault CLAUDE.md doesn't even load.

**Fix:** Remove aspirational forced dispatch instructions. Keep instructions realistic and few. Build habits rather than relying on AI compliance.

**Lesson:** A simple CLAUDE.md followed 80% of the time beats a comprehensive one followed 10%. Hooks and habits > text instructions.

## 2026-03-16: Never Restart systemd-logind Live

**Context:** Modifying logind.conf on KDE Wayland session.

**Problem:** `systemctl restart systemd-logind` killed all login sessions, orphaned kwin_wayland (DRM permission denied), locked out of desktop.

**Fix:** Required multiple SDDM restarts from TTY2. Lost all open windows.

**Lesson:** Let logind.conf changes take effect on next boot/login. Never restart logind live. Same for SDDM.

## 2026-03: wa-sqlite Turbopack Breaks WASM

**Context:** Next.js 16.2.0 with Turbopack bundling wa-sqlite.

**Problem:** Worker crashes loading wa-sqlite. WASM 404 or `WebAssembly.RuntimeError: Aborted`.

**Root cause:** Turbopack bundles `wa-sqlite-async.mjs` into a chunk, rewriting `import.meta.url` so sibling `.wasm` file URL breaks.

**Fix:** Copy wa-sqlite files to `public/`, write plain-JS worker at `public/db-worker.js` with absolute URL imports.

**Lesson:** Never reference WASM-loading Emscripten `.mjs` files via bundled module imports. Serve them statically.

## 2026-04-06: Worktree Salvage — Check Compilability Before Merging

**Context:** Recovering ~5000 lines of code from parallel agent worktrees (HQ modules, domain modules, CLI extensions).

**Problem:** Worktree agents build code in isolation. Their modules may reference schemas, functions, or configs that don't exist on main. Blindly copying files creates compilation errors.

**Fix:** After copying files from a worktree, always run `mix compile` before committing. Fix missing references, adjust imports, stub missing dependencies.

**Lesson:** Treat worktree output as draft code that needs integration review, not finished modules.

## 2026-04-06: IntentionFarmer Was Already on Main

**Context:** Attempting to re-assemble intent-related code from worktrees for the Intent Engine bootstrap.

**Problem:** Spent time looking for IntentionFarmer code in worktrees when it had already been merged to main. The full `lib/ema/intention_farmer/` directory (14 files) was present.

**Lesson:** Always `git log --oneline -- <path>` or check main before assuming code needs to be recovered from worktrees. Don't re-assemble what's already merged.

## 2026-04-06: MCP Tool Params Must Match Controller Expectations

**Context:** Wiring MCP tools for the Intent Engine to the API.

**Problem:** MCP tool definitions used flat params (`title`, `level`, `parent_id`) but the controller expected nested params (`%{"intent" => %{...}}`), or vice versa. This caused silent failures — the MCP tool would return success but the controller would ignore unrecognized param shapes.

**Fix:** Ensure MCP tool `call/3` functions transform flat args into the shape the controller/context function expects. Test the full path: MCP call -> controller -> context -> DB.

## 2026-04-06: Always Add Routes Before Referencing in CLI

**Context:** Building CLI commands for `ema intent list/tree/show/create`.

**Problem:** CLI commands call the daemon API. If the route doesn't exist yet, the CLI silently gets a 404 or crashes with an unhelpful error.

**Fix:** Build order: migration -> schema -> context -> controller -> router -> MCP tool -> CLI command. Each layer depends on the one below it.

## 2026-04-06: SystemBrain Projection Is the Right Pattern for Derived State

**Context:** Making intent state visible in the vault without polluting curated wiki pages.

**Problem:** Need intents visible as markdown for context assembly and human review, but generating wiki pages directly would overwrite curated content.

**Solution:** SystemBrain writes to `vault/system/state/intents.md` — a generated space explicitly separate from the curated wiki. PubSub-driven with debounce. The file is clearly marked as auto-generated.

**Lesson:** When you need derived/computed state as files, use a projection pattern: subscribe to events, write to a designated generated directory, never touch curated spaces. This is the same pattern used for `projects.md`, `notes.md`, `proposals.md` state files.

## Related
- [[Stack Decisions]]
- [[Intent Engine]]
