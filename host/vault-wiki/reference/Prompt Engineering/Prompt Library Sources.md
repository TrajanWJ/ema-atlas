---
title: Prompt Library Sources
created: '2026-03-14'
updated: '2026-03-16'
type: knowledge
status: active
confidence: 0.8
confidence_updated: 2026-03-18T00:00:00.000Z
source: reference
tags:
  - github
  - knowledge
  - prompts
  - research
  - security
  - skills
summary: >-
  Registry of all repositories researched and patterns extracted for the Agent
  Context library.
wiki_id: reference/Prompt_Engineering/Prompt_Library_Sources
imported_from: vault/Reference/Prompt Engineering/Prompt Library Sources.md
imported_at: '2026-04-04T00:23:56.933Z'
---
# Prompt Library Sources

Registry of all repositories researched and patterns extracted for the Agent Context library.

---

## Round 1: Primary Repos (Assigned)

### 1. trailofbits/claude-code-config
- **Stars**: ~2K+ | **Focus**: CLAUDE.md philosophy, hard limits, tool recommendations
- **URL**: https://github.com/trailofbits/claude-code-config
- **Extracted**: Coding standards, hard limits, testing philosophy, zero-warnings policy, language-specific toolchains, CLI tool recommendations, sandboxing strategy, hooks system, privacy settings
- **Used in**: **Coding Standards**, **Testing Philosophy**, **Architecture Principles**, **Security Standards**, **Git Workflow Standards**

### 2. affaan-m/everything-claude-code
- **Stars**: 50K+ | **Focus**: Complete agent harness with 16 agents, 65 skills, 40+ commands
- **URL**: https://github.com/affaan-m/everything-claude-code
- **Extracted**: Agent roles (architect, planner, code-reviewer, security-reviewer), delegation rules, coding style, testing requirements, security checklist, performance optimization, design patterns, git workflow, instinct/skill learning system
- **Used in**: **Role - Architect**, **Role - Planner**, **Role - Reviewer**, **Code Review Prompt**, **Agent Delegation Prompt**, all Conventions

### 3. sdi2200262/agentic-project-management
- **Stars**: 2.1K | **Focus**: Multi-agent coordination with memory systems
- **URL**: https://github.com/sdi2200262/agentic-project-management
- **Extracted**: Manager Agent role, Implementation Agent role, context synthesis (4-round discovery), memory system (Dynamic-MD), task assignment protocol, handover procedures, project breakdown methodology, memory log format
- **Used in**: **Role - Project Manager**, **Role - Implementer**, **Context Synthesis Prompt**, **Task Breakdown Prompt**, **Agent Delegation Prompt**, Session Log templates

### 4. mitsuhiko/agent-prompts
- **Stars**: ~500 | **Focus**: Specialized agent chains for PoC engineering and research
- **URL**: https://github.com/mitsuhiko/agent-prompts
- **Extracted**: Software architect agent (6-phase PoC process), problem analysis agent (7-step analysis), research lead agent (parallel sub-agent coordination), implementation ordering (backend-first)
- **Used in**: **Role - Architect**, **Role - Researcher**, **Architecture Principles**, **Chain of Thought Template**

### 5. ChrisWiles/claude-code-showcase
- **Stars**: 5.5K | **Focus**: Hooks, skills, agents, commands, GitHub Actions
- **URL**: https://github.com/ChrisWiles/claude-code-showcase
- **Extracted**: Code reviewer agent, testing patterns skill, systematic debugging skill, ticket workflow command, onboard command, PR review command, hook system patterns, skill YAML frontmatter format
- **Used in**: **Role - Reviewer**, **Debugging Prompt**, **Code Review Prompt**, **Codebase Exploration Prompt**

### 6. tayyabakmal1/qa-prompt-library
- **Stars**: ~200 | **Focus**: QA testing prompts across manual, automation, AI-assisted
- **URL**: https://github.com/tayyabakmal1/qa-prompt-library
- **Extracted**: Role template structure, sprint testing workflow, OWASP security patterns, risk analysis methodology, framework expert role template
- **Used in**: **Sprint Planning Prompt**, **Risk Analysis Prompt**, **Security Standards**, **Release Readiness Prompt**

### 7. abilzerian/LLM-Prompt-Library
- **Stars**: 1.6K | **Focus**: Meta-prompting, enterprise Jinja2 templates
- **URL**: https://github.com/abilzerian/LLM-Prompt-Library
- **Extracted**: Prompt Creator meta-prompt (iterative refinement), PromptScript pattern, enterprise template structure (8 industry suites), AGENTS.md contribution guide
- **Used in**: **Meta-Prompt Generator**, **Chain of Thought Template**

### 8. shanraisshan/claude-code-best-practice
- **Stars**: ~1K | **Focus**: Monorepo strategies, progressive disclosure
- **URL**: https://github.com/shanraisshan/claude-code-best-practice
- **Extracted**: Hierarchical CLAUDE.md pattern, skills-as-progressive-disclosure, agent "dumb zone" avoidance (50% compaction max), feature-specific sub-agents over generic ones, permission wildcards, settings.json patterns
- **Used in**: **Agent Delegation Prompt**, **Coding Standards**

### 9. Comfy-Org/comfy-claude-prompt-library
- **Stars**: ~300 | **Focus**: 70+ Claude Code commands, validation scans
- **URL**: https://github.com/Comfy-Org/comfy-claude-prompt-library
- **Extracted**: Command organization structure (agents, research, analysis, validation, development), semantic memory search integration, validation scan patterns (accessibility, performance, security, dependencies, dead code), project summary format
- **Used in**: **Release Readiness Prompt**, **Codebase Exploration Prompt**

## Round 2: Discovery Repos

### 10. Wirasm/PRPs-agentic-eng
- **Stars**: ~500 | **Focus**: Production Ready Packets (PRPs) for AI agent development
- **URL**: https://github.com/Wirasm/PRPs-agentic-eng
- **Extracted**: PRP format (PRD + codebase intelligence + runbook), Ralph Loop (self-correcting autonomous execution), artifact organization (.claude/PRPs/), implementation phases tracking, bounded scope principle
- **Used in**: **PRD Generation Prompt**, **Implementation Planning Prompt**

### 11. dontriskit/awesome-ai-system-prompts
- **Stars**: ~2K | **Focus**: System prompts from 32+ production AI tools
- **URL**: https://github.com/dontriskit/awesome-ai-system-prompts
- **Extracted**: Cross-tool pattern analysis (Claude Code, v0, Cline, Cursor, Manus), common agent loop patterns, tool definition structures
- **Used in**: General pattern validation across all prompts

### 12. tallesborges/agentic-system-prompts
- **Stars**: ~300 | **Focus**: Production AI coding agent system prompts and tool definitions
- **URL**: https://github.com/tallesborges/agentic-system-prompts
- **Extracted**: Complete prompt templates with role definitions, tool API specifications, 7 agent implementations compared
- **Used in**: Role definition patterns

### 13. joelparkerhenderson/architecture-decision-record
- **Stars**: ~12K | **Focus**: ADR templates and examples
- **URL**: https://github.com/joelparkerhenderson/architecture-decision-record
- **Extracted**: MADR template structure, decision record best practices
- **Used in**: **Decision Record Template**

### 14. baz-scm/awesome-reviewers
- **Stars**: ~500 | **Focus**: 8000+ code review prompts from real PR comments
- **URL**: https://github.com/baz-scm/awesome-reviewers
- **Extracted**: Review prompt patterns distilled from real engineering ecosystems
- **Used in**: **Code Review Prompt**

### 15. FlorianBruniaux/claude-code-ultimate-guide
- **Stars**: Educational Excellence | **Focus**: Comprehensive Claude Code guide with 22K+ lines, 271-question quiz, 24 CVEs security tracking
- **URL**: https://github.com/FlorianBruniaux/claude-code-ultimate-guide
- **Extracted**: Agent templates (code reviewer, security auditor, devops SRE), security-first patterns, TDD/SDD/BDD workflows, multi-agent orchestration topologies, context engineering techniques, production safety hooks
- **Used in**: **Security Standards**, **Agent Templates**, **Orchestration Patterns**, **Context Management**, **Production Safety**

### 16. rohitg00/awesome-claude-code-toolkit
- **Stars**: Massive Scale | **Focus**: 135 agents, 121 plugins, 42 commands across 10 specialized categories
- **URL**: https://github.com/rohitg00/awesome-claude-code-toolkit
- **Extracted**: Agent specialization matrix (domain × role × technology), progressive capability loading, command organization patterns, plugin architecture, orchestration strategies, domain expert roles
- **Used in**: **Agent Role Templates**, **Capability Matrix Design**, **Plugin Architecture**, **Domain Specialization**

### 17. hesreallyhim/awesome-claude-code
- **Stars**: Community Curation | **Focus**: Selectively curated skills, hooks, orchestrators with quality focus
- **URL**: https://github.com/hesreallyhim/awesome-claude-code
- **Extracted**: Ralph Wiggum autonomous patterns, context engineering techniques, community-driven quality gates, security-first tooling, honest assessment culture, multi-modal tool integration
- **Used in**: **Autonomous Orchestration**, **Context Engineering**, **Quality Assessment**, **Community Patterns**

---

## Not Yet Explored (For Future Research)

- **BehiSecc/awesome-claude-skills** — Curated Claude Skills collection
- **jwadow/agentic-prompts** — Custom agent personas for Roo Code (adaptable)
- **ArthurClune/claude-md-examples** — Sample CLAUDE.md files

## Related

- [[qa-prompt-library-comprehensive-testing-templates]]
- [[QA Prompt Library]]
- [[Prompt Library Sources]]
- [[README]]
- [[research]]
- Round
- [[2]]
- [[-]]
- [[Metaprompting]]
- [[Deep]]
- [[Dive]]
