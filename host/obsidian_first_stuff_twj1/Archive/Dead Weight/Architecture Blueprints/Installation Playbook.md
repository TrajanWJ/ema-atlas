# Installation Playbook

> Step-by-step setup for my chosen AI stack.
> Decided: 2026-03-11 | See [[My Stack Decisions]] for rationale
> Last verified: 2026-03-11

---

## Port Map

| Service | Port | Protocol | Status |
|---|---|---|---|
| CloudCLI (existing) | 3001 | HTTP | Active |
| obsidian-claude-code-mcp | 22360 | WebSocket + SSE | Active |
| Agentlytics (future) | 4637 | HTTP | Planned |

---

## Step 1: Obsidian CLI

```bash
# Obsidian → Settings → General → Command line interface → Register CLI → ON
sudo ln -s /opt/obsidian/obsidian /usr/local/bin/obsidian
```

Test: `obsidian files` (Obsidian must be running)

> **Troubleshooting:** If `obsidian` command not found, check that Obsidian is installed via Flatpak/AppImage/deb and adjust the symlink path. The CLI requires Obsidian to be running (IPC-based).

- [ ] Done

---

## Step 2: kepano/obsidian-skills (Format Awareness)

In Claude Code CLI:
```
/plugin marketplace add kepano/obsidian-skills
/plugin install obsidian@obsidian-skills
```

Or manual: clone to vault's `.claude/skills/`

> **Verified:** Skills installed at `~/.claude/skills/` — defuddle, json-canvas, obsidian-bases, obsidian-cli, obsidian-markdown

- [x] Done

---

## Step 3: Claudian (Claude Code Inside Obsidian)

1. Install BRAT: Obsidian → Settings → Community Plugins → Browse → BRAT
2. In BRAT settings, add beta plugin: `YishenTu/claudian`
3. Enable "Claudian" in Community Plugins
4. Configure: Security mode → Safe (start safe, switch to YOLO when comfortable)

> **Verified:** Claudian v1.3.68 installed at `.obsidian/plugins/claudian/`
> **Troubleshooting:** If sidebar doesn't appear, try Ctrl+P → "Claudian: Open". If Claude Code binary not found, set the path in Claudian settings.

- [x] Done

---

## Step 4: obsidian-claude-code-mcp (MCP Bridge)

1. Obsidian → Settings → Community Plugins → Browse → "Claude Code"
2. Install and enable
3. Claude Code auto-discovers via WebSocket on port 22360

Test: In Claude Code CLI, run `/ide` and select "Obsidian"

> **Verified:** v1.1.8 installed at `.obsidian/plugins/claude-code-mcp/`
> **Troubleshooting:** If Claude Code can't find the MCP server, ensure Obsidian is running and the plugin is enabled. Check that port 22360 isn't blocked by firewall. The plugin uses auto-discovery — no manual MCP config needed.

- [x] Done

---

## Step 5: QMD (Semantic Search)

```bash
npm install -g @tobilu/qmd
qmd collection add ~/Documents/obsidian_first_stuff/twj1 --name vault
qmd embed
```

Add to Claude Code MCP:
```bash
claude mcp add qmd -- qmd mcp
```

Or via plugin:
```
/plugin marketplace add tobi/qmd
/plugin install qmd@qmd
```

> **Verified:** QMD v2.0.1 installed via npm, vault indexed, MCP configured, cron every 30min
> **Troubleshooting:** If `qmd` command not found after install, check NVM path — the binary is at `~/.nvm/versions/node/v22.22.1/lib/node_modules/@tobilu/qmd/bin/qmd`. Run `nvm use 22` or add to PATH. If embeddings fail, check available disk space (vector DB can be ~100MB for large vaults).

- [x] Done

---

## Step 6: claude-mem (Persistent Memory)

In Claude Code CLI:
```
/plugin install claude-mem
```

Auto-configures hooks, starts worker daemon. Settings at `~/.claude-mem/settings.json`.

> **Troubleshooting:** Verify daemon is running with `pgrep -f claude-mem`. If it's not starting, check `~/.claude-mem/` for error logs. The worker must be running for memory persistence to work.

- [ ] Done

---

## Step 7: sync-claude-sessions (Session Export → QMD)

```
/plugin marketplace add ArtemXTech/personal-os-skills
```

Point output directory at vault folder. Sessions become vault notes searchable via QMD.

> **Troubleshooting:** Ensure the output directory points to your vault's `Session Log/` folder. QMD will index new files on next cron cycle (30min) or run `qmd embed` manually.

- [ ] Done

---

## Step 8: obsidian-claude-pkm (Goal Cascading)

```bash
git clone https://github.com/ballred/obsidian-claude-pkm.git
cd obsidian-claude-pkm
chmod +x scripts/setup.sh && ./scripts/setup.sh
```

For existing vaults: run `/adopt` in Claude Code to scan and adapt.

Gives you: `/daily`, `/weekly`, `/monthly`, `/project`, `/review` slash commands + 4 specialized agents (goal-aligner, weekly-reviewer, inbox-processor, note-organizer).

> **Troubleshooting:** The `/adopt` command is critical for existing vaults — it scans your vault structure and creates the necessary configuration. If setup.sh fails, check Node.js version (requires 18+).

- [ ] Done

---

## Step 9: everything-claude-code (65+ Skills)

```bash
git clone https://github.com/affaan-m/everything-claude-code.git
cd everything-claude-code
./install.sh typescript
```

Adds 65+ skills, 13 agents, 40+ slash commands. Complements Superpowers.

> **Troubleshooting:** If `install.sh` fails, try running with `bash install.sh typescript`. Check that `~/.claude/skills/` directory exists. Skills may conflict with Superpowers — if you see duplicate slash commands, check skill priority.

- [ ] Done

---

## Step 10: Claude Task Master (MCP)

```bash
claude mcp add taskmaster-ai -- npx -y task-master-ai
```

> **Troubleshooting:** Requires npx (comes with npm). If the MCP server fails to start, try `npx -y task-master-ai` standalone first to check for errors.

- [ ] Done

---

## Step 11: Dippy (Smart Auto-Approve)

Install as `PreToolUse` hook. See [ldayton/Dippy](https://github.com/ldayton/Dippy).

Eliminates permission fatigue — auto-approves safe read-only commands, blocks destructive ones. AST-based parsing understands shell syntax properly.

> **Troubleshooting:** Hooks go in `~/.claude/hooks/`. If Dippy blocks commands you want to allow, check its configuration for allowlist/blocklist rules. Test with `--dry-run` first.

- [ ] Done

---

## Step 12: Lasso claude-hooks (Prompt Injection Defense)

```bash
git clone https://github.com/lasso-security/claude-hooks
cd claude-hooks
# Run installer
```

Scans tool outputs for 50+ injection patterns. Warns Claude instead of blocking (better accuracy).

> **Troubleshooting:** This hook runs on tool outputs (PostToolUse), so it won't slow down initial commands. If false positives occur, review the pattern list in the hooks config.

- [ ] Done

---

## Step 13: .claudeignore (Instant Token Savings)

Create `.claudeignore` at each project root:

```
.next/
node_modules/
dist/
build/
*.min.js
*.map
*.lock
coverage/
.git/
```

30-40% context savings. Zero tradeoffs.

- [ ] Done

---

## Step 14: CLAUDE.md Optimization

- Cut global `~/.claude/CLAUDE.md` to under 60 lines
- Structure: WHAT (stack) / WHY (purpose) / HOW (rules)
- Reference [Trail of Bits config](https://github.com/trailofbits/claude-code-config) for baseline
- See [[Claude Code Configuration]] for full guide

- [ ] Done

---

## Step 15: Sandbox (Linux)

```bash
sudo apt install bubblewrap socat
# Then in Claude Code:
/sandbox
```

> **Troubleshooting:** If bubblewrap fails to install, check that your kernel supports user namespaces (`sysctl kernel.unprivileged_userns_clone`). On Ubuntu 24.04+, this should work out of the box.

- [ ] Done

---

## Overall Progress

**Installed (5/15):**
- [x] kepano/obsidian-skills
- [x] Claudian v1.3.68
- [x] obsidian-claude-code-mcp v1.1.8
- [x] QMD v2.0.1
- [x] Superpowers v5.0.1, Context7, Frontend Dev/Design, CodeGraphContext (pre-existing)

**Not yet installed (10/15):**
- [ ] Obsidian CLI registration
- [ ] claude-mem
- [ ] sync-claude-sessions
- [ ] obsidian-claude-pkm
- [ ] everything-claude-code
- [ ] Claude Task Master
- [ ] Dippy
- [ ] Lasso claude-hooks
- [ ] .claudeignore
- [ ] CLAUDE.md optimization

---

## Verification Checklist

- [ ] Obsidian CLI responds to `obsidian files`
- [x] Claudian sidebar opens in Obsidian
- [x] Claude Code CLI can read vault via MCP (`/ide` → Obsidian)
- [x] `qmd search "test query"` returns results
- [ ] `/daily` command works in Claude Code
- [ ] claude-mem worker running (`pgrep -f claude-mem`)
- [ ] CloudCLI still accessible at `:3001`

---

## MCP Servers (Final State)

```json
{
  "mcpServers": {
    "CodeGraphContext": { "...existing..." },
    "qmd": { "command": "qmd", "args": ["mcp"] },
    "taskmaster-ai": { "command": "npx", "args": ["-y", "task-master-ai"] }
  }
}
```

obsidian-claude-code-mcp auto-discovers (no config needed).

#playbook #installation #my-stack
