---
title: "Snyk Agent Scan"
created: 2026-03-14
updated: 2026-03-14
type: research
status: active
confidence: 0.80
confidence_updated: 2026-03-18
source: agent-research
tags: [openclaw, ops, prompts, research, security, skills]
summary: "Security scanner specifically for AI agents, MCP servers, and agent skills. Auto-discovers agent configurations on your machine and scans them for vul"
---
# Snyk Agent Scan

**Source:** https://github.com/snyk/agent-scan (formerly invariantlabs-ai/mcp-scan, acquired by Snyk)
**Category:** Agent Security Scanner
**Date:** 2026-03-14
**Status:** Evaluated
**Stars:** N/A (backed by Snyk enterprise)

## What It Does

Security scanner specifically for AI agents, MCP servers, and agent skills. Auto-discovers agent configurations on your machine and scans them for vulnerabilities.

### Detection Capabilities (15+ issue codes)
**MCP Server Issues:**
- E001: Prompt Injection in tool descriptions
- E002: Tool Shadowing (tools that impersonate other tools)
- E003: Tool Poisoning (malicious tool behavior)
- TF001: Toxic Flows (dangerous tool chains)

**Skill Issues:**
- E004: Prompt Injection in skills
- E006: Malware Payloads hidden in natural language
- W007: Credential Handling issues
- W008: Hardcoded Secrets
- W011: Untrusted Content

### Supported Agents
- Claude Code/Desktop
- Cursor
- Windsurf
- Gemini CLI
- Any agent with MCP config files

### Usage
```bash
# Full machine scan (auto-discovers everything)
uvx snyk-agent-scan@latest

# Scan specific config
uvx snyk-agent-scan@latest ~/.vscode/mcp.json

# Scan agent skills
uvx snyk-agent-scan@latest ~/path/to/SKILL.md
uvx snyk-agent-scan@latest ~/.claude/skills

# Inspect without verification
uvx snyk-agent-scan@latest inspect
```

### Modes
- **Scan Mode:** CLI one-shot, outputs comprehensive report
- **Background Mode:** Regular interval scanning, reports to Snyk Evo (enterprise)

## Relevance

**HIGH — Should run this against our setup immediately.** We have:
- 5 MCP servers (Serena, [[Engram]], CodeGraphContext, QMD, TaskMaster)
- 23+ ClawHub-installed skills
- Multiple agent configurations

### Action Items
1. Install uv if not present: `pip install uv` or `curl -LsSf https://astral.sh/uv/install.sh | sh`
2. Run: `uvx snyk-agent-scan@latest` (needs SNYK_TOKEN — free tier available at snyk.io)
3. Scan our skills: `uvx snyk-agent-scan@latest ~/.openclaw/agents/main/workspace/skills/`
4. Consider adding to cron for periodic scanning

### Integration with Our Stack
- Complements our existing [[clawdefender]] skill
- Could be wired into a pre-install hook for ClawHub skills
- The "toxic flows" detection is unique — identifies dangerous tool chains we might not catch manually

## Notes

- Snyk acquiring mcp-scan (Invariant Labs) validates that agent security is becoming enterprise-grade
- Free tier requires API token from snyk.io
- Sends tool names/descriptions to Snyk servers for analysis (privacy consideration)
- Published a technical report on agent skill ecosystem threats

## Related

- [[Snyk Agent Scan]]
- [[Awesome OpenClaw Skills Index]]
- [[reddit-deep-dive-agent-ecosystem]]
- [[Overnight]]
- [[Summary]]
- [[2026-03-14]]
- [[Reddit]]
- [[Deep]]
- [[Dive]]
- [[-]]
- [[Agent]]
- [[Ecosystem]]
