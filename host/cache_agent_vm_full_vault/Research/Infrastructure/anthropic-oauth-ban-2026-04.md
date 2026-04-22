---
title: "Anthropic OAuth Ban — April 2026 Research"
created: 2026-04-04
updated: 2026-04-04
type: research
status: active
urgency: high
tags: [anthropic, oauth, openclaw, infrastructure, risk]
---

# Anthropic OAuth Ban — April 2026

> **Researched:** 2026-04-04 ~03:10 UTC by Right Hand (urgent 20-min time-box)
> **Verdict: Likely false alarm / community speculation — but get an API key anyway as insurance**

## What Was Claimed

HN thread "Tell HN: Anthropic no longer allowing Claude Code subscriptions to use OpenClaw" (item 47633396) claimed Anthropic is banning OAuth-based third-party harness usage, effective 12pm PT April 4, 2026.

Dispatch task sourced from this thread with URGENT framing and 12pm PT deadline.

## Evidence Assessment

### Against "real policy change"

1. **No official Anthropic announcement** — anthropic.com/news shows nothing related. Latest news is Claude Opus 4.6 (Feb 5 2026). No blog post, press release, or ToS update about third-party OAuth.

2. **Status page is clean** — status.claude.com shows all systems Operational for April 4. No maintenance windows, no policy enforcement events scheduled.

3. **AUP has no such restriction** — Checked anthropic.com/legal/aup. No clause about third-party harnesses or autonomous agents being banned via OAuth. The AUP covers illegal use, security attacks, etc. — not tool categories.

4. **OpenClaw docs are silent** — docs.openclaw.ai has no migration guide, no announcement, no "important notice" about OAuth changes.

5. **HN post is community-sourced** — "Tell HN" format = user submission, not Anthropic. Comments in thread debate subscription economics, no one cites an official Anthropic source. Pure community speculation thread.

6. **"12pm PT today" deadline is a red flag** — Fabricated urgency with a specific time is a hallmark of misinformation or panic. Real policy changes get blog posts days/weeks in advance.

7. **It's the day after April Fools** — Thread timing (April 2-4) coincides with April 1. Could be a prank post that propagated.

### For "might be real"

1. Thread exists and has real engagement — people are genuinely worried about it
2. Anthropic HAS historically locked down OAuth abuse (rate limits, user-agent checks)
3. Business incentive exists (keeping users on Claude.ai vs. OpenClaw)
4. **Our `.dispatch-env` key was already stale** — possibly related (agents started failing, someone assumed policy enforcement)

## Most Likely Explanation

The stale `.dispatch-env` API key (fixed ~03:05 UTC today) caused all agents to fail with "Invalid API key." Someone may have encountered similar failures, assumed it was a policy enforcement action, and posted to HN. The thread amplified into perceived "imminent ban."

**No evidence of a real Anthropic policy change effective today.**

## Current Trajan Setup Risk

- All agents use OAuth tokens (sk-ant-oat01-...) via oauth-guardian
- These are Claude Max subscription tokens, NOT API keys
- OAuth tokens ARE technically against the spirit of Anthropic's intended use (API key users vs. subscription users)
- Real risk: Anthropic COULD enforce this at any time — just not evidenced for today

## Recommendation

**Short-term (this week):** No action needed. Current setup is working post-.dispatch-env fix.

**Medium-term (insurance):** Get an Anthropic API key (sk-ant-api03-...) as a backup provider slot in OpenClaw. Cost: ~$20-50/month at current usage levels. Provides:
- Immunity to any future OAuth policy enforcement
- No subscription sharing concerns
- Direct, legitimate API access

**Do NOT migrate to SiliconFlow** based on this scare — SiliconFlow research was not completed but it's an indirect provider with its own risks. Anthropic API keys are the clean solution if needed.

**Add to openclaw.json:** A second `anthropic-api` provider entry with a real API key, configured as fallback. Then if OAuth gets blocked, one config line change swaps to it.

## Action Items

- [ ] Get Anthropic API key from console.anthropic.com (low urgency, this week)
- [ ] Add as backup provider in openclaw.json with low priority
- [ ] Monitor HN thread for any official Anthropic confirmation
- [ ] Watch oauth-guardian logs for any auth rejections with new error patterns

## Links

- HN thread: https://news.ycombinator.com/item?id=47633396
- Anthropic status: https://status.claude.com/
- Anthropic AUP: https://www.anthropic.com/legal/aup
- Anthropic news: https://www.anthropic.com/news
