# Blueprint Media Archive

> Website mirror and archival system with AI-powered scraping/extraction layer.

## Quick Info

| Field | Value |
|---|---|
| **Location** | `/home/trajan/Desktop/Coding/Projects/blueprint-media-full-archive/` |
| **Stack** | TypeScript, Express.js, Python (Playwright, OpenAI, Anthropic, Google GenAI) |
| **Status** | Prototype / initial backup |

## Architecture

```
blueprint-media-full-archive/
├── src/server.ts      → Express server (serves static mirrors)
├── my-project/        → Python AI/scraping environment
├── mirror_assets/     → Archived website content
├── legacy_v1/         → Previous iteration
└── docs/              → FRONTEND_COMPONENTS.md
```

Dual-layer: TypeScript server serves mirrored sites, Python component uses LLMs (OpenAI, Anthropic, Google) + Playwright for intelligent scraping and extraction.

## Gotchas

_None captured yet._

## Related Notes

- [[Trajan's Projects]]

#project #blueprint-media #archival #prototype
