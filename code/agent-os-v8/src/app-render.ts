// ═══════════════════════════════════════════════════════════
// Agent OS v8 — Main Render Function
// ═══════════════════════════════════════════════════════════
import { html, type TemplateResult, nothing } from "lit";
import type { AgentOSApp } from "./app.ts";
import type { Page } from "./types.ts";
import { agentEmoji } from "./utils.ts";
import { renderWikiView } from "./views/wiki.ts";

// ── Navigation config ────────────────────────────────
type NavItem = { page: Page; icon: string; label: string; badge?: () => string };
type NavGroup = { label: string; icon: string; items: NavItem[] };

function navGroups(app: AgentOSApp): NavGroup[] {
  const pendingProposals = app.proposals.filter(p => p.status === "pending").length;
  const activeAgents = app.agents.filter(a => a.status === "active").length;
  return [
    { label: "OPERATE", icon: "⚡", items: [
      { page: "feed", icon: "📡", label: "Stream" },
      { page: "inbox", icon: "📬", label: "Inbox", badge: () => app.inboxItems.filter(i => !i.read).length > 0 ? String(app.inboxItems.filter(i => !i.read).length) : "" },
      { page: "proposals", icon: "📋", label: "Proposals", badge: () => pendingProposals > 0 ? String(pendingProposals) : "" },
      { page: "briefing", icon: "📜", label: "Briefing" },
      { page: "workbench", icon: "👁️", label: "Workbench", badge: () => activeAgents > 0 ? String(activeAgents) : "" },
    ]},
    { label: "COMMUNICATE", icon: "💬", items: [
      { page: "talk", icon: "💬", label: "Talk" },
      { page: "rooms", icon: "🏠", label: "Rooms" },
    ]},
    { label: "DIRECT", icon: "🎯", items: [
      { page: "tasks", icon: "✅", label: "Tasks" },
      { page: "projects", icon: "📁", label: "Projects" },
      { page: "plans", icon: "📝", label: "Plans" },
      { page: "missions", icon: "🎯", label: "Missions" },
      { page: "pipelines", icon: "🔀", label: "Pipelines" },
    ]},
    { label: "KNOW", icon: "🧠", items: [
      { page: "mind", icon: "🧠", label: "Mind" },
      { page: "explore", icon: "📖", label: "Docs" },
      { page: "wiki", icon: "📚", label: "Wiki" },
    ]},
    { label: "CONFIGURE", icon: "⚙️", items: [
      { page: "roles", icon: "🛡️", label: "Roles" },
      { page: "records", icon: "📊", label: "Records" },
      { page: "system", icon: "⚙️", label: "System" },
      { page: "sessions", icon: "🔗", label: "Sessions" },
      { page: "config", icon: "🔧", label: "Config" },
      { page: "agent-workbench", icon: "🔧", label: "Agent Workbench" },
    ]},
  ];
}

// ── Page titles ──────────────────────────────────────
const PAGE_TITLES: Record<Page, string> = {
  feed: "Stream", inbox: "Inbox", proposals: "Proposals",
  briefing: "Briefing", workbench: "Workbench",
  talk: "Talk", rooms: "Rooms",
  tasks: "Tasks", projects: "Projects", plans: "Plans",
  missions: "Missions", pipelines: "Pipelines",
  mind: "Mind", explore: "Docs", wiki: "Wiki",
  roles: "Roles", records: "Records", system: "System",
  sessions: "Sessions", usage: "Usage", config: "Config",
  skills: "Skills", debug: "Debug",
  "agent-workbench": "Agent Workbench",
};

// ── Main render ──────────────────────────────────────
export function renderApp(app: AgentOSApp): TemplateResult {
  return html`
    <div class="app-shell">
      ${renderSidebar(app)}
      <div class="main-content">
        ${renderTopbar(app)}
        <div class="view-container">
          ${renderCurrentView(app)}
        </div>
      </div>
    </div>
    ${renderMobileBar(app)}
    ${renderToasts(app)}
    ${app.cmdPaletteOpen ? renderCommandPalette(app) : nothing}
  `;
}

// ── Sidebar ──────────────────────────────────────────
function renderSidebar(app: AgentOSApp): TemplateResult {
  const groups = navGroups(app);
  const activeCount = app.agents.filter(a => a.status === "active").length;
  return html`
    <nav class="sidebar ${app.sidebarOpen ? "open" : ""}">
      <div class="sidebar-logo">
        <span class="logo-icon">🤖</span>
        <span>Agent OS</span>
        <span class="logo-version">v8</span>
      </div>
      <div class="sidebar-nav">
        ${groups.map(g => html`
          <div class="nav-group">
            <div class="nav-group-label">${g.icon} ${g.label}</div>
            ${g.items.map(item => html`
              <a class="nav-item ${app.currentPage === item.page ? "active" : ""}"
                 @click=${() => app.navigate(item.page)}>
                <span class="nav-icon">${item.icon}</span>
                <span class="nav-label">${item.label}</span>
                <span class="nav-badge">${item.badge?.() ?? ""}</span>
              </a>
            `)}
          </div>
        `)}
      </div>
      <div class="sidebar-footer">
        <div class="sidebar-agents">
          <span class="agents-dot ${activeCount > 0 ? "active" : ""}"></span>
          <span>${activeCount} agent${activeCount !== 1 ? "s" : ""} active</span>
        </div>
        <span>Agent OS v8.0 · Built with 🤝</span>
      </div>
    </nav>
  `;
}

// ── Topbar ───────────────────────────────────────────
function renderTopbar(app: AgentOSApp): TemplateResult {
  const connClass = app.connectionStatus === "connected" ? "connected"
    : app.connectionStatus === "connecting" ? "connecting" : "disconnected";
  const connLabel = app.connectionStatus === "connected" ? "Live"
    : app.connectionStatus === "connecting" ? "Connecting..." : "Offline";
  return html`
    <header class="topbar">
      <div class="topbar-left">
        <button class="hamburger" @click=${() => { app.sidebarOpen = !app.sidebarOpen; }}>
          <span></span><span></span><span></span>
        </button>
        <h1 class="topbar-title">${PAGE_TITLES[app.currentPage] || app.currentPage}</h1>
      </div>
      <div class="topbar-center">
        <div class="omnibus-pill" @click=${() => { app.cmdPaletteOpen = true; }}>
          <span class="omnibus-icon">⌘</span>
          <span style="color:var(--text-faint);font-size:13px">Ask anything...</span>
          <span class="omnibus-shortcut">⌘K</span>
        </div>
      </div>
      <div class="topbar-right">
        <div class="conn-indicator">
          <span class="conn-dot ${connClass}"></span>
          <span>${connLabel}</span>
        </div>
        <button class="topbar-btn" @click=${() => app.navigate("system")}>⚙️</button>
      </div>
    </header>
  `;
}

// ── Mobile Bar ───────────────────────────────────────
function renderMobileBar(app: AgentOSApp): TemplateResult {
  const items: { page: Page; icon: string; label: string }[] = [
    { page: "feed", icon: "⚡", label: "Stream" },
    { page: "talk", icon: "💬", label: "Talk" },
    { page: "tasks", icon: "✅", label: "Tasks" },
    { page: "mind", icon: "🧠", label: "Mind" },
    { page: "system", icon: "⚙️", label: "More" },
  ];
  return html`
    <nav class="mobile-bar">
      ${items.map(i => html`
        <button class="mobile-nav-item ${app.currentPage === i.page ? "active" : ""}"
                @click=${() => app.navigate(i.page)}>
          <span class="mobile-icon">${i.icon}</span>
          <span>${i.label}</span>
        </button>
      `)}
    </nav>
  `;
}

// ── Toasts ───────────────────────────────────────────
function renderToasts(app: AgentOSApp): TemplateResult {
  return html`
    <div class="toast-container">
      ${app.toasts.map(t => html`
        <div class="toast toast-${t.type}">${t.message}</div>
      `)}
    </div>
  `;
}

// ── Command Palette ──────────────────────────────────
function renderCommandPalette(app: AgentOSApp): TemplateResult {
  const groups = navGroups(app);
  const allItems = groups.flatMap(g => g.items);
  return html`
    <div class="cmd-palette-overlay" @click=${(e: Event) => {
      if ((e.target as HTMLElement).classList.contains("cmd-palette-overlay")) app.cmdPaletteOpen = false;
    }}>
      <div class="cmd-palette">
        <div class="cmd-input-row">
          <span>🔍</span>
          <input class="cmd-input" placeholder="Search pages, agents, vault..."
                 autofocus
                 @keydown=${(e: KeyboardEvent) => {
                   if (e.key === "Escape") app.cmdPaletteOpen = false;
                 }}>
          <span style="font-size:11px;color:var(--text-faint)">esc to close</span>
        </div>
        <div class="cmd-results">
          ${allItems.map(item => html`
            <div class="cmd-result" @click=${() => { app.navigate(item.page); app.cmdPaletteOpen = false; }}>
              <span class="cmd-result-icon">${item.icon}</span>
              <span class="cmd-result-label">${item.label}</span>
              <span class="cmd-result-hint">page</span>
            </div>
          `)}
        </div>
      </div>
    </div>
  `;
}

// ── View Router ──────────────────────────────────────
function renderCurrentView(app: AgentOSApp): TemplateResult {
  switch (app.currentPage) {
    case "feed": return renderFeedView(app);
    case "inbox": return renderInboxView(app);
    case "proposals": return renderProposalsView(app);
    case "talk": return renderTalkView(app);
    case "tasks": return renderTasksView(app);
    case "projects": return renderProjectsView(app);
    case "missions": return renderMissionsView(app);
    case "plans": return renderPlansView(app);
    case "mind": return renderMindView(app);
    case "wiki": return renderWikiView(app);
    case "system": return renderSystemView(app);
    case "workbench": return renderWorkbenchView(app);
    case "agent-workbench": return renderAgentWorkbenchView(app);
    default: return renderPlaceholderView(app);
  }
}

// ═══════════════════════════════════════════════════════════
// Inline Views (will be split to files later)
// ═══════════════════════════════════════════════════════════

function renderSkeleton(count = 4): TemplateResult {
  return html`${Array.from({ length: count }, () => html`<div class="skeleton skeleton-card"></div>`)}`;
}

// ── Feed View ────────────────────────────────────────
function renderFeedView(app: AgentOSApp): TemplateResult {
  const filters = ["all", "action", "completed", "errors", "vault", "insights"];
  const events = app.feedFilter === "all" ? app.feedEvents
    : app.feedEvents.filter(e => {
        if (app.feedFilter === "action") return e.urgent || e.type === "proposal" || e.type === "error";
        if (app.feedFilter === "completed") return e.type?.includes("complete") || e.type?.includes("done");
        if (app.feedFilter === "errors") return e.type?.includes("error") || e.type?.includes("fail");
        if (app.feedFilter === "vault") return e.type?.includes("vault");
        if (app.feedFilter === "insights") return e.type?.includes("insight");
        return true;
      });

  return html`
    <div class="view">
      <!-- Agent Status Bar -->
      <div class="flex gap-8" style="margin-bottom:16px;overflow-x:auto">
        ${app.agents.filter(a => a.status === "active").map(a => html`
          <div class="card" style="min-width:200px;padding:10px 14px;flex-shrink:0">
            <div class="flex items-center gap-8">
              <span class="agent-avatar agent-avatar-sm">${agentEmoji(a.id)}</span>
              <div>
                <div class="font-medium text-sm">${a.name || a.id}</div>
                <div class="text-xs text-muted truncate" style="max-width:150px">${a.current_task?.description || "Working..."}</div>
              </div>
            </div>
          </div>
        `)}
      </div>

      <!-- Quick Stats -->
      <div class="stats-row" style="margin-bottom:16px">
        <div class="stat-card" @click=${() => { app.feedFilter = "action"; }}>
          <span class="stat-value">${app.agents.filter(a => a.status === "active").length}</span>
          <span class="stat-label">⚡ Active</span>
        </div>
        <div class="stat-card" @click=${() => { app.feedFilter = "completed"; }}>
          <span class="stat-value">${app.feedEvents.filter(e => e.type?.includes("complete")).length}</span>
          <span class="stat-label">✅ Done Today</span>
        </div>
        <div class="stat-card" @click=${() => app.navigate("proposals")}>
          <span class="stat-value">${app.proposals.filter(p => p.status === "pending").length}</span>
          <span class="stat-label">📋 Proposals</span>
        </div>
        <div class="stat-card" @click=${() => { app.feedFilter = "errors"; }}>
          <span class="stat-value">${app.feedEvents.filter(e => e.type?.includes("error")).length}</span>
          <span class="stat-label">🔴 Errors</span>
        </div>
      </div>

      <!-- Filter Chips -->
      <div class="chip-bar">
        ${filters.map(f => html`
          <button class="chip ${app.feedFilter === f ? "active" : ""}"
                  @click=${() => { app.feedFilter = f; }}>
            ${f === "all" ? "All" : f === "action" ? "🔴 Needs Action" : f === "completed" ? "✅ Completed" : f === "errors" ? "⚠️ Errors" : f === "vault" ? "📚 Vault" : "💡 Insights"}
          </button>
        `)}
      </div>

      <!-- Feed List -->
      ${app.feedLoading ? renderSkeleton() : events.length === 0 ? html`
        <div class="empty-state">
          <div class="empty-state-icon">📡</div>
          <div class="empty-state-title">No events</div>
          <div class="empty-state-subtitle">Activity will appear here as agents work</div>
        </div>
      ` : html`
        <div class="flex-col gap-8">
          ${events.map(e => html`
            <div class="card ${e.urgent ? "card-clickable" : ""}" style="${e.urgent ? "border-color:var(--red)" : ""}">
              <div class="flex items-center gap-8">
                <span class="agent-avatar agent-avatar-sm">${agentEmoji(e.agent)}</span>
                <div class="flex-1">
                  <div class="text-sm">${e.content}</div>
                  <div class="text-xs text-muted">${e.time || e.timestamp}</div>
                </div>
                ${e._chain?.task ? html`<span class="badge badge-muted text-xs">${e._chain.task.description?.substring(0, 30)}</span>` : nothing}
              </div>
            </div>
          `)}
        </div>
      `}
    </div>
  `;
}

// ── Inbox View ───────────────────────────────────────
function renderInboxView(app: AgentOSApp): TemplateResult {
  return html`
    <div class="view">
      <div class="page-header">
        <div><h2>📬 Inbox</h2><span class="page-subtitle">Unified stream of all activity</span></div>
      </div>
      ${app.inboxLoading ? renderSkeleton(6) : app.inboxItems.length === 0 ? html`
        <div class="empty-state">
          <div class="empty-state-icon">📬</div>
          <div class="empty-state-title">Inbox zero!</div>
          <div class="empty-state-subtitle">Nothing needs your attention right now</div>
        </div>
      ` : html`
        <div class="flex-col gap-8">
          ${app.inboxItems.map(item => html`
            <div class="card card-clickable" style="${!item.read ? "border-left:3px solid var(--accent)" : ""}">
              <div class="flex items-center gap-12">
                <span class="agent-avatar agent-avatar-sm">${agentEmoji(item.agent)}</span>
                <div class="flex-1">
                  <div class="font-medium text-sm">${item.title}</div>
                  <div class="text-xs text-muted">${item.detail?.substring(0, 100) || ""}</div>
                </div>
                <div class="flex-col items-center gap-4" style="align-items:flex-end">
                  <span class="text-xs text-muted">${item.time}</span>
                  ${item.priority ? html`<span class="badge badge-${item.priority === "P0" || item.priority === "P1" ? "red" : item.priority === "P2" ? "yellow" : "muted"}">${item.priority}</span>` : nothing}
                </div>
              </div>
            </div>
          `)}
        </div>
      `}
    </div>
  `;
}

// ── Proposals View ───────────────────────────────────
function renderProposalsView(app: AgentOSApp): TemplateResult {
  const filters = ["all", "pending", "approved", "dismissed"];
  const filtered = app.proposalFilter === "all" ? app.proposals
    : app.proposals.filter(p => p.status === app.proposalFilter);
  return html`
    <div class="view">
      <div class="page-header">
        <div><h2>📋 Proposals</h2><span class="page-subtitle">${app.proposals.filter(p => p.status === "pending").length} pending</span></div>
        <button class="btn btn-primary" @click=${() => app.showToast("Scan triggered", "info")}>⚡ Run Scan</button>
      </div>
      <div class="chip-bar">
        ${filters.map(f => html`
          <button class="chip ${app.proposalFilter === f ? "active" : ""}" @click=${() => { app.proposalFilter = f; }}>
            ${f.charAt(0).toUpperCase() + f.slice(1)}
            <span class="chip-count">${f === "all" ? app.proposals.length : app.proposals.filter(p => p.status === f).length}</span>
          </button>
        `)}
      </div>
      ${app.proposalsLoading ? renderSkeleton(4) : filtered.length === 0 ? html`
        <div class="empty-state">
          <div class="empty-state-icon">🎯</div>
          <div class="empty-state-title">All clear</div>
        </div>
      ` : html`
        <div class="flex-col gap-8">
          ${filtered.map(p => html`
            <div class="card">
              <div class="card-header">
                <div class="flex items-center gap-8">
                  <span class="priority-dot" style="background:${p.priority === "P1" ? "var(--red)" : p.priority === "P2" ? "var(--yellow)" : "var(--green)"}"></span>
                  <span class="card-title">${p.title}</span>
                </div>
                <span class="badge ${p.status === "pending" ? "badge-yellow" : p.status === "approved" ? "badge-green" : "badge-muted"}">${p.status}</span>
              </div>
              ${p.body ? html`<div class="card-body">${p.body.substring(0, 200)}</div>` : nothing}
              ${p.status === "pending" ? html`
                <div class="card-footer">
                  <button class="btn btn-sm btn-primary" @click=${async () => {
                    try { await app.client?.request("proposals.resolve", { id: p.id, action: "approve" }); app.showToast("Approved!", "success"); app.loadProposals(); } catch (e) { app.showToast(String(e), "error"); }
                  }}>✅ Approve</button>
                  <button class="btn btn-sm btn-secondary" @click=${async () => {
                    try { await app.client?.request("proposals.resolve", { id: p.id, action: "dismiss" }); app.loadProposals(); } catch (e) { app.showToast(String(e), "error"); }
                  }}>❌ Dismiss</button>
                  ${p.confidence != null ? html`<span class="text-xs text-muted" style="margin-left:auto">${Math.round(p.confidence * 100)}% confidence</span>` : nothing}
                </div>
              ` : nothing}
            </div>
          `)}
        </div>
      `}
    </div>
  `;
}

// ── Talk View ────────────────────────────────────────
function renderTalkView(app: AgentOSApp): TemplateResult {
  const currentChannel = app.channels.flatMap(c => c.channels).find(c => c.id === app.currentChannelId);
  return html`
    <div class="view" style="display:flex;height:calc(100vh - var(--topbar-height) - 40px);gap:0;padding:0">
      <!-- Channel List -->
      <div style="width:220px;border-right:1px solid var(--border);overflow-y:auto;background:var(--bg-secondary);padding:8px 0">
        ${app.channels.map(cat => html`
          <div class="nav-group-label" style="padding:12px 14px 4px">${cat.name}</div>
          ${cat.channels.map(ch => html`
            <a class="nav-item ${ch.id === app.currentChannelId ? "active" : ""}"
               style="padding:5px 14px;font-size:13px"
               @click=${() => app.switchChannel(ch.id)}>
              <span style="color:var(--text-faint)">#</span>
              <span>${ch.name}</span>
            </a>
          `)}
        `)}
      </div>
      <!-- Messages -->
      <div style="flex:1;display:flex;flex-direction:column;min-width:0">
        <div style="padding:12px 16px;border-bottom:1px solid var(--border);font-weight:600">
          # ${currentChannel?.name || "Select a channel"}
          ${currentChannel?.topic ? html`<span class="text-xs text-muted" style="margin-left:12px">${currentChannel.topic}</span>` : nothing}
        </div>
        <div style="flex:1;overflow-y:auto;padding:16px" id="chat-messages">
          ${app.chatLoading ? html`<div style="text-align:center;padding:40px;color:var(--text-muted)">Loading messages...</div>` :
            app.chatMessages.length === 0 ? html`<div style="text-align:center;padding:40px;color:var(--text-muted)">No messages yet</div>` :
            app.chatMessages.map(msg => html`
              <div class="flex gap-12" style="margin-bottom:16px">
                <span class="agent-avatar agent-avatar-sm">
                  ${msg.author?.avatar ? html`<img src="https://cdn.discordapp.com/avatars/${msg.author.id}/${msg.author.avatar}.png?size=32" style="width:32px;height:32px;border-radius:50%">` : agentEmoji(msg.author?.bot ? "righthand" : "user")}
                </span>
                <div class="flex-1">
                  <div class="flex items-center gap-8">
                    <span class="font-semibold text-sm" style="color:${msg.author?.bot ? "var(--accent)" : "var(--text-primary)"}">${msg.author?.display_name || msg.author?.username || "Unknown"}</span>
                    <span class="text-xs text-muted">${new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                  </div>
                  <div class="text-sm" style="margin-top:2px;white-space:pre-wrap;word-break:break-word">${msg.content}</div>
                  ${msg.reactions?.length ? html`
                    <div class="flex gap-4" style="margin-top:4px">
                      ${msg.reactions.map(r => html`<span class="badge badge-muted">${r.emoji} ${r.count}</span>`)}
                    </div>
                  ` : nothing}
                </div>
              </div>
            `)}
        </div>
        <!-- Input -->
        <div style="padding:12px 16px;border-top:1px solid var(--border);display:flex;gap:8px;align-items:center">
          <input style="flex:1" placeholder="Message #${currentChannel?.name || "channel"}..."
                 .value=${app.chatInput}
                 @input=${(e: Event) => { app.chatInput = (e.target as HTMLInputElement).value; }}
                 @keydown=${(e: KeyboardEvent) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); app.sendChatMessage(); } }}>
          <button class="btn btn-primary btn-sm" @click=${() => app.sendChatMessage()}>Send</button>
        </div>
      </div>
    </div>
  `;
}

// ── Tasks View ───────────────────────────────────────
function renderTasksView(app: AgentOSApp): TemplateResult {
  const filters = ["all", "active", "queued", "done", "failed"];
  const filtered = app.taskFilter === "all" ? app.tasks : app.tasks.filter(t => t.status === app.taskFilter);
  return html`
    <div class="view">
      <div class="page-header">
        <div><h2>✅ Tasks</h2><span class="page-subtitle">${app.tasks.length} total</span></div>
        <button class="btn btn-primary">➕ New Task</button>
      </div>
      <div class="chip-bar">
        ${filters.map(f => html`
          <button class="chip ${app.taskFilter === f ? "active" : ""}" @click=${() => { app.taskFilter = f; }}>
            ${f.charAt(0).toUpperCase() + f.slice(1)}
            <span class="chip-count">${f === "all" ? app.tasks.length : app.tasks.filter(t => t.status === f).length}</span>
          </button>
        `)}
      </div>
      ${app.tasksLoading ? renderSkeleton(5) : filtered.length === 0 ? html`
        <div class="empty-state"><div class="empty-state-icon">📋</div><div class="empty-state-title">No tasks</div></div>
      ` : html`
        <table class="data-table">
          <thead><tr>
            <th>Task</th><th>Agent</th><th>Priority</th><th>Status</th><th>Created</th>
          </tr></thead>
          <tbody>
            ${filtered.map(t => html`
              <tr class="clickable">
                <td><div class="font-medium">${t.title || t.description?.substring(0, 60) || t.id}</div></td>
                <td><span class="flex items-center gap-4">${agentEmoji(t.agent || "system")} ${t.agent || "—"}</span></td>
                <td><span class="badge ${t.priority === "P1" || t.priority === "1" ? "badge-red" : t.priority === "P2" || t.priority === "2" ? "badge-yellow" : "badge-muted"}">${t.priority || "—"}</span></td>
                <td><span class="badge ${t.status === "active" ? "badge-green" : t.status === "queued" ? "badge-yellow" : t.status === "done" ? "badge-blue" : t.status === "failed" ? "badge-red" : "badge-muted"}">${t.status}</span></td>
                <td class="text-xs text-muted">${t.created_at ? new Date(t.created_at).toLocaleDateString() : "—"}</td>
              </tr>
            `)}
          </tbody>
        </table>
      `}
    </div>
  `;
}

// ── Projects View ────────────────────────────────────
// Cache for wiki page counts per project { [projectName]: count }
const _wikiProjectCounts: Record<string, number> = {};

async function fetchWikiProjectCount(app: AgentOSApp, projectName: string): Promise<void> {
  if (projectName in _wikiProjectCounts) return;
  _wikiProjectCounts[projectName] = -1; // sentinel: fetching
  try {
    const bridgeUrl = (app as unknown as { _bridgeUrl: string })._bridgeUrl || "http://192.168.122.10:18790";
    const res = await fetch(`${bridgeUrl}/api/wiki/pages?project=${encodeURIComponent(projectName)}&limit=1`);
    if (res.ok) {
      const data = await res.json();
      // Accept both array (count = length) and { total, pages } shape
      const total = typeof data?.total === "number" ? data.total
        : Array.isArray(data) ? data.length
        : Array.isArray(data?.pages) ? (data.total ?? data.pages.length)
        : 0;
      _wikiProjectCounts[projectName] = total;
    } else {
      _wikiProjectCounts[projectName] = 0;
    }
  } catch {
    _wikiProjectCounts[projectName] = 0;
  }
  // Trigger re-render
  app.requestUpdate?.();
}

function renderProjectsView(app: AgentOSApp): TemplateResult {
  return html`
    <div class="view">
      <div class="page-header"><div><h2>📁 Projects</h2></div></div>
      ${app.projectsLoading ? renderSkeleton(3) : app.projects.length === 0 ? html`
        <div class="empty-state"><div class="empty-state-icon">📁</div><div class="empty-state-title">No projects</div></div>
      ` : html`
        <div class="grid-3">
          ${app.projects.map(p => {
            // Kick off fetch (no-op if already fetched)
            const wikiCount = _wikiProjectCounts[p.name];
            if (wikiCount === undefined) fetchWikiProjectCount(app, p.name);
            return html`
              <div class="card card-clickable">
                <div class="card-title">${p.name}</div>
                <div class="card-subtitle">${p.description || ""}</div>
                <div class="card-footer">
                  <span class="badge ${p.status === "active" ? "badge-green" : "badge-muted"}">${p.status}</span>
                  <span class="text-xs text-muted">${p.tasks_active} active · ${p.tasks_done} done</span>
                  ${wikiCount != null && wikiCount >= 0 ? html`
                    <span class="badge badge-blue" style="cursor:pointer" title="Wiki pages" @click=${(e: Event) => {
                      e.stopPropagation();
                      app.wikiSearchQuery = p.name;
                      app.wikiSearch(p.name);
                      app.navigate("wiki" as import("./types.ts").Page);
                    }}>📚 ${wikiCount > 0 ? `${wikiCount} wiki` : "wiki"}</span>
                  ` : nothing}
                </div>
              </div>
            `;
          })}
        </div>
      `}
    </div>
  `;
}

// ── Missions View ────────────────────────────────────
function renderMissionsView(app: AgentOSApp): TemplateResult {
  return html`
    <div class="view">
      <div class="page-header"><div><h2>🎯 Missions</h2></div></div>
      ${app.missionsLoading ? renderSkeleton(3) : app.missions.length === 0 ? html`
        <div class="empty-state"><div class="empty-state-icon">🎯</div><div class="empty-state-title">No missions</div></div>
      ` : html`
        <div class="flex-col gap-12">
          ${app.missions.map(m => html`
            <div class="card">
              <div class="card-header">
                <div class="flex items-center gap-8">
                  <span style="font-size:24px">${m.icon}</span>
                  <div>
                    <div class="card-title">${m.title}</div>
                    <div class="card-subtitle">${m.desc}</div>
                  </div>
                </div>
                <span class="badge ${m.status === "active" ? "badge-green" : m.status === "completed" ? "badge-blue" : "badge-yellow"}">${m.status}</span>
              </div>
              <div class="progress-bar" style="margin:8px 0"><div class="progress-fill" style="width:${m.progress}%"></div></div>
              <div class="flex items-center gap-16 text-xs text-muted">
                <span>${m.tasks_done}/${m.tasks_total} tasks</span>
                <span>${m.agents_active} agents</span>
                <span>${m.days_active}d active</span>
                <span>${m.velocity}/day velocity</span>
              </div>
            </div>
          `)}
        </div>
      `}
    </div>
  `;
}

// ── Plans View ───────────────────────────────────────
function renderPlansView(app: AgentOSApp): TemplateResult {
  return html`
    <div class="view">
      <div class="page-header"><div><h2>📝 Plans</h2></div></div>
      ${app.plansLoading ? renderSkeleton(2) : app.plans.length === 0 ? html`
        <div class="empty-state"><div class="empty-state-icon">📝</div><div class="empty-state-title">No plans</div></div>
      ` : html`
        <div class="flex-col gap-12">
          ${app.plans.map(p => html`
            <div class="card card-clickable">
              <div class="card-title">${p.name}</div>
              <div class="card-subtitle">${p.description || ""}</div>
              <div class="text-xs text-muted" style="margin-top:8px">${(p as unknown as {task_count?: number}).task_count ?? 0} tasks</div>
            </div>
          `)}
        </div>
      `}
    </div>
  `;
}

// ── Mind View ────────────────────────────────────────
function renderMindView(app: AgentOSApp): TemplateResult {
  const tabs = ["search", "browse", "tags", "graph", "reader"];
  return html`
    <div class="view">
      <div class="tab-bar">
        ${tabs.map(t => html`
          <button class="tab-btn ${app.mindTab === t ? "active" : ""}"
                  @click=${() => { app.mindTab = t; if (t === "graph" && !app.vaultGraph) app.loadVaultGraph(); }}>
            ${t === "search" ? "🔍 Search" : t === "browse" ? "📂 Browse" : t === "tags" ? "🏷️ Tags" : t === "graph" ? "🕸️ Graph" : "📖 Reader"}
          </button>
        `)}
      </div>

      ${app.mindTab === "search" ? html`
        <div class="search-bar">
          <span class="search-icon">🔍</span>
          <input placeholder="Search vault notes..."
                 .value=${app.vaultSearchQuery}
                 @input=${(e: Event) => { app.vaultSearchQuery = (e.target as HTMLInputElement).value; }}
                 @keydown=${(e: KeyboardEvent) => { if (e.key === "Enter") app.searchVault(app.vaultSearchQuery); }}>
        </div>
        ${app.vaultLoading ? renderSkeleton(3) : app.vaultSearchResults.length > 0 ? html`
          <div class="flex-col gap-8">
            ${app.vaultSearchResults.map(r => html`
              <div class="card card-clickable" @click=${() => app.openVaultNote(r.path)}>
                <div class="card-title">${r.title || r.path}</div>
                <div class="text-xs text-muted">${r.path}</div>
                ${r.snippet ? html`<div class="text-sm text-muted" style="margin-top:4px">${r.snippet}</div>` : nothing}
              </div>
            `)}
          </div>
        ` : nothing}
      ` : app.mindTab === "tags" ? html`
        <div class="flex gap-8" style="flex-wrap:wrap">
          ${app.vaultTags.map(t => html`
            <span class="chip" @click=${() => { app.vaultSearchQuery = t.tag; app.searchVault(t.tag); app.mindTab = "search"; }}>
              #${t.tag} <span class="chip-count">${t.count}</span>
            </span>
          `)}
        </div>
      ` : app.mindTab === "browse" ? html`
        <div class="flex-col gap-8">
          ${app.vaultFolders.map(f => html`
            <div class="card card-clickable">
              <span>📂 ${f.name} <span class="text-xs text-muted">(${f.count} notes)</span></span>
            </div>
          `)}
        </div>
      ` : app.mindTab === "reader" && app.vaultNote ? html`
        <div class="card" style="max-width:800px">
          <div class="card-header">
            <div class="card-title">${app.vaultNote.path}</div>
            <span class="text-xs text-muted">${app.vaultNote.wordCount} words · ${new Date(app.vaultNote.modified).toLocaleDateString()}</span>
          </div>
          <div style="white-space:pre-wrap;font-size:13px;line-height:1.7">${app.vaultNote.content}</div>
          ${app.vaultNote.backlinks.length > 0 ? html`
            <div class="card-footer">
              <span class="text-xs text-muted">Backlinks:</span>
              ${app.vaultNote.backlinks.map(b => html`<span class="badge badge-accent" style="cursor:pointer" @click=${() => app.openVaultNote(b)}>${b}</span>`)}
            </div>
          ` : nothing}
        </div>
      ` : html`
        <div class="empty-state"><div class="empty-state-icon">📖</div><div class="empty-state-title">Select a tab to explore</div></div>
      `}
    </div>
  `;
}

// ── System View ──────────────────────────────────────
function renderSystemView(app: AgentOSApp): TemplateResult {
  const ov = app.sysOverview;
  return html`
    <div class="view">
      <div class="page-header"><div><h2>⚙️ System</h2></div></div>

      ${app.sysLoading && !ov ? renderSkeleton(4) : ov ? html`
        <!-- Stats -->
        <div class="stats-row" style="margin-bottom:20px">
          <div class="stat-card">
            <span class="stat-value">${ov.uptime}</span>
            <span class="stat-label">⏱️ Uptime</span>
          </div>
          <div class="stat-card">
            <span class="stat-value">${ov.load.avg1.toFixed(2)}</span>
            <span class="stat-label">📈 Load (1m)</span>
          </div>
          <div class="stat-card">
            <span class="stat-value">${ov.memory.available ? Math.round(ov.memory.available / 1024 * 10) / 10 + "G" : "—"}</span>
            <span class="stat-label">💾 RAM Free</span>
          </div>
          <div class="stat-card">
            <span class="stat-value">${ov.disk.percent || "—"}</span>
            <span class="stat-label">💿 Disk Used</span>
          </div>
        </div>

        <!-- Services -->
        <div class="section-header"><span class="section-icon">🟢</span><span class="section-title">Services</span></div>
        <div class="grid-2" style="margin-bottom:20px">
          ${app.sysServices.map(s => html`
            <div class="card">
              <div class="flex items-center justify-between">
                <span class="font-medium">${s.name}</span>
                <span class="badge ${s.active === "active" ? "badge-green" : "badge-red"}">${s.active}</span>
              </div>
              <div class="text-xs text-muted" style="margin-top:4px">PID ${s.pid} · ${s.sub}</div>
            </div>
          `)}
        </div>

        <!-- Agents -->
        <div class="section-header"><span class="section-icon">🤖</span><span class="section-title">Agents</span></div>
        <div class="grid-3">
          ${app.sysAgents.map(a => html`
            <div class="card">
              <div class="flex items-center gap-8">
                <span class="agent-avatar">${agentEmoji(a.id)}</span>
                <div>
                  <div class="font-medium">${a.name || a.id}</div>
                  <span class="badge ${a.status === "active" ? "badge-green" : "badge-muted"}">${a.status}</span>
                </div>
              </div>
              ${a.health?.success_rate != null ? html`
                <div class="text-xs text-muted" style="margin-top:8px">${a.health.success_rate}% success · ${a.health.total} tasks</div>
              ` : nothing}
            </div>
          `)}
        </div>
      ` : html`
        <div class="empty-state"><div class="empty-state-icon">⚙️</div><div class="empty-state-title">Connect to bridge to see system status</div></div>
      `}
    </div>
  `;
}

// ── Workbench View ───────────────────────────────────
function renderWorkbenchView(app: AgentOSApp): TemplateResult {
  return html`
    <div class="view">
      <div class="page-header"><div><h2>👁️ Workbench</h2></div></div>
      <div style="display:flex;gap:16px;height:calc(100vh - var(--topbar-height) - 120px)">
        <!-- Agent List -->
        <div style="width:280px;overflow-y:auto">
          <div class="section-header"><span class="section-title">⚡ Active Agents</span></div>
          ${app.agents.filter(a => a.status === "active").length === 0 ? html`<div class="text-sm text-muted" style="padding:16px">No active agents</div>` :
            app.agents.filter(a => a.status === "active").map(a => html`
              <div class="card card-clickable" style="margin-bottom:8px" @click=${() => { app.workbenchSelectedAgent = a.id; }}>
                <div class="flex items-center gap-8">
                  <span class="agent-avatar agent-avatar-sm">${agentEmoji(a.id)}</span>
                  <div class="flex-1">
                    <div class="font-medium text-sm">${a.name || a.id}</div>
                    <div class="text-xs text-muted truncate">${a.current_task?.description || "Working..."}</div>
                  </div>
                </div>
              </div>
            `)}
        </div>
        <!-- Detail -->
        <div class="flex-1 card" style="overflow-y:auto">
          ${app.workbenchSelectedAgent ? html`
            <div class="card-title">${agentEmoji(app.workbenchSelectedAgent)} ${app.workbenchSelectedAgent}</div>
            <div class="text-sm text-muted" style="margin-top:8px">Select an agent to view live activity</div>
          ` : html`
            <div class="empty-state"><div class="empty-state-icon">⚡</div><div class="empty-state-title">Select an agent</div></div>
          `}
        </div>
      </div>
    </div>
  `;
}

// ── Agent Workbench View ─────────────────────────────
const BRIDGE = "http://192.168.122.10:18790";

async function loadAgentWorkbenchAgents(app: AgentOSApp) {
  app.agentWorkbenchLoading = true;
  try {
    const r = await fetch(`${BRIDGE}/api/agent-workbench/agents`);
    if (r.ok) app.agentWorkbenchAgents = await r.json();
  } catch {}
  app.agentWorkbenchLoading = false;
}

async function selectAgentWorkbenchAgent(app: AgentOSApp, id: string) {
  app.agentWorkbenchSelectedId = id;
  app.agentWorkbenchDetail = null;
  app.agentWorkbenchEditing = false;
  app.agentWorkbenchEditingCandidate = false;
  app.agentWorkbenchTestResult = null;
  app.agentWorkbenchCandidateResult = null;
  app.agentWorkbenchDetailLoading = true;
  try {
    const r = await fetch(`${BRIDGE}/api/agent-workbench/agents/${encodeURIComponent(id)}`);
    if (r.ok) {
      const detail = await r.json();
      app.agentWorkbenchDetail = detail;
      app.agentWorkbenchEditContent = detail.soul_content || "";
      app.agentWorkbenchCandidateContent = detail.candidate_content || "";
    }
  } catch {}
  app.agentWorkbenchDetailLoading = false;
}

async function saveAgentWorkbenchSoul(app: AgentOSApp, id: string, content: string, variant: "current" | "candidate") {
  try {
    const r = await fetch(`${BRIDGE}/api/agent-workbench/agents/${encodeURIComponent(id)}/soul`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content, variant }),
    });
    if (r.ok) {
      if (variant === "current") {
        app.agentWorkbenchEditing = false;
        if (app.agentWorkbenchDetail) app.agentWorkbenchDetail = { ...app.agentWorkbenchDetail, soul_content: content };
      } else {
        app.agentWorkbenchEditingCandidate = false;
        if (app.agentWorkbenchDetail) app.agentWorkbenchDetail = { ...app.agentWorkbenchDetail, candidate_content: content };
      }
      (app as any).showToast(`${variant === "current" ? "SOUL.md" : "Candidate"} saved`, "success");
    }
  } catch {
    (app as any).showToast("Save failed", "error");
  }
}

async function runAgentWorkbenchTest(app: AgentOSApp, id: string, variant: "current" | "candidate") {
  const prompt = app.agentWorkbenchTestPrompt.trim();
  if (!prompt) return;
  if (variant === "current") app.agentWorkbenchTesting = true;
  else app.agentWorkbenchCandidateTesting = true;
  try {
    const r = await fetch(`${BRIDGE}/api/agent-workbench/agents/${encodeURIComponent(id)}/test`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt, variant }),
    });
    if (r.ok) {
      const result = await r.json();
      if (variant === "current") app.agentWorkbenchTestResult = result;
      else app.agentWorkbenchCandidateResult = result;
    }
  } catch {
    (app as any).showToast("Test failed", "error");
  }
  if (variant === "current") app.agentWorkbenchTesting = false;
  else app.agentWorkbenchCandidateTesting = false;
}

function renderAgentWorkbenchView(app: AgentOSApp): TemplateResult {
  // Load agents on first render
  if (!app.agentWorkbenchLoading && app.agentWorkbenchAgents.length === 0) {
    loadAgentWorkbenchAgents(app);
  }

  const selected = app.agentWorkbenchDetail;
  const selectedId = app.agentWorkbenchSelectedId;
  const wordCount = (s: string) => s.trim() ? s.trim().split(/\s+/).length : 0;

  return html`
    <div class="view" style="padding:0">
      <div class="page-header" style="padding:12px 20px">
        <div><h2>🔧 Agent Workbench</h2></div>
        <div style="font-size:12px;color:var(--subtext0)">SOUL.md editor · A/B testing · prompt quality</div>
      </div>
      <div style="display:flex;gap:0;height:calc(100vh - var(--topbar-height) - 80px);overflow:hidden">

        <!-- LEFT PANEL — Agent List -->
        <div style="width:240px;min-width:200px;border-right:1px solid var(--surface0);overflow-y:auto;background:var(--mantle)">
          <div style="padding:10px 12px;border-bottom:1px solid var(--surface0);font-size:11px;font-weight:600;color:var(--subtext0);text-transform:uppercase;letter-spacing:.05em">
            Agents
            ${app.agentWorkbenchLoading ? html`<span style="margin-left:8px;opacity:.5">loading…</span>` : html`<span style="margin-left:8px;opacity:.5">(${app.agentWorkbenchAgents.length})</span>`}
          </div>
          ${app.agentWorkbenchAgents.length === 0 && !app.agentWorkbenchLoading ? html`
            <div style="padding:16px;font-size:12px;color:var(--subtext0)">No agents found</div>
          ` : app.agentWorkbenchAgents.map(a => html`
            <div class="${a.id === selectedId ? "nav-item active" : "nav-item"}"
                 style="padding:10px 12px;cursor:pointer;border-bottom:1px solid var(--surface0)"
                 @click=${() => selectAgentWorkbenchAgent(app, a.id)}>
              <div style="font-size:13px;font-weight:500;color:var(--text)">${a.id}</div>
              <div style="display:flex;gap:6px;margin-top:4px;align-items:center">
                ${a.has_soul ? html`<span style="background:var(--green);color:var(--base);font-size:10px;padding:1px 5px;border-radius:3px">SOUL</span>` : html`<span style="background:var(--surface1);color:var(--subtext0);font-size:10px;padding:1px 5px;border-radius:3px">no soul</span>`}
                ${a.soul_size ? html`<span style="font-size:11px;color:var(--subtext0)">${(a.soul_size / 1024).toFixed(1)}KB</span>` : nothing}
              </div>
            </div>
          `)}
        </div>

        <!-- CENTER PANEL — SOUL.md Editor -->
        <div style="flex:1;min-width:0;display:flex;flex-direction:column;border-right:1px solid var(--surface0);overflow:hidden">
          ${!selectedId ? html`
            <div style="display:flex;align-items:center;justify-content:center;height:100%;color:var(--subtext0);font-size:14px">
              Select an agent to view its SOUL.md
            </div>
          ` : app.agentWorkbenchDetailLoading ? html`
            <div style="display:flex;align-items:center;justify-content:center;height:100%;color:var(--subtext0)">Loading…</div>
          ` : html`
            <!-- SOUL.md section -->
            <div style="padding:12px 16px;border-bottom:1px solid var(--surface0);display:flex;align-items:center;gap:12px">
              <span style="font-weight:600;font-size:14px;color:var(--text)">SOUL.md — ${selectedId}</span>
              <div style="flex:1"></div>
              ${!app.agentWorkbenchEditing ? html`
                <button class="btn btn-sm" @click=${() => { app.agentWorkbenchEditing = true; app.agentWorkbenchEditContent = selected?.soul_content || ""; }}>Edit</button>
              ` : html`
                <button class="btn btn-sm btn-success" @click=${() => saveAgentWorkbenchSoul(app, selectedId, app.agentWorkbenchEditContent, "current")}>Save</button>
                <button class="btn btn-sm" @click=${() => { app.agentWorkbenchEditing = false; }}>Cancel</button>
              `}
            </div>
            ${!app.agentWorkbenchEditing ? html`
              <div style="flex:1;overflow-y:auto;padding:16px;font-size:13px;line-height:1.6;color:var(--text);white-space:pre-wrap;font-family:monospace">
                ${selected?.soul_content || html`<span style="color:var(--subtext0)">No SOUL.md found</span>`}
              </div>
              <div style="padding:8px 16px;border-top:1px solid var(--surface0);font-size:11px;color:var(--subtext0)">
                ${selected?.soul_content ? `${selected.soul_content.length} chars · ${wordCount(selected.soul_content)} words` : "—"}
              </div>
            ` : html`
              <textarea
                style="flex:1;background:var(--base);color:var(--text);border:none;padding:16px;font-family:monospace;font-size:13px;resize:none;outline:none;line-height:1.6"
                .value=${app.agentWorkbenchEditContent}
                @input=${(e: Event) => { app.agentWorkbenchEditContent = (e.target as HTMLTextAreaElement).value; }}
              ></textarea>
              <div style="padding:8px 16px;border-top:1px solid var(--surface0);font-size:11px;color:var(--subtext0)">
                ${app.agentWorkbenchEditContent.length} chars · ${wordCount(app.agentWorkbenchEditContent)} words
              </div>
            `}

            <!-- Candidate SOUL.md section -->
            <div style="padding:12px 16px;border-top:2px solid var(--surface0);border-bottom:1px solid var(--surface0);display:flex;align-items:center;gap:12px;background:var(--mantle)">
              <span style="font-weight:600;font-size:13px;color:var(--yellow)">📋 Candidate SOUL.md</span>
              <div style="flex:1"></div>
              ${!app.agentWorkbenchEditingCandidate ? html`
                <button class="btn btn-sm" @click=${() => { app.agentWorkbenchEditingCandidate = true; app.agentWorkbenchCandidateContent = selected?.candidate_content || ""; }}>Edit Candidate</button>
                ${selected?.candidate_content ? html`
                  <button class="btn btn-sm btn-success" @click=${() => saveAgentWorkbenchSoul(app, selectedId, selected.candidate_content!, "current")}>Promote →</button>
                ` : nothing}
              ` : html`
                <button class="btn btn-sm btn-success" @click=${() => saveAgentWorkbenchSoul(app, selectedId, app.agentWorkbenchCandidateContent, "candidate")}>Save Candidate</button>
                <button class="btn btn-sm" @click=${() => { app.agentWorkbenchEditingCandidate = false; }}>Cancel</button>
              `}
            </div>
            ${!app.agentWorkbenchEditingCandidate ? html`
              <div style="height:120px;overflow-y:auto;padding:12px 16px;font-size:12px;line-height:1.5;color:var(--subtext1);white-space:pre-wrap;font-family:monospace;background:var(--mantle)">
                ${selected?.candidate_content || html`<span style="color:var(--subtext0)">No candidate — edit to create one</span>`}
              </div>
            ` : html`
              <textarea
                style="height:120px;background:var(--mantle);color:var(--text);border:none;border-top:1px solid var(--surface0);padding:12px 16px;font-family:monospace;font-size:12px;resize:none;outline:none;line-height:1.5"
                .value=${app.agentWorkbenchCandidateContent}
                @input=${(e: Event) => { app.agentWorkbenchCandidateContent = (e.target as HTMLTextAreaElement).value; }}
              ></textarea>
            `}
          `}
        </div>

        <!-- RIGHT PANEL — Test Runner -->
        <div style="width:380px;min-width:320px;display:flex;flex-direction:column;overflow:hidden">
          <div style="padding:12px 16px;border-bottom:1px solid var(--surface0);font-size:13px;font-weight:600;color:var(--text)">
            🧪 Test Runner
          </div>
          ${!selectedId ? html`
            <div style="display:flex;align-items:center;justify-content:center;height:100%;color:var(--subtext0);font-size:13px">Select an agent first</div>
          ` : html`
            <div style="padding:12px 16px;border-bottom:1px solid var(--surface0)">
              <textarea
                style="width:100%;background:var(--base);color:var(--text);border:1px solid var(--surface1);border-radius:6px;padding:10px;font-size:13px;resize:vertical;outline:none;min-height:80px;box-sizing:border-box"
                placeholder="Enter test prompt…"
                .value=${app.agentWorkbenchTestPrompt}
                @input=${(e: Event) => { app.agentWorkbenchTestPrompt = (e.target as HTMLTextAreaElement).value; }}
              ></textarea>
              <div style="display:flex;gap:8px;margin-top:8px">
                <button class="btn btn-sm btn-primary" style="flex:1"
                  ?disabled=${app.agentWorkbenchTesting || !app.agentWorkbenchTestPrompt.trim()}
                  @click=${() => runAgentWorkbenchTest(app, selectedId, "current")}>
                  ${app.agentWorkbenchTesting ? "Running…" : "▶ Run Test"}
                </button>
                ${selected?.candidate_content ? html`
                  <button class="btn btn-sm" style="flex:1"
                    ?disabled=${app.agentWorkbenchCandidateTesting || !app.agentWorkbenchTestPrompt.trim()}
                    @click=${() => runAgentWorkbenchTest(app, selectedId, "candidate")}>
                    ${app.agentWorkbenchCandidateTesting ? "Running…" : "⚡ Run A/B"}
                  </button>
                ` : nothing}
              </div>
            </div>

            <!-- Results -->
            <div style="flex:1;overflow-y:auto;padding:12px 16px">
              ${app.agentWorkbenchTestResult || app.agentWorkbenchCandidateResult ? html`
                <!-- A/B Comparison or single result -->
                ${app.agentWorkbenchTestResult && app.agentWorkbenchCandidateResult ? html`
                  <!-- Side-by-side comparison -->
                  <div style="margin-bottom:8px;font-size:11px;color:var(--subtext0);text-transform:uppercase;letter-spacing:.05em">A/B Comparison</div>
                  <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:12px">
                    <div>
                      <div style="font-size:11px;font-weight:600;color:var(--blue);margin-bottom:6px">Current</div>
                      <div style="background:var(--surface0);border-radius:6px;padding:10px;font-size:12px;line-height:1.5;color:var(--text);white-space:pre-wrap;max-height:200px;overflow-y:auto">
                        ${app.agentWorkbenchTestResult.response}
                      </div>
                    </div>
                    <div>
                      <div style="font-size:11px;font-weight:600;color:var(--yellow);margin-bottom:6px">Candidate</div>
                      <div style="background:var(--surface0);border-radius:6px;padding:10px;font-size:12px;line-height:1.5;color:var(--text);white-space:pre-wrap;max-height:200px;overflow-y:auto">
                        ${app.agentWorkbenchCandidateResult.response}
                      </div>
                    </div>
                  </div>
                  ${selected?.candidate_content ? html`
                    <button class="btn btn-sm btn-success" style="width:100%"
                      @click=${() => saveAgentWorkbenchSoul(app, selectedId, selected.candidate_content!, "current")}>
                      ✅ Promote Candidate to Current
                    </button>
                  ` : nothing}
                ` : html`
                  <!-- Single result -->
                  <div style="font-size:11px;color:var(--subtext0);margin-bottom:6px;text-transform:uppercase;letter-spacing:.05em">
                    ${app.agentWorkbenchTestResult ? "Current SOUL.md" : "Candidate SOUL.md"}
                  </div>
                  <div style="background:var(--surface0);border-radius:6px;padding:12px;font-size:13px;line-height:1.6;color:var(--text);white-space:pre-wrap">
                    ${(app.agentWorkbenchTestResult || app.agentWorkbenchCandidateResult)?.response}
                  </div>
                `}
              ` : html`
                <div style="text-align:center;color:var(--subtext0);font-size:13px;margin-top:24px">
                  Enter a prompt and click Run Test
                </div>
              `}
            </div>
          `}
        </div>
      </div>
    </div>
  `;
}

// ── Placeholder View ─────────────────────────────────
function renderPlaceholderView(app: AgentOSApp): TemplateResult {
  return html`
    <div class="view">
      <div class="empty-state">
        <div class="empty-state-icon">🚧</div>
        <div class="empty-state-title">${PAGE_TITLES[app.currentPage] || app.currentPage}</div>
        <div class="empty-state-subtitle">This page is coming soon</div>
      </div>
    </div>
  `;
}
