---
title: "MarkItDown"
created: 2026-03-14
updated: 2026-03-14
type: research
status: active
confidence: 0.80
confidence_updated: 2026-03-18
source: external-research
tags: [code, github, knowledge, mcp, obsidian, research]
summary: "Microsoft's Python tool that converts any file format to Markdown — PDF, Word, Excel, PowerPoint, images, audio, HTML, YouTube, and more. Includes a"
---
# MarkItDown

**Source:** https://github.com/microsoft/markitdown (90.7k stars)
**Category:** Document Conversion / MCP Server
**Date:** 2026-03-14
**Status:** Installed & Active

## What It Does
Microsoft's Python tool that converts any file format to Markdown — PDF, Word, Excel, PowerPoint, images, audio, HTML, YouTube, and more. Includes a built-in MCP server (`markitdown-mcp`) so coding agents can call it as a tool.

## Relevance
- **CLI** at `~/.local/bin/markitdown` (v0.1.5) — convert any file to Markdown
- **MCP server** at `~/.local/bin/markitdown-mcp` (v0.0.1a4) — added to Claude Code
- Convert documents → Markdown → drop into Obsidian vault → QMD indexes them
- Turns any file format into LLM-ready context
- Plugin system for extensions (e.g. `markitdown-ocr` for image text)

## CLI Usage
```bash
# Convert a file
markitdown document.pdf -o output.md

# From stdin
cat document.pdf | markitdown

# Convert and save to vault
markitdown report.pdf -o /home/trajan/vault/Research/report.md
```

## MCP Server
Added to `~/.claude/mcp.json` as `markitdown` server. Claude Code can now convert any document format to Markdown during coding sessions.

## Pros
- 90k+ stars — massively adopted, Microsoft-maintained
- MCP server included out of the box
- Plugin system for extensibility
- CLI + Python API + pipe support
- Modular deps — install only what you need

## Cons
- OCR/image descriptions require OpenAI API key
- Azure Document Intelligence features need Azure subscription
- Output optimized for machines, not always human-pretty

## Notes
- Supports: PDF, DOCX, XLSX, PPTX, HTML, images, audio, YouTube, ZIP, CSV, JSON, XML
- Part of the Claude Code MCP stack (now 8 servers total)

## Related

- [[tool-verification-2026-03-16]]
- [[mcp-tool-search-installation]]
- [[Chrome DevTools MCP]]
