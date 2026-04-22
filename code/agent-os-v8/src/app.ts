// ═══════════════════════════════════════════════════════════
// Agent OS v8 — Root Component
// Following OpenClaw pattern: single root with all @state,
// views as pure functions, controllers as stateless mutators
// ═══════════════════════════════════════════════════════════
import { LitElement, html, type TemplateResult } from "lit";
import { customElement, state } from "lit/decorators.js";
import { GatewayClient, type ConnectionStatus } from "./gateway.ts";
import { loadSettings, saveSettings, type AppSettings } from "./storage.ts";
import type {
  Page, FeedEvent, Proposal, ChannelCategory, ChatMessage,
  Task, Project, Mission, AgentCard, SystemOverview, ServiceStatus,
  VaultSearchResult, VaultNote, Plan, InboxItem, Session,
  AgentWorkbenchEntry, AgentWorkbenchDetail, AgentWorkbenchTestResult, AgentWorkbenchLogEntry,
  WikiPage, WikiStats,
} from "./types.ts";
import { renderApp } from "./app-render.ts";

// Re-export for controllers to use
export type AppState = AgentOSApp;

@customElement("agent-os-app")
export class AgentOSApp extends LitElement {
  // ── No shadow DOM ─────────────────────────────────
  createRenderRoot() { return this; }

  // ── Settings ──────────────────────────────────────
  @state() settings: AppSettings = loadSettings();

  // ── Navigation ────────────────────────────────────
  @state() currentPage: Page = this.settings.lastPage || "feed";
  @state() sidebarOpen = this.settings.sidebarOpen;
  @state() cmdPaletteOpen = false;

  // ── Connection ────────────────────────────────────
  @state() connectionStatus: ConnectionStatus = "disconnected";
  client: GatewayClient | null = null;

  // ── Feed ──────────────────────────────────────────
  @state() feedEvents: FeedEvent[] = [];
  @state() feedLoading = false;
  @state() feedFilter = "all";
  @state() feedError: string | null = null;

  // ── Inbox ─────────────────────────────────────────
  @state() inboxItems: InboxItem[] = [];
  @state() inboxLoading = false;
  @state() inboxFilter = "all";
  @state() inboxSelectedId: string | null = null;

  // ── Proposals ─────────────────────────────────────
  @state() proposals: Proposal[] = [];
  @state() proposalsLoading = false;
  @state() proposalFilter = "all";
  @state() proposalSelectedId: string | null = null;

  // ── Talk (Chat) ───────────────────────────────────
  @state() channels: ChannelCategory[] = [];
  @state() currentChannelId: string | null = null;
  @state() chatMessages: ChatMessage[] = [];
  @state() chatLoading = false;
  @state() chatInput = "";
  @state() replyingTo: ChatMessage | null = null;

  // ── Tasks ─────────────────────────────────────────
  @state() tasks: Task[] = [];
  @state() tasksLoading = false;
  @state() taskFilter = "all";
  @state() taskSelectedId: string | null = null;

  // ── Projects ──────────────────────────────────────
  @state() projects: Project[] = [];
  @state() projectsLoading = false;

  // ── Missions ──────────────────────────────────────
  @state() missions: Mission[] = [];
  @state() missionsLoading = false;
  @state() missionSelectedId: string | null = null;

  // ── Plans ─────────────────────────────────────────
  @state() plans: Plan[] = [];
  @state() plansLoading = false;
  @state() currentPlanId: string | null = null;

  // ── Mind (Vault) ──────────────────────────────────
  @state() mindTab = "search";
  @state() vaultSearchResults: VaultSearchResult[] = [];
  @state() vaultSearchQuery = "";
  @state() vaultNote: VaultNote | null = null;
  @state() vaultLoading = false;
  @state() vaultFolders: { name: string; count: number }[] = [];
  @state() vaultTags: { tag: string; count: number }[] = [];
  @state() vaultGraph: { nodes: unknown[]; edges: unknown[] } | null = null;

  // ── System ────────────────────────────────────────
  @state() sysOverview: SystemOverview | null = null;
  @state() sysServices: ServiceStatus[] = [];
  @state() sysAgents: AgentCard[] = [];
  @state() sysLoading = false;

  // ── Agents ────────────────────────────────────────
  @state() agents: AgentCard[] = [];
  @state() agentsLoading = false;

  // ── Workbench ─────────────────────────────────────
  @state() workbenchSelectedAgent: string | null = null;

  // ── Agent Workbench ───────────────────────────────
  @state() agentWorkbenchAgents: AgentWorkbenchEntry[] = [];
  @state() agentWorkbenchLoading = false;
  @state() agentWorkbenchSelectedId: string | null = null;
  @state() agentWorkbenchDetail: AgentWorkbenchDetail | null = null;
  @state() agentWorkbenchDetailLoading = false;
  @state() agentWorkbenchEditing = false;
  @state() agentWorkbenchEditContent = "";
  @state() agentWorkbenchCandidateContent = "";
  @state() agentWorkbenchTestPrompt = "";
  @state() agentWorkbenchTestResult: AgentWorkbenchTestResult | null = null;
  @state() agentWorkbenchCandidateResult: AgentWorkbenchTestResult | null = null;
  @state() agentWorkbenchTesting = false;
  @state() agentWorkbenchCandidateTesting = false;
  @state() agentWorkbenchEditingCandidate = false;
  @state() agentWorkbenchLogs: AgentWorkbenchLogEntry[] = [];

  // ── Wiki ──────────────────────────────────────────
  @state() wikiSearchQuery = '';
  @state() wikiSearchResults: WikiPage[] = [];
  @state() wikiCurrentPage: WikiPage | null = null;
  @state() wikiStats: WikiStats | null = null;
  @state() wikiView: 'home' | 'search' | 'page' | 'graph' = 'home';
  @state() wikiLoading = false;

  // ── Sessions ──────────────────────────────────────
  @state() sessions: Session[] = [];
  @state() sessionsLoading = false;

  // ── Toast ─────────────────────────────────────────
  @state() toasts: { id: string; message: string; type: string }[] = [];

  // ═══════════════════════════════════════════════════
  // Lifecycle
  // ═══════════════════════════════════════════════════

  connectedCallback() {
    super.connectedCallback();
    this.connectGateway();
    // Keyboard shortcuts
    window.addEventListener("keydown", this._onKeyDown);
    // URL hash navigation
    window.addEventListener("hashchange", this._onHashChange);
    const hash = window.location.hash.replace("#", "") as Page;
    if (hash && this.isValidPage(hash)) {
      this.navigate(hash);
    }
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    window.removeEventListener("keydown", this._onKeyDown);
    window.removeEventListener("hashchange", this._onHashChange);
    this.client?.disconnect();
  }

  // ═══════════════════════════════════════════════════
  // Gateway Connection
  // ═══════════════════════════════════════════════════

  connectGateway() {
    const url = this.settings.bridgeUrl || `http://${location.hostname}:18790`;
    this.client?.disconnect();
    this.client = new GatewayClient({
      url,
      token: this.settings.bridgeToken,
      onStatus: (s) => {
        this.connectionStatus = s;
        if (s === "connected") this.onConnected();
      },
      onEvent: (event, payload) => this.onGatewayEvent(event, payload),
    });
    this.client.connect();
  }

  async onConnected() {
    // Load initial data for current page
    await this.loadPageData(this.currentPage);
    // Always load agents for sidebar status
    this.loadAgents();
  }

  onGatewayEvent(event: string, payload: unknown) {
    const data = (payload as Record<string, unknown>)?.data ?? payload;
    switch (event) {
      case "feed":
        if (data && typeof data === "object" && "id" in (data as Record<string, unknown>)) {
          this.feedEvents = [data as FeedEvent, ...this.feedEvents];
        }
        break;
      case "message":
        if ((payload as Record<string, unknown>)?.channel === this.currentChannelId) {
          this.chatMessages = [...this.chatMessages, data as ChatMessage];
        }
        break;
      case "proposal":
      case "queue":
        this.loadProposals();
        break;
      case "task":
        this.loadTasks();
        break;
    }
  }

  // ═══════════════════════════════════════════════════
  // Navigation
  // ═══════════════════════════════════════════════════

  navigate(page: Page) {
    if (this.currentPage === page) return;
    this.currentPage = page;
    window.location.hash = page;
    saveSettings({ lastPage: page });
    this.loadPageData(page);
    // Close mobile sidebar
    if (window.innerWidth <= 768) this.sidebarOpen = false;
  }

  isValidPage(page: string): page is Page {
    const pages: Page[] = [
      "feed", "inbox", "proposals", "briefing", "workbench",
      "talk", "rooms", "tasks", "projects", "plans", "missions",
      "pipelines", "mind", "explore", "wiki", "roles", "records", "system",
      "sessions", "usage", "config", "skills", "debug",
    ];
    return pages.includes(page as Page);
  }

  async loadPageData(page: Page) {
    if (!this.client || this.connectionStatus !== "connected") return;
    switch (page) {
      case "feed": return this.loadFeed();
      case "inbox": return this.loadInbox();
      case "proposals": return this.loadProposals();
      case "talk": return this.loadChannels();
      case "tasks": return this.loadTasks();
      case "projects": return this.loadProjects();
      case "missions": return this.loadMissions();
      case "plans": return this.loadPlans();
      case "mind": return this.loadVaultInit();
      case "wiki": return this.wikiLoadStats();
      case "system": return this.loadSystem();
      case "workbench": return this.loadAgents();
    }
  }

  // ═══════════════════════════════════════════════════
  // Data Loading (Controllers — inline for now)
  // ═══════════════════════════════════════════════════

  async loadFeed() {
    this.feedLoading = true;
    try {
      const res = await this.client!.request<{ events?: FeedEvent[] } | FeedEvent[]>("feed.list", { limit: 50, enrich: true });
      this.feedEvents = Array.isArray(res) ? res : (res.events ?? []);
    } catch (e) { this.feedError = String(e); }
    finally { this.feedLoading = false; }
  }

  async loadInbox() {
    this.inboxLoading = true;
    try {
      const items = await this.client!.request<InboxItem[]>("stream.list", { limit: 50 });
      this.inboxItems = Array.isArray(items) ? items : [];
    } catch { /* ignore */ }
    finally { this.inboxLoading = false; }
  }

  async loadProposals() {
    this.proposalsLoading = true;
    try {
      const res = await this.client!.request<{ proposals?: Proposal[] }>("proposals.list", { status: "all" });
      this.proposals = res.proposals ?? [];
    } catch { /* ignore */ }
    finally { this.proposalsLoading = false; }
  }

  async loadChannels() {
    try {
      const res = await this.client!.request<{ categories?: ChannelCategory[] }>("channels.list");
      this.channels = res.categories ?? [];
      // Auto-select first channel
      if (!this.currentChannelId && this.channels.length > 0 && this.channels[0].channels.length > 0) {
        this.switchChannel(this.channels[0].channels[0].id);
      }
    } catch { /* ignore */ }
  }

  async switchChannel(channelId: string) {
    this.currentChannelId = channelId;
    this.chatLoading = true;
    this.chatMessages = [];
    try {
      const msgs = await this.client!.request<ChatMessage[]>("channels.messages", { channelId, limit: 50 });
      this.chatMessages = Array.isArray(msgs) ? msgs.reverse() : [];
    } catch { /* ignore */ }
    finally { this.chatLoading = false; }
    // Subscribe for live updates
    this.client?.send({ type: "subscribe", channel: channelId });
  }

  async sendChatMessage() {
    const text = this.chatInput.trim();
    if (!text || !this.currentChannelId) return;
    this.chatInput = "";
    try {
      await this.client!.request("channels.send", {
        channelId: this.currentChannelId,
        message: text,
        replyTo: this.replyingTo?.id,
      });
      this.replyingTo = null;
    } catch (e) { this.showToast("Send failed: " + String(e), "error"); }
  }

  async loadTasks() {
    this.tasksLoading = true;
    try {
      const items = await this.client!.request<Task[]>("tasks.list");
      this.tasks = Array.isArray(items) ? items : [];
    } catch { /* ignore */ }
    finally { this.tasksLoading = false; }
  }

  async loadProjects() {
    this.projectsLoading = true;
    try {
      const items = await this.client!.request<Project[]>("projects.list");
      this.projects = Array.isArray(items) ? items : [];
    } catch { /* ignore */ }
    finally { this.projectsLoading = false; }
  }

  async loadMissions() {
    this.missionsLoading = true;
    try {
      const items = await this.client!.request<Mission[]>("missions.list");
      this.missions = Array.isArray(items) ? items : [];
    } catch { /* ignore */ }
    finally { this.missionsLoading = false; }
  }

  async loadPlans() {
    this.plansLoading = true;
    try {
      const items = await this.client!.request<Plan[]>("plans.list");
      this.plans = Array.isArray(items) ? items : [];
      if (!this.currentPlanId && items.length > 0) {
        this.currentPlanId = items[0].id;
      }
    } catch { /* ignore */ }
    finally { this.plansLoading = false; }
  }

  async loadAgents() {
    this.agentsLoading = true;
    try {
      const items = await this.client!.request<AgentCard[]>("agents.list");
      this.agents = Array.isArray(items) ? items : [];
      this.sysAgents = this.agents;
    } catch { /* ignore */ }
    finally { this.agentsLoading = false; }
  }

  async loadSystem() {
    this.sysLoading = true;
    try {
      const [overview, services] = await Promise.all([
        this.client!.request<SystemOverview>("system.overview"),
        this.client!.request<ServiceStatus[]>("system.services"),
      ]);
      this.sysOverview = overview;
      this.sysServices = Array.isArray(services) ? services : [];
    } catch { /* ignore */ }
    finally { this.sysLoading = false; }
    this.loadAgents();
  }

  async loadVaultInit() {
    try {
      const [folders, tags] = await Promise.all([
        this.client!.request<{ name: string; count: number }[]>("vault.folders"),
        this.client!.request<{ tag: string; count: number }[]>("vault.tags"),
      ]);
      this.vaultFolders = Array.isArray(folders) ? folders : [];
      this.vaultTags = Array.isArray(tags) ? tags : [];
    } catch { /* ignore */ }
  }

  async searchVault(query: string) {
    if (!query.trim()) return;
    this.vaultLoading = true;
    this.vaultSearchQuery = query;
    try {
      const items = await this.client!.request<VaultSearchResult[]>("vault.search", { query, limit: 20 });
      this.vaultSearchResults = Array.isArray(items) ? items : [];
    } catch { /* ignore */ }
    finally { this.vaultLoading = false; }
  }

  async openVaultNote(path: string) {
    this.vaultLoading = true;
    try {
      const note = await this.client!.request<VaultNote>("vault.note", { path });
      this.vaultNote = note;
      this.mindTab = "reader";
    } catch { this.showToast("Failed to load note", "error"); }
    finally { this.vaultLoading = false; }
  }

  async loadVaultGraph() {
    this.vaultLoading = true;
    try {
      const graph = await this.client!.request<{ nodes: unknown[]; edges: unknown[] }>("vault.graph", { limit: 150 });
      this.vaultGraph = graph;
    } catch { /* ignore */ }
    finally { this.vaultLoading = false; }
  }

  // ═══════════════════════════════════════════════════
  // Wiki
  // ═══════════════════════════════════════════════════

  private get _bridgeUrl(): string {
    return this.settings.bridgeUrl || `http://${location.hostname}:18790`;
  }

  async wikiSearch(query: string) {
    if (!query.trim()) return;
    this.wikiLoading = true;
    this.wikiSearchQuery = query;
    this.wikiView = 'search';
    try {
      const res = await fetch(`${this._bridgeUrl}/api/wiki/search?q=${encodeURIComponent(query)}`);
      if (res.ok) {
        this.wikiSearchResults = await res.json();
      }
    } catch { /* ignore */ }
    finally { this.wikiLoading = false; }
  }

  async wikiLoadPage(id: string) {
    this.wikiLoading = true;
    this.wikiView = 'page';
    try {
      const res = await fetch(`${this._bridgeUrl}/api/wiki/page/${encodeURIComponent(id)}`);
      if (res.ok) {
        this.wikiCurrentPage = await res.json();
      }
    } catch { /* ignore */ }
    finally { this.wikiLoading = false; }
  }

  async wikiLoadStats() {
    try {
      const res = await fetch(`${this._bridgeUrl}/api/wiki/stats`);
      if (res.ok) {
        this.wikiStats = await res.json();
      }
    } catch { /* ignore */ }
  }

  // ═══════════════════════════════════════════════════
  // Toast
  // ═══════════════════════════════════════════════════

  showToast(message: string, type = "info") {
    const id = crypto.randomUUID?.() ?? String(Date.now());
    this.toasts = [...this.toasts, { id, message, type }];
    setTimeout(() => {
      this.toasts = this.toasts.filter(t => t.id !== id);
    }, 4000);
  }

  // ═══════════════════════════════════════════════════
  // Keyboard
  // ═══════════════════════════════════════════════════

  private _onKeyDown = (e: KeyboardEvent) => {
    // ⌘K or Ctrl+K — command palette
    if ((e.metaKey || e.ctrlKey) && e.key === "k") {
      e.preventDefault();
      this.cmdPaletteOpen = !this.cmdPaletteOpen;
    }
    // Escape closes palette
    if (e.key === "Escape" && this.cmdPaletteOpen) {
      this.cmdPaletteOpen = false;
    }
  };

  private _onHashChange = () => {
    const hash = window.location.hash.replace("#", "") as Page;
    if (hash && this.isValidPage(hash) && hash !== this.currentPage) {
      this.navigate(hash);
    }
  };

  // ═══════════════════════════════════════════════════
  // Render
  // ═══════════════════════════════════════════════════

  render(): TemplateResult {
    return renderApp(this);
  }
}
