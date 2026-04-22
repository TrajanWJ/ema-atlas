# Research - Self-Hosted AI Agent Platforms 2026

> Comparison of self-hostable AI agent tools for Docker deployment on a personal workstation. Evaluated 2026-03-12.

## Context

Evaluating options for running AI agent infrastructure safely in Docker on Trajan's primary Linux workstation. Key priorities: security isolation, Docker support quality, resource footprint, and integration with existing Claude Code stack.

## Comparison Matrix

| Tool | Type | Language | Docker | Security Model | Resource Use | Maturity | Stars |
|---|---|---|---|---|---|---|---|
| [[OpenClaw]] | AI assistant (20+ platforms) | TypeScript | Full (compose + sandbox) | High risk — shell access, supply chain attack history | 2GB+ RAM | 4 months, massive community | 307K |
| [[builderz-labs Mission Control]] | Agent orchestration dashboard | TypeScript | Full (hardened compose) | Strong — read-only fs, cap drop, RBAC | 512MB RAM | 1 month, alpha | 2.3K |
| **IronClaw** | AI assistant | Rust | Yes | Best — WASM sandbox, capability-based | Moderate | Newer, security-focused | -- |
| **ZeroClaw** | AI assistant | Rust | Yes | Strong — security-first architecture | Low (ARM-capable) | Newer | -- |
| **NanoClaw** | AI assistant | TypeScript | Yes (real isolation) | Good — Docker container per agent | Moderate | Newer | -- |
| **Nanobot** | AI assistant | Python | Manual | Auditable — only 4K LOC | Low | Stable | -- |
| **PicoClaw** | AI assistant | Go | Yes | Minimal surface | <10MB RAM | Newer | -- |
| **AnythingLLM** | LLM web UI | Mixed | Full | Moderate | Moderate | Established | -- |
| **Dify** | Low-code agent platform | Python | Full | Moderate | Higher (Redis, Postgres) | Established | 40K+ |

## Tier Ranking for Trajan's Setup

### Tier 1 — Strong Fit (Docker-ready, good security, complements stack)

**[[builderz-labs Mission Control]]** — Best immediate fit. Zero external deps, hardened Docker compose out of box, auto-discovers Claude Code sessions, monitors token usage. Complements existing [[CloudCLI]] setup. Alpha risk is manageable for a monitoring dashboard.

### Tier 2 — Worth Evaluating (good fit with caveats)

**[[OpenClaw]]** — Most capable AI assistant option. Massive community means good support. But: supply chain attack history (ClawHavoc), enormous attack surface, must run in strict Docker isolation. Deploy on dedicated VM or VPS, not primary workstation.

**IronClaw** — Best security model (WASM sandbox). Worth evaluating if security is the top priority over community size.

**AnythingLLM** — Simpler scope (LLM UI), established project, multi-provider support. Good if you just want a chat UI without agent orchestration.

### Tier 3 — Niche / Deferred

**Nanobot** — Easy to audit (4K LOC Python) but limited features. Good for learning or minimal setups.

**PicoClaw / ZeroClaw** — Ultra-lightweight options for constrained environments. Not needed on a workstation.

**Dify** — Full platform but requires Redis + Postgres. More infra overhead than needed.

## Docker Security Checklist for Any Self-Hosted Agent

Regardless of which tool you deploy:

- [ ] Run as non-root user inside container
- [ ] `cap_drop: ALL`, add back only what's needed
- [ ] `no-new-privileges: true`
- [ ] `read_only: true` where possible
- [ ] Memory and CPU limits set
- [ ] PID limits set
- [ ] Dedicated Docker network (not host networking)
- [ ] Only mount directories the tool needs — never `$HOME`
- [ ] Bind to `127.0.0.1`, reverse proxy for external access
- [ ] Keep API keys out of container env — use Docker secrets or mounted files
- [ ] Enable log rotation
- [ ] Regular image updates

## Recommendations

1. **Start with Mission Control** — lowest risk, best Docker defaults, immediate value for monitoring Claude Code sessions
2. **Evaluate OpenClaw in a VM** — don't run on primary workstation until you've audited it. Use a Tailscale-connected VPS or local VM
3. **Watch IronClaw** — if security-first Rust alternative matures, it may be the safer long-term choice for an AI assistant
4. **Keep CloudCLI running** — it's proven and stable. Mission Control can run alongside it on a different port

## See Also

- [[OpenClaw]] — detailed evaluation
- [[builderz-labs Mission Control]] — detailed evaluation
- [[CloudCLI]] — current setup
- [[My Stack Decisions]] — overall architecture

#research #self-hosted #docker #ai-agents #evaluated
