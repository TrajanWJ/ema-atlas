# codevault-mcp

An MCP server that gives Claude deep understanding of any codebase — database schema, API routes, auth flows, infrastructure status, and the ability to make safe, validated code changes with rollback.

## Install

```bash
npm install -g codevault-mcp
```

## Claude Desktop Config

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "codevault": {
      "command": "npx",
      "args": ["-y", "codevault-mcp"]
    }
  }
}
```

## Start locally

```bash
npx codevault-mcp
```

## Tools

### `analyze_repo(path)`
Index a codebase and return its full model: files, functions, API routes with auth, database schema, external services, and missing env vars.

> "Analyze the project at /Users/me/my-app"

### `ask_codebase(question)`
Get structured project context to answer any question — routes, schema, auth, infrastructure.

> "Can a non-admin user delete other users?"
> "What database does this project use and what are the models?"
> "Which API endpoints have no authentication?"

### `apply_task(surgical_edits?, file_writes?)`
Apply code changes safely with validation. Accepts surgical line-range edits or full file writes. Checks syntax, validates content isn't prose, runs build with baseline diffing, and reports ripple effects.

> Use after deciding what code to change. Provide the exact edits.

### `get_gaps()`
Return ranked list of issues: incomplete systems, missing validation, broken flows.

> "What are the biggest gaps in this project?"

### `simulate_flow(flow_name)`
Trace a user flow step by step through the code, identifying issues at each step.

> "Simulate the login flow"
> "Simulate the onboarding flow"

### `get_status()`
Current session: health score, graph size, infrastructure, rollback availability.

### `rollback_last()`
Undo all changes from the last `apply_task` call.

## How It Works

1. `analyze_repo` indexes the project once and caches it in memory
2. All other tools use the cached session — no re-indexing
3. `apply_task` captures snapshots before changes for safe rollback
4. Build verification uses baseline diffing — pre-existing errors are ignored
5. No internal Claude API calls — tools are deterministic executors
