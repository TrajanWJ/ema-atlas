---
title: "5-Stage Lifecycle Security Hardening"
type: reference
created: 2026-03-24
tags: [security, hardening, openclaw, agent-system]
summary: "Architecture and usage guide for the 5-stage agent lifecycle defense system based on the Taming OpenClaw paper"
---

# 5-Stage Lifecycle Security Hardening

Defense-in-depth security for the OpenClaw agent system, based on the threat model from arXiv:2603.11619 ("Taming OpenClaw"). Each stage addresses a specific attack surface in the agent lifecycle.

## Architecture Overview

```
Stage 1: Initialization    → skill-vet.sh        → Skill Vetting
Stage 2: Input             → injection-filter.sh  → Injection Detection
Stage 3: Inference         → mem-integrity.sh     → Memory Integrity
Stage 4: Decision          → intent-verify.sh     → Intent Verification
Stage 5: Execution         → capability-check.sh  → Capability Manifests
```

All tools log security events to `/home/trajan/vault/System/security-events.json`.

## Stage 1: Initialization — Skill Vetting

**Tool:** `/home/trajan/bin/skill-vet.sh`
**Registry:** `/home/trajan/vault/System/skill-registry.json`

Scans skill directories for risks before they execute. Computes SHA256 hashes of all files and checks for:
- Executable files
- Network call patterns (curl, wget, fetch, requests)
- Vault write operations
- Credential patterns (API keys, tokens, secrets)
- Dangerous commands (rm -rf, sudo, eval, exec)

```bash
skill-vet.sh check /path/to/skill        # Scan a skill directory
skill-vet.sh check /path/to/skill --strict  # Strict mode: WARN → QUARANTINE
skill-vet.sh list                          # List all registered skills
skill-vet.sh audit                         # Re-verify all skills (detect tampering)
```

**Status codes:** PASS | WARN (risks found) | QUARANTINE (credentials detected or strict mode)

## Stage 2: Input — Injection Detection

**Tool:** `/home/trajan/bin/injection-filter.sh`

Detects prompt injection attacks across 6 semantic categories:

1. **Identity probing** — "what are your real instructions", "reveal your prompt"
2. **Goal reframing** — "from now on you are", "forget everything"
3. **Permission escalation** — "you have permission to", "override safety"
4. **Urgency injection** — "URGENT OVERRIDE:", "SYSTEM MESSAGE:", "[ADMIN]"
5. **Encoding tricks** — base64 blocks >100 chars, unicode direction markers
6. **Nested instructions** — triple-quoted system messages, `<system>` tags, `[INST]` blocks

```bash
injection-filter.sh "text to scan"         # Scan argument
echo "text" | injection-filter.sh          # Scan stdin
```

**Exit codes:** 0=clean, 1=suspicious, 2=high confidence injection
**Trust tiers:** T0=system, T1=user, T2=external, T3=hostile

Also integrated into `mem.sh` via `injection_scan()`.

## Stage 3: Inference — Memory Integrity

**Tool:** `/home/trajan/bin/mem-integrity.sh`

Signs memory files with SHA256 sidecar checksums (`.sig` files) and verifies integrity. Integrated into `mem.sh` — every store operation auto-signs the written file.

```bash
mem-integrity.sh sign <file>       # Create .sig sidecar with SHA256
mem-integrity.sh verify <file>     # Verify against stored .sig
mem-integrity.sh verify-all        # Verify entire memory directory
mem-integrity.sh audit             # Full vault audit with summary
```

**Exit codes:** 0=OK, 1=tampered or missing signature

## Stage 4: Decision — Intent Verification

**Tool:** `/home/trajan/bin/intent-verify.sh`
**Registry:** `/home/trajan/vault/System/intent-registry.json`

Stores a session's original intent and verifies proposed actions against it using cosine similarity on term frequency vectors.

```bash
intent-verify.sh init <session_id> "original intent description"
intent-verify.sh check <session_id> "proposed action"
intent-verify.sh list
```

**Decision logic:**
- Divergence > 0.7 → exit 1 (WARN)
- Dangerous keywords (exec, rm, curl, network) AND divergence > 0.5 → exit 2 (BLOCK)
- Otherwise → exit 0 (OK)

## Stage 5: Execution — Capability Manifests

**Tool:** `/home/trajan/bin/capability-check.sh`
**Registry:** `/home/trajan/vault/System/capability-registry.json`

Declares and enforces what operations skills are allowed to perform.

```bash
capability-check.sh declare <skill-name> "read,write,vault_read"
capability-check.sh check <skill-name> <operation>
capability-check.sh list
```

**Valid capabilities:** `read`, `write`, `exec`, `network`, `vault_read`, `vault_write`, `memory_write`

**Policy modes** (set in registry): `warn` (log + exit 1) or `enforce` (log + exit 2)

## Running a Full Security Audit

```bash
# Full audit across all stages
skill-vet.sh audit && mem-integrity.sh audit

# Check security event log
cat /home/trajan/vault/System/security-events.json | python3 -m json.tool

# Verify all memory files
mem-integrity.sh verify-all
```

## Security Event Log

All tools log to `/home/trajan/vault/System/security-events.json`:

```json
{
  "ts": "2026-03-24T12:00:00Z",
  "stage": "input|inference|decision|execution",
  "tool": "injection-filter|mem-integrity|intent-verify|capability-check",
  "severity": "info|warn|block",
  "detail": "Description of the event"
}
```

## Related

- [[Security Posture - Agent System]]
- [[Security Hardening Log - 2026-03-18]]
