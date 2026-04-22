import { create } from 'zustand';
import { api } from '@/lib/api';

export interface FileNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  children?: FileNode[];
  language?: string;
}

export interface OpenTab {
  path: string;
  name: string;
  language: string;
  modified: boolean;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  codeContext?: { filePath: string; selection: string };
}

export interface IntentNode {
  id: string;
  level: number;
  title: string;
  description?: string;
  type: 'product' | 'flow' | 'action' | 'system' | 'feature' | 'implementation' | 'code';
  parent?: string;
  children: string[];
  linkedCode?: string[];
  status?: 'planned' | 'partial' | 'complete';
  userVisible?: boolean;
}

interface EditorStore {
  // File tree
  files: FileNode[];
  expandedDirs: Set<string>;
  setFiles: (files: FileNode[]) => void;
  toggleDir: (path: string) => void;

  // Tabs & active file
  openTabs: OpenTab[];
  activeFilePath: string | null;
  fileContents: Map<string, string>;
  openFile: (path: string, name: string, language: string) => void;
  closeTab: (path: string) => void;
  setActiveFile: (path: string) => void;
  updateFileContent: (path: string, content: string) => void;

  // Editor
  selectedCode: string;
  setSelectedCode: (code: string) => void;

  // Scroll-to-line
  scrollToLine: number | null;
  setScrollToLine: (line: number | null) => void;

  // AI Panel
  chatMessages: ChatMessage[];
  isChatLoading: boolean;
  addChatMessage: (msg: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
  setChatLoading: (loading: boolean) => void;
  clearChat: () => void;

  // UI
  sidebarOpen: boolean;
  aiPanelOpen: boolean;
  sidebarWidth: number;
  aiPanelWidth: number;
  toggleSidebar: () => void;
  toggleAiPanel: () => void;
  setSidebarWidth: (w: number) => void;
  setAiPanelWidth: (w: number) => void;

  // Project / Backend
  projectPath: string | null;
  isProjectLoading: boolean;
  backendError: string | null;
  intentNodes: IntentNode[];
  intentZoom: number;
  rightPanelTab: 'ai' | 'intent' | 'insights';

  setProject: (path: string) => Promise<void>;
  refreshFiles: () => Promise<void>;
  saveFile: (path: string) => Promise<void>;
  sendQuery: (question: string) => Promise<void>;
  loadIntentGraph: (zoom?: number) => Promise<void>;
  updateIntentNode: (id: string, updates: Partial<IntentNode>) => Promise<void>;
  addIntentNode: (parentId: string, title: string, type: string) => Promise<void>;
  executeIntentNode: (nodeId: string) => Promise<void>;
  setRightPanelTab: (tab: 'ai' | 'intent' | 'insights') => void;
  setIntentZoom: (zoom: number) => void;
  setBackendError: (err: string | null) => void;

  // Self-evolve & simulation
  isEvolving: boolean;
  isSimulating: boolean;
  simulationResults: Array<{ flowName: string; validity: number; issues: string[] }> | null;
  evolutionResults: Array<{ iteration: number; improvementsSucceeded: number; buildPassed: boolean; completeness: { before: number; after: number } }> | null;
  selfEvolve: () => Promise<void>;
  simulateFlows: () => Promise<void>;
}

// ---------------------------------------------------------------------------
// Helper: generate unique ID
// ---------------------------------------------------------------------------

function uid(): string {
  return crypto.randomUUID();
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useEditorStore = create<EditorStore>((set, get) => ({
  // -- File tree -----------------------------------------------------------
  files: [],
  expandedDirs: new Set<string>(),

  setFiles: (files) => set({ files }),

  toggleDir: (path) =>
    set((state) => {
      const next = new Set(state.expandedDirs);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return { expandedDirs: next };
    }),

  // -- Tabs & active file --------------------------------------------------
  openTabs: [],
  activeFilePath: null,
  fileContents: new Map<string, string>(),

  openFile: (path, name, language) => {
    const state = get();
    const alreadyOpen = state.openTabs.some((t) => t.path === path);

    // If we already have the content, just open the tab synchronously
    if (state.fileContents.has(path)) {
      set({
        openTabs: alreadyOpen
          ? state.openTabs
          : [...state.openTabs, { path, name, language, modified: false }],
        activeFilePath: path,
      });
      return;
    }

    // Otherwise fetch from backend, then set state
    const newTabs = alreadyOpen
      ? state.openTabs
      : [...state.openTabs, { path, name, language, modified: false }];

    set({ openTabs: newTabs, activeFilePath: path });

    api<{ content: string; language: string }>(`/files/read?path=${encodeURIComponent(path)}`)
      .then((res) => {
        const contents = new Map(get().fileContents);
        contents.set(path, res.content);
        set({ fileContents: contents });
      })
      .catch((err) => {
        console.error('Failed to read file:', err);
        // Put empty content so it doesn't keep retrying
        const contents = new Map(get().fileContents);
        contents.set(path, `// Error loading file: ${err.message}`);
        set({ fileContents: contents });
      });
  },

  closeTab: (path) =>
    set((state) => {
      const filtered = state.openTabs.filter((t) => t.path !== path);
      let nextActive = state.activeFilePath;

      if (state.activeFilePath === path) {
        const closedIndex = state.openTabs.findIndex((t) => t.path === path);
        if (filtered.length === 0) {
          nextActive = null;
        } else if (closedIndex > 0) {
          nextActive = filtered[closedIndex - 1].path;
        } else {
          nextActive = filtered[0].path;
        }
      }

      return { openTabs: filtered, activeFilePath: nextActive };
    }),

  setActiveFile: (path) => set({ activeFilePath: path }),

  updateFileContent: (path, content) =>
    set((state) => {
      const contents = new Map(state.fileContents);
      contents.set(path, content);

      const openTabs = state.openTabs.map((tab) =>
        tab.path === path ? { ...tab, modified: true } : tab,
      );

      return { fileContents: contents, openTabs };
    }),

  // -- Editor --------------------------------------------------------------
  selectedCode: '',
  setSelectedCode: (code) => set({ selectedCode: code }),

  // -- Scroll-to-line ------------------------------------------------------
  scrollToLine: null,
  setScrollToLine: (line) => set({ scrollToLine: line }),

  // -- AI Panel ------------------------------------------------------------
  chatMessages: [],
  isChatLoading: false,

  addChatMessage: (msg) =>
    set((state) => ({
      chatMessages: [
        ...state.chatMessages,
        {
          ...msg,
          id: uid(),
          timestamp: Date.now(),
        },
      ],
    })),

  setChatLoading: (loading) => set({ isChatLoading: loading }),

  clearChat: () => set({ chatMessages: [] }),

  // -- UI ------------------------------------------------------------------
  sidebarOpen: true,
  aiPanelOpen: true,
  sidebarWidth: 260,
  aiPanelWidth: 380,

  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  toggleAiPanel: () => set((state) => ({ aiPanelOpen: !state.aiPanelOpen })),
  setSidebarWidth: (w) => set({ sidebarWidth: w }),
  setAiPanelWidth: (w) => set({ aiPanelWidth: w }),

  // -- Project / Backend ---------------------------------------------------
  projectPath: null,
  isProjectLoading: false,
  backendError: null,
  intentNodes: [],
  intentZoom: 4,
  rightPanelTab: 'ai',

  // -- Self-evolve & simulation -------------------------------------------
  isEvolving: false,
  isSimulating: false,
  simulationResults: null,
  evolutionResults: null,

  setRightPanelTab: (tab) => set({ rightPanelTab: tab }),
  setIntentZoom: (zoom) => set({ intentZoom: zoom }),
  setBackendError: (err) => set({ backendError: err }),

  setProject: async (path: string) => {
    set({ isProjectLoading: true, backendError: null });
    try {
      await api('/project/set', { method: 'POST', body: { path } });
      const tree = await api<FileNode[]>('/files/tree');
      set({
        projectPath: path,
        files: tree,
        isProjectLoading: false,
        backendError: null,
        // Reset editor state for new project
        openTabs: [],
        activeFilePath: null,
        fileContents: new Map(),
        expandedDirs: new Set<string>(),
      });
    } catch (err: any) {
      set({
        isProjectLoading: false,
        backendError: err.message || 'Failed to set project',
      });
    }
  },

  refreshFiles: async () => {
    try {
      const tree = await api<FileNode[]>('/files/tree');
      set({ files: tree });
    } catch (err: any) {
      console.error('Failed to refresh files:', err);
    }
  },

  saveFile: async (path: string) => {
    const state = get();
    const content = state.fileContents.get(path);
    if (content === undefined) return;
    try {
      await api('/files/write', { method: 'POST', body: { path, content } });
      // Mark tab as not modified after save
      set((s) => ({
        openTabs: s.openTabs.map((tab) =>
          tab.path === path ? { ...tab, modified: false } : tab,
        ),
      }));
    } catch (err: any) {
      console.error('Failed to save file:', err);
      set({ backendError: `Save failed: ${err.message}` });
    }
  },

  sendQuery: async (question: string) => {
    const state = get();
    const codeContext =
      state.selectedCode && state.activeFilePath
        ? { filePath: state.activeFilePath, selection: state.selectedCode }
        : undefined;

    // Add user message
    get().addChatMessage({ role: 'user', content: question, codeContext });
    set({ isChatLoading: true });

    try {
      const res = await api<{ answer: string; relevantNodes?: any[]; reasoning?: string }>(
        '/query',
        { method: 'POST', body: { question } },
      );
      get().addChatMessage({ role: 'assistant', content: res.answer });
    } catch (err: any) {
      get().addChatMessage({
        role: 'assistant',
        content: `Error: ${err.message || 'Failed to get response'}`,
      });
    } finally {
      set({ isChatLoading: false });
    }
  },

  loadIntentGraph: async (zoom?: number) => {
    const z = zoom ?? get().intentZoom;
    try {
      const res = await api<{ nodes: IntentNode[]; stats?: any; zoom?: number }>(
        `/intent-graph?zoom=${z}`,
      );
      set({ intentNodes: res.nodes, intentZoom: z });
    } catch (err: any) {
      console.error('Failed to load intent graph:', err);
    }
  },

  updateIntentNode: async (id: string, updates: Partial<IntentNode>) => {
    try {
      await api('/intent-graph/update', {
        method: 'POST',
        body: { id, ...updates },
      });
      // Reload the graph after update
      await get().loadIntentGraph();
    } catch (err: any) {
      console.error('Failed to update intent node:', err);
    }
  },

  addIntentNode: async (parentId: string, title: string, type: string) => {
    try {
      await api('/intent-graph/add', {
        method: 'POST',
        body: { parentId, title, type },
      });
      await get().loadIntentGraph();
    } catch (err: any) {
      console.error('Failed to add intent node:', err);
    }
  },

  executeIntentNode: async (nodeId: string) => {
    set({ isChatLoading: true });
    try {
      const res = await api<{
        stepsExecuted: number;
        stepsSucceeded: number;
        buildPassed: boolean;
      }>('/intent-graph/execute', {
        method: 'POST',
        body: { nodeId },
      });
      get().addChatMessage({
        role: 'assistant',
        content: `Execution complete: ${res.stepsSucceeded}/${res.stepsExecuted} steps succeeded. Build ${res.buildPassed ? 'passed' : 'failed'}.`,
      });
      await get().loadIntentGraph();
    } catch (err: any) {
      get().addChatMessage({
        role: 'assistant',
        content: `Execution error: ${err.message || 'Failed to execute node'}`,
      });
    } finally {
      set({ isChatLoading: false });
    }
  },

  selfEvolve: async () => {
    set({ isEvolving: true });
    try {
      const res = await api<{ iterations: number; results: Array<{ iteration: number; improvementsSucceeded: number; buildPassed: boolean; completeness: { before: number; after: number } }> }>('/project/self-evolve', { method: 'POST', body: { maxIterations: 3 } });
      set({ evolutionResults: res.results });
    } finally {
      set({ isEvolving: false });
    }
  },

  simulateFlows: async () => {
    set({ isSimulating: true });
    try {
      const result = await api<{ flows: Array<{ flow: string; overallValidity: number; issues: Array<{ description: string }> }> }>('/simulate', { method: 'POST', body: {} });
      set({
        simulationResults: result.flows.map(f => ({
          flowName: f.flow,
          validity: f.overallValidity,
          issues: f.issues.map(i => i.description),
        })),
      });
    } catch {
      set({ simulationResults: null });
    } finally {
      set({ isSimulating: false });
    }
  },
}));
