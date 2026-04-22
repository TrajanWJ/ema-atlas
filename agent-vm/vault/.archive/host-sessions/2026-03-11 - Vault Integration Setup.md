# Session: 2026-03-11 — Vault Integration Setup

## Status
- **Project**: Obsidian Vault Infrastructure
- **Phase**: Initial setup
- **Duration**: ~2 hours (across 2 sessions)
- **Context resets**: 1 (compaction between sessions)

## What Was Accomplished
- Installed obsidian-claude-code-mcp v1.1.8 to `.obsidian/plugins/claude-code-mcp/`
- Installed Claudian v1.3.68 to `.obsidian/plugins/claudian/`
- Installed QMD v2.0.1 globally (`npm install -g @tobilu/qmd`)
- Indexed vault as QMD collection (72 files, 100 chunks, 3 GGUF models ~2.1GB)
- Configured QMD as MCP server in `~/.claude/mcp.json` (daemon mode)
- Set up cron job for QMD auto-reindex every 30 minutes
- Created global `~/.claude/CLAUDE.md` with vault auto-growth instructions
- Installed QMD skill to `~/.claude/skills/qmd/`
- Updated [[My Stack Decisions]] installation checklist
- Updated [[QMD]] note with installed configuration details

## Decisions Made
| Decision | Rationale | Reversible? |
|----------|-----------|-------------|
| QMD daemon mode (`--http --daemon`) | Keeps models in VRAM for faster queries | Yes |
| Cron reindex every 30m | Balance between freshness and resource usage | Yes |
| Direct filesystem writes for vault updates | Always works, no Obsidian dependency needed | Yes |
| Global CLAUDE.md says "MUST update" not "suggest" | Passive suggestions don't trigger action | Yes |

## Key Files Modified
- `~/.claude/mcp.json` — added QMD MCP server
- `~/.claude/CLAUDE.md` — created global vault instructions
- `~/.config/qmd/index.yml` — vault collection with context descriptions
- `~/Desktop/Coding/Projects/execudeck/CLAUDE.md` — simplified vault reference
- `AI Knowledge/Claude Code Plugins/QMD.md` — updated with installed config
- `AI Knowledge/My Stack Decisions.md` — checked off installed items

## Next Session: Immediate Actions
1. Verify auto-growth works — do real coding work and check if session log gets created
2. Test QMD recall in a fresh session (`qmd query` for past context)
3. Install remaining stack items: claude-mem, sync-claude-sessions, obsidian-claude-pkm

## Learnings to Capture
- QMD needs all 3 models (~2.1GB) before full hybrid search works
- obsidian-claude-code-mcp auto-discovers on port 22360 — no manual MCP config needed for it
- Obsidian plugins need Restricted Mode disabled + manual toggle to activate

#session #infrastructure #setup
