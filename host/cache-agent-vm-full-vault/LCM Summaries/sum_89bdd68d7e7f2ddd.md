# LCM Summary sum_89bdd68d7e7f2ddd

Created: 2026-03-24 22:08:45
Kind: leaf
Depth: 0
Conversation: 1077
Tokens: 1215
Descendants: 0
Earliest: 2026-03-24T21:18:05.000Z
Latest: 2026-03-24T21:54:42.000Z

## Content

[2026-03-24 21:18 UTC]
Now I have the full picture. Claude Code has 16 custom agents, 6 MCP servers, 50+ skills, built-in sub-agent spawning, and a plugin ecosystem. Let me build the dynamic context generator and update the dispatch system.

[2026-03-24 21:18 UTC]
Successfully wrote 6914 bytes to /home/trajan/bin/coder-context-gen.sh

[2026-03-24 21:18 UTC]


[2026-03-24 21:18 UTC]
## Claude Code Capabilities

**Version:** 2.1.76 (Claude Code)

### Core Capabilities
- Full filesystem access (read, write, edit, glob, grep)
- Bash execution with no restrictions (bypassPermissions mode)
- Sub-agent spawning with custom models (opus/sonnet/haiku)
- MCP server integration (6 active servers)
- Plugin ecosystem with marketplace
- Project-level memory and context
- Git operations (commit, branch, diff, log)
- Web fetch for documentation/references

### Execution Patterns
- **One-shot:** `claude --print -p bypassPermissions 'task'`
- **With agent:** `claude --agent architect --print 'design this'`
- **Continue session:** `claude --continue --print 'follow up'`
- **Custom agents inline:** `--agents '{"reviewer": {"prompt": "...", "model": "sonnet"}}'`

### What You Should Do Differently
1. **Decompose large tasks** into sub-agent calls — don't try to hold everything in one context
2. **Use the architect agent** before building anything with 3+ files
3. **Use security-reviewer** before any auth/secrets/permissions code
4. **Use Explore agent** for quick file discovery instead of manual grep chains
5. **Read SKILL.md files** in ~/skills/ when the task matches a skill domain
6. **Use MCP servers** — graph-memory for persistent state, agent-fs for safe file ops
7. **Write tests** — use build-error-resolver if they fail instead of manual debugging

## Claude Code Agent Roster

Claude Code has built-in sub-agent orchestration. You can spawn any of these agents
as sub-agents within your session using the Task tool or by delegating naturally.
Each agent has its own model, tools, and personality. USE THEM — don't do everything yourself.

### Custom Agents
- **architect** (opus) — Software architecture specialist for system design, scalability, and technical decision-making. Use PROACTIVELY when planning new features, refactoring large systems, or making architectural decisions.
  Tools: ["Read", "Grep", "Glob"]
- **build-error-resolver** (sonnet) — Build and TypeScript error resolution specialist. Use PROACTIVELY when build fails or type errors occur. Fixes build/type errors only with minimal diffs, no architectural edits. Focuses on getting the build green quickly.
  Tools: ["Read", "Write", "Edit", "Bash", "Grep", "Glob"]
- **cron-ops** (haiku) — Cron job and scheduled task specialist. Use when creating, debugging, or managing recurring tasks, scheduled automation, health checks, and timed workflows. Manages system crontab and custom schedulers.
  Tools: ["Read", "Write", "Edit", "Bash", "Grep", "Glob"]
- **database-reviewer** (sonnet) — PostgreSQL database specialist for query optimization, schema design, security, and performance. Use PROACTIVELY when writing SQL, creating migrations, designing schemas, or troubleshooting database performance. Incorporates Supabase best practices.
  Tools: ["Read", "Write", "Edit", "Bash", "Grep", "Glob"]
- **discord-ops** (sonnet) — Discord operations specialist for rich message formatting, bot interactions, channel management, and voice features. Use when building Discord bot features, formatting rich output, or managing Discord server operations.
  Tools: ["Read", "Write", "Edit", "Bash", "Grep", "Glob"]
- **doc-updater** (haiku) — Documentation and codemap specialist. Use PROACTIVELY for updating codemaps and documentation. Runs /update-codemaps and /update-docs, generates docs/CODEMAPS/*, updates READMEs and guides.
  Tools: ["Read", "Write", "Edit", "Bash", "Grep", "Glob"]
- **goal-aligner** (sonnet) — Analyze alignment between daily activities and long-term goals. Identify gaps, over/under-investment, and suggest rebalancing. Use for goal audits and priority checks.
  Tools: Read, Grep, Glob, TaskCreate, TaskUpdate, TaskList
- **inbox-processor** (sonnet) — Process inbox items using GTD principles. Categorize, clarify, and organize captured notes into actionable items. Use for inbox zero and capture processing.
  Tools: Read, Write, Edit, Glob, Bash, TaskCreate, TaskUpdate, TaskList
- **knowledge-engineer** (sonnet) — Knowledge management specialist for capturing, organizing, and retrieving knowledge across the vault, knowledge graph, and memory systems. Use when processing session transcripts, syncing skill inventories, managing the knowledge graph, or maintaining long-term memory.
  Tools: ["Read", "Write", "Edit", "Bash", "Grep", "Glob"]
- **note-organizer** (sonnet) — Organize and 
[LCM fallback summary; truncated for context management]
