---
name: Claude auth login revokes all sessions on device
description: Running `claude auth login` anywhere on this device — even with CLAUDE_CONFIG_DIR — logs out the current Claude Code session. Server-side revocation, not just local file overwrite.
type: feedback
status: active
confidence: 0.60
confidence_updated: 2026-03-18
source: manual
updated: 2026-03-18
created: 2026-03-16
title: "feedback_claude_auth"
summary: "Running claude auth login with ANY account (same or different) on this device will revoke the current active Claude Code session server-side."
---
Running `claude auth login` with ANY account (same or different) on this device will revoke the current active Claude Code session server-side. `CLAUDE_CONFIG_DIR` isolation does NOT help — the OAuth server invalidates existing tokens for this device/client_id when a new login occurs.

**Why:** Anthropic's OAuth backend ties sessions to the client_id (`9d1c250a-...`), not the local config directory. A new login = server revokes previous tokens.

**How to apply:** Never propose `claude auth login` as a solution when an active Claude Code session is running. To add a second account's token, find alternative methods that don't trigger the OAuth login flow (e.g., generate an API key from console.anthropic.com, or extract a token from a different device).

## Related
- [[System Overview]]
- [[Security Posture - Agent System]]
