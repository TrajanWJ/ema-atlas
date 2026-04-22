---
title: Intercept — MCP Transport Layer Guardrails
source: 'https://github.com/PolicyLayer/Intercept'
created: '2026-03-19'
type: knowledge
tags:
  - mcp
  - security
  - guardrails
  - policy
  - agent-safety
confidence: 0.9
priority: HIGH
wiki_id: system/architecture/intercept-mcp-guardrails
imported_from: vault/Architecture/intercept-mcp-guardrails.md
imported_at: '2026-04-04T00:23:56.786Z'
summary: ''
---

# Intercept — MCP Guardrails by PolicyLayer

## What It Does
YAML-defined policies enforced at the MCP transport layer. Sits between agent and MCP server as a proxy. The agent never sees the rules — policies are invisible to the model, which means prompt injection cannot bypass them. Self-described as "the open-source control layer for AI agents in production."

## Key Features
- **Sub-1ms enforcement** — deterministic evaluation, negligible latency overhead
- **130+ policy templates** out of the box (scaffolds for popular MCP servers)
- **Rate limiting** — shorthand syntax like `rate_limit: 5/hour`
- **Spend caps** — stateful counters that aggregate across calls with sliding windows
- **Argument validation** — constraint checks on tool arguments (e.g., `amount <= 500`)
- **Tool hiding** — selectively hide tools so agents never discover them
- **Tool blocking** — deny dangerous operations unconditionally
- **Default-deny mode** — allowlist-based access for maximum safety
- **Audit logging** — structured decision records of what was blocked and why
- **Hot reload** — policy changes take effect without restart
- **Policy validation** — catches config errors before deployment

## Architecture
```
Agent <-> Intercept Proxy <-> MCP Server
               ^
          YAML policies
          (+ SQLite or Redis for state)
```

The proxy intercepts JSON-RPC messages. Policies are evaluated before forwarding. Blocked calls return a policy-defined error message to the agent. State tracking (spend counters, rate limits) backed by SQLite (default) or Redis for distributed deployments.

## Install Methods

**NPX (quick test):**
```sh
npx -y @policylayer/intercept -c policy.yaml --upstream https://mcp.stripe.com
```

**NPM (global install):**
```sh
npm install -g @policylayer/intercept
```

**Go binary:**
```sh
go install github.com/policylayer/intercept@latest
```

**Pre-built binaries** also available from GitHub Releases.

**MCP client integration** via `.mcp.json` configuration file.

No Docker required — it's an npm package or Go binary. Lightweight enough to run as a sidecar process.

## Install Assessment
This is immediately installable via npm or Go. No Docker dependency. Can be tested today with `npx`. For production, `npm install -g` or the Go binary are the right paths. Redis optional for multi-node setups.

## Why This Is Critical for Us
Our 27 agents have MCP access to: filesystem, git, Discord, web, databases. Current safety = SOUL file instructions (prompt-level = bypassable via injection). Intercept adds **infrastructure-level** enforcement that the agent literally cannot see or circumvent. Key distinction: deterministic enforcement at transport layer vs. probabilistic prompt-level compliance.

## Priority
**HIGH** — this is production-grade agent safety that's missing from our stack. Prompt-level guardrails are necessary but insufficient. Transport-level enforcement is the correct layer.

## Example Policy (from README)
```yaml
version: "1"
description: "Agent safety policies"

hide:
  - dangerous_tool_name

tools:
  bash:
    rules:
      - name: "no-force-push"
        conditions:
          - path: "args.command"
            op: "contains"
            value: "--force"
        on_deny: "Force push is not allowed"

  web_fetch:
    rules:
      - name: "rate-limit-web"
        rate_limit: 10/minute

  payment_tool:
    rules:
      - name: "spend-cap"
        conditions:
          - path: "args.amount"
            op: "<="
            value: 500
        on_deny: "Transaction exceeds $500 limit"
        state:
          counter: "daily_spend"
          window: "day"
          increment_from: "args.amount"
```

## Documentation
- CLI reference: `USAGE.md`
- Policy reference: `POLICY.md`
- 130+ example policies in `examples/` directory
- License: Apache 2.0

## Related
- [[security-agent-attack-vectors-2026-03-19]] — attack vectors this mitigates
- [[cycles-protocol-budget]] — complementary spend governance
- [[sandlock-cow-fork]] — complementary process isolation
- [[oh-my-harness]] — complementary NL guardrails at prompt level (already in watch-repos)
