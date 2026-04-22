---
title: obsidian-claude-pkm
type: reference
status: active
created: 2026-03-11
updated: 2026-04-06
source: prior local note + Obsidian integration cross-reference + partial external verification
confidence: 0.75
tags: [obsidian, claude-code, pkm, goals, productivity, starter-kit]
summary: Vault template / starter-kit pattern for combining Obsidian and Claude Code around goal cascading, structured reviews, and personal knowledge workflows. Strategically interesting as an opinionated PKM operating system, but locally it remains not-yet-fully-verified rather than actively installed.
related:
  - [[Obsidian Integration MOC]]
  - [[System Obsidian]]
  - [[Obsidian CLI]]
---

# obsidian-claude-pkm

> A pre-structured Obsidian + Claude Code workflow kit focused on goal cascading, review rituals, and turning a vault into a practical personal operating system.

This note is about the **pattern and fit** of `obsidian-claude-pkm`, not just the repo's marketing bullets.

---

## Executive Summary

`obsidian-claude-pkm` is best understood as an **opinionated starter kit** for running personal knowledge management with Claude Code inside an Obsidian vault.

Its core promise is simple:

- define goals at multiple time horizons,
- connect those goals to projects and reviews,
- and let Claude-driven workflows keep the system alive instead of letting it decay into abandoned markdown.

That makes it interesting for Trajan not because it is “the best PKM system” in the abstract, but because it sits at the intersection of:
- Obsidian as durable memory
- Claude Code as active reasoning/workflow engine
- structured review loops
- goal/project alignment

In other words, it is a **vault operating model**, not just a plugin.

---

## What It Appears to Be

From the existing local note and surrounding integration docs, `obsidian-claude-pkm` is a repository/template that provides:
- a goal-cascade structure across different planning horizons
- a set of Claude skills/commands for daily, weekly, monthly, and project review flows
- helper conventions for vault operations
- a vault adaptation/onboarding path
- some agent-like helper roles oriented around review, organization, and alignment

This places it closer to:
- a **starter kit / methodology bundle**

than to:
- a pure Obsidian plugin,
- a simple Claude Code extension,
- or a generic note template pack.

---

## Core Idea: Goal Cascading

The most important idea in the package is not any one command. It is the **cascade architecture**.

### Typical intended shape

```text
Long horizon goals
  → yearly goals
  → projects
  → monthly goals
  → weekly review
  → daily execution
```

That matters because a lot of PKM systems fail in one of two ways:
- they become pure storage with no action layer, or
- they become a to-do list with no strategic layer

A goal-cascade system tries to connect the two.

### Why this is useful
It helps answer:
- what is today's work for?
- which projects serve actual goals?
- when is drift happening?
- what should get reviewed instead of merely accumulated?

This is one of the strongest reasons to care about the package at all.

---

## Why It Is Interesting in the Obsidian + Claude Context

`obsidian-claude-pkm` only really makes sense because Claude Code changes the economics of maintaining a structured vault.

Without AI/automation, a system like this can be burdensome:
- too many rituals
- too many templates
- too much manual linking and upkeep

With Claude involved, the burden shifts:
- daily and weekly reviews can be scaffolded
- project note creation can be standardized
- goal alignment can be inspected automatically
- note hygiene can be partially automated
- recurring prompts and review modes become reusable commands/skills

That is the key unlock:

> Claude turns a rigid PKM framework from “more maintenance” into “more leverage,” at least if the workflows are designed well.

---

## Likely Components / Workflow Shape

Based on the prior note and surrounding context, the package appears to revolve around several pieces.

## 1. Time-horizon documents
Examples likely include:
- long-term goals / vision
- annual goals
- monthly goals
- weekly review
- daily notes / daily focus

## 2. Project-linked review workflows
A project is not just a folder. It becomes part of the planning cascade.

That means reviews can ask:
- which projects support active goals?
- which projects are stale?
- what is the current “one big thing”?

## 3. Claude-invocable commands / skills
The existing note describes commands like:
- daily
- weekly
- monthly
- project
- review
- onboard
- adopt
- upgrade

Whether or not every exact command survives version drift, the shape is clear:

> the package tries to convert recurring PKM rituals into explicit Claude workflows.

## 4. Vault operations and hygiene
The existing note also points to note organization, broken-link cleanup, and general maintenance support.

That is important because any ambitious PKM framework collapses if the hygiene cost stays manual.

---

## Where It Fits in This Local Stack

This note is most useful when read against the current local Obsidian state.

From [[System Obsidian]]:
- local verified plugins are currently **Claudian** and **claude-code-mcp**
- `obsidian-claude-pkm` is listed under **Not Yet Fully Verified**

That distinction matters.

### Current local status
The right wording for this environment is:
- **strategically interesting and documented**
- **not currently treated as fully installed/verified local infrastructure**

So this note should not imply:
- “this is already live here”

Instead it should imply:
- “this is a strong candidate pattern / package for goal-centric PKM workflows, but local verification remains pending.”

---

## Relationship to Other Obsidian Integration Pieces

`obsidian-claude-pkm` is only one layer in a larger integration stack.

### Compared with `claude-code-mcp`
- MCP bridge = structured vault access protocol
- `obsidian-claude-pkm` = workflow/methodology layer on top of the vault

### Compared with Claudian
- Claudian = in-app Claude interface inside Obsidian
- `obsidian-claude-pkm` = operational structure for what Claude should do with the vault

### Compared with Obsidian CLI
- Obsidian CLI = app-native command surface
- `obsidian-claude-pkm` = behavioral/organizational scaffolding

### Compared with QMD / retrieval
- QMD = retrieval/index/search layer
- `obsidian-claude-pkm` = intentional note/workflow architecture to retrieve from

This makes `obsidian-claude-pkm` a **higher-level operating model**, not a transport or search mechanism.

---

## Strengths of the Pattern

## 1. It turns PKM into a workflow system
A lot of vaults store ideas but do not drive action. This pattern tries to connect notes to decisions and execution.

## 2. It gives Claude structured rituals to help with
Daily/weekly/monthly review is a natural fit for AI assistance because:
- the format repeats
- the synthesis is useful
- the agent can compare across time horizons

## 3. It makes drift visible
Goal-cascade systems can surface:
- projects that do not map to current goals
- tasks that have no strategic connection
- reviews that are overdue
- plans that are never grounded in execution

## 4. It is compatible with markdown-native vaults
Because it appears to be vault/template/skill oriented rather than database-locked, it fits the broader principle of keeping knowledge human-readable.

---

## Risks / Caveats

## 1. Ritual overload
A system with daily/weekly/monthly/project reviews can become performative if the review burden is too high.

### Failure mode
The user spends more time maintaining the framework than benefiting from it.

## 2. Over-opinionated structure
A strong starter kit is helpful for bootstrapping, but can become constraining if it assumes too much about how someone thinks or organizes work.

### Failure mode
The vault starts serving the framework instead of the person.

## 3. AI-maintained structure can mask poor fit
Claude can keep a brittle system limping along for a while, which may hide the fact that the underlying framework is not actually well-matched.

### Failure mode
High apparent polish, low real usefulness.

## 4. Local verification gap
In this environment, the package is not yet documented as fully installed/verified.

### Failure mode
The note sounds operational when it is really evaluative/planning-oriented.

That is why status clarity matters.

---

## Best Use Cases

`obsidian-claude-pkm` is most compelling for people who want:
- a goal-driven personal operating system inside Obsidian
- recurring review rituals scaffolded by Claude
- projects tied to time horizons and planning layers
- a structured starter kit rather than designing everything from scratch

It is less compelling if someone wants:
- a very lightweight vault
- pure Zettelkasten / evergreen-note style with minimal planning ritual
- mostly passive storage rather than active planning/execution loops

---

## Recommended Interpretation for Trajan

Given Trajan's apparent preferences, the interesting part of `obsidian-claude-pkm` is probably not the full ritual system as-is. The interesting part is the **pattern library** it represents.

### High-value pieces to borrow
- time-horizon goal cascade
- structured review prompts
- project-to-goal linkage
- vault adoption/onboarding flow
- note hygiene helpers

### Things to evaluate skeptically
- how much ceremony it adds
- whether the command set matches actual work style
- whether the folder/file assumptions fit the current vault
- whether the package wants to become the center of the vault instead of integrating with it

### Likely best path
Treat it as:
- a **pattern source and candidate integration layer**

not as:
- an automatic “install this whole thing unchanged” decision

---

## Verification / Status Notes

### Locally verified
- the broader Obsidian + Claude integration stack is real and documented
- `obsidian-claude-pkm` is explicitly listed in local docs as **not yet fully verified**
- the previous local note documents the package shape and intended role

### Not fully verified in this environment today
- current upstream repo details beyond the prior note snapshot
- exact current command/agent inventory from upstream
- whether the package is installed and functioning locally right now

That means the safest classification is:
- **documented, strategically relevant, but locally pending verification**

---

## Bottom Line

`obsidian-claude-pkm` is best thought of as an **opinionated PKM operating system for Obsidian + Claude Code**.

Its main value is not any single plugin-style feature. It is the way it tries to connect:
- long-term goals,
- projects,
- reviews,
- daily work,
- and Claude-assisted vault upkeep

into one coherent workflow.

For this stack, it matters because it shows one possible answer to the question:

> “What should a Claude-native Obsidian workflow actually look like if it is supposed to drive action, not just store notes?”

That makes it worth tracking — but still with a clear eye on ceremony, fit, and the fact that local installation/verification is not yet complete.

---

## See Also

- [[Obsidian Integration MOC]]
- [[System Obsidian]]
- [[Obsidian CLI]]
- [[Claudian]]
- [[obsidian-claude-code-mcp]]

#obsidian #pkm #goals #starter-kit #claude-code
