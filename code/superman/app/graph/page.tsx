'use client';

import dynamic from 'next/dynamic';
import { useEditorStore } from '@/store/editor-store';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

const SpatialCanvas = dynamic(
  () => import('@/components/spatial/SpatialCanvas').then((mod) => mod.default),
  { ssr: false },
);

export default function GraphPage() {
  const { projectPath, setProject, isProjectLoading, backendError, setBackendError } = useEditorStore();
  const [projectInput, setProjectInput] = useState('');

  // If no project loaded, show loader
  if (!projectPath) {
    return (
      <div className="h-screen w-screen bg-black flex items-center justify-center">
        <div className="flex flex-col items-center gap-6 max-w-md">
          <h1 className="text-lg font-medium text-white/80">Spatial Intent Graph</h1>
          <p className="text-sm text-white/30 text-center">
            Enter a project path to explore its intent graph as an interactive spatial map.
          </p>
          <div className="flex gap-2 w-full">
            <input
              type="text"
              value={projectInput}
              onChange={(e) => {
                setProjectInput(e.target.value);
                if (backendError) setBackendError(null);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && projectInput.trim()) setProject(projectInput.trim());
              }}
              placeholder="/path/to/project"
              className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-white/20"
            />
            <button
              onClick={async () => {
                try {
                  const data = await api<{ path: string | null }>('/project/pick-folder');
                  if (data.path) setProjectInput(data.path);
                } catch {}
              }}
              disabled={isProjectLoading}
              className="bg-white/5 hover:bg-white/10 border border-white/10 text-white/50 hover:text-white text-sm rounded-xl px-4 py-2.5 transition-colors disabled:opacity-30 flex items-center gap-1.5"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
                <path d="M1.5 3.5h3l1.5 1.5H12a1 1 0 011 1v5a1 1 0 01-1 1H2a1 1 0 01-1-1v-7z" />
              </svg>
              Browse
            </button>
            <button
              onClick={() => projectInput.trim() && setProject(projectInput.trim())}
              disabled={isProjectLoading || !projectInput.trim()}
              className="bg-white/10 hover:bg-white/15 text-white text-sm font-medium rounded-xl px-5 py-2.5 transition-colors disabled:opacity-30"
            >
              {isProjectLoading ? 'Loading...' : 'Load'}
            </button>
          </div>
          {backendError && (
            <p className="text-xs text-red-400">{backendError}</p>
          )}
          <p className="text-[11px] text-white/15">
            Make sure the backend is running: npm run dev:backend
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen bg-black overflow-hidden">
      {/* Floating header */}
      <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-5 py-3 pointer-events-none">
        <div className="pointer-events-auto flex items-center gap-3">
          <a
            href="/"
            className="text-[11px] text-white/20 hover:text-white/40 transition-colors"
          >
            ← Editor
          </a>
          <span className="text-white/10">|</span>
          <span className="text-[11px] text-white/30 truncate max-w-[300px]">
            {projectPath}
          </span>
        </div>
      </div>

      <SpatialCanvas />
    </div>
  );
}
