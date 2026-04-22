'use client';

import { useWorkspaceStore } from '@/src/state/workspace-store';
import { cn } from '@/src/lib/utils';

interface SplitViewProps {
  terminal: React.ReactNode;
  canvas: React.ReactNode;
}

export function SplitView({ terminal, canvas }: SplitViewProps) {
  const mode = useWorkspaceStore((s) => s.mode);

  return (
    <div
      className={cn(
        'flex-1 min-h-0 grid overflow-hidden',
        mode === 'split' && 'grid-cols-2',
        mode === 'terminal' && 'grid-cols-1',
        mode === 'gui' && 'grid-cols-1'
      )}
    >
      {(mode === 'terminal' || mode === 'split') && (
        <div className="min-h-0 overflow-hidden border-r border-border">
          {terminal}
        </div>
      )}
      {(mode === 'gui' || mode === 'split') && (
        <div className="min-h-0 overflow-hidden">{canvas}</div>
      )}
    </div>
  );
}
