/* Agent OS v8 — workbench.js — Two-Column Agent Workbench (REAL DATA) */
'use strict';

// ═══════════════════════════════════════════════════════════
// STATE
// ═══════════════════════════════════════════════════════════

let wb2SelectedAgentId = null;
let wb2AgentData = [];       // from dispatch active/done
let wb2QueueData = [];       // from dispatch queue
let wb2ProposalData = [];    // from proposals
let wb2AgentOutputs = {};    // agentId -> [{ text, type, time }]
let wb2AgentsTimer = null;
let wb2QueueTimer = null;

PAGE_TITLES.workbench = 'Workbench';

// ═══════════════════════════════════════════════════════════
// DATA FETCHING — REAL DATA ONLY, NO MOCKS
// ═══════════════════════════════════════════════════════════

let wb2Initialized = false;

function initWorkbench() {
  wb2LoadAll();
  if (!wb2Initialized) {
    wb2Initialized = true;
    wb2StartPolling();
  }
}

async function wb2LoadAll() {
  await Promise.all([
    wb2FetchAgents(),
    wb2FetchQueue(),
    wb2FetchProposals(),
  ]);
  wb2Render();
}

async function wb2FetchAgents() {
  try {
    // Get real dispatch data + gateway data (TUI dispatches)
    const [queueData, feedData, gatewayData] = await Promise.all([
      Bridge.apiFetch('/api/queue'),
      Bridge.apiFetch('/api/feed?limit=50'),
      Bridge.apiFetch('/api/gateway/tasks').catch(() => ({ tasks: [] })),
    ]);

    const tasks = queueData.tasks || [];
    const feed = feedData.events || [];
    const gatewayTasks = (gatewayData.tasks || []).filter(t => t.status === 'active');

    // Active agents = dispatch active tasks + gateway active sessions
    const activeTasks = [
      ...tasks.filter(t => t._status === 'active' || t.status === 'active'),
      ...gatewayTasks,
    ];
    const queuedTasks = tasks.filter(t => t._status === 'queued' || t.status === 'queued');

    // Get recent completions from feed
    const recentCompletions = feed
      .filter(e => e.type === 'task_completed' || e.type === 'complete')
      .slice(0, 10);

    // Build agent data from active tasks
    wb2AgentData = activeTasks.map(task => {
      const agentInfo = typeof ga === 'function' ? ga(task.agent) : null;
      const startTime = task.started_at || task.claimed_at || task.created_at;
      const durationMs = startTime ? Date.now() - new Date(startTime).getTime() : 0;

      // Get feed events for this agent
      const agentFeed = feed.filter(e => e.agent === task.agent).slice(0, 8);

      return {
        id: task.agent + '-' + task.id,
        agentId: task.agent,
        name: agentInfo ? agentInfo.name : task.agent,
        emoji: agentInfo ? agentInfo.emoji : '🤖',
        color: agentInfo ? agentInfo.color : '#cba6f7',
        status: 'active',
        current_stage: 'working',
        duration_ms: durationMs,
        task: { title: task.description, id: task.id },
        mission: null,
        files_changed: [],
        pipeline: null,
        handoffs_out: [],
        inbox: [],
        delegation_path: ['System', 'Dispatch', task.agent],
        feed_events: agentFeed,
      };
    });

    // If no active tasks, show idle state (no fake data)
    return;
  } catch (err) {
    console.warn('[Workbench] Failed to fetch agents:', err);
    wb2AgentData = [];
  }
}

async function wb2FetchQueue() {
  try {
    const data = await Bridge.apiFetch('/api/queue');
    const tasks = data.tasks || [];
    wb2QueueData = tasks
      .filter(t => t._status === 'queued' || t.status === 'queued')
      .map(t => ({
        id: t.id,
        title: t.description || t.title || t.id,
        agent: t.agent,
        priority: 'P' + (t.priority || 3),
        created_at: t.created_at,
        blocked: t._blocked || false,
      }));
  } catch {
    wb2QueueData = [];
  }
}

async function wb2FetchProposals() {
  try {
    const data = await Bridge.apiFetch('/api/proposals?status=pending');
    const proposals = data.proposals || (Array.isArray(data) ? data : []);
    wb2ProposalData = proposals.map(p => ({
      id: p.id,
      title: p.title || p.description || p.id,
      scope: p.scope || '',
      source: p.source || '',
      created_at: p.created_at,
    }));
  } catch {
    wb2ProposalData = [];
  }
}

// ═══════════════════════════════════════════════════════════
// POLLING
// ═══════════════════════════════════════════════════════════

function wb2StartPolling() {
  if (wb2AgentsTimer) return;

  wb2AgentsTimer = setInterval(async () => {
    if (typeof shouldPoll === 'function' && !shouldPoll()) return;
    if (typeof currentPage !== 'undefined' && currentPage !== 'workbench') return;
    await wb2FetchAgents();
    wb2RenderLeft();
    wb2UpdateStatusBar();
    if (wb2SelectedAgentId) wb2RenderDetail(wb2SelectedAgentId);
  }, 5000);

  wb2QueueTimer = setInterval(async () => {
    if (typeof shouldPoll === 'function' && !shouldPoll()) return;
    if (typeof currentPage !== 'undefined' && currentPage !== 'workbench') return;
    await Promise.all([wb2FetchQueue(), wb2FetchProposals()]);
    wb2RenderLeft();
    wb2UpdateStatusBar();
  }, 10000);
}

function wb2StopPolling() {
  if (wb2AgentsTimer) { clearInterval(wb2AgentsTimer); wb2AgentsTimer = null; }
  if (wb2QueueTimer) { clearInterval(wb2QueueTimer); wb2QueueTimer = null; }
}

// Wire into Bridge WebSocket for real-time output streaming
if (typeof Bridge !== 'undefined') {
  Bridge.on('feed', (msg) => {
    if (typeof currentPage !== 'undefined' && currentPage !== 'workbench') return;
    if (!msg.data) return;
    const agentId = msg.data.agent;
    if (!agentId) return;
    wb2AppendOutput(agentId, {
      text: msg.data.content || msg.data.text || '',
      type: msg.data.type || 'info',
      time: new Date(msg.data.timestamp || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    });
  });
}

// ═══════════════════════════════════════════════════════════
// RENDER — TOP LEVEL
// ═══════════════════════════════════════════════════════════

function wb2Render() {
  wb2UpdateStatusBar();
  wb2RenderLeft();
  if (wb2SelectedAgentId) {
    wb2RenderDetail(wb2SelectedAgentId);
  }
}

// ═══════════════════════════════════════════════════════════
// STATUS BAR
// ═══════════════════════════════════════════════════════════

function wb2UpdateStatusBar() {
  const activeAgents = wb2AgentData.filter(a => a.status === 'active');
  const el_agents = document.getElementById('wb2-count-agents');
  const el_queued = document.getElementById('wb2-count-queued');
  const el_props = document.getElementById('wb2-count-proposals');
  if (el_agents) el_agents.textContent = activeAgents.length;
  if (el_queued) el_queued.textContent = wb2QueueData.length;
  if (el_props) el_props.textContent = wb2ProposalData.length;
}

// ═══════════════════════════════════════════════════════════
// LEFT COLUMN
// ═══════════════════════════════════════════════════════════

function wb2RenderLeft() {
  wb2RenderAgentList();
  wb2RenderQueueList();
  wb2RenderProposalsList();
}

function wb2RenderAgentList() {
  const container = document.getElementById('wb2-agent-list');
  const countEl = document.getElementById('wb2-active-count');
  if (!container) return;

  const active = wb2AgentData.filter(a => a.status === 'active');
  if (countEl) countEl.textContent = active.length;

  if (active.length === 0) {
    container.innerHTML = '<div class="wb2-empty">No active agents — all tasks completed or queued</div>';
    return;
  }

  container.innerHTML = active.map(agent => {
    const isSelected = agent.id === wb2SelectedAgentId;
    const duration = wb2FormatDuration(agent.duration_ms);
    const stage = agent.current_stage || 'working';
    const taskTitle = agent.task ? agent.task.title : '';
    const missionTitle = agent.mission ? agent.mission.title : '';

    return `
      <div class="wb2-agent-card ${isSelected ? 'wb2-agent-card-selected' : ''}"
           data-agent-id="${agent.id}"
           onclick="wb2SelectAgent('${agent.id}')"
           style="--agent-color:${agent.color || '#cba6f7'}">
        <div class="wb2-agent-card-header">
          <span class="wb2-agent-pulse"></span>
          <span class="wb2-agent-emoji">${agent.emoji || '🤖'}</span>
          <span class="wb2-agent-name">${agent.name}</span>
          <span class="wb2-agent-duration">${duration}</span>
        </div>
        <div class="wb2-agent-stage">
          <span class="wb2-stage-chip">${wb2StageIcon(stage)} ${stage}</span>
        </div>
        ${taskTitle ? `<div class="wb2-agent-task">${wb2esc(taskTitle.length > 60 ? taskTitle.slice(0, 60) + '...' : taskTitle)}</div>` : ''}
        ${missionTitle ? `
          <div class="wb2-agent-mission" onclick="event.stopPropagation();nav('missions')" title="Go to Missions">
            🎯 ${wb2esc(missionTitle)}
          </div>` : ''}
      </div>
    `;
  }).join('');
}

function wb2RenderQueueList() {
  const container = document.getElementById('wb2-queue-list');
  const countEl = document.getElementById('wb2-queue-count');
  if (!container) return;

  const sorted = [...wb2QueueData].sort((a, b) => {
    const pOrder = { P0: 0, P1: 1, P2: 2, P3: 3, P4: 4 };
    const pa = pOrder[a.priority] ?? 99;
    const pb = pOrder[b.priority] ?? 99;
    return pa - pb;
  });

  if (countEl) countEl.textContent = sorted.length;

  if (sorted.length === 0) {
    container.innerHTML = '<div class="wb2-empty">No tasks queued</div>';
    return;
  }

  container.innerHTML = sorted.map(task => {
    const agentData = typeof ga === 'function' ? ga(task.agent) : null;
    const emoji = agentData ? agentData.emoji : '🤖';
    const priorityClass = wb2PriorityClass(task.priority);
    const age = wb2TimeAgo(task.created_at);
    return `
      <div class="wb2-queue-item${task.blocked ? ' wb2-queue-blocked' : ''}">
        <span class="wb2-priority-label ${priorityClass}">${task.priority || 'P?'}</span>
        <div class="wb2-queue-item-body">
          <div class="wb2-queue-title">${wb2esc(task.title || task.id)}</div>
          <div class="wb2-queue-meta">
            <span>${emoji} ${task.agent || ''}</span>
            <span class="wb2-queue-age">${age}</span>
            ${task.blocked ? '<span class="wb2-blocked-badge">blocked</span>' : ''}
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function wb2RenderProposalsList() {
  const container = document.getElementById('wb2-proposals-list');
  const countEl = document.getElementById('wb2-proposals-count');
  if (!container) return;

  if (countEl) countEl.textContent = wb2ProposalData.length;

  if (wb2ProposalData.length === 0) {
    container.innerHTML = '<div class="wb2-empty">No pending proposals</div>';
    return;
  }

  container.innerHTML = wb2ProposalData.map(prop => {
    return `
      <div class="wb2-proposal-item" onclick="nav('queue')" title="Go to Proposals">
        <div class="wb2-proposal-title">${wb2esc(prop.title || prop.id)}</div>
        <div class="wb2-proposal-meta">
          ${prop.scope ? `<span class="wb2-proposal-scope">${wb2esc(prop.scope)}</span>` : ''}
          ${prop.source ? `<span class="wb2-proposal-source">from ${wb2esc(prop.source)}</span>` : ''}
        </div>
      </div>
    `;
  }).join('');
}

// ═══════════════════════════════════════════════════════════
// RIGHT COLUMN — AGENT DETAIL
// ═══════════════════════════════════════════════════════════

function wb2SelectAgent(agentId) {
  wb2SelectedAgentId = agentId;
  document.querySelectorAll('.wb2-agent-card').forEach(el => {
    el.classList.toggle('wb2-agent-card-selected', el.dataset.agentId === agentId);
  });
  wb2RenderDetail(agentId);
}

function wb2RenderDetail(agentId) {
  const container = document.getElementById('wb2-detail');
  if (!container) return;

  const agent = wb2AgentData.find(a => a.id === agentId);
  if (!agent) {
    container.innerHTML = `<div class="wb2-detail-empty"><div class="wb2-detail-empty-icon">⚡</div><div class="wb2-detail-empty-title">Select an active agent</div></div>`;
    return;
  }

  const outputs = wb2AgentOutputs[agentId] || [];
  const delegationPath = agent.delegation_path || [];
  const filesChanged = agent.files_changed || [];
  const pipeline = agent.pipeline;
  const handoffsOut = agent.handoffs_out || [];
  const inbox = agent.inbox || [];
  const feedEvents = agent.feed_events || [];

  container.innerHTML = `
    <!-- Delegation Breadcrumb -->
    <div class="wb2-detail-section wb2-breadcrumb-section">
      ${wb2RenderBreadcrumb(delegationPath, agent)}
    </div>

    <!-- Task Info -->
    <div class="wb2-detail-section">
      <div class="wb2-detail-section-header">
        <span class="wb2-detail-section-title">📋 Current Task</span>
        <span class="wb2-output-agent-tag" style="color:${agent.color || '#cba6f7'}">${agent.emoji} ${agent.name}</span>
      </div>
      <div class="wb2-task-description">${wb2esc(agent.task ? agent.task.title : 'No task')}</div>
      ${agent.task ? `<div class="wb2-task-id">${agent.task.id}</div>` : ''}
    </div>

    <!-- Live Output Panel -->
    <div class="wb2-detail-section">
      <div class="wb2-detail-section-header">
        <span class="wb2-detail-section-title">
          <span class="wb2-output-dot"></span> LIVE OUTPUT
        </span>
      </div>
      <div class="wb2-output-panel" id="wb2-output-${agentId}">
        ${outputs.length > 0 ? outputs.map(o => wb2RenderOutputLine(o)).join('') : '<div class="wb2-empty">Waiting for output via WebSocket...</div>'}
        ${agent.status === 'active' ? '<div class="wb2-output-cursor">▊</div>' : ''}
      </div>
    </div>

    <!-- Pipeline Progress -->
    ${pipeline ? `
    <div class="wb2-detail-section">
      <div class="wb2-detail-section-header">
        <span class="wb2-detail-section-title">🔀 Pipeline</span>
        <span class="wb2-pipeline-name-link" onclick="nav('pipelines')" title="Go to Pipelines">${wb2esc(pipeline.title)}</span>
      </div>
      ${wb2RenderPipeline(pipeline)}
    </div>` : ''}

    <!-- Files Changed -->
    ${filesChanged.length > 0 ? `
    <div class="wb2-detail-section">
      <div class="wb2-detail-section-header">
        <span class="wb2-detail-section-title">📁 Files Changed</span>
        <span class="wb2-files-count">${filesChanged.length} file${filesChanged.length !== 1 ? 's' : ''}</span>
      </div>
      <div class="wb2-files-list">
        ${filesChanged.map(f => wb2RenderFileEntry(f)).join('')}
      </div>
    </div>` : ''}

    <!-- Recent Feed Events -->
    ${feedEvents.length > 0 ? `
    <div class="wb2-detail-section">
      <div class="wb2-detail-section-header">
        <span class="wb2-detail-section-title">📡 Recent Events</span>
      </div>
      <div class="wb2-feed-events">
        ${feedEvents.map(e => wb2RenderFeedEvent(e)).join('')}
      </div>
    </div>` : ''}
  `;

  requestAnimationFrame(() => {
    const outputEl = document.getElementById(`wb2-output-${agentId}`);
    if (outputEl) outputEl.scrollTop = outputEl.scrollHeight;
  });
}

function wb2RenderBreadcrumb(path, agent) {
  if (!path || path.length === 0) {
    return `<div class="wb2-breadcrumb"><span class="wb2-breadcrumb-item">System</span> › <span class="wb2-breadcrumb-item wb2-breadcrumb-active">${agent.emoji} ${agent.name}</span></div>`;
  }
  const items = path.map((step, i) => {
    const isLast = i === path.length - 1;
    return isLast
      ? `<span class="wb2-breadcrumb-item wb2-breadcrumb-active">${agent.emoji} ${wb2esc(step)}</span>`
      : `<span class="wb2-breadcrumb-item">${wb2esc(step)}</span>`;
  });
  return `<div class="wb2-breadcrumb">${items.join(' › ')}</div>`;
}

function wb2RenderPipeline(pipeline) {
  const stages = pipeline.stages || [];
  const current = pipeline.current || 0;
  const pct = stages.length > 0 ? Math.round(((current + 1) / stages.length) * 100) : 0;

  const stagesHtml = stages.map((s, i) => {
    let cls = 'wb2-pipeline-stage';
    if (i < current) cls += ' wb2-pipeline-done';
    else if (i === current) cls += ' wb2-pipeline-current';
    else cls += ' wb2-pipeline-pending';
    return `<div class="${cls}" title="${wb2esc(s)}">${wb2esc(s)}</div>`;
  }).join('<span class="wb2-pipeline-arrow">›</span>');

  return `
    <div class="wb2-pipeline-stages">${stagesHtml}</div>
    <div class="wb2-pipeline-bar-wrap">
      <div class="wb2-pipeline-bar" style="width:${pct}%"></div>
    </div>
    <div class="wb2-pipeline-pct">${pct}% complete</div>
  `;
}

function wb2RenderFileEntry(file) {
  const statusIcon = file.status === 'added' ? '✚' : file.status === 'deleted' ? '✖' : '~';
  const statusClass = file.status === 'added' ? 'wb2-file-added' : file.status === 'deleted' ? 'wb2-file-deleted' : 'wb2-file-modified';
  return `
    <div class="wb2-file-entry">
      <span class="wb2-file-status ${statusClass}">${statusIcon}</span>
      <span class="wb2-file-path">${wb2esc(file.path)}</span>
      <span class="wb2-file-diff">
        ${file.additions > 0 ? `<span class="wb2-diff-add">+${file.additions}</span>` : ''}
        ${file.deletions > 0 ? `<span class="wb2-diff-del">-${file.deletions}</span>` : ''}
      </span>
    </div>
  `;
}

function wb2RenderFeedEvent(event) {
  const typeColors = {
    task_started: '#89b4fa', task_completed: '#a6e3a1', error: '#f38ba8',
    vault_write: '#cba6f7', insight: '#f9e2af', dispatch: '#89b4fa',
    system: '#6c7086', complete: '#a6e3a1',
  };
  const color = typeColors[event.type] || '#6c7086';
  const content = event.content || '';
  const time = event.timestamp ? new Date(event.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : (event.time || '');

  return `
    <div class="wb2-feed-event">
      <span class="wb2-feed-event-time">${time}</span>
      <span class="wb2-feed-event-type" style="color:${color}">${wb2TypeLabel(event.type)}</span>
      <span class="wb2-feed-event-content">${wb2esc(content.length > 100 ? content.slice(0, 100) + '...' : content)}</span>
    </div>
  `;
}

function wb2RenderOutputLine(line) {
  const cls = wb2OutputLineClass(line.type);
  return `
    <div class="wb2-output-line ${cls}">
      <span class="wb2-output-time">${line.time || ''}</span>
      <span class="wb2-output-text">${wb2esc(line.text || '')}</span>
    </div>
  `;
}

function wb2AppendOutput(agentId, line) {
  if (!wb2AgentOutputs[agentId]) wb2AgentOutputs[agentId] = [];
  wb2AgentOutputs[agentId].push(line);
  if (wb2AgentOutputs[agentId].length > 60) {
    wb2AgentOutputs[agentId] = wb2AgentOutputs[agentId].slice(-60);
  }

  if (wb2SelectedAgentId !== agentId) return;

  const outputEl = document.getElementById(`wb2-output-${agentId}`);
  if (!outputEl) return;

  const lineEl = document.createElement('div');
  lineEl.className = `wb2-output-line ${wb2OutputLineClass(line.type)}`;
  lineEl.innerHTML = `
    <span class="wb2-output-time">${line.time || ''}</span>
    <span class="wb2-output-text">${wb2esc(line.text || '')}</span>
  `;

  const cursor = outputEl.querySelector('.wb2-output-cursor');
  if (cursor) outputEl.insertBefore(lineEl, cursor);
  else outputEl.appendChild(lineEl);

  outputEl.scrollTop = outputEl.scrollHeight;
}

// ═══════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════

function wb2esc(str) {
  if (!str) return '';
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function wb2FormatDuration(ms) {
  if (!ms) return '—';
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function wb2TimeAgo(isoStr) {
  if (!isoStr) return '';
  const diff = Math.floor((Date.now() - new Date(isoStr).getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function wb2PriorityClass(priority) {
  switch (priority) {
    case 'P0': return 'wb2-p0';
    case 'P1': return 'wb2-p1';
    case 'P2': return 'wb2-p2';
    case 'P3': return 'wb2-p3';
    case 'P4': return 'wb2-p4';
    default: return 'wb2-p3';
  }
}

function wb2StageIcon(stage) {
  const icons = {
    planning: '📐', researching: '🔬', coding: '💻', testing: '🧪',
    writing: '✍️', reviewing: '👁️', deploying: '🚀', idle: '💤',
    working: '⚙️', analyzing: '📊', synthesizing: '🧬',
  };
  return icons[stage] || '⚙️';
}

function wb2OutputLineClass(type) {
  if (!type) return 'wb2-out-info';
  const t = type.toLowerCase();
  if (t.includes('error') || t.includes('fail')) return 'wb2-out-error';
  if (t.includes('success') || t.includes('complete') || t.includes('done')) return 'wb2-out-success';
  if (t.includes('warn')) return 'wb2-out-warn';
  if (t.includes('task') || t.includes('dispatch')) return 'wb2-out-task';
  if (t.includes('vault') || t.includes('insight')) return 'wb2-out-insight';
  return 'wb2-out-info';
}

function wb2TypeLabel(type) {
  const labels = {
    task_started: 'started', task_completed: 'done', error: 'error',
    vault_write: 'vault', insight: 'insight', dispatch: 'dispatch',
    system: 'system', complete: 'done', handoff_created: 'handoff',
  };
  return labels[type] || (type || 'event');
}
