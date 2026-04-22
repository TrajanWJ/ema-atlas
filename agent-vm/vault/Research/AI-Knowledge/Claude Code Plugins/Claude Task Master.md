---
title: "Claude Task Master (TaskMaster AI)"
type: research
created: 2026-04-05
confidence: 0.88
tags: [taREDACTED_TOKEN, mcp, prd, claude-code, ai-tools]
summary: "AI-powered task management MCP server that parses PRDs into structured tasks with dependency tracking for AI coding environments."
source: T1
---

# Claude Task Master (TaskMaster AI)

> AI-powered task management — turns PRDs into structured, actionable tasks.

## Quick Info

| Field | Value |
|---|---|
| **GitHub** | [eyaltoledano/claude-task-master](https://github.com/eyaltoledano/claude-task-master) |
| **Stars** | 25,900+ |
| **Version** | 0.43.0 (Feb 2026) |
| **License** | MIT with Commons Clause |

## Features

- Parse PRDs into structured tasks with dependencies
- AI-driven breakdown, prioritization, complexity estimation
- Natural language interaction ("What tasks are available next?")
- Research capabilities with fresh information retrieval
- Cross-tag task movement with dependency management
- Project complexity analysis
- Compatible with Cursor, Lovable, Windsurf, Roo, VS Code, Q Developer

## Tool Loading Modes

| Mode | Tools | Token Usage | Best For |
|---|---|---|---|
| `all` (default) | 36 | ~21,000 | Complete feature set |
| `standard` | 15 | ~10,000 | Common operations |
| `core` | 7 | ~5,000 | Essential workflow (~70% token reduction) |
| `custom` | Variable | Variable | Specific tools only |

Configure via `TASK_MASTER_TOOLS` env var in MCP config.

### Core Tools (7)

`get_tasks`, `next_task`, `get_task`, `set_task_status`, `update_subtask`, `parse_prd`, `expand_task`

### Standard adds (15 total)

`initialize_project`, `analyze_project_complexity`, `expand_all`, `add_subtask`, `remove_task`, `generate`, `add_task`, `complexity_report`

### All Tools (36)

Complete set including project setup, management, analysis, dependencies, tags, and research.

## Install via MCP

```bash
claude mcp add taskmaster-ai -- npx -y task-master-ai
```

Or global install:
```bash
npm install -g task-master-ai
task-master init
```

Works without extra API keys when using Claude Code's OAuth.

## API Key Support

At least one provider required (unless using Claude Code OAuth):
Anthropic, OpenAI, Google Gemini, Perplexity (research), xAI, OpenRouter, Mistral, Groq, Azure OpenAI, Ollama

## Setup

1. Initialize: `task-master init` or ask Claude "Initialize taskmaster-ai in my project"
2. Create PRD at `.taskmaster/docs/prd.txt` (recommended but optional)
3. Ask: "Parse the PRD and create tasks"
4. Task files stored as JSON in `.taskmaster/`

## License Details

MIT with Commons Clause:
- Permits personal and commercial use, modification, distribution
- **Prohibits** selling Task Master itself, offering hosted versions, or creating competing products

## Gotchas

- **168 open issues** as of Mar 2026 — very active development
- If initialization fails, try: `node node_modules/claude-task-master/scripts/init.js`
- Restart editor after API key configuration changes
- API keys go in `.env` or MCP configuration

## Workflow Overview

The canonical TaskMaster workflow:

1. **Write a PRD** — Place project requirements in `.taskmaster/docs/prd.txt`. Can be rough or detailed; the AI fills gaps.
2. **Parse** — `parse_prd` turns the PRD into a task list with IDs, dependencies, and priority scores.
3. **Iterate** — `next_task` surfaces the highest-priority unblocked task. `expand_task` breaks it into subtasks.
4. **Update** — `set_task_status` marks tasks done/in-progress/pending. `update_subtask` appends implementation notes.
5. **Analyze** — `analyze_project_complexity` and `complexity_report` identify high-risk tasks before you start them.

All task data lives in `.taskmaster/tasks/` as JSON files. Human-readable markdown is auto-generated alongside each task file for easy review outside the AI context.

## Multi-Model Strategy

TaskMaster routes to different models per role:
- **main** — primary reasoning (Claude, GPT-4o, Gemini)
- **research** — web-augmented queries via Perplexity (requires separate key)
- **fallback** — backup if main model fails

This lets teams use cheaper models for routine operations and stronger models for complex breakdowns. Configure via `.taskmaster/config.json` or env vars.

## Tag System

Tasks can be tagged to support parallel workstreams or feature branches. `cross_tag_task` moves a task between tag contexts while preserving dependency state. Useful when multiple feature branches need separate task views from the same PRD.

## Adoption Context

As of early 2026, TaskMaster is one of the most-starred Claude Code MCP plugins (~26K stars). Widely used in Cursor and Windsurf workflows. The Commons Clause restriction on selling or hosting has not hindered adoption for internal use. The 168+ open issues reflect a fast-moving project — upstream regressions in MCP compatibility are common; pin to a tested version for stability.

## Token Budget Considerations

At 36 tools × ~580 tokens/tool, loading the full tool set consumes ~21K tokens per context window. For long sessions or models with smaller context, use `core` mode (7 tools, ~5K tokens). The tradeoff: `core` mode loses `add_task`, `remove_task`, dependency management, and research tools.

Source: [README](https://github.com/eyaltoledano/claude-task-master)

## See Also

- [[CCPM]] — PRD-to-code pipeline with GitHub Issues
- [[MeisnerDan Mission Control]] — has its own task management

#taREDACTED_TOKEN #mcp #prd #essential
