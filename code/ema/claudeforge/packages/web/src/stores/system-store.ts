import { create } from "zustand";
import type { SystemHealth, TaskRecord } from "@claudeforge/shared";

interface SystemState {
  health: SystemHealth | null;
  tasks: TaskRecord[];
  errors: Array<{ source: string; message: string; severity: string; timestamp: number }>;

  setHealth: (health: SystemHealth) => void;
  setTasks: (tasks: TaskRecord[]) => void;
  addTask: (task: TaskRecord) => void;
  updateTask: (task: TaskRecord) => void;
  addError: (error: { source: string; message: string; severity: string }) => void;
}

export const useSystemStore = create<SystemState>((set) => ({
  health: null,
  tasks: [],
  errors: [],

  setHealth: (health) => set({ health }),
  setTasks: (tasks) => set({ tasks }),

  addTask: (task) =>
    set((state) => ({ tasks: [...state.tasks, task] })),

  updateTask: (task) =>
    set((state) => ({
      tasks: state.tasks.map((t) => (t.id === task.id ? task : t)),
    })),

  addError: (error) =>
    set((state) => ({
      errors: [{ ...error, timestamp: Date.now() }, ...state.errors].slice(0, 100),
    })),
}));
