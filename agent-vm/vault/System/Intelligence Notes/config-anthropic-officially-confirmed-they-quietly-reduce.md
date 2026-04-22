# Config Change: Anthropic officially confirmed they quietly reduced Claude default effort level to 'medium' to conserve compute — AMD and Microsoft researchers independently documented the quality regression; fix is explicit --effort high flag

- **Source:** a1633c82.txt
- **Suggested:** 2026-04-15T13:08:05Z
- **Impact:** 3/5

## Change Details

Verify --effort high or CLAUDE_CODE_EFFORT_LEVEL=max is set in all dispatch agent launch scripts and CLI aliases — extends existing 33642e49.txt env var fix with official confirmation that medium is now the silent default, not a bug

## Status

Auto-flagged for application. Verify before applying to production configs.

---
Tags: #intelligence #config-change #auto-applied
