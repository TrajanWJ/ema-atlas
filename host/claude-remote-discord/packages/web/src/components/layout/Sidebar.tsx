"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  FolderOpen,
  Hash,
  ChevronDown,
  ChevronRight,
  Plus,
  LayoutDashboard,
  ListTodo,
  Circle,
  Layers,
} from "lucide-react";
import { useSessionStore } from "@/stores/session-store";
import { OpenLocationDialog } from "./OpenLocationDialog";
import { api } from "@/lib/api";

const STATUS_COLORS: Record<string, string> = {
  active: "bg-success",
  idle: "bg-info",
  stopped: "bg-text-muted",
  error: "bg-error",
};

interface SessionGroupData {
  id: string;
  name: string;
  description: string;
  sessionIds: string[];
}

export function Sidebar({ onSessionSelect }: { onSessionSelect?: () => void } = {}) {
  const { projects, sessions, activeSessionId, setActiveSession } =
    useSessionStore();
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [showOpenDialog, setShowOpenDialog] = useState(false);
  const [search, setSearch] = useState("");
  const [groups, setGroups] = useState<SessionGroupData[]>([]);
  const router = useRouter();

  const fetchGroups = useCallback(() => {
    api.getSessionGroups().then((data) => setGroups(data as SessionGroupData[])).catch(console.error);
  }, []);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  const toggleCollapse = (id: string) => {
    const next = new Set(collapsed);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setCollapsed(next);
  };

  const sessionMap = new Map(sessions.map((s) => [s.id, s]));

  return (
    <aside aria-label="Project sidebar" className="w-64 bg-sidebar border-r border-border flex flex-col shrink-0 overflow-hidden">
      {/* Header */}
      <div className="px-3 py-3 border-b border-border space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-text-primary tracking-wide">
            LOCATIONS
          </span>
          <button
            onClick={() => setShowOpenDialog(true)}
            aria-label="Open location"
            className="text-text-muted hover:text-text-primary transition-colors"
            title="Open location"
          >
            <Plus size={16} />
          </button>
        </div>
        <input
          type="text"
          placeholder="Search sessions..."
          aria-label="Search sessions"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-2 py-1.5 text-sm bg-input border border-border rounded outline-none text-text-primary placeholder-text-muted focus:border-primary focus:ring-2 focus:ring-primary/25"
        />
      </div>

      {/* Session Groups */}
      {groups.length > 0 && !search && (
        <div className="border-b border-border py-2">
          <div className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-text-muted">
            Groups
          </div>
          {groups.map((group) => {
            const isCollapsed = collapsed.has(`group-${group.id}`);
            const groupSessions = group.sessionIds
              .map((sid) => sessionMap.get(sid))
              .filter(Boolean);

            return (
              <div key={group.id} className="mb-0.5">
                <button
                  onClick={() => toggleCollapse(`group-${group.id}`)}
                  className="flex items-center gap-1.5 w-full px-3 py-1 text-xs font-medium text-text-muted hover:text-text-secondary transition-colors"
                >
                  {isCollapsed ? <ChevronRight size={12} /> : <ChevronDown size={12} />}
                  <Layers size={12} className="text-primary/70" />
                  <span className="truncate">{group.name}</span>
                  <span className="ml-auto text-[10px] bg-primary/15 text-primary px-1.5 py-0.5 rounded-full">
                    {groupSessions.length}
                  </span>
                </button>

                {!isCollapsed && groupSessions.map((session) => session && (
                  <button
                    key={session.id}
                    onClick={() => {
                      setActiveSession(session.id);
                      onSessionSelect?.();
                    }}
                    className={`flex items-center gap-2 w-full px-3 py-1.5 ml-2 rounded-r-lg text-sm transition-colors ${
                      activeSessionId === session.id
                        ? "text-primary bg-primary/10 border-l-2 border-primary"
                        : "text-text-secondary hover:text-text-primary hover:bg-primary/5"
                    }`}
                  >
                    <Hash size={14} strokeWidth={1.5} />
                    <span className="truncate">{session.name}</span>
                    <Circle
                      size={6}
                      aria-hidden="true"
                      className={`ml-auto shrink-0 fill-current ${
                        session.status === "active"
                          ? "text-success animate-pulse"
                          : session.status === "idle"
                          ? "text-info"
                          : "text-text-muted"
                      }`}
                    />
                  </button>
                ))}
              </div>
            );
          })}
        </div>
      )}

      {/* Location tree */}
      <div className="flex-1 overflow-y-auto py-2">
        {projects.map((project) => {
          const searchLower = search.toLowerCase();
          const projectSessions = sessions.filter((s) => {
            if (s.projectId !== project.id) return false;
            if (!searchLower) return true;
            return (
              s.name.toLowerCase().includes(searchLower) ||
              project.name.toLowerCase().includes(searchLower)
            );
          });

          // Hide project if search is active and no matching sessions
          if (searchLower && projectSessions.length === 0 && !project.name.toLowerCase().includes(searchLower)) {
            return null;
          }
          const isCollapsed = collapsed.has(project.id);

          return (
            <div key={project.id} className="mb-1">
              {/* Category header */}
              <button
                onClick={() => toggleCollapse(project.id)}
                className="flex items-center gap-1.5 w-full px-3 py-1 text-xs font-medium uppercase tracking-wider text-text-muted hover:text-text-secondary transition-colors"
              >
                {isCollapsed ? (
                  <ChevronRight size={12} />
                ) : (
                  <ChevronDown size={12} />
                )}
                <FolderOpen size={12} />
                <span className="truncate">{project.name}</span>
                <span className="ml-auto text-[10px] bg-surface-elevated px-1.5 py-0.5 rounded-full">
                  {projectSessions.length}
                </span>
              </button>

              {/* Sessions */}
              {!isCollapsed && (
                <>
                  {projectSessions.map((session) => (
                    <button
                      key={session.id}
                      onClick={() => {
                        setActiveSession(session.id);
                        onSessionSelect?.();
                      }}
                      className={`flex items-center gap-2 w-full px-3 py-1.5 ml-2 rounded-r-lg text-sm transition-colors ${
                        activeSessionId === session.id
                          ? "text-primary bg-primary/10 border-l-2 border-primary"
                          : "text-text-secondary hover:text-text-primary hover:bg-primary/5"
                      }`}
                    >
                      <Hash size={14} strokeWidth={1.5} />
                      <span className="truncate">{session.name}</span>
                      <span className="sr-only">{session.status}</span>
                      <Circle
                        size={6}
                        aria-hidden="true"
                        className={`ml-auto shrink-0 fill-current ${
                          session.status === "active"
                            ? "text-success animate-pulse"
                            : session.status === "idle"
                            ? "text-info"
                            : "text-text-muted"
                        }`}
                      />
                    </button>
                  ))}
                  {projectSessions.length === 0 && (
                    <div className="px-3 py-1.5 ml-4 text-xs text-text-muted">
                      No sessions
                    </div>
                  )}
                </>
              )}
            </div>
          );
        })}

        {projects.length === 0 && (
          <div className="px-4 py-8 text-center text-text-muted text-sm">
            No locations open.
            <br />
            Use <code className="text-text-secondary">/open</code> in Discord
            <br />
            or click + above.
          </div>
        )}
      </div>

      {/* Bottom section */}
      <div className="border-t border-border px-3 py-2">
        <button
          onClick={() => router.push("/system")}
          className="flex items-center gap-2 w-full px-2 py-1.5 rounded text-sm text-text-secondary hover:text-text-primary hover:bg-primary/5 transition-colors"
        >
          <LayoutDashboard size={16} strokeWidth={1.5} />
          Command Center
        </button>
        <button
          onClick={() => router.push("/tasks")}
          className="flex items-center gap-2 w-full px-2 py-1.5 rounded text-sm text-text-secondary hover:text-text-primary hover:bg-primary/5 transition-colors"
        >
          <ListTodo size={16} strokeWidth={1.5} />
          Tasks
        </button>
      </div>
      {showOpenDialog && (
        <OpenLocationDialog onClose={() => setShowOpenDialog(false)} />
      )}
    </aside>
  );
}
