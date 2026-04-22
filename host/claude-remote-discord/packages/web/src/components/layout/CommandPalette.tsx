"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useFocusTrap } from "@/hooks/useFocusTrap";
import {
  Search,
  MessageSquare,
  FolderOpen,
  Square,
  Play,
  FileDown,
  LayoutGrid,
  Bot,
  Monitor,
  BarChart3,
  GitFork,
  GitCompareArrows,
  Keyboard,
} from "lucide-react";
import { useSessionStore } from "@/stores/session-store";
import { api } from "@/lib/api";
import { useToastStore } from "@/components/ui/Toast";

interface PaletteItem {
  id: string;
  label: string;
  description?: string;
  icon: typeof Search;
  category: "session" | "project" | "command" | "navigation";
  action: () => void;
}

export function CommandPalette({
  open,
  onClose,
  onCompare,
  onShowShortcuts,
}: {
  open: boolean;
  onClose: () => void;
  onCompare?: (a: string, b: string) => void;
  onShowShortcuts?: () => void;
}) {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const trapRef = useFocusTrap(open);
  const router = useRouter();
  const sessionStore = useSessionStore();
  const addToast = useToastStore((s) => s.addToast);

  const items = useMemo<PaletteItem[]>(() => {
    const result: PaletteItem[] = [];

    // Sessions
    for (const session of sessionStore.sessions) {
      result.push({
        id: `session-${session.id}`,
        label: session.name,
        description: `${session.projectName} — ${session.status}`,
        icon: MessageSquare,
        category: "session",
        action: () => {
          sessionStore.setActiveSession(session.id);
          router.push("/");
        },
      });

      // Fork action for each session
      if (session.status !== "error") {
        result.push({
          id: `fork-${session.id}`,
          label: `Fork: ${session.name}`,
          description: "Create a branching copy of this session",
          icon: GitFork,
          category: "command",
          action: async () => {
            try {
              const forked = await api.forkSession(session.id);
              sessionStore.addSession(forked);
              sessionStore.setActiveSession(forked.id);
              addToast("success", `Forked session: ${forked.name}`);
            } catch (err: unknown) {
              addToast("error", `Fork failed: ${err instanceof Error ? err.message : "Unknown error"}`);
            }
          },
        });
      }
    }

    // Projects
    for (const project of sessionStore.projects) {
      result.push({
        id: `project-${project.id}`,
        label: project.name,
        description: project.directory,
        icon: FolderOpen,
        category: "project",
        action: () => {
          const projectSessions = sessionStore.sessions.filter(
            (s) => s.projectId === project.id
          );
          if (projectSessions.length > 0) {
            sessionStore.setActiveSession(projectSessions[0].id);
          }
          router.push("/");
        },
      });
    }

    // Commands
    const activeSession = sessionStore.sessions.find(
      (s) => s.id === sessionStore.activeSessionId
    );

    if (activeSession) {
      if (activeSession.status === "active" || activeSession.status === "idle") {
        result.push({
          id: "cmd-stop",
          label: "Stop Session",
          description: `Stop ${activeSession.name}`,
          icon: Square,
          category: "command",
          action: () => {
            api.stopSession(activeSession.id).catch(console.error);
          },
        });
      }
      if (activeSession.status === "stopped") {
        result.push({
          id: "cmd-resume",
          label: "Resume Session",
          description: `Resume ${activeSession.name}`,
          icon: Play,
          category: "command",
          action: () => {
            api.resumeSession(activeSession.id).catch(console.error);
          },
        });
      }
      result.push({
        id: "cmd-export",
        label: "Export Session",
        description: `Export ${activeSession.name} as markdown`,
        icon: FileDown,
        category: "command",
        action: () => {
          api.exportSession(activeSession.id).catch(console.error);
          addToast("info", "Session exported");
        },
      });
    }

    // Compare sessions (need at least 2 sessions)
    if (onCompare && sessionStore.sessions.length >= 2) {
      result.push({
        id: "cmd-compare",
        label: "Compare Sessions",
        description: "Compare cost, messages, and tokens between two sessions",
        icon: GitCompareArrows,
        category: "command",
        action: () => {
          const sorted = [...sessionStore.sessions].sort((a, b) => b.lastActivity - a.lastActivity);
          if (sorted.length >= 2) {
            onCompare(sorted[0].id, sorted[1].id);
          }
        },
      });
    }

    // Keyboard shortcuts
    if (onShowShortcuts) {
      result.push({
        id: "cmd-shortcuts",
        label: "Keyboard Shortcuts",
        description: "Show all keyboard shortcuts",
        icon: Keyboard,
        category: "command",
        action: () => onShowShortcuts(),
      });
    }

    // Navigation
    const navItems = [
      { path: "/", label: "Go to Sessions", icon: MessageSquare },
      { path: "/tasks", label: "Go to Tasks", icon: LayoutGrid },
      { path: "/agents", label: "Go to Agents", icon: Bot },
      { path: "/analytics", label: "Go to Analytics", icon: BarChart3 },
      { path: "/system", label: "Go to System", icon: Monitor },
    ];

    for (const nav of navItems) {
      result.push({
        id: `nav-${nav.path}`,
        label: nav.label,
        icon: nav.icon,
        category: "navigation",
        action: () => router.push(nav.path),
      });
    }

    return result;
  }, [sessionStore.sessions, sessionStore.projects, sessionStore.activeSessionId]);

  const filtered = useMemo(() => {
    if (!query.trim()) return items;
    const q = query.toLowerCase();
    return items.filter(
      (item) =>
        item.label.toLowerCase().includes(q) ||
        item.description?.toLowerCase().includes(q)
    );
  }, [items, query]);

  // Reset index when results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [filtered.length]);

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setQuery("");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  // Scroll selected item into view
  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const selected = list.children[selectedIndex] as HTMLElement | undefined;
    selected?.scrollIntoView({ block: "nearest" });
  }, [selectedIndex]);

  const execute = useCallback(
    (index: number) => {
      const item = filtered[index];
      if (!item) return;
      item.action();
      onClose();
    },
    [filtered, onClose]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setSelectedIndex((i) => Math.min(i + 1, filtered.length - 1));
          break;
        case "ArrowUp":
          e.preventDefault();
          setSelectedIndex((i) => Math.max(i - 1, 0));
          break;
        case "Enter":
          e.preventDefault();
          execute(selectedIndex);
          break;
        case "Escape":
          e.preventDefault();
          onClose();
          break;
      }
    },
    [filtered.length, selectedIndex, execute, onClose]
  );

  if (!open) return null;

  const CATEGORY_LABELS: Record<string, string> = {
    session: "SESSIONS",
    project: "PROJECTS",
    command: "COMMANDS",
    navigation: "NAVIGATION",
  };

  // Group by category
  let lastCategory = "";
  let itemIndex = -1;

  return (
    <div className="fixed inset-0 z-[200] flex items-start justify-center pt-[15vh]" role="dialog" aria-modal="true" aria-label="Command palette" ref={trapRef}>
      <div className="fixed inset-0 bg-black/60" onClick={onClose} aria-hidden="true" />
      <div className="relative w-full max-w-lg mx-4 bg-surface border border-border rounded-xl shadow-2xl overflow-hidden animate-fade-in">
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
          <Search size={18} strokeWidth={1.5} className="text-text-muted shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search sessions, projects, commands..."
            className="flex-1 bg-transparent text-text-primary text-sm outline-none placeholder:text-text-muted"
          />
          <kbd className="text-[10px] text-text-muted bg-void px-1.5 py-0.5 rounded border border-border">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div ref={listRef} className="max-h-[50vh] overflow-y-auto py-2">
          {filtered.length === 0 && (
            <div className="px-4 py-8 text-center text-text-muted text-sm">
              No results for "{query}"
            </div>
          )}

          {filtered.map((item) => {
            itemIndex++;
            const currentIndex = itemIndex;
            const showCategory = item.category !== lastCategory;
            lastCategory = item.category;
            const Icon = item.icon;

            return (
              <div key={item.id}>
                {showCategory && (
                  <div className="px-4 pt-3 pb-1 text-[11px] font-medium tracking-wider text-text-muted uppercase">
                    {CATEGORY_LABELS[item.category]}
                  </div>
                )}
                <button
                  onClick={() => execute(currentIndex)}
                  onMouseEnter={() => setSelectedIndex(currentIndex)}
                  className={`w-full flex items-center gap-3 px-4 py-2 text-left transition-colors ${
                    currentIndex === selectedIndex
                      ? "bg-primary/10 text-primary"
                      : "text-text-secondary hover:bg-primary/5"
                  }`}
                >
                  <Icon size={16} strokeWidth={1.5} className="shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm truncate">{item.label}</div>
                    {item.description && (
                      <div className="text-xs text-text-muted truncate">
                        {item.description}
                      </div>
                    )}
                  </div>
                </button>
              </div>
            );
          })}
        </div>

        {/* Footer hint */}
        <div className="px-4 py-2 border-t border-border flex items-center gap-4 text-[11px] text-text-muted">
          <span>
            <kbd className="bg-void px-1 py-0.5 rounded border border-border mr-1">↑↓</kbd>
            Navigate
          </span>
          <span>
            <kbd className="bg-void px-1 py-0.5 rounded border border-border mr-1">↵</kbd>
            Select
          </span>
          <span>
            <kbd className="bg-void px-1 py-0.5 rounded border border-border mr-1">Esc</kbd>
            Close
          </span>
        </div>
      </div>
    </div>
  );
}
