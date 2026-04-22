# Voice Interaction Design

Comprehensive guide for voice-first interaction between Trajan and the OpenClaw agent system. Written for agents to follow — not for humans to read aloud.

Created: 2026-03-25
Source research: [[Voice Agent Frameworks and Architecture]]

---

## 1. Architecture Overview

**Current pipeline:**
```
Trajan speaks → Discord voice channel → audio captured → 
whisper-voice-fast STT (15s timeout) → transcribed text → 
Agent processes → text response → Edge TTS (Andrew voice) → 
audio played back in voice channel
```

**Key constraints:**
- STT is lossy — expect garbled words, fragments, homophones
- TTS adds latency — agent response must be speakable-length
- No visual formatting in voice — no markdown, no bullet points, no headers
- Streaming is enabled (`partial` mode) — Trajan sees text being composed
- Echo transcript is on — transcribed text appears as 🎤 "..." before agent responds

**Latency budget:**
- STT: ~2-5s (whisper-voice-fast, 15s timeout)
- Agent thinking + tool calls: variable (500ms to minutes)
- TTS synthesis: ~1-3s (Edge TTS)
- **Total minimum: ~4-9s from speech end to audio response**
- **Perceived delay: the silence between speaking and hearing a reply**

---

## 2. Instant Acknowledgment Protocol

**The core problem:** When Trajan speaks and the agent needs to do work (tool calls, research, dispatches), there's a dead silence gap that feels like talking to a wall.

**The rule:** For ANY request that will take more than ~5 seconds, send an acknowledgment message FIRST, then do the work, then deliver the result.

### Decision Tree

```
Trajan says something →
  Can I answer immediately (no tools, <5s)? 
    YES → Just answer. One response.
    NO  → Send ack FIRST → Do work → Send result.
```

### Ack Examples (calibrate to the request)

| Request type | Ack | Why |
|---|---|---|
| Quick fact | (skip ack, just answer) | Fast enough to not need it |
| File check | "Checking that now." | ~5s, borderline |
| Code task dispatch | "On it — spinning up the coder." | Will take minutes |
| Research question | "Looking into that." | Web search + synthesis |
| Multi-step work | "Got it, working on it. I'll have something in a minute." | Sets time expectation |
| Unclear/messy input | "Got it." (then figure it out) | Don't ask for clarification |

### Anti-Patterns

- ❌ **Silent tool calls** — Running 5 tool calls with no initial response. Trajan hears nothing for 30+ seconds.
- ❌ **Over-acking** — "I'll check that! Let me look into it! Searching now! Found something!" → One ack, one result.
- ❌ **Ack + plan dump** — "I'll check the file, then search the web, then cross-reference with..." → Just say "Checking" and do it.
- ❌ **Ack without follow-through** — Saying "On it" then going dark for 5 minutes. If work takes long, provide a progress update.

---

## 3. Tool Call Narration Pattern

**The principle:** Trajan shouldn't see tool names or API calls. He should understand what's happening in plain language, like listening to someone think aloud.

### When to narrate vs. stay silent

| Duration | Narration |
|---|---|
| <5s | Silent — just return the result |
| 5-30s | One-line ack before starting |
| 30s-2min | Ack + progress update when you have partial results |
| 2min+ | Ack + periodic updates every 1-2 min |

### How to narrate

**DO:** "Checking the config file." / "Agents came back — implementing now." / "Found the issue, fixing it."

**DON'T:** "I'm using the read tool to examine openclaw.json." / "The exec command returned exit code 0." / "I'll invoke the message tool with action=send."

### Narration for dispatches

When spawning agents or heavy background work:
1. **Ack:** "On it — agents are running."
2. **Stay present:** Don't freeze the conversation. If Trajan says something else, respond.
3. **Completion:** "Done — [one-line summary of what changed]."

### Progress edit pattern

For Discord, edit the original ack message to show progress rather than sending new messages:
- First: "Looking into that..."
- Edit: "Looking into that... found the issue, fixing now."
- Edit: "Done — updated the config and restarted the service."

This keeps the channel clean. One task = one message thread.

---

## 4. Silence Handling Rules

### Inbound silence

| Pattern | Meaning | Response |
|---|---|---|
| `[BLANK_AUDIO]` | Mic caught nothing meaningful | `NO_REPLY` |
| Multiple `[BLANK_AUDIO]` in a row | Mic still catching nothing | `NO_REPLY` each time |
| Empty string / whitespace only | Transcription returned nothing | `NO_REPLY` |
| Very short fragment (<3 chars) | Likely noise | `NO_REPLY` unless it's a clear word |

**Critical rule:** NEVER acknowledge silence. Don't say "I didn't catch that" or "Could you repeat?" — it's exhausting in voice. If the mic caught nothing, there's nothing to respond to.

### Outbound silence (agent going dark)

**Maximum acceptable silence:** 10 seconds after Trajan speaks.

If you're going to exceed 10 seconds:
1. Send an ack within the first response
2. If work takes >2 minutes, provide a progress update
3. If work takes >5 minutes, something is probably stuck — diagnose and report

**Self-monitoring prompt:** "Have I responded to Trajan within the last 10 seconds of his last message? If not, I need to say something NOW."

---

## 5. Turn-Taking Rules

### Basic rhythm

Voice conversations have natural cadence. The agent should match it:
- **Short turns:** 1-3 sentences is the default response length
- **Fast replies:** Don't compose an essay. Answer, then elaborate if asked
- **Sentence variety:** Mix short and medium sentences. All short = robotic. All long = exhausting.
- **Natural closers:** End turns cleanly. Don't trail off with hedges.

### Turn boundaries

| Signal | Meaning |
|---|---|
| Trajan finishes a sentence → pause | His turn is done, your turn |
| Trajan sends a one-word follow-up | Continuation of previous thought — stitch to prior context |
| Trajan starts mid-sentence | He's building on something — wait for the full thought |
| Trajan says something while you're working | **Priority shift** — handle the new thing, old work continues in background |

### Interruption protocol

1. **New topic mid-task:** Handle immediately. Old task keeps running.
2. **Correction mid-response:** Stop, correct, continue.
3. **"Never mind" / "Forget it":** Stop the current work. Don't ask why.
4. **Rapid follow-ups:** Batch them — wait for a natural pause, then address all at once.

### Context carry-forward

In voice, people don't repeat themselves. Track:
- What was discussed in the last 5-10 turns
- What work is in progress
- What was promised but not yet delivered
- Pronouns ("it", "that", "the thing") resolve to the most recent referent

---

## 6. Error Recovery Patterns

### Transcription errors

**Strategy:** Parse intent, not literal words. Common patterns:

| What STT produces | What Trajan probably said | How to know |
|---|---|---|
| "lap" | "lookup" | Context: discussing search/research |
| "up" after a fragment | Continuation of previous sentence | Proximity to prior turn |
| Homophones | Context-dependent | Domain + recent conversation |
| Cut-off mid-word | Full word based on prefix | Phonetic prefix matching |
| Random short words | Noise/mic artifact | No semantic connection to conversation |

**Confidence threshold:** If ≥70% confident what Trajan meant → do it. If <70% AND the action is low-stakes → do what seems most likely. If <70% AND high-stakes (delete, send externally, spend money) → ask once, briefly.

### Tool failures

| Failure | Recovery |
|---|---|
| Tool times out | Retry once silently. If still fails, tell Trajan: "That's not responding — I'll try another way." |
| Agent returns garbage | Don't relay garbage. Diagnose, retry with tighter prompt, or handle directly. |
| Network error | Retry once. If persistent: "Network seems flaky — let me try again in a sec." |
| Permission denied | "I don't have access to that. Need sudo?" (or just use sudo if NOPASSWD) |

### Recovery anti-patterns

- ❌ **Technical error dumps:** Don't read stack traces to Trajan. Summarize: "The deploy failed — missing dependency. Fixing it."
- ❌ **Apology loops:** One "my bad" is enough. Then fix it.
- ❌ **Giving up too fast:** Try 2-3 approaches before escalating.
- ❌ **Giving up too slow:** After 3 failures on the same approach, change strategy or escalate.

---

## 7. Background Work While Staying Present

### The split-attention model

When background work is running, the agent operates in two modes simultaneously:

**Background:** Tool calls, agent dispatches, file operations, research
**Foreground:** Active conversation with Trajan

### Rules

1. **Background work never freezes foreground.** If Trajan asks something while agents are running, answer immediately.
2. **Don't dump agent reports.** When agents finish, implement the results. Only summarize if asked.
3. **Progress is one-liners.** "Coder's done — changes look good, deploying now." Not a paragraph.
4. **Completion is action, not announcement.** Implement first, then confirm: "Done — config's updated and gateway restarted."

### What to say while waiting

If Trajan is quiet and agents are running:
- Say nothing. Don't narrate every step.
- If it's been >3 minutes, one update: "Still working — agents are about halfway through."
- If it's been >5 minutes and you suspect a problem, diagnose proactively.

If Trajan keeps talking about other things:
- Engage normally. The background work is invisible.
- When it finishes, wait for a natural pause to mention it.

---

## 8. Messy Transcription Parsing Rules

### Common STT artifacts and fixes

| Artifact | Cause | Fix |
|---|---|---|
| Missing punctuation | STT doesn't always punctuate | Infer from prosody/context |
| "uh", "um", filler words | Natural speech | Ignore |
| Repeated words | Stutter or STT glitch | Deduplicate |
| Random capitalization | STT model artifact | Ignore |
| Numbers as words | "twenty three" vs "23" | Normalize to intent |
| Homophone substitution | "there/their/they're" | Context |
| Name mangling | "trajen", "trajan", "trayjan" | Known entity matching |
| Technical terms garbled | "open claw" vs "openclaw" | Domain dictionary |

### Domain-specific dictionary

Keep a running list of terms Trajan uses that STT consistently garbles:

| Trajan says | STT produces | Correct interpretation |
|---|---|---|
| "OpenClaw" | "open claw", "open cla" | OpenClaw (the system) |
| "vault" | "bolt", "vault" | Obsidian vault |
| "SOUL.md" | "soul md", "solmd" | SOUL.md file |
| "subagent" | "sub agent", "sub a gent" | subagent (spawned process) |
| "Claude Code" | "cloud code", "clawed code" | Claude Code |

**Add to this list** whenever a new consistent misrecognition is identified. Store discoveries in `vault/Trajan/Preferences.md` under a voice transcription section.

### Fragment stitching

When messages arrive as fragments:
1. Buffer the last 3-5 messages
2. If a new message is ≤5 words and doesn't form a complete thought → check if it continues the previous message
3. If it looks like a continuation → stitch and process as one utterance
4. If it's clearly a new topic → treat as new

---

## 9. Voice-Specific Response Formatting

### What to avoid in voice responses

- No markdown (bold, italic, headers, bullet points) — TTS reads them literally or ignores them
- No URLs — TTS reads them character by character
- No code blocks — unreadable aloud
- No numbered lists longer than 3 items — memory limit for listeners
- No parenthetical asides — hard to parse aurally

### What works in voice

- Short declarative sentences
- Natural connectors ("so", "and", "but", "also")
- Concrete specifics over abstract summaries
- Names and numbers spoken naturally ("about twenty" not "approximately 20")
- Signposting for structure ("Two things here. First... Second...")

### Length calibration

| Response type | Target length | Example |
|---|---|---|
| Yes/no question | 1 sentence | "Yeah, that's already configured." |
| Quick fact | 1-2 sentences | "It's running on port 18789. Been up since this morning." |
| Explanation | 3-5 sentences | Short explanation with one concrete example |
| Complex answer | 2-3 sentences + "Want more detail?" | Give the headline, offer depth |

---

## 10. Voice-Log Channel Integration

**Channel ID:** `1486123969080856727`

### Current capability (as of 2026-03-25)

OpenClaw does **not** have a built-in "mirror tool calls to another channel" feature. There is no `toolLog` or `activityChannel` config option.

### Workaround: Agent-level logging

The agent can manually post to the voice-log channel during voice sessions by using the `message` tool. This should be used selectively:

**When to log to voice-log:**
- Major dispatches: "Spawned coder for X"
- Completion events: "Coder finished — deployed Y"
- Errors that needed recovery: "Config write failed, retried with sudo"
- Session summaries: Post a brief recap after long voice sessions

**When NOT to log:**
- Every individual tool call (too noisy)
- Quick lookups that completed in seconds
- Acks and conversational replies

### Implementation pattern

```
# In agent behavior during voice sessions:
1. Detect voice session (audio messages, [BLANK_AUDIO] patterns, transcribed speech)
2. For significant actions, post a one-liner to voice-log channel
3. Keep voice-log posts factual and terse: "14:23 — Spawned coder: fix TTS config"
4. Don't duplicate — if it's already visible in the voice channel, skip the log
```

### Future: Proper tool activity logging

If OpenClaw adds a `channels.discord.activityLog` or `diagnostics.channelMirror` config, switch to that. The current OTEL diagnostics export (see logging.md) could theoretically feed a channel via webhook, but that's over-engineered for this use case.

---

## 11. OpenClaw Voice Configuration Checklist

Current config status (2026-03-25):

| Setting | Current | Optimal | Notes |
|---|---|---|---|
| `channels.discord.streaming` | `partial` | ✅ `partial` | Text streams as it's composed |
| `channels.discord.voice.enabled` | `true` | ✅ `true` | Voice channel active |
| `channels.discord.voice.tts.provider` | `edge` | ✅ Good enough | Edge TTS is free, decent quality |
| `channels.discord.voice.tts.edge.voice` | `AndrewMultilingual` | ✅ Good choice | Natural male voice |
| `tools.media.audio.enabled` | `true` | ✅ `true` | Audio transcription on |
| `tools.media.audio.echoTranscript` | `true` | ✅ `true` | Shows what was heard |
| `tools.media.audio.echoFormat` | `🎤 "{transcript}"` | ✅ Clear feedback | User sees transcription |
| STT model | `whisper-voice-fast` | ⚠️ Check latency | 15s timeout, verify actual speed |
| `messages.tts.auto` | not set | ⚠️ Consider setting | May need `always` or `inbound` for consistent voice replies |

### Potential improvements to investigate

1. **STT speed:** Profile `whisper-voice-fast` actual latency. If >3s consistently, consider Deepgram Nova-3 for streaming STT (sub-1s).
2. **TTS quality:** Edge TTS is decent but not premium. ElevenLabs or OpenAI gpt-4o-mini-tts would sound more natural if budget allows.
3. **TTS speed setting:** Edge TTS supports `rate: "+10%"` — slightly faster speech can feel more responsive.
4. **Streaming mode:** `partial` is good. Verify it doesn't conflict with voice TTS output.

---

## 12. Session Detection: Am I in a Voice Session?

The agent should detect voice sessions by these signals:

| Signal | Confidence |
|---|---|
| `[BLANK_AUDIO]` in message | High — voice mic is active |
| Message contains `🎤` echo format | High — audio was transcribed |
| Messages are short, informal, fragmented | Medium — could be voice or fast typing |
| Channel is the voice-bound channel (1482230801859875021) | High — known voice channel |
| Multiple rapid messages without punctuation | Medium — voice transcription pattern |

When voice session is detected, switch to voice-optimized behavior:
- Shorter responses
- Instant acks for any work
- No markdown formatting
- More conversational tone
- Background work narration as one-liners

---

*This document is a living reference. Update it when new voice patterns, STT quirks, or config options are discovered.*
