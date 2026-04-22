# LCM Summary sum_7c4d9d22d6aeebfd

Created: 2026-03-20 07:51:34
Kind: leaf
Depth: 0
Conversation: 659
Tokens: 740
Descendants: 0
Earliest: 2026-03-20T07:41:15.000Z
Latest: 2026-03-20T07:41:16.000Z

## Content

[2026-03-20 07:41 UTC]
// ═══════════════════════════════════════════════════════════

// Store original switchChannel to chain
const _origSwitchChannel = typeof switchChannel === 'function' ? switchChannel : null;

// Override switchChannel to load real messages
if (typeof window !== 'undefined') {
  const _realSwitchChannel = window.switchChannel;
  window.switchChannel = function(chId) {
    // Call original to handle UI state (active classes, header, etc.)
    if (_realSwitchChannel) _realSwitchChannel.call(this, chId);
    
    // Always try to load real messages for numeric channel IDs
    // (Bridge auto-connects on page load if configured, and channels are real IDs now)
    if (/^\d+$/.test(chId)) {
      if (Bridge.liveMode) {
        loadLiveMessages(chId);
      } else if (Bridge.isConfigured()) {
        // Try connecting first, then load
        Bridge.checkHealth().then(ok => {
          if (ok) { Bridge.connect(); bridgeGoLive(); }
        });
      }
    }
  };
}

async function loadLiveMessages(channelId) {
  const container = document.getElementById('messages-list');
  if (!container) return;

[437 more lines in file. Use offset=390 to continue.]

[2026-03-20 07:41 UTC]
OK so there's already a hook at line 367. Let me check if my second hook at 468 is redundant and causing issues:

[2026-03-20 07:41 UTC]
      desc: msg.embeds[0].description || '',
      color: msg.embeds[0].color ? `#${msg.embeds[0].color.toString(16).padStart(6,'0')}` : '#D4A574',
    } : null,
    attachments: msg.attachments || [],
    // Extra metadata for display
    _authorName: authorName,
    _authorAvatar: msg.author?.avatar ? `https://cdn.discordapp.com/avatars/${msg.author.id}/${msg.author.avatar}.png?size=40` : null,
    _isBot: isBot,
  };
}

// ═══════════════════════════════════════════════════════════
// HOOK: Send message — Use bridge when live
// ═══════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════
// HOOK: Switch channel — Load live messages when bridge is active
// ═══════════════════════════════════════════════════════════

if (typeof window !== 'undefined' && typeof window.switchChannel === 'function') {
  const _realSwitchChannel = window.switchChannel;
  window.switchChannel = function(chId) {
    _realSwitchChannel.call(this, chId);
    // After mock render, overlay with live data if bridge is active
    if (Bridge.liveMode && /^\d+$/.test(chId)) {

[350 more lines in file. Use offset=487 to continue.]

[2026-03-20 07:41 UTC]
There it is — double hook. The second one at line 482 wraps the already-wrapped version from line 367. That's not necessarily broken (it chains), but the real issue is that `item.onclick = () => switchChannel(ch.id)` in app.js calls the *function-scoped* `switchChannel`, not `window.switchChannel`. Overriding `window.switchChannel` doesn't change 
[LCM fallback summary; truncated for context management]
