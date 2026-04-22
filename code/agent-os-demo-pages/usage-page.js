/* Agent OS v8 — usage-page.js — Usage Analytics Page */
'use strict';

let _usageData = null;
let _usageSummary = null;
let _usageRange = 'week';
let _usageLoading = false;
let _usageFilter = { agent: '', model: '' };

function initUsagePage() {
  loadUsageData();
}

async function loadUsageData() {
  if (_usageLoading) return;
  _usageLoading = true;

  const container = $('usage-content');
  if (!container) return;
  container.innerHTML = renderUsageSkeleton();

  try {
    const [data, summary] = await Promise.all([
      Bridge.getUsage(_usageRange),
      Bridge.getUsageSummary(),
    ]);
    _usageData = data;
    _usageSummary = summary;
    renderUsagePage();
  } catch (e) {
    container.innerHTML = `<div class="usage-empty">Failed to load usage data: ${e.message}</div>`;
  } finally {
    _usageLoading = false;
  }
}

function renderUsageSkeleton() {
  return `
    <div class="usage-skeleton">
      <div class="usage-cards-skel">
        <div class="skeleton-card"></div><div class="skeleton-card"></div>
        <div class="skeleton-card"></div><div class="skeleton-card"></div>
      </div>
      <div class="skeleton-chart"></div>
      <div class="skeleton-table"></div>
    </div>
  `;
}

function renderUsagePage() {
  const container = $('usage-content');
  if (!container) return;

  const summary = _usageSummary || {};
  const sessions = (_usageData?.sessions || []);

  // Filter
  let filtered = sessions;
  if (_usageFilter.agent) {
    filtered = filtered.filter(s => (s.agent || '').toLowerCase().includes(_usageFilter.agent.toLowerCase()));
  }
  if (_usageFilter.model) {
    filtered = filtered.filter(s => (s.model || '').toLowerCase().includes(_usageFilter.model.toLowerCase()));
  }

  // Get unique agents and models for filter dropdowns
  const agents = [...new Set(sessions.map(s => s.agent).filter(Boolean))];
  const models = [...new Set(sessions.map(s => s.model).filter(Boolean))];

  container.innerHTML = `
    <div class="usage-toolbar">
      <div class="usage-range-btns">
        ${['today', 'week', 'month'].map(r => `
          <button class="usage-range-btn ${_usageRange === r ? 'active' : ''}" onclick="usageSetRange('${r}')">${r.charAt(0).toUpperCase() + r.slice(1)}</button>
        `).join('')}
      </div>
      <div class="usage-filters">
        <select class="usage-filter-select" onchange="usageFilterAgent(this.value)">
          <option value="">All Agents</option>
          ${agents.map(a => `<option value="${a}" ${_usageFilter.agent === a ? 'selected' : ''}>${a}</option>`).join('')}
        </select>
        <select class="usage-filter-select" onchange="usageFilterModel(this.value)">
          <option value="">All Models</option>
          ${models.map(m => `<option value="${m}" ${_usageFilter.model === m ? 'selected' : ''}>${m}</option>`).join('')}
        </select>
      </div>
    </div>

    <div class="usage-summary-cards">
      <div class="usage-card">
        <div class="usage-card-label">Total Tokens</div>
        <div class="usage-card-value">${formatTokens((summary.input_tokens || 0) + (summary.output_tokens || 0))}</div>
        <div class="usage-card-sub">In: ${formatTokens(summary.input_tokens || 0)} / Out: ${formatTokens(summary.output_tokens || 0)}</div>
      </div>
      <div class="usage-card">
        <div class="usage-card-label">Total Cost</div>
        <div class="usage-card-value">$${(summary.cost_usd || 0).toFixed(2)}</div>
        <div class="usage-card-sub">This ${_usageRange}</div>
      </div>
      <div class="usage-card">
        <div class="usage-card-label">Sessions</div>
        <div class="usage-card-value">${summary.session_count || 0}</div>
        <div class="usage-card-sub">Active this ${_usageRange}</div>
      </div>
      <div class="usage-card">
        <div class="usage-card-label">Avg Tokens/Session</div>
        <div class="usage-card-value">${formatTokens(summary.avg_tokens || 0)}</div>
        <div class="usage-card-sub">Across all sessions</div>
      </div>
    </div>

    ${renderUsageChart(filtered)}

    <div class="usage-table-section">
      <h3 class="usage-section-title">Per-Session Breakdown</h3>
      <div class="usage-table-wrap">
        <table class="sessions-table usage-table">
          <thead>
            <tr>
              <th>Session</th>
              <th>Agent</th>
              <th>Model</th>
              <th>In Tokens</th>
              <th>Out Tokens</th>
              <th>Cache</th>
              <th>Cost</th>
            </tr>
          </thead>
          <tbody>
            ${filtered.length === 0 ? '<tr><td colspan="7" class="sessions-empty-row">No usage data</td></tr>' :
              filtered.map(s => `
                <tr>
                  <td class="session-key" title="${s.key || ''}">${(s.key || '—').slice(0, 20)}</td>
                  <td><span class="session-agent-pill">${s.agent || '—'}</span></td>
                  <td class="session-model">${s.model || '—'}</td>
                  <td class="session-tokens">${formatTokens(s.input_tokens || 0)}</td>
                  <td class="session-tokens">${formatTokens(s.output_tokens || 0)}</td>
                  <td class="session-tokens">${formatTokens(s.cache_read_tokens || 0)}</td>
                  <td>$${(s.cost_usd || 0).toFixed(3)}</td>
                </tr>
              `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function renderUsageChart(sessions) {
  if (!sessions || sessions.length === 0) {
    return '<div class="usage-chart-empty">No data for chart</div>';
  }

  // Aggregate by agent for bar chart
  const byAgent = {};
  for (const s of sessions) {
    const agent = s.agent || 'unknown';
    if (!byAgent[agent]) byAgent[agent] = { input: 0, output: 0 };
    byAgent[agent].input += s.input_tokens || 0;
    byAgent[agent].output += s.output_tokens || 0;
  }

  const entries = Object.entries(byAgent).sort((a, b) => (b[1].input + b[1].output) - (a[1].input + a[1].output));
  const maxTokens = Math.max(...entries.map(([, v]) => v.input + v.output), 1);

  const bars = entries.map(([agent, val]) => {
    const total = val.input + val.output;
    const inputPct = Math.round((val.input / maxTokens) * 100);
    const outputPct = Math.round((val.output / maxTokens) * 100);
    return `
      <div class="usage-bar-row">
        <div class="usage-bar-label">${agent}</div>
        <div class="usage-bar-track">
          <div class="usage-bar-fill usage-bar-input" style="width:${inputPct}%" title="Input: ${formatTokens(val.input)}"></div>
          <div class="usage-bar-fill usage-bar-output" style="width:${outputPct}%" title="Output: ${formatTokens(val.output)}"></div>
        </div>
        <div class="usage-bar-value">${formatTokens(total)}</div>
      </div>
    `;
  }).join('');

  return `
    <div class="usage-chart-section">
      <h3 class="usage-section-title">Token Usage by Agent</h3>
      <div class="usage-chart-legend">
        <span class="usage-legend-item"><span class="usage-legend-dot usage-bar-input"></span> Input</span>
        <span class="usage-legend-item"><span class="usage-legend-dot usage-bar-output"></span> Output</span>
      </div>
      <div class="usage-chart">${bars}</div>
    </div>
  `;
}

function usageSetRange(range) {
  _usageRange = range;
  loadUsageData();
}

function usageFilterAgent(val) {
  _usageFilter.agent = val;
  renderUsagePage();
}

function usageFilterModel(val) {
  _usageFilter.model = val;
  renderUsagePage();
}
