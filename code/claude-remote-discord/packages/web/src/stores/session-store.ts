import { create } from "zustand";
import type { SessionRecord, ProjectLocation, ChatMessage } from "@claudeforge/shared";

interface SessionState {
  projects: ProjectLocation[];
  sessions: SessionRecord[];
  activeSessionId: string | null;
  messages: Map<string, ChatMessage[]>;
  streamingText: Map<string, string>;

  setProjects: (projects: ProjectLocation[]) => void;
  setSessions: (sessions: SessionRecord[]) => void;
  setActiveSession: (id: string | null) => void;
  addSession: (session: SessionRecord) => void;
  updateSession: (session: SessionRecord) => void;
  removeSession: (id: string) => void;
  addProject: (project: ProjectLocation) => void;
  updateProject: (project: ProjectLocation) => void;
  setMessages: (sessionId: string, messages: ChatMessage[]) => void;
  addMessage: (message: ChatMessage) => void;
  appendStreamText: (sessionId: string, text: string) => void;
  clearStreamText: (sessionId: string) => void;
}

export const useSessionStore = create<SessionState>((set) => ({
  projects: [],
  sessions: [],
  activeSessionId: null,
  messages: new Map(),
  streamingText: new Map(),

  setProjects: (projects) => set({ projects }),
  setSessions: (sessions) => set({ sessions }),
  setActiveSession: (id) => set({ activeSessionId: id }),

  addSession: (session) =>
    set((state) => ({ sessions: [...state.sessions, session] })),

  updateSession: (session) =>
    set((state) => ({
      sessions: state.sessions.map((s) => (s.id === session.id ? session : s)),
    })),

  removeSession: (id) =>
    set((state) => ({
      sessions: state.sessions.filter((s) => s.id !== id),
    })),

  addProject: (project) =>
    set((state) => ({ projects: [...state.projects, project] })),

  updateProject: (project) =>
    set((state) => ({
      projects: state.projects.map((p) => (p.id === project.id ? project : p)),
    })),

  setMessages: (sessionId, messages) =>
    set((state) => {
      const newMap = new Map(state.messages);
      newMap.set(sessionId, messages);
      return { messages: newMap };
    }),

  addMessage: (message) =>
    set((state) => {
      const newMap = new Map(state.messages);
      const existing = newMap.get(message.sessionId) ?? [];
      newMap.set(message.sessionId, [...existing, message]);
      return { messages: newMap };
    }),

  appendStreamText: (sessionId, text) =>
    set((state) => {
      const newMap = new Map(state.streamingText);
      const existing = newMap.get(sessionId) ?? "";
      newMap.set(sessionId, existing + text);
      return { streamingText: newMap };
    }),

  clearStreamText: (sessionId) =>
    set((state) => {
      const newMap = new Map(state.streamingText);
      newMap.delete(sessionId);
      return { streamingText: newMap };
    }),
}));
