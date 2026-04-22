'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { useEditorStore } from '@/store/editor-store';
import { api } from '@/lib/api';
import Sidebar from '@/components/Sidebar';
import TabBar from '@/components/TabBar';
import CodeEditor from '@/components/CodeEditor';
import AiPanel from '@/components/AiPanel';
import InsightsPanel from '@/components/InsightsPanel';

const SpatialCanvas = dynamic(
  () => import('@/components/spatial/SpatialCanvas').then((m) => m.default),
  { ssr: false },
);

const SIDEBAR_MIN = 180;
const SIDEBAR_MAX = 400;
const AI_PANEL_MIN = 280;
const AI_PANEL_MAX = 600;

type DragTarget = 'sidebar' | 'ai-panel' | null;
type Overlay = null | 'graph' | 'insights';

export function Editor() {
  const {
    sidebarOpen, aiPanelOpen, sidebarWidth, aiPanelWidth,
    setSidebarWidth, setAiPanelWidth, toggleSidebar, toggleAiPanel,
    projectPath, setProject, isProjectLoading, backendError, setBackendError,
    activeFilePath, saveFile,
  } = useEditorStore();

  const [dragTarget, setDragTarget] = useState<DragTarget>(null);
  const dragStartX = useRef(0);
  const dragStartWidth = useRef(0);
  const [projectInput, setProjectInput] = useState('');
  const [overlay, setOverlay] = useState<Overlay>(null);
  const [indexPhase, setIndexPhase] = useState<string>('idle');

  // Poll indexing phase
  useEffect(() => {
    if (!projectPath) { setIndexPhase('idle'); return; }
    let active = true;
    const poll = async () => {
      try {
        const data = await api<{ phase: string; initialized: boolean; projectPath: string }>('/project/info');
        if (active) setIndexPhase(data.phase || 'idle');
      } catch {}
    };
    poll();
    const interval = setInterval(poll, 2000);
    return () => { active = false; clearInterval(interval); };
  }, [projectPath]);

  // ── Drag-to-resize ──

  const onMouseMove = useCallback((e: MouseEvent) => {
    if (!dragTarget) return;
    if (dragTarget === 'sidebar') {
      const delta = e.clientX - dragStartX.current;
      setSidebarWidth(Math.min(SIDEBAR_MAX, Math.max(SIDEBAR_MIN, dragStartWidth.current + delta)));
    }
    if (dragTarget === 'ai-panel') {
      const delta = dragStartX.current - e.clientX;
      setAiPanelWidth(Math.min(AI_PANEL_MAX, Math.max(AI_PANEL_MIN, dragStartWidth.current + delta)));
    }
  }, [dragTarget, setSidebarWidth, setAiPanelWidth]);

  const onMouseUp = useCallback(() => {
    setDragTarget(null);
    document.body.classList.remove('select-none');
  }, []);

  useEffect(() => {
    if (dragTarget) {
      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
    }
    return () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };
  }, [dragTarget, onMouseMove, onMouseUp]);

  const startDrag = useCallback((target: DragTarget, e: React.MouseEvent) => {
    e.preventDefault();
    setDragTarget(target);
    dragStartX.current = e.clientX;
    dragStartWidth.current = target === 'sidebar' ? sidebarWidth : aiPanelWidth;
    document.body.classList.add('select-none');
  }, [sidebarWidth, aiPanelWidth]);

  // ── Keyboard shortcuts ──

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const mod = e.metaKey || e.ctrlKey;
      if (!mod) return;

      if (e.key === 'b') { e.preventDefault(); toggleSidebar(); }
      if (e.key === 'j') { e.preventDefault(); toggleAiPanel(); }
      if (e.key === 's') {
        e.preventDefault();
        const p = useEditorStore.getState().activeFilePath;
        if (p) useEditorStore.getState().saveFile(p);
      }
      if (e.key === 'g') { e.preventDefault(); setOverlay(overlay === 'graph' ? null : 'graph'); }
      if (e.key === 'i') { e.preventDefault(); setOverlay(overlay === 'insights' ? null : 'insights'); }
      if (e.key === 'Escape') setOverlay(null);
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleSidebar, toggleAiPanel, overlay]);

  const handleLoadProject = useCallback(() => {
    const trimmed = projectInput.trim();
    if (!trimmed) return;
    setProject(trimmed);
  }, [projectInput, setProject]);

  const resolvedSidebarWidth = sidebarOpen ? sidebarWidth : 0;
  const resolvedAiPanelWidth = aiPanelOpen ? aiPanelWidth : 0;

  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col bg-[#0f1117]">
      {/* ── Main area ── */}
      <div className="flex flex-1 min-h-0">
        {/* Sidebar */}
        <div className="shrink-0 overflow-hidden transition-all duration-200" style={{ width: resolvedSidebarWidth }}>
          <div className="h-full" style={{ width: sidebarWidth }}><Sidebar /></div>
        </div>

        {sidebarOpen && (
          <div
            className={`shrink-0 w-[4px] cursor-col-resize z-10 transition-colors duration-150 ${dragTarget === 'sidebar' ? 'bg-[#6366f1]/50' : 'bg-transparent hover:bg-[#6366f1]/30'}`}
            onMouseDown={(e) => startDrag('sidebar', e)}
          />
        )}

        {/* Editor area */}
        <div className="flex-1 min-w-0 flex flex-col bg-[#0f1117]">
          {/* Project loader */}
          {!projectPath && (
            <div className="w-full bg-[#1c1f2e] py-3 px-4 flex items-center gap-3 border-b border-[#2a2d3e]">
              <span className="text-sm text-[#8b8fa7] shrink-0">Set project path:</span>
              <input
                type="text"
                value={projectInput}
                onChange={(e) => { setProjectInput(e.target.value); if (backendError) setBackendError(null); }}
                onKeyDown={(e) => { if (e.key === 'Enter') handleLoadProject(); }}
                placeholder="/path/to/your/project"
                className="bg-[#0f1117] border border-[#2a2d3e] rounded-lg px-3 py-1.5 text-sm text-[#e1e4ed] placeholder:text-[#5c6078] flex-1 max-w-md focus:outline-none focus:border-[#6366f1]"
              />
              <button
                onClick={async () => {
                  try { const d = await api<{ path: string | null }>('/project/pick-folder'); if (d.path) setProjectInput(d.path); } catch {}
                }}
                disabled={isProjectLoading}
                className="bg-[#232738] hover:bg-[#2a2e42] text-[#8b8fa7] hover:text-[#e1e4ed] border border-[#2a2d3e] rounded-lg px-3 py-1.5 text-sm transition-colors disabled:opacity-50 shrink-0 flex items-center gap-1.5"
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"><path d="M1.5 3.5h3l1.5 1.5H12a1 1 0 011 1v5a1 1 0 01-1 1H2a1 1 0 01-1-1v-7z" /></svg>
                Browse
              </button>
              <button
                onClick={handleLoadProject}
                disabled={isProjectLoading || !projectInput.trim()}
                className="bg-[#6366f1] hover:bg-[#818cf8] text-white rounded-lg px-4 py-1.5 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shrink-0"
              >
                {isProjectLoading && (
                  <svg className="animate-spin h-3.5 w-3.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                )}
                Load Project
              </button>
              {backendError && <span className="text-[#f87171] text-xs shrink-0 max-w-[200px] truncate" title={backendError}>{backendError}</span>}
            </div>
          )}
          <TabBar />
          <div className="flex-1 min-h-0 overflow-hidden"><CodeEditor /></div>
        </div>

        {/* AI Panel resize handle */}
        {aiPanelOpen && (
          <div
            className={`shrink-0 w-[4px] cursor-col-resize z-10 transition-colors duration-150 ${dragTarget === 'ai-panel' ? 'bg-[#6366f1]/50' : 'bg-transparent hover:bg-[#6366f1]/30'}`}
            onMouseDown={(e) => startDrag('ai-panel', e)}
          />
        )}

        {/* Right Panel */}
        <div className="shrink-0 overflow-hidden transition-all duration-200" style={{ width: resolvedAiPanelWidth }}>
          <div className="h-full" style={{ width: aiPanelWidth }}><AiPanel /></div>
        </div>
      </div>

      {/* ── Status Bar ── */}
      <div className="shrink-0 h-6 bg-[#1c1f2e] flex items-center justify-between px-3 text-[10px] text-[#5c6078] border-t border-[#2a2d3e]">
        <div className="flex items-center gap-2">
          <button onClick={toggleSidebar} className="flex items-center justify-center p-0.5 rounded hover:bg-[#232738] transition-colors" title="Toggle sidebar (Ctrl+B)">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="text-[#5c6078] hover:text-[#8b8fa7]"><rect x="1" y="2" width="14" height="12" rx="1.5" stroke="currentColor" strokeWidth="1.2" /><line x1="5.5" y1="2" x2="5.5" y2="14" stroke="currentColor" strokeWidth="1.2" /></svg>
          </button>
          <span className="text-[#2a2d3e]">|</span>
          <span className="flex items-center gap-1.5">
            <span className={`inline-block w-1.5 h-1.5 rounded-full ${
              !projectPath ? 'bg-yellow-500'
              : indexPhase === 'fully_indexed' ? 'bg-emerald-500'
              : 'bg-blue-400 animate-pulse'
            }`} />
            {!projectPath ? 'No project'
              : indexPhase === 'structure_ready' ? 'Scanning...'
              : indexPhase === 'flows_ready' ? 'Analyzing flows...'
              : indexPhase === 'fully_indexed' ? 'Ready'
              : 'Indexing...'}
          </span>
          {projectPath && <>
            <span className="text-[#2a2d3e]">|</span>
            <span className="truncate max-w-[200px]" title={projectPath}>{projectPath}</span>
          </>}
        </div>

        <div className="flex items-center gap-2">
          {/* Overlay buttons */}
          <div className="flex items-center gap-0.5">
            <button
              onClick={() => setOverlay(overlay === 'insights' ? null : 'insights')}
              className={`px-1.5 py-0.5 rounded text-[10px] transition-colors ${overlay === 'insights' ? 'bg-[#6366f1]/20 text-[#818cf8]' : 'hover:bg-[#232738] text-[#5c6078]'}`}
              title="Insights (Ctrl+I)"
            >Insights</button>
            <button
              onClick={() => setOverlay(overlay === 'graph' ? null : 'graph')}
              className={`px-1.5 py-0.5 rounded text-[10px] transition-colors ${overlay === 'graph' ? 'bg-[#6366f1]/20 text-[#818cf8]' : 'hover:bg-[#232738] text-[#5c6078]'}`}
              title="Intent Graph (Ctrl+G)"
            >Graph</button>
          </div>

          <span className="text-[#2a2d3e]">|</span>

          <button onClick={toggleAiPanel} className="flex items-center justify-center p-0.5 rounded hover:bg-[#232738] transition-colors" title="Toggle AI panel (Ctrl+J)">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="text-[#5c6078] hover:text-[#8b8fa7]"><rect x="1" y="2" width="14" height="12" rx="1.5" stroke="currentColor" strokeWidth="1.2" /><line x1="10.5" y1="2" x2="10.5" y2="14" stroke="currentColor" strokeWidth="1.2" /><circle cx="12.5" cy="6" r="0.8" fill="currentColor" /><circle cx="12.5" cy="8.5" r="0.8" fill="currentColor" /></svg>
          </button>
        </div>
      </div>

      {/* ── Overlays (popups over the editor) ── */}
      {overlay && (
        <div className="absolute inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setOverlay(null)} />

          {/* Modal */}
          <div className={`relative z-10 rounded-2xl border border-[#2a2d3e] shadow-2xl overflow-hidden ${
            overlay === 'graph' ? 'w-[90vw] h-[85vh] bg-[#050505]' : 'w-[480px] h-[80vh] bg-[#161922]'
          }`}>
            {/* Close button */}
            <button
              onClick={() => setOverlay(null)}
              className="absolute top-3 right-3 z-20 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/50 hover:text-white transition-colors"
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M1 1l10 10M11 1l-10 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
            </button>

            {/* Content */}
            {overlay === 'graph' && <SpatialCanvas />}
            {overlay === 'insights' && <InsightsPanel />}
          </div>
        </div>
      )}
    </div>
  );
}
