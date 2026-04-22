// ═══════════════════════════════════════════════════════════
// Agent OS v8 — Wiki View
// Connects to bridge /api/wiki/* endpoints
// Full wiki mirror: http://localhost:8090 (Quartz)
// ═══════════════════════════════════════════════════════════
import { html, nothing, type TemplateResult } from "lit";
import type { AgentOSApp } from "../app.ts";

const QUARTZ_URL = "http://localhost:8090";

function renderSkeleton(count = 3): TemplateResult {
  return html`${Array.from({ length: count }, () => html`<div class="skeleton skeleton-card"></div>`)}`;
}

/** Simple markdown → safe HTML (inline only — headings, bold, italic, code, links) */
function renderMarkdown(content: string): TemplateResult {
  // Use a <pre> with light processing: just show as preformatted text for safety
  // Could plug in a real md renderer if added as dependency later
  return html`<pre style="white-space:pre-wrap;word-break:break-word;font-family:inherit;font-size:13px;line-height:1.7;margin:0">${content}</pre>`;
}

// ── Wiki Home Sub-View ───────────────────────────────
function renderWikiHome(app: AgentOSApp): TemplateResult {
  const stats = app.wikiStats;
  return html`
    <div>
      <!-- Search Bar -->
      <div class="search-bar" style="margin-bottom:24px">
        <span class="search-icon">🔍</span>
        <input
          placeholder="Search wiki pages..."
          .value=${app.wikiSearchQuery}
          @input=${(e: Event) => { app.wikiSearchQuery = (e.target as HTMLInputElement).value; }}
          @keydown=${(e: KeyboardEvent) => {
            if (e.key === "Enter") app.wikiSearch(app.wikiSearchQuery);
          }}
          style="font-size:15px"
        >
        <button
          class="btn btn-primary btn-sm"
          @click=${() => app.wikiSearch(app.wikiSearchQuery)}
          style="flex-shrink:0"
        >Search</button>
      </div>

      <!-- Stats Cards -->
      ${stats ? html`
        <div class="stats-row" style="margin-bottom:24px">
          <div class="stat-card">
            <span class="stat-value">${stats.total_pages}</span>
            <span class="stat-label">📄 Total Pages</span>
          </div>
          ${stats.by_type.slice(0, 3).map(t => html`
            <div class="stat-card">
              <span class="stat-value">${t.count}</span>
              <span class="stat-label">${t.type}</span>
            </div>
          `)}
          <div class="stat-card" style="cursor:pointer" @click=${() => window.open(QUARTZ_URL, "_blank")}>
            <span class="stat-value">↗</span>
            <span class="stat-label">📚 Open Wiki</span>
          </div>
        </div>

        <!-- Type Breakdown -->
        ${stats.by_type.length > 0 ? html`
          <div class="section-header" style="margin-bottom:12px">
            <span class="section-icon">🗂️</span>
            <span class="section-title">By Type</span>
          </div>
          <div class="flex gap-8" style="flex-wrap:wrap;margin-bottom:24px">
            ${stats.by_type.map(t => html`
              <span class="chip" @click=${() => app.wikiSearch(t.type)} style="cursor:pointer">
                ${t.type}
                <span class="chip-count">${t.count}</span>
              </span>
            `)}
          </div>
        ` : nothing}

        <!-- Spaces -->
        ${stats.spaces?.length > 0 ? html`
          <div class="section-header" style="margin-bottom:12px">
            <span class="section-icon">📁</span>
            <span class="section-title">Spaces</span>
          </div>
          <div class="flex gap-8" style="flex-wrap:wrap;margin-bottom:24px">
            ${stats.spaces.map(s => html`
              <span class="chip" @click=${() => app.wikiSearch(s)} style="cursor:pointer">${s}</span>
            `)}
          </div>
        ` : nothing}
      ` : html`
        <div class="empty-state">
          <div class="empty-state-icon">📚</div>
          <div class="empty-state-title">Wiki</div>
          <div class="empty-state-subtitle">Stats will appear once the bridge connects. Use the search bar to explore.</div>
        </div>
      `}

      <!-- External Link -->
      <div class="card" style="margin-top:8px;border:1px dashed var(--border)">
        <div class="flex items-center gap-12">
          <span style="font-size:24px">🌐</span>
          <div class="flex-1">
            <div class="font-medium">Full Wiki Mirror</div>
            <div class="text-xs text-muted">Browse the complete Quartz-rendered wiki</div>
          </div>
          <button class="btn btn-secondary btn-sm" @click=${() => window.open(QUARTZ_URL, "_blank")}>
            Open ↗
          </button>
        </div>
      </div>
    </div>
  `;
}

// ── Wiki Search Results Sub-View ─────────────────────
function renderWikiSearch(app: AgentOSApp): TemplateResult {
  return html`
    <div>
      <!-- Search Bar (compact repeat) -->
      <div class="search-bar" style="margin-bottom:16px">
        <span class="search-icon">🔍</span>
        <input
          .value=${app.wikiSearchQuery}
          @input=${(e: Event) => { app.wikiSearchQuery = (e.target as HTMLInputElement).value; }}
          @keydown=${(e: KeyboardEvent) => {
            if (e.key === "Enter") app.wikiSearch(app.wikiSearchQuery);
          }}
        >
        <button class="btn btn-primary btn-sm" @click=${() => app.wikiSearch(app.wikiSearchQuery)} style="flex-shrink:0">Search</button>
        <button class="btn btn-secondary btn-sm" @click=${() => { app.wikiView = 'home'; }} style="flex-shrink:0">← Home</button>
      </div>

      <!-- Results -->
      ${app.wikiLoading ? renderSkeleton(5) :
        app.wikiSearchResults.length === 0 ? html`
          <div class="empty-state">
            <div class="empty-state-icon">🔍</div>
            <div class="empty-state-title">No results</div>
            <div class="empty-state-subtitle">Try a different query or search the <a href="${QUARTZ_URL}" target="_blank" style="color:var(--accent)">full wiki</a></div>
          </div>
        ` : html`
          <div class="text-xs text-muted" style="margin-bottom:12px">${app.wikiSearchResults.length} results for "${app.wikiSearchQuery}"</div>
          <div class="flex-col gap-8">
            ${app.wikiSearchResults.map(p => html`
              <div class="card card-clickable" @click=${() => app.wikiLoadPage(p.id)}>
                <div class="card-header">
                  <div class="card-title">${p.title || p.path}</div>
                  <div class="flex gap-4">
                    <span class="badge badge-blue">${p.type}</span>
                    ${p.status ? html`<span class="badge badge-muted">${p.status}</span>` : nothing}
                  </div>
                </div>
                ${p.summary ? html`<div class="text-sm text-muted" style="margin-top:4px">${p.summary.substring(0, 200)}</div>` : nothing}
                <div class="flex items-center gap-8 text-xs text-muted" style="margin-top:8px">
                  <span>📄 ${p.path}</span>
                  ${p.project ? html`<span>📁 ${p.project}</span>` : nothing}
                  <span>${p.word_count} words</span>
                  ${p.tags?.length ? html`<span>${p.tags.slice(0, 3).map(t => html`#${t} `)}</span>` : nothing}
                </div>
              </div>
            `)}
          </div>
        `}
    </div>
  `;
}

// ── Wiki Page Sub-View ───────────────────────────────
function renderWikiPage(app: AgentOSApp): TemplateResult {
  const page = app.wikiCurrentPage;
  if (app.wikiLoading && !page) return renderSkeleton(4);
  if (!page) return html`
    <div class="empty-state">
      <div class="empty-state-icon">📄</div>
      <div class="empty-state-title">Page not found</div>
    </div>
  `;

  return html`
    <div>
      <!-- Nav -->
      <div class="flex gap-8" style="margin-bottom:16px">
        <button class="btn btn-secondary btn-sm" @click=${() => { app.wikiView = 'home'; }}>← Home</button>
        <button class="btn btn-secondary btn-sm" @click=${() => window.open(`${QUARTZ_URL}/${page.path}`, "_blank")}>Open in Wiki ↗</button>
      </div>

      <!-- Page Header -->
      <div class="card" style="margin-bottom:16px">
        <div class="card-header" style="flex-wrap:wrap;gap:8px">
          <h2 style="font-size:20px;font-weight:700;margin:0">${page.title || page.path}</h2>
          <div class="flex gap-4">
            <span class="badge badge-blue">${page.type}</span>
            ${page.status ? html`<span class="badge badge-muted">${page.status}</span>` : nothing}
          </div>
        </div>

        <!-- Metadata -->
        <div class="flex gap-16 text-xs text-muted" style="margin-top:8px;flex-wrap:wrap">
          ${page.project ? html`<span>📁 ${page.project}</span>` : nothing}
          <span>📄 ${page.path}</span>
          <span>📝 ${page.word_count} words</span>
          <span>🕒 ${new Date(page.updated_at).toLocaleDateString()}</span>
        </div>

        ${page.tags?.length ? html`
          <div class="flex gap-4" style="margin-top:8px;flex-wrap:wrap">
            ${page.tags.map(t => html`<span class="badge badge-muted">#${t}</span>`)}
          </div>
        ` : nothing}

        ${page.summary ? html`
          <div class="text-sm" style="margin-top:12px;padding-top:12px;border-top:1px solid var(--border);color:var(--text-muted)">
            ${page.summary}
          </div>
        ` : nothing}
      </div>

      <!-- Content -->
      <div class="card" style="margin-bottom:16px">
        <div class="section-header" style="margin-bottom:12px">
          <span class="section-icon">📄</span>
          <span class="section-title">Content</span>
        </div>
        ${(page as unknown as { content?: string }).content
          ? renderMarkdown((page as unknown as { content: string }).content)
          : html`<div class="text-sm text-muted">No content available. <a href="${QUARTZ_URL}/${page.path}" target="_blank" style="color:var(--accent)">Open in full wiki ↗</a></div>`
        }
      </div>

      <!-- Backlinks -->
      ${(page as unknown as { backlinks?: string[] }).backlinks?.length ? html`
        <div class="card">
          <div class="section-header" style="margin-bottom:8px">
            <span class="section-icon">🔗</span>
            <span class="section-title">Backlinks</span>
          </div>
          <div class="flex gap-4" style="flex-wrap:wrap">
            ${((page as unknown as { backlinks: string[] }).backlinks).map(b => html`
              <span class="badge badge-blue" style="cursor:pointer" @click=${() => app.wikiLoadPage(b)}>${b}</span>
            `)}
          </div>
        </div>
      ` : nothing}
    </div>
  `;
}

// ── Main Wiki View Export ────────────────────────────
export function renderWikiView(app: AgentOSApp): TemplateResult {
  return html`
    <div class="view">
      <div class="page-header">
        <div>
          <h2>📚 Wiki</h2>
          <span class="page-subtitle">Knowledge base · ${app.wikiStats ? `${app.wikiStats.total_pages} pages` : 'Loading...'}</span>
        </div>
        <button class="btn btn-secondary btn-sm" @click=${() => window.open(QUARTZ_URL, "_blank")}>
          🌐 Open Full Wiki ↗
        </button>
      </div>

      ${app.wikiView === 'home' ? renderWikiHome(app)
        : app.wikiView === 'search' ? renderWikiSearch(app)
        : app.wikiView === 'page' ? renderWikiPage(app)
        : renderWikiHome(app)}
    </div>
  `;
}
