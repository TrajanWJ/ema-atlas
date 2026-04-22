---
type: research
wiki_id: research/AI-Knowledge/Claude_Code_Plugins/Claude_Task_Master
imported_from: vault/Research/AI-Knowledge/Claude Code Plugins/Claude Task Master.md
imported_at: '2026-04-04T00:23:56.974Z'
tags: []
summary: ''
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

Source: [README](https://github.com/eyaltoledano/claude-task-master)

## See Also

- [[CCPM]] — PRD-to-code pipeline with GitHub Issues
- [[MeisnerDan Mission Control]] — has its own task management

#task-management #mcp #prd #essential
