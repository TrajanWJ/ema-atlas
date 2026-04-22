# VM Integrations Setup — 2026-03-16

## 1. Google Workspace CLI (`gws`)

**Installed:** `gws` v0.16.0 via npm (`@googleworkspace/cli`)
**Location:** `/usr/bin/gws`
**Repo:** https://github.com/googleworkspace/cli

Covers Gmail, Calendar, Drive, Sheets, Docs, Slides, Tasks, People, Chat, Classroom, Forms, Keep, Meet, and more — all via Google's Discovery Service (dynamic command surface).

Includes 30+ agent skills in `/tmp/integrations-setup/gws-cli/skills/` that can be installed as OpenClaw skills.

### Needs Manual Config
- **Google Cloud Project** with OAuth credentials
- Run `gws auth setup` (needs `gcloud` CLI) or manually:
  1. Create OAuth client at https://console.cloud.google.com/
  2. Download `client_secret.json` → `~/.config/gws/client_secret.json`
  3. Run `gws auth login` (opens browser for OAuth consent)
- Config dir: `~/.config/gws/`

---

## 2. Gmail MCP Server

**Installed:** `@gongrzhe/server-gmail-autoauth-mcp` v1.1.11 via npm
**Location:** `/usr/lib/node_modules/@gongrzhe/server-gmail-autoauth-mcp/`

Features: send/read/search emails, attachments, label management, batch operations, HTML emails, OAuth2 auto-auth.

### Needs Manual Config
1. Create OAuth 2.0 credentials in Google Cloud Console (Desktop app type)
2. Download the JSON → `~/.gmail-mcp/gcp-oauth.keys.json`
3. Run: `npx @gongrzhe/server-gmail-autoauth-mcp auth` (opens browser)
4. Add to OpenClaw MCP config:
   ```json
   {
     "mcpServers": {
       "gmail": {
         "command": "npx",
         "args": ["-y", "@gongrzhe/server-gmail-autoauth-mcp"]
       }
     }
   }
   ```

### Gmail Accounts to Configure
- trajanwj@gmail.com
- trajanwiley@gmail.com  
- truksdispatching@gmail.com
- trajanwj2@gmail.com
- seedofarson@gmail.com

**Note:** Both `gws` and the MCP server need the same GCP project with Gmail API enabled. One OAuth client can work for both if scopes are broad enough.

---

## 3. noVNC Remote Desktop

**Status:** ✅ Running
**Access URL:** http://192.168.122.10:6080/vnc.html
**VNC Password:** `agentvm1`

### Components
| Component | Version | Status |
|-----------|---------|--------|
| TigerVNC Server | Ubuntu package | Running on display :2 (port 5902) |
| noVNC + websockify | Ubuntu package | Running on port 6080 |
| Fluxbox (window manager) | Ubuntu package | Active in VNC session |
| Chromium Browser | Ubuntu package | Installed, available in VNC |

### Systemd Services
- `vncserver@2.service` — TigerVNC on display :2
- `novnc.service` — websockify proxy (6080 → 5902)

Both are enabled and will start on boot.

### Note on Display Numbers
Display :0 is the console, display :1 is occupied by an existing Xorg session. VNC runs on display :2.

---

## 4. Next Steps

### Priority 1: Google Cloud OAuth Setup
1. Go to https://console.cloud.google.com/
2. Create a project (or use existing)
3. Enable Gmail API, Calendar API, Drive API
4. Create OAuth 2.0 Desktop client
5. Download credentials JSON
6. For `gws`: save as `~/.config/gws/client_secret.json`, run `gws auth login`
7. For Gmail MCP: save as `~/.gmail-mcp/gcp-oauth.keys.json`, run `npx @gongrzhe/server-gmail-autoauth-mcp auth`

### Priority 2: Install GWS Skills into OpenClaw
The `gws` repo includes OpenClaw-compatible skills. To install:
```bash
cp -r /tmp/integrations-setup/gws-cli/skills/gws-* ~/skills/
```

### Priority 3: Browser in VNC
Open http://192.168.122.10:6080/vnc.html, log in with password `agentvm1`, and use Chromium for OAuth flows that need a browser on the VM.

### Optional
- Install `gcloud` CLI for easier GCP project management
- Set up multi-account switching for the 5 Gmail accounts
- Configure the Gmail MCP server as an OpenClaw MCP endpoint
