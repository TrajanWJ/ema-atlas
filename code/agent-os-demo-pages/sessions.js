/* Agent OS v8 — sessions.js — Sessions Management Page */
'use strict';

let _sessionsData = [];
let _sessionsSort = { key: 'updated', dir: 'desc' };
let _sessionsFilter = '';
let _sessionsPage = 0;
let _sessionsPageSize = 25;
let _sessionsLoading = false;
let _sessionsRefreshTimer = null;

function initSessions() {
  loadSessions();
  // Auto-refresh every 30s
  if (!_sessionsRefreshTimer) {
    _sessionsRefreshTimer = setInterval(() => {
      if (shouldPoll() && currentPage === 'sessions') loadSessions(true);
    }, 30000);
  }
}

async function loadSessions(quiet = false) {
  if (_sessionsLoading) return;
  _sessionsLoading = true;

  const container = $('sessions-content');
  if (!container) return;

  if (!quiet) {
    container.innerHTML = renderSessionsSkeleton();
  }

  try {
    const data = await Bridge.getSessions();
    _sessionsData = Array.isArray(data) ? data : (data.sessions || []);
    renderSessionsTable();
  } catch (e) {
    if (!quiet) {
      container.innerHTML = `<div class="sessions-empty">Failed to load sessions: ${e.message}</div>`;
    }
  } finally {
    _sessionsLoading = false;
  }
}

function renderSessionsSkeleton() {
  const rows = Array.from({ length: 8 }, () =>
    `<div class="skeleton-row"><div class="skeleton-cell sk-wide"></div><div class="skeleton-cell sk-med"></div><div class="skeleton-cell sk-sm"></div><div class="skeleton-cell sk-sm"></div><div class="skeleton-cell sk-sm"></div></div>`
  ).join('');
  return `<div class="sessions-skeleton">${rows}</div>`;
}

function renderSessionsTable() {
  const container = $('sessions-content');
  if (!container) return;

  // Filter
  let filtered = _sessionsData;
  if (_sessionsFilter) {
    const q = _sessionsFilter.toLowerCase();
    filtered = filtered.filter(s =>
      (s.key || '').toLowerCase().includes(q) ||
      (s.agent || '').toLowerCase().includes(q) ||
      (s.kind || '').toLowerCase().includes(q) ||
      (s.model || '').toLowerCase().includes(q)
    );
  }

  // Sort
  filtered.sort((a, b) => {
    let av = a[_sessionsSort.key];
    let bv = b[_sessionsSort.key];
    if (_sessionsSort.key === 'updated' || _sessionsSort.key === 'created') {
      av = new Date(av || 0).getTime();
      bv = new Date(bv || 0).getTime();
    } else if (_sessionsSort.key === 'input_tokens' || _sessionsSort.key === 'output_tokens') {
      av = (av || 0); bv = (bv || 0);
    } else {
      av = String(av || '').toLowerCase();
      bv = String(bv || '').toLowerCase();
    }
    if (av < bv) return _sessionsSort.dir === 'asc' ? -1 : 1;
    if (av > bv) return _sessionsSort.dir === 'asc' ? 1 : -1;
    return 0;
  });

  // Paginate
  const totalPages = Math.ceil(filtered.length / _sessionsPageSize);
  if (_sessionsPage >= totalPages) _sessionsPage = Math.max(0, totalPages - 1);
  const start = _sessionsPage * _sessionsPageSize;
  const page = filtered.slice(start, start + _sessionsPageSize);

  const arrow = (key) => {
    if (_sessionsSort.key !== key) return '';
    return _sessionsSort.dir === 'asc' ? ' ↑' : ' ↓';
  };

  container.innerHTML = `
    <div class="sessions-toolbar">
      <div class="sessions-search">
        <input type="text" class="sessions-search-input" placeholder="Search sessions..."
          value="${_sessionsFilter}" oninput="sessionsFilterChange(this.value)" />
      </div>
      <div class="sessions-page-size">
        <select onchange="sessionsPageSizeChange(this.value)">
          <option value="10" ${_sessionsPageSize === 10 ? 'selected' : ''}>10/page</option>
          <option value="25" ${_sessionsPageSize === 25 ? 'selected' : ''}>25/page</option>
          <option value="50" ${_sessionsPageSize === 50 ? 'selected' : ''}>50/page</option>
        </select>
      </div>
      <button class="btn-ghost sessions-refresh-btn" onclick="loadSessions()">Refresh</button>
    </div>
    <div class="sessions-table-wrap">
      <table class="sessions-table">
        <thead>
          <tr>
            <th class="sortable" onclick="sessionsSort('key')">Key${arrow('key')}</th>
            <th class="sortable" onclick="sessionsSort('agent')">Agent${arrow('agent')}</th>
            <th class="sortable" onclick="sessionsSort('kind')">Kind${arrow('kind')}</th>
            <th class="sortable" onclick="sessionsSort('input_tokens')">In Tokens${arrow('input_tokens')}</th>
            <th class="sortable" onclick="sessionsSort('output_tokens')">Out Tokens${arrow('output_tokens')}</th>
            <th class="sortable" onclick="sessionsSort('model')">Model${arrow('model')}</th>
            <th class="sortable" onclick="sessionsSort('updated')">Updated${arrow('updated')}</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          ${page.length === 0 ? `<tr><td colspan="8" class="sessions-empty-row">No sessions found</td></tr>` :
            page.map(s => renderSessionRow(s)).join('')}
        </tbody>
      </table>
    </div>
    ${totalPages > 1 ? renderSessionsPagination(totalPages, filtered.length) : ''}
  `;
}

function renderSessionRow(s) {
  const key = s.key || s.id || '—';
  const agent = s.agent || '—';
  const kind = s.kind || s.type || '—';
  const inTok = formatTokens(s.input_tokens || 0);
  const outTok = formatTokens(s.output_tokens || 0);
  const model = s.model || '—';
  const updated = s.updated ? formatRelativeTime(s.updated) : (s.updated_at ? formatRelativeTime(s.updated_at) : '—');
  const shortKey = key.length > 24 ? key.slice(0, 12) + '…' + key.slice(-8) : key;

  return `
    <tr class="session-row" data-key="${key}">
      <td class="session-key" title="${key}">${shortKey}</td>
      <td><span class="session-agent-pill">${agent}</span></td>
      <td><span class="session-kind-pill">${kind}</span></td>
      <td class="session-tokens">${inTok}</td>
      <td class="session-tokens">${outTok}</td>
      <td class="session-model">${model}</td>
      <td class="session-time">${updated}</td>
      <td class="session-actions">
        <button class="btn-sm btn-ghost" onclick="sessionAction('reset','${key}')" title="Reset session">Reset</button>
        <button class="btn-sm btn-ghost btn-danger" onclick="sessionAction('delete','${key}')" title="Delete session">Delete</button>
      </td>
    </tr>
  `;
}

function renderSessionsPagination(totalPages, totalItems) {
  const pages = [];
  for (let i = 0; i < totalPages; i++) {
    pages.push(`<button class="pagination-btn ${i === _sessionsPage ? 'active' : ''}" onclick="sessionsGoPage(${i})">${i + 1}</button>`);
  }
  return `
    <div class="sessions-pagination">
      <span class="pagination-info">${totalItems} session${totalItems !== 1 ? 's' : ''}</span>
      <div class="pagination-btns">
        <button class="pagination-btn" onclick="sessionsGoPage(${_sessionsPage - 1})" ${_sessionsPage === 0 ? 'disabled' : ''}>Prev</button>
        ${pages.join('')}
        <button class="pagination-btn" onclick="sessionsGoPage(${_sessionsPage + 1})" ${_sessionsPage >= totalPages - 1 ? 'disabled' : ''}>Next</button>
      </div>
    </div>
  `;
}

function formatTokens(n) {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
  return String(n);
}

function formatRelativeTime(ts) {
  const d = new Date(ts);
  if (isNaN(d.getTime())) return '—';
  const diff = Date.now() - d.getTime();
  if (diff < 60000) return 'just now';
  if (diff < 3600000) return Math.floor(diff / 60000) + 'm ago';
  if (diff < 86400000) return Math.floor(diff / 3600000) + 'h ago';
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

function sessionsSort(key) {
  if (_sessionsSort.key === key) {
    _sessionsSort.dir = _sessionsSort.dir === 'asc' ? 'desc' : 'asc';
  } else {
    _sessionsSort = { key, dir: 'desc' };
  }
  renderSessionsTable();
}

function sessionsFilterChange(val) {
  _sessionsFilter = val;
  _sessionsPage = 0;
  renderSessionsTable();
}

function sessionsPageSizeChange(val) {
  _sessionsPageSize = parseInt(val) || 25;
  _sessionsPage = 0;
  renderSessionsTable();
}

function sessionsGoPage(p) {
  const totalPages = Math.ceil(_sessionsData.length / _sessionsPageSize);
  if (p < 0 || p >= totalPages) return;
  _sessionsPage = p;
  renderSessionsTable();
}

async function sessionAction(action, key) {
  try {
    if (action === 'reset') {
      await Bridge.resetSession(key);
      toast('Session reset: ' + key, 'success');
    } else if (action === 'delete') {
      await Bridge.deleteSession(key);
      toast('Session deleted: ' + key, 'success');
    }
    loadSessions(true);
  } catch (e) {
    toast('Failed: ' + e.message, 'error');
  }
}
