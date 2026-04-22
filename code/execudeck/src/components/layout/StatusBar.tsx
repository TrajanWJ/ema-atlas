'use client';

import { useWorkspaceStore } from '@/src/state/workspace-store';

export function StatusBar() {
  const { tabs, activeTabId, mode } = useWorkspaceStore();
  const activeTab = tabs.find((t) => t.id === activeTabId);

  return (
    <div className="flex h-6 items-center justify-between border-t border-border bg-card px-3 text-[10px] text-muted-foreground font-mono">
      <div className="flex items-center gap-3">
        <span>
          {activeTab?.title ?? 'No active tab'}
        </span>
        {activeTab?.linkedAgentId && (
          <span className="text-terminal-accent">
            {activeTab.linkedAgentId}
          </span>
        )}
      </div>
      <div className="flex items-center gap-3">
        <span className="uppercase">{mode}</span>
        <span className="h-1.5 w-1.5 rounded-full bg-terminal-accent" />
        <span>Local</span>
      </div>
    </div>
  );
}
