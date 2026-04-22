---
title: "Self-Hosted AI Agent Platforms 2026"
type: research
created: 2026-03-12
updated: 2026-04-10
confidence: medium-high
source: primary research, GitHub repos, official docs
tags: [research, self-hosted, docker, ai-agents, evaluated]
summary: "Comparison of self-hostable AI agent tools for Docker deployment on a personal workstation, with security analysis and tier ranking"
---

# Research - Self-Hosted AI Agent Platforms 2026

> Comparison of self-hostable AI agent tools for Docker deployment on a personal workstation. Originally evaluated 2026-03-12, updated 2026-04-10.

## Context

Evaluating options for running AI agent infrastructure safely in Docker on Trajan's primary Linux workstation. Key priorities: security isolation, Docker support quality, resource footprint, and integration with existing [[My Stack Decisions|Claude Code stack]].

## Landscape Overview

The self-hosted AI agent space has matured significantly through 2025-2026. Tools fall into three categories:

1. **Chat/Assistant UIs** — frontends for interacting with LLMs (Open WebUI, AnythingLLM, LibreChat)
2. **Agent/Workflow Platforms** — visual builders for complex agent pipelines (Dify, Flowise, Langflow)
3. **Orchestration Frameworks** — code-first multi-agent libraries (CrewAI, AutoGen/AG2, LangGraph)

## Comparison Matrix

| Tool | Type | Language | Docker | Security Model | Resource Use | Maturity |
|---|---|---|---|---|---|---|
| **Open WebUI** | LLM chat UI + tools | Python/Svelte | Single container | Multi-user auth, Functions run in-process | 1-2GB RAM | Very active, 50K+ stars |
| **Dify** | Visual agent/workflow platform | Python | 6-8 containers (Compose) | Separate sandbox container, SSO (enterprise) | 4-8GB RAM | Established, 40K+ stars |
| **AnythingLLM** | All-in-one RAG + chat | Node.js/React | Single container | Basic auth, in-process code exec | 2GB RAM | Active, growing |
| **LibreChat** | Multi-provider chat | Node.js | 2-3 containers | Multi-user, plugin system | 2GB RAM | Active, strong community |
| **Flowise** | Visual LangChain builder | Node.js | Single container | Basic auth, in-process | 1-2GB RAM | Active |
| [[OpenClaw]] | AI assistant (20+ platforms) | TypeScript | Full (compose + sandbox) | High risk — shell access, supply chain attack history | 2GB+ RAM | Massive community, 307K stars |
| [[builderz-labs Mission Control]] | Agent orchestration dashboard | TypeScript | Full (hardened compose) | Strong — read-only fs, cap drop, RBAC | 512MB RAM | Alpha |
| **IronClaw** | AI assistant | Rust | Yes | Best — WASM sandbox, capability-based | Moderate | Security-focused |
| **Nanobot** | AI assistant | Python | Manual | Auditable — only 4K LOC | Low | Stable |
| **n8n (AI nodes)** | Workflow automation + AI | TypeScript | Full | Role-based, self-hosted | 2-4GB RAM | Established |

## Agent Orchestration Frameworks

These are libraries, not standalone deployable platforms. You containerize your own application that uses them:

- **CrewAI** — Multi-agent crews with roles, goals, and tools. Python library. Popular for defined multi-step workflows. Enterprise cloud offering exists alongside open-source.
- **AutoGen / AG2** — Microsoft's multi-agent framework. Major 0.2→0.4 rewrite caused ecosystem disruption. AutoGen Studio provides a web UI with Docker support. Community fork "AG2" emerged during restructuring.
- **LangGraph** — LangChain's graph-based agent orchestration. Increasingly the standard for complex agent workflows in the LangChain ecosystem. LangGraph Cloud exists as managed service; core library is open source.

## Tier Ranking for Trajan's Setup

### Tier 1 — Strong Fit (Docker-ready, good security, complements stack)

**[[builderz-labs Mission Control]]** — Best immediate fit. Zero external deps, hardened Docker compose out of box, auto-discovers Claude Code sessions, monitors token usage. Complements existing [[My Stack Decisions|CloudCLI setup]]. Alpha risk is manageable for a monitoring dashboard.

**Open WebUI** — If a general LLM chat frontend is needed. Single container, great Ollama integration, well-maintained. The "Pipelines" system adds basic agent capabilities without the overhead of a full platform.

### Tier 2 — Worth Evaluating (good fit with caveats)

**[[OpenClaw]]** — Most capable AI assistant option. Massive community means good support. But: supply chain attack history (ClawHavoc), enormous attack surface, must run in strict Docker isolation. Deploy on dedicated VM or VPS, not primary workstation.

**Dify** — Best visual workflow builder and strongest built-in sandboxing (separate container for code execution). But requires Redis + PostgreSQL + vector store — significant infra overhead for a workstation. Best fit if building complex agent pipelines.

**IronClaw** — Best security model (WASM sandbox). Worth evaluating if security is the top priority over community size.

**AnythingLLM** — Simple all-in-one with RAG. Single container, low overhead. Good if you want embedded document Q&A without complex orchestration. Code execution runs in-process (security concern).

### Tier 3 — Niche / Deferred

**Nanobot** — Easy to audit (4K LOC Python) but limited features. Good for learning or minimal setups.

**n8n** — Not AI-native, but increasingly capable for AI agent workflows via AI nodes. Worth considering if you already use n8n for other automation.

**Flowise / Langflow** — Visual LangChain builders. Useful if you're deep in the LangChain ecosystem. Otherwise Dify covers this space better.

**LibreChat** — Strong ChatGPT replacement but overlaps with Open WebUI. Choose one.

## Docker Security Checklist for Any Self-Hosted Agent

The fundamental threat model is different from typical web apps: the threat is the agent itself (via prompt injection or hallucinated tool calls), not external attackers.

### Container Hardening

- [ ] Run as non-root user inside container
- [ ] `cap_drop: ALL`, add back only what's needed
- [ ] `no-new-privileges: true`
- [ ] `read_only: true` where possible
- [ ] Memory and CPU limits set (`--memory`, `--cpus`)
- [ ] PID limits set (`--pids-limit`)
- [ ] Use `--tmpfs /tmp` for scratch space

### Network Isolation

- [ ] Dedicated Docker network (not host networking)
- [ ] Use `--network=none` for agents that don't need internet
- [ ] Bind to `127.0.0.1`, reverse proxy for external access
- [ ] Consider egress proxy that whitelists specific outbound domains
- [ ] Never mount `/var/run/docker.sock` (trivial container escape)

### Secrets & Storage

- [ ] Keep API keys out of container env — use Docker secrets or mounted files
- [ ] Only mount directories the tool needs — never `$HOME`
- [ ] Use `:ro` (read-only) for host mounts where possible
- [ ] Enable log rotation
- [ ] Regular image updates

### Advanced (for higher-security requirements)

- [ ] gVisor runtime (`--runtime=runsc`) for stronger isolation than default runc
- [ ] Separate sandbox containers for code execution (Dify's model)
- [ ] Firecracker microVMs for truly untrusted code execution

## Platform Security Comparison

| Platform | Code Exec Sandboxing | Auth Model | Network Isolation |
|---|---|---|---|
| Open WebUI | Functions in main process | Multi-user, roles | No built-in |
| Dify | Separate sandbox container | Multi-user, SSO (enterprise) | Partial |
| AnythingLLM | In-process | Basic multi-user | No built-in |
| OpenClaw | Configurable | Token-based | No built-in |
| Flowise | In-process | Basic | No built-in |
| Mission Control | N/A (monitoring only) | RBAC | Hardened by default |

## Recommendations

1. **Start with Mission Control** — lowest risk, best Docker defaults, immediate value for monitoring Claude Code sessions
2. **Add Open WebUI** if you need a general LLM chat interface — single container, minimal fuss
3. **Evaluate OpenClaw in a VM** — don't run on primary workstation until audited. Use a Tailscale-connected VPS or local VM
4. **Consider Dify** only if you need complex visual agent workflows — the infra overhead is justified only for that use case
5. **Watch IronClaw** — if the security-first Rust alternative matures, it may be the safer long-term choice
6. **For code-first orchestration** — LangGraph or CrewAI as libraries in your own container, not as standalone platforms

## MCP Integration Note

With [[Obsidian-Claude Connectivity|Anthropic's MCP]] gaining adoption rapidly through 2025-2026, many of these platforms are adding MCP support. This changes the tool integration story — platforms with MCP support can share tool definitions rather than each maintaining proprietary integrations. Check current MCP support before deploying.

## See Also

- [[OpenClaw]] — detailed evaluation
- [[builderz-labs Mission Control]] — detailed evaluation
- [[My Stack Decisions]] — overall architecture
- [[Research - Security and Quality Tools 2026]] — related security tooling
- [[Research - Claude Code Ecosystem March 2026]] — Claude Code specific tooling
