/**
 * Wiki Mirror SPA — vanilla JS
 * Routes: / (home), /search?q= (search), /p/* (page view)
 */

const API = '/api/wiki';
let wsConn = null;
let currentPath = null;

// ── Router ──────────────────────────────────────────────────────────────────

function navigate(path, push = true) {
  if (push) history.pushState({}, '', path);
  route(path);
}

function route(path) {
  if (path === '/' || path === '') {
    renderHome();
  } else if (path.startsWith('/search')) {
    const params = new URLSearchParams(path.split('?')[1] || '');
    renderSearch(params.get('q') || '');
  } else if (path.startsWith('/p/')) {
    const wikiPath = decodeURIComponent(path.slice(3));
    renderPage(wikiPath);
  } else {
    renderHome();
  }
}

window.addEventListener('popstate', () => route(location.pathname + location.search));
window.navigate = navigate;

// ── API helpers ──────────────────────────────────────────────────────────────

async function api(path) {
  try {
    const res = await fetch(API + path);
    if (!res.ok) return null;
    return await res.json();
  } catch (_) {
    return null;
  }
}

async function apiPost(path, body) {
  const res = await fetch(API + path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return await res.json();
}

// ── Stats & top bar ──────────────────────────────────────────────────────────

async function loadStats() {
  const data = await api('/stats');
  if (!data) return;
  const el = document.getElementById('topbar-stats');
  el.textContent = `${data.total_pages.toLocaleString()} pages · ${data.total_edges.toLocaleString()} links`;
}

// ── WebSocket ────────────────────────────────────────────────────────────────

function initWs() {
  const wsUrl = `ws://localhost:4488`;
  try {
    wsConn = new WebSocket(wsUrl);
    const dot = document.getElementById('topbar-ws');
    
    wsConn.onopen = () => {
      dot.classList.add('connected');
      dot.title = 'Live updates: connected';
    };
    
    wsConn.onclose = () => {
      dot.classList.remove('connected');
      dot.title = 'Live updates: disconnected';
      setTimeout(initWs, 5000);
    };
    
    wsConn.onmessage = (evt) => {
      try {
        const msg = JSON.parse(evt.data);
        handleWsMessage(msg);
      } catch (_) {}
    };
  } catch (_) {}
}

function handleWsMessage(msg) {
  if (msg.type === 'wiki:page_updated' && msg.data?.path === currentPath) {
    // Reload current page
    renderPage(currentPath);
  }
  if (msg.type === 'wiki:page_created') {
    // Update stats
    loadStats();
  }
}

// ── Sidebar ──────────────────────────────────────────────────────────────────

async function loadSidebar() {
  const sidebar = document.getElementById('sidebar-content');
  
  // Nav items
  const navHtml = `
    <div class="sidebar-section">
      <div class="sidebar-section-header">Navigation</div>
      <a class="sidebar-link" onclick="navigate('/')">🏠 Home</a>
      <a class="sidebar-link" onclick="showSearch()">🔍 Search</a>
    </div>
    <div id="sidebar-types" class="sidebar-section">
      <div class="sidebar-section-header" onclick="toggleSection('types')">Browse by Type</div>
      <div id="sidebar-types-items"></div>
    </div>
    <div id="sidebar-recent" class="sidebar-section">
      <div class="sidebar-section-header" onclick="toggleSection('recent')">Recent Pages</div>
      <div id="sidebar-recent-items"></div>
    </div>
  `;
  sidebar.innerHTML = navHtml;
  
  // Load types
  const typesData = await api('/types');
  if (typesData?.types) {
    const typeEmojis = {
      knowledge: '📖', project: '🚀', research: '🔬', intent: '⚡',
      task: '✅', config: '⚙️', codebase: '💻', sprint: '🏃',
      meeting: '📅', decision: '⚖️',
    };
    const typesHtml = typesData.types.map(t => `
      <a class="sidebar-link" onclick="navigate('/search?type=${t.name}')">
        <span>${typeEmojis[t.name] || '📄'}</span> ${t.name}
      </a>
    `).join('');
    document.getElementById('sidebar-types-items').innerHTML = typesHtml;
  }
  
  // Load recent
  const recentData = await api('/pages?limit=10&status=active');
  if (recentData?.pages) {
    const recentHtml = recentData.pages.map(p => `
      <a class="sidebar-link" onclick="navigate('/p/${encodeURIComponent(p.path)}')" title="${p.path}">
        ${truncate(p.title, 28)}
      </a>
    `).join('');
    document.getElementById('sidebar-recent-items').innerHTML = recentHtml;
  }
}

window.toggleSection = function(id) {
  const el = document.getElementById(`sidebar-${id}-items`);
  if (el) el.style.display = el.style.display === 'none' ? '' : 'none';
};

// ── Home ─────────────────────────────────────────────────────────────────────

async function renderHome() {
  currentPath = null;
  const content = document.getElementById('content');
  content.innerHTML = '<div class="loading">Loading...</div>';
  
  const [recentData, statsData] = await Promise.all([
    api('/pages?limit=8&status=active'),
    api('/stats'),
  ]);
  
  const recentHtml = (recentData?.pages || []).map(p => `
    <div class="home-card-item" onclick="navigate('/p/${encodeURIComponent(p.path)}')">
      <span class="type-${p.type}" style="font-size:16px">${typeEmoji(p.type)}</span>
      <span class="home-item-title">${esc(p.title)}</span>
      <span class="home-item-meta">${relativeDate(p.updated_at)}</span>
    </div>
  `).join('');
  
  const byType = statsData?.by_type || [];
  const typeStatsHtml = byType.slice(0, 8).map(t => `
    <div class="home-card-item" onclick="navigate('/search?type=${t.type}')">
      <span class="type-${t.type}">${typeEmoji(t.type)}</span>
      <span class="home-item-title">${t.type}</span>
      <span class="home-item-meta">${t.count}</span>
    </div>
  `).join('');
  
  content.innerHTML = `
    <h1 class="page-title" style="margin-bottom:8px">Trajan's Wiki</h1>
    <p style="color:var(--text-dim);margin-bottom:28px">
      ${statsData?.total_pages?.toLocaleString() || 0} pages · 
      ${statsData?.total_edges?.toLocaleString() || 0} links · 
      Last updated ${statsData?.last_updated ? relativeDate(statsData.last_updated) : 'never'}
    </p>
    <div class="home-grid">
      <div class="home-card">
        <h3>Recent Pages</h3>
        ${recentHtml || '<p style="color:var(--text-dim);font-size:13px">No pages yet</p>'}
      </div>
      <div class="home-card">
        <h3>Browse by Type</h3>
        ${typeStatsHtml || '<p style="color:var(--text-dim);font-size:13px">Loading...</p>'}
      </div>
    </div>
  `;
}

// ── Search ───────────────────────────────────────────────────────────────────

async function renderSearch(q, type = null) {
  currentPath = null;
  const content = document.getElementById('content');
  
  const urlParams = new URLSearchParams(location.search);
  const typeFilter = type || urlParams.get('type');
  
  if (!q && !typeFilter) {
    content.innerHTML = `
      <h1 class="page-title">Search</h1>
      <p style="color:var(--text-dim);margin-top:12px">Type in the search box above to search pages.</p>
    `;
    return;
  }
  
  content.innerHTML = '<div class="loading">Searching...</div>';
  
  let url = `/search?limit=30`;
  if (q) url += `&q=${encodeURIComponent(q)}`;
  if (typeFilter) url += `&type=${typeFilter}`;
  
  let data;
  if (q) {
    data = await api(url);
  } else if (typeFilter) {
    // Browse by type
    data = await api(`/pages?type=${typeFilter}&limit=50`);
    data = data ? { results: data.pages } : null;
  }
  
  if (!data) {
    content.innerHTML = '<p style="color:var(--text-dim)">Search unavailable.</p>';
    return;
  }
  
  const results = data.results || [];
  const label = q ? `"${q}"` : typeFilter ? `type: ${typeFilter}` : '';
  
  const resultsHtml = results.map(r => `
    <div class="search-result" onclick="navigate('/p/${encodeURIComponent(r.path)}')">
      <div class="search-result-title">${esc(r.title)}</div>
      <div class="search-result-path">${esc(r.path)}</div>
      ${r.excerpt ? `<div class="search-result-excerpt">${esc(r.excerpt)}</div>` : ''}
    </div>
  `).join('');
  
  content.innerHTML = `
    <div class="search-results">
      <h1 class="page-title" style="margin-bottom:8px">Search</h1>
      <h2>${results.length} results for ${label}</h2>
      ${results.length === 0 ? '<p style="color:var(--text-dim)">No results found.</p>' : resultsHtml}
    </div>
  `;
}

window.showSearch = function() {
  document.getElementById('search-input').focus();
};

// ── Page View ────────────────────────────────────────────────────────────────

async function renderPage(wikiPath) {
  currentPath = wikiPath;
  const content = document.getElementById('content');
  content.innerHTML = '<div class="loading">Loading...</div>';
  
  const data = await api(`/pages/by-path/${encodeURIComponent(wikiPath)}`);
  
  if (!data || data.error) {
    content.innerHTML = `
      <div class="page-header">
        <h1 class="page-title">Page not found</h1>
      </div>
      <p style="color:var(--text-dim)">Path: <code>${esc(wikiPath)}</code></p>
    `;
    return;
  }
  
  // Render markdown
  const markdownContent = renderMarkdown(data.content || '');
  
  // Tags
  const tags = (data.tags || []);
  const tagsHtml = tags.length > 0 
    ? tags.map(t => `<span class="badge badge-tag">#${esc(t)}</span>`).join(' ') 
    : '';
  
  // Status badge
  const statusClass = `badge-status-${data.status || 'active'}`;
  
  // Fields panel
  const fieldsHtml = renderFields(data.fields, data.type);
  
  // Relations (backlinks + outgoing)
  const backlinks = data.relations?.incoming || [];
  
  const backlinksHtml = backlinks.length > 0 ? `
    <div class="backlinks">
      <h3>${backlinks.length} Backlink${backlinks.length !== 1 ? 's' : ''}</h3>
      ${backlinks.map(bl => `
        <div class="backlink-item" onclick="navigate('/p/${encodeURIComponent(bl.path)}')">
          <span>${typeEmoji(bl.type)}</span>
          <span class="backlink-title">${esc(bl.title)}</span>
        </div>
      `).join('')}
    </div>
  ` : '';
  
  content.innerHTML = `
    <div class="page-header">
      <h1 class="page-title">${esc(data.title)}</h1>
      <div class="page-meta">
        <span class="badge badge-type">${data.type}</span>
        <span class="badge ${statusClass}">${data.status || 'active'}</span>
        ${tagsHtml}
        <span style="margin-left:auto;color:var(--text-dim);font-size:12px">Updated ${relativeDate(data.updated_at)}</span>
      </div>
    </div>
    ${fieldsHtml}
    <article class="page-content">
      ${markdownContent}
    </article>
    ${backlinksHtml}
  `;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function typeEmoji(type) {
  const emojis = {
    knowledge: '📖', project: '🚀', research: '🔬', intent: '⚡',
    task: '✅', config: '⚙️', codebase: '💻', sprint: '🏃',
    meeting: '📅', decision: '⚖️',
  };
  return emojis[type] || '📄';
}

function relativeDate(ms) {
  if (!ms) return 'never';
  const ago = Date.now() - ms;
  const seconds = Math.floor(ago / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return 'just now';
}

function esc(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function truncate(str, len) {
  return str.length > len ? str.slice(0, len) + '…' : str;
}

function renderMarkdown(md) {
  if (!md) return '';
  // Use marked.js (included via CDN)
  let html = marked.parse(md, { breaks: true });
  // Syntax highlighting
  html = html.replace(/<code[^>]*>([^<]*)<\/code>/g, (match, code) => {
    try {
      const highlighted = hljs.highlightAuto(code).value;
      return `<code class="hljs">${highlighted}</code>`;
    } catch (_) {
      return match;
    }
  });
  return html;
}

function renderFields(fields, type) {
  if (!fields || Object.keys(fields).length === 0) return '';
  
  const fieldRows = Object.entries(fields).map(([k, v]) => {
    let display = v;
    if (typeof v === 'object') {
      display = JSON.stringify(v);
    } else if (typeof v === 'boolean') {
      display = v ? 'Yes' : 'No';
    }
    return `<div class="field-row"><div class="field-key">${esc(k)}</div><div class="field-val">${esc(String(display))}</div></div>`;
  }).join('');
  
  return `<div class="page-fields"><h3>Fields</h3>${fieldRows}</div>`;
}

// ── Init ─────────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  // Search input handler
  const searchInput = document.getElementById('search-input');
  let searchTimeout = null;
  searchInput.addEventListener('input', (e) => {
    clearTimeout(searchTimeout);
    const q = e.target.value.trim();
    searchTimeout = setTimeout(() => {
      if (q.length >= 2) {
        navigate(`/search?q=${encodeURIComponent(q)}`);
      }
    }, 300);
  });
  searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const q = e.target.value.trim();
      if (q) navigate(`/search?q=${encodeURIComponent(q)}`);
    }
  });
  
  // Load sidebar + stats
  loadSidebar();
  loadStats();
  
  // Route current path
  route(location.pathname + location.search);
  
  // Init WebSocket
  initWs();
});
