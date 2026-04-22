/* Agent OS v6 — system.js — Real System Health Dashboard
   Uses Bridge.apiFetch() for all data:
   /api/system/health, /api/system/crons, /api/agents
   Never shows fake or random numbers.
*/
'use strict';

// ═══════════════════════════════════════════════════════════
// STATE
// ═══════════════════════════════════════════════════════════

let _sysExpandedService = null;   // expanded service card
let _sysLogPaused = false;        // log auto-scroll paused
let _sysSelectedLogService = null; // service for live log viewer
let _sysLogFilter = '';            // search within logs
let _sysLogAutoRefresh = null;     // timer for log auto-refresh
let _sysOverviewTimer = null;      // 15s overview refresh
let _sysLogLines = [];             // cached log lines

// ═══════════════════════════════════════════════════════════
// CRON EXPRESSION PARSER
// ═══════════════════════════════════════════════════════════

function _parseCronToHuman(expr) {
  if (!expr) return expr;
  const p = expr.trim().split(/\s+/);
  if (p.length < 5) return expr;
  const [min, hr, dom, mon, dow] = p;

  if (min.startsWith('*/') && hr === '*' && dom === '*' && mon === '*' && dow === '*') {
    const n = parseInt(min.slice(2));
    if (n === 1) return 'Every minute';
    return `Every ${n} minutes`;
  }
  if (/^\d+$/.test(min) && hr === '*' && dom === '*') {
    return `Every hour at :${min.padStart(2, '0')}`;
  }
  if (/^\d+$/.test(min) && /^\d+$/.test(hr) && dom === '*' && mon === '*' && dow === '*') {
    return `Daily at ${hr.padStart(2, '0')}:${min.padStart(2, '0')}`;
  }
  if (min === '0' && hr.startsWith('*/')) {
    const n = parseInt(hr.slice(2));
    return `Every ${n} hours`;
  }
  return expr;
}

function _cronTypeColor(name) {
  const n = (name || '').toLowerCase();
  if (n.includes('nudge') || n.includes('heartbeat') || n.includes('watchdog')) return '#89b4fa';
  if (n.includes('sync') || n.includes('vault') || n.includes('backlink')) return '#a6e3a1';
  if (n.includes('clean') || n.includes('compact') || n.includes('reset') || n.includes('prune')) return '#fab387';
  if (n.includes('digest') || n.includes('report')) return '#cba6f7';
  return '#6c7086';
}

function _escHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// ═══════════════════════════════════════════════════════════
// HEALTH OVERVIEW — agent counts, queue depth, circuit states
// ═══════════════════════════════════════════════════════════

async function _sysLoadHealthOverview() {
  const el = $('sys-dashboard-header');
  if (!el) return;

  let health = null;
  let agents = null;
  let proposals = null;
  let queue = null;

  try {
    if (typeof Bridge === 'undefined' || !Bridge.liveMode) {
      _renderUnavailable(el, 'Connect bridge to view system health');
      return;
    }

    // Fetch all health data in parallel via Bridge.apiFetch()
    const results = await Promise.allSettled([
      Bridge.apiFetch('/api/system/health'),
      Bridge.apiFetch('/api/agents'),
      Bridge.apiFetch('/api/proposals?status=pending'),
      Bridge.apiFetch('/api/queue'),
    ]);

    health = results[0].status === 'fulfilled' ? results[0].value : null;
    agents = results[1].status === 'fulfilled' ? results[1].value : null;
    proposals = results[2].status === 'fulfilled' ? results[2].value : null;
    queue = results[3].status === 'fulfilled' ? results[3].value : null;
  } catch (e) {
    console.warn('[System] Health overview fetch failed:', e.message);
  }

  // If nothing came back at all, show unavailable
  if (!health && !agents && !proposals && !queue) {
    _renderUnavailable(el, 'System data unavailable');
    return;
  }

  // Parse agent counts
  let activeAgents = 0;
  let totalAgents = 0;
  const agentList = _normalizeArray(agents);
  if (agentList.length > 0) {
    totalAgents = agentList.length;
    activeAgents = agentList.filter(a =>
      a.status === 'active' || a.status === 'running' || a.status === 'online' || a.active === true
    ).length;
  } else if (health && typeof health.agents_active === 'number') {
    activeAgents = health.agents_active;
    totalAgents = health.agents_total || activeAgents;
  }

  // Parse queue depth
  let queueDepth = 0;
  const queueList = _normalizeArray(queue);
  if (queueList.length > 0) {
    queueDepth = queueList.filter(q => q.status === 'pending' || q.status === 'queued' || !q.status).length;
  } else if (health && typeof health.queue_depth === 'number') {
    queueDepth = health.queue_depth;
  }

  // Parse pending proposals
  let pendingProposals = 0;
  const proposalList = _normalizeArray(proposals);
  if (proposalList.length > 0) {
    pendingProposals = proposalList.filter(p => p.status === 'pending' || !p.status).length;
  } else if (health && typeof health.pending_proposals === 'number') {
    pendingProposals = health.pending_proposals;
  }

  // Parse unread inbox
  let unreadInbox = 0;
  if (health && typeof health.unread_inbox === 'number') {
    unreadInbox = health.unread_inbox;
  } else if (health && typeof health.inbox_unread === 'number') {
    unreadInbox = health.inbox_unread;
  }

  // Parse circuit breaker states
  let circuits = [];
  if (health && Array.isArray(health.circuits)) {
    circuits = health.circuits;
  } else if (health && typeof health.circuit_breakers === 'object') {
    circuits = Object.entries(health.circuit_breakers).map(([name, state]) => ({
      name,
      state: typeof state === 'string' ? state : (state.state || 'unknown'),
    }));
  }

  // Render the 4 stat cards
  const agentColor = activeAgents > 0 ? 'var(--green, #a6e3a1)' : 'var(--yellow, #f9e2af)';
  const queueColor = queueDepth === 0 ? 'var(--green, #a6e3a1)' : queueDepth > 10 ? 'var(--red, #f38ba8)' : 'var(--yellow, #f9e2af)';
  const proposalColor = pendingProposals === 0 ? 'var(--green, #a6e3a1)' : 'var(--yellow, #f9e2af)';

  el.innerHTML = `
    <div class="sys-stat-card">
      <div class="sys-card-top">
        <span class="sys-card-label">Active Agents</span>
        <span class="sys-card-trend" style="color:${agentColor}">${activeAgents > 0 ? '●' : '○'}</span>
      </div>
      <div class="sys-card-value">${activeAgents} / ${totalAgents}</div>
      <div class="sys-card-sub">${activeAgents === totalAgents ? 'all agents active' : (totalAgents - activeAgents) + ' idle'}</div>
    </div>
    <div class="sys-stat-card">
      <div class="sys-card-top">
        <span class="sys-card-label">Queued Tasks</span>
        <span class="sys-card-trend" style="color:${queueColor}">${queueDepth === 0 ? '●' : queueDepth}</span>
      </div>
      <div class="sys-card-value">${queueDepth}</div>
      <div class="sys-card-sub">${queueDepth === 0 ? 'queue empty' : 'tasks waiting'}</div>
    </div>
    <div class="sys-stat-card">
      <div class="sys-card-top">
        <span class="sys-card-label">Pending Proposals</span>
        <span class="sys-card-trend" style="color:${proposalColor}">${pendingProposals === 0 ? '●' : pendingProposals}</span>
      </div>
      <div class="sys-card-value">${pendingProposals}</div>
      <div class="sys-card-sub">${pendingProposals === 0 ? 'none pending' : 'awaiting review'}</div>
    </div>
    <div class="sys-stat-card">
      <div class="sys-card-top">
        <span class="sys-card-label">Unread Inbox</span>
        <span class="sys-card-trend" style="color:${unreadInbox === 0 ? 'var(--green, #a6e3a1)' : 'var(--yellow, #f9e2af)'}">${unreadInbox === 0 ? '●' : unreadInbox}</span>
      </div>
      <div class="sys-card-value">${unreadInbox}</div>
      <div class="sys-card-sub">${unreadInbox === 0 ? 'inbox clear' : 'unread messages'}</div>
    </div>
  `;

  // Render circuit breaker states below header
  _renderCircuitBreakers(circuits);

  // Update service count badge
  const badge = $('sys-services-count');
  if (badge && totalAgents) badge.textContent = `${activeAgents}/${totalAgents} active`;
}

function _normalizeArray(data) {
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.items)) return data.items;
  if (data && Array.isArray(data.proposals)) return data.proposals;
  if (data && Array.isArray(data.agents)) return data.agents;
  if (data && Array.isArray(data.queue)) return data.queue;
  if (data && Array.isArray(data.data)) return data.data;
  return [];
}

function _renderUnavailable(el, msg) {
  el.innerHTML = `
    <div class="sys-stat-card" style="grid-column:1/-1;text-align:center;">
      <div class="sys-card-value" style="font-size:14px;color:var(--text-muted, #6c7086);">${_escHtml(msg)}</div>
    </div>
  `;
}

// ═══════════════════════════════════════════════════════════
// CIRCUIT BREAKER STATES
// ═══════════════════════════════════════════════════════════

function _renderCircuitBreakers(circuits) {
  let container = $('sys-circuit-breakers');
  if (!circuits || circuits.length === 0) {
    if (container) container.innerHTML = '';
    return;
  }

  // Create container if it doesn't exist
  if (!container) {
    container = document.createElement('div');
    container.id = 'sys-circuit-breakers';
    container.className = 'sys-circuit-breakers';
    const header = $('sys-dashboard-header');
    if (header) header.parentNode.insertBefore(container, header.nextSibling);
  }

  container.innerHTML = `
    <div class="sys-section-header" style="margin-bottom:8px;">
      <span class="sys-section-icon">⛓</span>
      <span class="sys-section-title">Circuit Breakers</span>
    </div>
    <div class="sys-circuit-grid">
      ${circuits.map(c => {
        const state = (c.state || 'unknown').toLowerCase();
        const color = state === 'closed' ? 'var(--green, #a6e3a1)' :
                      state === 'open' ? 'var(--red, #f38ba8)' :
                      state === 'half-open' ? 'var(--yellow, #f9e2af)' :
                      'var(--text-muted, #6c7086)';
        const dot = state === 'closed' ? '●' : state === 'open' ? '○' : '◐';
        return `
          <div class="sys-circuit-item" style="display:flex;align-items:center;gap:8px;padding:6px 12px;background:var(--surface, rgba(30,30,46,0.6));border-radius:8px;">
            <span style="color:${color};font-size:14px;">${dot}</span>
            <span style="font-size:12px;color:var(--text, #cdd6f4);">${_escHtml(c.name)}</span>
            <span style="font-size:11px;color:${color};margin-left:auto;font-weight:500;">${state}</span>
          </div>`;
      }).join('')}
    </div>
  `;
}

// ═══════════════════════════════════════════════════════════
// AGENT STATUS — real data from /api/agents
// ═══════════════════════════════════════════════════════════

async function _sysLoadAgentStatus() {
  const el = $('sys-agents-table');
  if (!el) return;

  if (typeof Bridge === 'undefined' || !Bridge.liveMode) {
    el.innerHTML = '<div style="padding:16px;color:var(--text-muted);font-size:12px;">System data unavailable</div>';
    return;
  }

  let agents = null;
  try {
    agents = await Bridge.apiFetch('/api/agents');
  } catch (e) {
    console.warn('[System] Agents fetch failed:', e.message);
    el.innerHTML = '<div style="padding:16px;color:var(--text-muted);font-size:12px;">System data unavailable</div>';
    return;
  }

  const agentList = _normalizeArray(agents);
  if (agentList.length === 0) {
    el.innerHTML = '<div style="padding:16px;color:var(--text-muted);font-size:12px;">No agent data available</div>';
    return;
  }

  el.innerHTML = `
    <table class="sys-agents-tbl" style="width:100%;border-collapse:collapse;font-size:12px;">
      <thead>
        <tr style="color:var(--text-muted);text-align:left;border-bottom:1px solid var(--border, rgba(108,112,134,0.3));">
          <th style="padding:8px;">Agent</th>
          <th style="padding:8px;">Status</th>
          <th style="padding:8px;">Last Active</th>
          <th style="padding:8px;">Tasks</th>
        </tr>
      </thead>
      <tbody>
        ${agentList.map(a => {
          const name = a.name || a.id || 'unknown';
          const status = a.status || 'unknown';
          const isActive = status === 'active' || status === 'running' || status === 'online';
          const statusColor = isActive ? 'var(--green, #a6e3a1)' :
                              status === 'error' || status === 'failed' ? 'var(--red, #f38ba8)' :
                              'var(--yellow, #f9e2af)';
          const lastActive = a.last_active || a.lastActive || a.last_seen || '—';
          const taskCount = a.tasks || a.task_count || a.active_tasks || '—';
          return `
            <tr style="border-bottom:1px solid var(--border, rgba(108,112,134,0.15));">
              <td style="padding:8px;color:var(--text);">${_escHtml(name)}</td>
              <td style="padding:8px;color:${statusColor};">${status}</td>
              <td style="padding:8px;color:var(--text-muted);">${_escHtml(String(lastActive))}</td>
              <td style="padding:8px;color:var(--text-muted);">${taskCount}</td>
            </tr>`;
        }).join('')}
      </tbody>
    </table>
  `;
}

// ═══════════════════════════════════════════════════════════
// SERVICE STATUS — real data with detail expansion
// ═══════════════════════════════════════════════════════════

async function _sysLoadServices() {
  const grid = $('sys-services-grid');
  if (!grid) return;

  if (typeof Bridge === 'undefined' || !Bridge.liveMode) {
    grid.innerHTML = '<div style="padding:16px;color:var(--text-muted);font-size:12px;">System data unavailable</div>';
    return;
  }

  let services = null;
  try {
    services = await Bridge.apiFetch('/api/system/services');
  } catch (e) {
    console.warn('[System] Services fetch failed:', e.message);
    grid.innerHTML = '<div style="padding:16px;color:var(--text-muted);font-size:12px;">System data unavailable</div>';
    return;
  }

  const svcList = _normalizeArray(services);
  if (svcList.length === 0) {
    grid.innerHTML = '<div style="padding:16px;color:var(--text-muted);font-size:12px;">No service data available</div>';
    return;
  }

  const badge = $('sys-services-count');
  const running = svcList.filter(s => s.status === 'active' || s.status === 'running').length;
  if (badge) badge.textContent = `${running}/${svcList.length} running`;

  grid.innerHTML = svcList.map(s => {
    const isUp = s.status === 'active' || s.status === 'running';
    const isFailed = s.status === 'failed';
    const expanded = _sysExpandedService === (s.name || s.id);
    const svcId = s.name || s.id;
    const dotClass = isFailed ? 'sys-svc-dot-failed' : isUp ? 'sys-svc-dot-up' : 'sys-svc-dot-down';
    const cardClass = isFailed ? 'sys-svc-failed' : !isUp ? 'sys-svc-down' : '';

    let detailHtml = '';
    if (expanded) {
      detailHtml = `
        <div class="sys-svc-detail" id="sys-svc-detail-${svcId}">
          <div class="sys-svc-detail-row"><span>Status:</span><span style="color:${isFailed ? 'var(--red)' : isUp ? 'var(--green)' : 'var(--yellow)'}">${s.status}</span></div>
          ${s.pid ? `<div class="sys-svc-detail-row"><span>PID:</span><span>${s.pid}</span></div>` : ''}
          ${s.uptime ? `<div class="sys-svc-detail-row"><span>Uptime:</span><span>${s.uptime}</span></div>` : ''}
          ${s.memory ? `<div class="sys-svc-detail-row"><span>Memory:</span><span>${s.memory}</span></div>` : ''}
          <div class="sys-svc-log-preview" id="sys-svc-log-${svcId}">
            <div style="padding:8px;color:var(--text-muted);font-size:11px;">Loading logs...</div>
          </div>
          <div class="sys-svc-detail-actions">
            <button class="sys-svc-restart-btn" onclick="event.stopPropagation();restartService('${svcId}')">Restart</button>
            <button class="sys-svc-log-btn" onclick="event.stopPropagation();selectLogService('${svcId}')">Full Logs</button>
          </div>
        </div>`;
    }

    return `
      <div class="sys-svc-card ${cardClass} ${expanded ? 'sys-svc-expanded' : ''}" onclick="toggleServiceDetail('${svcId}')">
        <div class="sys-svc-row">
          <span class="sys-svc-dot ${dotClass}"></span>
          <span class="sys-svc-name">${s.display_name || s.name || s.id}</span>
          <span class="sys-svc-uptime">${isUp ? (s.uptime || 'active') : s.status}</span>
        </div>
        ${detailHtml}
      </div>`;
  }).join('');

  // Load logs for expanded service
  if (_sysExpandedService) {
    _loadServiceLogs(_sysExpandedService);
  }
}

function toggleServiceDetail(svcId) {
  _sysExpandedService = _sysExpandedService === svcId ? null : svcId;
  _sysLoadServices();
}

async function restartService(svcId) {
  if (typeof Bridge === 'undefined' || !Bridge.liveMode) {
    if (typeof toast === 'function') toast('Bridge not connected', 'error');
    return;
  }
  try {
    await Bridge.apiFetch(`/api/system/services/${encodeURIComponent(svcId)}/restart`, { method: 'POST' });
    if (typeof toast === 'function') toast(`Restarting ${svcId}...`, 'success');
    setTimeout(() => _sysLoadServices(), 2000);
  } catch (e) {
    if (typeof toast === 'function') toast(`Restart failed: ${e.message}`, 'error');
  }
}

async function _loadServiceLogs(svcId) {
  const container = $(`sys-svc-log-${svcId}`);
  if (!container) return;
  try {
    const lines = await Bridge.apiFetch(`/api/system/logs?service=${encodeURIComponent(svcId)}&lines=20`);
    const lineArr = _normalizeArray(lines) || (Array.isArray(lines) ? lines : []);
    if (lineArr.length > 0) {
      container.innerHTML = lineArr.map(l => {
        const text = typeof l === 'string' ? l : (l.text || l.message || JSON.stringify(l));
        return `<div class="sys-svc-log-line">${_escHtml(text)}</div>`;
      }).join('');
      container.scrollTop = container.scrollHeight;
    } else {
      container.innerHTML = '<div style="padding:8px;color:var(--text-muted);font-size:11px;">No logs available</div>';
    }
  } catch {
    container.innerHTML = '<div style="padding:8px;color:var(--text-muted);font-size:11px;">Failed to load logs</div>';
  }
}

// ═══════════════════════════════════════════════════════════
// LIVE LOG VIEWER
// ═══════════════════════════════════════════════════════════

function selectLogService(svcId) {
  _sysSelectedLogService = svcId;
  _sysLogLines = [];
  _renderLogViewer();
  _refreshLogs();
  _startLogAutoRefresh();
  const el = $('sys-live-log-section');
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function _renderLogViewer() {
  const section = $('sys-live-log-section');
  if (!section) return;

  if (!_sysSelectedLogService) {
    section.classList.add('hidden');
    return;
  }

  section.classList.remove('hidden');
  const titleEl = $('sys-live-log-title');
  if (titleEl) titleEl.textContent = `Live Logs: ${_sysSelectedLogService}`;
}

async function _refreshLogs() {
  if (!_sysSelectedLogService) return;
  const container = $('sys-live-log-output');
  if (!container) return;

  try {
    const lines = await Bridge.apiFetch(`/api/system/logs?service=${encodeURIComponent(_sysSelectedLogService)}&lines=50`);
    const lineArr = Array.isArray(lines) ? lines : _normalizeArray(lines);
    if (!Array.isArray(lineArr)) return;

    const newLines = lineArr.map(l => typeof l === 'string' ? l : (l.text || l.message || JSON.stringify(l)));
    const prevCount = _sysLogLines.length;
    _sysLogLines = newLines;

    const filtered = _sysLogFilter
      ? newLines.filter(l => l.toLowerCase().includes(_sysLogFilter.toLowerCase()))
      : newLines;

    container.innerHTML = filtered.map((line, i) => {
      const isNew = i >= prevCount && prevCount > 0;
      return `<div class="sys-terminal-line ${isNew ? 'sys-terminal-new' : ''}">${_escHtml(line)}</div>`;
    }).join('');

    if (!_sysLogPaused) {
      container.scrollTop = container.scrollHeight;
    }
  } catch (e) {
    console.warn('[System] Log refresh failed:', e.message);
  }
}

function filterLogs(query) {
  _sysLogFilter = query;
  _refreshLogs();
}

function toggleLogPause() {
  _sysLogPaused = !_sysLogPaused;
  const btn = $('sys-log-pause');
  if (btn) btn.textContent = _sysLogPaused ? 'Resume' : 'Pause';
}

function _startLogAutoRefresh() {
  _stopLogAutoRefresh();
  _sysLogAutoRefresh = setInterval(() => {
    if (typeof shouldPoll === 'function' && !shouldPoll()) return;
    if (_sysLogPaused) return;
    _refreshLogs();
  }, 10000);
}

function _stopLogAutoRefresh() {
  if (_sysLogAutoRefresh) {
    clearInterval(_sysLogAutoRefresh);
    _sysLogAutoRefresh = null;
  }
}

function refreshLogsNow() {
  _refreshLogs();
  if (typeof toast === 'function') toast('Logs refreshed', 'info', 1500);
}

function closeLogViewer() {
  _sysSelectedLogService = null;
  _stopLogAutoRefresh();
  const section = $('sys-live-log-section');
  if (section) section.classList.add('hidden');
}

// ═══════════════════════════════════════════════════════════
// CRON SCHEDULE — real data with schedules and last run status
// ═══════════════════════════════════════════════════════════

async function _sysLoadCrons() {
  const el = $('sys-crons');
  if (!el) return;

  if (typeof Bridge === 'undefined' || !Bridge.liveMode) {
    el.innerHTML = '<div style="padding:16px;color:var(--text-muted);font-size:12px;">System data unavailable</div>';
    return;
  }

  let crons = null;
  try {
    crons = await Bridge.apiFetch('/api/system/crons');
  } catch (e) {
    console.warn('[System] Crons fetch failed:', e.message);
    el.innerHTML = '<div style="padding:16px;color:var(--text-muted);font-size:12px;">System data unavailable</div>';
    return;
  }

  const cronList = _normalizeArray(crons);
  if (cronList.length === 0) {
    el.innerHTML = '<div style="padding:16px;color:var(--text-muted);font-size:12px;">No cron data available</div>';
    return;
  }

  el.innerHTML = `<div class="sys-cron-timeline">${cronList.map(c => {
    const name = c.name || c.command || '—';
    const schedule = c.schedule || c.expression || c.s || '';
    const human = _parseCronToHuman(schedule);
    const color = _cronTypeColor(name);
    const lastRun = c.last_run || c.lastRun || null;
    const lastStatus = c.last_status || c.lastStatus || c.status || null;
    const isOk = lastStatus !== 'failed' && lastStatus !== 'error' && c.ok !== false;

    const statusDot = lastStatus === 'failed' || lastStatus === 'error'
      ? '<span style="color:var(--red, #f38ba8);font-size:10px;margin-left:4px;">failed</span>'
      : lastStatus === 'ok' || lastStatus === 'success'
      ? '<span style="color:var(--green, #a6e3a1);font-size:10px;margin-left:4px;">ok</span>'
      : '';

    return `
      <div class="sys-cron-item ${isOk ? '' : 'sys-cron-fail'}">
        <div class="sys-cron-left">
          <span class="sys-cron-type-dot" style="background:${color}"></span>
          <span class="sys-cron-name">${_escHtml(name)}</span>
        </div>
        <span class="sys-cron-human">${human}</span>
        <span class="sys-cron-sched">${schedule}</span>
        ${lastRun ? `<span class="sys-cron-last">last: ${_escHtml(String(lastRun))}${statusDot}</span>` : ''}
      </div>`;
  }).join('')}</div>`;
}

// ═══════════════════════════════════════════════════════════
// MAIN ORCHESTRATOR
// ═══════════════════════════════════════════════════════════

function renderSystemDashboard() {
  _sysLoadHealthOverview();
  _sysLoadAgentStatus();
  _sysLoadServices();
  _sysLoadCrons();

  // Keep existing renderers for sections we don't replace
  if (typeof _renderWorkflowPipeline === 'function') _renderWorkflowPipeline();
  if (typeof _renderCostTracking === 'function') _renderCostTracking();

  _renderLogViewer();
  _startSystemTimers();
}

function _startSystemTimers() {
  _stopSystemTimers();

  // Refresh health + services every 15s
  _sysOverviewTimer = setInterval(() => {
    if (typeof shouldPoll === 'function' && !shouldPoll()) return;
    if (typeof currentPage !== 'undefined' && currentPage !== 'pulse') return;
    _sysLoadHealthOverview();
    _sysLoadAgentStatus();
    _sysLoadServices();
  }, 15000);
}

function _stopSystemTimers() {
  if (_sysOverviewTimer) { clearInterval(_sysOverviewTimer); _sysOverviewTimer = null; }
  _stopLogAutoRefresh();
}

// ═══════════════════════════════════════════════════════════
// HOOK — Override renderPulse to use real data
// ═══════════════════════════════════════════════════════════

(function() {
  const _origRenderPulse = typeof window.renderPulse === 'function' ? window.renderPulse : null;

  window.renderPulse = function renderPulse() {
    if (typeof Bridge !== 'undefined' && Bridge.liveMode) {
      renderSystemDashboard();
    } else {
      // No bridge — show unavailable state in all sections
      _renderOfflineState();
      if (_origRenderPulse) _origRenderPulse();
    }
  };
})();

function _renderOfflineState() {
  const msg = 'System data unavailable';
  const sections = ['sys-dashboard-header', 'sys-agents-table', 'sys-services-grid', 'sys-crons', 'sys-process-monitor'];
  sections.forEach(id => {
    const el = $(id);
    if (el && !el.innerHTML.trim()) {
      _renderUnavailable(el, msg);
    }
  });
}

// Stop timers when leaving pulse page
if (typeof window !== 'undefined') {
  const _sysOrigNav = window.nav;
  if (_sysOrigNav) {
    const _navHookId = '_sysNavHooked';
    if (!window[_navHookId]) {
      window[_navHookId] = true;
      const _realNav = window.nav;
      window.nav = function(page) {
        _realNav.call(this, page);
        if (page !== 'pulse') {
          _stopSystemTimers();
        }
      };
    }
  }
}
