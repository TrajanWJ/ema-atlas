---
title: "Security Posture"
type: reference
created: 2026-04-06
tags: [security, threat-model, posture]
summary: "Overall security posture, threat model, and known risks for the agent-vm environment"
---

# Security Posture

## Threat Model: The Lethal Trifecta

The core risk profile stems from three converging factors:

1. **Full bash/sudo access** -- the agent operates with unrestricted shell privileges
2. **Untrusted input surfaces** -- web content, Discord messages, social feeds, and ClawHub skills all flow into the system
3. **Sensitive access** -- vault contents, SSH keys, API tokens, and financial-adjacent data are all reachable

Any single factor is manageable. The combination creates a surface where prompt injection can escalate to arbitrary code execution with access to secrets.

## Known Attack Vectors

- **Wallet-drain prompt injection**: Identified via social feeds. Malicious content crafted to trick the agent into executing financial transactions or leaking credentials. This is the highest-consequence attack.
- **ClawHub skill supply chain**: Third-party skills can contain arbitrary code. Four skills were rejected during vetting for containing crypto key access, `eval()` calls, and external API exfiltration patterns.
- **Heredoc JSON injection**: Untrusted data interpolated into heredoc blocks can break out of JSON structure and inject shell commands.

## Security Audit History

- **5-Layer Security Audit** (2026-03-18): Conducted using the Anthropic system card framework. Covered VM boundary, network exposure, secret management, input sanitization, and agent autonomy limits.
- **Devil's Advocate review gate**: Graded B-. Provides adversarial review of agent proposals before execution, but coverage is incomplete.

## Known Risks (Accepted)

| Risk | Status | Notes |
|------|--------|-------|
| Secrets in plaintext `openclaw.json` | Accepted | Low risk -- dedicated VM with no shared access |
| Bot token exposed in `HEARTBEAT.md` | Identified | Not yet remediated |
| Minimal restrictions philosophy | By design | Trajan prefers minimal guardrails on dedicated VM; security relies on VM isolation rather than internal restrictions |

## ClawHub Vetting

- 4 skills rejected for: crypto key access, `eval()` usage, external API calls without authorization
- All accepted skills pass network call inventory review
- Ongoing: skills are audited before installation

## Mitigation Layers

The system relies on defense-in-depth rather than any single control:

1. **VM boundary** -- agent-vm is isolated from the host
2. **UFW firewall** -- restricts inbound/outbound traffic
3. **Systemd sandboxing** -- services run with limited capabilities
4. **Input vetting** -- ClawHub skills audited, Discord inputs filtered
5. **Devil's Advocate gate** -- adversarial review before high-risk actions

## Related

- [[Security-Audits]] -- detailed audit findings
- [[Infrastructure-Map]] -- network and service topology
- [[Incident-Log]] -- past security-relevant incidents
