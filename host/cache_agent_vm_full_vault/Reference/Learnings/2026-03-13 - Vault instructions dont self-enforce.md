---
date: 2026-03-13
tags: [gotcha, claude-code, vault]
status: active
---

# CLAUDE.md Instructions Don't Self-Enforce

## Context
Setting up an Obsidian vault as Claude Code's "working memory" with comprehensive CLAUDE.md instructions.

## Problem
After 2 days of use, none of the "mandatory" behaviors in CLAUDE.md were happening:
- No session logs written (1 out of many sessions)
- No gotchas captured (section completely empty)
- No agent dispatches firing (code-reviewer, debugger, etc.)
- No project notes updated during coding sessions

## Root Cause
CLAUDE.md instructions are soft — they're text that Claude is told to follow, not programmatic enforcement. Under context pressure (long sessions, complex tasks), instruction-following degrades. "MANDATORY" in a markdown file means nothing when the model is focused on debugging a React component.

Additionally: when coding happens in project directories (`~/Desktop/Coding/Projects/...`), Claude isn't running from the vault. The vault CLAUDE.md doesn't even load.

## Fix
1. Remove aspirational "forced dispatch" instructions — they create false confidence
2. Keep instructions realistic and few
3. Build habits (like `/push` at end of day) rather than relying on AI compliance
4. Accept that session logging requires conscious effort, not automation

## Lesson
**Don't over-engineer AI instruction files.** A simple CLAUDE.md that gets followed 80% of the time beats a comprehensive one that gets followed 10% of the time. Less is more.

#gotcha #claude-code #meta
