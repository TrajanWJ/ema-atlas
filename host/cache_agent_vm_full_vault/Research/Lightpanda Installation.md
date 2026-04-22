---
title: "Lightpanda Installation"
created: 2026-03-16
updated: 2026-03-16
type: research
status: active
confidence: 0.80
confidence_updated: 2026-03-18
source: research
tags: [knowledge, mcp, openclaw, ops, research, skills]
summary: "A lightweight headless browser written in Zig, designed for AI automation. Supports CDP (Chrome DevTools Protocol), fetch mode, and even MCP (Model Co"
---
# Lightpanda Installation

**Date:** 2026-03-16
**Version:** `ddd34dc5` (nightly build)
**Binary:** `/usr/local/bin/lightpanda` (107 MB)
**Status:** ✅ Installed and working

## What is Lightpanda?

A lightweight headless browser written in Zig, designed for AI automation. Supports CDP (Chrome DevTools Protocol), fetch mode, and even MCP (Model Context Protocol) server mode. Built by [lightpanda.io](https://github.com/lightpanda-io/browser).

## Installation

```bash
curl -L -o /usr/local/bin/lightpanda \
  https://github.com/lightpanda-io/browser/releases/download/nightly/lightpanda-x86_64-linux
sudo chmod a+x /usr/local/bin/lightpanda
```

## Capabilities

### Fetch Mode
Direct page fetch with multiple output formats:
```bash
lightpanda fetch --dump html https://example.com
lightpanda fetch --dump markdown https://example.com
lightpanda fetch --dump semantic_tree https://example.com
```

### CDP Server Mode
WebSocket CDP server for puppeteer/playwright integration:
```bash
lightpanda serve --host 127.0.0.1 --port 9223
# Endpoint: ws://127.0.0.1:9223/
# Version check: curl http://127.0.0.1:9223/json/version
```

### MCP Server Mode
Native MCP support over stdio — can integrate directly with Claude Code and other MCP clients:
```bash
lightpanda mcp
```

## Test Results

### Basic Fetch ✅
Successfully fetched `https://example.com` and returned full HTML.

### CDP + Puppeteer ✅
Connected puppeteer-core via `ws://127.0.0.1:9223/`, navigated to example.com, extracted title and body text.

```javascript
import puppeteer from 'puppeteer-core';
const browser = await puppeteer.connect({
  browserWSEndpoint: 'ws://127.0.0.1:9223/',
});
const page = await browser.newPage();
await page.goto('https://example.com', { waitUntil: 'domcontentloaded' });
const title = await page.title();  // "Example Domain"
await browser.close();
```

## Memory Benchmark

| Browser | Processes | Total RSS | Ratio |
|---------|-----------|-----------|-------|
| **Lightpanda** | 2 | **27.4 MB** | **1x** |
| **Chromium** (headless) | 30 | **2,679 MB** | **~98x** |

Lightpanda uses roughly **100x less memory** than Chromium headless for the same idle CDP server. This is a massive win for agent VMs with limited RAM.

## Systemd Service

Created at `/etc/systemd/system/lightpanda.service` — **not enabled yet**.

```ini
[Unit]
Description=Lightpanda Headless Browser CDP Server
After=network.target

[Service]
Type=simple
User=trajan
ExecStart=/usr/local/bin/lightpanda serve --host 127.0.0.1 --port 9223
Restart=on-failure
RestartSec=5
```

To enable:
```bash
sudo systemctl enable --now lightpanda.service
```

## Notable Features
- **Strip modes:** `--strip_mode js,css,ui,full` to clean output for AI consumption
- **robots.txt support:** `--obey_robots` flag
- **iframe inclusion:** `--with_frames` to inline iframe content
- **TLS verification toggle:** `--insecure_disable_tls_host_verification`
- **Web bot auth:** Ed25519 key-based authentication for responsible scraping
- **Configurable concurrency:** `--http_max_concurrent`, `--http_max_host_open`

## Use Cases for Agent VM
1. **Lightweight web fetching** — use fetch mode with `--dump markdown` for AI-friendly content
2. **CDP automation** — puppeteer/playwright scripts via the serve mode (port 9223)
3. **MCP integration** — direct MCP server for Claude Code browser tools
4. **Memory-constrained automation** — 27 MB vs 2.7 GB makes parallel browsing feasible

## Caveats
- Nightly build — expect bugs and breaking changes
- JavaScript execution support may be limited compared to Chromium
- No visual rendering (no screenshots/PDF generation)
- CDP protocol coverage is partial — some puppeteer APIs may not work

## Related
- [[Skills/agent-browser|Agent Browser]] — existing browser automation skill
- [[OpenClaw]] — agent infrastructure
- [[Lightpanda Installation]]
- [[tool-verification-2026-03-16]]
- [[mcp-tool-search-installation]]
- [[harvest-2026-03-16-2000]]
- [[harvest-2026-03-16-2200]]
- [[harvest-2026-03-17-0000]]
- [[harvest-2026-03-17-1800]]
- [[harvest-2026-03-17-2000]]
