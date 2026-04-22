# Swarm Launch Status — 2026-04-21

## Summary

Dispatched **10 agents** into the EMA meta-build swarm using **3 harness types** available on this VM:
- Claude Code
- Codex CLI
- Hermes Agent

## Sessions launched

- `ema-claude-a1`
- `ema-claude-a2`
- `ema-claude-a3`
- `ema-hermes-a4`
- `ema-hermes-a5`
- `ema-codex-a6`
- `ema-codex-a7`
- `ema-codex-a8`
- `ema-claude-a9`
- `ema-codex-a10`

## Current observations

### Claude Code
- sessions launched successfully in tmux
- output is currently quiet/minimal in pane captures
- likely still working or not yet emitting enough output to show in tail captures

### Hermes
- sessions launched successfully
- at least one loaded `writing-plans`
- one showed a skill initialization error for `software-development:writing-plans` in the pane capture, so follow-up review may be needed if output file is missing

### Codex
- sessions launched successfully
- current environment is showing sandbox-related shell failures like:
  - `bwrap: loopback: Failed RTM_NEWADDR: Operation not permitted`
- Codex appears to be adapting and continuing with non-shell/file-native approaches where possible

## Output targets

Each agent was instructed to write to:
- `workspace/shared/actors/<agent-id>.md`

Optional handoffs:
- `workspace/shared/handoffs/<agent-id>--handoff.md`

## Next operator actions

1. Check actor output files for actual written results.
2. Re-capture tmux panes after more time if outputs are still missing.
3. If Codex sessions stall on sandboxing, relaunch some assignments under Claude or Hermes.
4. Synthesize outputs into a shared swarm summary once enough agents report back.
