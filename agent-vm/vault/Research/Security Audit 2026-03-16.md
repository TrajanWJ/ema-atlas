---
title: "Security Audit 2026-03-16"
created: 2026-03-16
updated: 2026-03-16
type: research
status: active
confidence: 0.80
confidence_updated: 2026-03-18
source: research
tags: [mcp, openclaw, prompts, research, security, skills]
summary: "The primary Anthropic API key is stored as a plaintext string directly in `~/.openclaw/openclaw.json`:"
---
# 🛡️ Security Audit Results
**Date:** 2026-03-16 09:59 UTC  
**Auditor:** Security Agent  
**Scope:** Gateway config, installed skills, system security

---

## 🔴 Critical Findings

### 1. Plaintext Anthropic API Key in openclaw.json
**Risk: HIGH**

The primary Anthropic API key is stored as a plaintext string directly in `~/.openclaw/openclaw.json`:
```
"apiKey": "sk-ant-oat01-Zt1DOB..."
```

The backup key correctly uses `{"source": "env", "id": "ANTHROPIC_BACKUP_API_KEY"}` — the primary key should do the same. Anyone with read access to this file (any process running as trajan) gets full API access.

**Recommendation:** Move to env-var reference like the backup key:
```json
"apiKey": {"source": "env", "provider": "default", "id": "ANTHROPIC_API_KEY"}
```

### 2. Gateway Device Auth Disabled + Open to All Origins
**Risk: MEDIUM-HIGH**

```json
"controlUi": {
  "allowedOrigins": ["*"],
  "dangerouslyDisableDeviceAuth": true
}
```

Combined with `gateway.bind: "lan"` and UFW allowing port 18789 from **anywhere** (not just 192.168.122.1), this means:
- Any device on the network can access the gateway control UI
- No device pairing/authentication required
- CORS is wide open

The gateway does have password auth (`gateway.auth.mode: "password"`) which provides a layer of protection, but the disabled device auth weakens the security posture.

**Recommendation:** 
- Restrict UFW rule: `sudo ufw delete allow 18789/tcp && sudo ufw allow from 192.168.122.1 to any port 18789`
- Set `dangerouslyDisableDeviceAuth: false` if companion apps are already paired
- Narrow `allowedOrigins` to known origins

---

## 🟡 Medium Findings

### 3. Exec Policy: Full Access, No Approval
**Risk: ACCEPTABLE (for dedicated agent VM)**

```json
"exec": {"security": "full", "ask": "off"}
```

This gives the agent unrestricted shell access with no approval prompts. On a shared system this would be critical; on a dedicated agent VM with only Trajan's SSH access, this is **intentional and acceptable**. Noting it for completeness.

### 4. Docker/Laminar Ports Bound to 0.0.0.0
**Risk: LOW (mitigated by UFW)**

The [[Laminar]] AI stack (lmnr) has 8 ports bound to all interfaces:
| Port | Service |
|------|---------|
| 5433 | PostgreSQL |
| 5667 | [[Laminar]] Frontend |
| 7280-7281 | Quickwit search |
| 8000-8002 | [[Laminar]] App Server |
| 8903 | Query Engine |

UFW blocks these from external access (only 22, 3000, and 18789 are explicitly allowed). However, Docker's port publishing can bypass UFW via iptables DOCKER chain.

**Recommendation:** Verify Docker isn't bypassing UFW:
```bash
sudo iptables -L DOCKER -n | grep -E "8903|8000|5433"
```
If Docker is bypassing UFW, add to `/etc/docker/daemon.json`: `{"iptables": false}` or bind ports to 127.0.0.1 in docker-compose.

### 5. SQL Injection in verify_task.py (intelligent-delegation)
**Risk: LOW**

```python
count = conn.execute(f"SELECT COUNT(*) FROM [{table}]").fetchone()[0]
```

The `table` parameter comes from CLI args or a manifest file. This is a local verification tool, not a network service, so exploitation requires local access — which already implies full system access. Noting for code quality.

---

## 🟢 Clean Findings

### 6. Skills Audit — No Malicious Patterns Found

All four flagged skills were audited for dangerous patterns:

#### multi-agent-collaboration/
- **eval()**: Only `evaluateSignal()`, `evaluateCompleteness()` etc. — these are normal method names, not JavaScript `eval()` calls. ✅ Clean
- **External URLs**: CDN link to `cdn.hailuoai.com` in `UPGRADE_REPORT.md` (documentation only, not executable code). Registry refs to clawhub.ai and npmjs.org. ✅ Clean
- **crypto**: Uses `crypto.randomBytes()` and `crypto.createHash('md5')` for generating unique IDs only. ✅ Clean
- **Data exfiltration**: None detected ✅

#### intelligent-delegation/
- **verify_task.py**: Clean verification tool — checks file existence, JSON validity, SQLite row counts, port liveness. Only outbound connection is `http://127.0.0.1` for port-alive checks. ✅ Clean
- **External URLs**: Only arxiv.org, github.com, clawhub.ai references ✅

#### personality-dynamics/
- **child_process**: `execSync` in `cli.ts` for running sub-commands (standard CLI pattern). ✅ Clean
- **External URLs**: Only github.com/[[OpenClaw]] references ✅

#### devloop-agent-pack/
- **Content**: Markdown agent definitions referencing standard [[OpenClaw]] tools (Read, Write, WebSearch, WebFetch). No executable code with dangerous patterns. ✅ Clean

**Verdict: The VirusTotal flags are likely false positives** — probably triggered by the Chinese-language documentation, the `evaluateSignal` method names matching eval() heuristics, and the crypto import for ID generation.

### 7. System Security Basics

| Check | Status |
|-------|--------|
| Open ports | Expected services only (SSH, [[OpenClaw]], Docker/[[Laminar]]) |
| UFW firewall | ✅ Active, default DROP policy |
| SSH access | Restricted to 192.168.122.1 (host only) |
| Failed auth attempts | None in last 24h |
| Unexpected processes | None — all processes are expected ([[OpenClaw]], Claude, browsers, Docker, ClickHouse) |
| Outbound connections | All legitimate: Anthropic API, Discord (162.159.x), Telegram (149.154.x), Google (142.251.x), Atlassian/GitHub (18.97.x) |

---

## Summary

| # | Finding | Severity | Action |
|---|---------|----------|--------|
| 1 | Plaintext API key in config | 🔴 HIGH | Move to env var |
| 2 | Gateway auth weakened + open UFW | 🔴 MEDIUM-HIGH | Restrict UFW, re-enable device auth |
| 3 | Exec full/no-ask | 🟡 Acceptable | Intentional for this VM |
| 4 | Docker ports on 0.0.0.0 | 🟡 LOW | Verify Docker/UFW interaction |
| 5 | SQL injection in local tool | 🟢 LOW | Code quality fix |
| 6 | Skills audit | ✅ CLEAN | VirusTotal false positives |
| 7 | System basics | ✅ CLEAN | No issues |

**Bottom line:** Two real issues to fix (plaintext API key, gateway UFW rule). The flagged skills are clean. System is in good shape for a dedicated agent VM.
