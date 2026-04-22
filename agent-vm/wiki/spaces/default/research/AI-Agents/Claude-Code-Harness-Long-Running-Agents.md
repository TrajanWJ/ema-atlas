---
title: 'Effective Harnesses for Long-Running Agents: Anthropic Engineering Report'
type: research
created: '2026-03-30'
confidence: 0.92
tags:
  - claude-code
  - agents
  - harness
  - long-running-agents
  - anthropic
  - agent-sdk
  - coding-agents
summary: >-
  Anthropic's two-agent harness pattern (initializer + coding agent) solves
  multi-session context loss for long-running AI coding tasks using external
  artifacts as memory.
wiki_id: research/AI-Agents/Claude-Code-Harness-Long-Running-Agents
imported_from: vault/Research/AI-Agents/Claude-Code-Harness-Long-Running-Agents.md
imported_at: '2026-04-04T00:23:56.972Z'
---

# Effective Harnesses for Long-Running Agents

*Sources: 4 total (2 T1 primary, 1 T2 institutional, 1 T3 secondary)*
*Confidence: High (0.92) | Date: 2026-03-30*

**Primary source:** https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents
**Related:** https://code.claude.com/docs/en/best-practices | https://code.claude.com/docs/en/how-claude-code-works

---

## Summary

Anthropic published an engineering blog post describing a two-agent harness architecture that solves the core problem of long-running AI coding tasks: each new session begins with no memory of prior work. The solution uses external artifacts (structured feature lists, progress logs, git history, init scripts) as persistent memory that successor agent sessions reconstruct from. This was validated by building a full-stack claude.ai clone using Claude Agent SDK with 200+ features tracked incrementally across multiple context windows.

---

## The Core Problem

LLM agents work in discrete sessions with finite context windows. Complex projects cannot fit in a single context window. Without structure, two failure modes emerge:

1. **Over-ambition**: Agent attempts to implement everything at once, runs out of context mid-feature, leaves half-implemented undocumented code. Successor sessions waste time guessing what happened.
2. **Premature completion**: After some features exist, later agent instances declare the project done without verifying all requirements.

Even Opus 4.5 (a frontier model at publication time) failed to build a production-quality web app from a high-level prompt like "build a claude.ai clone" without structured scaffolding.

---

## The Two-Agent Solution

### Initializer Agent (first session only)

Specialized prompting on the first run creates the environment scaffolding:

- **`feature_list.json`** — 200+ granular features, all initially marked `passes: false`
- **`claude-progress.txt`** — log file for session-to-session handoff notes
- **`init.sh`** — script to start dev server and run fundamental end-to-end tests
- **Initial git commit** — baseline to revert to

Feature list format matters: JSON is used instead of Markdown because models are less likely to inappropriately modify JSON structure.

Each feature entry has:
- `category`: functional
- `description`: plain-language description
- `steps`: testable acceptance criteria
- `passes`: true/false (the ONLY field agents should modify)

### Coding Agent (all subsequent sessions)

Standardized startup sequence on every session:
1. Run `pwd` to confirm working directory
2. Read `claude-progress.txt` and git log for context
3. Run `init.sh` to start dev server
4. Run fundamental feature verification (start chat, send message, receive response)
5. Review feature list, select highest-priority unfinished feature
6. Implement one feature only
7. Test using browser automation (Puppeteer MCP) as a human user would
8. Commit progress to git with descriptive message
9. Update `claude-progress.txt` for the next session
10. Mark feature `passes: true` only after verified

---

## Key Design Principles

**External artifacts as memory**: Progress files and git history are the agent's cross-session memory. Each session reconstructs context from these artifacts before doing any work. This is the central insight: you cannot rely on a model's in-context memory across windows; you must externalize state.

**One feature at a time**: Strict single-feature focus prevents over-ambition and ensures each session ends in a clean, mergeable state.

**Always leave clean state**: Every session must end with a git commit and updated progress notes. This lets bad changes be reverted and eliminates recovery time at the start of the next session.

**Self-verification before marking done**: Agents must test using browser automation (Puppeteer MCP), not just inspect code. Features are not marked passing until confirmed by automated interaction.

**JSON over Markdown for structured state**: Models interact more predictably with JSON; Markdown invites freeform modification of things that should be immutable.

---

## Failure Modes and Mitigations

| Problem | Initializer Solution | Coding Agent Solution |
|---------|---------------------|----------------------|
| Declares victory prematurely | Set up comprehensive 200+ feature JSON list | Read feature list at start; work on single features only |
| Leaves buggy undocumented code | Create initial git repo and progress notes | Start by reading progress/git logs; end with commits and updates |
| Marks features done without testing | Set up feature list with acceptance criteria steps | Self-verify all features via browser automation before marking passing |
| Wastes time understanding setup | Write `init.sh` dev server script | Start every session by reading and running `init.sh` |

---

## Limitations Noted

- **Vision constraints**: Claude's vision limitations and browser automation constraints make certain bugs hard to identify (e.g., native browser alert modals invisible through Puppeteer)
- **Single vs. multi-agent**: Open question whether a single general-purpose agent outperforms specialized agents (testing agent, QA agent, code cleanup agent)
- **Domain generalization**: Validated for full-stack web dev; unclear how findings generalize to scientific research, financial modeling, or other long-running domains
- **Security surface**: Autonomous agents making commits, adding dependencies, and marking features passing create attack surfaces — the post does not address sandboxing or vulnerability scanning

---

## Key Takeaways (Actionable)

1. **For any multi-session coding task**: Create a feature list JSON file before starting. Mark all features failing. Force the agent to work one feature at a time.
2. **Write `init.sh` immediately**: Any setup that takes more than one command should be scripted so every successor session can reconstruct the environment in seconds.
3. **Use `claude-progress.txt` as a handoff document**: The agent should update it at the end of every session summarizing what was done, what's next, and any blockers.
4. **Require git commits at session end**: Non-negotiable. If the session ends without a commit, the next session has no reliable baseline.
5. **Test like a human user would**: Browser automation (Puppeteer MCP) dramatically improves bug identification over code inspection alone.
6. **Use JSON for agent-managed state**: Markdown encourages agents to rewrite; JSON discourages it.
7. **Do not rely on compaction alone**: Auto-compaction is necessary but not sufficient for long-running tasks. It helps within a session but cannot bridge sessions.

---

## Relation to Claude Code Best Practices

The [[Claude-Code-Best-Practices]] documentation at `code.claude.com/docs/en/best-practices` complements this with similar themes:
- "Give Claude a way to verify its work" — tests/scripts as verification criteria
- "Explore first, then plan, then code" — Plan Mode separating research from execution
- "Manage context aggressively" — `/clear` between tasks, subagents for investigation
- Context window fills fast; performance degrades as it fills — same constraint driving the harness design

---

## Sources

1. [T1] [Effective Harnesses for Long-Running Agents](https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents) — Anthropic engineering blog, primary source
2. [T1] [Best Practices for Claude Code](https://code.claude.com/docs/en/best-practices) — Official Claude Code documentation, complementary context
3. [T2] [Hacker News Discussion](https://news.ycombinator.com/item?id=46081704) — Community reaction, ~4 months old at time of HN post
4. [T3] [VentureBeat coverage](https://venturebeat.com/ai/anthropic-says-it-solved-the-long-running-ai-agent-problem-with-a-new-multi) — Secondary coverage, corroborative only
