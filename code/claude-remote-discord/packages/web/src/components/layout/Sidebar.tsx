"use client";

import { useState } from "react";
import {
  FolderOpen,
  Hash,
  ChevronDown,
  ChevronRight,
  Plus,
  LayoutDashboard,
  ListTodo,
  Circle,
} from "lucide-react";
import { useSessionStore } from "@/stores/session-store";

const STATUS_COLORS: Record<string, string> = {
  active: "bg-success",
  idle: "bg-info",
  stopped: "bg-text-muted",
  error: "bg-error",
};

export function Sidebar() {
  const { projects, sessions, activeSessionId, setActiveSession } =
    useSessionStore();
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  const toggleCollapse = (id: string) => {
    const next = new Set(collapsed);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setCollapsed(next);
  };

  return (
    <aside className="w-64 bg-sidebar border-r border-border flex flex-col shrink-0 overflow-hidden">
      {/* Header */}
      <div className="px-3 py-3 border-b border-border">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-text-primary tracking-wide">
            LOCATIONS
          </span>
          <button
            className="text-text-muted hover:text-text-primary transition-colors"
            title="Open location"
          >
            <Plus size={16} />
          </button>
        </div>
      </div>

      {/* Location tree */}
      <div className="flex-1 overflow-y-auto py-2">
        {projects.map((project) => {
          const projectSessions = sessions.filter(
            (s) => s.projectId === project.id
          );
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
              </button>

              {/* Sessions */}
              {!isCollapsed &&
                projectSessions.map((session) => (
                  <button
                    key={session.id}
                    onClick={() => setActiveSession(session.id)}
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
        <button className="flex items-center gap-2 w-full px-2 py-1.5 rounded text-sm text-text-secondary hover:text-text-primary hover:bg-primary/5 transition-colors">
          <LayoutDashboard size={16} strokeWidth={1.5} />
          Command Center
        </button>
        <button className="flex items-center gap-2 w-full px-2 py-1.5 rounded text-sm text-text-secondary hover:text-text-primary hover:bg-primary/5 transition-colors">
          <ListTodo size={16} strokeWidth={1.5} />
          Tasks
        </button>
      </div>
    </aside>
  );
}
