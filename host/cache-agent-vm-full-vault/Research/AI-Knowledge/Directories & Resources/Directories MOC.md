---
title: "Directories & Resources: AI Tools MOC"
type: reference
created: 2026-04-05
confidence: 0.85
tags: [ai-tools, claude-code, skills, directories, moc, resources]
summary: "Master index of skill directories, GitHub repos, guides, and community hubs for Claude Code and AI agent tooling."
source: curated
---

# Directories & Resources

> Curated lists, skill directories, community hubs, and guides for the Claude Code / AI agent ecosystem.

This Map of Content (MOC) aggregates the key places to discover skills, plugins, and guides across the Claude Code and broader AI coding agent landscape. Use it as a starting point when evaluating new tooling, finding community-maintained skills, or orienting a new project setup.

Related: [[Claude Code Plugins MOC]] | [[Research - Claude Code Ecosystem March 2026]] | [[AI Knowledge Hub]]

---

## Overview

The skill ecosystem for Claude Code has grown rapidly in 2025–2026. Skills (formerly called "commands" or "slash commands") are SKILL.md files that extend Claude Code's behavior — giving it domain-specific workflows, integrations, and disciplined patterns. They are discovered and installed from community directories, GitHub repos, and curated marketplaces.

Key signal directories to monitor:

- **SkillsMP** and **awesomeclaude.ai** for broad community discovery
- **hesreallyhim/awesome-claude-code** on GitHub for the most actively maintained curated list
- **Official Anthropic docs** for the canonical skill specification and changes

Skills are evaluated along a few axes: breadth (how many skills), quality gates (security-tested, graded), and ecosystem fit (Claude-only vs multi-model). The `SKILL.md` open format means skills are model-portable in principle, but in practice many are Claude Code-specific.

---

## Skill Directories

| Directory | URL | Notes |
|---|---|---|
| **SkillsMP** | [skillsmp.com](https://skillsmp.com) | 400k+ skills, Claude/Codex/ChatGPT, open SKILL.md format |
| **awesome-skills.com** | [awesome-skills.com](https://awesome-skills.com/) | 123+ curated skills |
| **awesomeskills.dev** | [awesomeskills.dev](https://www.awesomeskills.dev/en) | Largest curated directory |
| **skillsdirectory.com** | [skillsdirectory.com](https://www.skillsdirectory.com/) | Security-tested, graded |
| **awesomeclaude.ai** | [awesomeclaude.ai](https://awesomeclaude.ai/awesome-claude-skills) | Visual with categories |
| **mcpservers.org** | [mcpservers.org/agent-skills](https://mcpservers.org/agent-skills) | Skills within MCP ecosystem |
| **SkillHub** | [skillhub.club](https://www.skillhub.club) | Claude skills & agent skills marketplace |
| **MCP Market** | [mcpmarket.com/tools/skills](https://mcpmarket.com/tools/skills) | Agent skills directory for Claude, ChatGPT & Codex |

## GitHub Curated Lists

| Repo | Focus |
|---|---|
| [hesreallyhim/awesome-claude-code](https://github.com/hesreallyhim/awesome-claude-code) | Skills, hooks, commands, orchestrators, plugins |
| [travisvn/awesome-claude-skills](https://github.com/travisvn/awesome-claude-skills) | Community-curated skills |
| [jqueryscript/awesome-claude-code](https://github.com/jqueryscript/awesome-claude-code) | Tools, IDE integrations, frameworks |
| [davepoon/buildwithclaude](https://github.com/davepoon/buildwithclaude) | Unified discovery hub |
| [Levnikolaevich/claude-code-skills](https://github.com/Levnikolaevich/claude-code-skills) | 50+ SKILL.md files across categories |
| [mhattingpete/claude-skills-marketplace](https://github.com/mhattingpete/claude-skills-marketplace) | Git automation, testing, code review skills |

## Comprehensive Guides

| Guide | URL |
|---|---|
| Claude Code Ultimate Guide | [FlorianBruniaux/claude-code-ultimate-guide](https://github.com/FlorianBruniaux/claude-code-ultimate-guide) |
| Claude Code Guide | [zebbern/claude-code-guide](https://github.com/zebbern/claude-code-guide) |
| Claude Code AI OS Blueprint | [dev.to guide](https://dev.to/jan_lucasandmann_bb9257c/claude-code-to-ai-os-blueprint-skills-hooks-agents-mcp-setup-in-2026-46gg) |
| Obsidian + Claude Code Workflows | [axtonliu.ai](https://www.axtonliu.ai/newsletters/ai-2/posts/obsidian-claude-code-workflows) |
| Complete Guide to Building Skills | [Anthropic resource](https://resources.anthropic.com/hubfs/The-Complete-Guide-to-Building-Skill-for-Claude.pdf) |
| Top 10 Must-Have Skills (2026) | [Medium/unicodeveloper](https://medium.com/@unicodeveloper/10-must-have-skills-for-claude-and-any-coding-agent-in-2026-b5451b013051) |
| Top 10 Skills Every Builder Should Know | [Composio](https://composio.dev/content/top-claude-skills) |
| Top 8 Claude Skills for Developers | [Snyk](https://snyk.io/articles/top-claude-skills-developers/) |

## AI Agent Memory Resources

| Resource | URL |
|---|---|
| 6 Best AI Agent Memory Frameworks (2026) | [MachineLearningMastery](https://machinelearningmastery.com/the-6-best-ai-agent-memory-frameworks-you-should-try-in-2026/) |
| Agent Memory Patterns (4 patterns) | [DEV Community](https://dev.to/nebulagg/your-ai-agent-has-amnesia-fix-it-with-these-4-memory-patterns-114d) |
| GitHub Copilot Memory System | [GitHub Blog](https://github.blog/ai-and-ml/github-copilot/building-an-agentic-memory-system-for-github-copilot/) |
| AI Agent Observability Tools (2026) | [AIMultiple](https://research.aimultiple.com/agentic-monitoring/) |
| OpenAI Session Memory Cookbook | [OpenAI Cookbook](https://cookbook.openai.com/examples/agents_sdk/session_memory) |

## Notable Research Tools

| Tool | What It Does |
|---|---|
| [last30days-skill](https://github.com/mvanhorn/last30days-skill) | Research any topic across Reddit, X, YouTube, HN |

---

## Evaluation Notes

When assessing skills from these directories, consider:

1. **Freshness** — skill ecosystem moves fast; repos inactive for >3 months may lag the current `SKILL.md` spec
2. **Security posture** — `skillsdirectory.com` grades for security; unknown community skills can invoke arbitrary tools
3. **Overlap with Superpowers** — see [[Superpowers (Obra)]] for the curated opinionated skill pack already in this stack; check for duplication before installing community skills
4. **Claude Code Configuration** compatibility — some skills depend on hooks or settings that require specific [[Claude Code Configuration]] entries

The `awesome-claude-code` GitHub repo (hesreallyhim) is currently the most actively maintained community list and is a reliable first stop. The web-based marketplaces (SkillsMP, awesomeclaude.ai) are better for browsing by category when you don't know what you're looking for.

## Official Documentation

| Resource | URL |
|---|---|
| Claude Code Skills Docs | [code.claude.com/docs/en/skills](https://code.claude.com/docs/en/skills) |
| Claude Skills (claude.com) | [claude.com/skills](https://claude.com/skills) |
| Claude Code Releases | [github.com/anthropics/claude-code/releases](https://github.com/anthropics/claude-code/releases) |

---

*Last updated: 2026-04-05 — MOC is maintained incrementally as new directories emerge. Check [[Research - Claude Code Ecosystem March 2026]] for deeper ecosystem analysis.*

#directories #resources #guides
