---
title: Research Round 3 - Deprecation and Advancement Analysis
created: '2026-03-16'
updated: '2026-03-16'
type: research
status: active
confidence: 0.4
confidence_updated: 2026-03-18T00:00:00.000Z
source: auto-capture
tags:
  - general
summary: >-
  the system has grown fast. 28 skills installed, 16 agents defined, 15 cron
  jobs running, 7 vault sections active. But growth has outpaced pruning. Thi
wiki_id: research/Research_Round_3_-_Deprecation_and_Advancement_Analysis
imported_from: vault/Research/Research Round 3 - Deprecation and Advancement Analysis.md
imported_at: '2026-04-04T00:23:57.108Z'
---
# Research Round 3 — Deprecation and Advancement Analysis

**Date:** 2026-03-16
**Author:** 🏗️ Architect (System Tier 2)
**Status:** Complete
**Scope:** Full system audit — skills, agents, cron, vault, config

---

## Executive Summary

the system has grown fast. 28 skills installed, 16 agents defined, 15 cron jobs running, 7 vault sections active. But growth has outpaced pruning. This audit identifies **8 redundant skills**, **3 broken/non-functional skills**, **4 overlapping cron jobs**, **2 stale vault sections**, and **3 agents that should be consolidated**. It also maps a concrete advancement roadmap for Phase 3+.

---

## 1. Skill Audit — Redundant, Broken, or Overlapping

### 🔴 BROKEN / NON-FUNCTIONAL

| Skill | Issue | Evidence |
|---|---|---|
| **clawsec** | SKILL.md is empty (0 lines). Has only a lowercase `skill.md` which describes a ClawSec MITM proxy — a monitoring tool that requires separate infrastructure (local CA, asyncio proxy) that is **not deployed**. | `ls -la` shows no scripts, no executable code. The proxy is not running on the VM. |
| **taskr** | Requires `MCP_API_URL`, `MCP_USER_API_KEY`, `MCP_PROJECT_ID` env vars — **none are set**. Cannot function without a Taskr.one account. | `env | grep MCP_` returns nothing. Dead on arrival. |
| **[[discord-voice]]** | 9 code files, 4877 LOC, 744KB — the largest skill. Requires Discord voice gateway integration, opus codecs, real-time audio pipeline. **Not integrated with current System architecture** and untested against current [[OpenClaw]] version. | No cron, no agent references it, no evidence of successful voice session. |

### 🟡 REDUNDANT — Merge or Remove

| Cluster | Skills | Overlap | Recommendation |
|---|---|---|---|
| **Security (4 skills!)** | `clawdefender`, `clawsec`, `security-audit-toolkit`, `openclaw-guardian-ultra` | All do security scanning/auditing with different scopes. `clawdefender` = input sanitization, `security-audit-toolkit` = codebase audit, `openclaw-guardian-ultra` = gateway health watchdog, `clawsec` = broken MITM proxy. | **Keep:** `clawdefender` (agent input safety) + `security-audit-toolkit` (code audit). **Remove:** `clawsec` (broken). **Merge** `openclaw-guardian-ultra` into gateway watchdog scripts (it duplicates what `gateway-watchdog.sh` already does). |
| **Config guardians (2 skills)** | `config-guardian`, `openclaw-guardian-ultra` | Both protect [[OpenClaw config]]. `config-guardian` = safe config updates with backup/rollback. `openclaw-guardian-ultra` = broader watchdog including config. | **Keep:** `config-guardian` (focused, works). **Demote** guardian-ultra to reference doc. |
| **Browser automation (2 skills)** | `fast-browser-use`, `agent-browser` | Both are Rust-based headless browser tools. `fast-browser-use` is 548KB with 60 code files. `agent-browser` is 32KB, instructions-only with Node.js fallback. | **Keep:** `fast-browser-use` (more capable, actively used by Scout). **Remove:** `agent-browser` (subset of fast-browser-use). |
| **News/digest (2 skills)** | `news-summary`, `ai-daily-digest` | Both fetch RSS feeds and produce summaries. `news-summary` = general international news. `ai-daily-digest` = Karpathy's 90 tech blogs with AI scoring. | **Keep both** — different domains. But **deduplicate** the RSS fetching infrastructure. Consider merging into a single "feeds" skill with configurable source lists. |
| **[[OpenClaw]] ops (2 skills)** | `openclaw-anything`, `openclaw-claude-code-skill` | `openclaw-anything` = CLI wrapper + docs. `openclaw-claude-code-skill` = full ops skill (gateway, OAuth, tokens, cron, health). Massive overlap — both manage [[OpenClaw]]. | **Keep:** `openclaw-claude-code-skill` (more complete — covers OAuth guardian, agent orchestration). **Merge** useful CLI reference from `openclaw-anything` into it. **Remove** `openclaw-anything` as standalone. |
| **Research (2 skills)** | `deep-research-pro`, `deep-scraper` | Different tools: `deep-research-pro` = web search + synthesis. `deep-scraper` = systemd + Crawlee/Playwright for protected sites. | **Keep both** — genuinely complementary. `deep-research-pro` for breadth, `deep-scraper` for depth on hard targets. |

### ✅ HEALTHY — Keep As-Is

| Skill | Status | Notes |
|---|---|---|
| `auto-knowledge` | Core system, gated cron, well-integrated | Heart of the [[self-learning]] system |
| `claude-usage-check` | Small, essential | 25 LOC, does one thing well |
| `config-guardian` | Focused, working | Safe config updates with rollback |
| `cron-mastery` | Reference skill | Good documentation for timing patterns |
| `discord-rich-output` | Active, used by all agents | Component v2 patterns |
| `meta-prompter` | Useful utility | Prompt composition from vault patterns |
| `obsidian-ontology-sync` | Running on cron (every 3h) | Vault → ontology graph sync |
| `openclaw-mcp-plugin` | Large (27MB) but essential | MCP server integration layer |
| `system-resource-monitor` | Small, essential | 25 LOC, system stats |
| `tesseract-ocr` | Niche but functional | OCR when needed |
| `tiktok-analyzer` | Niche, working | Auto-saves to vault/Analyzed TikToks/ |
| `video-transcript-downloader` | Working, useful | yt-dlp wrapper |
| `x-twitter-scraper` | Working | Browser-based profile scraping |

### Summary: Skill Actions

| Action | Skills | Net Change |
|---|---|---|
| **Remove** | `clawsec`, `agent-browser`, `taskr` | -3 |
| **Merge** | `openclaw-anything` → into `openclaw-claude-code-skill` | -1 |
| **Demote to docs** | `openclaw-guardian-ultra` → reference note | -1 |
| **Monitor** | `discord-voice` (keep but flag as experimental/unvalidated) | 0 |
| **Total** | 28 → 23 installed skills | -5 |

---

## 2. Vault Sections — Stale or Duplicative

### 🔴 STALE

| Section | Last Modified | Issue |
|---|---|---|
| **Knowledge/** | Contains 4 files: "1 Vault Analyzed TikToks Section.md", "2 Skill tiktok-analyzer.md", "Built This Session.md", "Session Start 0500 UTC.md" | These are **[[auto-knowledge]] artifacts** from a single session, not a real knowledge base. Orphaned content. Should be reviewed and either promoted to proper vault sections or archived. |
| **Agents/Platforms.md** | Oldest file in vault | Likely pre-dates System v2 platform decisions. Check if superseded by [[Design Decisions]] DD-002. |

### 🟡 DUPLICATIVE

| Overlap | Files | Issue |
|---|---|---|
| **[[OpenClaw config]] documented 3 places** | `Configuration/OpenClaw Config.md`, `Sourced-HQ-inspo/configurations/OpenClaw Advanced Config Patterns.md`, actual `openclaw.json` | Config doc should be single-source. `OpenClaw Config.md` = current state. Advanced Patterns = reference cookbook. But they drift. Consider: Config.md auto-generated from actual config, Advanced Patterns stays as reference. |
| **Research sprawl** | 12 files in Research/ covering overlapping [[OpenClaw]] topics: "[[OpenClaw Discord Setup]]", "[[OpenClaw Ecosystem]]", "[[OpenClaw Extensions Deep Dive]]", "[[OpenClaw Research]]" | Four files all about [[OpenClaw ecosystem]]. Consolidate into one "[[OpenClaw Ecosystem]]" note with sections. |
| **Security info split** | `Security/Threat Model.md`, `Security/Hardening.md` (both old), plus security skills, plus [[Design Decisions]] DD-002/DD-003 | Security posture is spread across vault sections, skills, and [[design decisions]]. Consider a single "Security Posture" note that links to all. |
| **Reference vs Sourced-HQ-inspo** | Both contain curated external knowledge | Different purposes: Reference = actionable how-tos, Sourced-HQ-inspo = inspiration/raw imports. But the boundary is blurry. Keep but define clear scope in each README. |

### ✅ HEALTHY

| Section | Status |
|---|---|
| Architecture/ | Well-maintained, current |
| Agents/ | Current with System Roster |
| Operations/ | Active ([[Usage Optimization Review]] is actionable) |
| Configuration/ | Current enough |
| Projects/ | Active |
| Logs/ | [[Setup log]] — historical, fine |

---

## 3. Cron Jobs — Overlap and Waste

### Current Schedule (15 jobs)

```
*/2   gateway-watchdog.sh          — gateway health
*/5   system-watchdog.sh           — system-level watchdog
*/5   webhook-alerts.sh            — threshold alerts to Discord
*/10  webhook-error-log.sh         — error log scraping to Discord
*/15  webhook-system-monitor.sh    — system stats to Discord
*/30  webhook-cron-runs.sh         — cron execution audit to Discord
*/30  qmd update && qmd embed      — QMD index refresh
2h    vault-autocommit.sh          — git autocommit vault
2h    webhook-hn-scout.sh          — HN feed to Discord
3h    auto-knowledge-gated.sh      — gated knowledge capture
3h    ontology-sync extract        — vault → ontology graph
6h    webhook-vault-feed.sh        — vault changes to Discord
daily session-janitor.sh           — clean old sessions
weekly bureau-review.py            — weekly review
6h    pattern-detector.py          — pattern detection in sessions
```

### 🔴 OVERLAPPING

| Overlap | Jobs | Issue | Fix |
|---|---|---|---|
| **System monitoring × 3** | `system-watchdog.sh` (*/5), `webhook-system-monitor.sh` (*/15), `webhook-alerts.sh` (*/5) | Three separate jobs checking system health. `system-watchdog.sh` checks and restarts services. `webhook-system-monitor.sh` posts stats to Discord. `webhook-alerts.sh` posts alerts to Discord. Two of these post to Discord on overlapping schedules. | **Merge** `webhook-alerts.sh` into `webhook-system-monitor.sh` — one job that posts stats AND alerts when thresholds are breached. Keep `system-watchdog.sh` separate (it does restarts, not reporting). Net: 3 → 2 jobs. |
| **Gateway monitoring × 2** | `gateway-watchdog.sh` (*/2), part of `system-watchdog.sh` (*/5) | `gateway-watchdog.sh` runs every 2 min focused on gateway. `system-watchdog.sh` also checks gateway as part of broader system checks. | **Keep** `gateway-watchdog.sh` (fast, focused). **Remove** gateway checks from `system-watchdog.sh` to avoid double-restarts. |

### 🟡 FREQUENCY CONCERNS

| Job | Current | Recommended | Rationale |
|---|---|---|---|
| `gateway-watchdog.sh` | */2 (720/day) | */5 (288/day) | Gateway is stable now. 2min is paranoid. 5min catches issues fast enough. |
| `webhook-error-log.sh` | */10 (144/day) | */30 (48/day) | Error logs don't need 10min resolution. 30min is fine for async review. |
| `qmd update && qmd embed` | */30 | */60 or on-demand | QMD runs are CPU-intensive. Every 30min is aggressive. Vault doesn't change that fast. |

### ✅ WELL-TUNED

| Job | Schedule | Verdict |
|---|---|---|
| `vault-autocommit.sh` | 2h | Good — captures changes without git noise |
| `session-janitor.sh` | daily 4am | Good — housekeeping at off-hours |
| `auto-knowledge-gated.sh` | 3h | Good — usage-gated, responsible |
| `ontology-sync extract` | 3h | Good — matches [[auto-knowledge]] cadence |
| `bureau-review.py` | weekly | Good — low overhead |

### Summary: Cron Actions

- Merge `webhook-alerts.sh` into `webhook-system-monitor.sh` → net -1 job
- Relax `gateway-watchdog.sh` from */2 to */5
- Relax `webhook-error-log.sh` from */10 to */30
- Relax `qmd` cron from */30 to */60
- Remove gateway checks from `system-watchdog.sh` (let dedicated watchdog handle it)

---

## 4. Config Patterns — Outdated vs Native

### Already Implemented (Good)

| Pattern | Status | Source |
|---|---|---|
| Memory flush on compaction | ✅ Configured | `openclaw.json` → safeguard mode, memoryFlush enabled |
| Session memory search | ✅ Configured | memorySearch.sources: ["memory", "sessions"] |
| Thread bindings | ✅ Configured | 48h idle timeout |
| Full exec (host=gateway) | ✅ Configured | security=full, ask=off |
| Browser config | ✅ Configured | Chrome stable, no-sandbox |

### Opportunities: Not Yet Using Native Features

| Feature | Current Workaround | Native Support | Priority |
|---|---|---|---|
| **Per-agent model override** | All agents default to Opus (main config). Tier 2 agents should use Sonnet but config doesn't set this per-agent. | `agents.list[].model` field — set `anthropic/claude-sonnet-4-6` per agent | 🔴 HIGH — direct cost savings per [[Usage Optimization Review]] |
| **Heartbeat model** | Heartbeat runs on Opus (inherits default). Burns expensive tokens on routine checks. | Set heartbeat agent or heartbeat sessions to Sonnet model. | 🔴 HIGH — 48 Opus heartbeats/day is the #1 cost driver |
| **Streaming mode** | Not configured. Discord responses arrive as a block. | `channels.discord.streaming: "partial"` for responsive feel | 🟡 MEDIUM — UX improvement |
| **Sandboxed agents** | All agents run with full exec. Untrusted tasks have no isolation. | `agents.list[].sandbox.mode: "docker"` with network=none | 🟡 MEDIUM — security improvement |
| **Agent-specific channel overrides** | All routing done via `bindings[]` block with channel IDs. | Newer `agents.list[].channels.discord.guilds` nesting — more readable, co-located with agent config | 🟢 LOW — cosmetic, current bindings work |

### Outdated Config Patterns in Docs

| Document | Outdated Pattern | Current Reality |
|---|---|---|
| `OpenClaw Config.md` | Lists version `2026.3.12` | [[OpenClaw]] has likely updated since. Version should be auto-detected. |
| `OpenClaw Config.md` | `dangerouslyDisableDeviceAuth` noted | This should be re-evaluated — may have been needed for initial setup but is a security gap. |
| `Advanced Config Patterns.md` | Shows `heartbeat.every: "30m"` as example | Should document per-agent model overrides as the primary optimization pattern |
| `System v2 — Complete Architecture.md` | Still lists Phase 5 (Gateway restart) as "NEXT" | If gateway has been restarted since writing, this is stale. |

---

## 5. Agent Roster Optimization

### 🔴 MERGE CANDIDATES

| Merge | Agents | Rationale |
|---|---|---|
| **Security + Auditor** | `security` (Tier 1) + `security-audit` (Tier 2) | Both do security work. `security` is a sub-agent for "audits, [[Hardening]], real-risk focus." `security-audit` (Auditor) does "security scanning, config review, threat modeling." Near-identical scope. **Merge into one `security` agent** with both capabilities. |
| **Vault Keeper + Archivist** | `vault-keeper` (Tier 1) + `vault-management` (Tier 2) | `vault-keeper` = "Knowledge organization, wikilinks." `vault-management` (Archivist) = "Vault organization, taxonomy, cross-linking." These are the same job described twice. **Merge into `vault-keeper`** with Archivist's taxonomy skills. |
| **Foreman + Scheduler** | `coding-delegation` (Foreman) + `cron-automation` (Scheduler) | Foreman = "Task decomposition, delegation, project tracking." Scheduler = "Cron design, heartbeat management, timing." These are both about work orchestration — what to do and when. Right Hand already orchestrates. If Foreman decomposes and Scheduler times, they should be one agent: **TaskMaster** — handles both decomposition and scheduling. |

### 🟡 DEMOTE / ARCHIVE

| Agent | Current | Recommendation |
|---|---|---|
| **Interviewer** | Tier 1, Opus model, channel archived, status "idle", no workspace files, 296KB sessions (old) | **Archive.** Channel is already archived. No workspace set up. Burning Opus allocation for an agent that ran once. Remove from `agents.list` in config. Re-create on demand if needed. |

### 🟢 CAPABILITY UPGRADES

| Agent | Current Gap | Upgrade |
|---|---|---|
| **Scout** (browser-automation) | Only does feed monitoring. Has `fast-browser-use` skill available but no structured intel pipeline. | Give Scout a **daily brief template** — structured output format for intel that feeds directly into vault Knowledge/ section. |
| **Ops** | Monitors but doesn't auto-remediate beyond gateway restart. | Add **auto-remediation playbook** — if disk > 85%, auto-clean session janitor. If memory > 90%, restart sandbox containers. |
| **Researcher** | No access to `deep-scraper` for hard targets. | **Bind `deep-scraper` skill** to Researcher agent so it can go deeper on protected sites. |
| **Coder** | No CI/CD integration. Ships code but doesn't validate builds. | Add **build validation** step — run tests before marking tasks as shipped. |

### Post-Optimization Roster

| Tier | Agents | Count |
|---|---|---|
| **Tier 1 (Core)** | Right Hand, Researcher, Coder, Ops, Vault Keeper, Security | 6 (-1: Interviewer archived) |
| **Tier 2 (Specialist)** | Scout, Architect, DevOps, TaskMaster, Lab Tech, Debugger | 6 (-3: merged Security+Auditor, VaultKeeper+Archivist, Foreman+Scheduler) |
| **Total** | | **12** (down from 16) |

---

## 6. Advancement Roadmap

### Phase 3A — Cost Optimization (Do First, 1-2 sessions)

**Why first:** The [[Usage Optimization Review]] identified $151/5h burn rate. Every other improvement is wasted if the system burns through quota before it can use new features.

1. **Set per-agent model overrides** — Sonnet for all Tier 2 agents + heartbeat sessions
2. **Trim workspace files** — Target <15KB total per [[Usage Optimization Review]] action items
3. **Reduce heartbeat to 60min** (or use Sonnet heartbeat)
4. **Merge/remove 5 redundant skills** (reduces skill loading overhead)
5. **Relax cron frequencies** as specified in Section 3
6. **Archive Interviewer agent** from config

### Phase 3B — Agent Consolidation (2-3 sessions)

1. Merge Security + Auditor → unified `security` agent
2. Merge Vault Keeper + Archivist → unified `vault-keeper` agent
3. Merge Foreman + Scheduler → `taskmaster` agent
4. Update AGENTS.md, SOUL.md, IDENTITY.md for merged agents
5. Update System Roster and System v2 architecture docs
6. Test routing still works with reduced agent count

### Phase 3C — Dynamic Orchestration (3-4 sessions)

This is the big one — Phase 6 from System v2 architecture.

1. **Implement Right Hand meeting protocol** — boardroom post → decompose → spawn → summarize
2. **Build session_spawn wrapper** — Right Hand can spawn any Tier 2 agent with context
3. **Thread-bound sub-agent sessions** — spawned agents post to the same Discord thread
4. **Status dashboard** — pinned message in #general showing active tasks, agent states
5. **Handoff protocol** — agents can pass work to each other with context

### Phase 3D — Intelligence Pipeline (2-3 sessions)

1. **Scout → Researcher pipeline** — Scout finds leads, Researcher deep-dives automatically
2. **Knowledge/ section restructure** — [[auto-knowledge]] writes to structured sections, not orphaned files
3. **Vault Keeper auto-curation** — daily vault hygiene runs (broken links, orphaned notes, stale content)
4. **Pattern detector → insight notes** — `pattern-detector.py` outputs feed into vault

### Phase 4 — Advanced Capabilities (Future)

1. **Sandboxed execution for untrusted tasks** — systemd sandbox per-agent for code review, external code analysis
2. **Voice integration** — revisit `discord-voice` skill when architecture is stable
3. **Multi-guild support** — expand System to additional Discord guilds if needed
4. **External API integrations** — Taskr or similar for external task tracking (when API keys are available)
5. **Live routing dashboard** — real-time agent activity visualization

---

## 7. Sources

| Source | Location | Used For |
|---|---|---|
| System v2 Architecture | `vault/Architecture/System v2 — Complete Architecture.md` | [[Agent roster]], routing, phases |
| System Roster | `vault/Agents/System Roster.md` | Agent status, model assignments |
| Skills README | `vault/Skills/README.md` | Skill inventory, sizes |
| [[System Overview]] | `vault/Architecture/System Overview.md` | Infrastructure diagram |
| [[Usage Optimization Review]] | `vault/Operations/Usage Optimization Review.md` | Cost analysis, prompt bloat |
| [[Design Decisions]] | `vault/Architecture/Design Decisions.md` | Architecture rationale |
| [[OpenClaw Config]] | `vault/Configuration/OpenClaw Config.md` | Current config state |
| Advanced Config Patterns | `vault/Sourced-HQ-inspo/configurations/OpenClaw Advanced Config Patterns.md` | Available native features |
| Installed skills | `ls /home/trajan/skills/` | 28 skills on disk |
| Agent workspaces | `ls ~/.openclaw/agents/*/` | 16 agent workspaces |
| Crontab | `crontab -l` | 15 active cron jobs |
| Webhook scripts | `/home/trajan/bin/webhook-*.sh` | Discord alert delivery |
| [[Auto-knowledge]] gate | `/home/trajan/bin/auto-knowledge-gated.sh` | Usage-gated cron |
| Skill SKILL.md files | Each skill directory | Skill descriptions, dependencies |

---

## Quick Reference — Action Tracker

| # | Action | Priority | Phase |
|---|---|---|---|
| 1 | Remove skills: `clawsec`, `agent-browser`, `taskr` | 🔴 | 3A |
| 2 | Merge `openclaw-anything` → `openclaw-claude-code-skill` | 🔴 | 3A |
| 3 | Demote `openclaw-guardian-ultra` to reference doc | 🟡 | 3A |
| 4 | Set Sonnet model override for all Tier 2 agents | 🔴 | 3A |
| 5 | Set Sonnet for heartbeat sessions | 🔴 | 3A |
| 6 | Reduce heartbeat from 30m → 60m | 🔴 | 3A |
| 7 | Trim workspace .md files to <15KB total | 🔴 | 3A |
| 8 | Merge webhook-alerts into webhook-system-monitor | 🟡 | 3A |
| 9 | Relax cron: gateway */5, errors */30, qmd */60 | 🟡 | 3A |
| 10 | Archive Interviewer agent | 🟡 | 3A |
| 11 | Merge Security + Auditor agents | 🟡 | 3B |
| 12 | Merge Vault Keeper + Archivist agents | 🟡 | 3B |
| 13 | Merge Foreman + Scheduler → TaskMaster | 🟡 | 3B |
| 14 | Implement Right Hand meeting protocol | 🟢 | 3C |
| 15 | Build Scout → Researcher intel pipeline | 🟢 | 3D |
| 16 | Restructure Knowledge/ vault section | 🟢 | 3D |
| 17 | Consolidate 4 [[OpenClaw Research]] notes → 1 | 🟢 | 3D |

*Total: 17 actions across 4 phases*

---

*Filed by 🏗️ Architect — System Tier 2*
*Next review: After Phase 3A completion*
