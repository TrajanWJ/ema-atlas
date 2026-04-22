# Config Change: Claude Code v2.1.100+ silently injects ~20K server-side tokens per request — proxy-verified that same payload results in 20K more billed tokens despite fewer bytes sent, affecting both cost and output quality since tokens enter the model's actual context window

- **Source:** 611d7f71.txt
- **Suggested:** 2026-04-12T21:06:05Z
- **Impact:** 5/5

## Change Details

Pin Claude Code below v2.1.100 or monitor billed tokens via proxy to quantify actual cost increase. Check current installed version with 'claude --version'. If above 2.1.100, evaluate downgrade or budget adjustment. Add token monitoring to dispatch pipeline cost tracking.

## Status

Auto-flagged for application. Verify before applying to production configs.

---
Tags: #intelligence #config-change #auto-applied
