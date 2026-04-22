---
title: "Aider-2025-System-Prompt"
created: 2026-03-16
updated: 2026-03-16
type: reference
status: active
confidence: 0.80
confidence_updated: 2026-03-18
source: reference
tags: [architecture, auth, code, docker, knowledge, prompts]
summary: "```"
---
# Aider Production System Prompt (July 2025)

> **Source**: EliFuzz/awesome-system-prompts → Production leak from Aider
> **Date**: July 2025
> **Focus**: Expert software developer with precise edit format

## Related
- [[Cursor-2025-November-System-Prompt]] — Cursor IDE system prompt comparison
- [[Devin-AI-2025-System-Prompts]] — Devin AI production system prompts
- [[Superpowers Architecture - Stolen Patterns]] — stolen patterns from these AI systems

## Core Philosophy **[IMPLEMENT]**

```
"Act as an expert software developer.
Always use best practices when coding.
Respect and use existing conventions, libraries, etc. that are already present in the codebase."
```

**Identity**: Not just an AI assistant, but an **expert software developer** with deep domain knowledge.

## Key Architecture Pattern: SEARCH/REPLACE Blocks **[IMPLEMENT]**

### The Central Innovation
Aider's core innovation is a **rigorous edit format** that eliminates ambiguity:

```
ONLY EVER RETURN CODE IN A _SEARCH/REPLACE BLOCK_!
```

### SEARCH/REPLACE Format Rules **[IMPLEMENT]**

1. **Full filepath** alone on a line (no formatting, escaping, etc.)
2. **Opening fence** with language: ````python`
3. **Search marker**: `<<<<<<< SEARCH`
4. **Exact code to find** (character-perfect match)
5. **Divider**: `=======`
6. **Replacement code**
7. **End marker**: `>>>>>>> REPLACE`
8. **Closing fence**: ````

### Critical Matching Requirements **[IMPLEMENT]**

```
"Every _SEARCH_ section must _EXACTLY MATCH_ the existing file content, character for character, including all comments, docstrings, etc."

"_SEARCH/REPLACE_ blocks will _only_ replace the first match occurrence."
```

**Takeaway**: Exact matching prevents ambiguous edits and ensures reliable code modification.

## Edit Strategy Patterns **[IMPLEMENT]**

### 1. Permission-Based Editing
```
"But if you need to propose edits to existing files not already added to the chat, you _MUST_ tell the user their full path names and ask them to _add the files to the chat_."
```

**Takeaway**: Explicit consent model prevents unauthorized file modification.

### 2. Concise Block Strategy
```
"Keep _SEARCH/REPLACE_ blocks concise.
Break large _SEARCH/REPLACE_ blocks into a series of smaller blocks that each change a small portion of the file.
Include just the changing lines, and a few surrounding lines if needed for uniqueness."
```

### 3. Code Movement Pattern
```
"To move code within a file, use 2 _SEARCH/REPLACE_ blocks: 1 to delete it from its current location, 1 to insert it in the new location."
```

### 4. New File Creation
For new files:
- New filepath (including directory)
- Empty `SEARCH` section
- Full file contents in `REPLACE` section

## Workflow Management **[IMPLEMENT]**

### Request Processing Flow
1. **Clarify ambiguous requests** - Ask questions before proceeding
2. **Identify required files** - Request file additions if needed
3. **Think step-by-step** - Explain needed changes in short sentences
4. **Implement with SEARCH/REPLACE** - Use precise edit blocks

### User Confirmation Handling
```
"If the user just says something like 'ok' or 'go ahead' or 'do that' they probably want you to make SEARCH/REPLACE blocks for the code changes you just proposed."
```

**Takeaway**: Implicit confirmations should trigger implementation, not more discussion.

## Template System **[IMPLEMENT]**

Aider uses dynamic template variables for customization:

- `{final_reminders}` - Context-based additional instructions
- `{language}` - User's preferred response language
- `{shell_cmd_prompt}` - Platform-specific shell guidance
- `{fence[0]}` and `{fence[1]}` - Code fence markers

### Behavioral Modifiers
- `lazy` mode: "You NEVER leave comments describing code without implementing it!"
- `overeager` mode: "Do what they ask, but no more. Do not improve unrelated parts!"

## Shell Command Integration **[IMPLEMENT]**

```
"To rename files which have been added to the chat, use shell commands at the end of your response."
```

**Takeaway**: File operations can be mixed with code edits in a single response.

## Safety and Precision **[IMPLEMENT]**

### Exact Matching Philosophy
```
"If the file contains code or other data wrapped/escaped in json/xml/quotes or other containers, you need to propose edits to the literal contents of the file, including the container markup."
```

### Uniqueness Requirements
```
"Include enough lines in each SEARCH section to uniquely match each set of lines that need to change."
```

### First-Match-Only Behavior
Only replaces the first occurrence, requiring multiple blocks for multiple changes.

## Actionable Takeaways **[IMPLEMENT]**

### 1. Exact-Match Edit System
Implement SEARCH/REPLACE blocks with character-perfect matching for reliable code edits.

### 2. Permission-Based File Access
Require explicit user consent before editing files not already in context.

### 3. Concise Edit Strategy
Break large changes into small, focused SEARCH/REPLACE blocks for clarity and reliability.

### 4. Expert Developer Identity
Position as domain expert, not generic assistant. Always follow best practices.

### 5. Implicit Confirmation Handling
When users give simple confirmations ("ok", "go ahead"), implement the discussed changes immediately.

### 6. Template-Driven Customization
Use dynamic variables to customize behavior based on context and user preferences.

### 7. Mixed Command Responses
Combine code edits with shell commands in single responses when appropriate.

### 8. Step-by-Step Communication
Always explain needed changes before implementing them.

## Unique Aider Advantages **[IMPLEMENT]**

1. **Elimination of Edit Ambiguity**: SEARCH/REPLACE format makes edits completely unambiguous
2. **Reliable Code Matching**: Character-perfect matching prevents edit failures
3. **Granular Change Control**: Small, focused blocks for precise modifications
4. **Expert Developer Persona**: Domain authority rather than generic helpfulness
5. **Template Flexibility**: Behavioral adaptation through dynamic components

This represents a focused, reliable approach to AI-assisted code editing with emphasis on precision and expert-level development practices.