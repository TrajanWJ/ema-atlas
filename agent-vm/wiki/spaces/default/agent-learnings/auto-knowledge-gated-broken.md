---
type: agent-learning
source: overnight-ops-report
captured: 2026-04-03T10:46:00.000Z
tags:
  - auto-knowledge
  - cron
  - ops
  - broken
  - observability
wiki_id: agent-learnings/auto-knowledge-gated-broken
imported_from: vault/Agent-Learnings/auto-knowledge-gated-broken.md
imported_at: '2026-04-04T00:23:56.593Z'
summary: ''
---

# auto-knowledge-gated Cron — Broken (Usage API Failure)

## Status
🔴 **Non-functional** — has been failing consistently. Auto-knowledge extraction is completely offline.

## Symptom
```
Could not get usage data
```
Logged by `auto-knowledge-gated.sh` on every run. The script cannot retrieve usage data needed to gate whether capture should run.

## Root Cause (Suspected)
The script checks Claude API usage data (likely token usage or quota endpoint) before deciding whether to run a capture. That endpoint is either:
- Unreachable from agent-vm
- Requires an API key that's stale or missing
- Hitting a quota/auth issue

## Impact
- `~/skills/auto-knowledge/scripts/capture.sh` runs fine when called directly (queue-based flow works)
- The **gated** variant — which is supposed to run automatically — is silently failing
- Net effect: no automated knowledge capture is happening unless triggered manually or via cron that calls `capture.sh` directly

## Investigation Steps
1. Read `auto-knowledge-gated.sh` to find which usage endpoint it calls
2. Check if the API key it uses matches what's in the current OAuth Guardian state
3. Test the endpoint manually: `curl` the usage URL with current auth headers
4. If endpoint is unreachable, either fix auth or replace the gate logic

## Fix Options
- **Option A:** Fix the auth/endpoint issue so the gate works as designed
- **Option B:** Bypass the gate — replace `auto-knowledge-gated.sh` with a direct call to `capture.sh` in cron (simpler, no usage check)
- **Option C:** Replace the usage-based gate with a simpler time-based gate (run capture if last run was >N hours ago)

## Related
- [[Agent-Learnings/patterns.md]]
- Overnight ops report: 2026-04-02/2026-04-03
- [[Inbox/2026-04-01 agents-observe Claude Code Observability.md]]
