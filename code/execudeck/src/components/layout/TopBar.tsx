'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useWorkspaceStore } from '@/src/state/workspace-store';
import { Button } from '@/src/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/src/components/ui/tooltip';
import { Separator } from '@/src/components/ui/separator';
import { Plus, X, Monitor, Columns2, Terminal } from 'lucide-react';
import { cn } from '@/src/lib/utils';

export function TopBar() {
  const { tabs, activeTabId, mode, nextTabNumber, switchTab, removeTab, addTab, renameTab, setMode } =
    useWorkspaceStore();

  const [editingTabId, setEditingTabId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleCreateTab = useCallback(() => {
    const id = crypto.randomUUID();
    const title = `Tab ${nextTabNumber}`;
    addTab({ id, kind: 'session', title, revision: 0 });
    setEditingTabId(id);
  }, [nextTabNumber, addTab]);

  const handleRenameCommit = useCallback(
    (tabId: string, value: string) => {
      const trimmed = value.trim();
      if (trimmed) {
        renameTab(tabId, trimmed);
      }
      setEditingTabId(null);
    },
    [renameTab]
  );

  const handleRenameCancel = useCallback(() => {
    setEditingTabId(null);
  }, []);

  useEffect(() => {
    if (editingTabId && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingTabId]);

  return (
    <div className="flex h-10 items-center border-b border-border bg-card px-2 gap-1">
      {/* Tabs */}
      <div className="flex items-center gap-0.5 overflow-x-auto flex-1 min-w-0">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => switchTab(tab.id)}
            className={cn(
              'group flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-medium transition-colors whitespace-nowrap',
              activeTabId === tab.id
                ? 'bg-accent text-accent-foreground'
                : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'
            )}
          >
            {editingTabId === tab.id ? (
              <input
                ref={inputRef}
                defaultValue={tab.title}
                className="bg-transparent border-b border-accent-foreground outline-none text-xs max-w-[140px]"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleRenameCommit(tab.id, e.currentTarget.value);
                  } else if (e.key === 'Escape') {
                    handleRenameCancel();
                  }
                }}
                onBlur={(e) => handleRenameCommit(tab.id, e.currentTarget.value)}
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <span className="truncate max-w-[140px]">{tab.title}</span>
            )}
            {tabs.length > 1 && (
              <X
                className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                onClick={(e) => {
                  e.stopPropagation();
                  removeTab(tab.id);
                }}
              />
            )}
          </button>
        ))}

        {/* New Tab Button */}
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={handleCreateTab}
              className="flex items-center justify-center h-6 w-6 rounded-md text-muted-foreground hover:bg-accent/50 hover:text-foreground transition-colors shrink-0"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </TooltipTrigger>
          <TooltipContent>New Tab</TooltipContent>
        </Tooltip>
      </div>

      <Separator orientation="vertical" className="h-5 mx-1" />

      {/* Mode Toggle */}
      <div className="flex items-center gap-0.5">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className={cn('h-7 w-7', mode === 'terminal' && 'bg-accent')}
              onClick={() => setMode('terminal')}
            >
              <Terminal className="h-3.5 w-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Terminal Only</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className={cn('h-7 w-7', mode === 'split' && 'bg-accent')}
              onClick={() => setMode('split')}
            >
              <Columns2 className="h-3.5 w-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Split View</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className={cn('h-7 w-7', mode === 'gui' && 'bg-accent')}
              onClick={() => setMode('gui')}
            >
              <Monitor className="h-3.5 w-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Canvas Only</TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
}
