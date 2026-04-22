import { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import { TerminalPanel } from './components/TerminalPanel';
import { useSocket } from './hooks/useSocket';
import { useEngine } from './hooks/useEngine';
import Dashboard from './pages/Dashboard';
import Project from './pages/Project';
import Pipeline from './pages/Pipeline';
import PromptLibrary from './pages/PromptLibrary';
import SettingsPage from './pages/Settings';

export default function App() {
  useSocket();
  const { fetchProjects, fetchPrompts } = useEngine();

  // Rehydrate from server on every page load / refresh
  useEffect(() => {
    fetchProjects();
    fetchPrompts();
  }, []);

  return (
    <div className="min-h-screen bg-bg">
      <Sidebar />
      <main className="ml-60 min-h-screen">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/project/:id" element={<Project />} />
          <Route path="/pipeline" element={<Pipeline />} />
          <Route path="/prompts" element={<PromptLibrary />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
      </main>
      <TerminalPanel />
    </div>
  );
}
