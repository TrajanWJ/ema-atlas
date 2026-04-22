# obsidian-skills (kepano)

> Official agent skills from Obsidian's CEO — teaches Claude Code proper Obsidian formats.

## Quick Info

| Field | Value |
|---|---|
| **GitHub** | [kepano/obsidian-skills](https://github.com/kepano/obsidian-skills) |
| **Stars** | 13,400+ (as of Mar 2026) |
| **By** | Steph Ango (Obsidian CEO) |
| **License** | MIT |
| **Spec** | [Agent Skills Specification](https://agentskills.io/specification) |

## Five Skills

| Skill | File Type | What It Teaches |
|---|---|---|
| **obsidian-markdown** | `.md` | Wikilinks, embeds, callouts, YAML frontmatter, tags, highlights, LaTeX, Mermaid |
| **obsidian-bases** | `.base` | YAML database layer — filters, formulas, properties, summaries, views |
| **json-canvas** | `.canvas` | JSON Canvas 1.0 — nodes, edges, groups, 16-char hex IDs, pixel layout |
| **obsidian-cli** | N/A | 100+ CLI commands — search, properties, tags, tasks, `obsidian eval` |
| **defuddle** | N/A | Clean markdown extraction from web pages via `defuddle parse <url> --md` |

## Key Conventions Enforced

- **Wikilinks over markdown links** — `[[Note]]` for internal, `[text](url)` for external only
- **Embed syntax** — `![[Note]]` with sizing for images, PDFs, audio, video
- **Callout blocks** — `> [!type]` syntax, not raw HTML
- **Bases YAML quoting** — single-quote formulas with double quotes; guard against null
- **Canvas validation** — unique 16-char hex IDs, valid edge references

## Why It Matters

Essential glue for any agent-driven Obsidian workflow. Without this, Claude generates markdown that doesn't render correctly in Obsidian. First Agent Skills implementation officially maintained by a mainstream tool.

## Install

**Marketplace (recommended):**
```
/plugin marketplace add kepano/obsidian-skills
/plugin install obsidian@obsidian-skills
```

**npx:** `npx skills add git@github.com:kepano/obsidian-skills.git`

**Manual by platform:**

| Platform | Method |
|---|---|
| **Claude Code** | Copy repo contents into `/.claude` at vault root |
| **Codex CLI** | Copy `skills/` directory to `~/.codex/skills` |
| **OpenCode** | Clone entire repo to `~/.opencode/skills/obsidian-skills/` (must keep full structure; restart after) |

Works with Claude Code, Codex CLI, OpenCode, and any skills-compatible agent.

## Creating Custom Skills

Follow the same pattern:
```
skills/my-skill/
  SKILL.md          # Required: YAML frontmatter + instructions
  scripts/          # Optional: runnable scripts
  references/       # Optional: detailed docs (loaded on demand)
```

Rules: `name` max 64 chars (lowercase, hyphens), `description` max 1024 chars, `SKILL.md` under 500 lines.

Source: [README](https://github.com/kepano/obsidian-skills)

## See Also

- [[Obsidian CLI]] — the CLI that the `obsidian-cli` skill teaches
- [[Claudian]] — runs skills inside Obsidian sidebar
- [[Obsidian-Claude Connectivity]] — central integration reference

#obsidian #skills #essential #formatting
