# Web Content Extraction Stack

**Date:** 2026-03-24
**Last verified:** 2026-04-14
**Context:** Deep-scraper / smart-fetch upgrade — vault-keeper agent session ce905d13

> **2026-04-14 Review:** Stack confirmed installed and operational. trafilatura 2.0.0 at `~/.local/bin/trafilatura`, readability-lxml 0.8.4.1 present. The deep-scraper scripts referenced were not found at the documented paths — may have been relocated or refactored. The `defuddle` skill is now available as an alternative extraction method (see skills list). Consider updating file paths if scripts moved.

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
