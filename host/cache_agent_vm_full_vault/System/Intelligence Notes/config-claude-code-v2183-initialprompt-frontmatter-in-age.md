---
title: "Claude Code v2.1.83: initialPrompt Frontmatter in Agent Definitions"
type: reference
created: 2026-03-25
confidence: high
source: claude-code changelog v2.1.83, agent definition files
summary: "Agents can declare initialPrompt in frontmatter to auto-submit a first turn without external scripting"
tags: [claude-code, agent-definitions, frontmatter, automation, config-change]
---

# Claude Code v2.1.83: `initialPrompt` Frontmatter in Agent Definition Files

- **Source:** 2d043f24.txt, Claude Code changelog v2.1.83
- **Suggested:** 2026-03-25T18:48:27Z
- **Impact:** 3/5
- **Status:** Applied

## Overview

Starting with Claude Code v2.1.83, agent definition files (`.md` files in `agents/` directories) support an `initialPrompt` field in their YAML frontmatter. When an agent with `initialPrompt` is launched, Claude Code automatically submits the specified prompt as the agent's first user turn — eliminating the need for external shell scripts, wrapper commands, or programmatic prompt injection to bootstrap agent behavior.

This is part of a broader v2.1.83 release that added several agent infrastructure improvements, including [[config-claude-code-v2183-claudecodesubprocessenvscrub1-sc|CLAUDE_CODE_SUBPROCESS_ENV_SCRUB]], managed-settings.d/ drop-in directories, and CwdChanged/FileChanged hooks.

## How It Works

Agent definition files use markdown with YAML frontmatter. Before v2.1.83, frontmatter supported fields like `name`, `description`, and `model`. The `initialPrompt` field adds a new capability:

```yaml
---
name: my-agent
description: Does specialized work
model: sonnet
initialPrompt: "Analyze the current directory for security issues and produce a report."
---

You are a security analysis agent. When given a codebase...
```

When this agent is spawned (via the `Agent` tool with `subagent_type: "my-agent"`), Claude Code:

1. Creates the agent subprocess with the system prompt (the markdown body)
2. Automatically submits the `initialPrompt` string as the first user message
3. The agent begins working immediately without waiting for manual input

This is equivalent to what the Claude Code SDK and tools like Cherry Studio implement programmatically — creating a user message stream and injecting the initial prompt as the first message — but declaratively, in the agent definition itself.

## Why This Matters

### Before: External Scripting Required

Prior to this feature, getting an agent to start working on a specific task required one of:

- **Shell wrapper scripts** that pipe an initial prompt into the agent's stdin
- **SDK-level programmatic injection** (e.g., `createUserMessageStream(initialPrompt)` in TypeScript)
- **Hook-based prompt injection** using CwdChanged or similar lifecycle hooks to submit a prompt after agent creation
- **Manual intervention** where the parent agent or user had to explicitly provide the first message

This was fragile: scripts could get out of sync with agent definitions, and it created a split between "what the agent is" (the definition file) and "how the agent starts" (the external script).

### After: Self-Contained Agent Definitions

With `initialPrompt`, the agent definition file is fully self-contained. The agent knows:
- **Who it is** (the system prompt in the markdown body)
- **What it does first** (the `initialPrompt` field)
- **What model it uses** (the `model` field)

This aligns with the principle that agent definitions should be declarative and portable — you can move an agent `.md` file between projects and it carries its startup behavior with it.

## Practical Applications

### Autonomous Background Agents

Agents that need to perform a standard task every time they're spawned (e.g., "scan for TODOs", "run the test suite", "check for broken links") can encode that task directly:

```yaml
---
name: todo-scanner
description: Scans codebase for TODO/FIXME items
initialPrompt: "Search all source files for TODO, FIXME, HACK, and XXX comments. Group by directory and severity."
---
```

### Agent OS / Dispatch Integration

For systems like the dispatch engine that spawn agents programmatically, `initialPrompt` simplifies the spawning interface. The orchestrator doesn't need to know what each agent's startup task is — it just launches the agent and the agent self-starts.

### Chained Agent Workflows

Combined with the [[claude-code-v2184-taskcreated-hook--new-lifecycle-|TaskCreated hook]] added in v2.1.84, `initialPrompt` enables fully declarative agent pipelines where agents self-start and hooks wire them together.

## Relationship to Other v2.1.83 Changes

This feature arrived alongside several related agent infrastructure improvements:

- **[[claude-code-v2183-taskoutput-tool-deprecated--use-|TaskOutput deprecation]]** — agents now read output via file paths, simplifying inter-agent communication
- **CLAUDE_CODE_SUBPROCESS_ENV_SCRUB** — security hardening for agent subprocesses
- **managed-settings.d/** — layered config overlays enabling per-agent settings
- **CwdChanged/FileChanged hooks** — filesystem-reactive agent behaviors

Together, these changes represent a shift toward more declarative, self-contained agent definitions with less reliance on external orchestration scripts.

## Limitations and Considerations

- The `initialPrompt` is static — it's defined at author time, not dynamically generated per invocation. For dynamic prompts, the parent agent still needs to pass context via the `prompt` parameter of the Agent tool.
- When an agent has both `initialPrompt` and receives a `prompt` from the Agent tool, the interaction order and precedence should be tested — the Agent tool's `prompt` parameter likely takes priority or is appended after the initial prompt.
- `initialPrompt` is most useful for agents that always start the same way. Agents that need different startup contexts per invocation should continue using the `prompt` parameter.

---
Tags: #intelligence #config-change #auto-applied #claude-code #agent-infrastructure
