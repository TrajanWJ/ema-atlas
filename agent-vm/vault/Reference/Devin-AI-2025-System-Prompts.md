---
title: "Devin-AI-2025-System-Prompts"
created: 2026-03-16
updated: 2026-03-16
type: reference
status: active
confidence: 0.50
confidence_updated: 2026-03-18
source: reference
tags: [architecture, auth, code, github, mcp, prompts]
summary: "Devin operates in different modes for different tasks:"
---
# Devin AI Production System Prompts (2025)

> **Source**: EliFuzz/awesome-system-prompts → Production leaks from Devin AI
> **Modes**: Deep Wiki (Q&A) + Main System (Agent)
> **Date**: 2025

## Architecture Overview

Devin operates in different modes for different tasks:
1. **Deep Wiki Mode**: Codebase Q&A with precise citations
2. **Main System Mode**: Full software engineering agent
3. **Planning/Standard/Edit Modes**: Workflow state management

## Key Architecture Patterns **[IMPLEMENT]**

## Related
- [[Cursor-2025-November-System-Prompt]] — Cursor IDE system prompt comparison
- [[Aider-2025-System-Prompt]] — Aider coding assistant system prompt analysis
- [[Agent-Architecture-Synthesis-2026-03]] — synthesis of agent architecture patterns

### 1. Citation-First Design (Deep Wiki Mode) **[IMPLEMENT]**
```
"Output a `<cite/>` tag after EVERY SINGLE SENTENCE and claim that you make. Every sentence and claim MUST END IN A CITATION."

"Citations should use the MINIMUM number of lines of code needed to support each claim. DO NOT include the entire snippet."
```

**Citation Format**:
```html
<cite repo="REPO_NAME" path="FILE_PATH" start="START_LINE" end="END_LINE" />
```

**Takeaway**: Rigorous citation requirements build trust and traceability. Every claim must be backed by specific code references.

### 2. Bounded Search Strategy **[IMPLEMENT]**
```
"DO NOT CITE ENTIRE FUNCTIONS. If it involves logic spanning more than 3 lines, set your line numbers to the definition of the function or class."
```

**Takeaway**: Prevent information overload by focusing on the most relevant lines.

### 3. Truthful Engineering Philosophy **[IMPLEMENT]**
```
"Do not make any guesses or speculations about the codebase context. If there are things that you are unsure of or unable to answer without more information, say so."

"You don't create fake sample data or tests when you can't get real data"
"You don't mock / override / give fake data when you can't pass tests"
"You don't pretend that broken code is working when you test it"
```

### 4. Three-Mode Workflow System **[IMPLEMENT]**

**Planning Mode**:
- Gather all information needed to fulfill task
- Search and understand codebase using LSP
- Ask for help if missing crucial context
- Output plan via `suggest_plan` command

**Standard Mode**:
- Execute plan steps
- React to new instructions/feedback
- Update todo list as work progresses
- Don't jump straight into changes unless trivial

**Edit Mode**:
- Execute all file modifications from plan
- Make all edits at once using editor commands
- Pay attention to edit-mode specific hints

### 5. Command Architecture **[IMPLEMENT]**

**Command Categories**:
- **Reasoning**: `<think>` for complex decisions (bounded usage)
- **Shell**: Bracketed paste mode, long-running process handling
- **Editor**: File operations with LSP integration
- **Search**: Optimized file/content search (never use grep/find)
- **LSP**: Definition/reference/hover symbol information
- **Browser**: Playwright-controlled Chrome with devinid attributes
- **Git**: Authenticated proxy for PR creation/management
- **MCP**: Third-party tool integration
- **User**: Blocking/non-blocking communication

### 6. Environment Integration **[IMPLEMENT]**

**Error Handling**:
```
"When encountering environment issues, report them to the user using the <report_environment_issue> command. Then, find a way to continue your work without fixing the environment issues."
```

**Testing Strategy**:
```
"When struggling to pass tests, never modify the tests themselves, unless your task explicitly asks you to modify the tests. Always first consider that the root cause might be in the code you are testing."
```

### 7. Git Workflow Patterns **[IMPLEMENT]**

**Branch Naming**: `devin/{timestamp}-{feature-name}` (use `date +%s`)

**PR Management**:
- Use builtin commands over CLI when possible
- Never force push, ask for help instead
- Monitor CI with `git_pr_checks` with `wait="True"`
- Auto-generated PR descriptions with refresh capability
- Include Devin run URL and user's GitHub handle

**Commit Hygiene**:
```
"Never use `git add .`; instead be careful to only add the files that you actually want to commit."
```

### 8. Coding Standards **[IMPLEMENT]**

```
"Do not add comments to the code you write, unless the user asks you to, or if you are just copying comments that already existed in the code."

"When making changes to files, first understand the file's code conventions. Mimic code style, use existing libraries and utilities, and follow existing patterns."

"NEVER assume that a given library is available, even if it is well known. Whenever you write code that uses a library or framework, first check that this codebase already uses the given library."
```

### 9. User Communication Strategy **[IMPLEMENT]**

**Blocking vs Non-blocking**:
- `BLOCK`: Only when literally cannot proceed without critical user info
- `DONE`: Task fully completed, session will terminate
- `NONE`: Continue working autonomously

**BLOCK Examples** (use sparingly):
- Missing database passwords not in environment
- Completely broken codebase after multiple fix attempts
- Specific files mentioned don't exist and can't locate similar

**NOT BLOCK** (use NONE):
- Normal collaborative planning
- Design discussions
- Clarifying scope questions

### 10. Browser Automation **[IMPLEMENT]**

**devinid System**: 
- Automatic injection of `devinid` attributes into HTML
- More reliable than pixel coordinates
- Fallback to coordinates when needed

**Interaction Patterns**:
- Multiple actions per turn for same tab
- Wait for page loading with `<wait>` command
- Console access for sophisticated actions

## Unique Devin Patterns **[IMPLEMENT]**

### Think Command Boundaries
```
"You MUST use the think command in the following situation:
- Before using git commands that go beyond standard workflow
- Before transitioning from planning to normal mode
- Before telling the user that you have completed the task
- Right after opening an image, screenshot, or browser step"
```

### Multi-Command Efficiency
```
"Output multiple actions at once, as long as they can be executed without seeing the output of another action in the same response first."
```

### LSP Integration
- Frequent use of go_to_definition, go_to_references, hover_symbol
- Parallel LSP commands for context gathering
- Type information for correct arguments and assumptions

## Actionable Takeaways **[IMPLEMENT]**

1. **Implement Citation System**: Every claim backed by specific code references
2. **Three-Mode Workflow**: Planning → Standard → Edit with clear transitions  
3. **Truthful Engineering**: Never fake data, mock responses, or pretend broken code works
4. **Bounded Tool Usage**: Think command restrictions, 3-line citation limits
5. **Environment Issue Reporting**: Report problems, then continue work without fixing them
6. **Git Workflow Standards**: Timestamp-based branches, no force push, CI monitoring
7. **LSP-First Development**: Use language server for definitions, references, types
8. **Multi-Command Efficiency**: Batch operations when dependencies allow
9. **Browser Automation**: devinid system with coordinate fallback
10. **User Communication Boundaries**: Clear BLOCK vs NONE distinction

This represents a production-grade autonomous software engineering agent with sophisticated planning, execution, and verification capabilities.