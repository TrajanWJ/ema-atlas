/* Agent OS v5 — app3.js — Command Palette + Init */
'use strict';

// COMMAND PALETTE (⌘K overlay) — Raycast-style launcher
// ═══════════════════════════════════════════════════════════

let paletteOpen = false;
let paletteSelectedIdx = 0;
let _paletteMode = 'search'; // search | action | agent | slash | task | vault

// ── Quick action chips (shown when palette first opens) ──
const PALETTE_QUICK_ACTIONS = [
  { icon: '📬', label: 'Inbox', action: () => { nav('inbox'); closeCommandPalette(); } },
  { icon: '🔍', label: 'Search Vault', action: () => { _setPaletteMode('vault'); } },
  { icon: '✅', label: 'New Task', action: () => { nav('tasks'); closeCommandPalette(); toast('Create a new task', 'info'); } },
  { icon: '📋', label: 'New Proposal', action: () => { if (typeof showNewProposalModal === 'function') showNewProposalModal(); closeCommandPalette(); } },
  { icon: '⚡', label: 'Actions', action: () => { _setPaletteMode('action'); } },
  { icon: '🤖', label: 'Agents', action: () => { _setPaletteMode('agent'); } },
];

function _setPaletteMode(mode) {
  _paletteMode = mode;
  const input = $('palette-input');
  const prefix = $('palette-prefix');
  const modeIndicator = $('palette-mode-indicator');
  switch (mode) {
    case 'action':
      input.value = '> ';
      prefix.textContent = '⚡';
      if (modeIndicator) modeIndicator.textContent = 'Actions';
      input.focus();
      input.setSelectionRange(2, 2);
      renderPaletteResults('> ');
      break;
    case 'agent':
      input.value = '@ ';
      prefix.textContent = '🤖';
      if (modeIndicator) modeIndicator.textContent = 'Agents';
      input.focus();
      input.setSelectionRange(2, 2);
      renderPaletteResults('@ ');
      break;
    case 'slash':
      input.value = '/ ';
      prefix.textContent = '⌨️';
      if (modeIndicator) modeIndicator.textContent = 'Commands';
      input.focus();
      input.setSelectionRange(2, 2);
      renderPaletteResults('/ ');
      break;
    case 'task':
      input.value = 'task: ';
      prefix.textContent = '✅';
      if (modeIndicator) modeIndicator.textContent = 'Tasks';
      input.focus();
      input.setSelectionRange(6, 6);
      renderPaletteResults('task: ');
      break;
    case 'vault':
      input.value = 'vault: ';
      prefix.textContent = '📚';
      if (modeIndicator) modeIndicator.textContent = 'Vault';
      input.focus();
      input.setSelectionRange(7, 7);
      renderPaletteResults('vault: ');
      break;
    default:
      prefix.textContent = '🔍';
      if (modeIndicator) modeIndicator.textContent = '';
      break;
  }
}

function openCommandPalette() {
  paletteOpen = true;
  _paletteMode = 'search';
  $('cmd-palette-overlay').classList.remove('hidden');
  const input = $('palette-input');
  input.value = '';
  input.focus();
  const prefix = $('palette-prefix');
  if (prefix) prefix.textContent = '🔍';
  const mi = $('palette-mode-indicator');
  if (mi) mi.textContent = '';
  renderPaletteResults('');
}

function closeCommandPalette() {
  paletteOpen = false;
  _paletteMode = 'search';
  $('cmd-palette-overlay').classList.add('hidden');
}

function closeCmdPaletteIfOutside(e) {
  if (e.target === $('cmd-palette-overlay')) closeCommandPalette();
}

function handlePaletteInput(val) {
  // Update prefix icon based on mode prefix
  const prefix = $('palette-prefix');
  const mi = $('palette-mode-indicator');
  if (val.startsWith('>')) { prefix.textContent = '⚡'; if (mi) mi.textContent = 'Actions'; _paletteMode = 'action'; }
  else if (val.startsWith('@')) { prefix.textContent = '🤖'; if (mi) mi.textContent = 'Agents'; _paletteMode = 'agent'; }
  else if (val.startsWith('/')) { prefix.textContent = '⌨️'; if (mi) mi.textContent = 'Commands'; _paletteMode = 'slash'; }
  else if (val.toLowerCase().startsWith('task:')) { prefix.textContent = '✅'; if (mi) mi.textContent = 'Tasks'; _paletteMode = 'task'; }
  else if (val.toLowerCase().startsWith('vault:')) { prefix.textContent = '📚'; if (mi) mi.textContent = 'Vault'; _paletteMode = 'vault'; }
  else { prefix.textContent = '🔍'; if (mi) mi.textContent = ''; _paletteMode = 'search'; }

  renderPaletteResults(val);
}

// ── All available actions for ">" mode ──
function _getPaletteActions() {
  return [
    // Navigation
    { icon: '📡', title: 'Go to Stream', desc: 'Navigate', sc: '1', cat: 'nav', action: () => { nav('feed'); closeCommandPalette(); } },
    { icon: '📬', title: 'Go to Inbox', desc: 'Navigate', sc: '2', cat: 'nav', action: () => { nav('inbox'); closeCommandPalette(); } },
    { icon: '💬', title: 'Go to Talk', desc: 'Navigate', sc: '3', cat: 'nav', action: () => { nav('talk'); closeCommandPalette(); } },
    { icon: '✅', title: 'Go to Tasks', desc: 'Navigate', sc: '4', cat: 'nav', action: () => { nav('tasks'); closeCommandPalette(); } },
    { icon: '🧠', title: 'Go to Mind', desc: 'Navigate', sc: '5', cat: 'nav', action: () => { nav('mind'); closeCommandPalette(); } },
    { icon: '⚙️', title: 'Go to System', desc: 'Navigate', sc: '6', cat: 'nav', action: () => { nav('pulse'); closeCommandPalette(); } },
    { icon: '📋', title: 'Go to Proposals', desc: 'Navigate', cat: 'nav', action: () => { nav('queue'); closeCommandPalette(); } },
    { icon: '🎯', title: 'Go to Missions', desc: 'Navigate', cat: 'nav', action: () => { nav('missions'); closeCommandPalette(); } },
    { icon: '📁', title: 'Go to Projects', desc: 'Navigate', cat: 'nav', action: () => { nav('projects'); closeCommandPalette(); } },
    { icon: '🔀', title: 'Go to Pipelines', desc: 'Navigate', cat: 'nav', action: () => { nav('pipelines'); closeCommandPalette(); } },
    { icon: '🏠', title: 'Go to Rooms', desc: 'Navigate', cat: 'nav', action: () => { nav('rooms'); closeCommandPalette(); } },
    { icon: '📜', title: 'Go to Briefing', desc: 'Navigate', cat: 'nav', action: () => { nav('briefing'); closeCommandPalette(); } },
    { icon: '🛡️', title: 'Go to Roles', desc: 'Navigate', cat: 'nav', action: () => { nav('roles'); closeCommandPalette(); } },
    { icon: '📊', title: 'Go to Records', desc: 'Navigate', cat: 'nav', action: () => { nav('records'); closeCommandPalette(); } },
    // Create
    { icon: '✅', title: 'New Task', desc: 'Create', cat: 'create', action: () => { nav('tasks'); closeCommandPalette(); toast('➕ Create a new task', 'info'); } },
    { icon: '🎯', title: 'New Mission', desc: 'Create', cat: 'create', action: () => { nav('missions'); closeCommandPalette(); toast('➕ Create a new mission', 'info'); } },
    { icon: '📁', title: 'New Project', desc: 'Create', cat: 'create', action: () => { nav('projects'); closeCommandPalette(); toast('➕ Create a new project', 'info'); } },
    { icon: '📋', title: 'New Proposal', desc: 'Create', cat: 'create', action: () => { if (typeof showNewProposalModal === 'function') showNewProposalModal(); closeCommandPalette(); } },
    // System actions
    { icon: '🔄', title: 'Restart Gateway', desc: 'System', cat: 'system', action: () => { quickAction('restart-gateway'); closeCommandPalette(); } },
    { icon: '📚', title: 'Reindex Vault', desc: 'System', cat: 'system', action: () => { quickAction('reindex'); closeCommandPalette(); } },
    { icon: '🩺', title: 'Health Check', desc: 'System', cat: 'system', action: () => { quickAction('health-check'); closeCommandPalette(); } },
    { icon: '🗑️', title: 'Clear Inbox', desc: 'System', cat: 'system', action: () => { toast('Inbox cleared', 'success'); closeCommandPalette(); } },
    { icon: '📊', title: 'Export Records', desc: 'System — CSV export', cat: 'system', action: () => { toast('Exporting records as CSV...', 'info'); closeCommandPalette(); } },
  ];
}

function renderPaletteResults(val) {
  const container = $('palette-results');
  let results = [];
  const q = val.toLowerCase().replace(/^[>@/]\s*/, '').replace(/^(task|vault):\s*/i, '').trim();

  if (val.startsWith('>')) {
    // Actions mode — show all commands
    const actions = _getPaletteActions();
    results = actions.filter(c => !q || c.title.toLowerCase().includes(q) || (c.desc && c.desc.toLowerCase().includes(q)));
  } else if (val.startsWith('@')) {
    // Agent mode
    results = (typeof AGENTS !== 'undefined' ? AGENTS : []).filter(a => !q || a.name.toLowerCase().includes(q))
      .map(a => ({
        icon: a.emoji, title: a.name, desc: `${a.role} · ${a.status}`,
        action: () => {
          if (typeof openAgentDrawer === 'function') openAgentDrawer(a.id);
          else { nav('talk'); setTimeout(() => { if (typeof selectDM === 'function') selectDM(a.id); }, 200); }
          closeCommandPalette();
        },
      }));
  } else if (val.startsWith('/')) {
    // Slash commands
    results = (typeof SLASH_COMMANDS !== 'undefined' ? SLASH_COMMANDS : []).filter(c => !q || c.cmd.includes(q))
      .map(c => ({
        icon: '⌨️', title: c.cmd, desc: c.desc,
        action: () => { toast(`${c.usage}`, 'info', 4000); closeCommandPalette(); },
      }));
  } else if (val.toLowerCase().startsWith('task:')) {
    // Task search
    if (typeof TASKS_DATA !== 'undefined') {
      results = TASKS_DATA.filter(t => !q || t.title.toLowerCase().includes(q)).slice(0, 12)
        .map(t => ({
          icon: t.status === 'done' ? '✅' : t.status === 'active' ? '🔵' : '⬜',
          title: t.title, desc: `${t.status} · ${t.agent || 'unassigned'}`,
          action: () => { nav('tasks'); closeCommandPalette(); },
        }));
    }
    if (results.length === 0 && q) {
      results.push({ icon: '✅', title: `Create task: "${q}"`, desc: 'New task', action: () => { nav('tasks'); closeCommandPalette(); toast(`➕ Task: ${q}`, 'info'); } });
    }
  } else if (val.toLowerCase().startsWith('vault:')) {
    // Vault search
    if (typeof VAULT_NOTES !== 'undefined') {
      results = VAULT_NOTES.filter(n => !q || n.title.toLowerCase().includes(q)).slice(0, 12)
        .map(n => ({
          icon: '📚', title: n.title, desc: n.type || 'Note',
          action: () => { nav('mind'); if (typeof openVaultNote === 'function') openVaultNote(n.title); else if (typeof setMindTab === 'function') setMindTab('search'); closeCommandPalette(); },
        }));
    }
  } else {
    // ── Default: show quick actions + search everything ──
    if (!q) {
      // Show quick action chips as first "row", then frequent pages
      container.innerHTML = _renderQuickChips() + _renderDefaultResults();
      paletteSelectedIdx = -1;
      window.paletteResults = [];
      return;
    }

    // Search pages
    const dedupPages = new Set();
    Object.entries(typeof PAGE_TITLES !== 'undefined' ? PAGE_TITLES : {}).forEach(([k, v]) => {
      if (dedupPages.has(v)) return;
      if (v.toLowerCase().includes(q) || k.toLowerCase().includes(q)) {
        dedupPages.add(v);
        results.push({ icon: '📄', title: v, desc: 'Page', sc: '', action: () => { nav(k); closeCommandPalette(); } });
      }
    });
    // Search agents
    (typeof AGENTS !== 'undefined' ? AGENTS : []).forEach(a => {
      if (a.name.toLowerCase().includes(q) || a.id.includes(q)) {
        results.push({
          icon: a.emoji, title: a.name, desc: a.role,
          action: () => {
            if (typeof openAgentDrawer === 'function') openAgentDrawer(a.id);
            else { nav('talk'); setTimeout(() => { if (typeof selectDM === 'function') selectDM(a.id); }, 200); }
            closeCommandPalette();
          },
        });
      }
    });
    // Search vault notes
    (typeof VAULT_NOTES !== 'undefined' ? VAULT_NOTES : []).forEach(n => {
      if (n.title.toLowerCase().includes(q)) {
        results.push({ icon: '📚', title: n.title, desc: n.type || 'Vault note', action: () => { nav('mind'); if (typeof setMindTab === 'function') setMindTab('search'); closeCommandPalette(); } });
      }
    });
    // Search tasks
    if (typeof TASKS_DATA !== 'undefined') {
      TASKS_DATA.forEach(t => {
        if (t.title.toLowerCase().includes(q)) {
          results.push({ icon: '✅', title: t.title, desc: `Task · ${t.status}`, action: () => { nav('tasks'); closeCommandPalette(); } });
        }
      });
    }
    // Search actions
    _getPaletteActions().forEach(a => {
      if (a.title.toLowerCase().includes(q)) {
        results.push(a);
      }
    });
  }

  paletteSelectedIdx = 0;
  window.paletteResults = results;

  if (results.length === 0 && q) {
    container.innerHTML = `<div class="palette-empty"><span class="palette-empty-icon">🔍</span><span>No results for "<strong>${_escHTML(q)}</strong>"</span><div class="palette-empty-hint">Try <kbd>></kbd> for actions, <kbd>@</kbd> for agents, <kbd>vault:</kbd> for vault</div></div>`;
    return;
  }

  container.innerHTML = results.slice(0, 14).map((r, i) => `
    <div class="palette-item${i === 0 ? ' selected' : ''}" onclick="window.paletteResults[${i}]?.action?.()" data-idx="${i}" onmouseenter="_paletteHover(${i})">
      <span class="palette-item-icon">${r.icon}</span>
      <div class="palette-item-text">
        <div class="palette-item-title">${r.title}</div>
        ${r.desc ? `<div class="palette-item-desc">${r.desc}</div>` : ''}
      </div>
      ${r.sc ? `<kbd class="palette-item-shortcut">${r.sc}</kbd>` : ''}
    </div>
  `).join('');
}

function _paletteHover(idx) {
  paletteSelectedIdx = idx;
  $$('.palette-item').forEach((it, i) => it.classList.toggle('selected', i === idx));
}

function _escHTML(s) {
  const d = document.createElement('div');
  d.textContent = s;
  return d.innerHTML;
}

function _renderQuickChips() {
  return `<div class="palette-quick-actions">${PALETTE_QUICK_ACTIONS.map((qa, i) =>
    `<button class="palette-chip" onclick="PALETTE_QUICK_ACTIONS[${i}].action()" title="${qa.label}"><span class="palette-chip-icon">${qa.icon}</span><span class="palette-chip-label">${qa.label}</span></button>`
  ).join('')}</div>`;
}

function _renderDefaultResults() {
  // Show recently-used / high-value destinations
  const defaults = [
    { icon: '📡', title: 'Stream', desc: 'Live activity feed', sc: '1', action: () => { nav('feed'); closeCommandPalette(); } },
    { icon: '📬', title: 'Inbox', desc: 'Items needing attention', sc: '2', action: () => { nav('inbox'); closeCommandPalette(); } },
    { icon: '💬', title: 'Talk', desc: 'Discord channels', sc: '3', action: () => { nav('talk'); closeCommandPalette(); } },
    { icon: '✅', title: 'Tasks', desc: 'Task management', sc: '4', action: () => { nav('tasks'); closeCommandPalette(); } },
    { icon: '🧠', title: 'Mind', desc: 'Knowledge vault', sc: '5', action: () => { nav('mind'); closeCommandPalette(); } },
    { icon: '⚙️', title: 'System', desc: 'System health & config', sc: '6', action: () => { nav('pulse'); closeCommandPalette(); } },
  ];
  window.paletteResults = defaults;
  paletteSelectedIdx = -1;
  return `<div class="palette-section-label">Pages</div>` + defaults.map((r, i) => `
    <div class="palette-item" onclick="window.paletteResults[${i}]?.action?.()" data-idx="${i}" onmouseenter="_paletteHover(${i})">
      <span class="palette-item-icon">${r.icon}</span>
      <div class="palette-item-text">
        <div class="palette-item-title">${r.title}</div>
        <div class="palette-item-desc">${r.desc}</div>
      </div>
      <kbd class="palette-item-shortcut">${r.sc}</kbd>
    </div>
  `).join('');
}

function handlePaletteKey(e) {
  const items = $$('.palette-item');
  if (e.key === 'ArrowDown') {
    e.preventDefault();
    paletteSelectedIdx = Math.min(paletteSelectedIdx + 1, items.length - 1);
    items.forEach((it, i) => it.classList.toggle('selected', i === paletteSelectedIdx));
    if (items[paletteSelectedIdx]) items[paletteSelectedIdx].scrollIntoView({ block: 'nearest' });
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    paletteSelectedIdx = Math.max(paletteSelectedIdx - 1, 0);
    items.forEach((it, i) => it.classList.toggle('selected', i === paletteSelectedIdx));
    if (items[paletteSelectedIdx]) items[paletteSelectedIdx].scrollIntoView({ block: 'nearest' });
  } else if (e.key === 'Enter') {
    e.preventDefault();
    if (window.paletteResults && window.paletteResults[paletteSelectedIdx]?.action) {
      window.paletteResults[paletteSelectedIdx].action();
    }
  } else if (e.key === 'Escape') {
    closeCommandPalette();
  } else if (e.key === 'Backspace') {
    // If input is empty and we're in a mode, go back to search mode
    const input = $('palette-input');
    if (input && input.value.length <= 1 && _paletteMode !== 'search') {
      _paletteMode = 'search';
      input.value = '';
      const prefix = $('palette-prefix');
      if (prefix) prefix.textContent = '🔍';
      const mi = $('palette-mode-indicator');
      if (mi) mi.textContent = '';
      renderPaletteResults('');
    }
  } else if (e.key === 'Tab') {
    // Tab cycles through modes
    e.preventDefault();
    const modes = ['search', 'action', 'agent', 'vault'];
    const idx = modes.indexOf(_paletteMode);
    const next = modes[(idx + 1) % modes.length];
    _setPaletteMode(next);
  }
}

// ⌘K keyboard shortcut — handled by global handler in ux.js now
// Keep this as a backup for edge cases
document.addEventListener('keydown', e => {
  if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
    e.preventDefault();
    if (paletteOpen) closeCommandPalette();
    else openCommandPalette();
  }
});

// ═══════════════════════════════════════════════════════════


function toggleCron(name, enabled) {
  const cron = CRONS.find(c => c.n === name);
  if (cron) {
    cron.ok = enabled;
    toast(`${enabled ? '✅' : '⛔'} ${name} ${enabled ? 'enabled' : 'disabled'}`, enabled ? 'success' : 'info');
  }
}

// ═══════════════════════════════════════════════════════════
// EVENT BUS — Bidirectional Mirroring
// ═══════════════════════════════════════════════════════════

const EventBus = {
  _handlers: {},
  on(event, fn) {
    (this._handlers[event] = this._handlers[event] || []).push(fn);
  },
  emit(event, data) {
    (this._handlers[event] || []).forEach(fn => fn(data));
  }
};

// Wire up cross-view mirroring
EventBus.on('chat:message', data => {
  // Chat message → Feed event
  prependFeedCard({
    id: 'feed_chat_' + Date.now(),
    agent: data.agent,
    type: data.agent === 'user' ? 'question_asked' : 'task_completed',
    time: data.time,
    content: `[#${data.channel || 'DM'}] ${data.text.substring(0, 150)}`,
  });
  // Chat message → Stream event
  if (typeof addStreamEvent === 'function') {
    addStreamEvent({
      id: 'str_chat_' + Date.now(),
      level: 'info',
      agent: data.agent === 'user' ? 'righthand' : data.agent,
      time: new Date().toLocaleTimeString([], {hour:'2-digit',minute:'2-digit',second:'2-digit'}),
      text: `Message in #${data.channel || 'DM'}: ${data.text.substring(0, 80)}`,
    });
  }
  // Update unread badges
  if (data.channel && data.channel !== currentChannel) {
    updateUnreadBadge(data.channel);
  }
});

EventBus.on('queue:answered', data => {
  // Queue answer → Chat message in #dispatch
  const newMsg = {
    id: 'qans_' + Date.now(),
    agent: 'user',
    time: new Date().toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'}),
    ts: Date.now() / 1000,
    text: `📋 **Queue Decision:** ${data.question.substring(0, 80)}\n→ \`${data.answer}\``,
    reactions: [],
  };
  if (!DC_MESSAGES['dispatch']) DC_MESSAGES['dispatch'] = [];
  DC_MESSAGES['dispatch'].push(newMsg);
  if (currentPage === 'talk' && currentChannel === 'dispatch') renderMessages('dispatch');

  // Queue answer → agent response in relevant channel
  const agentReply = {
    id: 'qreply_' + Date.now(),
    agent: data.agent,
    time: new Date().toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'}),
    ts: Date.now() / 1000,
    text: `Acknowledged. Acting on your decision: \`${data.answer}\``,
    reactions: [{e:'✅', n:1, mine:false}],
  };
  const agentChannel = getAgentChannel(data.agent);
  if (!DC_MESSAGES[agentChannel]) DC_MESSAGES[agentChannel] = [];
  DC_MESSAGES[agentChannel].push(agentReply);
  if (currentPage === 'talk' && currentChannel === agentChannel) renderMessages(agentChannel);
  updateUnreadBadge(agentChannel);
});

EventBus.on('agent:statusChange', data => {
  // Agent status → Feed event
  const verb = data.status === 'active' ? 'started working' : 'went idle';
  prependFeedCard({
    id: 'feed_status_' + Date.now(),
    agent: data.agentId,
    type: data.status === 'active' ? 'task_started' : 'task_completed',
    time: new Date().toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'}),
    content: `${verb}${data.task ? ': ' + data.task : ''}`,
  });
  // Agent status → Stream
  if (typeof addStreamEvent === 'function') {
    addStreamEvent({
      id: 'str_status_' + Date.now(),
      level: 'info',
      agent: data.agentId,
      time: new Date().toLocaleTimeString([], {hour:'2-digit',minute:'2-digit',second:'2-digit'}),
      text: `Agent ${verb}${data.task ? ': ' + data.task : ''}`,
    });
  }
  // Status → agent-feed chat
  const statusMsg = {
    id: 'af_status_' + Date.now(),
    agent: data.agentId,
    time: new Date().toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'}),
    ts: Date.now() / 1000,
    text: `[STATUS] ${verb}${data.task ? ': ' + data.task : ''}`,
    reactions: [],
  };
  if (!DC_MESSAGES['agent-feed']) DC_MESSAGES['agent-feed'] = [];
  DC_MESSAGES['agent-feed'].push(statusMsg);
  if (currentPage === 'talk' && currentChannel === 'agent-feed') renderMessages('agent-feed');
  updateUnreadBadge('agent-feed');
  // Update pulse if visible
  if (currentPage === 'pulse' && typeof renderPulse === 'function') renderPulse();
});

function getAgentChannel(agentId) {
  const map = {
    researcher: 'research-feed', coder: 'code-output', devil: 'devils-corner',
    ops: 'ops-log', utility: 'agent-feed', righthand: 'bridge',
  };
  return map[agentId] || 'agent-feed';
}

function updateUnreadBadge(channelId) {
  // Update data
  const allChannels = DC_CHANNELS.categories
    ? DC_CHANNELS.categories.flatMap(c => c.channels)
    : DC_CHANNELS.text;
  const ch = allChannels.find(c => c.id === channelId);
  if (ch) ch.unread = (ch.unread || 0) + 1;
  // Update DOM
  const item = document.querySelector(`.channel-item[data-chid="${channelId}"]`);
  if (item) {
    item.classList.add('has-unread');
    let badge = item.querySelector('.channel-unread');
    if (badge) {
      badge.textContent = ch ? ch.unread : '•';
    } else {
      badge = document.createElement('span');
      badge.className = 'channel-unread';
      badge.textContent = ch ? ch.unread : '•';
      item.appendChild(badge);
    }
  }
}

// ═══════════════════════════════════════════════════════════
// SIMULATION ENGINE (Live Updates)
// ═══════════════════════════════════════════════════════════

// Simulation data removed — real data flows through dispatch system

function startSimulation() {
  // Simulation disabled — real data flows through dispatch system
  console.log('[Sim] Simulation permanently disabled — using real dispatch data');
  return;
}

function updateActiveAgents() {
  const active = AGENTS.filter(a => a.status === 'active');
  const count = active.length;
  const text = `${count} agent${count !== 1 ? 's' : ''} active`;
  const el = $('active-agents-text');
  if (el) el.textContent = text;
  const sideCount = $('sidebar-active-count');
  if (sideCount) sideCount.textContent = `${count} active`;
  const metricEl = $('metric-agents');
  if (metricEl) metricEl.textContent = count;
  const totalEl = $('metric-agents-total');
  if (totalEl) totalEl.textContent = `${AGENTS.length} total`;
}

// Alias for clarity
const updateTopbarAgentCount = updateActiveAgents;

// ═══════════════════════════════════════════════════════════
// ═══════════════════════════════════════════════════════════
// MOBILE TALK — Channel Drawer
// ═══════════════════════════════════════════════════════════

function isMobile() { return window.innerWidth <= 767; }

function initMobileTalk() {
  if (isMobile()) {
    const chName = document.getElementById('current-channel-name');
    if (chName) chName.classList.add('mobile-tap');
  }
  window.addEventListener('resize', () => {
    const chName = document.getElementById('current-channel-name');
    if (!chName) return;
    if (isMobile()) chName.classList.add('mobile-tap');
    else chName.classList.remove('mobile-tap');
  });
}

function openMobileChannelDrawer() {
  if (!isMobile()) return;
  closeMobileDrawer();

  const overlay = document.createElement('div');
  overlay.className = 'mobile-drawer-overlay';
  overlay.onclick = closeMobileDrawer;
  document.body.appendChild(overlay);

  const drawer = document.createElement('div');
  drawer.className = 'channel-sidebar mobile-drawer';
  drawer.id = 'mobile-channel-drawer';

  // Server name header
  const header = document.createElement('div');
  header.className = 'channel-server-name';
  header.innerHTML = '<span>Agent OS</span>';
  drawer.appendChild(header);

  // Mode tabs
  const tabs = document.createElement('div');
  tabs.style.cssText = 'display:flex;gap:4px;padding:8px 12px;';
  tabs.innerHTML = `
    <button style="flex:1;padding:6px;border:none;border-radius:4px;font-size:12px;cursor:pointer;
      background:${talkMode==='channels'?'var(--accent)':'var(--bg-raised)'};
      color:${talkMode==='channels'?'var(--bg)':'var(--text-dim)'};"
      onclick="talkMode='channels';closeMobileDrawer();openMobileChannelDrawer()">Channels</button>
    <button style="flex:1;padding:6px;border:none;border-radius:4px;font-size:12px;cursor:pointer;
      background:${talkMode==='dms'?'var(--accent)':'var(--bg-raised)'};
      color:${talkMode==='dms'?'var(--bg)':'var(--text-dim)'};"
      onclick="talkMode='dms';closeMobileDrawer();openMobileChannelDrawer()">DMs</button>`;
  drawer.appendChild(tabs);

  // Channel/DM list
  const list = document.createElement('div');
  list.id = 'mobile-channel-list';
  list.style.cssText = 'flex:1;overflow-y:auto;padding:4px 0;';
  drawer.appendChild(list);

  document.body.appendChild(drawer);
  renderMobileDrawerChannels();
}

function renderMobileDrawerChannels() {
  const list = document.getElementById('mobile-channel-list');
  if (!list) return;

  if (talkMode === 'channels') {
    let html = '';
    if (DC_CHANNELS.categories) {
      DC_CHANNELS.categories.forEach(cat => {
        html += `<div style="padding:10px 12px 4px;font-size:11px;font-weight:600;text-transform:uppercase;color:var(--text-muted);letter-spacing:0.5px">${cat.name}</div>`;
        cat.channels.forEach(ch => {
          const chType = ch.type || 'text';
          if (chType === 'voice') return; // skip voice on mobile
          const active = ch.id === currentChannel ? 'background:var(--bg-raised);color:var(--accent)' : '';
          const unread = ch.unread ? `<span style="background:var(--accent);color:var(--bg);border-radius:10px;padding:1px 6px;font-size:10px;margin-left:auto">${ch.unread}</span>` : '';
          const icon = chType === 'forum' ? '💬' : '#';
          html += `<div onclick="switchChannel('${ch.id}');closeMobileDrawer()" 
            style="display:flex;align-items:center;gap:8px;padding:9px 16px;cursor:pointer;border-radius:4px;margin:1px 8px;${active}">
            <span style="color:var(--text-muted);font-size:14px">${icon}</span>
            <span style="font-size:13px;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${ch.name}</span>
            ${unread}
          </div>`;
        });
      });
    } else {
      DC_CHANNELS.text.forEach(ch => {
        const active = ch.id === currentChannel ? 'background:var(--bg-raised);color:var(--accent)' : '';
        const unread = ch.unread ? `<span style="background:var(--accent);color:var(--bg);border-radius:10px;padding:1px 6px;font-size:10px;margin-left:auto">${ch.unread}</span>` : '';
        html += `<div onclick="switchChannel('${ch.id}');closeMobileDrawer()" 
          style="display:flex;align-items:center;gap:8px;padding:8px 16px;cursor:pointer;border-radius:4px;margin:1px 8px;${active}">
          <span style="color:var(--text-muted);font-size:14px">#</span>
          <span style="font-size:14px">${ch.id}</span>
          ${unread}
        </div>`;
      });
    }
    list.innerHTML = html;
  } else {
    // DMs — derive from DM_MESSAGES keys
    let html = '';
    const dmAgents = typeof DM_MESSAGES !== 'undefined' ? Object.keys(DM_MESSAGES) : [];
    dmAgents.forEach(agentId => {
      const agent = AGENTS.find(a => a.id === agentId) || {};
      const msgs = DM_MESSAGES[agentId] || [];
      const lastMsg = msgs.length ? msgs[msgs.length - 1].text : '';
      const active = currentDM === agentId ? 'background:var(--bg-raised);color:var(--accent)' : '';
      html += `<div onclick="selectDM('${agentId}');closeMobileDrawer()"
        style="display:flex;align-items:center;gap:10px;padding:10px 16px;cursor:pointer;border-radius:4px;margin:1px 8px;${active}">
        <span style="font-size:20px">${agent.emoji||'🤖'}</span>
        <div style="min-width:0;flex:1">
          <div style="font-size:14px;font-weight:500">${agent.name||agentId}</div>
          <div style="font-size:11px;color:var(--text-muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${lastMsg.slice(0,60)}</div>
        </div>
      </div>`;
    });
    if (!dmAgents.length) html = '<div style="padding:20px;text-align:center;color:var(--text-muted)">No DMs yet</div>';
    list.innerHTML = html;
  }
}

function closeMobileDrawer() {
  document.querySelectorAll('.mobile-drawer-overlay').forEach(el => el.remove());
  document.getElementById('mobile-channel-drawer')?.remove();
}

// ═══════════════════════════════════════════════════════════
// CONTEXTUAL PANEL SYSTEM
// ═══════════════════════════════════════════════════════════

let ctxPanelOpen = false;

function openCtxPanel(type, id) {
  const panel = $('context-panel');
  const overlay = $('ctx-panel-overlay');
  const title = $('ctx-title');
  const body = $('ctx-body');
  const footer = $('ctx-footer');
  if (!panel || !body) return;

  // Build content based on type
  switch (type) {
    case 'agent': renderAgentCtx(id, title, body, footer); break;
    case 'task':  renderTaskCtx(id, title, body, footer); break;
    case 'vault': renderVaultCtx(id, title, body, footer); break;
    case 'mission': renderMissionCtx(id, title, body, footer); break;
    default: return;
  }

  // Show panel
  panel.classList.remove('hidden');
  overlay.classList.remove('hidden');
  requestAnimationFrame(() => {
    panel.classList.add('visible');
  });
  ctxPanelOpen = true;
}

function closeCtxPanel() {
  const panel = $('context-panel');
  const overlay = $('ctx-panel-overlay');
  if (!panel) return;
  panel.classList.remove('visible');
  overlay.classList.add('hidden');
  ctxPanelOpen = false;
}

// Close on Escape
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && ctxPanelOpen) closeCtxPanel();
});

function renderAgentCtx(agentId, titleEl, bodyEl, footerEl) {
  const agent = ga(agentId);
  if (!agent) return;
  titleEl.innerHTML = `${agent.emoji} ${agent.name}`;

  const statusColor = agent.status === 'active' ? 'var(--green)' : 'var(--text-muted)';
  const statusText = agent.status === 'active' ? 'Active' : 'Idle';

  // Find recent feed events for this agent
  const recentEvents = feedEvents.filter(e => e.agent === agentId).slice(0, 5);

  bodyEl.innerHTML = `
    <div class="ctx-section">
      <div class="ctx-status-row">
        <span class="ctx-status-dot" style="background:${statusColor}"></span>
        <span style="color:${statusColor};font-weight:600">${statusText}</span>
        ${agent.task ? `<span style="color:var(--text-dim);margin-left:8px">— ${agent.task}</span>` : ''}
      </div>
    </div>

    <div class="ctx-section">
      <div class="ctx-section-title">Statistics</div>
      <div class="ctx-stat-grid">
        <div class="ctx-stat"><div class="ctx-stat-val">${agent.tasks || 0}</div><div class="ctx-stat-label">Tasks Done</div></div>
        <div class="ctx-stat"><div class="ctx-stat-val">${agent.files || 0}</div><div class="ctx-stat-label">Files</div></div>
        <div class="ctx-stat"><div class="ctx-stat-val">${((agent.tokens || 0) / 1000).toFixed(1)}K</div><div class="ctx-stat-label">Tokens</div></div>
        <div class="ctx-stat"><div class="ctx-stat-val">${Math.round((agent.fitness || 0) * 100)}%</div><div class="ctx-stat-label">Fitness</div></div>
      </div>
    </div>

    <div class="ctx-section">
      <div class="ctx-section-title">Recent Activity</div>
      ${recentEvents.length > 0 ? recentEvents.map(e => `
        <div class="ctx-timeline-item">
          <span class="ctx-timeline-time">${e.time}</span>
          <span class="ctx-timeline-text">${e.content.substring(0, 80)}${e.content.length > 80 ? '…' : ''}</span>
        </div>
      `).join('') : '<div style="color:var(--text-muted);font-size:12px">No recent activity</div>'}
    </div>

    <div class="ctx-section">
      <div class="ctx-section-title">Quick Message</div>
      <div class="ctx-quick-input">
        <input type="text" id="ctx-agent-msg-input" placeholder="Message ${agent.name}..." onkeydown="if(event.key==='Enter'){sendCtxAgentMsg('${agentId}');event.preventDefault();}">
        <button onclick="sendCtxAgentMsg('${agentId}')">Send</button>
      </div>
    </div>
  `;

  footerEl.innerHTML = `
    <button class="ctx-action-btn" onclick="openTalkWithAgent('${agentId}');closeCtxPanel()">💬 Open Chat</button>
    <button class="ctx-action-btn" onclick="openMemberProfile('${agentId}');closeCtxPanel()">👤 Full Profile</button>
  `;
}

function sendCtxAgentMsg(agentId) {
  const input = $('ctx-agent-msg-input');
  if (!input || !input.value.trim()) return;
  const text = input.value.trim();
  input.value = '';
  // Navigate to DM and send
  nav('talk');
  setTimeout(() => {
    selectDM(agentId);
    setTimeout(() => {
      $('message-input').value = text;
      sendMessage();
    }, 200);
  }, 200);
  closeCtxPanel();
}

function renderTaskCtx(taskId, titleEl, bodyEl, footerEl) {
  // Search across board cards and plan tasks
  let task = null;
  let source = null;
  for (const col of Object.keys(BOARD_CARDS)) {
    const found = BOARD_CARDS[col].find(c => c.id === taskId);
    if (found) { task = found; source = 'board'; break; }
  }
  if (!task && currentPlanData) {
    task = (currentPlanData.tasks || []).find(t => t.id === taskId);
    if (task) source = 'plan';
  }
  // Also check proposals
  if (!task) {
    task = queueCards.find(q => q.id === taskId);
    if (task) source = 'proposal';
  }

  if (!task) {
    titleEl.textContent = '📋 Task';
    bodyEl.innerHTML = '<div style="color:var(--text-muted);padding:20px 0">Task not found</div>';
    footerEl.innerHTML = '';
    return;
  }

  const agent = ga(task.agent) || { emoji: '⬜', name: task.agent || 'Unassigned', color: '#6c7086' };
  const title = task.title || task.question || 'Untitled';
  titleEl.innerHTML = `📋 ${title}`;

  const description = task.description || task.context || '';
  const priority = String(task.priority || task._priority || 'P3');
  const tags = task.tags || task.labels || [];

  bodyEl.innerHTML = `
    <div class="ctx-section">
      <div class="ctx-status-row">
        <span class="priority-badge ${priority.toLowerCase()}">${priority}</span>
        <span style="font-size:16px">${agent.emoji}</span>
        <span style="color:${agent.color || 'var(--text-dim)'};font-weight:600">${agent.name}</span>
      </div>
    </div>

    ${description ? `
    <div class="ctx-section">
      <div class="ctx-section-title">Description</div>
      <div class="ctx-note-preview">${description}</div>
    </div>` : ''}

    ${tags.length > 0 ? `
    <div class="ctx-section">
      <div class="ctx-section-title">Tags</div>
      <div style="display:flex;gap:6px;flex-wrap:wrap">
        ${tags.map(t => `<span class="board-tag">${t}</span>`).join('')}
      </div>
    </div>` : ''}

    ${task.progress !== undefined ? `
    <div class="ctx-section">
      <div class="ctx-section-title">Progress</div>
      <div class="progress-bar-outer" style="height:8px"><div class="progress-bar-inner" style="width:${task.progress}%"></div></div>
      <div style="font-size:12px;color:var(--text-muted);margin-top:4px">${task.progress}% complete</div>
    </div>` : ''}
  `;

  footerEl.innerHTML = `
    ${source === 'proposal' ? `<button class="ctx-action-btn primary" onclick="resolveProposalAction('${taskId}','approve');closeCtxPanel()">✅ Approve</button>` : ''}
    ${source === 'proposal' ? `<button class="ctx-action-btn" onclick="resolveProposalAction('${taskId}','reject');closeCtxPanel()">❌ Reject</button>` : ''}
  `;
}

function renderVaultCtx(noteId, titleEl, bodyEl, footerEl) {
  const note = VAULT_NOTES.find(n => n.id === noteId);
  if (!note) {
    titleEl.textContent = '📚 Vault Note';
    bodyEl.innerHTML = '<div style="color:var(--text-muted);padding:20px 0">Note not found</div>';
    footerEl.innerHTML = '';
    return;
  }

  const agent = ga(note.agent) || { emoji: '🤖', name: note.agent };
  const typeColor = (typeof TYPE_COLORS !== 'undefined' ? TYPE_COLORS : {})[note.type] || 'var(--text-dim)';
  const cc = note.confidence >= 80 ? 'var(--green)' : note.confidence >= 60 ? 'var(--yellow)' : 'var(--red)';

  titleEl.innerHTML = `📚 ${note.title}`;

  // Related notes
  const related = VAULT_NOTES.filter(n => n.id !== note.id && n.tags.some(t => note.tags.includes(t))).slice(0, 3);

  bodyEl.innerHTML = `
    <div class="ctx-section">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
        <span class="vault-card-type" style="color:${typeColor};border-color:${typeColor}40">${note.type}</span>
        <span style="font-size:12px;color:var(--text-muted)">${note.date}</span>
        <span style="font-size:12px;color:${cc}">● ${note.confidence}%</span>
        <span style="font-size:12px;color:var(--text-muted)">🔗 ${note.backlinks}</span>
      </div>
      <div style="font-size:12px;color:var(--text-dim)">By ${agent.emoji} ${agent.name}</div>
    </div>

    <div class="ctx-section">
      <div class="ctx-section-title">Preview</div>
      <div class="ctx-note-preview">${note.summary}</div>
    </div>

    <div class="ctx-section">
      <div class="ctx-section-title">Tags</div>
      <div style="display:flex;gap:6px;flex-wrap:wrap">
        ${note.tags.map(t => `<span class="note-tag">#${t}</span>`).join('')}
      </div>
    </div>

    ${related.length > 0 ? `
    <div class="ctx-section">
      <div class="ctx-section-title">Related Notes</div>
      ${related.map(r => `
        <div class="ctx-timeline-item" style="cursor:pointer" onclick="closeCtxPanel();setTimeout(()=>openCtxPanel('vault','${r.id}'),100)">
          <span class="ctx-timeline-time">${(ga(r.agent)||{emoji:'🤖'}).emoji}</span>
          <span class="ctx-timeline-text">${r.title}</span>
        </div>
      `).join('')}
    </div>` : ''}
  `;

  footerEl.innerHTML = `
    <button class="ctx-action-btn primary" onclick="closeCtxPanel();nav('mind');setMindMode('graph')">🧠 Open in Mind</button>
    <button class="ctx-action-btn" onclick="closeCtxPanel();openVaultNote(VAULT_NOTES.find(n=>n.id==='${noteId}'))">📖 Full View</button>
  `;
}

function renderMissionCtx(missionId, titleEl, bodyEl, footerEl) {
  const m = (typeof mcMissions !== 'undefined' ? mcMissions : MISSIONS_DATA).find(x => x.id === missionId);
  if (!m) {
    titleEl.textContent = '🎯 Mission';
    bodyEl.innerHTML = '<div style="color:var(--text-muted);padding:20px 0">Mission not found</div>';
    footerEl.innerHTML = '';
    return;
  }

  const progressColor = m.progress >= 100 ? 'var(--accent)' : m.progress >= 50 ? 'var(--green)' : 'var(--yellow)';
  const blocking = (typeof mcBlocking !== 'undefined' ? mcBlocking : []).filter(b => b.mission === missionId);

  titleEl.innerHTML = `${m.icon} ${m.title}`;

  bodyEl.innerHTML = `
    <div class="ctx-section">
      <div class="ctx-progress-ring-wrap">
        ${typeof renderMiniProgressRing === 'function' ? renderMiniProgressRing(m.progress, progressColor, 48) : ''}
        <div>
          <div style="font-size:22px;font-weight:800;color:var(--text)">${m.progress}%</div>
          <div style="font-size:12px;color:var(--text-muted)">${m.status}</div>
        </div>
      </div>
      ${m.goal ? `<div style="font-size:12px;color:var(--text-dim);margin-bottom:8px">Goal: ${m.goal}</div>` : ''}
      ${m.desc ? `<div style="font-size:13px;color:var(--text-dim);line-height:1.5">${m.desc}</div>` : ''}
    </div>

    <div class="ctx-section">
      <div class="ctx-section-title">Stats</div>
      <div class="ctx-stat-grid">
        <div class="ctx-stat"><div class="ctx-stat-val">${m.tasks_done}/${m.tasks_total}</div><div class="ctx-stat-label">Tasks</div></div>
        <div class="ctx-stat"><div class="ctx-stat-val">${m.agents_active}</div><div class="ctx-stat-label">Agents</div></div>
        <div class="ctx-stat"><div class="ctx-stat-val">${m.velocity.toFixed(1)}/d</div><div class="ctx-stat-label">Velocity</div></div>
        <div class="ctx-stat"><div class="ctx-stat-val">${m.days_active}d</div><div class="ctx-stat-label">Active</div></div>
      </div>
    </div>

    ${blocking.length > 0 ? `
    <div class="ctx-section">
      <div class="ctx-section-title">⚡ Needs Your Input</div>
      ${blocking.map(b => `
        <div style="padding:6px 0;font-size:13px;color:var(--text);border-bottom:1px solid var(--border)">
          ${b.type === 'proposal' ? '📋' : '👁️'} ${b.title}
          <div style="font-size:11px;color:var(--text-muted)">From: ${b.source}</div>
        </div>
      `).join('')}
    </div>` : ''}

    ${m.milestones && m.milestones.length > 0 ? `
    <div class="ctx-section">
      <div class="ctx-section-title">Milestones</div>
      <div style="display:flex;flex-wrap:wrap;gap:6px">
        ${m.milestones.map(ms => `<span class="milestone-badge${ms.includes('✓')?' earned':''}">${ms}</span>`).join('')}
      </div>
    </div>` : ''}
  `;

  footerEl.innerHTML = `
    <button class="ctx-action-btn primary" onclick="closeCtxPanel();nav('missions');setTimeout(()=>selectMCMission('${missionId}'),200)">🎯 Open Mission</button>
  `;
}

// ── Event delegation for context triggers ─────────────────
document.addEventListener('click', e => {
  const ctxEl = e.target.closest('[data-ctx-type]');
  if (ctxEl) {
    e.preventDefault();
    e.stopPropagation();
    const type = ctxEl.dataset.ctxType;
    const id = ctxEl.dataset.ctxId;
    if (type && id) openCtxPanel(type, id);
  }
});

// ═══════════════════════════════════════════════════════════
// THE BRIEFING (Auto-Generated Summary)
// ═══════════════════════════════════════════════════════════

function getTimeGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function getTimeSinceLastVisit() {
  const last = parseInt(localStorage.getItem('agentOS-lastVisit') || '0');
  if (!last) return null;
  const diffMs = Date.now() - last;
  const hours = Math.floor(diffMs / 3600000);
  const mins = Math.floor((diffMs % 3600000) / 60000);
  if (hours > 24) return `${Math.floor(hours / 24)} day${Math.floor(hours/24) !== 1 ? 's' : ''} ago`;
  if (hours > 0) return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
  return `${mins} minute${mins !== 1 ? 's' : ''} ago`;
}

async function generateBriefing() {
  const body = $('briefing-body');
  if (!body) return;

  const greeting = getTimeGreeting();
  const sinceText = getTimeSinceLastVisit();

  // Gather data from local state + optionally bridge
  let systemHealth = 'All systems operational';
  let systemHealthOk = true;
  let feedData = feedEvents.slice(0, 30);
  let pendingCount = queueCards.filter(q => !q._status || q._status === 'pending').length;
  let errorCount = feedData.filter(e => e.type === 'error').length;
  let autoApproved = queueCards.filter(q => q._triageVerdict === 'auto-execute' || q._status === 'auto-approved').length;

  // Count completions per agent
  const completions = {};
  feedData.filter(e => e.type === 'task_completed').forEach(e => {
    const a = ga(e.agent);
    const key = a ? `${a.emoji} ${a.name}` : e.agent;
    completions[key] = (completions[key] || 0) + 1;
  });

  const vaultWrites = feedData.filter(e => e.type === 'vault_write').length;

  // Try bridge for system health
  if (Bridge.liveMode) {
    try {
      const sys = await Bridge.getSystemOverview().catch(() => null);
      if (sys) {
        if (sys.status === 'degraded' || sys.status === 'error') {
          systemHealth = sys.message || 'Issues detected';
          systemHealthOk = false;
        }
      }
    } catch (e) { /* ignore */ }
  }

  // Active missions
  const missions = typeof mcMissions !== 'undefined' ? mcMissions.filter(m => m.status === 'active') : [];
  const topMission = missions.sort((a, b) => b.velocity - a.velocity)[0];

  // Build HTML
  let html = `<div class="briefing-greeting">${greeting}, Trajan.</div>`;

  // Since Last Visit
  if (sinceText) {
    html += `<div class="briefing-section">
      <div class="briefing-section-title">📊 Since Last Visit</div>
      <div class="briefing-item" style="color:var(--text-muted);margin-bottom:6px">Since you were last here ${sinceText}:</div>`;

    if (Object.keys(completions).length > 0) {
      Object.entries(completions).forEach(([agent, count]) => {
        html += `<div class="briefing-item">${agent} shipped <strong>${count} task${count !== 1 ? 's' : ''}</strong></div>`;
      });
    }
    if (vaultWrites > 0) {
      html += `<div class="briefing-item">📚 <strong>${vaultWrites}</strong> vault write${vaultWrites !== 1 ? 's' : ''}</div>`;
    }
    if (errorCount > 0) {
      html += `<div class="briefing-item" style="color:var(--red)">🔴 <strong>${errorCount}</strong> error${errorCount !== 1 ? 's' : ''} detected</div>`;
    } else {
      html += `<div class="briefing-item" style="color:var(--green)">✅ No errors.</div>`;
    }
    if (autoApproved > 0) {
      html += `<div class="briefing-item">⚡ ${autoApproved} proposal${autoApproved !== 1 ? 's' : ''} auto-approved</div>`;
    }
    html += `</div>`;
  }

  // Needs Attention
  const attentionItems = [];
  if (pendingCount > 0) attentionItems.push(`📋 <strong>${pendingCount}</strong> pending proposal${pendingCount !== 1 ? 's' : ''}`);
  if (errorCount > 0) attentionItems.push(`🔴 <strong>${errorCount}</strong> error${errorCount !== 1 ? 's' : ''} to review`);

  if (attentionItems.length > 0) {
    html += `<div class="briefing-section">
      <div class="briefing-attention">
        <div class="briefing-section-title" style="margin-bottom:6px">⚡ Needs Your Attention</div>
        ${attentionItems.map(i => `<div class="briefing-item">${i}</div>`).join('')}
      </div>
    </div>`;
  }

  // Today's Plan
  if (missions.length > 0) {
    html += `<div class="briefing-section">
      <div class="briefing-section-title">🎯 Active Missions</div>`;
    missions.slice(0, 3).forEach(m => {
      html += `<div class="briefing-item">${m.icon} <strong>${m.title}</strong> — ${m.progress}% · ${m.agents_active} agent${m.agents_active !== 1 ? 's' : ''}</div>`;
    });
    if (topMission) {
      html += `<div class="briefing-highlight">💡 Suggested focus: <strong>${topMission.title}</strong> (highest velocity: ${topMission.velocity.toFixed(1)}/day)</div>`;
    }
    html += `</div>`;
  }

  // System Health
  html += `<div class="briefing-section">
    <div class="briefing-section-title">🩺 System Health</div>
    <div class="briefing-health">
      <span class="briefing-health-dot" style="background:${systemHealthOk ? 'var(--green)' : 'var(--red)'}"></span>
      <span>${systemHealth}</span>
    </div>
    <div class="briefing-item">${AGENTS.filter(a => a.status === 'active').length}/${AGENTS.length} agents active</div>
  </div>`;

  body.innerHTML = html;
}

function showBriefing() {
  generateBriefing();
  $('briefing-overlay').classList.remove('hidden');
  document.body.classList.add('modal-open');
}

function closeBriefing() {
  $('briefing-overlay').classList.add('hidden');
  document.body.classList.remove('modal-open');
  // Save visit timestamp
  localStorage.setItem('agentOS-lastVisit', String(Date.now()));
}

function closeBriefingIfOutside(e) {
  if (e.target === $('briefing-overlay')) closeBriefing();
}

function checkBriefingOnLoad() {
  const last = parseInt(localStorage.getItem('agentOS-lastVisit') || '0');
  const oneHour = 3600000;
  if (!last || (Date.now() - last > oneHour)) {
    // Show briefing after a short delay so the app finishes rendering
    setTimeout(() => showBriefing(), 1500);
  }
  // Always update the timestamp on load
  localStorage.setItem('agentOS-lastVisit', String(Date.now()));
}

// ═══════════════════════════════════════════════════════════
// INITIALIZATION
// ═══════════════════════════════════════════════════════════

document.addEventListener('DOMContentLoaded', () => {
  // Initialize Lucide icons
  if (typeof lucide !== 'undefined') lucide.createIcons();

  // Set initial XP display
  updateXPDisplay();

  // No mock notifications — real notifications come from bridge events

  // Render Feed (home page)
  renderFeed();

  // Render Queue (preload)
  renderQueue();

  // Init Talk
  initTalk();
  initMobileTalk();

  // Init active agents display
  updateActiveAgents();

  // Start simulation
  startSimulation();

  // Keyboard shortcuts for nav — handled by ux.js global handler
  // (removed duplicate handler that conflicted with ux.js key mappings)

  // Init Quick Actions
  updateQuickActions();

  // Init Agent Chat FAB
  if (typeof initAgentChatFAB === 'function') initAgentChatFAB();

  // Check if briefing should auto-show
  if (typeof checkBriefingOnLoad === 'function') checkBriefingOnLoad();
});

// ═══════════════════════════════════════════════════════════
// QUICK ACTIONS FAB
// ═══════════════════════════════════════════════════════════

const QUICK_ACTIONS = {
  feed: [
    { icon: '🔬', label: 'Research Topic', action: 'research' },
    { icon: '📊', label: 'Analyze Gaps', action: 'gaps' },
    { icon: '🎯', label: 'Generate 6 Proposals', action: 'proposals' },
    { icon: '📝', label: 'Summarize Today', action: 'summarize' },
  ],
  talk: [
    { icon: '📨', label: 'Deploy Update', action: 'deploy' },
    { icon: '📢', label: 'Broadcast to All', action: 'broadcast' },
    { icon: '🤖', label: 'Summon Agent', action: 'summon' },
  ],
  queue: [
    { icon: '⚡', label: 'Auto-Prioritize All', action: 'auto-prioritize' },
    { icon: '✅', label: 'Batch Approve', action: 'batch-approve' },
    { icon: '🗑️', label: 'Clear Answered', action: 'clear-done' },
  ],
  mind: [
    { icon: '🧠', label: 'Find Gaps', action: 'find-gaps' },
    { icon: '🔗', label: 'Auto-Link Notes', action: 'auto-link' },
    { icon: '📊', label: 'Coverage Report', action: 'coverage' },
  ],
  pulse: [
    { icon: '🔄', label: 'Refresh All Metrics', action: 'refresh-metrics' },
    { icon: '🚨', label: 'Run Health Check', action: 'health-check' },
    { icon: '📉', label: 'Cost Analysis', action: 'cost-analysis' },
  ],
};

let quickActionsOpen = false;

function toggleQuickActions() {
  quickActionsOpen = !quickActionsOpen;
  const fab = $('quick-actions-fab');
  const menu = $('quick-actions-menu');
  fab.classList.toggle('open', quickActionsOpen);
  if (quickActionsOpen) {
    menu.classList.remove('hidden');
    updateQuickActions();
  } else {
    menu.classList.add('hidden');
  }
}

function updateQuickActions() {
  const menu = $('quick-actions-menu');
  if (!menu || !quickActionsOpen) return;
  const page = currentPage || 'feed';
  const actions = QUICK_ACTIONS[page] || QUICK_ACTIONS.feed;
  menu.innerHTML = actions.map(a =>
    `<button class="qa-btn" onclick="runQuickAction('${a.action}')">
      <span class="qa-btn-icon">${a.icon}</span>
      <span class="qa-btn-label">${a.label}</span>
    </button>`
  ).join('');
}

function runQuickAction(action) {
  toggleQuickActions(); // close menu

  // Simulate the action with streaming progress
  const actionNames = {
    'research': '🔬 Researching topic...',
    'gaps': '📊 Analyzing gaps across vault...',
    'proposals': '🎯 Generating 6 proposals...',
    'summarize': '📝 Summarizing today\'s activity...',
    'deploy': '📨 Deploying update to agents...',
    'broadcast': '📢 Broadcasting to all channels...',
    'summon': '🤖 Summoning agent...',
    'auto-prioritize': '⚡ Auto-prioritizing queue...',
    'batch-approve': '✅ Batch approving items...',
    'clear-done': '🗑️ Clearing answered items...',
    'find-gaps': '🧠 Scanning vault for gaps...',
    'auto-link': '🔗 Auto-linking related notes...',
    'coverage': '📊 Generating coverage report...',
    'refresh-metrics': '🔄 Refreshing all metrics...',
    'health-check': '🚨 Running health check...',
    'cost-analysis': '📉 Analyzing token costs...',
  };

  const name = actionNames[action] || 'Running action...';
  toast(name, 'info', 2000);
  
  // Sync to Discord
  syncToDiscord('agent-feed', `⚡ Quick Action: ${name}`, 'righthand');
  addXP(20, 'quick action');

  // Simulate result after delay
  setTimeout(() => {
    const results = {
      'proposals': '✅ 6 proposals generated and posted to #dispatch',
      'gaps': '✅ Gap analysis complete — 3 areas identified',
      'research': '✅ Research task dispatched to 🔬 Researcher',
      'summarize': '✅ Daily summary posted to #daily-brief',
      'auto-prioritize': '✅ Queue reordered by urgency × impact',
      'batch-approve': '✅ 3 items approved, synced to Discord',
      'find-gaps': '✅ Found 4 uncovered topics in vault',
      'coverage': '✅ Coverage: 73% — weak in Operations, strong in Architecture',
    };
    toast(results[action] || '✅ Action complete', 'success', 3500);
    addNotification('Quick Action', results[action] || 'Complete', '⚡');
  }, 2000 + Math.random() * 1500);
}

// ═══════════════════════════════════════════════════════════
// MOBILE MENU
// ═══════════════════════════════════════════════════════════

let mobileMenuOpen = false;

function toggleMobileMenu() {
  mobileMenuOpen = !mobileMenuOpen;
  const drawer = $('mobile-menu-drawer');
  if (mobileMenuOpen) {
    drawer.classList.remove('hidden');
    // Re-render Lucide icons in the drawer
    if (typeof lucide !== 'undefined') lucide.createIcons({ nameAttr: 'data-lucide' });
  } else {
    drawer.classList.add('hidden');
  }
}

// ═══════════════════════════════════════════════════════════
// SCHEDULE VIEW
// ═══════════════════════════════════════════════════════════

const SCHEDULE_DATA = [
  { time: '06:00', events: [] },
  { time: '06:30', events: [{ label: 'QMD vault index', agent: 'ops', color: 'var(--orange)' }] },
  { time: '07:00', events: [{ label: '📢 Daily Brief generation', agent: 'righthand', color: 'var(--accent)' }] },
  { time: '07:15', events: [{ label: 'Heartbeat check', agent: 'ops', color: 'var(--orange)' }] },
  { time: '07:30', events: [] },
  { time: '08:00', events: [{ label: 'Dispatch queue scan', agent: 'righthand', color: 'var(--accent)' }, { label: 'Ingestor feed pull', agent: 'researcher', color: 'var(--accent2)' }] },
  { time: '08:30', events: [{ label: 'Session health check', agent: 'ops', color: 'var(--orange)' }] },
  { time: '09:00', events: [{ label: 'Morning batch dispatch', agent: 'righthand', color: 'var(--accent)', now: true }] },
  { time: '09:30', events: [{ label: 'Vault freshness scan', agent: 'ops', color: 'var(--orange)' }] },
  { time: '10:00', events: [{ label: 'Ontology sync', agent: 'ops', color: 'var(--orange)' }] },
  { time: '10:30', events: [] },
  { time: '11:00', events: [{ label: 'Competitive scan', agent: 'researcher', color: 'var(--accent2)' }] },
  { time: '12:00', events: [{ label: 'Memory pressure check', agent: 'righthand', color: 'var(--accent)' }] },
  { time: '13:00', events: [{ label: 'Agent fitness review', agent: 'righthand', color: 'var(--accent)' }] },
  { time: '14:00', events: [{ label: 'Red team sweep', agent: 'devil', color: 'var(--red)' }] },
  { time: '15:00', events: [{ label: 'Auto-knowledge capture', agent: 'ops', color: 'var(--orange)' }] },
];

function renderSchedule() {
  const el = $('schedule-content');
  if (!el) return;
  el.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
      <div>
        <div style="font-size:16px;font-weight:700">Today — ${new Date().toLocaleDateString('en-US',{weekday:'long',month:'short',day:'numeric'})}</div>
        <div style="font-size:12px;color:var(--text-muted)">${SCHEDULE_DATA.reduce((s,h)=>s+h.events.length,0)} scheduled tasks · 3 cron jobs</div>
      </div>
      <button class="qa-btn" onclick="runQuickAction('summarize')" style="box-shadow:none">📅 Schedule Task</button>
    </div>
    <div class="schedule-timeline">
      ${SCHEDULE_DATA.map(h => `
        <div class="schedule-hour">
          <div class="schedule-time">${h.time}</div>
          <div class="schedule-events">
            ${h.events.length ? h.events.map(e => `
              <div class="schedule-event${e.now?' schedule-now':''}" style="border-left-color:${e.color}">
                ${e.label}
                <span style="font-size:11px;color:var(--text-muted);margin-left:8px">${(ga(e.agent)||{}).emoji||'🤖'}</span>
              </div>
            `).join('') : ''}
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

// ═══════════════════════════════════════════════════════════
// MISSION CONTROL VIEW — Real Data + Hill Chart + Kanban
// ═══════════════════════════════════════════════════════════

// Seed data — replaced by bridge data when live
const MISSIONS_DATA = [];

const MISSION_FEED_DATA = [];

const MISSION_DECISIONS_DATA = [];

const MISSION_BLOCKING_DATA = [];

const MISSION_PLANS_DATA = [];

let mcSelectedMission = null;
let mcActiveTab = 'overview';
let mcMissions = [...MISSIONS_DATA];
let mcFeed = [...MISSION_FEED_DATA];
let mcDecisions = [...MISSION_DECISIONS_DATA];
let mcBlocking = [...MISSION_BLOCKING_DATA];
let mcPlans = [...MISSION_PLANS_DATA];
let mcAllTasks = [];
let mcKanbanDragState = null;
let _missionsRefreshTimer = null;

// ── Source helpers ─────────────────────────────────────────

function inferMissionSource(raw) {
  if (raw.source) return raw.source;
  const t = (raw.title || '').toLowerCase();
  const d = (raw.description || raw.desc || '').toLowerCase();
  if (t.includes('vault') || t.includes('research') || d.includes('vault')) return 'vault-research';
  if (raw.auto_generated || t.includes('auto') || raw.origin === 'proactive') return 'proactive-generator';
  return 'manual';
}
function sourceIcon(s)  { return ({ 'proactive-generator':'🤖','manual':'🎯','vault-research':'🧠' })[s] || '🎯'; }
function sourceLabel(s)  { return ({ 'proactive-generator':'Auto','manual':'Manual','vault-research':'Vault' })[s] || s || '?'; }
function sourceColor(s)  { return ({ 'proactive-generator':'#cba6f7','manual':'#89b4fa','vault-research':'#f9e2af' })[s] || '#6c7086'; }

function deriveMilestones(tasks) {
  if (!tasks || tasks.length === 0) return ['Planning','Building','Shipping'];
  const done = tasks.filter(t => t.status === 'done' || t.status === 'completed');
  const active = tasks.filter(t => t.status === 'active' || t.status === 'in_progress');
  const remaining = tasks.filter(t => !['done','completed','active','in_progress'].includes(t.status));
  const ms = [];
  if (done.length > 0) ms.push(done.length + ' tasks done ✓');
  if (active.length > 0) ms.push(active.length + ' in progress');
  if (remaining.length > 0) ms.push(remaining.length + ' remaining');
  return ms.length > 0 ? ms : ['No tasks yet'];
}

// ── Normalize bridge → mission ────────────────────────────

function normalizeBridgeMission(raw) {
  const tasks = raw.tasks || [];
  const tasksDone = tasks.filter(t => t.status === 'done' || t.status === 'completed').length;
  const tasksTotal = tasks.length || raw.tasks_total || 0;
  const progress = tasksTotal > 0 ? Math.round((tasksDone / tasksTotal) * 100) : (raw.progress || 0);
  const agentSet = new Set(tasks.map(t => t.agent).filter(Boolean));
  let status = raw.status || 'active';
  if (status === 'queued' || status === 'pending') status = 'planned';
  if (progress >= 100 && status === 'active') status = 'completed';
  const daysActive = raw.days_active || Math.max(1, Math.round((Date.now() - new Date(raw.created_at || raw.start_date || Date.now()).getTime()) / 86400000));
  const velocity = tasksDone > 0 ? parseFloat((tasksDone / daysActive).toFixed(1)) : 0;
  const source = raw.source || raw.origin || inferMissionSource(raw);
  return {
    id: raw.id || raw.goal_id || ('bridge-' + Date.now() + '-' + Math.random().toString(36).slice(2,6)),
    icon: raw.icon || sourceIcon(source),
    title: raw.title || raw.name || 'Untitled Mission',
    desc: raw.description || raw.desc || '',
    progress, status,
    goal: raw.goal || raw.category || '',
    target_date: raw.target_date || raw.deadline || '',
    success_criteria: raw.success_criteria || '',
    agents_active: agentSet.size || raw.agents_active || 0,
    blocking_items: raw.blocking_items || 0,
    velocity, tasks_done: tasksDone, tasks_total: tasksTotal,
    days_active: daysActive,
    milestones: raw.milestones || deriveMilestones(tasks),
    source, tasks,
  };
}

// ── Data fetch ────────────────────────────────────────────

async function fetchMissionsFromBridge() {
  if (typeof Bridge === 'undefined') return false;
  try {
    const [missionsRaw, goalsRaw, feed, proposals, plans, allTasks] = await Promise.all([
      Bridge.apiFetch('/api/missions').catch(() => null),
      Bridge.apiFetch('/api/missions/goals').catch(() => null),
      Bridge.apiFetch('/api/missions/feed?limit=50').catch(() => null),
      Bridge.apiFetch('/api/proposals?status=pending').catch(() => null),
      Bridge.apiFetch('/api/plans').catch(() => null),
      Bridge.apiFetch('/api/tasks/all').catch(() => null),
    ]);

    // Merge missions from /api/missions + /api/missions/goals + /api/plans
    let merged = [];
    const seen = new Set();
    const addNorm = (raw) => { const n = normalizeBridgeMission(raw); if (!seen.has(n.id)) { merged.push(n); seen.add(n.id); } };

    if (missionsRaw && Array.isArray(missionsRaw)) missionsRaw.forEach(addNorm);
    if (goalsRaw && Array.isArray(goalsRaw)) goalsRaw.forEach(addNorm);

    // Derive missions from plans not already tracked
    if (plans && Array.isArray(plans) && plans.length > 0) {
      plans.forEach(p => {
        const pid = p.mission_id || p.goal_id || p.id;
        if (!seen.has(pid)) {
          const tasks = p.tasks || [];
          addNorm({
            id: pid, title: p.name || p.title, description: p.description || '',
            tasks, source: 'manual',
            status: tasks.length > 0 && tasks.every(t => t.status === 'done' || t.status === 'completed') ? 'completed' : 'active',
          });
        }
      });
      // Update mcPlans
      mcPlans = plans.map(p => {
        const tasks = p.tasks || [];
        return {
          id: p.id, name: p.name || p.title, mission: p.mission_id || p.goal_id || p.id,
          backlog: tasks.filter(t => (t.column||t.status||'') === 'backlog' || t.status === 'queued' || t.status === 'pending').length,
          active: tasks.filter(t => ['active','in_progress'].includes(t.column||t.status||'')).length,
          review: tasks.filter(t => (t.column||t.status||'') === 'review').length,
          done: tasks.filter(t => ['done','completed'].includes(t.column||t.status||'')).length,
          agents: [...new Set(tasks.map(t => t.agent).filter(Boolean))].map(a => {
            const ag = typeof ga === 'function' ? ga(a) : null;
            return ag ? ag.emoji : '🤖';
          }),
          tasks,
        };
      });
    }
    // Always use API data (even if empty) — no seed fallback
    mcMissions = merged;

    // Store all tasks for cross-referencing
    if (allTasks && Array.isArray(allTasks)) {
      mcAllTasks = allTasks;
      mcMissions.forEach(m => {
        const related = mcAllTasks.filter(t =>
          t.mission_id === m.id || t.goal_id === m.id ||
          (t.tags && t.tags.includes(m.id))
        );
        if (related.length > 0 && (!m.tasks || m.tasks.length === 0)) {
          m.tasks = related;
          m.tasks_total = related.length;
          m.tasks_done = related.filter(t => t.status === 'done' || t.status === 'completed').length;
          m.progress = m.tasks_total > 0 ? Math.round((m.tasks_done / m.tasks_total) * 100) : 0;
        }
      });
    }

    if (feed && Array.isArray(feed)) {
      mcFeed = feed.map(f => ({
        ts: f.timestamp || f.ts, agent: f.agent_emoji || f.agent || '🤖',
        type: f.type || 'task', text: f.text || f.message || f.description || f.content || '',
        mission: f.mission_id || f.mission || '',
      }));
    }
    if (proposals && Array.isArray(proposals)) {
      mcBlocking = proposals.filter(p => p.status === 'pending').map(p => ({
        mission: p.mission_id || p.goal_id || '', type: 'proposal',
        title: p.title || p.description, source: p.agent || p.source || 'Agent',
      }));
    }
    return true;
  } catch (e) {
    console.warn('[MissionControl] Bridge load failed, using seed data:', e.message);
    return false;
  }
}

async function renderMissions() {
  await fetchMissionsFromBridge();
  renderMCSidebar();
  if (mcSelectedMission) renderMCDetail(mcSelectedMission);
  else renderMCHillAndCards();
  startMissionsRefresh();
}

// ── Hill Chart — Real Progress ────────────────────────────

function calcHillPosition(m) {
  // 0-30% → bottom-left (research)
  // 30-60% → top of hill (figured out)
  // 60-100% → right side (shipping)
  const pct = m.progress || 0;
  let hillPct;
  if (m.status === 'planned') hillPct = 3;
  else if (m.status === 'completed') hillPct = 97;
  else if (pct <= 30) hillPct = 5 + (pct / 30) * 35;
  else if (pct <= 60) hillPct = 40 + ((pct - 30) / 30) * 20;
  else hillPct = 60 + ((pct - 60) / 40) * 35;
  const x = 30 + (hillPct / 100) * 540;
  const t = x / 600;
  const y = 180 - 140 * Math.sin(t * Math.PI);
  return { x, y: y + 2 };
}

function hillPosition(progress) {
  const x = 30 + (progress / 100) * 540;
  const t = x / 600;
  const y = 180 - 140 * Math.sin(t * Math.PI);
  return { x, y: y + 2 };
}

function hillDotColor(m) {
  if (m.status === 'completed') return '#94e2d5';
  if (m.status === 'planned') return '#89b4fa';
  if ((m.blocking_items || 0) > 0) return '#f38ba8';
  return '#a6e3a1';
}

function hillDotSize(m) {
  if (m.status === 'completed') return 6;
  if ((m.blocking_items || 0) > 0) return 9;
  if ((m.tasks_total || 0) >= 15) return 8;
  return 7;
}

function _trunc(s, n) { return s.length > n ? s.slice(0, n-1) + '…' : s; }

function renderMCHillAndCards() {
  const detail = $('mc-detail');
  if (!detail) return;

  if (mcMissions.length === 0) {
    detail.innerHTML = '<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:300px;gap:16px;color:var(--text-muted)">'
      + '<div style="font-size:48px">🎯</div>'
      + '<div style="font-size:18px;font-weight:600;color:var(--text)">No missions yet</div>'
      + '<div style="font-size:14px;max-width:400px;text-align:center">No missions yet — create one from the Command page</div>'
      + '<button class="mc-new-mission-btn" onclick="showNewMissionModal()" style="margin-top:8px">＋ New Mission</button>'
      + '</div>';
    return;
  }

  const active = mcMissions.filter(m => m.status !== 'completed' && m.status !== 'planned');
  const planned = mcMissions.filter(m => m.status === 'planned');
  const completed = mcMissions.filter(m => m.status === 'completed');
  const all = [...active, ...planned, ...completed];

  // Source breakdown
  const sources = {};
  mcMissions.forEach(m => { const s = m.source || 'manual'; sources[s] = (sources[s] || 0) + 1; });

  detail.innerHTML = `
    <div class="hill-chart-container">
      <div class="hill-chart-title">
        Mission Progress
        <span style="margin-left:12px;display:inline-flex;gap:6px;flex-wrap:wrap">
          ${Object.entries(sources).map(([s, c]) =>
            '<span style="font-size:10px;padding:2px 8px;border-radius:10px;background:' + sourceColor(s) + '20;color:' + sourceColor(s) + ';border:1px solid ' + sourceColor(s) + '40">' + sourceIcon(s) + ' ' + sourceLabel(s) + ' (' + c + ')</span>'
          ).join('')}
        </span>
      </div>
      <div class="hill-chart-labels">
        <span class="hill-label-left">Figuring it out</span>
        <span class="hill-label-right">Making it happen</span>
      </div>
      <svg class="hill-chart-svg" viewBox="0 0 600 200" preserveAspectRatio="xMidYMid meet">
        <defs>
          <linearGradient id="hill-grad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stop-color="#1e1e2e"/>
            <stop offset="50%" stop-color="#313244"/>
            <stop offset="100%" stop-color="#1e1e2e"/>
          </linearGradient>
          <linearGradient id="hill-stroke-grad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stop-color="#cba6f7" stop-opacity="0.4"/>
            <stop offset="50%" stop-color="#cba6f7"/>
            <stop offset="100%" stop-color="#a6e3a1" stop-opacity="0.4"/>
          </linearGradient>
          <filter id="dot-shadow">
            <feDropShadow dx="0" dy="1" stdDeviation="2" flood-color="#000" flood-opacity="0.5"/>
          </filter>
          <filter id="dot-glow">
            <feGaussianBlur stdDeviation="3" result="blur"/>
            <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
        </defs>
        <rect x="0" y="0" width="200" height="200" fill="#cba6f720" rx="0"/>
        <rect x="200" y="0" width="200" height="200" fill="#f9e2af10" rx="0"/>
        <rect x="400" y="0" width="200" height="200" fill="#a6e3a110" rx="0"/>
        <text x="100" y="195" text-anchor="middle" fill="#cba6f7" font-size="9" opacity="0.5">Research</text>
        <text x="300" y="195" text-anchor="middle" fill="#f9e2af" font-size="9" opacity="0.5">Design</text>
        <text x="500" y="195" text-anchor="middle" fill="#a6e3a1" font-size="9" opacity="0.5">Ship</text>
        <path d="M0,180 C150,180 150,40 300,40 C450,40 450,180 600,180 Z" fill="url(#hill-grad)" opacity="0.6"/>
        <path d="M0,180 C150,180 150,40 300,40 C450,40 450,180 600,180" fill="none" stroke="url(#hill-stroke-grad)" stroke-width="2"/>
        <line x1="300" y1="35" x2="300" y2="185" stroke="#585b70" stroke-width="1" stroke-dasharray="4,4" opacity="0.5"/>
        ${all.map(m => {
          const pos = calcHillPosition(m);
          const color = hillDotColor(m);
          const r = hillDotSize(m);
          return '<g class="hill-dot-group" data-mission="' + m.id + '" onclick="selectMCMission(\'' + m.id + '\')" style="cursor:pointer">'
            + '<circle cx="' + pos.x + '" cy="' + pos.y + '" r="' + (r+4) + '" fill="' + color + '" opacity="0.15" class="hill-dot-pulse"/>'
            + '<circle cx="' + pos.x + '" cy="' + pos.y + '" r="' + r + '" fill="' + color + '" filter="url(#dot-shadow)" class="hill-dot"/>'
            + '<text x="' + pos.x + '" y="' + (pos.y - r - 8) + '" text-anchor="middle" fill="' + color + '" font-size="8" font-weight="600" opacity="0.9">' + (m.icon||'🎯') + ' ' + _trunc(m.title,18) + '</text>'
            + '<title>' + m.title + ' — ' + (m.progress||0) + '% (' + (m.tasks_done||0) + '/' + (m.tasks_total||0) + ' tasks)</title>'
            + '</g>';
        }).join('')}
      </svg>
      <div class="hill-chart-legend">
        <span class="hill-legend-item"><span class="hill-legend-dot" style="background:#a6e3a1"></span>Active</span>
        <span class="hill-legend-item"><span class="hill-legend-dot" style="background:#89b4fa"></span>Planned</span>
        <span class="hill-legend-item"><span class="hill-legend-dot" style="background:#94e2d5"></span>Complete</span>
        <span class="hill-legend-item"><span class="hill-legend-dot" style="background:#f38ba8"></span>Blocked</span>
      </div>
    </div>

    <div class="mc-cards-grid">
      ${active.map(m => renderMissionCard(m)).join('')}
      ${planned.map(m => renderMissionCard(m)).join('')}
      ${completed.map(m => renderMissionCard(m)).join('')}
    </div>
  `;

  requestAnimationFrame(() => {
    detail.querySelectorAll('.hill-dot').forEach((dot, i) => {
      dot.style.opacity = '0'; dot.style.transform = 'scale(0)';
      setTimeout(() => { dot.style.transition = 'opacity 0.4s ease, transform 0.4s cubic-bezier(0.34,1.56,0.64,1)'; dot.style.opacity = '1'; dot.style.transform = 'scale(1)'; }, i * 80);
    });
    detail.querySelectorAll('.mc-card-ring-fill').forEach(ring => {
      const target = ring.getAttribute('data-target-offset');
      if (target) { ring.style.strokeDashoffset = ring.getAttribute('data-full-circ'); setTimeout(() => { ring.style.transition = 'stroke-dashoffset 0.8s ease'; ring.style.strokeDashoffset = target; }, 200); }
    });
  });
}

// ── Mission Card ──────────────────────────────────────────

function renderMissionCard(m) {
  const progressColor = m.status === 'completed' ? 'var(--teal)' : (m.progress||0) >= 50 ? 'var(--green)' : 'var(--yellow)';
  const statusMap = { active:'Active', planned:'Planning', completed:'Complete' };
  const statusClass = m.status === 'completed' ? 'mc-status-complete' : m.status === 'planned' ? 'mc-status-planning' : (m.blocking_items||0) > 0 ? 'mc-status-blocked' : 'mc-status-active';
  const statusLabel = (m.blocking_items||0) > 0 && m.status === 'active' ? 'Blocked' : (statusMap[m.status] || 'Active');
  const blocking = mcBlocking.filter(b => b.mission === m.id);
  const vel = typeof m.velocity === 'number' ? m.velocity.toFixed(1) : '0.0';
  const ringSize = 48, r = (ringSize - 6) / 2, circ = 2 * Math.PI * r;
  const offset = circ - ((m.progress||0) / 100) * circ;

  return '<div class="mc-mission-card" onclick="selectMCMission(\'' + m.id + '\')">'
    + '<div class="mc-card-top-row">'
    +   '<div class="mc-card-title-area">'
    +     '<span class="mc-card-icon">' + (m.icon||'🎯') + '</span>'
    +     '<div><div class="mc-card-title">' + m.title + '</div><div class="mc-card-desc">' + (m.desc||'') + '</div></div>'
    +   '</div>'
    +   '<div class="mc-card-ring-wrap">'
    +     '<svg width="' + ringSize + '" height="' + ringSize + '" viewBox="0 0 ' + ringSize + ' ' + ringSize + '">'
    +       '<circle cx="' + ringSize/2 + '" cy="' + ringSize/2 + '" r="' + r + '" fill="none" stroke="var(--bg-raised)" stroke-width="4"/>'
    +       '<circle cx="' + ringSize/2 + '" cy="' + ringSize/2 + '" r="' + r + '" fill="none" stroke="' + progressColor + '" stroke-width="4" stroke-dasharray="' + circ + '" stroke-dashoffset="' + offset + '" stroke-linecap="round" transform="rotate(-90 ' + ringSize/2 + ' ' + ringSize/2 + ')" class="mc-card-ring-fill" data-target-offset="' + offset + '" data-full-circ="' + circ + '"/>'
    +     '</svg>'
    +     '<span class="mc-card-ring-pct">' + (m.progress||0) + '%</span>'
    +   '</div>'
    + '</div>'
    + '<div class="mc-card-stats-row">'
    +   '<span class="mc-card-stat"><span class="mc-card-stat-val">' + (m.tasks_done||0) + '/' + (m.tasks_total||0) + '</span> tasks</span>'
    +   '<span class="mc-card-stat"><span class="mc-card-stat-val">' + (m.agents_active||0) + '</span> agents</span>'
    +   '<span class="mc-card-stat"><span class="mc-card-stat-val">' + (m.days_active||0) + 'd</span> active</span>'
    +   '<span class="mc-card-stat"><span class="mc-card-stat-val">' + vel + '</span>/day</span>'
    + '</div>'
    + '<div class="mc-card-bottom-row">'
    +   '<span class="mc-card-status ' + statusClass + '">' + statusLabel + '</span>'
    +   '<span style="font-size:10px;padding:2px 8px;border-radius:8px;background:' + sourceColor(m.source) + '20;color:' + sourceColor(m.source) + '">' + sourceLabel(m.source) + '</span>'
    +   (blocking.length > 0 ? blocking.map(b => '<span class="mc-card-blocking-pill">⚠ ' + b.title + '</span>').join('') : '')
    + '</div>'
    + (blocking.length > 0 ? '<div class="mc-card-needs-input">⚡ Needs your input · ' + blocking.length + ' item' + (blocking.length>1?'s':'') + '</div>' : '')
    + '</div>';
}

// ── Sidebar & Refresh ─────────────────────────────────────

function startMissionsRefresh() {
  if (_missionsRefreshTimer) return;
  _missionsRefreshTimer = setInterval(async () => {
    if (!shouldPoll()) return;
    if (currentPage !== 'missions') { stopMissionsRefresh(); return; }
    const updated = await fetchMissionsFromBridge();
    if (updated) { renderMCSidebar(); if (mcSelectedMission) renderMCDetail(mcSelectedMission); else renderMCHillAndCards(); }
  }, 30000);
}

function stopMissionsRefresh() {
  if (_missionsRefreshTimer) { clearInterval(_missionsRefreshTimer); _missionsRefreshTimer = null; }
}

function renderMCSidebar() {
  const sidebar = $('mc-sidebar');
  if (!sidebar) return;
  const grouped = { active: [], planned: [], completed: [] };
  mcMissions.forEach(m => { const s = m.status === 'completed' ? 'completed' : m.status === 'planned' ? 'planned' : 'active'; grouped[s].push(m); });
  grouped.active.sort((a, b) => (b.progress||0) - (a.progress||0));

  const renderGroup = (label, missions, status, expanded) => {
    if (missions.length === 0) return '';
    return '<div class="mc-sb-group">'
      + '<div class="mc-sb-group-header" onclick="toggleMCGroup(this)">'
      +   '<span class="mc-sb-chevron' + (expanded ? ' expanded' : '') + '">›</span>'
      +   '<span class="mc-sb-group-label">' + label + '</span>'
      +   '<span class="mc-sb-group-count">' + missions.length + '</span>'
      + '</div>'
      + '<div class="mc-sb-group-items' + (expanded ? '' : ' collapsed') + '">'
      + missions.map(m => {
          const isA = mcSelectedMission === m.id;
          const pc = (m.progress||0) >= 100 ? 'var(--accent)' : (m.progress||0) >= 50 ? 'var(--green)' : 'var(--yellow)';
          const pulse = status === 'active' && (m.agents_active||0) > 0 ? '<span class="mc-pulse-dot"></span>' : '';
          return '<div class="mc-sb-item' + (isA ? ' active' : '') + '" onclick="selectMCMission(\'' + m.id + '\')">'
            + '<div class="mc-sb-item-top">' + pulse
            +   '<span class="mc-sb-item-icon">' + (m.icon||'🎯') + '</span>'
            +   '<span class="mc-sb-item-name">' + m.title + '</span>'
            + '</div>'
            + '<div class="mc-sb-item-bar"><div class="mc-sb-item-bar-fill" style="width:' + (m.progress||0) + '%;background:' + pc + '"></div></div>'
            + '</div>';
        }).join('')
      + '</div></div>';
  };

  sidebar.innerHTML = renderGroup('ACTIVE', grouped.active, 'active', true)
    + renderGroup('PLANNED', grouped.planned, 'planned', false)
    + renderGroup('COMPLETED', grouped.completed, 'completed', false)
    + '<button class="mc-new-mission-btn" onclick="showNewMissionModal()">＋ New Mission</button>';
}

function toggleMCGroup(header) {
  header.querySelector('.mc-sb-chevron').classList.toggle('expanded');
  header.nextElementSibling.classList.toggle('collapsed');
}

function selectMCMission(id) {
  mcSelectedMission = id; mcActiveTab = 'overview';
  renderMCSidebar(); renderMCDetail(id);
}

function renderMiniProgressRing(pct, color, size) {
  const r = (size - 4) / 2, circ = 2 * Math.PI * r, offset = circ - (pct / 100) * circ;
  return '<svg class="mc-mini-ring" width="' + size + '" height="' + size + '" viewBox="0 0 ' + size + ' ' + size + '">'
    + '<circle cx="' + size/2 + '" cy="' + size/2 + '" r="' + r + '" fill="none" stroke="var(--bg-raised)" stroke-width="3"/>'
    + '<circle cx="' + size/2 + '" cy="' + size/2 + '" r="' + r + '" fill="none" stroke="' + color + '" stroke-width="3" stroke-dasharray="' + circ + '" stroke-dashoffset="' + offset + '" stroke-linecap="round" transform="rotate(-90 ' + size/2 + ' ' + size/2 + ')" style="transition: stroke-dashoffset 0.5s ease"/>'
    + '</svg>';
}

// ── Mission Detail ────────────────────────────────────────

function renderMCDetail(missionId) {
  const detail = $('mc-detail');
  if (!detail) return;
  const m = mcMissions.find(x => x.id === missionId);
  if (!m) { renderMCHillAndCards(); return; }

  const statusClass = m.status === 'completed' ? 'mc-badge-completed' : m.status === 'planned' ? 'mc-badge-planned' : (m.blocking_items||0) > 0 ? 'mc-badge-blocked' : 'mc-badge-active';
  const statusLabel = m.status === 'completed' ? '✓ Completed' : m.status === 'planned' ? 'Planned' : (m.blocking_items||0) > 0 ? '⚠ Blocked' : 'Active';
  const linkedAgents = (typeof AGENTS !== 'undefined' ? AGENTS : []).filter(a => a.status === 'active').slice(0, m.agents_active || 0);

  detail.innerHTML = '<div class="mc-detail-header">'
    + '<div class="mc-detail-title-row">'
    +   '<button class="mc-back-btn" onclick="mcSelectedMission=null;renderMCSidebar();renderMCHillAndCards()">←</button>'
    +   '<span class="mc-detail-icon">' + (m.icon||'🎯') + '</span>'
    +   '<h2 class="mc-detail-title">' + m.title + '</h2>'
    +   '<span class="mc-badge ' + statusClass + '">' + statusLabel + '</span>'
    + '</div>'
    + '<div class="mc-detail-meta-row">'
    +   (m.goal ? '<span class="mc-detail-meta-chip">🎯 ' + m.goal + '</span>' : '')
    +   (m.target_date ? '<span class="mc-detail-meta-chip">📅 ' + m.target_date + '</span>' : '')
    +   (m.source ? '<span class="mc-detail-meta-chip" style="background:' + sourceColor(m.source) + '20;color:' + sourceColor(m.source) + '">' + sourceIcon(m.source) + ' ' + sourceLabel(m.source) + '</span>' : '')
    +   (linkedAgents.length > 0 ? '<span class="mc-detail-meta-chip">' + linkedAgents.map(a => a.emoji).join('') + ' ' + linkedAgents.length + ' agent' + (linkedAgents.length>1?'s':'') + '</span>' : '')
    + '</div>'
    + (m.success_criteria ? '<div class="mc-detail-criteria-inline">✅ <strong>Success:</strong> ' + m.success_criteria + '</div>' : '')
    + '</div>'
    + '<div class="mc-tabs">'
    +   ['overview','plans','kanban','activity','decisions'].map(tab =>
          '<button class="mc-tab' + (mcActiveTab === tab ? ' active' : '') + '" onclick="mcSwitchTab(\'' + tab + '\',\'' + missionId + '\')">' + tab.charAt(0).toUpperCase() + tab.slice(1) + '</button>'
        ).join('')
    + '</div>'
    + '<div class="mc-tab-content" id="mc-tab-content"></div>';

  mcRenderTab(mcActiveTab, missionId);
}

function mcSwitchTab(tab, missionId) {
  mcActiveTab = tab;
  $$('.mc-tab').forEach(t => t.classList.toggle('active', t.textContent.toLowerCase() === tab));
  mcRenderTab(tab, missionId);
}

function mcRenderTab(tab, missionId) {
  const el = $('mc-tab-content');
  if (!el) return;
  switch(tab) {
    case 'overview':  mcRenderOverview(el, missionId); break;
    case 'plans':     mcRenderPlans(el, missionId); break;
    case 'kanban':    mcRenderKanban(el, missionId); break;
    case 'activity':  mcRenderActivity(el, missionId); break;
    case 'decisions': mcRenderDecisions(el, missionId); break;
  }
}

// ── Overview Tab ──────────────────────────────────────────

function mcRenderOverview(el, missionId) {
  const m = mcMissions.find(x => x.id === missionId);
  if (!m) return;
  const blocking = mcBlocking.filter(b => b.mission === missionId);
  const progressColor = (m.progress||0) >= 100 ? 'var(--accent)' : (m.progress||0) >= 50 ? 'var(--green)' : 'var(--yellow)';
  const vel = typeof m.velocity === 'number' ? m.velocity : 0;
  const estCompletion = vel > 0 ? Math.ceil(((m.tasks_total||0) - (m.tasks_done||0)) / vel) : null;

  // Task breakdown
  const tasks = m.tasks || [];
  const tb = { queued:0, active:0, review:0, done:0 };
  tasks.forEach(t => {
    const s = t.status || t.column || 'queued';
    if (s === 'done' || s === 'completed') tb.done++;
    else if (s === 'active' || s === 'in_progress') tb.active++;
    else if (s === 'review') tb.review++;
    else tb.queued++;
  });

  el.innerHTML = '<div class="mc-ov-top">'
    + '<div class="mc-progress-ring-wrap">' + renderProgressRing(m.progress||0, progressColor, 120) + '<div class="mc-ring-label">' + (m.progress||0) + '%</div></div>'
    + '<div class="mc-ov-metrics">'
    +   '<div class="mc-metric"><span class="mc-metric-val">' + (m.tasks_done||0) + '/' + (m.tasks_total||0) + '</span><span class="mc-metric-label">Tasks</span></div>'
    +   '<div class="mc-metric"><span class="mc-metric-val">' + (m.agents_active||0) + '</span><span class="mc-metric-label">Agents</span></div>'
    +   '<div class="mc-metric"><span class="mc-metric-val">' + (m.days_active||0) + 'd</span><span class="mc-metric-label">Active</span></div>'
    +   '<div class="mc-metric"><span class="mc-metric-val">' + vel.toFixed(1) + '/d</span><span class="mc-metric-label">Velocity</span></div>'
    +   (estCompletion !== null ? '<div class="mc-metric"><span class="mc-metric-val">~' + estCompletion + 'd</span><span class="mc-metric-label">Est. Left</span></div>' : '')
    + '</div></div>'
    // Task breakdown bar
    + (tasks.length > 0 ? '<div style="margin:12px 0">'
      + '<div class="mc-section-label">Task Breakdown</div>'
      + '<div style="display:flex;height:8px;border-radius:4px;overflow:hidden;background:var(--bg-raised);margin:6px 0">'
      +   (tb.done > 0 ? '<div style="flex:' + tb.done + ';background:#a6e3a1" title="Done: ' + tb.done + '"></div>' : '')
      +   (tb.review > 0 ? '<div style="flex:' + tb.review + ';background:#cba6f7" title="Review: ' + tb.review + '"></div>' : '')
      +   (tb.active > 0 ? '<div style="flex:' + tb.active + ';background:#f9e2af" title="Active: ' + tb.active + '"></div>' : '')
      +   (tb.queued > 0 ? '<div style="flex:' + tb.queued + ';background:#6c7086" title="Queued: ' + tb.queued + '"></div>' : '')
      + '</div>'
      + '<div style="display:flex;gap:12px;font-size:11px;color:var(--text-muted)">'
      +   '<span style="color:#a6e3a1">✓ ' + tb.done + ' done</span>'
      +   '<span style="color:#cba6f7">◎ ' + tb.review + ' review</span>'
      +   '<span style="color:#f9e2af">● ' + tb.active + ' active</span>'
      +   '<span style="color:#6c7086">○ ' + tb.queued + ' queued</span>'
      + '</div></div>' : '')
    // Blocking
    + (blocking.length > 0 ? '<div class="mc-needs-input"><div class="mc-needs-input-header">⚡ Needs Your Input</div>'
      + blocking.map(b => '<div class="mc-blocking-item"><span class="mc-blocking-type">' + (b.type==='proposal'?'📋':b.type==='review'?'👁️':'❓') + '</span><div class="mc-blocking-body"><div class="mc-blocking-title">' + b.title + '</div><div class="mc-blocking-source">From: ' + b.source + '</div></div></div>').join('')
      + '</div>' : '')
    // Milestones
    + '<div class="mc-milestones-section"><div class="mc-section-label">Milestones</div>'
    + '<div class="mc-milestone-track"><div class="mc-milestone-bar"><div class="mc-milestone-bar-fill" style="width:' + (m.progress||0) + '%;background:' + progressColor + '"></div></div>'
    + '<div class="mc-milestone-markers">'
    + (m.milestones||[]).map((ms, i) => {
        const pos = ((i+1) / (m.milestones||[]).length) * 100;
        const done = ms.includes('✓');
        return '<div class="mc-milestone-marker' + (done?' done':'') + '" style="left:' + pos + '%"><div class="mc-milestone-dot"></div><div class="mc-milestone-label">' + ms.replace(' ✓','') + '</div></div>';
      }).join('')
    + '</div></div></div>'
    // Linked vault notes
    + '<div class="mc-linked-section"><div class="mc-section-label">Linked Vault Notes</div><div class="mc-linked-items">'
    + ((typeof VAULT_NOTES !== 'undefined' ? VAULT_NOTES : []).filter(v => v.tags.some(t => (m.title||'').toLowerCase().includes(t) || (m.desc||'').toLowerCase().includes(t))).slice(0,3).map(v =>
        '<div class="mc-linked-item"><span class="mc-linked-icon">📝</span><span class="mc-linked-title">' + v.title + '</span><span class="mc-linked-conf">' + v.confidence + '%</span></div>'
      ).join('') || '<div class="mc-empty" style="padding:8px">No linked notes found</div>')
    + '</div></div>';
}

function renderProgressRing(pct, color, size) {
  const r = (size - 8) / 2, circ = 2 * Math.PI * r, offset = circ - (pct / 100) * circ;
  return '<svg class="mc-progress-ring" width="' + size + '" height="' + size + '" viewBox="0 0 ' + size + ' ' + size + '">'
    + '<circle cx="' + size/2 + '" cy="' + size/2 + '" r="' + r + '" fill="none" stroke="var(--bg-raised)" stroke-width="6"/>'
    + '<circle cx="' + size/2 + '" cy="' + size/2 + '" r="' + r + '" fill="none" stroke="' + color + '" stroke-width="6" stroke-dasharray="' + circ + '" stroke-dashoffset="' + offset + '" stroke-linecap="round" transform="rotate(-90 ' + size/2 + ' ' + size/2 + ')" style="transition: stroke-dashoffset 0.8s ease"/>'
    + '</svg>';
}

// ── Plans Tab ─────────────────────────────────────────────

async function mcRenderPlans(el, missionId) {
  const m = mcMissions.find(x => x.id === missionId);
  const plans = mcPlans.filter(p => p.mission === missionId);
  let missionTasks = (m && m.tasks) ? m.tasks : [];

  // Try bridge detail
  const bridgeDetail = await mcLoadMissionDetail(missionId);
  if (bridgeDetail && bridgeDetail.related_tasks && bridgeDetail.related_tasks.length > 0) missionTasks = bridgeDetail.related_tasks;
  // Fallback to mcAllTasks
  if (missionTasks.length === 0 && mcAllTasks.length > 0) {
    missionTasks = mcAllTasks.filter(t => t.mission_id === missionId || t.goal_id === missionId || (t.tags && t.tags.includes(missionId)));
  }

  el.innerHTML = '<div class="mc-plans-list">'
    + (plans.length === 0 && missionTasks.length === 0 ? '<div class="mc-empty">No plans or tasks linked yet.</div>' : '')
    + plans.map(p => {
        const total = (p.backlog||0) + (p.active||0) + (p.review||0) + (p.done||0);
        const donePct = total > 0 ? Math.round((p.done / total) * 100) : 0;
        return '<div class="mc-plan-card" onclick="nav(\'plans\');setTimeout(()=>typeof selectPlan===\'function\'&&selectPlan(\'' + p.id + '\'),200)">'
          + '<div class="mc-plan-header"><span class="mc-plan-name">' + p.name + '</span><span class="mc-plan-agents">' + (p.agents||[]).join(' ') + '</span></div>'
          + '<div class="mc-plan-summary">' + (p.backlog||0) + ' backlog · ' + (p.active||0) + ' active · ' + (p.review||0) + ' review · ' + (p.done||0) + ' done</div>'
          + '<div class="mc-plan-bar"><div class="mc-plan-bar-fill" style="width:' + donePct + '%"></div></div></div>';
      }).join('')
    + (missionTasks.length > 0 ? '<div class="mc-section-label" style="margin-top:12px">Dispatch Tasks (' + missionTasks.length + ')</div>'
      + missionTasks.map(t => {
          const sc = { queued:'#6c7086',pending:'#6c7086',active:'#f9e2af',in_progress:'#f9e2af',review:'#cba6f7',done:'#a6e3a1',completed:'#a6e3a1',failed:'#f38ba8' };
          const c = sc[t.status] || '#6c7086';
          var safeTitle = (t.title||t.task||t.name||'Untitled').replace(/'/g, "\\'");
          return '<div class="mc-plan-card" style="cursor:pointer" data-ctx-type="task" data-ctx-id="' + (t.id||'') + '" onclick="goToEntity(\'task\',\'' + (t.id||'') + '\',\'' + safeTitle + '\')">'
            + '<div class="mc-plan-header"><span class="mc-plan-name">' + (t.title||t.task||t.name||'Untitled') + '</span>'
            + '<span style="font-size:11px;padding:2px 8px;border-radius:4px;background:' + c + '20;color:' + c + '">' + (t.status||'queued') + '</span></div>'
            + '<div class="mc-plan-summary">' + (t.agent||'unassigned') + ' · ' + (t.priority||'P3') + ' · ' + (t.source||'') + '</div></div>';
        }).join('') : '')
    + '<div style="display:flex;gap:8px;margin-top:12px">'
    +   '<button class="mc-create-plan-btn" onclick="mcShowAddTaskModal(\'' + missionId + '\')">＋ Add Task</button>'
    +   '<button class="mc-create-plan-btn" onclick="toast(\'Plan creation coming soon\',\'info\')">＋ Create Plan</button>'
    + '</div></div>';
}

// ── Kanban Tab ────────────────────────────────────────────

function mcGetMissionTasks(missionId) {
  const m = mcMissions.find(x => x.id === missionId);
  const tasks = [];
  const seen = new Set();
  const add = (t, extra) => { if (t.id && seen.has(t.id)) return; if (t.id) seen.add(t.id); tasks.push(extra ? Object.assign({}, t, extra) : t); };

  if (m && m.tasks) m.tasks.forEach(t => add(t));
  mcPlans.filter(p => p.mission === missionId).forEach(p => { if (p.tasks) p.tasks.forEach(t => add(t, { plan_id: p.id, plan_name: p.name })); });
  if (mcAllTasks.length > 0) mcAllTasks.filter(t => t.mission_id === missionId || t.goal_id === missionId || (t.tags && t.tags.includes(missionId))).forEach(t => add(t));
  return tasks;
}

function mcRenderKanban(el, missionId) {
  const tasks = mcGetMissionTasks(missionId);
  const cols = {
    backlog: { label:'Backlog', icon:'📋', color:'#6c7086', tasks:[] },
    active:  { label:'In Progress', icon:'🔨', color:'#f9e2af', tasks:[] },
    review:  { label:'Review', icon:'👁️', color:'#cba6f7', tasks:[] },
    done:    { label:'Done', icon:'✅', color:'#a6e3a1', tasks:[] },
  };
  tasks.forEach(t => {
    const s = t.column || t.status || 'backlog';
    if (s === 'done' || s === 'completed') cols.done.tasks.push(t);
    else if (s === 'review') cols.review.tasks.push(t);
    else if (s === 'active' || s === 'in_progress') cols.active.tasks.push(t);
    else cols.backlog.tasks.push(t);
  });

  if (tasks.length === 0) {
    el.innerHTML = '<div style="text-align:center;padding:24px"><div class="mc-empty">No tasks yet. Add tasks to see them on the Kanban board.</div>'
      + '<button class="mc-create-plan-btn" onclick="mcShowAddTaskModal(\'' + missionId + '\')" style="margin-top:12px">＋ Add Task</button></div>';
    return;
  }

  el.innerHTML = '<div class="mc-kanban-board">'
    + Object.entries(cols).map(function(pair) {
        var colId = pair[0], col = pair[1];
        return '<div class="mc-kanban-col" data-col="' + colId + '" ondragover="event.preventDefault();this.classList.add(\'mc-kanban-col-dragover\')" ondragleave="this.classList.remove(\'mc-kanban-col-dragover\')" ondrop="mcKanbanDrop(event,\'' + colId + '\',\'' + missionId + '\')">'
          + '<div class="mc-kanban-col-header">'
          +   '<span>' + col.icon + '</span>'
          +   '<span style="font-weight:600">' + col.label + '</span>'
          +   '<span style="color:' + col.color + ';font-size:12px">' + col.tasks.length + '</span>'
          + '</div>'
          + '<div class="mc-kanban-col-tasks">'
          + col.tasks.map(function(t) {
              var taskTitle = (t.title||t.task||t.name||'Untitled').replace(/'/g, "\\'");
              return '<div class="mc-kanban-task" draggable="true" data-task-id="' + (t.id||'') + '" data-plan-id="' + (t.plan_id||'') + '" ondragstart="mcKanbanDragStart(event,\'' + (t.id||'') + '\',\'' + (t.plan_id||'') + '\')" ondragend="this.classList.remove(\'mc-kanban-task-dragging\')" onclick="goToEntity(\'task\',\'' + (t.id||'') + '\',\'' + taskTitle + '\')" style="cursor:pointer">'
                + '<div style="font-weight:600;font-size:13px;margin-bottom:4px">' + (t.title||t.task||t.name||'Untitled') + '</div>'
                + '<div style="display:flex;gap:6px;font-size:11px;color:var(--text-muted)">'
                +   (t.agent ? '<span>' + t.agent + '</span>' : '')
                +   (t.priority ? '<span class="mc-kanban-task-priority mc-priority-' + (t.priority||'P3').toLowerCase() + '">' + t.priority + '</span>' : '')
                + '</div></div>';
            }).join('')
          + '</div></div>';
      }).join('')
    + '</div>'
    + '<div style="padding:8px"><button class="mc-create-plan-btn" onclick="mcShowAddTaskModal(\'' + missionId + '\')">＋ Add Task</button></div>';
}

function mcKanbanDragStart(event, taskId, planId) {
  event.dataTransfer.setData('text/plain', JSON.stringify({ taskId: taskId, planId: planId }));
  event.target.classList.add('mc-kanban-task-dragging');
  mcKanbanDragState = { taskId: taskId, planId: planId };
}

async function mcKanbanDrop(event, targetCol, missionId) {
  event.preventDefault();
  event.currentTarget.classList.remove('mc-kanban-col-dragover');
  var data;
  try { data = JSON.parse(event.dataTransfer.getData('text/plain')); } catch(e) { return; }
  if (!data || !data.taskId) return;

  var statusMap = { backlog:'queued', active:'active', review:'review', done:'done' };
  var newStatus = statusMap[targetCol] || targetCol;

  // Update via bridge if possible
  if (typeof Bridge !== 'undefined' && data.planId) {
    try { await Bridge.apiFetch('/api/plans/' + encodeURIComponent(data.planId) + '/tasks/' + encodeURIComponent(data.taskId), { method: 'PUT', body: JSON.stringify({ status: newStatus, column: targetCol }) }); toast('Task moved to ' + targetCol, 'success'); }
    catch(e) { console.warn('Failed to update task:', e.message); toast('Move failed: ' + e.message, 'error'); }
  }

  // Update locally
  var m = mcMissions.find(x => x.id === missionId);
  if (m && m.tasks) { var t = m.tasks.find(x => x.id === data.taskId); if (t) { t.status = newStatus; t.column = targetCol; } }
  mcPlans.forEach(p => { if (p.tasks) { var t = p.tasks.find(x => x.id === data.taskId); if (t) { t.status = newStatus; t.column = targetCol; } } });

  mcRenderKanban($('mc-tab-content'), missionId);
  mcKanbanDragState = null;
}

// ── Add Task Modal ────────────────────────────────────────

function mcShowAddTaskModal(missionId) {
  var m = mcMissions.find(x => x.id === missionId);
  var modal = document.createElement('div');
  modal.id = 'add-task-modal';
  modal.className = 'modal-overlay';
  modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.7);z-index:9999;display:flex;align-items:center;justify-content:center;';
  modal.innerHTML = '<div class="modal-panel" style="background:var(--bg-surface,#252536);border:1px solid var(--border);border-radius:16px;padding:28px;width:90%;max-width:480px;">'
    + '<h3 style="margin:0 0 16px;color:var(--text);font-size:16px;font-weight:700;">➕ Add Task to ' + (m ? m.title : 'Mission') + '</h3>'
    + '<label class="modal-label">Task Title</label>'
    + '<input id="at-title" placeholder="e.g. Research competitor pricing" class="modal-input" />'
    + '<label class="modal-label">Description</label>'
    + '<textarea id="at-desc" placeholder="What needs to be done?" rows="2" class="modal-textarea"></textarea>'
    + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">'
    +   '<div><label class="modal-label">Priority</label><select id="at-priority" class="modal-input" style="padding:8px"><option value="P3">P3 - Normal</option><option value="P2">P2 - High</option><option value="P1">P1 - Urgent</option><option value="P0">P0 - Critical</option></select></div>'
    +   '<div><label class="modal-label">Agent</label><select id="at-agent" class="modal-input" style="padding:8px"><option value="">Unassigned</option><option value="coder">💻 Coder</option><option value="researcher">🔬 Researcher</option><option value="ops">⚙️ Ops</option><option value="utility">🔧 Utility</option></select></div>'
    + '</div>'
    + '<div style="display:flex;gap:10px;justify-content:flex-end;margin-top:16px;">'
    +   '<button onclick="document.getElementById(\'add-task-modal\').remove()" class="modal-btn-cancel">Cancel</button>'
    +   '<button onclick="mcSubmitAddTask(\'' + missionId + '\')" class="modal-btn-primary">Create Task</button>'
    + '</div>'
    + '<div id="at-status" style="margin-top:8px;font-size:12px;color:var(--text-muted);"></div>'
    + '</div>';
  modal.onclick = function(e) { if (e.target === modal) modal.remove(); };
  document.body.appendChild(modal);
  setTimeout(function() { var el = document.getElementById('at-title'); if (el) el.focus(); }, 100);
}

async function mcSubmitAddTask(missionId) {
  var title = document.getElementById('at-title').value.trim();
  var desc = document.getElementById('at-desc').value.trim();
  var priority = document.getElementById('at-priority').value;
  var agent = document.getElementById('at-agent').value;
  var statusEl = document.getElementById('at-status');
  if (!title) { statusEl.textContent = '❌ Title required'; return; }
  statusEl.textContent = '⏳ Creating...';

  try {
    if (typeof Bridge !== 'undefined') {
      await Bridge.apiFetch('/api/dispatch/task', { method: 'POST', body: JSON.stringify({ task: title, description: desc || title, priority: priority, agent: agent || undefined, mission_id: missionId, source: 'frontend' }) });
    }
    // Also add locally
    var m = mcMissions.find(x => x.id === missionId);
    if (m) {
      var newTask = { id: 'task-' + Date.now(), title: title, task: title, description: desc, priority: priority, agent: agent || 'unassigned', status: 'queued', column: 'backlog', mission_id: missionId, source: 'frontend', created_at: new Date().toISOString() };
      if (!m.tasks) m.tasks = [];
      m.tasks.push(newTask);
      m.tasks_total = m.tasks.length;
      m.tasks_done = m.tasks.filter(t => t.status === 'done' || t.status === 'completed').length;
      m.progress = m.tasks_total > 0 ? Math.round((m.tasks_done / m.tasks_total) * 100) : 0;
    }
    statusEl.textContent = '✅ Created!';
    setTimeout(function() { var el = document.getElementById('add-task-modal'); if (el) el.remove(); renderMCSidebar(); renderMCDetail(missionId); }, 400);
  } catch(e) { statusEl.textContent = '❌ ' + e.message; }
}

// ── Activity Tab ──────────────────────────────────────────

let mcActivityFilter = 'all';

function mcRenderActivity(el, missionId) {
  var events = mcFeed.filter(e => e.mission === missionId);
  var filters = ['all','tasks','agents','errors'];
  var filtered = mcActivityFilter === 'all' ? events : events.filter(e => {
    if (mcActivityFilter === 'tasks') return e.type === 'task';
    if (mcActivityFilter === 'agents') return e.type === 'agent';
    if (mcActivityFilter === 'errors') return e.type === 'error';
    return true;
  });

  el.innerHTML = '<div class="mc-activity-filters">'
    + filters.map(f => '<button class="mc-filter-chip' + (mcActivityFilter === f ? ' active' : '') + '" onclick="mcActivityFilter=\'' + f + '\';mcRenderActivity($(\'mc-tab-content\'),\'' + missionId + '\')">' + f.charAt(0).toUpperCase() + f.slice(1) + '</button>').join('')
    + '</div><div class="mc-activity-feed">'
    + (filtered.length === 0 ? '<div class="mc-empty">No activity yet.</div>' : '')
    + filtered.map(e => {
        var time = new Date(e.ts);
        var timeStr = time.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'});
        var dateStr = time.toLocaleDateString([], {month:'short', day:'numeric'});
        var typeClass = e.type === 'error' ? 'mc-ev-error' : e.type === 'agent' ? 'mc-ev-agent' : '';
        return '<div class="mc-activity-event ' + typeClass + '"><span class="mc-ev-agent">' + e.agent + '</span><span class="mc-ev-text">' + e.text + '</span><span class="mc-ev-time">' + dateStr + ' ' + timeStr + '</span></div>';
      }).join('')
    + '</div>';
}

// ── Decisions Tab ─────────────────────────────────────────

function mcRenderDecisions(el, missionId) {
  var decisions = mcDecisions.filter(d => d.mission === missionId);
  el.innerHTML = '<div class="mc-decisions-timeline">'
    + (decisions.length === 0 ? '<div class="mc-empty">No decisions recorded yet.</div>' : '')
    + decisions.map(d => {
        var typeIcon = d.type === 'approved' ? '✅' : d.type === 'rejected' ? '❌' : '↪️';
        var typeClass = d.type === 'rejected' ? 'mc-dec-rejected' : d.type === 'direction' ? 'mc-dec-direction' : '';
        return '<div class="mc-decision-card ' + typeClass + '"><div class="mc-dec-line"></div><div class="mc-dec-dot"></div>'
          + '<div class="mc-dec-content"><div class="mc-dec-header"><span class="mc-dec-icon">' + typeIcon + '</span><span class="mc-dec-date">' + d.date + '</span><span class="mc-dec-who">' + d.who + '</span></div>'
          + '<div class="mc-dec-text">' + d.decision + '</div></div></div>';
      }).join('')
    + '</div>';
}

// ═══════════════════════════════════════════════════════════
// NEW MISSION MODAL
// ═══════════════════════════════════════════════════════════

function showNewMissionModal() {
  var m = document.createElement('div');
  m.id = 'new-mission-modal';
  m.className = 'modal-overlay';
  m.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.7);z-index:9999;display:flex;align-items:center;justify-content:center;';
  m.innerHTML = '<div class="modal-panel" style="background:var(--bg-surface,#252536);border:1px solid var(--border);border-radius:16px;padding:28px;width:90%;max-width:520px;">'
    + '<h3 style="margin:0 0 20px;color:var(--text);font-size:18px;font-weight:700;">🎯 New Mission</h3>'
    + '<label class="modal-label">Title</label>'
    + '<input id="nm-title" placeholder="e.g. Ship Agent OS v1" class="modal-input" />'
    + '<label class="modal-label">Goal / Description</label>'
    + '<textarea id="nm-desc" placeholder="What does success look like?" rows="3" class="modal-textarea"></textarea>'
    + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">'
    +   '<div><label class="modal-label">Target Date</label><input id="nm-deadline" type="date" class="modal-input" /></div>'
    +   '<div><label class="modal-label">Linked Project</label><input id="nm-project" placeholder="(optional)" class="modal-input" /></div>'
    + '</div>'
    + '<label class="modal-label">Success Criteria</label>'
    + '<textarea id="nm-criteria" placeholder="Measurable criteria for completion..." rows="2" class="modal-textarea"></textarea>'
    + '<div style="display:flex;gap:10px;justify-content:flex-end;margin-top:8px;">'
    +   '<button onclick="document.getElementById(\'new-mission-modal\').remove()" class="modal-btn-cancel">Cancel</button>'
    +   '<button onclick="submitNewMission()" class="modal-btn-primary">Create Mission</button>'
    + '</div>'
    + '<div id="nm-status" style="margin-top:8px;font-size:12px;color:var(--text-muted);"></div>'
    + '</div>';
  m.onclick = function(e) { if (e.target === m) m.remove(); };
  document.body.appendChild(m);
  setTimeout(function() { var el = document.getElementById('nm-title'); if (el) el.focus(); }, 100);
}

async function submitNewMission() {
  var title = document.getElementById('nm-title').value.trim();
  var desc = document.getElementById('nm-desc').value.trim();
  var deadline = document.getElementById('nm-deadline').value;
  var project = (document.getElementById('nm-project') || {}).value || '';
  project = project.trim();
  var criteria = (document.getElementById('nm-criteria') || {}).value || '';
  criteria = criteria.trim();
  var statusEl = document.getElementById('nm-status');

  if (!title) { statusEl.textContent = '❌ Title required'; return; }
  statusEl.textContent = '⏳ Creating...';

  try {
    if (typeof Bridge !== 'undefined') {
      // POST to /api/plans to create a plan/mission via Bridge
      await Bridge.apiFetch('/api/plans', { method: 'POST', body: JSON.stringify({ name: title, description: desc || title, deadline: deadline || null, project: project, success_criteria: criteria, tasks: [] }) });
    } else {
      throw new Error('Bridge not available — cannot create mission without API connection');
    }
    statusEl.textContent = '✅ Created!';
    setTimeout(function() { var el = document.getElementById('new-mission-modal'); if (el) el.remove(); renderMissions(); }, 500);
  } catch(e) { statusEl.textContent = '❌ ' + e.message; }
}

// ═══════════════════════════════════════════════════════════
// MISSION DETAIL — Bridge loader
// ═══════════════════════════════════════════════════════════

async function mcLoadMissionDetail(missionId) {
  if (typeof Bridge === 'undefined') return null;
  try { return await Bridge.apiFetch('/api/missions/' + encodeURIComponent(missionId)); } catch(e) { return null; }
}

// EXPLORE VIEW — moved to explore.js
