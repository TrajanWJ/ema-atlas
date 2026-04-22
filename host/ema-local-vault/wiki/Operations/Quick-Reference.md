---
id: "25ebc874-66b5-4b1e-9a98-eae760a7e17a"
title: "Quick Reference"
space: wiki
tags: ["ops","reference","commands"]
source: manual
---

# Quick Reference

## Start Services

```bash
# EMA Daemon
cd ~/Projects/ema/daemon && mix phx.server

# EMA Frontend (Tauri desktop app)
cd ~/Projects/ema/app && pnpm dev

# Superman Code Intelligence
cd ~/Desktop/superman && npm run server    # API on :3000
cd ~/Desktop/superman && npm run dev       # Dev on :3001
```

## EMA CLI (most used)

```bash
ema status                                  # System overview
ema watch                                   # Live PubSub event stream
ema dump "thought"                          # Quick brain dump
ema exec list --status running              # Running executions
ema exec create "research X" --mode research # Dispatch work
ema agent chat main "what should I do?"     # Chat with agent
ema task list --status todo                 # Pending tasks
ema task create "Fix X" --project ema       # Create task
ema proposal list --status queued           # Review queue
ema proposal approve <id>                   # Approve proposal
ema focus start --duration 25               # Pomodoro
ema habit today                             # Daily habits
ema journal write "notes" --mood good       # Journal
```

## Intent Engine (new)

```bash
ema intent list                             # All intents
ema intent list --level 1                   # Goals only (L1)
ema intent list --status active             # Active intents
ema intent create "Ship v2" --level 2 --kind goal  # Create goal intent
ema intent show <id>                        # Detail view
ema intent tree                             # Full hierarchy tree
ema intent tree --project ema               # Project-scoped tree
ema intent export                           # Markdown export
ema intent status                           # Status summary
ema intent context <id>                     # Full context with links/lineage
ema intent link <id> --depends-on <other>   # Link intents
```

## Vault Commands

```bash
ema vault search "auth architecture"        # Keyword search
ema vault tree                              # Directory tree
ema vault read wiki/Operations/Quick-Reference.md  # Read note
ema vault write wiki/new-page.md --content "..."   # Create/update note
ema vault graph                             # Link graph stats
ema vault backlinks <id>                    # Show backlinks
ema vault imports                           # Import provenance
ema vault stale                             # Stale intent projections
```

## Sessions & Orchestrator

```bash
ema session list                            # All sessions
ema session active                          # Active sessions
ema session show <id>                       # Session detail
ema session spawn "build auth" --project ema  # Spawn new session
ema session follow <id>                     # Check session status
ema session resume <id>                     # Resume session
ema session kill <id>                       # Kill session
ema session context --project ema           # Orchestrator context
ema session all                             # All orchestrator sessions
```

## Proposals & Seeds

```bash
ema proposal list --status queued           # Pending proposals
ema proposal show <id>                      # Detail
ema proposal approve <id>                   # Approve (creates execution)
ema proposal kill <id>                      # Kill
ema proposal redirect <id> --note "try X"   # Redirect (creates 3 seeds)
ema proposal lineage <id>                   # Show lineage

ema seed list                               # All seeds
ema seed create "Explore X" --project ema   # New seed
ema seed toggle <id>                        # Activate/pause
ema seed run-now <id>                       # Trigger immediately
```

## Engine & Pipes

```bash
ema engine status                           # Pipeline stage health
ema engine pause                            # Pause scheduler
ema engine resume                           # Resume scheduler

ema pipe list                               # All pipes
ema pipe show <id>                          # Detail
ema pipe create "My Pipe" --trigger "tasks:created"  # Create
ema pipe toggle <id>                        # Enable/disable
ema pipe fork <id>                          # Clone pipe
ema pipe catalog                            # Available triggers/actions
ema pipe history                            # Run history
```

## Projects & Goals

```bash
ema project list                            # All projects
ema project show ema                        # Detail by slug
ema project create "New" --slug new --path ~/Projects/new
ema project context ema                     # Context bundle
ema project dependencies ema                # Project tasks

ema goal list                               # All goals
ema goal create "Ship v2" --project ema     # New goal
ema goal show <id>                          # Detail with children
ema goal update <id> --status active        # Update
ema goal delete <id>                        # Delete
```

## Brain Dump

```bash
ema dump "quick thought"                    # Fastest capture
ema brain-dump list                         # All items
ema brain-dump unprocessed                  # Unprocessed items
ema brain-dump create "longer thought"      # Create with options
ema brain-dump process <id>                 # Mark processed
ema brain-dump delete <id>                  # Delete
```

## Agents

```bash
ema agent list                              # All agents
ema agent show main                         # Agent detail
ema agent chat main "message"               # Chat
ema agent conversations main                # List conversations
```

## Other Commands

```bash
ema campaign list / show / create / run / runs / advance
ema channel list / health / inbox / send
ema resp list / show / create / check-in / at-risk
ema habit list / create / toggle / today / archive
ema journal read / write / search / list
ema superman health / status / context / ask / gaps / index
ema babysitter <subcommand>
ema metamind <subcommand>
ema ralph <subcommand>
ema vectors <subcommand>
ema quality <subcommand>
ema dispatch-board <subcommand>
ema tokens <subcommand>
ema config <subcommand>
ema canvas <subcommand>
ema note <subcommand>
ema voice <subcommand>
ema org <subcommand>
ema actor <subcommand>
ema space <subcommand>
ema gap <subcommand>
ema integration <subcommand>
ema reflexion <subcommand>
ema ai-session <subcommand>
ema routing <subcommand>
ema git-sync <subcommand>
ema tunnel <subcommand>
ema file-vault <subcommand>
ema messages <subcommand>
ema team-pulse <subcommand>
ema metrics <subcommand>
ema feedback <subcommand>
ema dashboard
ema em <subcommand>
ema tag <subcommand>
ema data <subcommand>
ema evolution <subcommand>
```

## Global Flags

| Flag | Short | Purpose |
|------|-------|---------|
| `--json` | `-j` | Output as JSON |
| `--host URL` | `-H` | Daemon URL (default: localhost:4488) |

## Database

```bash
# EMA SQLite
sqlite3 ~/.local/share/ema/ema_dev.db

# Migrations
cd ~/Projects/ema/daemon && mix ecto.migrate

# Reset (destructive)
cd ~/Projects/ema/daemon && mix ecto.reset
```

## Ports

| Service | Port |
|---------|------|
| EMA Daemon | 4488 |
| Superman API | 3000 |
| Superman Dev | 3001 |

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Daemon won't start | `mix compile` then `mix phx.server` |
| Pending migrations | `cd daemon && mix ecto.migrate` |
| CLI can't reach daemon | Verify port 4488: `curl localhost:4488/api/health` |
| MCP server broken | Check `mix ema.mcp.stdio` runs (native Elixir, not Node.js) |

## Related

- [[CLI Reference]]
- [[Claude Code Setup]]
- [[EMA Architecture Overview]]
