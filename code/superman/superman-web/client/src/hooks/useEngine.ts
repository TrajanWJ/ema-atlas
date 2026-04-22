import { useStore, type Project } from '../store/useStore';

const API = 'http://localhost:3001/api';

export function useEngine() {
  const { setProjects, addProject, updateProject, setGaps, setQueue, setPrompts, setEngineStatus, setTerminalOpen } = useStore();

  async function fetchProjects() {
    const res = await fetch(`${API}/projects`);
    const data = await res.json();
    setProjects(data);
    return data;
  }

  async function analyzeProject(path: string, name: string) {
    setEngineStatus('analyzing');
    setTerminalOpen(true);
    try {
      const res = await fetch(`${API}/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path, name }),
      });
      const data = await res.json();
      if (res.ok) {
        const project: Project = {
          id: data.projectId,
          name: data.name || name,
          path,
          last_analyzed: new Date().toISOString(),
          health_score: data.health,
          gap_count: data.gapCount,
          file_count: data.fileCount,
          function_count: data.functionCount,
          flow_count: data.flowCount,
          created_at: new Date().toISOString(),
        };
        addProject(project);
        setEngineStatus('ready');
        return project;
      }
      setEngineStatus('error');
      return null;
    } catch {
      setEngineStatus('error');
      return null;
    }
  }

  async function reanalyzeProject(projectId: string, path: string, name: string) {
    setEngineStatus('analyzing');
    setTerminalOpen(true);
    try {
      // Delete old entry first so we get fresh data
      await fetch(`${API}/projects/${projectId}`, { method: 'DELETE' });
      const res = await fetch(`${API}/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path, name }),
      });
      const data = await res.json();
      if (res.ok) {
        const updated: Partial<Project> = {
          id: data.projectId,
          last_analyzed: new Date().toISOString(),
          health_score: data.health,
          gap_count: data.gapCount,
          file_count: data.fileCount,
          function_count: data.functionCount,
          flow_count: data.flowCount,
        };
        // Replace old project with new one
        updateProject(projectId, { ...updated, id: projectId });
        // Refresh projects list
        await fetchProjects();
        setEngineStatus('ready');
        return data;
      }
      setEngineStatus('error');
      return null;
    } catch {
      setEngineStatus('error');
      return null;
    }
  }

  async function fetchGaps(projectId: string) {
    const res = await fetch(`${API}/gaps/${projectId}`);
    const data = await res.json();
    setGaps(data.gaps || []);
    return data;
  }

  async function askCodebase(projectId: string, question: string) {
    setTerminalOpen(true);
    const res = await fetch(`${API}/ask`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId, question }),
    });
    return res.json();
  }

  async function simulateFlow(projectId: string, flowName: string) {
    setTerminalOpen(true);
    const res = await fetch(`${API}/simulate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId, flowName }),
    });
    return res.json();
  }

  async function fetchQueue(projectId: string) {
    const res = await fetch(`${API}/projects/${projectId}/queue`);
    const data = await res.json();
    setQueue(data);
    return data;
  }

  async function addToQueue(projectId: string, item: { title: string; type: string; priority: string; complexity: string; description: string }) {
    const res = await fetch(`${API}/projects/${projectId}/queue`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item),
    });
    const data = await res.json();
    fetchQueue(projectId);
    return data;
  }

  async function updateQueueItem(projectId: string, queueId: string, updates: Record<string, string>) {
    await fetch(`${API}/projects/${projectId}/queue/${queueId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    fetchQueue(projectId);
  }

  async function fetchPrompts() {
    const res = await fetch(`${API}/prompts`);
    const data = await res.json();
    setPrompts(data);
    return data;
  }

  async function copyToClipboard(text: string) {
    await navigator.clipboard.writeText(text);
  }

  return {
    fetchProjects, analyzeProject, reanalyzeProject, fetchGaps, askCodebase, simulateFlow,
    fetchQueue, addToQueue, updateQueueItem, fetchPrompts, copyToClipboard,
  };
}
