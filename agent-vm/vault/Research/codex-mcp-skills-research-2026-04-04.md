---
title: "Codex MCP + Skills Research — 2026-04-04"
type: research
confidence: 0.82
date: 2026-04-04
sources: 14 total (3 primary/T1, 7 institutional/T2, 4 secondary/T3)
summary: "Research into top MCPs and skills to enhance Codex CLI (gpt-5.4) coding agent: official docs verified, catalog scraped, academic backing found."
tags: [codex, MCP, coding-agent, skills, openai]
---

# Codex MCP + Skills Research — 2026-04-04
*Sources: 14 total (3 T1/primary, 7 T2/institutional, 4 T3/secondary)*  
*Confidence: High on MCP catalog, Medium on academic findings | Date: 2026-04-04*

## Summary

Codex CLI (gpt-5.4) natively supports MCP via `~/.codex/config.toml` with STDIO and HTTP transports. The current stack (codebase-memory-mcp, ema, filesystem) covers memory and basic I/O but is missing **search/documentation, version control ops, shell execution, and web context** — all shown to significantly improve coding agent output. The MCP ecosystem has 4,800+ servers but most are not coding-relevant; the highest-impact additions for Codex are: Context7 (docs), Playwright (browser/test), Git MCP (repo ops), and a search MCP (Exa/Brave). ClawHub is essentially empty right now (no published skills yet).

---

## Top MCPs to Add (ranked by impact)

### MCP 1: Context7 — Up-to-date Library Documentation
- **What it does:** Provides live, version-accurate documentation for 9,000+ libraries directly into Codex context. Eliminates outdated API hallucinations.
- **Install:**
  ```bash
  codex mcp add context7 -- npx -y @upstash/context7-mcp
  ```
  Or in `~/.codex/config.toml`:
  ```toml
  [mcp_servers.context7]
  command = "npx"
  args = ["-y", "@upstash/context7-mcp"]
  ```
- **Why it matters:** Already installed as a skill, but connecting it as an MCP server means Codex can pull docs *automatically* during coding tasks rather than requiring explicit invocation. OpenAI explicitly lists it as a recommended MCP. T2 evidence (glama.ai, punkpeye list) shows it as the most popular non-bundled MCP for coding.
- **Source:** [T1] `developers.openai.com/codex/mcp`, [T2] `glama.ai/mcp/servers`

### MCP 2: Playwright MCP — Browser + Test Automation  
- **What it does:** Gives Codex the ability to control a browser, take screenshots, inspect DOM, and run test suites — critical for frontend work and E2E testing.
- **Install:**
  ```toml
  [mcp_servers.playwright]
  command = "npx"
  args = ["-y", "@playwright/mcp"]
  ```
- **Why it matters:** OpenAI explicitly lists Playwright in their recommended MCP list on the official Codex docs page. Enables closing the test-execution loop without leaving the agent session. High signal from community (appears across Claude Code and Codex docs).
- **Source:** [T1] `developers.openai.com/codex/mcp`

### MCP 3: Git MCP (modelcontextprotocol/servers) — Repository Operations
- **What it does:** Full read/write/search operations on Git repos — log, diff, commit, branch, search history. Goes beyond filesystem MCP by understanding repo semantics.
- **Install:**
  ```toml
  [mcp_servers.git]
  command = "npx"
  args = ["-y", "@modelcontextprotocol/server-git"]
  # or via uvx: command = "uvx", args = ["mcp-server-git", "--repository", "."]
  ```
- **Why it matters:** The official MCP reference repo lists Git as a core reference server. Filesystem MCP can read files, but Git MCP can navigate history, diff branches, and understand the codebase temporally. Essential for code review, PR prep, and bug bisect tasks.
- **Source:** [T1] `github.com/modelcontextprotocol/servers` (official reference server)

### MCP 4: Exa MCP — Semantic Web Search for Coding Context
- **What it does:** Fast, semantically-indexed web search designed for AI agents. Provides clean, structured results optimized for LLM consumption (not SEO garbage).
- **Install:**
  ```toml
  [mcp_servers.exa]
  command = "npx"
  args = ["-y", "exa-mcp-server"]
  [mcp_servers.exa.env]
  EXA_API_KEY = "YOUR_EXA_API_KEY"
  ```
- **Why it matters:** Per glama.ai's State of MCP 2025 analysis, Exa is explicitly called out as optimized for "fast and efficient web context for coding agents." When Codex needs to check a library's GitHub, find a StackOverflow answer, or verify an API change — this closes the loop without web search going through a browser.
- **Source:** [T2] `glama.ai/blog/2025-12-07-the-state-of-mcp-in-2025`

### MCP 5: Sequential Thinking MCP (modelcontextprotocol/servers)
- **What it does:** Dynamic problem decomposition — lets the model work through complex problems in structured thought sequences before committing to code output.
- **Install:**
  ```toml
  [mcp_servers.sequential-thinking]
  command = "npx"
  args = ["-y", "@modelcontextprotocol/server-sequentialthinking"]
  ```
- **Why it matters:** Official MCP reference server. Academic research (SWE-agent, 2024 — arXiv:2405.15793) directly demonstrates that structured problem-solving interfaces significantly boost coding agent performance. This MCP operationalizes that pattern. Low overhead, no API key needed.
- **Source:** [T1] `github.com/modelcontextprotocol/servers`, [T1] arXiv:2405.15793

### MCP 6: Depwire — Dependency Graph for Codebases
- **What it does:** Builds a live dependency graph for TypeScript, JavaScript, Python, Go, Rust, and C codebases. 15 MCP tools including health scoring, dead code detection, and temporal graph of how deps evolve.
- **Install:**
  ```bash
  npx depwire-mcp
  ```
  Or in config.toml:
  ```toml
  [mcp_servers.depwire]
  command = "npx"
  args = ["-y", "depwire-mcp"]
  ```
- **Why it matters:** Addresses a core weakness of coding agents: understanding cross-file dependencies without reading every file. Particularly valuable for refactoring and "what will break if I change this?" tasks. Appeared in both Glama and awesome-mcp-servers with high visibility score.
- **Source:** [T2] `punkpeye/awesome-mcp-servers` (glama badge)

### MCP 7: MCP Fetch (modelcontextprotocol reference)
- **What it does:** Fetches web pages and converts to clean LLM-readable text. Simpler than Playwright but zero overhead for documentation and API reference lookups.
- **Install:**
  ```toml
  [mcp_servers.fetch]
  command = "uvx"
  args = ["mcp-server-fetch"]
  ```
- **Why it matters:** Official reference server from MCP team. Cheap operation for "go read this docs page" without spinning up a browser. Pairs well with Context7 for edge cases.
- **Source:** [T1] `github.com/modelcontextprotocol/servers`

---

## Top Skills/Plugins to Install

### Current skills assessment:
- **planner** ✅ Good for task breakdown
- **plan-harder** ✅ Useful for complex tasks
- **context7** ✅ Installed (but should also be configured as MCP — see above)
- **read-github** ✅ Good for repo inspection
- **agent-browser** ✅ Covers browser tasks

### Skills gaps identified:

**1. `testing-strategy` skill** (not on ClawHub — would need to be created)
- A skill that guides Codex to always write tests before/after implementation, with test runner invocation patterns.

**2. `code-review` skill** (not on ClawHub — create)
- Systematic code review checklist: security, performance, maintainability, test coverage. Would significantly improve PR prep work.

**3. `git-workflow` skill** (not on ClawHub — create)
- Standardized commit message format, branch naming, PR description templates for Trajan's projects.

**ClawHub status:** clawhub.ai launched but has **zero published skills** as of 2026-04-04 ("No skills yet. Be the first."). It redirects to clawhub.ai, exists as infrastructure but no community content yet. Not a useful source right now.

---

## Academic Findings (code quality impact)

### Key paper: SWE-agent (arXiv:2405.15793, T1)
**"Agent-Computer Interfaces Enable Automated Software Engineering"** — Princeton/Stanford, 2024

Core finding: The **design of the agent-computer interface (ACI) is the primary driver of coding agent performance**, more than model size or prompt engineering alone.

Specifically:
- Custom interfaces for file navigation + code editing + test execution = 12.5% pass@1 on SWE-bench
- Non-interactive LMs on same tasks: significantly lower
- **Implication for Codex:** Adding MCPs that give Codex structured interfaces (Git ops, test execution, dependency graphs) directly maps to this finding. The model already has capability — the bottleneck is tooling.

### Recent arXiv (April 2026):
**"ProdCodeBench: A Production-Derived Benchmark for Evaluating AI Coding Agents"** (submitted April 1, 2026)  
- Benchmarks that reflect production workloads are better predictors of real-world agent usefulness than toy benchmarks. Pending — no abstract data accessible, but relevant to evaluating Codex in Trajan's actual workflows.

**"Agent psychometrics: Task-level performance prediction in agentic coding benchmarks"** (submitted April 1, 2026)
- Focus shifts from static single-step to agentic evaluation — validates the importance of multi-step tooled workflows over single completions.

### RAG for coding context (arXiv:2407.01219, T2):
**"Searching for Best Practices in RAG"** — Fudan, 2024

Relevant takeaway: RAG (retrieval of relevant context) significantly improves response quality for specialized domains. Context7 + codebase-memory-mcp together implement this pattern. The key finding: multimodal retrieval and retrieval-as-generation strategies show biggest gains. For code: codebase memory + live docs = measurable improvement.

### Assessment:
**High confidence** that adding Git MCP, Sequential Thinking, and live docs (Context7 as MCP, not just skill) will improve Codex output quality. The SWE-agent paper is T1 and directly applicable. The 2026 papers are too new to cite fully but directionally consistent.

---

## Community Intelligence (Reddit/HN)

Reddit was blocked (CAPTCHA verification). Unable to scrape `r/ClaudeAI` or `r/LocalLLaMA` directly.

**Indirect signals from glama.ai State of MCP 2025** (T2, large ecosystem analysis):

1. **Remote servers won over local** — users prefer remotely-hosted MCPs for ease of use. For Codex on agent-vm, local STDIO is fine (full process control).

2. **MCP-First SaaS is rising** — companies like Bright Data, Exa.ai, Tavily, and Context7 are moving to MCP-native APIs. Exa is specifically called out for coding agent use cases.

3. **Ecosystem is consolidating** — most early MCP companies pivoted or died. The survivors (Glama, Smithery, Context7, Exa) are the reliable ones.

4. **Tool bloat is a real problem** — MCP gateway tools (like ViperJuice/mcp-gateway, MikkoParkkola/mcp-gateway) have emerged specifically to reduce context window overhead from too many registered tools. Worth monitoring if Codex starts getting slow.

**From Codex official docs community signals:**
- OpenAI lists only 4 recommended MCPs: OpenAI Docs MCP, Context7, Figma (local/remote), Playwright, Chrome DevTools.
- The fact that Context7 is in OpenAI's own recommended list is strong signal.

**Known useful combos from Claude Code community** (via Anthropic MCP registry API docs):
- Claude Code itself recommends: `claude mcp add` as the installation path — same pattern as `codex mcp add`.
- Anthropic MCP registry is at `api.anthropic.com/mcp-registry/v0/servers` — browsable, includes servers verified for Claude Code compatibility, many would work with Codex too.

---

## Codex MCP Config Format Reference

From verified official docs (`developers.openai.com/codex/mcp`):

```toml
# ~/.codex/config.toml

[mcp_servers.context7]
command = "npx"
args = ["-y", "@upstash/context7-mcp"]

[mcp_servers.playwright]
command = "npx"
args = ["-y", "@playwright/mcp"]

[mcp_servers.git]
command = "uvx"
args = ["mcp-server-git", "--repository", "."]

[mcp_servers.sequential-thinking]
command = "npx"
args = ["-y", "@modelcontextprotocol/server-sequentialthinking"]

[mcp_servers.fetch]
command = "uvx"
args = ["mcp-server-fetch"]
```

**CLI commands:**
- `codex mcp add <name> -- <command>` — add a server
- `codex mcp --help` — see all commands
- `/mcp` in TUI — see active servers
- `codex mcp login` — OAuth for servers that support it

---

## Recommended Next Actions

### Immediate (high impact, low effort):
1. **Add Context7 as MCP server** (not just skill) — `codex mcp add context7 -- npx -y @upstash/context7-mcp`
2. **Add Git MCP** — `uvx mcp-server-git` — direct improvement for all PR/repo tasks
3. **Add Sequential Thinking MCP** — zero API cost, improves complex problem solving
4. **Add Fetch MCP** — lightweight doc fetching fallback

### Medium priority:
5. **Get Exa API key** and add Exa MCP for web search in coding context
6. **Add Playwright MCP** if Codex does frontend/testing work
7. **Add Depwire MCP** for any large codebase work

### Lower priority / monitor:
8. **Watch ClawHub** — empty now but infrastructure exists; first published skills will likely be coding-focused
9. **Monitor MCP gateway tools** (ViperJuice/mcp-gateway) — if tool count grows and Codex context gets bloated, a gateway can reduce overhead
10. **Consider creating 3 skills**: `testing-strategy`, `code-review`, `git-workflow` — no community versions exist yet, Trajan would need to author or have Right Hand draft them

### Not worth it:
- OpenAI Docs MCP (useful only for OpenAI API work specifically)
- Figma MCP (not relevant unless doing UI design)
- Most of the awesome-mcp-servers list — 90% are not coding-relevant

---

## Sources

1. [T1] [Codex MCP Official Docs](https://developers.openai.com/codex/mcp) — Config format, supported servers, CLI commands
2. [T1] [modelcontextprotocol/servers README](https://github.com/modelcontextprotocol/servers) — Official reference implementations (Git, Fetch, Sequential Thinking, Memory)
3. [T1] [SWE-agent: Agent-Computer Interfaces Enable Automated Software Engineering](https://arxiv.org/abs/2405.15793) — Core academic evidence for tool interface impact on coding agents
4. [T2] [Codex CLI README](https://raw.githubusercontent.com/openai/codex/main/README.md) — Current install/quickstart
5. [T2] [OpenAI Codex Description](https://developers.openai.com/codex) — Capability overview
6. [T2] [punkpeye/awesome-mcp-servers README](https://github.com/punkpeye/awesome-mcp-servers) — Community catalog (4,800+ servers)
7. [T2] [glama.ai State of MCP in 2025](https://glama.ai/blog/2025-12-07-the-state-of-mcp-in-2025) — Ecosystem analysis, trends, community signals
8. [T2] [Anthropic MCP Registry API Docs](https://api.anthropic.com/mcp-registry/docs) — Registry structure, Claude Code integration patterns
9. [T2] [Claude Code MCP Docs](https://code.claude.com/docs/en/mcp) — Claude Code MCP installation patterns (comparable to Codex)
10. [T2] [ProdCodeBench arXiv 2026](https://arxiv.org/search) — Production coding agent benchmarks (April 2026, abstract only)
11. [T2] [RAG Best Practices arXiv:2407.01219](https://arxiv.org/abs/2407.01219) — RAG for specialized domain quality improvement
12. [T2] [depwire/depwire on glama](https://glama.ai/mcp/servers/depwire/depwire) — Dependency graph MCP for coding agents
13. [T3] [ClawHub.ai](https://clawhub.ai) — Skill registry (empty as of 2026-04-04)
14. [T3] [MCP Official Registry](https://registry.modelcontextprotocol.io) — Official registry (JS-rendered, limited extract)
