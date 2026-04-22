# Agent Context

Coding conventions and standards. These are the source of truth for how code should be written across all projects.

---

## Conventions

Standards that apply across all sessions. **Read-only** — ask Trajan before modifying.

- [[Coding Standards]] — Hard limits, style, error handling
- [[Testing Philosophy]] — TDD workflow, coverage, mocking boundaries
- [[Architecture Principles]] — Design philosophy, patterns, anti-patterns
- [[Security Standards]] — Mandatory checks, secret management, response protocol
- [[Git Workflow Standards]] — Commit format, PR process, branch discipline

---

## Agent Definitions

Agent definitions live in `~/.claude/agents/` (16 agents). These are used by Superpowers and Claude Code's Agent tool when dispatching subagents for code review, debugging, architecture, etc.

> **Note:** The old Prompts/ and Roles/ folders were archived on 2026-03-13. They duplicated what the agent definitions and Superpowers skills already provide. See `Archive/Dead Weight/` if needed.
