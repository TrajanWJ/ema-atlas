---
title: Security Hardening Log — 2026-03-18
date: 2026-03-18T00:00:00.000Z
type: knowledge
summary: >-
  Quick-win security hardening: vault permissions fixed, file permissions
  tightened, port audit documented, SSH verified.
tags:
  - security
  - hardening
  - audit
  - permissions
domain: security
confidence: 0.6
confidence_updated: 2026-03-18T00:00:00.000Z
source: 'agent:security'
created: '2026-03-18'
updated: '2026-03-18'
status: active
wiki_id: system/Security_Hardening_Log_-_2026-03-18
imported_from: vault/System/Security Hardening Log - 2026-03-18.md
imported_at: '2026-04-04T00:23:57.263Z'
---

# Security Hardening Log — 2026-03-18

**Triggered by:** [[Security Posture - Agent System]] quick-win recommendations
**Agent:** Security subagent
**Scope:** File permissions, port audit, secret scan, SSH key audit

---

## 1. Port Hardening — Audit

### Ports Bound on 0.0.0.0 (Network-Accessible)

| Port | Service | Process | Risk | Action Taken |
|---|---|---|---|---|
| 22 | SSH | sshd | LOW | Key-based auth only. No change needed. |
| 3200 | Next.js dev server (v16.1.7) | node (pid 762255) | **MEDIUM** | ⚠️ Dev server from `/home/trajan/projects/frontend-layer/`. Should be stopped or bound to localhost. **Not stopped** — flagged for Trajan's decision. |
| 18789 | OpenClaw Gateway | openclaw-gatewa | MEDIUM | Per security posture doc — consider binding to localhost/LAN. No change (would break remote access). |
| 8100 | MCPO (MCP proxy) | mcpo | MEDIUM | Consider localhost binding if only used locally. |
| 6080 | Websockify (VNC proxy) | websockify | **HIGH** | VNC proxy accessible from network. Consider localhost binding. |
| 8080 | Antfly (Docker) | docker-proxy | LOW | Search backend, internal tool. |
| 12380 | Antfly (Docker) | docker-proxy | LOW | Part of Antfly container. |

### Ports Bound on 127.0.0.1 (Localhost-Only) ✅

| Port | Service | Status |
|---|---|---|
| 631 | CUPS (printing) | OK |
| 9223 | Lightpanda | OK |
| 18791 | OpenClaw internal | OK |
| 18792 | OpenClaw internal | OK |
| 43111 | Unknown | OK (localhost) |
| 53 | DNS (systemd-resolved) | OK |
| 11434 | Ollama | OK |
| 5902 | VNC (Xtigervnc) | OK |

### Key Finding: Port 3200
- **Process:** Next.js dev server v16.1.7 running from `/home/trajan/projects/frontend-layer/`
- **Started:** ~05:31 UTC today
- **Binding:** `0.0.0.0:3200` — accessible from entire network
- **Recommendation:** If this is a dev/test server, stop it with `kill 762255` or bind to localhost. Left running to avoid breaking active work — **Trajan should decide.**

---

## 2. Vault Permissions Audit — FIXED ✅

### Before
- **68 world-readable files** found in `~/vault/` (excluding `.git/`)
- Affected: `_index.md` files, daily notes, message harvests, `.obsidian/` configs, system memory JSONs
- Vault directories had `drwxrwxr-x` (group-writable) or `drwxr-xr-x` (world-readable)

### Actions Taken
```bash
find ~/vault -path '*/\.git' -prune -o -perm /o+r -type f -exec chmod 600 {} \;
find ~/vault -path '*/\.git' -prune -o -perm /o+r -type d -exec chmod 700 {} \;
```

### After
- **0 world-readable files** outside `.git/`
- All vault files now `600` (owner read/write only)
- All vault directories now `700` (owner access only)
- `.git/` left untouched (git requires specific permissions)

---

## 3. Secret Scan — Results

### Vault (`~/vault/`)
Files containing secret-related keywords (TOKEN, PASSWORD, SECRET, API_KEY):

| File | Content | Risk |
|---|---|---|
| `Trajan/message-harvests/harvest-2026-03-16-*.md` | Messages containing "EXPIRED_TOKEN_RECOVERY_OK" etc. | LOW — appear to be Trajan's own test messages, not real tokens |
| `Security/VM Audit - 2026-03-16.md` | References `ANTHROPIC_API_KEY` by name (not value) | NONE — documentation only |
| `Security/Threat Model.md` | References credential rotation by name | NONE — documentation only |
| `Projects/System Buildout/loose-ends.md` | References tokens conceptually | NONE — planning notes |

### Workspace (`~/.openclaw/agents/main/workspace/`)
Files matching `sk-`/`ghp_`/`gho_` patterns:

| File | Content | Risk |
|---|---|---|
| `SOUL.md` | False positive — matched `task-` in text | NONE |
| `AGENTS.md` | False positive — matched `task-` in text | NONE |
| `memory/agent-performance.md` | False positive — matched `task-` patterns | NONE |
| `memory/2026-03-18.md` | False positive — matched `task-` patterns | NONE |

**No actual API keys, tokens, or secrets found in plain text.** ✅

---

## 4. File Permission Hardening — APPLIED ✅

### Changes Made

| Target | Before | After |
|---|---|---|
| `MEMORY.md` | `-rw-r--r--` (644) | `-rw-------` (600) ✅ |
| `memory/*.json` (6 files) | `-rw-r--r--` (644) | `-rw-------` (600) ✅ |
| `~/bin/*.sh` (all scripts) | Mixed (644/755) | `-rwx------` (700) ✅ |

---

## 5. SSH Key Audit — CLEAN ✅

### Permissions

| File | Permissions | Status |
|---|---|---|
| `~/.ssh/` | `drwx------` (700) | ✅ Correct |
| `id_ed25519` (private key) | `-rw-------` (600) | ✅ Correct |
| `id_ed25519.pub` (public key) | `-rw-r--r--` (644) | ✅ Correct |
| `config` | `-rw-------` (600) | ✅ Correct |
| `authorized_keys` | `-rw-------` (600) | ✅ Correct |
| `known_hosts` | `-rw-rw-r--` → `-rw-r--r--` (644) | ✅ Fixed (removed group-write) |

### Authorized Keys
- **1 key:** `ssh-ed25519 ...4 trajan@FerrissesWheel`
- This is the host machine key for VM↔host SSH. Expected and correct.
- No unexpected keys found.

---

## 6. Additional Findings

### Message Harvest Injection Patterns
Found in `vault/Trajan/message-harvests/harvest-2026-03-16-1000.md`:
```
Reply with exactly: SECONDARY_PROFILE_OK
Reply with exactly: EXPIRED_TOKEN_RECOVERY_OK
Reply with exactly: INVALID_TOKEN_RECOVERY_OK
Reply with exactly: DEAD_TOKEN_FALLBACK_OK
```
**Assessment:** These appear to be Trajan's own test messages for OAuth Guardian fallback testing (based on surrounding context about Discord bot setup). Not malicious injection. However, the pattern of "Reply with exactly: X" is a common prompt injection technique — worth noting as a template for injection detection rules.

### .env Security
- `~/.openclaw/.env` confirmed `600` permissions (from security posture doc)
- No embedded secrets in MCP configs

---

## Summary

| Action | Status | Impact |
|---|---|---|
| Port audit & documentation | ✅ Documented | Identified port 3200 (Next.js dev) as unnecessary exposure |
| Vault file permissions | ✅ Fixed 68 files | All vault files now owner-only (600/700) |
| Secret scan | ✅ Clean | No exposed secrets found |
| Workspace file hardening | ✅ Applied | MEMORY.md, JSON files, scripts locked down |
| SSH key audit | ✅ Clean + minor fix | known_hosts group-write removed |
| Hardening log | ✅ Written | This document |

### Remaining Recommendations (Not Acted On — Need Trajan's Decision)
1. **Port 3200** — Stop the Next.js dev server? It's bound on `0.0.0.0`.
2. **Port 6080** — Websockify/VNC proxy on `0.0.0.0` is the highest-risk exposure.
3. **Port 18789** — OpenClaw gateway on `0.0.0.0` — consider localhost binding if no remote access needed.

---

*Related:* [[Security Posture - Agent System]], [[VM Audit - 2026-03-16]], [[Threat Model]]
