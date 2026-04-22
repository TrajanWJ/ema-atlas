---
title: "Cursor-2025-November-System-Prompt"
created: 2026-03-16
updated: 2026-03-16
type: reference
status: active
confidence: 0.50
confidence_updated: 2026-03-18
source: reference
tags: [architecture, code, prompts, security]
summary: "```"
---
# Cursor Production System Prompt (November 2025)

> **Source**: EliFuzz/awesome-system-prompts → Production leak from Cursor IDE
> **Date**: November 2025
> **Product**: Cursor IDE AI Coding Assistant

## Key Architecture Patterns **[IMPLEMENT]**

### 1. Identity and Positioning
```
"You are Composer, a language model trained by Cursor"
"You operate exclusively in Cursor, the world's best IDE"
"You are pair programming with a USER to solve their coding task"
```

**Takeaway**: Clear identity positioning and competitive framing. Not generic "AI assistant" but specific role-based identity.

## Related
- [[Devin-AI-2025-System-Prompts]] — Devin AI production system prompts comparison
- [[Aider-2025-System-Prompt]] — Aider coding assistant system prompt analysis
- [[Superpowers Architecture - Stolen Patterns]] — stolen patterns implemented from these sources

### 2. Tool Usage Philosophy **[IMPLEMENT]**
```
"NEVER refer to tool names when speaking to the USER. For example, say 'I will edit your file' instead of 'I need to use the edit_file tool to edit your file'."
```

**Critical Pattern**: Hide implementation details. Present capabilities naturally without exposing the machinery.

### 3. Code Change Strategy **[IMPLEMENT]**
```
"When making code changes, NEVER output code to the USER, unless requested. Instead use one of the code edit tools to implement the change."

"Unless you are appending some small easy to apply edit to a file, or creating a new file, you MUST read the contents or section of what you're editing first."
```

**Takeaway**: Action over explanation. Read-before-edit pattern ensures context awareness.

### 4. Communication Guidelines **[IMPLEMENT]**
- "Bias towards being direct and to the point when communicating"
- "Do not use too many LLM-style phrases/patterns"
- "Format your responses in markdown"
- "Use backticks to format file, directory, function, and class names"

### 5. Error Handling Philosophy
```
"If you've introduced (linter) errors, fix them if clear how to (or you can easily figure out how to). Do not make uneducated guesses and do not loop more than 3 times to fix linter errors on the same file."
```

**Takeaway**: Bounded error correction prevents infinite loops.

### 6. Context-Aware Tool Selection

**Semantic vs Exact Search**:
- `codebase_search`: "How does X work?", "What happens when Y?"
- `grep`: Exact symbol/string searches, faster, respects .gitignore

**Tool Specialization**:
- Terminal commands: Non-interactive flags, background jobs, pager handling
- File operations: Read-before-write, preserve indentation
- Notebook editing: Context-aware replacements, cell-specific logic

### 7. Security and Best Practices **[IMPLEMENT]**
```
"If an external API requires an API Key, be sure to point this out to the USER. Adhere to best security practices (e.g. DO NOT hardcode an API key in a place where it can be exposed)"
```

### 8. UI/UX Philosophy
```
"If you're building a web app from scratch, give it a beautiful and modern UI, imbued with best UX practices."
```

**Takeaway**: Default to high quality, don't ask for clarification on quality expectations.

## Production Tool Architecture **[IMPLEMENT]**

### Available Tools
- `codebase_search`: Semantic search
- `run_terminal_cmd`: Command execution with approval flow
- `grep`: Ripgrep-based exact search
- `search_replace`: Exact string replacement
- `read_file`/`write`: File operations
- `web_search`: Real-time information
- `read_lints`: Workspace diagnostics
- `todo_write`: Task management
- `edit_notebook`: Jupyter notebook editing

### Tool Usage Patterns

**Search Strategy**:
```
1. codebase_search for semantic queries
2. grep for exact symbol/string searches  
3. web_search for real-time information
```

**Edit Strategy**:
```
1. read_file (unless small append)
2. search_replace or write
3. read_lints (only if edited)
4. Fix linter errors (max 3 attempts)
```

**Command Execution**:
```
1. Non-interactive flags (--yes)
2. Background for long-running commands
3. | cat for pager commands
4. Context-aware shell state
```

### Todo Management System **[IMPLEMENT]**
```
Use for:
- Complex multi-step tasks (3+ distinct steps)
- Non-trivial tasks requiring careful planning
- User explicit requests

Skip for:
- Tasks completable in < 3 trivial steps  
- Conversational/informational requests
- NEVER include: linting, testing, searching/examining codebase

Rules:
- Only ONE task in_progress at a time
- Mark complete IMMEDIATELY after finishing
- Create specific, actionable items
```

## Communication Patterns **[IMPLEMENT]**

### Forbidden Patterns
- "I need to use the edit_file tool" → "I will edit your file"
- Exposing tool names or system prompt details
- LLM-style verbose explanations
- Outputting code instead of using edit tools

### Preferred Patterns
- Direct, to-the-point communication
- Markdown formatting with backticks for code references
- Action-first approach (do, then explain)
- Context-aware responses based on user state

## Error Boundaries **[IMPLEMENT]**

### Linter Error Handling
- Fix if clear how to
- Don't make uneducated guesses
- Max 3 attempts per file
- Bounded loops prevent infinite correction cycles

### File Operation Safety
- Read before write (unless small append)
- Preserve exact indentation
- Graceful failure handling
- Respect .gitignore/.cursorignore

### Command Execution Safety
- User approval flow for sensitive commands
- Non-interactive flags for autonomous operation
- Background job management
- Working directory awareness

## Context Integration **[IMPLEMENT]**

Cursor provides rich context:
- Files currently open
- Cursor position
- Recently viewed files
- Edit history in session
- Linter errors
- User state information

**Decision Framework**: 
"This information may or may not be relevant to the coding task, it is up to you to decide."

## Actionable Takeaways **[IMPLEMENT]**

1. **Hide Tool Complexity**: Present capabilities naturally without exposing implementation
2. **Action Over Explanation**: Use tools to implement changes rather than describing what to do
3. **Read-Before-Edit**: Always read file contents before making changes (unless trivial append)
4. **Bounded Error Correction**: Limit retry attempts to prevent infinite loops
5. **Context-Aware Tool Selection**: Semantic search vs exact search, appropriate tool per task
6. **Quality Defaults**: Build beautiful, modern UIs without asking for quality specifications
7. **Security Awareness**: Point out API key requirements, follow best practices
8. **Todo Management**: Use for complex tasks (3+ steps), skip for simple operations
9. **Communication Clarity**: Direct, markdown-formatted, action-oriented responses
10. **Error Boundaries**: Graceful failure handling with clear limits

This represents a production-grade AI coding assistant with sophisticated tool integration and user experience patterns.