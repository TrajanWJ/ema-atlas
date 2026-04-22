# LCM Summary sum_a962a97fadaf6a87

Created: 2026-03-24 04:59:12
Kind: leaf
Depth: 0
Conversation: 940
Tokens: 1215
Descendants: 0
Earliest: 2026-03-23T00:37:28.000Z
Latest: 2026-03-23T00:42:46.000Z

## Content

[2026-03-23 00:37 UTC]
Command still running (session good-cove, pid 55462). Use process (list/poll/log/write/kill/clear/remove) for follow-up.

[2026-03-23 00:37 UTC]


[2026-03-23 00:37 UTC]
PID: 55463
[cli] Config "graph-memory.yaml" not found, using current directory as project
[project-manager] Added project "vault" (/home/trajan/vault)
[embedder] Downloading model Xenova/bge-m3 to /home/trajan/.graph-memory/models...


Process exited with code 0.

[2026-03-23 00:37 UTC]
Model downloading. Let me let it run in the background and continue with other installs.

[2026-03-23 00:37 UTC]
Command still running (session tide-fjord, pid 55597). Use process (list/poll/log/write/kill/clear/remove) for follow-up.

[2026-03-23 00:37 UTC]


[2026-03-23 00:37 UTC]
GraphMemory downloading model + starting, PID: 55598
No .mcp.json yet


Process exited with code 0.

[2026-03-23 00:37 UTC]


[2026-03-23 00:37 UTC]
---
/home/trajan/.openclaw/active-channels-registry.json
/home/trajan/.openclaw/context-card-ids.json
/home/trajan/.openclaw/cron-definitions.json
/home/trajan/.openclaw/crons-backup.json
/home/trajan/.openclaw/exec-approvals.json
/home/trajan/.openclaw/openclaw.json
/home/trajan/.openclaw/update-check.json

[2026-03-23 00:37 UTC]


[2026-03-23 00:37 UTC]
{}
---
{
  "antfly": {
    "url": "http://localhost:8080/mcp/v1/"
  },
  "need": {
    "command": "need",
    "args": [
      "mcp"
    ],
    "env": {}
  },
  "agent-fs": {
    "command": "/home/trajan/.bun/bin/agent-fs",
    "args": [
      "mcp"
    ],
    "env": {}
  },
  "apitap": {
    "command": "/home/trajan/.bun/bin/apitap-mcp",
    "args": [],
    "env": {}
  }
}
===
{
  "mcpServers": {
    "antfly": {
      "url": "http://localhost:8080/mcp/v1/",
      "disabled": false
    },
    "CodeGraphContext": {
      "command": "/home/trajan/.local/bin/cgc",
      "args": [
        "mcp",
        "start"
      ],
      "env": {
        "DEFAULT_DATABASE": "falkordb",
        "FALKORDB_PATH": "/home/trajan/.codegraphcontext/falkordb.db",
        "FALKORDB_SOCKET_PATH": "/home/trajan/.codegraphcontext/falkordb.sock",
        "INDEX_VARIABLES": "true",
        "ALLOW_DB_DELETION": "false",
        "DEBUG_LOGS": "false",
        "DEBUG_LOG_PATH": "/home/trajan/mcp_debug.log",
        "ENABLE_APP_LOGS": "CRITICAL",
        "LOG_FILE_PATH": "/home/trajan/.codegraphcontext/logs/cgc.log",
        "MAX_FILE_SIZE_MB": "10",
        "IGNORE_TEST_FILES": "false",
        "IGNORE_HIDDEN_FILES": "true",
        "ENABLE_AUTO_WATCH": "false",
        "COMPLEXITY_THRESHOLD": "10",
        "MAX_DEPTH": "unlimited",
        "PARALLEL_WORKERS": "4",
        "CACHE_ENABLED": "true",
        "IGNORE_DIRS": "node_modules,venv,.venv,env,.env,dist,build,target,out,.git,.idea,.vscode,__pycache__",
        "INDEX_SOURCE": "true"
      },
      "tools": {
        "alwaysAllow": [
          "add_code_to_graph",
          "add_package_to_graph",
          "check_job_status",
          "list_jobs",
          "find_code",
          "analyze_code_relationships",
          "watch_directory",
          "find_dead_code",
          "execute_cypher_query",
          "calculate_cyclomatic_complexity",
          "find_most_complex_functions",
          "list_indexed_repositories",
          "delete_repository",
          "list_watched_paths",
          "unwatch_directory",
          "visualize_graph_query"
        ],
        "disabled": false
      },
      "disabled": true,
      "alwaysAllow": []
    },
    "qmd": {
      "command": "/usr/bin/qmd",
      "args": [
        "mcp"
      ],
      "disabled": false
    },
    "taskmaster-ai": {
      "command": "npx",
      "args": [
        "-y",
        "task-master-ai@latest"
      ],
      "env": {
        "TASK_MASTER_TOOLS": "core"
      },
      "disabled": true
    },
    "serena": {
      "command": "uvx",
      "args": [
        "--from",
        "git+https://github.com/oraios/serena",
        "serena",
        "start-mcp-server",
        "--project-from-cwd"
      ],
      "disabled": true
    },
    "engram": {
      "command": "engram",
      "args": [
        "mcp"
      ],
      "disabled": false
    },
    "lightpanda": {
      "command": "lightpanda",
      "args": [
        "mcp"
      ],
      "disabled": true
    },
    "chrome-devtools": {
      "command": "npx",
      "args": [
        "chrome-devtools-mcp@latest",
        "--headless"
      ],
      "disabled": true
    },
    "markitdown": {
      "command": "markitdown-mcp",
      "args": [],
      "disabled": false
    },
    "GitGuardianDeveloper": {
      "command": "/home/trajan/.local/bin/uvx",
      "args": [
        "--from",
        "git+https://github.com/GitGuardian/ggmcp.git",
        "developer-mcp-server"
      ],
      "env": {
        "ENABLE_LOCAL_OAUTH": "false"

[LCM fallback summary; truncated for context management]
