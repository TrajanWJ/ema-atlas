# obsidian-claude-pkm

> Complete starter kit for Obsidian + Claude Code personal knowledge management with goal cascading.

## Quick Info

| Field | Value |
|---|---|
| **GitHub** | [ballred/obsidian-claude-pkm](https://github.com/ballred/obsidian-claude-pkm) |
| **Stars** | 1,170+ |
| **Version** | 3.1 |
| **License** | MIT |
| **Dependencies** | Zero |

## The Cascade Architecture

```
3-Year Vision → Yearly Goals → Projects → Monthly Goals → Weekly Review → Daily Tasks
```

Each layer connects; nothing falls through. `/daily` surfaces your ONE Big Thing from weekly review.

| Layer | File | Command |
|---|---|---|
| Vision | `Goals/0. Three Year Goals.md` | `/goal-tracking` |
| Annual | `Goals/1. Yearly Goals.md` | `/goal-tracking` |
| Projects | `Projects/*/CLAUDE.md` | `/project` |
| Monthly | `Goals/2. Monthly Goals.md` | `/monthly` |
| Weekly | `Goals/3. Weekly Review.md` | `/weekly` |
| Daily | `Daily Notes/YYYY-MM-DD.md` | `/daily` |

## 10 User Skills + 2 Auto Skills

| Skill | Type | Purpose |
|---|---|---|
| `/daily` | User-invocable | Morning planning, midday check-in, evening reflection |
| `/weekly` | User-invocable | 30-min structured review (Collect/Reflect/Plan) |
| `/monthly` | User-invocable | Monthly review + quarterly milestone check |
| `/project` | User-invocable | Create/track/archive goal-linked projects |
| `/review` | User-invocable | Smart router (auto-detects appropriate review type based on timing) |
| `/push` | User-invocable | Git commit + push |
| `/onboard` | User-invocable | First-run personalized setup |
| `/adopt` | User-invocable | Adapt to existing vault (auto-detects PARA, Zettelkasten, LYT) |
| `/upgrade` | User-invocable | Version updates preserving content (timestamped backups) |
| `/output-style coach` | User-invocable | Transforms Claude into accountability partner mode |
| `goal-tracking` | Auto | Cascade tracking |
| `obsidian-vault-ops` | Auto | Vault read/write operations |

## 4 Specialized Agents

| Agent | Purpose |
|---|---|
| **goal-aligner** | Audits daily activity vs stated objectives, flags misalignment |
| **weekly-reviewer** | 3-phase structured reflection with project rollup; learns reflection preferences |
| **inbox-processor** | GTD-style inbox categorization (2-minute rule) |
| **note-organizer** | Fixes broken links, consolidates duplicates, maintains hygiene |

All agents use `memory: project` for cross-session behavioral learning.
Access: `claude "Use the [agent-name] agent to..."`

## Hooks

| Hook | What It Does |
|---|---|
| `SessionStart` | Surfaces ONE Big Thing, counts active projects, warns if review overdue |
| `UserPromptSubmit` | Auto-lists skills when user mentions "help" or "skill" |
| `PostToolUse` | Auto-commits on Write/Edit (if `GIT_AUTO_COMMIT=true`) |

## Install

### New Vault
```bash
git clone https://github.com/ballred/obsidian-claude-pkm.git
cd obsidian-claude-pkm
chmod +x scripts/setup.sh && ./scripts/setup.sh
cd ~/your-vault-location && claude
# Then run: /onboard
```

### Windows
```bash
git clone https://github.com/ballred/obsidian-claude-pkm.git
cd obsidian-claude-pkm
scripts\setup.bat
```

### Existing Vault
```bash
cd ~/your-existing-vault && claude
# Then run: /adopt
```

`/adopt` detects your organization method (PARA, Zettelkasten, LYT, custom) and maps folders interactively without disrupting structure.

## Gotchas

- **9 open issues** as of Mar 2026
- Agent memory persists across sessions — agents learn your patterns over time
- `/upgrade` creates timestamped backups; never touches content folders
- Vault-agnostic adoption works with any organizational structure

Source: [README](https://github.com/ballred/obsidian-claude-pkm)

## See Also

- [[Obsidian-Claude Connectivity]] — central integration reference
- [[Claudian]] — sidebar Claude for direct vault interaction
- [[obsidian-skills (kepano)]] — format awareness skills

#obsidian #pkm #goals #productivity #starter-kit
