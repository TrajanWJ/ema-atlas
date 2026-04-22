---
type: auto-captured
source: session-transcript
captured: 2026-04-05T15:33:00Z
session: ce905d13-f191-4900-a473-5645a6d7164b
category: decision
score: 3
tags: [decision, web-research, scraping, extraction, searxng, trafilatura, jina, playwright]
---

# Web research stack for robust content extraction

## Decision
Use a layered web-research stack instead of relying on raw `curl`/regex fetching or a single extractor.

Recommended order:
1. **SearXNG** as the primary search backbone
2. **Trafilatura** as the primary content extractor
3. **Readability** as a structured fallback for article extraction
4. **Jina Reader** as a high-reliability fallback for JS-heavy or awkward pages
5. **Playwright** as the last-resort full-browser fetch path

## Why this matters
The previous fetch path was shallow and unreliable:
- raw HTML stripping missed real content
- JavaScript-heavy sites failed
- some sources like Reddit, GitHub, and other dynamic pages were poorly captured
- rate-limit or auth gaps made single-source search fragile

The key insight was that the problem was not just search quality — it was the **fetch/extraction layer**. Search could return relevant URLs, but the downstream fetcher often produced junk, partial text, or nothing useful.

## Observations from the session
- **SearXNG was already working** and returning usable results
- the real bottleneck was a **broken fetch layer** using crude HTML stripping
- **Trafilatura** was identified as the best primary extractor
- **Jina Reader** was confirmed to return clean markdown reliably on many pages
- **Playwright** was already installed and suitable for fully dynamic sites
- there was **no Brave API key configured**, so Brave could not serve as a fallback search provider

## Practical architecture
### Search
- Primary: local SearXNG
- Optional fallback: Brave API when configured
- Additional source-specific paths: GitHub API, HN Algolia, other source-native endpoints when useful

### Fetch / extraction
- Try Trafilatura first for clean main-content extraction
- Fall back to Readability when Trafilatura under-extracts
- Fall back to Jina Reader for difficult pages and markdown output
- Use Playwright for pages that require real rendering or client-side hydration

## What to remember
- Treat **content extraction quality** as the critical link in web research
- Prefer a **layered fallback pipeline** over betting on one tool
- Jina is especially useful as a low-friction rescue path
- A missing Brave API key is a nice-to-have problem; a broken fetch path is the real blocker

## Follow-up
Potential next step: extend this same stack into a broader signal-farming toolkit for videos, PDFs, Reddit, newsletters, and podcast/transcript sources.

---
*Captured from session `ce905d13-f191-4900-a473-5645a6d7164b` after transcript queue review.*
