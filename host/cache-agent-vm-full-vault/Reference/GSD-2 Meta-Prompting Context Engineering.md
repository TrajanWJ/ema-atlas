# GSD-2 — Meta-Prompting & Context Engineering for Autonomous Agents

**Repo:** https://github.com/gsd-build/gsd-2
**Stars:** 4.2k (updated April 2026, very active)
**Language:** TypeScript
**Built on:** Pi SDK

## What It Is

GSD-2 is a full CLI harness for autonomous coding agents — not just a prompt, but a programmatic system that owns the agent's context window. The original GSD went viral as a Claude Code prompt framework; v2 graduates it to a real orchestration layer.

## Key Capabilities (vs. pure prompting)

- **Context window management** — clears context between tasks, injects only relevant files at dispatch time
- **Git branch management** — tracks work in branches, maintains clean commit history
- **Token cost tracking** — monitors spend across a session
- **Stuck loop detection** — recovers from crashes and runaway loops automatically
- **Milestone autonomy** — "one command, walk away, come back to a built project"
- **PREFERENCES.md pattern** — persistent agent preferences file, survives context resets

## Why It Matters

This is the pattern we've been approximating manually with AGENTS.md, SOUL.md, CONTINUE.md, and TASKS.md — but GSD-2 bakes it into a CLI that programmatically controls what the agent sees at each step.

The PREFERENCES.md pattern is worth stealing: a file the agent writes during a session that persists across context clears, keeping personality/preferences stable. Equivalent to what we do with vault/Trajan/Preferences.md but scoped to the coding agent itself.

## Relevance to Our Stack

- **Context engineering** — directly aligned with how we manage Right Hand's working memory
- **Stuck loop detection** — would improve how Coder handles long tasks
- **Milestone autonomy** — the "spec → build → ship without handholding" loop we want from Coder

## Related

- [[Agent-Skills-for-Context-Engineering]] — muratcankoylan's collection (14.6k ⭐), broader skill library
- [[mvanhorn/last30days-skill]] — multi-source research skill (17.7k ⭐), installable via clawhub
- [[Claude-Code-Power-Patterns]] — existing reference on Claude Code orchestration

## Tags

#agent-architecture #context-engineering #meta-prompting #coding-agent #tool-reference
