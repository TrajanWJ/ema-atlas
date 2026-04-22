---
title: "Consolidate Duplicate Sections in Agent Configuration Files"
type: reference
created: 2026-03-20
updated: 2026-04-10
confidence: high
source: task-c8542e6a.txt
summary: "Duplicate sections in SOUL.md/CLAUDE.md cause agents to silently skip one copy — deduplicate to canonical single sections"
tags: [intelligence, best-practice, agent-config, prompt-engineering]
---

# Consolidate Duplicate Startup Reads + Session-End Sections in SOUL.md

Two identical sections in an agent configuration file (SOUL.md, CLAUDE.md, or similar prompt documents) cause agents to silently skip one copy. This was discovered in the [[Auto Delegator Layer]] project when duplicate "Startup Reads" (lines 135–138) and "Session-End" sections existed in the same SOUL.md file.

## The Problem

When an LLM-based agent encounters duplicate top-level sections with the same heading or near-identical content, its behavior becomes unpredictable:

1. **Silent skipping**: The agent may process only the first occurrence and ignore the second, or vice versa. There is no error, no warning — the instructions in the skipped section simply never take effect.
2. **Conflicting precedence**: If the two copies have drifted apart (one was edited, the other wasn't), the agent may follow whichever it encounters first in its context window, leading to inconsistent behavior across sessions.
3. **Token waste**: Duplicate sections consume context window budget without adding information. In systems where [[claudemd-file-bloat-is-the-dominant-token-driver-9|CLAUDE.md bloat is the dominant token driver]], every duplicated line compounds the cost.

## Why This Happens

Agent configuration files like SOUL.md grow organically. Common causes of duplication:

- **Copy-paste during refactoring**: A section is moved but the original isn't deleted.
- **Multiple contributors**: Two people add the same protocol independently without checking for existing coverage.
- **Template inheritance**: A base template includes a section, and a derived config adds the same section again.
- **Automated appending**: Scripts or agents that append new sections without checking if the content already exists.

## The Fix

### Immediate Action
1. **Audit the file** for duplicate headings: search for repeated `##` or `###` level headings.
2. **Diff the duplicates**: If both copies are identical, delete one. If they've diverged, merge the unique content into a single canonical section.
3. **Verify section ordering**: Ensure the surviving section is in the correct position relative to other sections (e.g., "Startup Reads" at the top, "Session-End" at the bottom).

### Prevention
- **Linting**: Add a pre-commit check or CI step that flags duplicate headings in prompt configuration files.
- **Section anchors**: Use unique, descriptive headings rather than generic ones. `## Session-End: Persist & Report` is harder to accidentally duplicate than `## Session End`.
- **Single-source sections**: For content shared across multiple agent configs, reference it via imports or includes rather than copying it inline. See [[claudemd-file-bloat-is-the-dominant-token-driver-9|modular @imports pattern]] for reducing duplication at scale.

## Impact

- **Severity**: Medium (3/5). The agent doesn't crash — it just silently ignores instructions, which can be harder to debug than an outright failure.
- **Detection difficulty**: High. Since the agent doesn't report that it skipped a section, the only symptom is that certain behaviors (startup reads, session-end persistence) intermittently fail to execute.
- **Blast radius**: Affects every session that loads the misconfigured file.

## Related Patterns

This is an instance of a broader class of prompt-engineering defects: **silent instruction loss**. Other examples include:

- Instructions buried past the context window limit
- Contradictory instructions that cancel each other out
- Instructions in low-attention zones (middle of very long documents)

See also: [[add-explicit-failed-task-protocol-to-soulmd--a-pro|Failed Task Protocol in SOUL.md]] for another SOUL.md configuration improvement.

## Source Context

- **Original source**: Extracted from agent result `task-c8542e6a.txt`
- **Applied**: 2026-03-20T18:43:33Z
- **Project**: Auto Delegator Layer
- **Category**: best-practice

---
Tags: #intelligence #best-practice #auto-applied #prompt-engineering
