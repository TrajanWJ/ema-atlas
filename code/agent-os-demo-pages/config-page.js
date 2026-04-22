/* Agent OS v8 — config-page.js — Config Editor Page */
'use strict';

let _configData = null;
let _configSchema = null;
let _configDirty = {};
let _configMode = 'form'; // 'form' | 'raw'
let _configLoading = false;
let _configSaving = false;
let _configRawText = '';
let _configErrors = [];
let _configPath = '';
let _configCollapsed = {}; // section -> boolean

function initConfigPage() {
  loadConfigData();
}

async function loadConfigData() {
  if (_configLoading) return;
  _configLoading = true;

  const container = $('config-content');
  if (!container) return;
  container.innerHTML = '<div class="config-loading">Loading configuration...</div>';

  try {
    const [configResp, schema] = await Promise.all([
      Bridge.getConfig(),
      Bridge.getConfigSchema().catch(() => null),
    ]);
    _configData = configResp.config || {};
    _configPath = configResp.path || '';
    _configSchema = schema;
    _configDirty = {};
    _configErrors = [];
    _configRawText = JSON.stringify(_configData, null, 2);
    renderConfigPage();
  } catch (e) {
    container.innerHTML = `<div class="config-error">Failed to load config: ${e.message}</div>`;
  } finally {
    _configLoading = false;
  }
}

function renderConfigPage() {
  const container = $('config-content');
  if (!container) return;

  const dirtyCount = Object.keys(_configDirty).length;

  container.innerHTML = `
    <div class="config-toolbar">
      <div class="config-toolbar-left">
        <div class="config-mode-toggle">
          <button class="config-mode-btn ${_configMode === 'form' ? 'active' : ''}" onclick="configSetMode('form')">Form</button>
          <button class="config-mode-btn ${_configMode === 'raw' ? 'active' : ''}" onclick="configSetMode('raw')">JSON</button>
        </div>
        ${_configPath ? `<span class="config-path" title="${_configPath}">${_configPath}</span>` : ''}
      </div>
      <div class="config-toolbar-right">
        ${dirtyCount > 0 ? `<span class="config-dirty-badge">${dirtyCount} changed</span>` : ''}
        <button class="btn-ghost" onclick="loadConfigData()">Reload</button>
        <button class="config-save-btn" onclick="configSave()" ${dirtyCount === 0 && _configMode === 'form' ? 'disabled' : ''}>
          ${_configSaving ? 'Saving...' : 'Save'}
        </button>
        <button class="config-apply-btn" onclick="configApply()">Apply + Restart</button>
      </div>
    </div>

    ${_configErrors.length > 0 ? `
      <div class="config-errors">
        ${_configErrors.map(e => `<div class="config-error-item">${e}</div>`).join('')}
      </div>
    ` : ''}

    <div class="config-body">
      ${_configMode === 'form' ? renderConfigForm() : renderConfigRaw()}
    </div>
  `;
}

function renderConfigForm() {
  if (!_configData || typeof _configData !== 'object') {
    return '<div class="config-empty">No configuration data</div>';
  }

  const sections = Object.keys(_configData);
  if (sections.length === 0) {
    return '<div class="config-empty">Empty configuration</div>';
  }

  return sections.map(section => {
    const value = _configData[section];
    const collapsed = _configCollapsed[section] || false;

    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      // Render as collapsible card
      return `
        <div class="config-section ${collapsed ? 'collapsed' : ''}">
          <div class="config-section-header" onclick="configToggleSection('${section}')">
            <span class="config-section-arrow">${collapsed ? '▸' : '▾'}</span>
            <span class="config-section-title">${section}</span>
            <span class="config-section-count">${Object.keys(value).length} keys</span>
          </div>
          ${!collapsed ? `<div class="config-section-body">
            ${renderConfigFields(value, section)}
          </div>` : ''}
        </div>
      `;
    }

    // Top-level primitive
    return `
      <div class="config-section">
        <div class="config-section-body">
          ${renderConfigField(section, value, section)}
        </div>
      </div>
    `;
  }).join('');
}

function renderConfigFields(obj, parentPath) {
  return Object.entries(obj).map(([key, value]) => {
    const fullPath = `${parentPath}.${key}`;
    return renderConfigField(key, value, fullPath);
  }).join('');
}

function renderConfigField(key, value, path) {
  const isDirty = _configDirty[path] !== undefined;
  const dirtyClass = isDirty ? 'config-field-dirty' : '';
  const displayValue = isDirty ? _configDirty[path] : value;

  if (typeof value === 'boolean' || value === true || value === false) {
    return `
      <div class="config-field ${dirtyClass}">
        <label class="config-field-label">${key}</label>
        <div class="config-field-control">
          <label class="config-toggle">
            <input type="checkbox" ${displayValue ? 'checked' : ''} onchange="configFieldChange('${path}', this.checked, 'boolean')" />
            <span class="config-toggle-slider"></span>
          </label>
        </div>
      </div>
    `;
  }

  if (typeof value === 'number') {
    return `
      <div class="config-field ${dirtyClass}">
        <label class="config-field-label">${key}</label>
        <div class="config-field-control">
          <input type="number" class="config-input" value="${displayValue}" onchange="configFieldChange('${path}', this.value, 'number')" />
        </div>
      </div>
    `;
  }

  if (Array.isArray(value)) {
    return `
      <div class="config-field ${dirtyClass}">
        <label class="config-field-label">${key}</label>
        <div class="config-field-control">
          <input type="text" class="config-input" value="${JSON.stringify(displayValue)}" onchange="configFieldChange('${path}', this.value, 'json')" />
          <span class="config-field-hint">JSON array</span>
        </div>
      </div>
    `;
  }

  if (typeof value === 'object' && value !== null) {
    // Nested object — render recursively
    return `
      <div class="config-field-nested">
        <label class="config-field-label config-field-label-nested">${key}</label>
        <div class="config-field-nested-body">
          ${renderConfigFields(value, path)}
        </div>
      </div>
    `;
  }

  // String (default)
  const isSecret = key.toLowerCase().includes('token') || key.toLowerCase().includes('password') || key.toLowerCase().includes('secret') || key.toLowerCase().includes('key');
  return `
    <div class="config-field ${dirtyClass}">
      <label class="config-field-label">${key}</label>
      <div class="config-field-control">
        <input type="${isSecret ? 'password' : 'text'}" class="config-input" value="${String(displayValue || '')}" onchange="configFieldChange('${path}', this.value, 'string')" />
      </div>
    </div>
  `;
}

function renderConfigRaw() {
  return `
    <div class="config-raw">
      <textarea class="config-raw-editor" oninput="configRawChange(this.value)" spellcheck="false">${escapeHtml(_configRawText)}</textarea>
    </div>
  `;
}

function escapeHtml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function configSetMode(mode) {
  if (mode === 'raw') {
    // Sync form changes to raw
    const merged = applyDirtyToConfig();
    _configRawText = JSON.stringify(merged, null, 2);
  }
  _configMode = mode;
  renderConfigPage();
}

function configToggleSection(section) {
  _configCollapsed[section] = !_configCollapsed[section];
  renderConfigPage();
}

function configFieldChange(path, value, type) {
  if (type === 'boolean') {
    _configDirty[path] = !!value;
  } else if (type === 'number') {
    _configDirty[path] = parseFloat(value) || 0;
  } else if (type === 'json') {
    try { _configDirty[path] = JSON.parse(value); } catch { _configDirty[path] = value; }
  } else {
    _configDirty[path] = value;
  }
  // Re-render to show dirty state
  renderConfigPage();
}

function configRawChange(text) {
  _configRawText = text;
  _configErrors = [];
  // Validate JSON
  try {
    JSON.parse(text);
  } catch (e) {
    _configErrors = ['JSON syntax error: ' + e.message];
  }
}

function applyDirtyToConfig() {
  const config = JSON.parse(JSON.stringify(_configData));
  for (const [path, value] of Object.entries(_configDirty)) {
    const parts = path.split('.');
    let obj = config;
    for (let i = 0; i < parts.length - 1; i++) {
      if (obj[parts[i]] === undefined) obj[parts[i]] = {};
      obj = obj[parts[i]];
    }
    obj[parts[parts.length - 1]] = value;
  }
  return config;
}

async function configSave() {
  if (_configSaving) return;
  _configSaving = true;
  _configErrors = [];
  renderConfigPage();

  try {
    let configToSave;
    if (_configMode === 'raw') {
      try {
        configToSave = JSON.parse(_configRawText);
      } catch (e) {
        _configErrors = ['Invalid JSON: ' + e.message];
        renderConfigPage();
        return;
      }
    } else {
      configToSave = applyDirtyToConfig();
    }

    await Bridge.setConfig({ config: configToSave });
    _configData = configToSave;
    _configDirty = {};
    _configRawText = JSON.stringify(configToSave, null, 2);
    toast('Config saved', 'success');
    renderConfigPage();
  } catch (e) {
    _configErrors = ['Save failed: ' + e.message];
    toast('Save failed: ' + e.message, 'error');
    renderConfigPage();
  } finally {
    _configSaving = false;
  }
}

async function configApply() {
  if (_configSaving) return;
  _configSaving = true;
  _configErrors = [];
  renderConfigPage();

  try {
    let configToApply;
    if (_configMode === 'raw') {
      try {
        configToApply = JSON.parse(_configRawText);
      } catch (e) {
        _configErrors = ['Invalid JSON: ' + e.message];
        renderConfigPage();
        return;
      }
    } else {
      configToApply = applyDirtyToConfig();
    }

    await Bridge.applyConfig({ config: configToApply });
    _configData = configToApply;
    _configDirty = {};
    _configRawText = JSON.stringify(configToApply, null, 2);
    toast('Config applied — gateway restarting', 'success');
    renderConfigPage();
  } catch (e) {
    _configErrors = ['Apply failed: ' + e.message];
    toast('Apply failed: ' + e.message, 'error');
    renderConfigPage();
  } finally {
    _configSaving = false;
  }
}
