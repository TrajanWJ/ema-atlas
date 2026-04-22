# LCM Summary sum_7cd8c4228bce38b6

Created: 2026-03-20 09:40:44
Kind: leaf
Depth: 0
Conversation: 748
Tokens: 1215
Descendants: 0
Earliest: 2026-03-20T09:30:38.000Z
Latest: 2026-03-20T09:30:38.000Z

## Content

[2026-03-20 09:30 UTC]
            time: msg.time,
          });
        }
      });
      
      // Flash notification
      if (newMsgs.length > 0 && document.hidden) {
        document.title = `(${newMsgs.length}) Agent OS`;
        setTimeout(() => { document.title = 'Agent OS'; }, 5000);
      }
      break;
    }
    
    case 'message_sent': {
      // Our own message confirmed sent
      console.log('[WS] Message sent confirmed:', data.id);
      break;
    }
    
    case 'queue_answered': {
      console.log('[WS] Queue answer bridged:', data.qId);
      break;
    }
    
    case 'new_event': {
      // Real-time event from EventStore
      const evt = data.event;
      if (currentPage === 'feed') {
        // Prepend to feed
        const feedList = document.getElementById('feed-list');
        if (feedList) {
          const agentColors = { righthand: 'var(--accent)', researcher: 'var(--accent2)', coder: 'var(--green)', ops: 'var(--orange)', devil: 'var(--red)', system: 'var(--text2)' };
          const typeIcons = { task_complete: '✅', task_failed: '❌', queue_answered: '📋', queue_auto_resolved: '🤖', vault_write: '📝', system_alert: '🚨', system_warning: '⚠️', queue_item_created: '❓' };
          const icon = typeIcons[evt.type] || '📋';
          const color = agentColors[evt.agent] || 'var(--text2)';
          const time = new Date(evt.timestamp || Date.now()).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'});
          
          const card = document.createElement('div');
          card.className = 'feed-card';
          card.style.borderLeftColor = color;
          card.style.animation = 'slideIn 0.3s ease';
          card.innerHTML = `
            <div class="feed-card-header">
              <span class="feed-icon">${icon}</span>
              <span class="feed-agent" style="color:${color}">${evt.agent || evt.source || 'system'}</span>
              <span class="feed-time">${time}</span>
              ${evt.severity === 'error' ? '<span class="feed-badge error">ERROR</span>' : ''}
            </div>
            <div class="feed-card-body">${evt.summary || ''}</div>
          `;
          feedList.prepend(card);
        }
      }
      
      // Update notification badge
      if (typeof addNotification === 'function') {
        addNotification(evt.type?.replace(/_/g, ' ') || 'Event', evt.summary?.substring(0, 60) || '', evt.severity === 'error' ? '🚨' : '📋');
      }
      break;
    }
    
    case 'queue_auto_resolved': {
      // Auto-rule resolved a queue item
      toast(`🤖 Auto-resolved: "${data.question?.substring(0, 50)}" → ${data.answer}`, 'info', 4000);
      if (typeof addNotification === 'function') {
        addNotification('Auto-Queue', `Resolved: ${data.question?.substring(0, 40)}`, '🤖');
      }
      // Refresh queue
      loadQueueFromStore();
      break;
    }
    
    case 'queue_item_added': {
      // New queue item from backend
      toast(`❓ New queue item from ${data.item?.agent || 'system'}`, 'info', 3000);
      loadQueueFromStore();
      break;
    }
    
    case 'queue_updated': {
      // Queue state changed (e.g., expiry)
      loadQueueFromStore();
      break;
    }
    
    case 'error': {
      toast('❌ ' + (data.error || 'WebSocket error'), 'error', 3000);
      break;
    }
  }
}

// ── API helpers ───────────────────────────────────────────
async function apiFetch(endpoint) {
  try {
    const res = await fetch('/api/' + endpoint);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (e) {
    console.warn(`[LIVE] API error (${endpoint}):`, e.message);
    return null;
  }
}

async function apiPost(endpoint, body) {
  try {
    const res = await fetch('/api/' + endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    return await res.json();
  } catch (e) {
    console.warn(`[LIVE] POST error (${endpoint}):`, e.message);
    return null;
  }
}

// ── Feed from EventStore ──────────────────────────────────
async function loadFeedEvents() {
  const events = await apiFetch('events?limit=50');
  if (!Array.isArray(events)) return;
  
  // Replace feed cards with real events
  const feedList = document.getElementById('feed-list');
  if (!feedList || currentPage !== 'feed') return;
  
  // Clear simulation cards and add real events
  const realCards = events.map(evt => {
    const agentColors = { righthand: 'var(--accent)', researcher: 'var(--accent2)', coder: 'var(--green)', ops: 'var(--orange)', devil: 'var(--red)', system: 'var(--text2)' };
    const severityIcons = { error: '🚨', warn: '⚠️', info: '📋' };
    const typeIcons = { task_complete: '✅', task_failed: '❌', queue_answered: '📋', queue_auto_resolved: '🤖', vault_wr
[LCM fallback summary; truncated for context management]
