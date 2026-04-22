---
title: "Cycles Protocol — Agent Budget Management"
source: https://github.com/runcycles/cycles-mcp-server
created: 2026-03-19
type: research
tags: [mcp, budget, cost-management, agent-governance, multi-tenant]
confidence: 0.75
---

# Cycles Protocol — Agent Budget Management via MCP

## What It Does
MCP server providing runtime budget authority for autonomous agents. Agents self-regulate spending through a reserve/commit/release lifecycle, preventing runaway costs across LLM calls, tool invocations, and external API requests.

As the README puts it: "A single agent loop can burn through hundreds of dollars before anyone notices."

## MCP Tools (9 total)
| Tool | Purpose |
|------|---------|
| `cycles_reserve` | Lock budget before an operation (prevents overdraft) |
| `cycles_commit` | Record actual usage after operation completes |
| `cycles_release` | Cancel a reservation without committing (return unused funds) |
| `cycles_extend` | Extend reservation TTL for long-running tasks |
| `cycles_decide` | Lightweight preflight budget check (no lock) |
| `cycles_check_balance` | Inspect remaining budget |
| `cycles_list_reservations` | Query reservations with filters |
| `cycles_get_reservation` | Retrieve details of a specific reservation |
| `cycles_create_event` | Record usage without the reserve/commit lifecycle |

## Operational Pattern
Three-step lifecycle: **reserve -> execute -> finalize** (commit or release).
Every reservation must be finalized — the protocol enforces this invariant.

## Key Features
- **Self-regulation**: Agent checks balance -> degrades to cheaper model when budget low
- **Multi-tenant isolation**: Each agent/session gets own budget namespace
- **TTL reservations**: Reserved funds auto-release after timeout (prevents deadlocks from crashed agents)
- **Preflight decisions**: `cycles_decide` is a cheap "can I afford this?" without locking funds
- **Heartbeat extensions**: Long-running tasks call `cycles_extend` to keep reservations alive

## Install
```bash
npm install @runcycles/mcp-server
```

### Claude Code integration
```bash
claude mcp add cycles -- npx -y @runcycles/mcp-server
```

### Claude Desktop
Add to `claude_desktop_config.json`:
```json
{
  "mcpServers": {
    "cycles": {
      "command": "npx",
      "args": ["@runcycles/mcp-server"],
      "env": { "CYCLES_API_KEY": "<your-key>" }
    }
  }
}
```

### Configuration
| Env Var | Purpose |
|---------|---------|
| `CYCLES_API_KEY` | Required (unless mock mode) |
| `CYCLES_BASE_URL` | Defaults to `https://api.runcycles.io` |
| `CYCLES_MOCK=true` | Local dev without credentials |

## Why Relevant
Our 27 agents have **zero spend governance** today. Any agent can:
- Make unlimited API calls
- Spawn unlimited subagents
- Run indefinitely without cost awareness

Cycles Protocol adds the missing budget layer:
1. Each agent gets a session budget
2. Agent calls `cycles_decide` or `cycles_check_balance` before expensive operations
3. When budget low: agent switches to cheaper model or defers task
4. Budget exceeded: agent gracefully stops and reports

## Integration with Our Stack
- Dispatch assigns budget per task priority (P0=$10, P1=$5, P2=$2, P3=$1)
- Agent calls `cycles_reserve` before: LLM API calls, web fetches, subagent spawns
- After operation: `cycles_commit` with actual cost, or `cycles_release` if skipped
- Low budget -> degrade: Opus->Sonnet->Haiku
- Zero budget -> return partial results + budget exhaustion notice
- Long tasks use `cycles_extend` as heartbeat to prevent TTL expiry

## Use Cases from README
- Per-task dollar caps for coding agents
- Multi-tenant SaaS budget isolation
- Shared budgets across orchestrated agent pipelines
- Long-running pipelines with heartbeat extensions
- Usage metering in existing systems

## License
Apache 2.0

## Related
- [[intercept-mcp-guardrails]] — complementary policy enforcement
- [[autoresearch-pattern]] — cheap->expensive split already has budget thinking
