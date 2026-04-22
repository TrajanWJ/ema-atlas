---
title: "README"
created: 2026-03-16
updated: 2026-03-16
type: agent
status: active
source: manual
tags: [agents, knowledge, openclaw, prompts, research, security]
summary: "Dynamic agent blueprints. Right Hand and other agents spawn specialists from these templates on demand."
---
# Agent Templates

Dynamic agent blueprints. Right Hand and other agents spawn specialists from these templates on demand.

## How It Works

1. **Task arrives** that doesn't fit existing agents
2. Right Hand (or any agent) checks `vault/Agents/Templates/` for a matching template
3. If template exists → spawn agent with that SOUL.md
4. If no template exists → generate one from the task description, save it here
5. Agent runs, delivers, then self-terminates (or stays if thread-bound)

## Template Format

Each template is a directory:
```
Templates/{name}/
  SOUL.md       — personality, expertise, voice
  IDENTITY.md   — name, emoji, accent color
  capabilities.md — what this agent can do, tools it prefers
  examples.md   — example tasks this agent handles well
```

## Core Agents (always available)
These are pre-configured in [[OpenClaw]].json and always running:
- 🤝 Right Hand, 🔬 Researcher, 💻 Coder, ⚙️ Ops, 🛡️ Security, 📚 Vault Keeper, 🔭 Scout

## Dynamic Agents (spawned on demand)
Generated from templates or created fresh when a task needs specialized expertise.
Templates are stored here and evolved based on [[usage patterns]].

## Quality Assurance
- New templates reviewed before first use
- After 3+ successful uses → promote to "proven" status
- After 3+ failures or corrections → revise or retire
- Monthly template audit during heartbeat

## Related

- [[README]]
