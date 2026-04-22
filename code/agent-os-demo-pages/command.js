/* command.js — Dispatch interface for submitting work from web UI */
'use strict';

function initCommand() {
  const container = document.getElementById('view-command');
  if (!container) return;

  container.innerHTML = `
    <div class="dispatch-container">
      <h2 class="dispatch-title">Dispatch Work</h2>
      <div class="dispatch-form">
        <textarea id="cmd-prompt" class="dispatch-textarea" placeholder="Describe the work to be done..." rows="4"></textarea>
        <div class="dispatch-options">
          <select id="cmd-agent" class="dispatch-select">
            <option value="auto">Auto-route</option>
          </select>
          <select id="cmd-priority" class="dispatch-select">
            <option value="1">P1 — Critical</option>
            <option value="2" selected>P2 — Normal</option>
            <option value="3">P3 — Low</option>
            <option value="4">P4 — Background</option>
          </select>
          <select id="cmd-mission" class="dispatch-select">
            <option value="">No mission</option>
          </select>
          <button id="cmd-submit" class="dispatch-submit" onclick="submitDispatch()">Dispatch</button>
        </div>
      </div>
      <div id="cmd-result" class="dispatch-result" style="display:none"></div>
      <div id="cmd-history" class="dispatch-history"></div>
    </div>
  `;

  loadCommandOptions();
  loadRecentDispatches();
}

async function loadCommandOptions() {
  // Populate agent dropdown
  try {
    const agents = await Bridge.apiFetch('/api/agents');
    const select = document.getElementById('cmd-agent');
    if (!select) return;
    (Array.isArray(agents) ? agents : []).forEach(a => {
      const opt = document.createElement('option');
      opt.value = a.id;
      opt.textContent = a.name || a.id;
      select.appendChild(opt);
    });
  } catch (e) {
    // Agents endpoint not available yet — auto-route only
  }

  // Populate missions dropdown
  try {
    const data = await Bridge.apiFetch('/api/missions');
    const missions = data.missions || data || [];
    const select = document.getElementById('cmd-mission');
    if (!select) return;
    (Array.isArray(missions) ? missions : []).forEach(m => {
      const opt = document.createElement('option');
      opt.value = m.id;
      opt.textContent = m.title || m.name || m.id;
      select.appendChild(opt);
    });
  } catch (e) {
    // Missions endpoint not available yet — no-mission only
  }
}

async function submitDispatch() {
  const promptEl = document.getElementById('cmd-prompt');
  const prompt = promptEl ? promptEl.value.trim() : '';
  if (!prompt) {
    showDispatchResult('Please enter a work description.', true);
    return;
  }

  const agent = document.getElementById('cmd-agent')?.value || 'auto';
  const priority = parseInt(document.getElementById('cmd-priority')?.value || '2', 10);
  const missionVal = document.getElementById('cmd-mission')?.value;
  const mission_id = missionVal || undefined;

  const btn = document.getElementById('cmd-submit');
  if (btn) {
    btn.disabled = true;
    btn.textContent = 'Dispatching...';
  }

  try {
    const result = await Bridge.apiFetch('/api/dispatch', {
      method: 'POST',
      body: JSON.stringify({ prompt, agent, priority, mission_id, source: 'webui' })
    });
    const taskId = result.id || result.task_id || '(unknown)';
    showDispatchResult(`Dispatched: ${taskId}`, false);
    if (promptEl) promptEl.value = '';
    loadRecentDispatches();
  } catch (e) {
    showDispatchResult(e.message || 'Dispatch failed — is the bridge server running?', true);
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.textContent = 'Dispatch';
    }
  }
}

function showDispatchResult(message, isError) {
  const el = document.getElementById('cmd-result');
  if (!el) return;
  el.style.display = 'block';
  el.className = 'dispatch-result ' + (isError ? 'dispatch-error' : 'dispatch-success');
  el.textContent = message;
  if (!isError) {
    setTimeout(() => { el.style.display = 'none'; }, 5000);
  }
}

async function loadRecentDispatches() {
  const container = document.getElementById('cmd-history');
  if (!container) return;

  try {
    const data = await Bridge.apiFetch('/api/tasks?source=manual&limit=10');
    const tasks = data.tasks || data || [];
    if (!Array.isArray(tasks) || tasks.length === 0) {
      container.innerHTML = '<div class="dispatch-history-empty">No recent dispatches</div>';
      return;
    }

    container.innerHTML = '<h3 class="dispatch-history-heading">Recent Dispatches</h3>' +
      tasks.map(t => `
        <div class="dispatch-history-item" onclick="nav('workbench')">
          <span class="dispatch-history-status dispatch-status-${t.status || 'unknown'}">${t.status || '?'}</span>
          <span class="dispatch-history-text">${(t.title || t.prompt || '').slice(0, 80)}</span>
          <span class="dispatch-history-agent">${t.agent || 'auto'}</span>
        </div>
      `).join('');
  } catch (e) {
    container.innerHTML = '<div class="dispatch-history-empty">Could not load recent dispatches</div>';
  }
}
