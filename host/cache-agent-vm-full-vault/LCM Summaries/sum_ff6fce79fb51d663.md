# LCM Summary sum_ff6fce79fb51d663

Created: 2026-03-25 18:14:53
Kind: leaf
Depth: 0
Conversation: 1272
Tokens: 1215
Descendants: 0
Earliest: 2026-03-24T23:49:50.000Z
Latest: 2026-03-25T17:57:18.000Z

## Content

[2026-03-24 23:49 UTC]
=== v3/@claude-flow/codex/.agents/skills/memory-management/SKILL.md ===
---
name: memory-management
description: >
  AgentDB memory system with HNSW vector search.
  Use when: need to store patterns, search for solutions, semantic lookup.
  Skip when: no learning needed, ephemeral tasks.
---

# Memory Management Skill

## Purpose
AgentDB memory system with HNSW vector search.

## When to Trigger
- need to store patterns
- search for solutions
- semantic lookup

## When to Skip
- no learning needed
- ephemeral tasks

## Commands

### Store Data
Store a pattern in memory

```bash
npx @claude-flow/cli memory store --key "key" --value "value" --namespace patterns
```

### Search Data
Semantic search in memory

```bash
npx @claude-flow/cli memory search --query "search terms" --limit 10
```



## Best Practices
1. Check memory for existing patterns before starting
2. Use hierarchical topology for coordination
3. Store successful patterns after completion
4. Document any new learnings
=== v3/@claude-flow/codex/.agents/skills/swarm-orchestration/SKILL.md ===
---
name: swarm-orchestration
description: >
  Multi-agent swarm coordination for complex tasks.
  Use when: 3+ files need changes, new features, refactoring.
  Skip when: single file edits, simple fixes, documentation.
---

# Swarm Orchestration Skill

## Purpose
Multi-agent swarm coordination for complex tasks.

## When to Trigger
- 3+ files need changes
- new features
- refactoring

## When to Skip
- single file edits
- simple fixes
- documentation

## Commands

### Initialize Swarm
Start a new swarm with hierarchical topology

```bash
npx @claude-flow/cli swarm init --topology hierarchical --max-agents 8
```

### Route Task
Route a task to the appropriate agents

```bash
npx @claude-flow/cli hooks route --task "[task description]"
```

### Monitor Status
Check the current swarm status

```bash
npx @claude-flow/cli swarm status
```



## Best Practices
1. Check memory for existing patterns before starting
2. Use hierarchical topology for coordination
3. Store successful patterns after completion
4. Document any new learnings
=== v3/@claude-flow/codex/.agents/skills/security-audit/SKILL.md ===
---
name: security-audit
description: >
  Security scanning and vulnerability detection.
  Use when: authentication, authorization, payment processing, user data.
  Skip when: read-only operations, internal tooling.
---

# Security Audit Skill

## Purpose
Security scanning and vulnerability detection.

## When to Trigger
- authentication
- authorization
- payment processing
- user data

## When to Skip
- read-only operations
- internal tooling

## Commands

### Full Security Scan
Run comprehensive security analysis

```bash
npx @claude-flow/cli security scan --depth full
```

### Input Validation Check
Check for input validation issues

```bash
npx @claude-flow/cli security scan --check input-validation
```



## Best Practices
1. Check memory for existing patterns before starting
2. Use hierarchical topology for coordination
3. Store successful patterns after completion
4. Document any new learnings
=== v3/@claude-flow/codex/.agents/skills/sparc-methodology/SKILL.md ===
---
name: sparc-methodology
description: >
  SPARC development workflow (Specification, Pseudocode, Architecture, Refinement, Completion).
  Use when: new features, complex implementations, architectural changes.
  Skip when: simple fixes, documentation, configuration.
---

# Sparc Methodology Skill

## Purpose
SPARC development workflow (Specification, Pseudocode, Architecture, Refinement, Completion).

## When to Trigger
- new features
- complex implementations
- architectural changes

## When to Skip
- simple fixes
- documentation
- configuration

## Commands

### Specification Phase
Define requirements and acceptance criteria

```bash
npx @claude-flow/cli hooks route --task "specification: [requirements]"
```

### Architecture Phase
Design system structure

```bash
npx @claude-flow/cli hooks route --task "architecture: [design]"
```



## Best Practices
1. Check memory for existing patterns before starting
2. Use hierarchical topology for coordination
3. Store successful patterns after completion
4. Document any new learnings

[2026-03-24 23:49 UTC]
Alright, I've now inventoried everything. Here's the reality:

**Agent YAMLs** — same 5 configs (coder, tester, reviewer, architect, security-architect) duplicated across 10+ packages. Thin YAML, no real substance. The consensus agent MDs (byzantine, raft, gossip, crdt, quorum, security, performance) are the real prompts — those have detailed system prompts with actual implementation patterns.

**Code modules worth extracting** — the 21 packages under `@claude-flow/v3`:
- swarm (consensus/coordination)
- memory (HNSW/AgentDB/learning 
[LCM fallback summary; truncated for context management]
