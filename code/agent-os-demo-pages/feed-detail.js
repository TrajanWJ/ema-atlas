/* Feed Detail Panel — Agent OS
 * Right-side slide-out panel (55% width) that opens when a stream item is clicked.
 * Portable: works standalone in agent-os-demo-pages and can be dropped into frontend-layer.
 * Depends on: AGENTS (data.js), streamItems (app.js), Bridge (bridge.js).
 * All API calls go through Bridge.apiFetch(). When API is unavailable, sections
 * show "Waiting for API..." — no mock data.
 */
'use strict';

// ── Panel State ──────────────────────────────────────────────────────────────
let _fdPanelOpen = false;
let _fdCurrentItem = null;

// ── Open / Close ─────────────────────────────────────────────────────────────
function openFeedDetail(itemId) {
  const item = (typeof streamItems !== 'undefined' ? streamItems : []).find(i => i.id === itemId);
  if (!item) return;
  _fdCurrentItem = item;
  _fdPanelOpen = true;

  const overlay = document.getElementById('fd-overlay');
  const panel = document.getElementById('fd-panel');
  if (!overlay || !panel) return;

  overlay.classList.add('fd-visible');
  panel.classList.add('fd-open');

  // Render immediately with loading state, then fetch enrichment
  renderFeedDetail(item, null, true /* loading */);

  // Determine the task ID — feed items from the live pipeline have _taskId
  const taskId = item._taskId || item.task_id || null;

  if (typeof Bridge !== 'undefined' && Bridge.isConfigured()) {
    // Prefer /api/tasks/:id for task-linked items, fall back to /api/feed/:id
    const apiPath = taskId
      ? `/api/tasks/${encodeURIComponent(taskId)}`
      : `/api/feed/${encodeURIComponent(itemId)}`;

    Bridge.apiFetch(apiPath)
      .then(data => {
        // Only update if this item is still the one being viewed
        if (_fdCurrentItem && _fdCurrentItem.id === itemId) {
          renderFeedDetail(item, data || null, false);
        }
      })
      .catch(() => {
        if (_fdCurrentItem && _fdCurrentItem.id === itemId) {
          renderFeedDetail(item, null, false);
        }
      });
  } else {
    // Bridge not configured — show "Waiting for API..." in enrichable sections
    renderFeedDetail(item, null, false);
  }

  // Close on Escape
  document.addEventListener('keydown', _fdEscListener);
}

function closeFeedDetail() {
  _fdPanelOpen = false;
  _fdCurrentItem = null;
  const overlay = document.getElementById('fd-overlay');
  const panel = document.getElementById('fd-panel');
  if (overlay) overlay.classList.remove('fd-visible');
  if (panel) panel.classList.remove('fd-open');
  document.removeEventListener('keydown', _fdEscListener);
}

function _fdEscListener(e) {
  if (e.key === 'Escape') closeFeedDetail();
}

// ── Placeholder for sections awaiting API data ──────────────────────────────
function _fdPlaceholder(msg) {
  return `<div class="fd-placeholder" style="color:var(--text-muted);font-size:13px;padding:8px 0;font-style:italic">${msg}</div>`;
}

// ── Render ───────────────────────────────────────────────────────────────────
function renderFeedDetail(item, enriched, loading) {
  const panel = document.getElementById('fd-panel');
  if (!panel) return;

  const agent = (typeof AGENTS !== 'undefined' ? AGENTS : []).find(a => a.id === item.agent)
    || { emoji: '🤖', name: item.agent || 'System', color: '#cba6f7', role: 'Agent', status: 'idle', task: '', tasks: 0 };

  // Use enriched API data only — no mock fallback
  const tree = (enriched && enriched.delegationTree) || null;
  const delegatedBy = (enriched && enriched.delegatedBy) || [];
  const artifacts = (enriched && enriched.artifacts) || [];
  const timelineEvents = (enriched && enriched.timeline) || [];
  const vaultConnections = (enriched && enriched.vaultConnections) || [];
  const siblings = (enriched && enriched.siblings) || [];
  const nextTasks = (enriched && enriched.nextTasks) || [];
  const tags = (enriched && enriched.tags) || [];
  const description = (enriched && enriched.description) || item.detail || item.title || '';

  // Message shown in sections when data is not yet available
  const pendingMsg = loading ? 'Loading...' : 'Waiting for API...';

  const typeColor = {
    activity: 'var(--accent2)', proposal: 'var(--yellow)', error: 'var(--red)',
    completion: 'var(--green)', vault: 'var(--accent)', question: 'var(--orange)',
    system: 'var(--text-muted)',
  }[item.type] || 'var(--text-dim)';

  const statusColors = { active: '#a6e3a1', idle: '#6c7086', error: '#f38ba8', done: '#a6e3a1', failed: '#f38ba8', queued: '#f9e2af' };

  panel.innerHTML = `
    <div class="fd-header">
      <div class="fd-header-top">
        <div class="fd-agent-avatar" style="background:${agent.color}20;border-color:${agent.color};color:${agent.color}">${agent.emoji}</div>
        <div class="fd-header-info">
          <div class="fd-agent-name" style="color:${agent.color}">${agent.name}</div>
          <div class="fd-agent-role">${agent.role}</div>
        </div>
        <div class="fd-header-right">
          <span class="fd-type-badge" style="color:${typeColor};background:${typeColor}18">${item.type}</span>
          <button class="fd-close-btn" onclick="closeFeedDetail()" title="Close (Esc)">✕</button>
        </div>
      </div>
      <div class="fd-item-title">${item.title || ''}</div>
    </div>

    <div class="fd-body">

      <!-- 1. DELEGATION TREE -->
      <div class="fd-section">
        <div class="fd-section-title">🌳 Delegation Tree</div>
        ${tree ? `
        <div class="fd-tree">
          ${renderTreeLevel('🎯', 'Goal', tree.goal, 'goal')}
          ${renderTreeLevel('🚀', 'Mission', tree.mission, 'mission')}
          ${renderTreeLevel('📝', 'Plan', tree.plan, 'plan')}
          ${renderTreeLevel('⚡', 'Pipeline', tree.pipeline, 'pipeline')}
          ${renderTreeLevel('✅', 'Task', tree.task, 'task', true)}
        </div>` : _fdPlaceholder(pendingMsg)}
      </div>

      <!-- 2. DELEGATED BY -->
      <div class="fd-section">
        <div class="fd-section-title">🔗 Delegated By</div>
        ${delegatedBy.length > 0 ? `
        <div class="fd-delegation-chain">
          ${delegatedBy.map((d, i) => `
            <div class="fd-chain-node">
              <span class="fd-chain-emoji">${d.emoji}</span>
              <span class="fd-chain-name">${d.name}</span>
              <span class="fd-chain-role">${d.role}</span>
            </div>
            ${i < delegatedBy.length - 1 ? '<div class="fd-chain-arrow">→</div>' : ''}
          `).join('')}
          <div class="fd-chain-arrow">→</div>
          <div class="fd-chain-node fd-chain-current">
            <span class="fd-chain-emoji">${agent.emoji}</span>
            <span class="fd-chain-name">${agent.name}</span>
            <span class="fd-chain-role">Executor</span>
          </div>
        </div>` : _fdPlaceholder(pendingMsg)}
      </div>

      <!-- 3. AGENT STATUS -->
      <div class="fd-section">
        <div class="fd-section-title">🤖 Agent Status</div>
        <div class="fd-agent-status-grid">
          <div class="fd-status-item">
            <div class="fd-status-dot" style="background:${statusColors[agent.status] || '#6c7086'}"></div>
            <span class="fd-status-label">${agent.status}</span>
          </div>
          <div class="fd-status-stat">
            <span class="fd-stat-val">${agent.tasks || 0}</span>
            <span class="fd-stat-lbl">Tasks Today</span>
          </div>
          <div class="fd-status-stat">
            <span class="fd-stat-val">${agent.tokens ? (agent.tokens / 1000).toFixed(1) + 'K' : '—'}</span>
            <span class="fd-stat-lbl">Tokens Used</span>
          </div>
          <div class="fd-status-stat">
            <span class="fd-stat-val">${agent.fitness ? Math.round(agent.fitness * 100) + '%' : '—'}</span>
            <span class="fd-stat-lbl">Fitness</span>
          </div>
        </div>
        ${agent.task ? `<div class="fd-current-task">Currently: ${agent.task}</div>` : ''}
      </div>

      <!-- 4. WHAT IT DID -->
      <div class="fd-section">
        <div class="fd-section-title">📋 What It Did</div>
        <div class="fd-description">${description.replace(/`([^`]+)`/g, '<code>$1</code>')}</div>
        ${tags.length > 0 ? `
        <div class="fd-tags">
          ${tags.map(t => `<span class="fd-tag">#${t}</span>`).join('')}
        </div>` : ''}
      </div>

      <!-- 5. ARTIFACTS -->
      <div class="fd-section">
        <div class="fd-section-title">📦 Artifacts</div>
        ${artifacts.length > 0 ? `
        <div class="fd-artifacts">
          ${artifacts.map(a => {
            const icons = { script: '📜', note: '📄', folder: '📁', image: '🖼️', data: '📊' };
            const safePath = (a.path || '').replace(/'/g, "\\'");
            const safeName = (a.name || '').replace(/'/g, "\\'");
            return `<div class="fd-artifact" onclick="goToEntity('note','${safePath}','${safeName}')" title="${a.path || ''}">
              <span class="fd-artifact-icon">${icons[a.type] || '📄'}</span>
              <span class="fd-artifact-name">${a.name}</span>
              <span class="fd-artifact-arrow">→</span>
            </div>`;
          }).join('')}
        </div>` : _fdPlaceholder(pendingMsg)}
      </div>

      <!-- 6. TASK TIMELINE -->
      <div class="fd-section">
        <div class="fd-section-title">🕐 Task Timeline</div>
        ${timelineEvents.length > 0 ? `
        <div class="fd-timeline">
          ${timelineEvents.map((ev, i) => `
            <div class="fd-tl-row${ev.current ? ' fd-tl-current' : ''}">
              <div class="fd-tl-line-col">
                <div class="fd-tl-dot${ev.current ? ' fd-tl-dot-current' : ''}"></div>
                ${i < timelineEvents.length - 1 ? '<div class="fd-tl-line"></div>' : ''}
              </div>
              <div class="fd-tl-content">
                <span class="fd-tl-icon">${ev.icon}</span>
                <span class="fd-tl-label">${ev.label}</span>
                ${ev.current ? '<span class="fd-tl-here-badge">you are here</span>' : ''}
                <span class="fd-tl-time">${ev.time}</span>
              </div>
            </div>
          `).join('')}
        </div>` : _fdPlaceholder(pendingMsg)}
      </div>

      <!-- 7. VAULT CONNECTIONS -->
      <div class="fd-section">
        <div class="fd-section-title">📚 Vault Connections</div>
        ${vaultConnections.length > 0 ? `
        <div class="fd-vault-links">
          ${vaultConnections.map(note => {
            const safeNote = (typeof note === 'string' ? note : note.name || '').replace(/'/g, "\\'");
            return `
            <div class="fd-vault-link" onclick="closeFeedDetail();goToEntity('note','${safeNote}','${safeNote}')">
              <span class="fd-vault-link-icon">📄</span>
              <span class="fd-vault-link-name">${safeNote}</span>
            </div>`;
          }).join('')}
        </div>` : _fdPlaceholder(pendingMsg)}
      </div>

      <!-- 8. SIBLING TASKS -->
      <div class="fd-section">
        <div class="fd-section-title">👫 Sibling Tasks</div>
        ${siblings.length > 0 ? `
        <div class="fd-siblings">
          ${siblings.map(s => {
            const sColors = { done: '#a6e3a1', active: '#89b4fa', failed: '#f38ba8', queued: '#f9e2af' };
            const sIcons = { done: '✅', active: '⚡', failed: '❌', queued: '📋' };
            return `<div class="fd-sibling">
              <span class="fd-sibling-icon" style="color:${sColors[s.status] || '#6c7086'}">${sIcons[s.status] || '•'}</span>
              <span class="fd-sibling-label">${s.label}</span>
              <span class="fd-sibling-status" style="color:${sColors[s.status] || '#6c7086'}">${s.status}</span>
            </div>`;
          }).join('')}
        </div>` : _fdPlaceholder(pendingMsg)}
      </div>

      <!-- 9. WHAT'S NEXT -->
      <div class="fd-section">
        <div class="fd-section-title">➡️ What's Next</div>
        ${nextTasks.length > 0 ? `
        <div class="fd-next-tasks">
          ${nextTasks.map(t => `
            <div class="fd-next-task${t.unblocked ? '' : ' fd-next-blocked'}">
              <span class="fd-next-emoji">${t.emoji}</span>
              <span class="fd-next-label">${t.label}</span>
              ${!t.unblocked ? '<span class="fd-next-blocked-badge">blocked</span>' : '<span class="fd-next-unblocked-badge">ready</span>'}
            </div>
          `).join('')}
        </div>` : _fdPlaceholder(pendingMsg)}
      </div>

      <!-- 10. QUICK NAV -->
      <div class="fd-section fd-section-quicknav">
        <div class="fd-section-title">🧭 Quick Nav</div>
        <div class="fd-quicknav-btns">
          ${tree ? `<button class="fd-nav-btn" onclick="closeFeedDetail();nav('missions')" title="Mission View">🎯 Mission</button>` : ''}
          ${tree ? `<button class="fd-nav-btn" onclick="closeFeedDetail();nav('pipelines')" title="Pipeline View">⚡ Pipeline</button>` : ''}
          <button class="fd-nav-btn" onclick="closeFeedDetail();nav('mind')" title="Vault">📚 Vault</button>
          <button class="fd-nav-btn" onclick="closeFeedDetail();goToEntity('agent','${agent.id}','${agent.name}')" title="Agent Profile">🤖 ${agent.name}</button>
          <button class="fd-nav-btn" onclick="closeFeedDetail();nav('tasks')" title="All Tasks">✅ Tasks</button>
        </div>
      </div>

    </div><!-- end fd-body -->
  `;
}

function renderTreeLevel(emoji, label, node, type, isCurrent) {
  if (!node) return '';
  const prog = node.progress || 0;
  const progColor = prog >= 80 ? '#a6e3a1' : prog >= 50 ? '#f9e2af' : '#f38ba8';
  const navMap = { goal: 'missions', mission: 'missions', plan: 'plans', pipeline: 'pipelines', task: 'tasks' };
  return `
    <div class="fd-tree-row${isCurrent ? ' fd-tree-current' : ''}" onclick="closeFeedDetail();nav('${navMap[type] || 'feed'}')">
      <div class="fd-tree-icon">${emoji}</div>
      <div class="fd-tree-content">
        <div class="fd-tree-label-row">
          <span class="fd-tree-type">${label}</span>
          <span class="fd-tree-name">${node.label}</span>
        </div>
        <div class="fd-tree-prog-row">
          <div class="fd-tree-prog-bar-wrap">
            <div class="fd-tree-prog-bar" style="width:${prog}%;background:${progColor}"></div>
          </div>
          <span class="fd-tree-pct" style="color:${progColor}">${prog}%</span>
        </div>
      </div>
      <div class="fd-tree-arrow">›</div>
    </div>
  `;
}

// ── Hook into stream item clicks ──────────────────────────────────────────────
// Called when the user clicks the "Detail" button or double-clicks a stream item
function initFeedDetailHooks() {
  // Attach to stream-list via delegation
  const list = document.getElementById('stream-list');
  if (!list) return;

  list.addEventListener('click', e => {
    // Check if user clicked the detail button
    const detailBtn = e.target.closest('.fd-open-btn');
    if (detailBtn) {
      e.stopPropagation();
      const id = detailBtn.dataset.itemId;
      if (id) openFeedDetail(id);
      return;
    }
  });
}

// ── Inject "View Detail" button into stream items ─────────────────────────────
// Monkey-patch makeStreamItem to add the button
(function() {
  // Wait for app.js to define makeStreamItem
  function patchMakeStreamItem() {
    if (typeof makeStreamItem !== 'function') {
      setTimeout(patchMakeStreamItem, 100);
      return;
    }
    const _orig = makeStreamItem;
    window.makeStreamItem = function(item, idx) {
      const el = _orig(item, idx);
      // Add a "Detail" button to the actions area
      const actionsDiv = el.querySelector('.stream-item-actions');
      if (actionsDiv) {
        const btn = document.createElement('button');
        btn.className = 'stream-action-btn fd-open-btn';
        btn.dataset.itemId = item.id;
        btn.title = 'View Details';
        btn.innerHTML = '🔍';
        btn.onclick = (e) => {
          e.stopPropagation();
          openFeedDetail(item.id);
        };
        actionsDiv.appendChild(btn);
      }
      return el;
    };
  }
  patchMakeStreamItem();
})();

// Init hooks when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initFeedDetailHooks);
} else {
  initFeedDetailHooks();
}
