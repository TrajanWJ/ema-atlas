---
title: Agent OS Talk — currentChannel String vs Numeric ID Bug
created: '2026-03-26'
updated: '2026-03-26'
type: agent-learning
status: active
tags:
  - agent-os
  - bug
  - talk-page
  - discord
  - channel-id
  - javascript
wiki_id: agent-learnings/agent-os-talk-channel-id-bug
imported_from: vault/Agent-Learnings/agent-os-talk-channel-id-bug.md
imported_at: '2026-04-04T00:23:56.591Z'
summary: ''
---

# Agent OS Talk — currentChannel String vs Numeric ID Bug

> **Pattern:** Recurring navigation bug where `currentChannel` retains a string name (e.g. `"concierge"`) instead of resolving to the numeric Discord channel ID. Causes Talk page failures.

## The Bug

In `app.js`, `currentChannel` is initialized as a string name:

```js
let currentChannel = 'bridge'; // or 'concierge', etc.
```

When the user navigates to the Talk page, the channel ID comparison fails because `DC_CHANNELS` and the Discord API both expect **numeric string IDs** (e.g. `"1484411982487490701"`), not human-readable channel names.

### Symptoms
- Talk page loads but shows no messages
- `#bridge` or `#concierge` shown in header but messages don't load
- Sending a message silently fails or posts to wrong channel
- WebSocket renders zero messages on first load

### Root Cause

`currentChannel` holds a **human-readable name** from initialization or old routing state, but API calls and channel comparisons need the **numeric Discord channel ID**.

Bridge.js had a guard for this:
```js
if (!/^\d+$/.test(currentChannel)) {
  // auto-switch on Talk navigation
}
```
But this only runs on navigation, not on first load if Talk is already active.

## The Fix

Resolve `currentChannel` to its numeric ID at assignment time:

```js
// Instead of: currentChannel = 'concierge';
// Do: 
const realId = CHANNEL_IDS_LIVE['concierge'] || currentChannel;
currentChannel = realId;
```

Or ensure initialization always sets a numeric ID:
```js
// On startup, default to first real channel ID, not a name
let currentChannel = null; // then auto-select first real channel on Talk open
```

## Sessions Where This Appeared

- `5bd221c2` — Talk page overhaul (2026-03-20)
- `de099a4f` — Removing `hidden` when activating Talk (2026-03-20)
- Multiple other sessions — recurring pattern across Agent OS development

## Related

- [[Agent-OS-Frontend]] — Parent project
- [[Agent-OS-Live-Bridge]] — Bridge server channel resolution
