# MCP Baseline Manifest Spec

## Goal
Define one canonical MCP baseline manifest that generates Claude and Codex client configs and documents OpenClaw parity.

## Manifest responsibilities
- canonical server names
- command/args/env model
- ordering
- enabled/disabled state
- ownership metadata

## Required outputs
- Claude MCP config
- Codex MCP config
- parity notes for OpenClaw-native replacements or differences

## Baseline domains
- ema
- filesystem
- vault-filesystem (transitional)
- qmd
- sequential-thinking
- memory
- context7
- git
- fetch
- playwright
- codebase-memory-mcp

## Rules
- baseline edited once
- client configs generated, not hand-maintained
- parity/differences explicitly documented
