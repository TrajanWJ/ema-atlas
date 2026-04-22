---
type: research
wiki_id: research/AI-Knowledge/Research_-_Claude_Code_Ecosystem_March_2026
imported_from: vault/Research/AI-Knowledge/Research - Claude Code Ecosystem March 2026.md
imported_at: '2026-04-04T00:23:56.979Z'
tags: []
summary: ''
---
# Research — Claude Code Ecosystem, March 2026

> State-of-the-ecosystem research as of 2026-03-11.
> Covers Claude Code core, plugins, hooks, MCP servers, Obsidian integration, and context engineering.

---

## 1. Claude Code Core — What's New

Your version: **2.1.74**. Latest published: **2.1.73** (3 hours ago on npm). You may actually be on a newer local build.

### Recent Features (Feb–Mar 2026)

| Feature | What It Does | Impact |
|---|---|---|
| **Agent Teams** (experimental) | Multiple Claude Code sessions collaborate — one lead, multiple teammates. Each teammate has its own context window. You can talk to teammates directly. | High for large projects. Enable with `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS`. |
| **Auto Memory** | Claude automatically records and recalls memories across sessions via `MEMORY.md`. First 200 lines loaded every session. Overflow goes to topic files in `~/.claude/projects/<project>/memory/`. | You already have this — your `MEMORY.md` is active. |
| **Compaction** | Auto-summarizes conversation at ~95% context usage. API supports up to 10M tokens with 58.6% token reduction. `/compact` command available manually. | Use `/compact` proactively before auto-compact triggers at 95% to preserve more context. |
| **/claude-api skill** | Built-in skill for building apps with the Claude API and Anthropic SDK. | Useful for meta-development. |
| **VS Code spark icon** | Activity bar icon lists all Claude Code sessions with full editors. Plans render as full markdown with comment support. | Better multi-session management in VS Code. |
| **Native MCP management dialog** | Enable/disable MCP servers and manage OAuth from within Claude Code. | Easier server management. |
| **Effort levels simplified** | Low/medium/high only (removed "max"). Symbols: circle-empty, circle-half, circle-full. Opus 4.6 defaults to medium for Max/Team subscribers. | Medium is the sweet spot for most tasks. |
| **Voice STT expanded** | 20 languages total (added Russian, Polish, Turkish, Dutch, Ukrainian, Greek, Czech, Danish, Swedish, Norwegian). | |
| **Bash auto-approval additions** | `lsof`, `pgrep`, `tput`, `ss`, `fd`, `fdfind` added to allowlist. | Fewer permission prompts. |
| **CLAUDE_CODE_DISABLE_CRON** | Env var to stop scheduled cron jobs mid-session. | Safety lever. |
| **Skill character budget scales** | 2% of context window — larger windows show more skill descriptions. | |

### Opus 4.6 Model (Released Feb 5, 2026)

| Capability | Details |
|---|---|
| Context window | 200K standard, 1M beta (tier 4+) |
| Max output | 128K tokens |
| Adaptive thinking | `thinking: {type: "adaptive"}` — Claude decides when/how much to think. Recommended mode. |
| Web search/fetch | Dynamic filtering — Claude writes code to filter results before they hit context. |
| Compaction API | `compact_20260112` strategy, supports up to 10M tokens across conversation. |
| Improvements over 4.5 | Stronger planning, better long-term concentration, improved large-codebase navigation. |

Sources: [Claude Code Changelog](https://github.com/anthropics/claude-code/blob/main/CHANGELOG.md) · [Opus 4.6 What's New](https://platform.claude.com/docs/en/about-claude/models/whats-new-claude-4-6) · [Releasebot](https://releasebot.io/updates/anthropic/claude-code) · [npm versions](https://www.npmjs.com/package/@anthropic-ai/claude-code?activeTab=versions)

---

## 2. Superpowers Status — WARNING

Your version: **v5.0.1**. Latest public release found: **v4.3.1** (March 2, 2026).

### Critical Issue (March 9, 2026)

Superpowers is **currently broken** in the Claude Code plugin marketplace:
- On existing installs (v4.3.1), skills don't load and `SessionStart` hook doesn't fire.
- On fresh machines, install reports the plugin as "not recognized."
- This was reported as [Issue #653](https://github.com/obra/superpowers/issues/653).

### Timeline

- **Jan 15, 2026** — Superpowers accepted into the official Anthropic marketplace (42,000+ GitHub stars).
- **Feb 12, 2026** — v4.3.0 released with `EnterPlanMode` intercept.
- **Mar 2, 2026** — v4.3.1 released.
- **Mar 9, 2026** — Marketplace recognition broken.

### Action Items

- [ ] Your v5.0.1 may be a fork or pre-release — verify if it's still functioning
- [ ] Monitor [obra/superpowers Issue #653](https://github.com/obra/superpowers/issues/653) for resolution
- [ ] If broken, Superpowers skills can still work if loaded manually from `.claude/skills/`

Sources: [obra/superpowers GitHub](https://github.com/obra/superpowers) · [Issue #653](https://github.com/obra/superpowers/issues/653) · [Superpowers Guide](https://pasqualepillitteri.it/en/news/215/superpowers-claude-code-complete-guide)

---

## 3. New High-Value Plugins (Since Jan 2026)

### Plugin Ecosystem Scale

The Claude Code plugin ecosystem now has **9,000+ extensions** across the official Anthropic marketplace, community sites, and GitHub. The official marketplace (`claude-plugins-official`) is automatically available when you start Claude Code.

### Notable New Plugins Worth Evaluating

| Plugin | What It Does | Why It Matters | Stars/Traction |
|---|---|---|---|
| **Ralph Wiggum** | Autonomous long-running sessions — resets context between tasks automatically | Perfect for batch CRUD, migrations, test expansion | High community traction |
| **Linear plugin** | Connect Claude Code to Linear issue tracker — pull tickets, update status, break tasks into subtasks | Project management without leaving terminal | Official marketplace |
| **Firecrawl** | Turn any website into clean LLM-ready data — handles JS rendering, anti-bot, proxies | Research and documentation scraping | Top 10 listed |
| **mcp-builder** | Design MCP servers from within Claude Code | Meta-tooling for building your own MCPs | Top recommended |
| **connect-apps** | Link Claude to 500+ SaaS applications | Broad integration surface | Popular |
| **ship** | PR automation from linting to production deployment | CI/CD workflow | Popular |
| **claude-code-plugins-plus-skills** | 340 plugins + 1,367 skills with CCPI package manager | Mega-collection, interactive tutorials | [GitHub](https://github.com/jeremylongshore/claude-code-plugins-plus-skills) |

### Curated Lists to Watch

- [awesome-claude-code](https://github.com/hesreallyhim/awesome-claude-code) — Skills, hooks, slash-commands, agents, plugins
- [awesome-claude-plugins](https://github.com/ComposioHQ/awesome-claude-plugins) — Composio's curated list
- [awesome-claude-skills](https://github.com/travisvn/awesome-claude-skills) — Skills-focused curation

### Action Items

- [ ] Evaluate **Ralph Wiggum** for batch vault operations
- [ ] Evaluate **Linear plugin** if using Linear for project tracking
- [ ] The Firecrawl plugin could complement [[QMD]] for web research indexing

Sources: [Top 10 Plugins (Composio)](https://composio.dev/content/top-claude-code-plugins) · [Top 10 Plugins (Firecrawl)](https://www.firecrawl.dev/blog/best-claude-code-plugins) · [Claude Code Plugins Review](https://aitoolanalysis.com/claude-code-plugins/)

---

## 4. Hooks Patterns — Beyond Dippy and Lasso

The hooks system has matured to **14 lifecycle events** with 3 handler types, async execution, and JSON structured output.

### Key Lifecycle Events

| Event | Fires When | Best For |
|---|---|---|
| `SessionStart` | Session begins | Load environment, check prerequisites |
| `UserPromptSubmit` | User sends a message | Prompt augmentation, context injection |
| `PreToolUse` | Before any tool runs | **Security gates** — only hook that can block actions (exit code 2) |
| `PostToolUse` | After tool completes | Auto-format, auto-test, feedback loops |
| `Notification` | Claude sends alert | Desktop notifications, Slack alerts |
| `Stop` | Agent finishes response | Summary generation, session logging |

### Production Hook Patterns People Are Building

| Pattern | Hook Event | Implementation |
|---|---|---|
| **Auto-format on save** | `PostToolUse` (Write/Edit) | Run prettier/black/gofmt after every file edit |
| **Auto-test on change** | `PostToolUse` (Write/Edit) | Run pytest/npm test on modified files — catch regressions immediately |
| **Secret detection gate** | `PreToolUse` (Write) | Block writes containing hardcoded secrets, API keys, `.env` patterns |
| **Protected file guard** | `PreToolUse` (Write/Edit) | Block writes to `.env`, production config, `/.git` |
| **Type checking** | `PostToolUse` (Write) | Auto-run `pnpm type:check` after TypeScript edits |
| **Desktop notifications** | `Stop` | Notify when long tasks complete |
| **Commit message enforcement** | `PreToolUse` (Bash) | Validate commit messages match conventions |
| **Quality gates with Husky** | `PreToolUse` | Integrate Husky pre-commit hooks |
| **Context injection** | `UserPromptSubmit` | Inject relevant docs/memory before Claude processes prompt |

### Hook Configuration Location

- Project level: `.claude/settings.json` (shared with team via git)
- User level: `~/.claude/settings.json` (personal, applies everywhere)

### Action Items

- [ ] Add auto-format hook (`PostToolUse`) for your primary languages
- [ ] Add secret detection gate (`PreToolUse`) — complements [[Lasso claude-hooks]]
- [ ] Add desktop notification hook (`Stop`) for long-running tasks
- [ ] Consider auto-test hook for TDD workflows

Sources: [Hooks Reference](https://code.claude.com/docs/en/hooks) · [Hooks Guide](https://code.claude.com/docs/en/hooks-guide) · [12 Lifecycle Events (Pixelmojo)](https://www.pixelmojo.io/blogs/claude-code-hooks-production-quality-ci-cd-patterns) · [DataCamp Tutorial](https://www.datacamp.com/tutorial/claude-code-hooks)

---

## 5. CLAUDE.md Best Practices — 2026 Consensus

### Core Rules

| Rule | Why |
|---|---|
| **Under 200 lines per file** | Beyond 200 lines, Claude ignores instructions — important rules get buried. |
| **Don't duplicate linter rules** | Never send an LLM to do a linter's job. Use hooks for formatting, not CLAUDE.md instructions. |
| **Use `@path/to/import` syntax** | CLAUDE.md supports imports for splitting config across files. |
| **Run `/init` first, then refine** | Generates a starter based on your project structure. |
| **Provide verification, not just instructions** | Always include tests, scripts, or screenshots. If you can't verify it, don't ship it. |

### Recommended Sections (10-Section Framework from UX Planet)

1. Project overview (1-2 sentences)
2. Tech stack and dependencies
3. Build/test/run commands
4. Code style conventions (only what the linter doesn't catch)
5. Architecture patterns (folder structure, naming)
6. Common workflows
7. Known gotchas
8. Testing strategy
9. Deployment notes
10. File/import references

### Hierarchy

| Location | Scope |
|---|---|
| `~/.claude/CLAUDE.md` | All sessions, all projects |
| `./CLAUDE.md` (project root) | This project, shared with team |
| `./subdir/CLAUDE.md` | Monorepo subpackage overrides |
| Parent directories | Inherited automatically |

### Timing Guidelines

- Plan outputs readable within 3 minutes
- Implementation should start within 5 minutes
- Every output must contain specific file paths, executable commands, and clear next actions

### Action Items

- [ ] Audit your CLAUDE.md — is it under 200 lines? Move detail to imported files if not
- [ ] Remove any formatting rules that could be hooks instead
- [ ] Add `@imports` for role-specific context files from your `Agent Context/` directory

Sources: [CLAUDE.md Best Practices (UX Planet)](https://uxplanet.org/claude-md-best-practices-1ef4f861ce7c) · [Official Best Practices](https://code.claude.com/docs/en/best-practices) · [CLAUDE.md Optimization (SmartScope)](https://smartscope.blog/en/generative-ai/claude/claude-md-concise-agent-optimization-2026/) · [HumanLayer Guide](https://www.humanlayer.dev/blog/writing-a-good-claude-md)

---

## 6. MCP Server Ecosystem — March 2026

MCP was donated to the Linux Foundation's **Agentic AI Foundation** in December 2025. The ecosystem now has **1,864+ servers**.

### Top MCP Servers by Real Usage Data

| Server | Category | Why It Matters |
|---|---|---|
| **Context7** (yours) | Documentation | #1 on FastMCP by 2x margin. Injects version-specific docs into prompts. |
| **GitHub MCP** | Code management | PR automation, issue triaging, code review. |
| **Git MCP** | Local repo | Structured repo understanding without parsing shell output. |
| **Playwright MCP** | Testing | Browser automation via accessibility trees, not screenshots. |
| **Slack MCP** | Communication | Read channels, summarize threads, post messages. |
| **n8n MCP** | Workflow automation | Trigger multi-step workflows from Claude. |
| **Neo4j MCP** | Knowledge graphs | Query graph databases, build knowledge graphs. |
| **Firecrawl MCP** | Web scraping | Clean web-to-LLM data pipeline. |

### Context7 Pricing Change (Jan 2026)

Context7 cut their free tier from ~6,000 to **1,000 requests/month** with a **60 requests/hour** rate limit. A [local-first alternative](https://medium.com/@moshesimantov/i-built-a-context7-local-first-alternative-with-claude-code-eb14c9fd654f) was built in response.

### CodeGraphContext Update (yours)

CodeGraphContext defaults to **FalkorDB Lite** (zero-config, in-process) for quick setup, with Neo4j available for larger codebases. Key features:
- `cgc analyze callers [function]` — trace call chains
- `cgc watch` — live file watching, keeps graph updated in real-time
- Dead code detection, cyclomatic complexity, dependency tracking

### Action Items

- [ ] Monitor Context7 usage against the 1,000/month free tier limit
- [ ] Evaluate the local-first Context7 alternative if you hit rate limits
- [ ] Consider adding **Playwright MCP** if you do web testing
- [ ] Consider **n8n MCP** for workflow automation

Sources: [Best MCP Servers 2026 (Builder.io)](https://www.builder.io/blog/best-mcp-servers-2026) · [Top 10 (FastMCP)](https://fastmcp.me/blog/top-10-most-popular-mcp-servers) · [Microsoft MCP Servers](https://developer.microsoft.com/blog/10-microsoft-mcp-servers-to-accelerate-your-development-workflow) · [Context7 Plugin](https://claude.com/plugins/context7)

---

## 7. Claude Code + Obsidian — New Integration Patterns

### New Approaches Since Your Setup

| Integration | What It Does | Status |
|---|---|---|
| **Agent Client plugin** | Brings Claude Code, Codex, and Gemini CLI into an Obsidian right-side panel via ACP (Agent Client Protocol, from Zed editor) | New — forum post active |
| **obsidian-ai-agent** | Native plugin using Claude Agent SDK — full vault access (read, write, search, bash) plus Obsidian-specific actions | Active development |
| **obsidian-claude-code (Roasbeef)** | Embeds Claude as AI assistant with Agent SDK, full tool access | Active development |
| **Claudian** (yours) | Embeds Claude Code as collaborator, vault becomes working directory | Already installed |

### AI Second Brain Pattern (Gaining Traction)

The "AI Second Brain" pattern combines:
1. Obsidian for local-first, plain-text knowledge storage
2. Claude Code for programmatic file manipulation via MCP
3. QMD or similar for semantic search across the vault
4. Auto-memory for cross-session knowledge persistence

This is essentially **what you've already built**. Your stack is ahead of the curve.

### Action Items

- [ ] Watch the **Agent Client plugin** — if ACP becomes standard, it could replace multiple integration layers
- [ ] Your current Claudian + obsidian-claude-code-mcp stack covers the same ground as newer alternatives
- [ ] No urgent changes needed — your setup aligns with emerging best practices

Sources: [Agent Client Forum Post](https://forum.obsidian.md/t/new-plugin-agent-client-bring-claude-code-codex-gemini-cli-inside-obsidian/108448) · [AI Second Brain Guide](https://www.nxcode.io/resources/news/obsidian-ai-second-brain-complete-guide-2026) · [Claudian GitHub](https://github.com/YishenTu/claudian) · [XDA Claude Code in Obsidian](https://www.xda-developers.com/claude-code-inside-obsidian-and-it-was-eye-opening/)

---

## 8. Context Engineering — 2026 State of the Art

### Key Techniques

| Technique | Savings | How |
|---|---|---|
| **Semantic caching** | Up to 73% cost reduction | Cache semantically similar queries to avoid redundant API calls |
| **Prompt compression (LLMLingua)** | Significant for RAG | Compress prompts with minimal performance loss |
| **Prompt caching (Anthropic)** | 90% cost on repeated content | Cache repeated prefixes across API calls |
| **Compaction** | 58.6% token reduction | Auto-summarize older conversation turns |
| **QMD smart chunking** | 60-92% token reduction | 900 tokens/chunk with 15% overlap, markdown-aware boundaries |

### The "Lost in the Middle" Problem

Despite 200K context windows, LLMs show U-shaped performance:
- **Strong** retrieval at the beginning and end of context
- **Weak** retrieval in the middle
- A model claiming 200K tokens typically becomes unreliable around **130K**
- Performance drops are **sudden**, not gradual

### Practical Implications

- Front-load the most important context (CLAUDE.md, current task)
- Put reference material at the end
- Don't rely on middle-of-context instructions for critical behavior
- Use `/compact` before hitting 95% — proactive compaction preserves more

### What Compaction Loses

When context is compacted, it irreversibly discards:
- Tool call details
- Decision reasoning
- Code context
- Multi-step workflow state
- Agent coordination state

### Action Items

- [ ] Use `/compact` proactively around 70-80% context usage, not at 95%
- [ ] Structure CLAUDE.md imports so critical rules are at the top
- [ ] Your [[QMD]] + [[claude-mem]] stack already implements the best-practice token reduction pattern
- [ ] Consider LLMLingua if building RAG pipelines

Sources: [LLM Context Problem (LogRocket)](https://blog.logrocket.com/llm-context-problem/) · [Token Optimization (Redis)](https://redis.io/blog/llm-token-optimization-speed-up-apps/) · [Context Management (Zylos)](https://zylos.ai/research/2026-01-19-llm-context-management) · [Compaction Docs](https://platform.claude.com/docs/en/build-with-claude/compaction)

---

## Summary — What to Do Next

### Urgent

1. **Check Superpowers** — v5.0.1 may be broken by the marketplace issue. Test if your skills still load.
2. **Monitor Context7 usage** — Free tier dropped to 1,000 requests/month.

### High Value

3. **Enable Agent Teams** — Experiment with `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS` for large vault reorganizations or multi-file projects.
4. **Add production hooks** — Auto-format (PostToolUse), secret detection (PreToolUse), notifications (Stop).
5. **Audit CLAUDE.md** — Keep under 200 lines, use `@imports`, remove anything a linter/hook handles.
6. **Try `/compact` proactively** — Don't wait for the 95% auto-trigger.

### Worth Watching

7. **Agent Client plugin** for Obsidian — ACP standard could simplify your integration stack.
8. **Ralph Wiggum plugin** — For autonomous batch operations.
9. **Local Context7 alternative** — If you hit rate limits.

---

## Related Vault Notes

- [[AI Knowledge Hub]]
- [[Claude Code Plugins MOC]]
- [[Claude Code Configuration]]
- [[Superpowers (Obra)]]
- [[QMD]]
- [[claude-mem]]
- [[Claudian]]
- [[obsidian-claude-code-mcp]]
- [[Lasso claude-hooks]]
- [[Dippy]]
- [[My Stack Decisions]]
- [[Obsidian-Claude Connectivity]]

#research #claude-code #ecosystem #march-2026
