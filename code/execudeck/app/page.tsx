'use client';

import { useEffect } from 'react';
import { TopBar } from '@/src/components/layout/TopBar';
import { SplitView } from '@/src/components/layout/SplitView';
import { StatusBar } from '@/src/components/layout/StatusBar';
import { TerminalSurface } from '@/src/components/terminal/TerminalSurface';
import { CanvasSurface } from '@/src/components/canvas/CanvasSurface';
import { useWorkspaceStore } from '@/src/state/workspace-store';
import { usePersistence } from '@/src/hooks/use-persistence';

export default function Home() {
  usePersistence();

  const setMode = useWorkspaceStore((s) => s.setMode);

  // Keyboard shortcuts: Ctrl+1/2/3 for mode switching
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (!e.ctrlKey) return;
      switch (e.key) {
        case '1':
          e.preventDefault();
          setMode('terminal');
          break;
        case '2':
          e.preventDefault();
          setMode('split');
          break;
        case '3':
          e.preventDefault();
          setMode('gui');
          break;
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setMode]);

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background">
      <TopBar />
      <SplitView
        terminal={<TerminalSurface />}
        canvas={<CanvasSurface />}
      />
      <StatusBar />
    </div>
  );
}
