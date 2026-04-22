---
title: "Voice Model Selection — Sonnet for Speed"
created: 2026-03-31
updated: 2026-03-31
type: decision
status: active
tags: [voice, model-selection, performance, openclaw, tts]
related: ["[[Voice Interaction Design]]", "[[EMA Claude Bridge Design]]"]
---

# Voice Model Selection

## Decision

Use **claude-sonnet** (not opus) as the default model when Right Hand is operating in voice/real-time contexts.

## Rationale

Voice sessions have strict latency requirements that Opus cannot reliably meet:

- **Opus latency:** Too slow for real-time voice — perceived response lag breaks the conversational flow
- **Sonnet latency:** Fast enough for voice — responses arrive before the user expects to hear audio
- **Quality delta:** For voice use cases (short exchanges, task dispatch, quick answers), Sonnet and Opus produce nearly identical useful output

## Context

This decision emerged from voice pipeline work on March 31, 2026. The TTS pipeline (Edge TTS `en-US-AndrewMultilingualNeural`) is fast — the bottleneck is inference time, not synthesis. Sonnet closes that gap.

## Implementation

- Per-session model override: set `model = sonnet` when routing through voice channels
- Default (non-voice) sessions remain on Opus for quality
- Applies to: Discord voice, any real-time interactive sessions

## Related Decisions

- [[Voice Interaction Design]] — comprehensive guide to voice patterns, silence handling, tool narration
- Edge TTS rate: consider `+5%` to `+10%` speed bump for slightly faster playback (untested)

## Open Questions

- Should Haiku be evaluated for ultra-fast voice use cases (sub-1s responses)?
- What's the actual P50/P95 latency delta between Sonnet and Opus in practice? Worth profiling.
