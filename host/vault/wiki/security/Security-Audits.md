---
title: "Security Audits"
type: reference
created: 2026-04-06
tags: [security, audits, hardening]
summary: "All security audits performed on the agent-vm environment with findings and remediations"
---

# Security Audits

## ClawHub Skill Audit

- **Scope**: 38 skills audited
- **Findings**: No malicious patterns detected in accepted skills
- **Process**: Full network call inventory for each skill; 4 skills rejected (crypto keys, eval, external APIs)
- **Outcome**: Clean bill for installed skills; ongoing vetting required for new additions

## Gateway Exposure Assessment

- **Port exposure**: OpenClaw gateway (18789) and EMA (4488) exposed on VM
- **Wildcard origins**: CORS configured with wildcard -- allows any origin to make requests
- **Device auth**: Disabled -- no per-device authentication for gateway access
- **Risk**: Medium. Mitigated by UFW rules restricting access to host network only.

## VM Audit (2026-03-16)

Comprehensive VM-level security review:

- **UFW rules**: Reviewed and tightened. Default deny inbound, selective allow for required services.
- **Listening ports**: Inventoried. All services accounted for.
- **Docker bypass**: Docker can bypass UFW rules via iptables manipulation. Documented as known risk.
- **SSH config**: Key-based auth only. Password auth disabled. Root login disabled.
- **Secrets scan**: Identified plaintext secrets in `openclaw.json` and bot token in `HEARTBEAT.md`.

## Red Team v5.1

Four critical findings:

| # | Finding | Severity | Status |
|---|---------|----------|--------|
| 1 | **Rate limit storm** -- no rate limiting on gateway endpoints; flood attacks possible | Critical | Open |
| 2 | **State corruption** -- concurrent writes to dispatch.db without proper locking | Critical | Mitigated (flock) |
| 3 | **SPOF** -- gateway is single point of failure; no redundancy or auto-recovery | Critical | Mitigated (watchdog) |
| 4 | **Secret exposure + shell injection** -- heredoc interpolation and plaintext secrets | Critical | Partially mitigated |

## 7-Layer Hardening Model

| Layer | Control | Status |
|-------|---------|--------|
| 1 | VM boundary (KVM isolation) | Active |
| 2 | Systemd sandboxing (ProtectSystem, NoNewPrivileges) | Active |
| 3 | Network (UFW, port restriction) | Active |
| 4 | Docker volumes (read-only where possible) | Partial |
| 5 | API key rotation | Manual |
| 6 | UFW egress rules | Active |
| 7 | Sandbox mode for untrusted skills | Planned |

## axios npm Supply Chain Attack Analysis (2026-03-31)

- Investigated reports of supply chain compromise in axios npm package
- Assessed exposure: axios used in gateway and several scripts
- Conclusion: pinned versions were not affected; added to monitoring watchlist

## Related

- [[Security-Posture]] -- overall threat model
- [[Incident-Log]] -- incidents that triggered audit work
- [[Infrastructure-Map]] -- what's being audited
