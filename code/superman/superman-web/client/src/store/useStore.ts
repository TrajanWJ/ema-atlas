import { create } from 'zustand';

export interface Project {
  id: string;
  name: string;
  path: string;
  last_analyzed: string | null;
  health_score: number;
  gap_count: number;
  file_count: number;
  function_count: number;
  flow_count: number;
  created_at: string;
}

export interface Gap {
  id: string;
  type: string;
  system: string;
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  suggestedFix: string;
  affectedNodes: string[];
}

export interface QueueItem {
  id: string;
  project_id: string;
  title: string;
  type: 'feature' | 'bug' | 'refactor' | 'perf';
  priority: 'P0' | 'P1' | 'P2';
  complexity: 'S' | 'M' | 'L' | 'XL';
  status: 'backlog' | 'in_progress' | 'done';
  description: string;
  generated_prompt: string | null;
  created_at: string;
}

export interface Prompt {
  id: string;
  title: string;
  category: string;
  description: string;
  content: string;
  tags: string;
  starred: number;
  last_used: string | null;
  created_at: string;
}

export interface TerminalLine {
  type: 'info' | 'error' | 'warning' | 'success';
  text: string;
  timestamp: number;
}

export interface HistoryEntry {
  id: string;
  action: string;
  detail: string;
  timestamp: number;
  status: 'success' | 'error' | 'pending';
}

interface Store {
  // Projects
  projects: Project[];
  activeProject: Project | null;
  setProjects: (projects: Project[]) => void;
  setActiveProject: (project: Project | null) => void;
  addProject: (project: Project) => void;

  // Gaps
  gaps: Gap[];
  setGaps: (gaps: Gap[]) => void;

  // Queue
  queue: QueueItem[];
  setQueue: (queue: QueueItem[]) => void;

  // Prompts
  prompts: Prompt[];
  setPrompts: (prompts: Prompt[]) => void;

  // Terminal
  terminalLines: TerminalLine[];
  terminalOpen: boolean;
  addTerminalLine: (line: TerminalLine) => void;
  clearTerminal: () => void;
  setTerminalOpen: (open: boolean) => void;

  // Engine status
  engineStatus: 'ready' | 'analyzing' | 'error';
  setEngineStatus: (status: 'ready' | 'analyzing' | 'error') => void;

  // Analysis progress
  analysisProgress: { phase: string; percent: number } | null;
  setAnalysisProgress: (progress: { phase: string; percent: number } | null) => void;
  updateProject: (id: string, updates: Partial<Project>) => void;

  // Active tab for project view
  activeTab: string;
  setActiveTab: (tab: string) => void;

  // History
  history: HistoryEntry[];
  addHistoryEntry: (entry: HistoryEntry) => void;
  clearHistory: () => void;
}

export const useStore = create<Store>((set) => ({
  projects: [],
  activeProject: null,
  setProjects: (projects) => set({ projects }),
  setActiveProject: (project) => set({ activeProject: project }),
  addProject: (project) => set((s) => ({ projects: [...s.projects, project] })),

  gaps: [],
  setGaps: (gaps) => set({ gaps }),

  queue: [],
  setQueue: (queue) => set({ queue }),

  prompts: [],
  setPrompts: (prompts) => set({ prompts }),

  terminalLines: [],
  terminalOpen: false,
  addTerminalLine: (line) => set((s) => ({ terminalLines: [...s.terminalLines.slice(-500), line] })),
  clearTerminal: () => set({ terminalLines: [] }),
  setTerminalOpen: (open) => set({ terminalOpen: open }),

  engineStatus: 'ready',
  setEngineStatus: (status) => set({ engineStatus: status }),

  analysisProgress: null,
  setAnalysisProgress: (progress) => set({ analysisProgress: progress }),
  updateProject: (id, updates) => set((s) => ({
    projects: s.projects.map(p => p.id === id ? { ...p, ...updates } : p),
  })),

  activeTab: 'overview',
  setActiveTab: (tab) => set({ activeTab: tab }),

  history: [],
  addHistoryEntry: (entry) => set((s) => ({ history: [...s.history.slice(-200), entry] })),
  clearHistory: () => set({ history: [] }),
}));
