---
title: Claude Code Hidden Features — March 2026 (Boris Cherny)
type: knowledge
created: '2026-03-30'
source: 'https://www.reddit.com/gallery/1s7j9f2'
confidence: 0.9
tags:
  - claude-code
  - hidden-features
  - productivity
  - power-user
  - agentic
  - worktrees
  - hooks
  - dispatch
summary: >-
  15 underdocumented Claude Code features from Boris Cherny (CC creator), March
  30 2026. Plus two active cache bugs with workarounds. High applicability to
  OpenClaw+vault setup.
wiki_id: reference/Claude-Code-Hidden-Features-2026-March
imported_from: vault/Reference/Claude-Code-Hidden-Features-2026-March.md
imported_at: '2026-04-04T00:23:56.914Z'
---

# Claude Code Hidden Features — March 2026

*Source: Boris Cherny (@bcherny) X thread, surfaced via r/ClaudeCode Mar 30 2026 (★182)*  
*Related: [[Claude-Code-Power-Patterns]], [[Claude-Code-Quick-Wins]]*

---

## The 15 Features

### 1. Mobile App
iOS and Android apps. Write code, review PRs from phone.

### 2. Teleport Sessions
```bash
claude --teleport
# or inside session:
/teleport
```
Pull a cloud session down to local machine. Useful for continuing work across machines.

### 3. Remote Control
```
/remote-control
```
Manage a local Claude Code session from any other device.

### 4. /loop and /schedule — Task Automation
Run slash commands on intervals (minutes to a week):
```
/loop 5m /babysit          # address code review every 5 min
/loop 30m /slack-feedback  # auto-PR for Slack feedback
/loop /post-merge-sweeper  # address missed review comments
/loop 1h /pr-pruner        # close stale PRs
```
**OpenClaw applicability:** High. Could run `/loop` tasks in dispatch-engine.sh for recurring agent-side maintenance tasks. Investigate pairing with cron-mastery skill.

### 5. Hooks — Lifecycle Events
Full hook system beyond PreToolUse:
- `SessionStart`
- `PreToolUse`
- `PermissionRequest`
- `Stop`

**Note:** PreToolUse already in use for enforcement (~100% compliance). SessionStart hook could initialize vault state or warm context.

### 6. Dispatch (Cowork)
Secure remote control for Claude Desktop. Uses your MCPs and browser. Different from `/remote-control` — this is cross-device desktop-level access.

### 7. Chrome Extension
Browser verification for frontend work. Integrated browser testing without leaving the agent.

### 8. Desktop App Web Server Testing
Auto-starts web servers and tests with an integrated browser. Reduces manual round-trips for frontend dev.

### 9. /branch — Fork Sessions
```bash
/branch
# or
claude --resume <session-id> --fork-session
```
Fork a session at a point in time. Run alternatives from the same branch point. **Useful for exploratory multi-agent work.**

### 10. /btw — Non-Interrupting Side Questions
```
/btw what's the shape of the User type here?
```
Ask ephemeral questions without interrupting active work. Cached, no tools, no side effects. Answers don't affect active task context.

**OpenClaw applicability:** High for Right Hand sessions — ask context questions without disrupting ongoing dispatch chains.

### 11. Git Worktrees — Deep Integration
```bash
claude -w          # launch with worktree support
# or Desktop: checkbox in settings
```
Run dozens of parallel agents across git worktrees. Each agent gets its own working directory without branch conflicts.

**Already partially in use.** Formalize in dispatch-engine for true parallel codebases.

### 12. /batch — Fan Out to Worktree Agents
```
/batch
```
Fans work to many worktree agents simultaneously. Designed for large-scale migrations, refactors, or bulk file operations.

Scale: "dozens to thousands" of parallel agents in principle.

### 13. --bare Flag — 10x Startup Speedup ⭐
```bash
claude --bare --print "task"
```
Skips auto-loading of CLAUDE.md, settings, MCPs. Up to **10x startup speedup** for SDK/CI contexts.

**Action:** Add `--bare` to dispatch-engine.sh for any agent invocations where CLAUDE.md context isn't needed. Speeds up burst parallelism significantly.

### 14. --add-dir — Multi-Repo Access
```bash
claude --add-dir /path/to/other/repo
```
Grant access to additional repos beyond primary working directory. Useful for cross-repo operations without changing cwd.

### 15. Custom Agents
Define in `.claude/agents/` with:
- Restricted tool sets
- Custom model selection
- Custom colors

**Bonus: /voice** — hold spacebar to speak; rolling out to users.

---

## Cache Bugs (Active as of March 2026)

*Source: r/ClaudeCode PSA thread, ★148*

### Bug 1: Prompt Cache Write Broken (v2.1.59+)
- **Symptom:** Cache writes silently broken — files re-read from scratch every request
- **Impact:** 10-20x API cost; hitting weekly limits in hours
- **Issue:** GitHub #28899 (resolved)
- **Workarounds:**
  - Downgrade below v2.1.59
  - Add CLAUDE.md instruction to minimize file reads
  - Use MCP dependency graph server (~70% token reduction reported)

### Bug 2: Stale KV Cache After Compaction (v2.1.62)
- **Symptom:** Post-compaction cached prefixes stale but still served; model asserts files don't exist, continues stale plans, resists correction
- **Impact:** Silent task corruption in long sessions; hard to detect
- **Issue:** GitHub #29230 (closed "not planned", locked — server-side change)
- **Workarounds:**
  - `--no-compaction` flag on long-running sessions
  - Prefer fresh sessions over resuming compacted ones

**For OpenClaw dispatch-engine.sh:** Apply `--no-compaction` to any agent invocation with >1 context compaction expected. Document affected version ranges.

---

## Priority Actions for This Setup

| Action | Why | Priority |
|---|---|---|
| Add `--bare` to dispatch-engine.sh invocations | 10x startup speed where CLAUDE.md not needed | High |
| Add `--no-compaction` to long dispatch sessions | Bug 2 workaround; prevents stale task corruption | High |
| Explore `/btw` in Right Hand sessions | Non-disruptive side questions mid-task | Medium |
| Evaluate `/loop` for recurring maintenance | Could replace some cron patterns | Medium |
| Test `/branch` for parallel strategy exploration | Fork-point exploration for uncertain tasks | Low |

---

## Related Notes
- [[Claude-Code-Power-Patterns]] — scored catalog of CC patterns
- [[Claude-Code-Quick-Wins]] — fast-apply improvements
- [[System/Intelligence Notes/--bare-flag-in-claude-code-cli-provides-10x-sdk-st.md]] — extracted intelligence note
- [[System/Intelligence Notes/claude-code-cache-bugs-causing-10-20x-api-cost-inf.md]] — cache bug intelligence note
