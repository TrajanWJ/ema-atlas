---
title: "Arkana MCP Installation"
created: 2026-03-16
updated: 2026-03-16
type: research
status: active
confidence: 0.80
confidence_updated: 2026-03-18
source: research
tags: [code, docker, github, mcp, prompts, research]
summary: "Arkana is an MCP server that provides **212 malware analysis tools** to Claude Code — decompilation (angr), emulation (Speakeasy/Qiling), YARA/capa/"
---
# Arkana MCP Installation

**Date:** 2026-03-16
**Version:** 1.26.0
**Repo:** https://github.com/JameZUK/Arkana
**Status:** ✅ Installed and working

## What It Is

Arkana is an MCP server that provides **212 malware analysis tools** to Claude Code — decompilation (angr), emulation (Speakeasy/Qiling), YARA/capa/FLOSS scanning, Binary Refinery transforms, PE/ELF/Mach-O parsing, function similarity search, and VirusTotal integration. Essentially an entire malware reverse engineering lab behind a single AI prompt.

## Installation

### Method: Docker (recommended)

```bash
git clone https://github.com/JameZUK/Arkana.git /home/trajan/Arkana
cd /home/trajan/Arkana
./run.sh --build   # Builds arkana-toolkit Docker image (~2.6GB)
```

**Note:** Two Dockerfile patches were needed during build:
1. Added `mkdir -p /app/qiling-rootfs` before the chown step (rootfs download can fail silently)
2. Added `mkdir -p /app/yara_rules_store` with group permissions after YARA rules download step

### MCP Configuration

Added to `~/.claude/mcp.json`:

```json
{
  "arkana": {
    "command": "/home/trajan/Arkana/run.sh",
    "args": ["--samples", "/home/trajan/Arkana/samples", "--stdio"],
    "env": {},
    "disabled": false
  }
}
```

## Verification

- **MCP handshake:** ✅ Responds correctly to `initialize` (protocol 2024-11-05)
- **Server info:** Arkana v1.26.0
- **Tool count:** 212 tools registered
- **Libraries detected:** MCP SDK, Capa, Signify, FLOSS, StringSifter, RapidFuzz, Angr, Binary Refinery
- **YARA rules:** Auto-downloaded at startup (ReversingLabs + Community)
- **Dashboard:** Available at http://127.0.0.1:8082/dashboard/ when running

## Tool Categories (from README)

| Category | Tools | Capabilities |
|---|---|---|
| Angr analysis | 41 | Decompilation, CFG, symbolic execution, data-flow, slicing |
| PE structure | 24 | Headers, sections, imports, exports, resources, overlays |
| Binary Refinery | 23 | 200+ data transforms (encoding, crypto, compression, forensics) |
| YARA/capa/FLOSS | Multiple | Signature scanning, capability detection, string extraction |
| Emulation | Multiple | Speakeasy (Windows APIs), Qiling (multi-OS, multi-arch) |
| Function similarity | Multiple | Cross-binary BSim-style matching |
| Session/annotation | Multiple | Persistent notes, renames, custom types, history |

## Usage

In Claude Code:
```
> /arkana-analyse suspicious.exe
> Open suspicious.exe and tell me if it's malicious
```

Custom samples directory can be changed via `--samples /path/to/dir` in the MCP args.

## Concerns

- **Docker image size:** 2.6GB — significant disk footprint
- **YARA rules download:** Happens at each container startup (not persisted in image due to build-time download failures). Adds ~2s to cold start.
- **Qiling rootfs:** Windows DLLs not included — Qiling emulation of Windows binaries needs manual rootfs setup per `docs/QILING_ROOTFS.md`
- **No VirusTotal API key configured** — set `VT_API_KEY` env var in mcp.json for VT lookups

## Related

- [[2026-03-16]]
- [[mcp-tool-search-installation]]
- [[briefing-2026-03-16]]
