---
title: "Hermes Skills System"
type: reference
tags: [skills, agent-architecture, progressive-disclosure, conditional-activation]
source: https://hermes-agent.nousresearch.com/docs/user-guide/features/skills
created: "2026-03-18"
summary: "Hermes skill architecture: progressive disclosure (L0/L1/L2), conditional activation (requires/fallback_for), secure setup on load, agent-managed skills, patch action."
key_topics: [progressive-disclosure, conditional-activation, skill-format, patch-action, agent-managed]
updated: 2026-03-18
status: active
confidence: 0.80
confidence_updated: 2026-03-18
---

# Hermes Skills System

## Related
- [[Superpowers Architecture - Stolen Patterns]] — architectural patterns adopted from systems like Hermes
- [[Agent-Architecture-Synthesis-2026-03]] — synthesis of agent architectures including skills systems
- [[Multi-Agent Coordination Patterns]] — coordination patterns related to skill-based agent design

## Progressive Disclosure (3 Levels)

```
L0: skills_list() → [{name, description, category}, ...]  (~3k tokens TOTAL)
L1: skill_view(name) → Full SKILL.md content  (varies per skill)
L2: skill_view(name, path) → Specific reference file  (varies)
```

Agent only loads full skill when it actually needs it. Our implementation: `skills-l0.sh`.

## SKILL.md Format (Hermes Standard)

```yaml
---
name: my-skill
description: Brief description of what this skill does
version: 1.0.0
platforms: [macos, linux]  # Optional — restrict OS
metadata:
  hermes:
    tags: [python, automation]
    category: devops
    fallback_for_toolsets: [web]    # Show ONLY when web toolset UNAVAILABLE
    requires_toolsets: [terminal]   # Show ONLY when terminal toolset AVAILABLE
    fallback_for_tools: [web_search] # Show ONLY when this specific tool UNAVAILABLE
    requires_tools: [terminal]       # Show ONLY when this tool AVAILABLE
---
```

## Conditional Activation

| Field | Behavior |
|---|---|
| `fallback_for_toolsets` | Hidden when toolset available, shown when missing |
| `requires_toolsets` | Hidden when toolset unavailable, shown when present |
| `fallback_for_tools` | Same but per individual tool |
| `requires_tools` | Same but per individual tool |

**Pattern:** duckduckgo-search skill uses `fallback_for_toolsets: [web]`. When FIRECRAWL key exists → hidden. When missing → appears automatically.

## Secure Setup on Load

Skills can declare required env vars without disappearing from discovery:

```yaml
required_environment_variables:
  - name: TENOR_API_KEY
    prompt: Tenor API key
    help: Get a key from https://developers.google.com/tenor
    required_for: full functionality
```

Missing vars are requested on first use (CLI only — messaging surfaces never ask for secrets in chat).

## Agent-Managed Skills (skill_manage tool)

The agent creates/patches/deletes its own skills when it discovers non-trivial workflows.

**When the agent creates a skill:**
- After completing a complex task (5+ tool calls)
- When it hit errors and found the working path
- When user corrected its approach
- When it discovered a non-trivial workflow

**Actions:**
| Action | Use for |
|---|---|
| `create` | New skill from scratch |
| `patch` | Targeted fix (PREFERRED — most token-efficient) |
| `edit` | Major structural rewrite |
| `delete` | Remove entirely |
| `write_file` | Add supporting file to skill dir |

**patch is preferred** — only the changed text appears in the tool call.

## Skill Directory Structure

```
~/.hermes/skills/           # Single source of truth
├── mlops/
│   └── axolotl/
│       ├── SKILL.md        # Required
│       ├── references/     # Additional docs
│       ├── templates/      # Output formats
│       ├── scripts/        # Helper scripts
│       └── assets/
├── devops/
│   └── deploy-k8s/         # Agent-created skill
├── .hub/                   # Skills Hub state
│   ├── lock.json
│   ├── quarantine/
│   └── audit.log
└── .bundled_manifest
```

## Our Implementation

- Skills dir: `/home/trajan/skills/`
- L0 listing: `skills-l0.sh`
- Surgical patches: `skill-patch.sh <name> <old> <new>`
- New skills created by agents after complex tasks
