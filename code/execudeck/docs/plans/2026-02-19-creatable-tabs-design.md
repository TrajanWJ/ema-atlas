# Creatable Tabs with Inline Rename — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a `+` button to the TopBar that creates new session tabs with auto-incrementing names and immediate inline rename.

**Architecture:** Two changes: (1) add `renameTab` action to workspace Zustand store, (2) update TopBar component with `+` button and inline-editing state. Existing `addTab()`/persistence infrastructure handles everything else.

**Tech Stack:** React 19, Zustand 5, TypeScript, Vitest, Tailwind CSS 4, Lucide icons

---

## Task 1: Add `renameTab` action to workspace store

**Files:**
- Modify: `src/state/workspace-store.ts:8-18` (interface) and `:42-48` (implementation)

**Step 1: Add `renameTab` to the interface**

In `src/state/workspace-store.ts`, add `renameTab` to the `WorkspaceState` interface after `switchTab`:

```typescript
interface WorkspaceState {
  tabs: Tab[];
  activeTabId: string | null;
  mode: ViewMode;

  addTab: (tab: Tab) => void;
  removeTab: (tabId: string) => void;
  switchTab: (tabId: string) => void;
  renameTab: (tabId: string, title: string) => void;
  setMode: (mode: ViewMode) => void;
  setTabs: (tabs: Tab[]) => void;
  setActiveTabId: (id: string | null) => void;
}
```

**Step 2: Implement `renameTab` in the store**

Add after the `switchTab` implementation (line 42):

```typescript
  renameTab: (tabId, title) =>
    set((state) => ({
      tabs: state.tabs.map((t) =>
        t.id === tabId ? { ...t, title } : t
      ),
    })),
```

**Step 3: Verify the build compiles**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 4: Commit**

```bash
git add src/state/workspace-store.ts
git commit -m "feat: add renameTab action to workspace store"
```

---

## Task 2: Add `+` button and inline rename to TopBar

**Files:**
- Modify: `src/components/layout/TopBar.tsx` (entire component)

**Step 1: Add state and handler for creating tabs**

Add `useState`, `useRef`, `useCallback` imports from React. Add `addTab` and `renameTab` to the destructured store. Add local state for `editingTabId`. Add a `handleCreateTab` function:

```typescript
'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useWorkspaceStore } from '@/src/state/workspace-store';
import { Button } from '@/src/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/src/components/ui/tooltip';
import { Separator } from '@/src/components/ui/separator';
import { Plus, X, Monitor, Columns2, Terminal } from 'lucide-react';
import { cn } from '@/src/lib/utils';

export function TopBar() {
  const { tabs, activeTabId, mode, switchTab, removeTab, addTab, renameTab, setMode } =
    useWorkspaceStore();

  const [editingTabId, setEditingTabId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleCreateTab = useCallback(() => {
    const id = crypto.randomUUID();
    const title = `Tab ${tabs.length + 1}`;
    addTab({ id, kind: 'session', title, revision: 0 });
    setEditingTabId(id);
  }, [tabs.length, addTab]);

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

  // Auto-focus and select input when editing starts
  useEffect(() => {
    if (editingTabId && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingTabId]);

  // ... rest of return JSX below
```

**Step 2: Update the tab rendering to support inline editing**

Replace the tab `<span>` with a conditional: if `editingTabId === tab.id`, render an `<input>`; otherwise render the `<span>`. Add the `+` button after the `tabs.map()`:

```tsx
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
                className="bg-transparent border-b border-accent-foreground outline-none text-xs w-24"
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

      {/* Mode Toggle — unchanged */}
      {/* ... existing mode toggle code stays identical ... */}
    </div>
  );
```

**Step 3: Verify the build compiles**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 4: Manual smoke test**

Run: `npm run dev`
Verify:
1. `+` button appears after the last tab
2. Clicking `+` creates a new tab named "Tab 3", auto-switches to it, title is editable
3. Typing a name and pressing Enter saves it
4. Pressing Escape keeps the default name
5. Clicking away (blur) saves the name
6. Creating multiple tabs increments the counter

**Step 5: Commit**

```bash
git add src/components/layout/TopBar.tsx
git commit -m "feat: add creatable tabs with inline rename in TopBar"
```
