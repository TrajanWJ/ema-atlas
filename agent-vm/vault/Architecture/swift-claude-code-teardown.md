---
title: "Swift Claude Code — Architectural Teardown"
source: https://github.com/ivan-magda/swift-claude-code
blog: https://ivanmagda.dev
created: 2026-03-19
type: research
tags: [claude-code, architecture, agent-loop, context-compaction, internals]
confidence: 0.95
---

# Swift Claude Code — Architectural Teardown

Ivan Magda's 9-part series rebuilding Claude Code from scratch in Swift. Best public teardown of CC's core mechanics. Thesis: **CC works because of architectural restraint, not complexity.**

## Core Hypothesis (confirmed by implementation)

1. A small number of high-quality tools beats a large tool catalog
2. The model should do most of the heavy lifting — thin orchestration, not thick
3. Explicit task state improves reliability more than prompt-only planning
4. Controlled context injection matters more than persistent memory
5. Context compaction is a product feature, not just a token optimization

## The Loop (the invariant)

```swift
func run(query: String) async throws -> String {
    messages.append(.user(query))
    while true {
        // 1. Apply compaction (always runs micro, conditionally auto)
        messages = await applyCompaction(messages)
        // 2. Drain background notifications
        messages = await drainBackgroundNotifications(messages)
        // 3. API call
        let response = try await apiClient.createMessage(request)
        messages.append(Message(role: .assistant, content: response.content))
        // 4. If done, return
        guard response.stopReason == .toolUse else { return response.content.textContent }
        // 5. Process tools
        let toolProcessing = await processToolUses(response, allowedTools, label)
        // 6. Nag injection (todo reminder after 3 turns without todo update)
        if turnsWithoutTodo >= todoReminderThreshold && todoManager.hasOpenItems() {
            toolResults.append(.text("Update your todos."))
        }
        messages.append(Message(role: .user, content: toolResults))
        // 7. Manual compact if requested
        if let compactFocus = toolProcessing.compactFocus { ... }
    }
}
```

**Key insight:** The loop body never changes. Every stage (tools, memory, subagents, compaction) adds capabilities without touching the loop invariant. This is the architecture.

## Context Compaction — 3 Layers

### Layer 1: Micro-compact (always on, every turn, zero cost)
- Runs before every API call
- Scans message array for old tool results (beyond last 3)
- Replaces content with placeholder: `[Previous: used read_file]`
- Min content length: 100 chars (no point compacting short results)
- No API call required. Silent housekeeping.

### Layer 2: Auto-compact (threshold-triggered)
- Default threshold: 50,000 tokens
- When crossed: saves full conversation to `.transcripts/` as JSONL
- Then asks LLM to summarize the conversation
- Entire messages array collapses to 2 messages: compressed summary + assistant ACK
- Clean slate. Full context of what happened.

### Layer 3: Manual compact tool (model-initiated)
- Model calls `compact` tool explicitly when it decides compression would help
- Optional `focus` parameter guides what summary should preserve
- "The difference between automatic garbage collection and explicit free()"
- Model knows better than the timer when to compress

**Our LCM system maps exactly to this:** micro-compact = our message pruning, auto-compact = our LCM summarization, manual compact = `/compact`. The 3-layer model is validated independently.

## Todo Nag Injection

```swift
private static let todoReminderThreshold = 3

turnsWithoutTodo = toolProcessing.didUseTodo ? 0 : turnsWithoutTodo + 1
if turnsWithoutTodo >= Self.todoReminderThreshold && todoManager.hasOpenItems() {
    toolResults.append(.text("Update your todos."))
}
```

After 3 consecutive turns without a todo update, inject "Update your todos." into tool results. Simple, effective. Forces the model to maintain task state without prompt overhead.

**Steal:** We could apply this pattern to our handoff envelopes — inject "Update your dispatch status." if agent hasn't updated status in N turns.

## Background Task Injection

```swift
func drainBackgroundNotifications(_ messages: [Message]) async -> [Message] {
    let notifications = await backgroundManager.drainNotifications()
    let wrappedText = "<background-results>\n\(text)\n</background-results>"
    
    // Avoid consecutive user messages (API alternation requirement)
    if let lastMessage = result.last, lastMessage.role == .user {
        // Append to existing user message
        var updatedContent = lastMessage.content
        updatedContent.append(.text(wrappedText))
        result[result.count - 1] = Message(role: .user, content: updatedContent)
    } else {
        result.append(.user(wrappedText))
    }
}
```

Background results are injected at the START of each iteration (before the API call). Wrapped in `<background-results>` XML tags. Critical detail: if last message is already a user message, append to it rather than add a new one — Anthropic API requires strict alternation.

**Steal:** Our dispatch agent should use the same pattern for receiving results from parallel subagents. `<background-results>` is a clean contract.

## Task System (File-based, survives compaction)

- `.tasks/` directory, file-based CRUD
- Dependency DAG — tasks can depend on other tasks
- Survives context compaction and process restarts
- Different from todo (in-memory, per-session) — tasks are persistent

**Contrast with todos:** Todos = within-session ephemeral tracking. Tasks = cross-session persistent work units with dependencies.

## System Prompt

```
You are a coding agent at {cwd}. Use tools to solve tasks. Act, don't explain.

- Prefer read_file/write_file/edit_file over bash for file operations
- Always check tool results before proceeding
- Use the todo tool to plan multi-step tasks. Mark in_progress before starting, completed when done.
- Use task tools for persistent multi-step work with dependencies.
- Use background_run for long-running commands (builds, tests, installs). Check with background_check.
```

47 words of actual instructions. The rest is structural. "Act, don't explain" does the heavy lifting.

## Stage Roadmap

| Stage | What It Adds |
|-------|-------------|
| 00 | SPM project, two-target layout (Core lib + thin CLI), CI |
| 01 | Agent loop + bash tool |
| 02 | Tool dispatch: read_file, write_file, edit_file with path safety |
| 03 | Todo tracking with nag reminder injection |
| 04 | Subagents: recursive loop with fresh context |
| 05 | Skill loading: .md files injected as tool results |
| 06 | Context compaction: 3-layer strategy (micro/auto/manual) |
| 07 | Task system: file-based CRUD with dependency DAG |
| 08 | Background tasks: Task{} + actor-based notification queue |

## Architecture Layout

```
swift-claude-code/
├── Sources/
│   ├── Core/          ← all agent logic (testable library)
│   │   ├── Agent.swift        (main loop, tool dispatch, compaction)
│   │   ├── ContextCompactor.swift
│   │   ├── TodoManager.swift
│   │   ├── TaskManager.swift
│   │   ├── BackgroundManager.swift
│   │   └── SkillLoader.swift
│   └── cli/           ← thin entry point only
└── Tests/CoreTests/   ← tests import Core
```

Two-target layout: all logic in testable library, executable is just the entry point. This is the right way.

## Key Limits (from source)

```swift
public enum Limits {
    public static let maxOutputSize = 50_000
    public static let defaultMaxTokens = 4096
    public static let defaultTokenThreshold = 50_000  // triggers auto-compact
    public static let backgroundTimeout: TimeInterval = 300  // 5 min
    public static let backgroundResultPreview = 500  // chars
}
```

## What This Confirms About Our System

1. **Our loop is correct** — same invariant: one while loop, tools as variables
2. **LCM = validated** — 3-layer compaction is the right model (micro/auto/manual)
3. **Thin orchestration is right** — "trust the model" vs thick scaffolding
4. **Background injection pattern** — `<background-results>` XML wrapping is the right contract
5. **Task vs todo distinction** — we should maintain this in our dispatch: ephemeral tracking vs persistent task DAG
6. **System prompt minimalism** — 47 words + structural. "Act, don't explain."
7. **Nag injection** — turns-without-action counter is a legit mechanism, steal it

## What We Don't Have That We Should

1. **`todoReminderThreshold` counter** — inject dispatch status reminder after N turns of silence
2. **Explicit `<background-results>` contract** — tag format for inter-agent result injection
3. **Micro-compact as pre-call step** — we do this in LCM but should verify it runs before every call, not just on thresholds
