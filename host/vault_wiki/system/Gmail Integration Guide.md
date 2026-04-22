---
title: Gmail Integration Guide
created: '2026-03-18'
updated: '2026-03-18'
type: integration
status: active
confidence: 0.6
source: 'agent:main'
summary: >-
  Step-by-step guide to connect Gmail to the OpenClaw agent system via MCP or
  plugin
tags:
  - integrations
  - email
  - gmail
  - oauth
  - executive-functioning
wiki_id: system/Gmail_Integration_Guide
imported_from: vault/System/Gmail Integration Guide.md
imported_at: '2026-04-04T00:23:57.236Z'
---
# Gmail Integration Guide

## Current State
- No Gmail plugin or MCP server currently installed on agent-vm
- OAuth Guardian v4 handles Anthropic tokens but not Google OAuth
- Email is the #1 blocker for executive functioning features

## Options (Ranked)

### Option A: Google MCP Server (Recommended)
The `@anthropic/google-mcp` server or community equivalents provide Gmail + Calendar + Drive access through MCP.

**Setup Steps:**
1. **Trajan creates a Google Cloud Project:**
   - Go to https://console.cloud.google.com/
   - Create project: "Agent VM Integrations"
   - Enable APIs: Gmail API, Google Calendar API, Google Drive API
   - Create OAuth 2.0 credentials (Desktop App type)
   - Download `credentials.json`

2. **Install MCP server on VM:**
   ```bash
   npm install -g @anthropic/google-mcp  # or community alternative
   ```

3. **Configure in OpenClaw:**
   Add to `~/.openclaw/openclaw.json` under `mcp.servers`:
   ```json
   {
     "google": {
       "command": "google-mcp",
       "args": ["--credentials", "/home/trajan/.config/google/credentials.json"],
       "env": {}
     }
   }
   ```

4. **First-run OAuth flow:**
   - Run the MCP server once manually
   - Browser opens for Google login consent
   - Token stored locally for future use

### Option B: OpenClaw Gmail Plugin
Check ClawHub for a Gmail plugin: `clawhub search gmail`
- May exist as community plugin
- Would integrate more natively with message routing

### Option C: Direct IMAP/SMTP
- Most basic approach, no OAuth needed if app passwords enabled
- Limited to send/receive, no labels/filters/drafts management
- Good as fallback

## What Agents Can Do (After Setup)
- Read inbox, search emails, get threads
- Draft and send emails
- Auto-categorize incoming mail
- Create follow-up reminders
- Surface action items from emails
- Auto-respond to known patterns (with approval gate)

## What Trajan Needs To Do
1. Create Google Cloud project + OAuth credentials (~15 min)
2. Run initial auth flow (one-time browser consent)
3. Decide on auto-response rules (what gets auto-replied, what needs approval)

## Priority
This is Tier 1 — blocks executive functioning, client management, and business automation.

## Related
- [[Calendar Integration Guide]]
- [[Aspirational Integrations]]
- [[Goals & Aspirations]]
- [[Wilson Premier Properties]]
