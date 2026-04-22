---
type: knowledge
domain: tooling
tags:
  - claude-code
  - design
  - ui-ux
  - mcp
  - skills
confidence: 0.8
source: session
summary: >-
  Three-tool design stack for Claude Code: UI UX Pro Max skill, 21st.dev Magic
  MCP, Google Stitch
aliases:
  - design stack
  - ui ux pro max
  - 21st dev
  - google stitch
created: '2026-03-19'
updated: '2026-03-19'
title: Claude Code Design Stack
status: active
wiki_id: reference/tools/Claude_Code_Design_Stack
imported_from: vault/Tools/Claude Code Design Stack.md
imported_at: '2026-04-04T00:23:57.281Z'
---

# Claude Code Design Stack

Three tools that stack together to dramatically improve Claude Code's UI/design output. Source: [@jensheitmann_ TikTok](https://www.tiktok.com/@jensheitmann_/video/7595780468532874527).

## 1. UI UX Pro Max (Claude Code Skill)

**What:** AI skill providing design intelligence — 67 UI styles, 161 color palettes, 57 font pairings, 161 product-type reasoning rules, 99 UX guidelines, 25 chart types across 13 tech stacks.

**Repo:** [nextlevelbuilder/ui-ux-pro-max-skill](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill)
**Site:** https://uupm.cc

**Install (Claude Code):**
```bash
# Clone into project's .claude/skills/ directory
git clone https://github.com/nextlevelbuilder/ui-ux-pro-max-skill.git /tmp/uiux
cp -r /tmp/uiux/.claude/skills/ui-ux-pro-max ~/.claude/skills/
```

Or via CLI: `npx uipro-cli`

**Key feature:** Design System Generator — describe a project ("beauty spa landing page") and it outputs a complete design system: pattern, style, colors, typography, effects, anti-patterns, and pre-delivery checklist.

**Status:** ✅ Copied to `shared/inbox-host/` for host Claude Code install.

## 2. 21st.dev Magic MCP

**What:** AI-powered UI component generation via MCP. Describe a component in natural language → get a polished, pre-built component from 21st.dev's library. Like v0 but inside your IDE.

**Repo:** [21st-dev/magic-mcp](https://github.com/21st-dev/magic-mcp)
**Site:** https://21st.dev

**Install (Claude Code):**
```bash
npx @21st-dev/cli@latest install claude --api-key <key>
```

Or manually add to `~/.claude/mcp_config.json`:
```json
{
  "mcpServers": {
    "@21st-dev/magic": {
      "command": "npx",
      "args": ["-y", "@21st-dev/magic@latest", "API_KEY=\"your-api-key\""]
    }
  }
}
```

**API key:** Get from https://21st.dev/magic/console

**Usage:** Type `/ui` + description in Claude Code chat. Example: `/ui create a modern navigation bar with responsive design`

**Status:** ⏳ Needs API key from 21st.dev — Trajan to sign up.

## 3. Google Stitch

**What:** Google Labs AI design tool. Generates UI mockups/designs from text prompts. Can be used as a design reference generator that Claude Code then implements.

**Site:** https://stitch.withgoogle.com
**Community MCP servers exist** (search "stitch mcp" on GitHub/PulseMCP)

**Workflow:** Generate a design in Stitch → feed the image to Claude Code → implement.

**Status:** ⏳ Browser-based tool, no direct install needed. Community MCP servers available for tighter integration.

## Recommended Stack Workflow

1. **Design phase:** Use Google Stitch to generate UI mockups
2. **System phase:** UI UX Pro Max generates a design system (colors, fonts, patterns)
3. **Build phase:** 21st.dev Magic MCP provides pre-built components matching the design
4. **Result:** Professional, polished UI without manual design work

## Related

- [[Claude Code]]
- [[Agent Architecture]]
