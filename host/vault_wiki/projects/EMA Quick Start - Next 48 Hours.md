---
title: EMA Quick Start — Next 48 Hours
created: '2026-04-03'
updated: '2026-04-03'
type: project
status: active
confidence: 0.95
tags:
  - ema
  - quick-start
  - immediate
  - next-steps
  - phase-1-wrap-up
  - phase-2-prep
summary: >-
  What to do in the next 48 hours to unblock Phase 2. Minimal, tactical
  checklist.
related:
  - '[[Projects/EMA Master Knowledge Base]]'
  - '[[Projects/EMA Phase 2 Implementation Guide]]'
wiki_id: projects/EMA_Quick_Start_-_Next_48_Hours
imported_from: vault/Projects/EMA Quick Start - Next 48 Hours.md
imported_at: '2026-04-04T00:23:56.884Z'
---

# EMA Quick Start — Next 48 Hours

> **Time Budget:** ~4 hours of focused work  
> **Goal:** Unblock Phase 2 start  
> **Outcome:** Daemon auto-start working, Bridge integrated, Phase 2 ready to build

---

## The Core Problem

Tauri can't connect to daemon on startup. `mix phx.server` isn't auto-launching or isn't listening.

**Status:** Phase 1 complete, but shipping is blocked on this single issue.

---

## Hour 1: Investigate Daemon Auto-Start

### 1.1 Does daemon start manually?

```bash
cd ~/Projects/ema/daemon
mix phx.server
# Wait 10s, should see: [info] Running EmaWeb.Endpoint with cowboy 2.x on http://localhost:4488
```

✅ If you see that → daemon works, problem is in Tauri startup.  
❌ If it fails → need to debug daemon startup (check logs).

### 1.2 Can you connect to it?

```bash
# In another terminal
curl http://localhost:4488/api/health
# Should return 200 + JSON

# Or check if port is listening
lsof -i :4488
# Should show: ruby/node/beam listening on 4488
```

✅ If curl works → daemon is fine, problem is in Tauri's connection logic.  
❌ If curl fails → daemon isn't listening (check logs, migrations, DB).

### 1.3 Check Tauri's startup script

```bash
cat ~/Projects/ema/app/tauri/src/main.rs
# or
cat ~/Projects/ema/app/.tauri-build.json
# Look for: daemon launch command, working directory, wait-for-port logic
```

**Common issues:**
- Daemon path is wrong (not `mix phx.server`, something else)
- Working directory is wrong (needs to be daemon/)
- No wait-for-port logic (app tries to connect before daemon is ready)
- Permissions issue (tauri can't execute mix)

### 1.4 Logs

```bash
# Daemon logs (if it's starting but failing)
tail -100 ~/Projects/ema/daemon/logs/dev.log

# Tauri logs (if app is starting but can't connect)
cat ~/Library/Logs/ema.log  # macOS
cat ~/.var/app/ema/data/logs/ema.log  # Linux
# Windows: %APPDATA%\ema\logs\

# System logs
journalctl -u ema --since "1 hour ago"  # systemd

# Quick debug: run tauri with logs
cd ~/Projects/ema/app
RUST_LOG=debug npx tauri dev 2>&1 | grep -E "daemon|connect|error"
```

**What to look for:**
- "Connection refused" → daemon not listening
- "Timeout" → daemon too slow to start
- "No such file or directory" → daemon binary path wrong
- Stack traces → actual error

---

## Hour 2: Fix (Most Likely Scenario)

### Scenario A: Daemon works manually, Tauri's startup is wrong

**Fix:** Update Tauri's daemon launch in `app/tauri/src/main.rs`:

```rust
// Find the daemon spawn code (probably in beforeDevCommand or beforeBuildCommand)
// It should look like:

let daemon = Command::new("sh")
  .arg("-c")
  .arg("cd daemon && mix phx.server")
  .current_dir("../daemon")
  .spawn()
  .expect("Failed to spawn daemon");

// Add wait-for-port logic:
let mut ready = false;
for i in 0..30 {
  match TcpStream::connect("127.0.0.1:4488") {
    Ok(_) => {
      ready = true;
      break;
    }
    Err(_) => {
      std::thread::sleep(Duration::from_millis(500));
    }
  }
}

if !ready {
  panic!("Daemon failed to start on localhost:4488");
}
```

**Or in `app/tauri.conf.json`:**

```json
{
  "build": {
    "beforeDevCommand": "cd daemon && mix phx.server &",
    "beforeBuildCommand": "",
    "devPath": "http://localhost:1420",
    "frontendDist": "../dist"
  }
}
```

Then retry: `npx tauri dev` from app/ directory.

### Scenario B: Daemon won't start

**Checklist:**
```bash
# 1. Do dependencies install?
cd ~/Projects/ema/daemon
mix deps.get
# Should complete without errors

# 2. Can you create DB?
mix ecto.create
# Should say "The database for Ema.Repo has been created"

# 3. Can you migrate?
mix ecto.migrate
# Should complete without "migration failed" messages

# 4. Can you compile?
mix compile
# Should complete without errors

# 5. Try again
mix phx.server
```

If any step fails, that's your blocker. Fix it before moving on.

---

## Hour 3: Verify Bridge Integration

### 3.1 Check Runner.run() callsites

```bash
cd ~/Projects/ema/daemon
grep -r "Runner.run" lib/ --include="*.ex" | wc -l
# Should be 6
```

**If 0:** Already migrated to Bridge (great!), skip to 3.4.  
**If >0:** Need to verify Bridge is ready.

### 3.2 Verify Bridge module exists

```bash
ls -la lib/ema/claude/bridge*.ex
# Should see: bridge.ex, stream_parser.ex, session_manager.ex, circuit_breaker.ex, cost_tracker.ex, governance.ex
```

**If missing files:** Bridge isn't fully built yet. Ask Claude Code to finish it.

### 3.3 Simple bridge test

```bash
# Start daemon
mix phx.server &

# In another terminal, test Bridge via IEx
iex -S mix

# In IEx:
Ema.Claude.Bridge.available?()
# Should return: true (Claude CLI is in PATH)

# Try a simple run
Ema.Claude.Bridge.run("Say hello", model: "haiku", timeout: 60_000)
# Should return: {:ok, %{result: "Hello!", cost: 0.01, ...}}
```

✅ If it works → Bridge is ready, move to 3.4.  
❌ If it fails → Bridge has bugs, need Claude Code to fix.

### 3.4 Verify at least one callsite is using Bridge

```bash
grep -r "Bridge\." lib/ --include="*.ex" | head -5
# Should see at least one use of Bridge.run() or Bridge.send()
```

**If none:** Need to convert one Runner callsite to Bridge to prove it works.

---

## Hour 4: Ready for Phase 2 Checklist

```bash
# Tests
cd ~/Projects/ema/daemon
mix test 2>&1 | tail -20
# Should end with: X passed (or X passed, Y skipped)
# NOT: "X failed"

# Format
mix format --check-formatted
# Should say: All files checked

# Pre-commit
mix precommit
# Should succeed

# Build artifact (optional but good to verify)
mix escript.build
# Should create ./ema binary
ls -lah ema
# Should be executable, ~20MB
```

✅ If all pass → **Phase 2 is unblocked, ready to start.**  
❌ If any fail → fix before moving on.

---

## If You're Stuck

| Problem | Solution |
|---------|----------|
| Daemon won't start | Check logs: `tail -50 daemon/logs/dev.log` or `mix phx.server` directly |
| Tauri can't connect | Verify daemon is listening: `lsof -i :4488` or `curl http://localhost:4488/api/health` |
| Bridge tests fail | Run Bridge.run() manually in IEx to see error messages |
| Tests fail | `mix test --failed` to run only failed tests, or `mix test.watch` for continuous feedback |

**Escalation:** If stuck >30min on any issue, ask Claude Code to debug it.

---

## Success Looks Like

After 4 hours, you should have:

1. ✅ Daemon starts manually: `mix phx.server` works
2. ✅ Tauri launches daemon: `npx tauri dev` doesn't show "Connection error"
3. ✅ Tests pass: `mix test` shows X passed
4. ✅ Bridge works: `Ema.Claude.Bridge.run(...)` succeeds
5. ✅ At least one proposal generates end-to-end without timeout
6. ✅ `git status` is clean (no uncommitted changes breaking tests)

At that point: **Phase 2 is ready to start.**

---

## Phase 2 First Steps (After 48-hour fix)

Once unblocked:

1. **Create feature branch:** `git checkout -b phase-2/persistent-sessions`
2. **Read Phase 2 guide:** [[Projects/EMA Phase 2 Implementation Guide]]
3. **Start with 2.1.1:** Wire Bridge into proposal pipeline
4. **Commit frequently:** Small, testable chunks
5. **Run tests after each commit:** `mix test`

Estimated Phase 2 duration: **3 weeks** (cumulative)

---

## Reference Files

- **Master knowledge base:** [[Projects/EMA Master Knowledge Base]]
- **Phase 2 implementation guide:** [[Projects/EMA Phase 2 Implementation Guide]]
- **Current sprint status:** [[Projects/EMA Sprint Status]]
- **Daemon CLAUDE.md:** `~/Projects/ema/CLAUDE.md`
- **Architecture roadmap:** [[Architecture/EMA Full Integration Roadmap]]

---

## TL;DR (The Absolute Minimum)

1. Start daemon: `cd ~/Projects/ema/daemon && mix phx.server`
2. Check it works: `curl http://localhost:4488/api/health`
3. Run tests: `mix test`
4. If tests pass and curl works: **You're done. Phase 2 is unblocked.**

Time needed: ~30 minutes if everything works, up to 2-3 hours if you need to debug.

**Current time:** 2026-04-03 20:30 UTC  
**Recommended start:** 2026-04-03 21:00 UTC (now) or 2026-04-04 morning  
**Target completion:** 2026-04-05 morning
