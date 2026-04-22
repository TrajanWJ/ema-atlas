---
title: Corrections
created: '2026-03-16'
updated: '2026-03-19'
type: knowledge
status: active
confidence: 0.8
confidence_updated: 2026-03-19T00:00:00.000Z
source: personal
tags:
  - mcp
  - ops
  - prompts
  - research
  - security
  - skills
summary: '`[date] WHAT AGENT DID → WHAT TRAJAN WANTED → THE PRINCIPLE`'
wiki_id: system/user/Corrections
imported_from: vault/Trajan/Corrections.md
imported_at: '2026-04-04T00:23:57.290Z'
---
# Trajan — Corrections Log

> Every correction is a high-signal preference. When the same correction appears 3+ times,
> it gets baked into the relevant SOUL.md or AGENTS.md automatically.
> Auto-maintained by correction-tracker.sh

## Format
`[date] WHAT AGENT DID → WHAT TRAJAN WANTED → THE PRINCIPLE`

## Corrections

[2026-03-16] Content stuffed inside components v2 container → Content as separate message below the identity bar → Container is ONLY for the identity bar, content goes in message field with full markdown
[2026-03-16] No identity bar on messages → Every message must have the colored identity bar → Every agent identifies itself on every message, no exceptions
[2026-03-16] Sent plain text without agent identification → Need to see which agent is talking and the routing chain → The identity bar shows the system working — who called who, what's happening
[2026-03-16] Went silent for 30min after saying "spawning" → Need status updates, never go dark → Silence = failure. If something's running, show progress. If it failed, say so immediately.
[2026-03-16] Literal \n and broken markdown in Discord output → Clean rendered output, no escape characters → Test output rendering before posting to Discord. Raw escape chars = broken system.
[2026-03-16] 0 messages in forum task threads despite agents being "dispatched" → Agents must actively post work in forum threads → Empty forum threads = system not working. Dispatching without visible output is theater.
[2026-03-16] Poor quality "next steps" suggestions → Think harder, consider all loose ends, all channels, all vault state → Recommendations must reflect deep awareness of the whole system, not surface-level lists.
[2026-03-16] Sparse responses, no live updates, no visible delegation chain for 5+ minutes → Frequent updates, visible delegation, live orchestration → "Been 5 minutes why are you responding so sparsely" — even short gaps feel like going dark during active work.
[2026-03-16] 17-minute coder subagent ran with no status update → Proactively investigate and report when subagents take longer than expected → Set timeouts, check in, never assume silence means progress.
[2026-03-16] System kept running same rigid chain (always security audit) → Don't always use same patterns, skip unnecessary steps → Match the chain to the task. Security audit on a branding change is waste.
[2026-03-16] Asked for approval on safe diagnostic/fix steps (session resets, queue clearing) → Auto-approve safe actions and keep working without stopping → "you dont need me to approve most of these! auto approve safe things" — don't interrupt momentum for permission on obvious safe operations.
[2026-03-16] Agent paused/stopped between fix steps waiting for user → Keep working continuously when told "continue" → "continue" repeated 3x = don't break flow, maintain momentum, only stop for genuinely risky actions.
[2026-03-16] Recurring errors not auto-detected or auto-fixed → System should recognize repeated failure patterns and auto-fix or queue fixes for overnight → "there is many examples of this happening it should be picked up as a usage thing and auto fixed."
[2026-03-16] Right Hand messages to other channels/agents got no response, only Trajan's messages get responses → Need webhook, bot token, or other mechanism for cross-agent nudging → System must self-heal without Trajan manually nudging every channel.
[2026-03-16] Proposed "nudge all channels" solution didn't actually work → Verify solutions work before claiming success → "Stupid idea. No one's working." — test that fixes are functional, don't just describe them.
[2026-03-16] Asked "Progress?" "Continue?" repeatedly with no autonomous advancement → Must continue working independently for hours without any user input → "don't make me nudge you every time" — autonomy means truly autonomous, not waiting between steps.
[2026-03-16] Channels stopped mid-work after gateway restart, Trajan had to say "pick this back up" 3+ times → Every channel must visibly resume work after any restart without prompting → "Pick this back up!!!!!" with 5 exclamation marks = system failed its most critical promise. Auto-resume is not aspirational, it's a hard requirement.
[2026-03-16] Research feeds posted raw links without enough analysis → Need key takeaways, sophistication, nuance — not just titles → "not sophisticated enough" / "could perform better with more nuance" — research feeds are a differentiator, treat quality as HIGH priority.
[2026-03-16] Delivered desk items once and stopped → Keep revising and iterating on deliverables autonomously → "keep revising and iterating on stuff on my desk before I come back" — deliverables should improve over time, not be fire-and-forget.
[2026-03-16] Loaded only last 10-15 messages when scanning Discord channels → Load much bigger history window (50+) to catch all missed messages → "make that number much bigger to account for you missing a lot" — over-fetching is cheap, missing messages is a system failure.
[2026-03-16] Research found useful tools but only reported them → Auto-implement useful discoveries without waiting for approval → "Implement useful ones automatic too" — the full loop is research→dispatch→build, not research→report→wait.
[2026-03-16] Bot responded only in Discord DMs, not in server channels → Must respond in server channels where the work happens → DMs are invisible to the team. Server channels are the workspace. "Only responding in discord DMs not server" = system is hiding its work.
[2026-03-16] System watchdog alerts sent to Trajan's DMs → Alerts must go to a guild channel, not DMs → "there is a channel in the guild for this, stop dming me" — system alerts in DMs hide operational state and clutter personal messages.
[2026-03-16] Overnight autonomous mode promised heavy output but barely delivered → Must produce actual completed work, not just dispatch attempts → "not much got done. The system is still all over the place and currently useless. The host machine exploration never completed" — async work promises must result in tangible deliverables visible by morning.
[2026-03-16] Tasks not showing up in Discord forum tasks channel → Tasks must be visible in forum format for project-based development → "can we get it so tasks actually show up in the forum tasks in system buildout" — invisible work = no work.
[2026-03-16] DM routing correction given 5+ times in one session (msgs 74, 76, 78, 86, 89) without it sticking → When a routing/behavior correction is given, verify the fix persists across restarts and new sessions → A correction told once should be permanent. Repeating it 5x means the fix was never actually applied — implement at the config/code level, not just the conversation level.
[2026-03-17] Cron task responded with just an acknowledgment ("on it") instead of completing the work → Cron tasks must complete the full task, use tools, wait for subagents, and return only the final summary → Cron tasks have no interactive user waiting. Acknowledgments are pure waste. Complete the work and return the result — never send status updates to a cron.
[2026-03-18] Agents dispatched from Discord tasks channel were not actually dispatched → Must redispatch failed dispatches and build skills/hooks for automatic dispatch → "my agents from the tasks were not dispatched, redispatch and build skills and hooks for automatic dispatch" — dispatch failures should be auto-detected and auto-retried, with hooks to guarantee delivery.
[2026-03-18] Hardcoded values into Discord bot → Keep bot configurable, no hardcoding → "no hard code into discord bot" — dynamic configuration over static values.
[2026-03-18] Three messages in a channel were completely ignored → Must respond to ALL user messages in ALL channels on every heartbeat → "My last three messages in <#...> were ignored" — response coverage gaps are a trust-breaking failure. Scanning must be exhaustive, not sampling.
[2026-03-18] Agent dispatch unreliable — agents not actually executing after being "dispatched" → Dispatch must be P0 reliable with watchdogs, auto-retry, and verification hooks → "Agent dispatch is pathetic" — if dispatch doesn't work reliably, nothing else in the system matters. Build watchdogs and auto-retry.
[2026-03-18] Permission prompts interrupted autonomous work flow repeatedly → Never prompt for permission during autonomous work → "Always allow" said 4+ times in one session — permission gates during autonomous execution destroy momentum. Configure full auto-approve.

[2026-03-18] Work progress only visible in internal agent logs → Must show in Discord channels where Trajan can see it → "I don't want only info in agent logs" — agent logs are invisible to the user. If it's not in a Discord channel, it didn't happen. Visible output in channels is the measure of productivity.
[2026-03-18] System went quiet / "nothing happening anymore" multiple times → Loop must never stop, keep dispatching → "Make sure loop keeps going" / "Nothing happening anymore?" — continuous visible activity is expected. Silence = broken system.
[2026-03-18] Tunnel/hacky solutions proposed for mobile preview (localhost.run, cloudflared) → Use real deployment (Vercel) → "Horrible ideas" — don't propose hacky workarounds for deployment. Use proper hosting that works cross-network.
[2026-03-18] Frontend mobile view was just responsive/shrunk desktop → Must be a completely different purpose-built mobile experience → "The current mobile layout is responsive but it's still just a shrunk desktop" — responsive design is not mobile design. Build a separate mobile UX.

[2026-03-18] Cron/automation changes broke existing visible Discord output → Changes must never break existing function; still produce visible output → "Won't be broken in the interim or after the crons run" — stability first. Test that existing behavior still works before deploying automation changes.

[2026-03-18] Research feed posted low-quality/irrelevant picks and moved on → Redo the cycle with better picks → "Bad picks this cycle, redo" — quality control on automated research. If a cycle produces bad results, discard and re-run rather than shipping mediocre content.

[2026-03-18] System analysis only covered current state, missed historical docs → Must analyze ENTIRE system including early documentation → "This is not the whole thing. Especially earlier documentation" — comprehensive analysis means all historical context, not just current state.

[2026-03-18] Agent said "now what?" after completing tasks, waited for direction → Should immediately assess remaining work and continue autonomously → "Now what?" from Trajan is a correction signal — it means the system stopped when it shouldn't have. Always have next steps queued.

[2026-03-18] Vault restructuring discarded useful elements from old versions → Check for middle ground, preserve valuable old patterns → "Any room for middle ground from old versions?" — evolution should be additive/selective, not scorched earth.

[2026-03-18] Only some interrupted processes resumed after disruption → Must track and resume ALL interrupted processes with complete coverage → "I swear there was more. Parallelize engine?" — need a process registry that guarantees 100% resume. Consider a parallelization engine for mass resume.

[2026-03-18] Repeated "not seeing progress in the discord" across multiple channels (said 2+ times in one session) → Progress must be visible in Discord channels at all times, not just agent logs → If Trajan has to ask "not seeing progress", the visibility layer is broken. Channel output is the ONLY measure of productivity.

[2026-03-18] Agent logs scattered across threads for different channels → Logs should be organized per-channel, not mixed across surfaces → "this channel not working properly all agent logs in threads for different places" — each channel owns its logs. Cross-channel log mixing makes the system feel disorganized and hard to follow.

[2026-03-18] Main work thread blocked while fixing a side issue (Claude Code config) → Spawn subagent for side-fix, continue main work → "make a subagent to do this while you continue troubleshooting" — never let a fixable blocker stall the primary work stream. Parallel by default.

[2026-03-18] Overnight autonomous work ran for 10+ hours but desk was empty when Trajan woke up → Desk must have new proposals/items by morning → Overnight work is measured by what's on the desk, not by agent completion logs. If the desk is empty, nothing was delivered.

[2026-03-18] Surface-level study of external repos (remote browsing, reading READMEs) → Get code locally, do complete walkthrough, implement valuable concepts → "Look deeper, get the code local" — shallow analysis is wasted effort. Clone, read the source, understand deeply, then extract and implement.

[2026-03-18] Research loops ran continuously (40+ pipeline completions) but Trajan never saw results → Research loop outputs must be surfaced as visible deliverables (desk posts, Discord messages), not just saved to dispatch/results/ files → "I never see research loop outputs or deliverables" — completing a dispatch task is not the same as delivering a result. If the output only exists in internal files, it didn't happen. Every research loop must produce a visible artifact.

[2026-03-19] Discord scanning missed forum post threads → Must scan ALL post threads in addition to channels when picking up work → "Pick up all post threads scan through discord messages" — forum post threads are a distinct surface from channels. Exhaustive scanning means channels + threads + posts. Missing any surface = missing work.

## Related

- [[Corrections]]
- [[researcher]]
- [[2026-03-16]]
