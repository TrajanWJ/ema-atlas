---
type: decision
wiki_id: decisions/Web-Content-Extraction-Stack
imported_from: vault/Decisions/Web-Content-Extraction-Stack.md
imported_at: '2026-04-04T00:23:56.835Z'
tags: []
summary: ''
---
# Web Content Extraction Stack

**Date:** 2026-03-24
**Context:** Deep-scraper / smart-fetch upgrade — vault-keeper agent session ce905d13

## Decision

Replaced curl + regex HTML stripping with a three-tier extraction stack:

1. **trafilatura** — primary (best-in-class Python lib, `pip install trafilatura`)
2. **readability-lxml** — fallback for pages trafilatura can't cleanly extract
3. **jina.ai reader** (`https://r.jina.ai/<URL>`) — last resort for JS-heavy / SPA pages

## Rationale

- Old curl + regex approach was producing garbage output (f-strings mangled through bash quoting, no proper HTML stripping)
- Jina reader works well but relying on an external API as primary fetch is fragile
- trafilatura is battle-tested for article extraction and handles most static pages
- readability-lxml covers edge cases trafilatura misses
- jina.ai handles JS-rendered pages without needing to spin up playwright for every fetch

## Installation

```bash
pip3 install trafilatura readability-lxml --break-system-packages
# trafilatura binary lands in ~/.local/bin (add to PATH if needed)
```

playwright + chromium already installed (`playwright install chromium`).

## Files Changed

- `~/skills/deep-scraper/scripts/smart-fetch.py` — new content extraction script
- `~/skills/deep-scraper/scripts/smart-search.py` — updated search with better ranking
- `~/skills/deep-scraper/scripts/web-search.sh` — updated to call smart-fetch/search

## Notes

- SearXNG is the primary search backend (no Brave API key configured as of 2026-03-24)
- SearXNG has depth limits; Brave would give better results if API key added later
- trafilatura binary path: `~/.local/bin/trafilatura`

## Related

- [[deep-scraper skill]]
- [[Vault-Keeper Agent]]
