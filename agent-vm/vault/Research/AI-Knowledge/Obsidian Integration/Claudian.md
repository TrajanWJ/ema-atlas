# Claudian

> Claude Code embedded directly inside Obsidian as a sidebar chat.

## Quick Info

| Field | Value |
|---|---|
| **GitHub** | [YishenTu/claudian](https://github.com/YishenTu/claudian) |
| **Stars** | 3,660+ |
| **Version** | 1.3.68 (Mar 2026) — **==INSTALLED==** (verified 2026-04-13 via [[My Stack Decisions]]) |
| **License** | MIT |
| **Requires** | Obsidian v1.8.9+, Claude Code CLI, Claude subscription or API key |

## Features

- Full agentic capabilities scoped to your vault (read, write, edit, bash, search)
- **Context-aware** — auto-attaches focused note, @-mention files, highlight selections
- **Vision support** — drag-and-drop/paste images for analysis
- **Inline edit** with word-level diff preview
- **Slash commands** with argument placeholders and inline bash substitution
- **Instruction mode** (`#` prefix) for custom system prompt refinement
- **Skills system** — compatible with Claude Code format
- **MCP server support** — connect external tools via stdio/SSE/HTTP
- **Claude Code plugin integration** — automatic discovery from `~/.claude/plugins`
- **Plan mode** (Shift+Tab) — explore solutions before implementing
- **Rewind/Fork** — rewind to any conversation point with file checkpointing; fork into branches
- **Custom Agents** — define `agent.md` files in `~/.claude/agents/` or `{vault}/.claude/agents/`
- **Chrome Integration** — via `claude-in-chrome` extension
- **10-language i18n** support
- **Vim-style key bindings** configurable
- **Multiple model selection** — Haiku, Sonnet, Opus with 1M context window support
- **Custom model providers** — OpenRouter, DeepSeek, Kimi, GLM, etc.

## Install

### Via BRAT (recommended, auto-updating)
1. Install BRAT plugin in Obsidian
2. In BRAT settings, add beta plugin: `YishenTu/claudian`
3. Enable "Claudian" in Community Plugins

### From GitHub Release
1. Download `main.js`, `manifest.json`, `styles.css` from [latest release](https://github.com/YishenTu/claudian/releases/latest)
2. Create `/path/to/vault/.obsidian/plugins/claudian/`
3. Copy files; enable in Obsidian Settings

### From Source
```bash
cd /path/to/vault/.obsidian/plugins
git clone https://github.com/YishenTu/claudian.git
cd claudian && npm install && npm run build
```

## Security Modes

| Mode | Behavior |
|---|---|
| **YOLO** (default) | All tool calls auto-execute, no approval prompts |
| **Safe** | Every tool call requires explicit approval; bash requires exact match |
| **Plan** | Claude designs first, presents plan, implements after approval (Shift+Tab) |

Additional safeguards: command blocklist (on by default, regex/platform-specific patterns), vault confinement with symlink-safe checks, export path whitelisting (`~/Desktop`, `~/Downloads`).

## Configuration

| Category | Options |
|---|---|
| **Personalization** | User name, excluded tags, media folder, custom system prompt |
| **Safety** | Command blocklist, export path whitelist, user Claude settings |
| **Advanced** | Custom model config via env vars, thinking budget, CLI path, env variable snippets |
| **MCP & Plugins** | Server config with context-saving mode, per-vault plugin enable/disable |

## Privacy

- **API transmission:** user input, attached files, images, tool outputs sent to configured provider
- **Local storage:** settings in `vault/.claude/`; sessions in `~/.claude/projects/`
- **No telemetry:** no tracking beyond your API provider

## Known Issues (Mar 2026)

- **"Claude CLI not found"** — Node version managers (nvm, fnm, volta) interfere with auto-detection. Fix: manually set CLI path in Settings > Advanced
- **Platform-specific CLI paths:**
  - macOS/Linux: `/Users/you/.volta/bin/claude`
  - Windows: `C:\Users\you\AppData\Local\Claude\claude.exe`
  - npm-global: `{npm-root}\@anthropic-ai\claude-code\cli.js`
- **Node.js & npm mismatch** — verify `dirname $(which claude)` vs `dirname $(which node)` match
- **41 open issues** — active development with rough edges

## See Also

- [[obsidian-claude-code-mcp]] — complementary MCP bridge
- [[Claudesidian MCP (Nexus)]] — semantic search alternative
- [[Agent Client]] — multi-agent alternative
- [[obsidian-skills (kepano)]] — teach Claude proper Obsidian formats
- [[Obsidian-Claude Connectivity]] — central integration reference

#obsidian #claude-code #sidebar #agentic
