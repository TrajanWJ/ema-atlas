---
title: EliFuzz Coding Agent System Prompts
created: '2026-03-16'
updated: '2026-03-16'
type: knowledge
status: active
confidence: 0.8
confidence_updated: 2026-03-18T00:00:00.000Z
source: external-research
tags:
  - coding-agents
  - production-patterns
  - reverse-engineering
  - system-prompts
  - tool-architectures
summary: >-
  Comprehensive collection of system prompts and tool definitions from
  production AI coding agents. Contains reverse-engineered prompts from Cursor,
  Cla
wiki_id: reference/prompts/EliFuzz_Coding_Agent_System_Prompts
imported_from: vault/Reference/prompts/EliFuzz Coding Agent System Prompts.md
imported_at: '2026-04-04T00:23:56.962Z'
---
# EliFuzz Coding Agent System Prompts

**Source:** https://github.com/EliFuzz/awesome-system-prompts  
**Quality Rating:** ⭐⭐⭐⭐⭐ (5/5)  
**Category:** Coding Agents, System Prompts, Reverse Engineering  
**Relevance:** Critical - Direct reverse-engineered prompts from production coding agents

## What It Is

Comprehensive collection of system prompts and tool definitions from production AI coding agents. Contains reverse-engineered prompts from Cursor, Claude Code, Devin AI, Aider, Lovable, and 30+ other coding systems.

## Major Categories

### Production Coding Agents
- **Claude Code** - Multiple versions with tool definitions and safety patterns
- **Cursor** - Agent modes, memory systems, code modification patterns
- **Devin AI** - Autonomous coding workflows and planning systems
- **Aider** - File modification patterns and diff management  
- **Lovable** - Full-stack development and driven development practices

### Specialized Systems  
- **Cline** - MCP integration and browser automation
- **Augment** - Multi-model routing and task management
- **Blackbox** - 19 different agent templates and patterns
- **Perplexity** - Research-first development approaches

### Tool Architectures
- Bash/Shell execution patterns
- File read/write/edit tool definitions  
- Web browsing and search integrations
- Memory and state management tools

## Actionable Takeaways

### Code Agent Architecture Patterns

1. **Tool-First Design**
   ```
   Primary Tools → Secondary Tools → Safety Wrappers → Error Handling
   ```

2. **Planning-Execution Loops**
   ```
   Analyze → Plan → Execute → Verify → Refine → Document
   ```

3. **Context Management**
   ```
   File Context + Project Context + User Intent + Safety Constraints
   ```

### Key Technical Insights

1. **Multi-Modal Prompting**: Different prompts for different interaction modes (chat vs agent vs file editing)
2. **Tool Parameter Validation**: Extensive input sanitization and validation patterns
3. **Error Recovery**: Graceful degradation and retry mechanisms
4. **Code Quality Gates**: Automated testing and review checkpoints

## Critical Patterns for Our System

### File Operation Safety
```
1. Always validate paths before operations
2. Create backups before destructive changes  
3. Implement atomic operations where possible
4. Log all file system interactions
```

### Code Generation Protocols
```
1. Context gathering → Requirements analysis → Implementation → Testing → Documentation
2. Incremental development with frequent validation
3. User confirmation for major changes
4. Rollback mechanisms for failed attempts
```

### Multi-Agent Coordination
```
1. Clear handoff protocols between specialized agents
2. Shared state management through vault/memory systems
3. Conflict resolution for concurrent edits
4. Task decomposition and parallel execution
```

## Specific Tools to Implement

1. **Enhanced File Operations**: Multi-edit, atomic changes, backup systems
2. **Advanced Search**: Context-aware code search across projects
3. **Planning Tools**: Task decomposition and dependency management
4. **Quality Gates**: Automated testing integration and code review

## Applications for Trajan's System

### Coder Agent Enhancement
- Implement Cursor-style multi-modal interaction patterns
- Add Devin-like autonomous planning capabilities
- Integrate Lovable's driven development methodology

### Security & Safety
- Apply Claude Code's permission-gating patterns
- Implement Aider's surgical edit mechanisms  
- Add comprehensive error handling from production systems

### Tool Integration
- Build MCP-style tool discovery and management
- Create standardized tool parameter validation
- Implement tool-chaining and orchestration patterns

## Implementation Priority

1. **High**: File operation safety patterns from Claude Code/Cursor
2. **High**: Planning and execution loops from Devin AI
3. **Medium**: Multi-agent handoff protocols from production systems
4. **Medium**: Advanced search and context management from Cline

#coding-agents #system-prompts #reverse-engineering #tool-architectures #production-patterns
## Related

- [[EliFuzz Coding Agent System Prompts]]
- [[research-round-2-metaprompting-deep-dive]]
- [[devin-ai-2025-system-prompts]]
