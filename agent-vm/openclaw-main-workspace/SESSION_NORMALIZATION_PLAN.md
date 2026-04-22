# Session Normalization Plan

## Goal
Make EMA the canonical session registry while preserving Claude and Codex as provider-native session authorities.

## Canonical model
- provider-native logs = raw truth
- EMA = normalized session authority
- OpenClaw / ClaudeForge / Discord / wiki = surfaces or projections

## Immediate steps
1. preserve Claude import path
2. confirm Codex importer parity and expose equivalent API handling
3. add EMA session binding model to project/intents/executions
4. render surfaces from EMA session ids, not provider files directly

## First normalization targets
- host session identity
- provider session id preservation
- surface bindings
- linked execution/proposal ids
- session evidence in context packages

## Anti-patterns
- treating tmux/process presence as canonical continuity
- direct Discord projection from provider files
- duplicate authoritative session stores in surfaces
