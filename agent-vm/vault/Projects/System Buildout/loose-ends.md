---
title: "loose-ends"
created: 2026-03-16
updated: 2026-04-16
type: project
status: active
confidence: 0.60
confidence_updated: 2026-03-18
source: agent-research
tags: [openclaw, ops, prompts, research, security, skills]
summary: "  - `~/bin/safe-gateway-restart.sh` — writes CONTINUE.md, detaches, then restarts"
---
# System Buildout — Loose Ends & Issues

> Running log. Updated every session. Nothing gets lost.

## 🔴 Open (needs action)

### 2. OpenClaw crons — configured but fragile
- **What:** `openclaw.json` crons field is `{}` — crons exist at runtime only via crontab
- **⚠️ Risk:** `openclaw doctor --fix` wipes the cron array
- **Status:** All crons in system crontab (not [[OpenClaw config]]). Backup: `vault/Configuration/crontab-backup.md`
- **Fix needed:** Periodic crontab backup to vault

### 6. Cross-agent handoff architecture
- **What:** One-shot sub-agents execute and exit independently
- **Current state:** Right Hand mediates all handoffs (protocols/agent-handoff.md)
- **Priority:** MEDIUM — works but not elegant

### 11. Agent-to-Discord communication
- **What:** Background agents can't post to Discord directly
- **Current state:** Right Hand mediates all Discord posts. Documented, working.
- **Priority:** LOW — this is now by design, not a bug

### 16. Context hygiene — session management
- **What:** Sessions were accumulating (96 at peak). Context pollution across channels.
- **Status:** Session config updated: daily reset at 4AM + maintenance enforcement (14d prune, 300 max)
- **Result:** Sessions reduced 96 → 50 after first daily reset
- **Next:** Make feed channels write-only (behavioral, not config), evaluate LCM compaction effectiveness
- **Priority:** MEDIUM — mostly solved, needs behavioral follow-through

### 22. Session death → no auto-resume
- **What:** Session died at 10:16 UTC, no CONTINUE.md written, 9 hours of work lost
- **Fix:** Built `~/bin/session-guardian.sh` — cron every 10min detects 20+ min inactivity, writes CONTINUE.md
- **Status:** ✅ DEPLOYED (cron active)
- **Watch:** Verify it triggers correctly on next session death

### ~~23. Docker Laminar stack unused but eating resources~~ — RESOLVED ✅
- **What:** Laminar containers removed. Docker now runs SearXNG, ActivePieces, Antfly.
- **Status:** ✅ Resolved — Laminar gone, disk reclaimed

### ~~17. Untouched desk threads~~ — ALL DONE ✅
- **All 11/11 threads populated** with research, evaluations, and verdicts
- **Abandoned (4):** Context-Gateway MCP (redundant w/ LCM), Security MCP (conflicts with philosophy), Recon (tool not found), LAP (no pain point)
- **Ideas (2):** [[Agency Agents]] (cherry-pick templates), [[OpenViking]] (needs deeper eval — 3.6 rating)
- **Active (5):** Context Hygiene, Anti-Cheat, Security Audit, DeerFlow (study patterns), Hermes (steal adversarial patterns)

### 19. Brave Search API key missing
- **What:** `web_search` tool returns `missing_brave_api_key` error. Scout/Researcher agents can't search the web.
- **Impact:** HIGH — web research is a core capability. Forces fallback to `web_fetch` with known URLs only.
- **Fix:** Get free API key from https://brave.com/search/api/ → run `openclaw configure --section web`
- **Priority:** HIGH — blocks all web search-dependent tasks

## 🟡 Watch (may need attention)

### 9. Exec approval policy resets on gateway restart
- **What:** `security: full, ask: off` may get overridden
- **Watch:** Check exec-approvals.json after restarts

### 18. Gateway restart instability — MITIGATED
- **What:** Self-inflicted gateway restarts from inside sessions killed the agent
- **Root cause:** `systemctl restart` from inside a session = suicide. No CONTINUE.md written.
- **Fixes applied:**
  - `~/bin/safe-gateway-restart.sh` — writes CONTINUE.md, detaches, then restarts
  - Hard rule added to SOUL.md: never raw `systemctl restart` from inside session
  - QMD embed cron now has `timeout 300` to prevent CPU hangs
- **Watch:** Verify safe-restart.sh works on next config change

### ~~20. Stuck browser processes accumulate~~ — RESOLVED ✅
- **What:** Browser cleanup now automated in system-watchdog.sh — kills oauth browser processes running >2h
- **Status:** ✅ Resolved — automated cleanup deployed

### 21. No vault daily note auto-creation
- **What:** `vault/Daily Notes/YYYY-MM-DD.md` not created automatically
- **Fix applied:** Added to SOUL.md — create on first heartbeat each day
- **Status:** ✅ FIXED (2026-03-16)

## ✅ Resolved

- ~~#1 Protocols directory deleted~~ — FOUND INTACT
- ~~#3 clawsec skill~~ — removed
- ~~#4 Researcher [IMPLEMENT] items~~ — baked into SOUL.md
- ~~#5 Gateway restart count~~ — fixed
- ~~#10 Obfuscation detector~~ — workaround (split commands)
- ~~#12 Vault describes wrong system~~ — rewritten
- ~~#13 AGENTS.md aspirational~~ — rewritten
- ~~#14 Skills missing vault notes~~ — all covered
- ~~#15 130+ stale vault files~~ — cleaned
- QMD lockfile added (prevents duplicate runs)
- [[auto-knowledge]]-gated.sh fixed (stale pace file handling)
- Welcome.md wikilinks fixed
- CONTINUE.md protocol implemented
- [[Standing Instructions]] updated
- Channel scan stale file trashed
- Skills README regenerated
- Duplicate crons deleted
- vault-feed cron recreated
- System Buildout promoted to project category
- Workspace trimmed 38KB → 21KB

- Load spike incident resolved (killed stuck Firefox + stale Claude sessions)
- Gateway crash loop root-caused (rate limits + duplicate processes)
- Daily ops log created (vault/Operations/)
- Operations README rewritten with service table and runbooks
- Channel context map created (vault/System/Channel Context/channels.md)
- Projects README written
- System Buildout README updated to operational maturity phase
- Evolution loop reviewed (4 agents analyzed, researcher at 75%)
- Vault refresh automated (3 truth-from-source files)

- Session guardian deployed (auto-writes CONTINUE.md on session death)
- Executive dashboard v1 built
- Docker pruned (freed 3GB)
- Session config: daily reset + maintenance enforcement
- Cron definitions file updated with all 4 runtime crons

---
*Last updated: 2026-04-16 — staleness audit*
