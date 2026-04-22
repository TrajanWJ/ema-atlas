---
title: "Promptfoo"
created: 2026-03-14
updated: 2026-03-14
type: research
status: active
confidence: 0.80
confidence_updated: 2026-03-18
source: external-research
tags: [ai-security, llm-testing, red-teaming, tools]
summary: "CLI and library for evaluating and red-teaming LLM applications. Provides automated prompt testing, vulnerability scanning, model comparison, and CI/C"
---
# Promptfoo

**Source:** https://github.com/promptfoo/promptfoo
**Category:** AI Security / LLM Testing
**Date:** 2026-03-14
**Status:** Discovered

## What It Does
CLI and library for evaluating and red-teaming LLM applications. Provides automated prompt testing, vulnerability scanning, model comparison, and CI/CD integration. Supports all major providers (OpenAI, Anthropic, Azure, Bedrock, Ollama, etc.).

Key capabilities:
- **Automated evaluations** — test prompts and agents with declarative YAML configs
- **Red teaming** — automated vulnerability scanning for prompt injection, jailbreaks, data exfiltration
- **Model comparison** — side-by-side benchmarking across providers
- **Code scanning** — review PRs for LLM-related security/compliance issues

## See Also
- [[Rampart]] — runtime firewall for AI agent commands
- [[Capsule]] — WASM sandbox for isolating agent execution
- **CI/CD integration** — automated checks in deployment pipelines

## Relevance
Directly relevant to Trajan's stack:
- Could test and validate the Lasso prompt injection hooks already installed
- Red-team [[OpenClaw]] agent prompts and skill files for vulnerabilities
- Benchmark Claude vs other models for specific tasks
- Integrate into CI/CD for any AI-powered projects
- Complements existing security tools ([[clawdefender]], [[security-audit-toolkit]])

## Stats
- ⭐ 15,484 stars (3,846 this week — trending hard)
- MIT licensed
- Active community with Discord
- Available via npm, brew, pip

## Install
```bash
npm install -g promptfoo
# or
brew install promptfoo
# or
pip install promptfoo
```

## Quick Start
```bash
promptfoo init --example getting-started
cd getting-started
promptfoo eval
promptfoo view
```

## Notes
- Runs 100% locally — prompts never leave the machine (good for privacy)
- Developer-first with live reload and caching
- Battle-tested at scale (10M+ users in production)
- Could be used to validate [[OpenClaw]] skill safety before deployment
- Worth evaluating for automated security scanning of agent prompts

#ai-security #llm-testing #red-teaming #tools

## Related

- [[Overnight]]
- [[Summary]]
- [[2026-03-14]]
