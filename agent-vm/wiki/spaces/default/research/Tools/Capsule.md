---
title: Capsule
created: '2026-03-14'
updated: '2026-03-16'
type: research
status: active
confidence: 0.8
confidence_updated: 2026-03-18T00:00:00.000Z
source: external-research
tags:
  - ai-agent
  - rust
  - sandbox
  - security
  - wasm
summary: >-
  A secure, durable runtime for sandboxing AI agent tasks using WebAssembly.
  Each task runs in its own isolated WASM sandbox with configurable resource 
wiki_id: research/Tools/Capsule
imported_from: vault/Research/Tools/Capsule.md
imported_at: '2026-04-04T00:23:57.126Z'
---
# Capsule

**Source:** https://github.com/mavdol/capsule
**Category:** AI Agent Security / Sandbox Runtime
**Date:** 2026-03-14
**Status:** Discovered

## What It Does

A secure, durable runtime for sandboxing AI agent tasks using WebAssembly. Each task runs in its own isolated WASM sandbox with configurable resource limits (CPU via fuel metering, memory, timeouts), automatic retries, and lifecycle tracking. Supports both Python and TypeScript/JavaScript with simple decorator/wrapper APIs.

Key features:
- **Isolated execution** — each task in its own WASM sandbox, no host system access
- **Resource limits** — CPU (fuel metering), RAM, timeout per task
- **Network controls** — whitelist allowed domains (`allowedHosts`)
- **File access controls** — whitelist allowed directories (`allowedFiles`)
- **Environment variable scoping** — only pass specified env vars to sandbox
- **Automatic retries** — configurable retry on failure
- **Structured output** — JSON envelope with result + execution metadata (duration, fuel consumed, retries)
- **HTTP client** — built-in WASM-compatible HTTP for Python; standard fetch for TS

## Relevance

Directly relevant to the IronClaw interest noted in [[My Stack Decisions]]. This is a practical, usable WASM sandbox for AI agent code execution — exactly the security model Trajan identified as "best among AI assistants." Could be used to sandbox untrusted code execution in [[OpenClaw]] agent tasks, Claude Code delegated work, or any AI-generated code that needs safe execution.

## Pros
- Rust core with WASM isolation — strongest security model for code execution
- Supports Python AND TypeScript — covers both sides of the stack
- Simple API (decorators/wrappers) — minimal integration overhead
- Fine-grained resource controls (CPU fuel, RAM, network, filesystem)
- Active development (updated within hours of checking)
- 245 stars, growing

## Cons
- Relatively new project (245 stars) — still early
- WASM compatibility limitations (custom HTTP client needed for Python)
- No direct [[OpenClaw]]/Claude Code integration yet — would need custom plumbing
- Limited ecosystem compared to systemd-based sandboxing

## Install

```bash
# Python
pip install capsule-run

# TypeScript
npm install -g @capsule-run/cli
npm install @capsule-run/sdk
```

## See Also
- [[Rampart]] — AI agent firewall (policy-based, complements sandboxing)
- [[Promptfoo]] — LLM security testing and red-teaming

#ai-agent #security #wasm #sandbox #rust

## Related

- [[Overnight]]
- [[Summary]]
- [[2026-03-14]]
