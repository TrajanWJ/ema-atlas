const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error ?? res.statusText);
  }
  return res.json();
}

export const api = {
  // Projects
  getProjects: () => apiFetch<any[]>("/api/projects"),
  openProject: (directory: string, sessionName?: string) =>
    apiFetch("/api/projects/open", {
      method: "POST",
      body: JSON.stringify({ directory, sessionName }),
    }),
  closeProject: (id: string) =>
    apiFetch(`/api/projects/${id}/close`, { method: "POST" }),

  // Sessions
  getSessions: (projectId?: string) =>
    apiFetch<any[]>(`/api/sessions${projectId ? `?projectId=${projectId}` : ""}`),
  getActiveSessions: () => apiFetch<any[]>("/api/sessions/active"),
  getSession: (id: string) => apiFetch<any>(`/api/sessions/${id}`),
  sendMessage: (sessionId: string, content: string) =>
    apiFetch(`/api/sessions/${sessionId}/message`, {
      method: "POST",
      body: JSON.stringify({ content }),
    }),
  stopSession: (id: string) =>
    apiFetch(`/api/sessions/${id}/stop`, { method: "POST" }),
  resumeSession: (id: string) =>
    apiFetch(`/api/sessions/${id}/resume`, { method: "POST" }),

  // Messages
  getMessages: (sessionId: string, limit = 100) =>
    apiFetch<any[]>(`/api/sessions/${sessionId}/messages?limit=${limit}`),

  // Tasks
  getTasks: (status?: string) =>
    apiFetch<any[]>(`/api/tasks${status ? `?status=${status}` : ""}`),
  createTask: (data: any) =>
    apiFetch("/api/tasks", { method: "POST", body: JSON.stringify(data) }),
  updateTask: (id: string, data: any) =>
    apiFetch(`/api/tasks/${id}`, { method: "PATCH", body: JSON.stringify(data) }),

  // System
  getHealth: () => apiFetch<any>("/api/system/health"),
  getStatus: () => apiFetch<any>("/api/system/status"),
  getEvents: (limit = 50) => apiFetch<any[]>(`/api/events?limit=${limit}`),
};
