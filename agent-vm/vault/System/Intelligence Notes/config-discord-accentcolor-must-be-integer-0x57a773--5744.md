---
title: "Discord accentColor Must Be Integer, Not Hex String"
type: reference
created: 2026-03-24
updated: 2026-04-13
confidence: 0.95
confidence_updated: 2026-04-13
source: peer-review + discord-api-docs
tags: [discord, components-v2, config, debugging, silent-failure]
summary: "Discord components v2 Container accentColor requires an integer (e.g. 5744499), not a hex string (#57A773). Strings are silently rejected."
---

# Discord accentColor Must Be Integer, Not Hex String

**Source:** peer-pr-20260324-210438-556357.txt, Discord API documentation
**Impact:** 3/5 — causes invisible styling failures with no error messages

## The Problem

Discord's Components v2 `Container` component (type 17) accepts an `accentColor` property to set the visual accent/border color of the container. This field **must be an integer** — the decimal representation of a hex color code.

If you pass a hex string like `"#57A773"` or `"#E8A838"`, Discord **silently ignores it**. No error is returned, no validation warning is logged. The container simply renders without any accent color, as if the field was omitted entirely.

This is consistent with how Discord handles color fields across the API. The `accent_color` field on the [[discord-rich-output|User Object]] is documented as "an integer representation of hexadecimal color code" (e.g., `16711680` = `#FF0000`). The same convention applies to embed colors and container accent colors throughout the Discord API.

## Correct Format

```python
# WRONG — silently ignored, no accent color rendered
"accentColor": "#57A773"
"accentColor": "57A773"
"accentColor": "#E8A838"

# CORRECT — integer representation
"accentColor": 0x57A773   # = 5744499 in decimal
"accentColor": 5744499    # same value, decimal literal
"accentColor": 0xE8A838   # = 15246392 in decimal
```

### Conversion Methods

**Python:**
```python
color_int = int("57A773", 16)  # → 5744499
# or use hex literal directly
color_int = 0x57A773           # → 5744499
```

**JavaScript:**
```javascript
const colorInt = parseInt("57A773", 16);  // → 5744499
// or hex literal
const colorInt = 0x57A773;                // → 5744499
```

**Bash (for configs):**
```bash
echo $((16#57A773))  # → 5744499
```

## Why This Is Dangerous

1. **Silent failure.** Discord returns no error, no warning, no validation message. The API call succeeds — the container just renders without styling.
2. **Hard to spot visually.** If you've never seen the "correct" accent color, you won't know it's missing. The container still renders; it just lacks the colored border.
3. **Hex strings look correct.** `"#57A773"` is a perfectly valid CSS color. The mental model from web development says this should work. It doesn't in Discord's API.
4. **Inconsistent developer experience.** Some Discord API consumers (embed builders, libraries) auto-convert hex strings to integers. If you've used one of those, you might assume the raw API does the same. It doesn't.

## Components v2 Context

This issue specifically manifests when using Discord's Components v2 system (message flag `1 << 15` / `IS_COMPONENTS_V2`). In components v2:

- Traditional `content` and `embeds` fields are disabled
- The `Container` (type 17) replaces embeds as the primary visual grouping mechanism
- Messages can contain up to 40 total components
- The container's `accentColor` is the primary way to add visual identity/branding to messages

Since components v2 is the modern replacement for embeds, getting `accentColor` right is essential for any bot or agent that uses branded/styled output.

## Action Items

1. **Audit all Discord emit calls** in the codebase for `accentColor` fields
2. **Convert any hex string values** (`"#RRGGBB"`) to integer literals (`0xRRGGBB`)
3. **Add a validation helper** that rejects string-type accentColor values at send time
4. **Update the [[discord-output]] module** — it currently contains `"accentColor": "#E8A838"` which is the exact bug this note documents

## Known Affected Files

- `Agents/Modules/discord-output.md` — contains `"accentColor": "#E8A838"` (string, will be silently ignored)
- Any agent or script that copies the pattern from `discord-output.md`

## Related

- [[discord-rich-output]] — Skill for rich Discord output patterns using components v2
- [[discord-output]] — Agent module with Discord output formatting (contains the bug)
- [[discord-webhook-10015-unknown-webhook-error-patter|Discord Webhook 10015 Error]] — Another silent Discord failure mode
- [[discord-slack-integration]] — Integration architecture

---
Tags: #intelligence #config-change #auto-applied #discord #components-v2
