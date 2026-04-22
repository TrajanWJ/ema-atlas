---
title: "Prompt Engineering Findings"
type: reference
created: 2026-04-06
tags: [research, prompt-engineering, patterns]
summary: "Prompt engineering patterns from CC analysis, Lyra, Karpathy, and others"
---

# Prompt Engineering Findings

## Core Patterns (from Claude Code prompt analysis)

- **Modular XML sections** for behavior control
- **Hide tool complexity**: "I will edit" not "I need to use edit_file tool"
- **Minimal formatting philosophy**: less chrome, more signal
- **Read-before-edit pattern**: always read context before modifying
- **Bounded error correction**: max 3 attempts, then escalate
- **Citation-first design** for research tasks

## Superpowers Pattern

- SessionStart hook + meta-skill routing table + aggressive compliance
- Route user intent to specialized skill before generating generic response

## Named Frameworks

| Framework | Structure |
|---|---|
| **Lyra 4-D** | Context/Role, Task/Requirements, Output/Constraints, Quality/Success |
| **TCRTE** | Role-Context-TaREDACTED_TOKEN-Output |
| **Karpathy Autoresearch** | 3-stage cheap-to-expensive pipeline |
| **SciTeX** | Scientific method for agents -- evidence chains |
| **Discipline Engineering v2.3.0** | Five-layer proof-based orchestration |
