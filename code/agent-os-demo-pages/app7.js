/* Agent OS v7 — app7.js — Unified Integration Layer
 * Wires: inbox→feed, shared state, cross-links, unified nav status, handoffs, cron
 */
'use strict';

// ═══════════════════════════════════════════════════════════
// SHARED STATE — real task data from dispatch/
// ═══════════════════════════════════════════════════════════

let sharedTaskData = { active: [], queue: [], done: [], failed: [], counts: {} };
let sharedAgentStatus = { agents: {}, active_count: 0 };
let sharedStateTimer = null;

async function fetchSharedState() {
  try {
    const [tasks, agents] = await Promise.all([
      Bridge.apiFetch('/api/dispatch/tasks').catch(() => null),
      Bridge.apiFetch('/api/dispatch/agents').catch(() => null),
    ]);
    if (tasks) sharedTaskData = tasks;
    if (agents) sharedAgentStatus = agents;
    updateUnifiedStatusBar();
  } catch (e) {
    console.warn('[SharedState] fetch error:', e.message);
  }
}

function startSharedStatePolling() {
  if (sharedStateTimer) return;
  fetchSharedState();
  sharedStateTimer = setInterval(() => {
    if (!shouldPoll()) return;
    fetchSharedState();
  }, 15000);
}

// ═══════════════════════════════════════════════════════════
// UNIFIED NAV STATUS BAR
// Shows: active agents | queue depth | pending proposals
// ═══════════════════════════════════════════════════════════

function updateUnifiedStatusBar() {
  const activeCount = sharedTaskData.counts?.active ?? sharedAgentStatus.active_count ?? 0;
  const queueCount = sharedTaskData.counts?.queued ?? sharedTaskData.queue?.length ?? 0;

  // Update sidebar agent count (enhance existing)
  const sidebarEl = document.getElementById('sidebar-active-count');
  if (sidebarEl) sidebarEl.textContent = `${activeCount} active`;

  // Update topbar agents
  const topEl = document.getElementById('active-agents-text');
  if (topEl) topEl.textContent = `${activeCount} active`;

  // Update the global status pill in topbar if it exists
  let statusPill = document.getElementById('unified-status-pill');
  if (!statusPill) {
    // Create it in topbar-right if not present
    const topbarRight = document.querySelector('.topbar-right');
    if (topbarRight) {
      statusPill = document.createElement('div');
      statusPill.id = 'unified-status-pill';
      statusPill.className = 'unified-status-pill';
      statusPill.title = 'Active agents | Queue depth | Pending proposals — click for details';
      statusPill.onclick = () => nav('pulse');
      topbarRight.insertBefore(statusPill, topbarRight.firstChild);
    }
  }

  if (statusPill) {
    // Try to get proposal count from badge
    const propBadge = document.getElementById('proposals-badge');
    const propCount = propBadge ? (parseInt(propBadge.textContent) || 0) : 0;

    const parts = [
      { icon: '⚡', value: activeCount, label: 'agents', cls: activeCount > 0 ? 'pill-active' : 'pill-idle' },
      { icon: '📥', value: queueCount, label: 'queued', cls: queueCount > 0 ? 'pill-warn' : 'pill-ok' },
      { icon: '📋', value: propCount, label: 'proposals', cls: propCount > 0 ? 'pill-warn' : 'pill-ok' },
    ];
    statusPill.innerHTML = parts.map(p =>
      `<span class="pill-seg ${p.cls}"><span class="pill-icon">${p.icon}</span><span class="pill-val">${p.value}</span></span>`
    ).join('<span class="pill-div">·</span>');
  }
}

// ═══════════════════════════════════════════════════════════
// INBOX INTEGRATION — real inbox files → feed
// ═══════════════════════════════════════════════════════════

let inboxFeedSeenIds = new Set();
let inboxFeedTimer = null;

async function fetchInboxMessages() {
  try {
    const msgs = await Bridge.apiFetch('/api/inbox/messages').catch(() => []);
    return msgs;
  } catch { return []; }
}

function inboxMsgToFeedItem(msg) {
  return {
    id: 'inbox-' + msg.id,
    type: 'inbox',
    streamType: 'inbox',
    agent: msg.agent || msg.routed_to || 'system',
    title: msg.subject || msg.message || 'Inbox message',
    detail: msg.body || msg.message || '',
    time: msg.timestamp || msg.time || new Date().toISOString(),
    displayTime: typeof formatStreamTime === 'function' ? formatStreamTime(msg.timestamp || msg.time) : '',
    source: 'inbox',
    read: false,
    _inboxContext: msg.context || '',
    _inboxSource: msg.source || '',
    _inboxFull: msg,
    _isInbox: true,
  };
}

async function pollInboxFeed() {
  if (!shouldPoll()) return;
  const msgs = await fetchInboxMessages();
  if (!msgs.length) return;

  let newItems = 0;
  for (const msg of msgs) {
    const feedId = 'inbox-' + msg.id;
    if (inboxFeedSeenIds.has(feedId)) continue;
    inboxFeedSeenIds.add(feedId);

    const item = inboxMsgToFeedItem(msg);
    // Merge into streamItems if available
    if (typeof streamItems !== 'undefined' && Array.isArray(streamItems)) {
      if (!streamItems.find(i => i.id === feedId)) {
        streamItems.push(item);
        newItems++;
      }
    }
  }

  // Re-render if on feed page with new items
  if (newItems > 0 && typeof currentPage !== 'undefined' && currentPage === 'feed') {
    if (typeof renderStreamItems === 'function') renderStreamItems();
  }
}

function startInboxFeedPoll() {
  if (inboxFeedTimer) return;
  pollInboxFeed();
  inboxFeedTimer = setInterval(pollInboxFeed, 20000);
}

// Register inbox rendering in stream
if (typeof STREAM_TYPE_COLORS !== 'undefined') {
  STREAM_TYPE_COLORS.inbox = '#f9c74f';
}
if (typeof STREAM_TYPE_BG !== 'undefined') {
  STREAM_TYPE_BG.inbox = 'rgba(249,199,79,0.12)';
}
if (typeof TYPE_ICONS !== 'undefined') {
  TYPE_ICONS.inbox = '📬';
}
if (typeof TYPE_LABELS !== 'undefined') {
  TYPE_LABELS.inbox = 'inbox';
}

// ═══════════════════════════════════════════════════════════
// CROSS-LINKING — nav helpers
// ═══════════════════════════════════════════════════════════

// Quick-nav to workbench and focus a specific agent
function navToAgent(agentId) {
  if (typeof nav === 'function') nav('workbench');
  setTimeout(() => {
    if (typeof wbSelectAgent === 'function') wbSelectAgent(agentId);
  }, 200);
}

// Quick-nav to missions with a mission highlighted
function navToMission(missionId) {
  if (typeof nav === 'function') nav('missions');
  setTimeout(() => {
    // Try to highlight the mission if renderMissions exposes selection
    const missionEl = document.querySelector(`[data-mission="${missionId}"]`);
    if (missionEl) {
      missionEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      missionEl.classList.add('mission-highlight');
      setTimeout(() => missionEl.classList.remove('mission-highlight'), 2000);
    }
  }, 300);
}

// Quick-nav to vault (mind page) with a search query
function navToVault(query) {
  if (typeof nav === 'function') nav('mind');
  setTimeout(() => {
    const searchInput = document.getElementById('mind-search-input') || document.getElementById('vault-search');
    if (searchInput && query) {
      searchInput.value = query;
      searchInput.dispatchEvent(new Event('input'));
    }
  }, 300);
}

// Add cross-link badges to feed items based on agent/mission
function enrichFeedItemWithLinks(item) {
  if (!item) return '';
  const links = [];

  // Link to workbench agent if agent is known
  if (item.agent && item.agent !== 'system') {
    links.push(`<button class="crosslink-btn" onclick="event.stopPropagation();navToAgent('${item.agent}')" title="View ${item.agent} in Workbench">👁 ${item.agent}</button>`);
  }

  // Link to mission if task has a source
  if (item._taskSource || item.source === 'active_tasks') {
    links.push(`<button class="crosslink-btn" onclick="event.stopPropagation();nav('missions')" title="View in Missions">🎯 Missions</button>`);
  }

  // Link to feed from workbench
  if (item._isInbox) {
    links.push(`<button class="crosslink-btn crosslink-inbox" onclick="event.stopPropagation();nav('inbox')" title="View in Inbox">📬 Inbox</button>`);
  }

  return links.length ? `<div class="crosslink-row">${links.join('')}</div>` : '';
}

// ═══════════════════════════════════════════════════════════
// WORKBENCH CROSS-LINKS — inject mission + vault links into agent panels
// ═══════════════════════════════════════════════════════════

function addWorkbenchCrossLinks() {
  // Add "View Mission" and "View Feed" links to each active agent panel
  const panels = document.querySelectorAll('.wb-panel[data-agent]');
  panels.forEach(panel => {
    if (panel.querySelector('.wb-crosslinks')) return; // already added
    const agentId = panel.dataset.agent;
    const footer = panel.querySelector('.wb-panel-footer');
    if (!footer) return;

    const crossLinks = document.createElement('div');
    crossLinks.className = 'wb-crosslinks';
    crossLinks.innerHTML = `
      <button class="wb-crosslink-btn" onclick="navToMission(null)" title="View agent missions">🎯 Missions</button>
      <button class="wb-crosslink-btn" onclick="navToFeedFilter('${agentId}')" title="View agent feed">📡 Feed</button>
      <button class="wb-crosslink-btn" onclick="navToVault('${agentId}')" title="Find vault notes">🧠 Vault</button>
    `;
    footer.after(crossLinks);
  });
}

// Navigate to feed filtered by agent
function navToFeedFilter(agentId) {
  if (typeof nav === 'function') nav('feed');
  setTimeout(() => {
    // Try to set agent filter
    const filterBtns = document.querySelectorAll('[data-filter-agent]');
    filterBtns.forEach(b => b.classList.toggle('active', b.dataset.filterAgent === agentId));
    if (typeof streamItems !== 'undefined' && typeof renderStreamItems === 'function') {
      renderStreamItems();
    }
  }, 200);
}

// ═══════════════════════════════════════════════════════════
// HANDOFF VISIBILITY
// ═══════════════════════════════════════════════════════════

let handoffSeenIds = new Set();

async function fetchHandoffs() {
  try {
    const handoffs = await Bridge.apiFetch('/api/handoffs').catch(() => []);
    return handoffs;
  } catch { return []; }
}

async function pollHandoffs() {
  if (!shouldPoll()) return;
  const handoffs = await fetchHandoffs();
  if (!handoffs.length) return;

  for (const h of handoffs) {
    const hId = 'handoff-' + h.id;
    if (handoffSeenIds.has(hId)) continue;
    handoffSeenIds.add(hId);

    const item = {
      id: hId,
      type: 'handoff',
      streamType: 'handoff',
      agent: h.from_agent || h.agent || 'system',
      title: `Handoff: ${h.task || h.description || h.id} → ${h.to_agent || '?'}`,
      detail: h.context || h.description || '',
      time: h.created_at || new Date().toISOString(),
      displayTime: typeof formatStreamTime === 'function' ? formatStreamTime(h.created_at) : '',
      source: 'handoff',
      read: false,
      _handoffData: h,
    };

    if (typeof streamItems !== 'undefined' && Array.isArray(streamItems)) {
      if (!streamItems.find(i => i.id === hId)) {
        streamItems.push(item);
      }
    }
  }
}

// ═══════════════════════════════════════════════════════════
// MOBILE NAV — unified core tabs
// ═══════════════════════════════════════════════════════════

function updateMobileNavToUnified() {
  const mobileNav = document.getElementById('mobile-nav');
  if (!mobileNav) return;
  if (mobileNav.dataset.unified) return; // already done

  mobileNav.dataset.unified = '1';
  mobileNav.innerHTML = `
    <button class="mobile-nav-item" data-page="feed" onclick="nav('feed')">
      <span class="mob-icon">📡</span>
      <span class="mob-label">Feed</span>
    </button>
    <button class="mobile-nav-item" data-page="workbench" onclick="nav('workbench')">
      <span class="mob-icon">👁️</span>
      <span class="mob-label">Workbench</span>
    </button>
    <button class="mobile-nav-item" data-page="missions" onclick="nav('missions')">
      <span class="mob-icon">🎯</span>
      <span class="mob-label">Missions</span>
    </button>
    <button class="mobile-nav-item" data-page="mind" onclick="nav('mind')">
      <span class="mob-icon">🧠</span>
      <span class="mob-label">Vault</span>
    </button>
    <button class="mobile-nav-item" data-page="talk" onclick="nav('talk')">
      <span class="mob-icon">💬</span>
      <span class="mob-label">Talk</span>
    </button>
    <button class="mobile-nav-item" data-page="pulse" onclick="nav('pulse')">
      <span class="mob-icon">⚙️</span>
      <span class="mob-label">Pulse</span>
      <span class="mob-badge" id="pulse-mob-badge"></span>
    </button>
  `;
}

// ═══════════════════════════════════════════════════════════
// PATCH NAV — add cross-link injection on workbench
// ═══════════════════════════════════════════════════════════

const _origNav7 = window.nav;
window.nav = function(page) {
  _origNav7(page);
  if (page === 'workbench') {
    setTimeout(addWorkbenchCrossLinks, 500);
  }
};

// ═══════════════════════════════════════════════════════════
// CSS — inject styles for new UI elements
// ═══════════════════════════════════════════════════════════

(function injectApp7Styles() {
  const style = document.createElement('style');
  style.textContent = `
    /* Unified status pill in topbar */
    .unified-status-pill {
      display: flex;
      align-items: center;
      gap: 4px;
      background: rgba(255,255,255,0.06);
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 20px;
      padding: 3px 10px;
      font-size: 11px;
      cursor: pointer;
      transition: background 0.2s;
    }
    .unified-status-pill:hover { background: rgba(255,255,255,0.12); }
    .pill-seg { display: flex; align-items: center; gap: 3px; }
    .pill-icon { font-size: 11px; }
    .pill-val { font-weight: 600; font-size: 12px; }
    .pill-div { color: rgba(255,255,255,0.3); }
    .pill-active .pill-val { color: #a6e3a1; }
    .pill-warn .pill-val { color: #f9c74f; }
    .pill-ok .pill-val { color: rgba(255,255,255,0.5); }
    .pill-idle .pill-val { color: rgba(255,255,255,0.4); }

    /* Cross-link buttons on feed items */
    .crosslink-row {
      display: flex;
      gap: 6px;
      flex-wrap: wrap;
      margin-top: 6px;
      padding-top: 6px;
      border-top: 1px solid rgba(255,255,255,0.06);
    }
    .crosslink-btn {
      font-size: 10px;
      padding: 2px 8px;
      border-radius: 10px;
      border: 1px solid rgba(255,255,255,0.15);
      background: rgba(255,255,255,0.05);
      color: rgba(255,255,255,0.7);
      cursor: pointer;
      transition: all 0.15s;
    }
    .crosslink-btn:hover { background: rgba(255,255,255,0.12); color: #cdd6f4; }
    .crosslink-inbox { border-color: rgba(249,199,79,0.3); color: #f9c74f; }

    /* Workbench cross-links */
    .wb-crosslinks {
      display: flex;
      gap: 4px;
      flex-wrap: wrap;
      padding: 6px 10px 8px;
      border-top: 1px solid rgba(255,255,255,0.06);
    }
    .wb-crosslink-btn {
      font-size: 10px;
      padding: 2px 8px;
      border-radius: 10px;
      border: 1px solid rgba(255,255,255,0.12);
      background: transparent;
      color: rgba(255,255,255,0.55);
      cursor: pointer;
      transition: all 0.15s;
    }
    .wb-crosslink-btn:hover { background: rgba(255,255,255,0.08); color: #cdd6f4; }

    /* Inbox stream item type */
    .stream-item[data-type="inbox"] .stream-item-type-badge {
      background: rgba(249,199,79,0.15);
      color: #f9c74f;
      border-color: rgba(249,199,79,0.3);
    }

    /* Mission highlight animation */
    .mission-highlight {
      animation: mission-flash 0.5s ease-in-out 3;
    }
    @keyframes mission-flash {
      0%, 100% { background: transparent; }
      50% { background: rgba(166,227,161,0.15); }
    }
  `;
  document.head.appendChild(style);
})();

// ═══════════════════════════════════════════════════════════
// INIT
// ═══════════════════════════════════════════════════════════

document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    updateMobileNavToUnified();
    startSharedStatePolling();
    startInboxFeedPoll();

    // Handoff polling every 60s
    pollHandoffs();
    setInterval(() => { if (shouldPoll()) pollHandoffs(); }, 60000);

    // Add workbench cross-links if already on that page
    if (typeof currentPage !== 'undefined' && currentPage === 'workbench') {
      addWorkbenchCrossLinks();
    }
  }, 1500);
});
