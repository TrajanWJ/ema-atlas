// ==UserScript==
// @name         PropStream Lead Extractor v1
// @namespace    openclaw/real-estate
// @version      0.1.0
// @description  Extract visible lead rows from PropStream pages into CSV/JSON for real estate workflows.
// @match        *://*.propstream.com/*
// @grant        GM_download
// @grant        GM_setClipboard
// @grant        GM_addStyle
// ==/UserScript==

(function () {
  'use strict';

  const CONFIG = {
    appName: 'PropStream Lead Extractor v1',
    filePrefix: 'propstream-leads',
    selectors: {
      // TODO: replace with actual PropStream selectors once page structure is confirmed
      candidateRows: [
        'table tbody tr',
        '[role="row"]',
        '.results-table tbody tr',
        '.property-row',
        '.result-row',
        '.search-results-row',
        '.property-card'
      ],
      candidateCells: ['td', '[role="cell"]', '.cell', '.property-cell', '.card-field'],
      nextButton: [
        'button[aria-label*="Next"]',
        'a[aria-label*="Next"]',
        '.pagination-next',
        '.next-page'
      ]
    }
  };

  function nowStamp() {
    return new Date().toISOString().replace(/[:.]/g, '-');
  }

  function uniq(arr) {
    return Array.from(new Set(arr.filter(Boolean)));
  }

  function text(el) {
    return (el?.innerText || el?.textContent || '').replace(/\s+/g, ' ').trim();
  }

  function queryFirst(selectors, root = document) {
    for (const sel of selectors) {
      const found = root.querySelector(sel);
      if (found) return found;
    }
    return null;
  }

  function queryAll(selectors, root = document) {
    const found = [];
    for (const sel of selectors) {
      root.querySelectorAll(sel).forEach((el) => found.push(el));
    }
    return uniq(found);
  }

  function normalizeRecord(raw, index) {
    return {
      lead_id: `${location.hostname}-${Date.now()}-${index + 1}`,
      source: 'propstream',
      source_batch: document.title || 'propstream-export',
      source_url: location.href,
      extracted_at: new Date().toISOString(),
      property_address: raw.property_address || raw.address || '',
      city: raw.city || '',
      state: raw.state || '',
      zip: raw.zip || '',
      owner_name: raw.owner_name || '',
      mailing_address: raw.mailing_address || '',
      property_type: raw.property_type || '',
      occupancy_status: raw.occupancy_status || '',
      equity_band: raw.equity_band || '',
      estimated_value: raw.estimated_value || '',
      distress_flags: raw.distress_flags || '',
      phone: raw.phone || '',
      email: raw.email || '',
      notes_raw: raw.notes_raw || '',
      raw_cells: raw.raw_cells || []
    };
  }

  function extractFromRow(row, index) {
    const rawText = text(row);
    const cells = queryAll(CONFIG.selectors.candidateCells, row).map(text).filter(Boolean);

    // Generic placeholders until exact PropStream DOM is known.
    // For now, store raw visible text plus heuristic guesses.
    const raw = {
      property_address: cells[0] || '',
      owner_name: cells[1] || '',
      mailing_address: cells[2] || '',
      property_type: cells[3] || '',
      estimated_value: cells.find((c) => /\$/.test(c)) || '',
      notes_raw: rawText,
      raw_cells: cells
    };

    return normalizeRecord(raw, index);
  }

  function collectRows() {
    const rows = queryAll(CONFIG.selectors.candidateRows);
    return rows.filter((row) => text(row).length > 0);
  }

  function extractVisibleLeads() {
    const rows = collectRows();
    return rows.map((row, index) => extractFromRow(row, index));
  }

  function toCsv(records) {
    if (!records.length) return '';
    const headers = uniq(records.flatMap((r) => Object.keys(r)));
    const esc = (v) => {
      const s = Array.isArray(v) ? JSON.stringify(v) : String(v ?? '');
      return '"' + s.replace(/"/g, '""') + '"';
    };
    return [
      headers.join(','),
      ...records.map((r) => headers.map((h) => esc(r[h])).join(','))
    ].join('\n');
  }

  function downloadText(filename, content, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    GM_download({ url, name: filename, saveAs: true, ontimeout: () => URL.revokeObjectURL(url), onload: () => URL.revokeObjectURL(url) });
  }

  function exportJson() {
    const records = extractVisibleLeads();
    downloadText(`${CONFIG.filePrefix}-${nowStamp()}.json`, JSON.stringify(records, null, 2), 'application/json');
    flash(`Exported ${records.length} visible leads as JSON`);
  }

  function exportCsv() {
    const records = extractVisibleLeads();
    downloadText(`${CONFIG.filePrefix}-${nowStamp()}.csv`, toCsv(records), 'text/csv');
    flash(`Exported ${records.length} visible leads as CSV`);
  }

  function copyJson() {
    const records = extractVisibleLeads();
    GM_setClipboard(JSON.stringify(records, null, 2));
    flash(`Copied ${records.length} visible leads as JSON`);
  }

  function inspectPage() {
    const rows = collectRows();
    const sample = rows.slice(0, 3).map((row, i) => ({
      index: i,
      text: text(row),
      html: row.outerHTML.slice(0, 4000)
    }));
    console.log('[PropStream Extractor] Sample rows:', sample);
    GM_setClipboard(JSON.stringify(sample, null, 2));
    flash(`Copied ${sample.length} sample rows to clipboard for selector tuning`);
  }

  function flash(message) {
    const el = document.createElement('div');
    el.className = 'psx-flash';
    el.textContent = message;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 2200);
  }

  function makeButton(label, onClick) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = label;
    btn.className = 'psx-btn';
    btn.addEventListener('click', onClick);
    return btn;
  }

  function mountPanel() {
    if (document.getElementById('psx-panel')) return;

    const panel = document.createElement('div');
    panel.id = 'psx-panel';

    const title = document.createElement('div');
    title.className = 'psx-title';
    title.textContent = CONFIG.appName;

    const count = document.createElement('div');
    count.className = 'psx-count';
    count.textContent = `Detected rows: ${collectRows().length}`;

    const refresh = () => {
      count.textContent = `Detected rows: ${collectRows().length}`;
    };

    panel.append(
      title,
      count,
      makeButton('Refresh Count', refresh),
      makeButton('Inspect Sample Rows', inspectPage),
      makeButton('Export CSV', exportCsv),
      makeButton('Export JSON', exportJson),
      makeButton('Copy JSON', copyJson)
    );

    document.body.appendChild(panel);
    setInterval(refresh, 3000);
  }

  GM_addStyle(`
    #psx-panel {
      position: fixed;
      top: 14px;
      right: 14px;
      z-index: 999999;
      width: 250px;
      background: #111827;
      color: #fff;
      border: 1px solid #374151;
      border-radius: 12px;
      padding: 12px;
      box-shadow: 0 10px 25px rgba(0,0,0,0.35);
      font-family: Inter, system-ui, sans-serif;
    }
    .psx-title {
      font-weight: 700;
      margin-bottom: 8px;
    }
    .psx-count {
      font-size: 12px;
      color: #cbd5e1;
      margin-bottom: 10px;
    }
    .psx-btn {
      width: 100%;
      margin: 6px 0;
      padding: 8px 10px;
      border-radius: 8px;
      border: 1px solid #4b5563;
      background: #1f2937;
      color: #fff;
      cursor: pointer;
    }
    .psx-btn:hover {
      background: #374151;
    }
    .psx-flash {
      position: fixed;
      bottom: 18px;
      right: 18px;
      z-index: 999999;
      background: #111827;
      color: #fff;
      border: 1px solid #374151;
      border-radius: 10px;
      padding: 10px 12px;
      box-shadow: 0 10px 25px rgba(0,0,0,0.35);
      font-family: Inter, system-ui, sans-serif;
    }
  `);

  window.addEventListener('load', () => setTimeout(mountPanel, 1500));
})();
