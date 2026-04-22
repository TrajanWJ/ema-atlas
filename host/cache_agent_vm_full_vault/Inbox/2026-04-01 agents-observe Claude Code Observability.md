# agents-observe — Real-Time Observability for Claude Code Agent Teams

**Source:** Show HN, 67 points (6h) — April 1, 2026  
**Repo:** https://github.com/simple10/agents-observe  
**Tags:** #claude-code #observability #agentic #tooling

## What It Is

A real-time dashboard for monitoring Claude Code agent teams. Surfaces what each agent is doing, tool calls in flight, task status, and inter-agent message flow — all in a live UI.

Spotted during tonight's github-interesting cron scan as one of the freshest/most relevant finds.

## Why This Matters

Trajan runs a multi-agent stack on agent-vm (Right Hand + specialists spawned as Claude Code processes). Current visibility is basically:
- Reading session JSONL files after the fact
- Polling `sessions_list` manually
- Trusting agents to self-report via DONE/BLOCKED status

`agents-observe` could provide actual real-time visibility into what's running — which agents are active, which tools are being called, where things are stuck.

## Open Questions

- Does it work with OpenClaw-spawned Claude Code subagents or only standalone `claude` invocations?
- Is it a local server (self-hosted) or cloud dashboard?
- Does it require instrumentation changes or does it hook into existing Claude Code session files?
- 67 HN points in 6h — worth watching for further community uptake

## Next Steps

- [ ] Check the repo README for setup requirements
- [ ] Assess compatibility with OpenClaw subagent spawn pattern
- [ ] If lightweight: trial on agent-vm alongside a multi-agent run

## See Also

- [[AGENTS.md]] — current multi-agent dispatch protocol
- [[vault/Inbox/2026-03-31 Agent Dispatch Empty Task Content Bug.md]] — recent dispatch debugging
