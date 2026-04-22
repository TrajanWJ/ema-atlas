---
id: "3b7e0ccc-6830-4e17-8c1e-edc8679821f4"
title: ""
space: wiki
tags: []
source: manual
---

---
title: Desktop AI OS Patterns
tags: [research, desktop, tauri, ambient, always-on]
source: session-2026-04-07
---

# Desktop AI OS — 22 Tools Analyzed

## 2026 Convergent Pattern
Tray-based always-on → local context capture → floating windows → MCP extensibility → privacy-first

## Competitors
- **HAL-OS** — Claude Code OS with persistent memory
- **Screenpipe** (16k stars, MIT) — OSS screen+audio capture, 50+ pipes
- **Littlebird** ($11M, Mar 2026) — Text-based context reading, not video
- **Granola** ($1.5B, Mar 2026) — Meeting AI with MCP integration
- **Agent Bar** — macOS menubar Claude Code companion

## Priority Implementation for EMA

### Q2: Foundation
1. System tray as primary UI (tauri TrayIconBuilder)
2. Global hotkey (CmdOrCtrl+Shift+Space → floating capture modal)
3. Autostart (tauri-plugin-autostart)
4. Transparent frameless windows (Tauri 2.10.3+ required for macOS)

### Q3: Ambient Awareness
1. Text-based screen context (Littlebird pattern, NOT video)
2. File system watcher for workspace changes
3. Activity timeline (passive app focus log)
4. AT-SPI/D-Bus integration (Linux accessibility)

### Q4: Agent Workspace
1. Multi-window floating panels
2. Clipboard intent monitoring
3. Approval UI for agent actions
4. MCP integrations for external tools

## Privacy Architecture
- All capture on-device by default
- Exclude apps/domains (banking, passwords)
- Auto-mask sensitive fields
- Transparent data flow visibility
