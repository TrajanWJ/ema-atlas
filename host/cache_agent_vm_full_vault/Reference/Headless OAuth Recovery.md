---
title: "Headless OAuth Recovery"
created: 2026-03-14
updated: 2026-03-14
type: reference
status: active
confidence: 0.80
confidence_updated: 2026-03-18
source: reference
tags: [auth, emergency, openclaw]
summary: "Launches system Chrome via CDP (not Playwright's Chromium), navigates OAuth login flows, reads verification emails via Gmail API, and deploys fresh to"
---
# Headless OAuth Recovery

> Emergency tool for automated OAuth re-authentication when tokens fully expire. Uses real Chrome to bypass Cloudflare.

---

## What It Does

Launches system Chrome via CDP (not Playwright's Chromium), navigates OAuth login flows, reads verification emails via Gmail API, and deploys fresh tokens to servers.

| Field | Value |
|---|---|
| **Source** | [Screddyice/headless-oauth-recovery](https://github.com/Screddyice/headless-oauth-recovery) |
| **Status** | Not installed — reserved as emergency fallback |
| **Requires** | Python 3.8+, Google Chrome, Gmail API credentials |

## When to Use

Only if Claude Code auth completely breaks and `claude /login` is not an option (e.g., headless server, no TTY). The [[Reference/Claude Max Proxy]] setup should prevent this from ever happening.

## Setup (if needed)

```bash
pip install playwright
playwright install chromium

# Configure
cp config.json.example config.json
# Edit with server details, Gmail API credentials

# Run
python3 headless_reauth.py --server MY_SERVER
```

## Related Notes

- [[Reference/Claude Max Proxy]] — primary auth solution (use this first)

#openclaw #auth #emergency
- [[Headless OAuth Recovery]]
- [[Claude Code Bot Architecture]]
- [[OpenClaw Research]]
- [[Claude Code Bot Architecture]]
