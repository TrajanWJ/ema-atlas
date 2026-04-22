---
title: Gateway Exposure Audit
created: '2026-03-16'
updated: '2026-03-16'
type: playbook
status: active
confidence: 0.6
confidence_updated: 2026-03-18T00:00:00.000Z
source: security
tags:
  - architecture
  - auth
  - discord
  - openclaw
  - prompts
  - security
summary: '  - SSH (22) — host only (192.168.122.1)'
wiki_id: operations/security/Gateway_Exposure_Audit
imported_from: vault/Security/Gateway Exposure Audit.md
imported_at: '2026-04-04T00:23:57.174Z'
---
# Gateway Exposure Audit — 2026-03-16

## Environment
- VM: agent-vm (192.168.122.10) — KVM guest, NAT behind host
- Gateway: port 18789, bound to 0.0.0.0

## Network Exposure
- **UFW active** with rules:
  - SSH (22) — host only (192.168.122.1)
  - Port 3000 — host only
  - Port 8888 — open (was "Bureau Test UI" — SHOULD BE CLOSED)
  - Port 18789 — open (Gateway)
- **Gateway binds 0.0.0.0:18789** — reachable from host network
- **NAT isolation** — VM is behind KVM NAT, not directly internet-accessible

## Critical Findings (from `openclaw status`)

### 1. Control UI wildcard origins ⚠️ CRITICAL
- `gateway.controlUi.allowedOrigins` includes `*`
- **Impact:** Any origin can interact with the Control UI
- **Fix:** Set explicit origin (e.g., `http://192.168.122.10:18789`)
- **Mitigated by:** NAT isolation — only host can reach this

### 2. Device auth disabled ⚠️ CRITICAL
- `dangerouslyDisableDeviceAuth=true`
- **Impact:** No device identity check on Control UI
- **Fix:** Re-enable unless actively debugging
- **Mitigated by:** NAT isolation

### 3. Open groupPolicy + elevated tools ⚠️ CRITICAL
- Both Telegram and Discord have `groupPolicy="open"`
- With `tools.elevated` enabled, prompt injection in group chats could execute privileged commands
- **Fix:** Set `groupPolicy="allowlist"` or restrict elevated tools
- **Trajan's preference:** Open policy is intentional (dedicated VM, single user)

### 4. Config file world-readable ✅ FIXED
- Was 644, now 600

### 5. Telegram DMs open ⚠️ CRITICAL
- Anyone can DM the Telegram bot
- **Fix:** Set dmPolicy="allowlist" with Trajan's Telegram ID

### 6. Port 8888 open ⚠️ WARN
- Old "Bureau Test UI" rule — no longer needed
- **Fix:** `sudo ufw delete allow 8888/tcp`

## Risk Assessment
**Overall: MEDIUM** — despite 9 critical warnings, the VM is NAT-isolated behind KVM. The real attack surface is prompt injection via Telegram DMs (anyone can message the bot) and Discord (if group policy is open). The elevated tools concern is valid but Trajan accepts this risk for operational flexibility.

## Recommended Actions (Priority Order)
1. ✅ Fix config permissions (DONE)
2. Close port 8888 (dead service)
3. Set Telegram dmPolicy to allowlist
4. Consider re-enabling device auth if not actively debugging
5. Set Control UI origins to specific host

## Related

- [[Gateway Exposure Audit]]
- [[Usage Patterns]]
- [[vm-audit-2026-03-16]]
- [[Session Architecture Proposal]]
