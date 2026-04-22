"use client";

import { Suspense, useMemo } from "react";
import { Layout } from "@/components/layout/Layout";
import { useSystemStore } from "@/stores/system-store";
import { LayoutGrid, Plus, Clock, Bot, ListFilter, AlertTriangle } from "lucide-react";
import type { TaskRecord, TaskStatus } from "@claudeforge/shared";
import { SavedViewBar } from "@/components/ui/SavedViewBar";
import { ViewModeSwitcher } from "@/components/ui/ViewModeSwitcher";
import { StatusChip } from "@/components/ui/StatusChip";
import { NeedsAttentionBadge } from "@/components/ui/NeedsAttentionBadge";
import { TrustBadge } from "@/components/ui/TrustBadge";
import { useViewUrlState } from "@/hooks/useViewUrlState";

const COLUMNS: { status: TaskStatus; label: string; color: string }[] = [
  { status: "backlog", label: "Backlog", color: "text-text-secondary" },
  { status: "in_progress", label: "In Progress", color: "text-info" },
  { status: "review", label: "Review", color: "text-warning" },
  { status: "done", label: "Done", color: "text-success" },
];

const SAVED_VIEWS = ["All Work", "Needs Review", "Assigned Agents", "Done Recently"] as const;
type SavedView = (typeof SAVED_VIEWS)[number];
type ViewMode = "board" | "list";

const PRIORITY_TONE: Record<string, "neutral" | "success" | "warning" | "error"> = {
  low: "neutral",
  normal: "neutral",
  high: "warning",
  critical: "error",
};

function formatAge(createdAt: number) {
  const age = Math.floor((Date.now() - createdAt) / 60000);
  return age < 60 ? `${age}m` : `${Math.floor(age / 60)}h`;
}

function TaskCard({ task }: { task: TaskRecord }) {
  return (
    <div className="bg-surface border border-border rounded-lg p-3 hover:border-primary/25 transition-colors cursor-pointer">
      <div className="flex items-start justify-between gap-2">
        <span className="text-sm font-medium text-text-primary line-clamp-2">
          {task.title}
        </span>
        <StatusChip tone={PRIORITY_TONE[task.priority] ?? "neutral"}>{task.priority}</StatusChip>
      </div>
      {task.description && (
        <p className="text-xs text-text-muted mt-1 line-clamp-2">{task.description}</p>
      )}
      <div className="flex items-center gap-2 mt-3 flex-wrap">
        <TrustBadge state={task.status === "done" ? "verified" : task.status === "review" ? "observed" : "inferred"} />
        {task.agent && (
          <span className="flex items-center gap-1 text-xs text-text-muted">
            <Bot size={10} /> {task.agent}
          </span>
        )}
        <span className="flex items-center gap-1 ml-auto text-xs text-text-muted">
          <Clock size={10} /> {formatAge(task.createdAt)}
        </span>
      </div>
    </div>
  );
}

function TaskRow({ task }: { task: TaskRecord }) {
  return (
    <div className="grid grid-cols-[minmax(0,2fr)_auto_auto_auto] gap-3 items-center px-4 py-3 border-b border-border last:border-b-0">
      <div className="min-w-0">
        <div className="text-sm font-medium text-text-primary truncate">{task.title}</div>
        {task.description && <div className="text-xs text-text-muted truncate mt-0.5">{task.description}</div>}
      </div>
      <StatusChip tone={PRIORITY_TONE[task.priority] ?? "neutral"}>{task.priority}</StatusChip>
      <TrustBadge state={task.status === "done" ? "verified" : task.status === "review" ? "observed" : "inferred"} />
      <div className="text-xs text-text-muted text-right">
        {task.agent ?? "unassigned"} · {formatAge(task.createdAt)}
      </div>
    </div>
  );
}

function TasksPageInner() {
  const { tasks } = useSystemStore();
  const { state, setFocus, setView } = useViewUrlState({ defaultView: "board" });

  const activeView = useMemo<SavedView>(() => {
    const raw = state.focus?.startsWith("view:") ? state.focus.slice(5) : null;
    return SAVED_VIEWS.includes((raw ?? "") as SavedView) ? (raw as SavedView) : "All Work";
  }, [state.focus]);

  const mode: ViewMode = state.view === "list" ? "list" : "board";

  const filteredTasks = useMemo(() => {
    switch (activeView) {
      case "Needs Review":
        return tasks.filter((task) => task.status === "review");
      case "Assigned Agents":
        return tasks.filter((task) => Boolean(task.agent));
      case "Done Recently":
        return tasks.filter((task) => task.status === "done").sort((a, b) => b.updatedAt - a.updatedAt);
      case "All Work":
      default:
        return tasks;
    }
  }, [tasks, activeView]);

  const reviewCount = tasks.filter((task) => task.status === "review").length;
  const overdueSignal = tasks.filter((task) => task.status === "backlog").length;

  return (
    <Layout>
      <div className="h-full flex flex-col">
        <div className="px-6 py-4 border-b border-border flex items-start justify-between gap-4 shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <LayoutGrid size={20} strokeWidth={1.5} className="text-primary" />
              <h1 className="text-lg font-semibold">Tasks</h1>
              <StatusChip tone="info">My Work / Triage seed</StatusChip>
            </div>
            <p className="text-sm text-text-secondary mt-1 max-w-3xl">
              This surface is evolving from a basic task board into the first operator work loop: saved views, attention states,
              ownership cues, and multiple lenses over the same underlying work items.
            </p>
          </div>
          <button className="flex items-center gap-1.5 px-3 py-1.5 bg-primary hover:bg-primary-hover text-white text-sm font-medium rounded transition-colors shrink-0">
            <Plus size={14} /> New Task
          </button>
        </div>

        <div className="px-6 py-4 border-b border-border bg-sidebar/30 space-y-3 shrink-0">
          <div className="flex flex-wrap items-center gap-3 justify-between">
            <SavedViewBar views={[...SAVED_VIEWS]} activeView={activeView} onSelect={(view) => setFocus(`view:${view}`)} />
            <ViewModeSwitcher value={mode} onChange={setView} />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <NeedsAttentionBadge count={reviewCount} label="in review" />
            <NeedsAttentionBadge count={overdueSignal} label="backlog items" />
            <span className="inline-flex items-center gap-1 text-xs text-text-muted">
              <ListFilter size={12} /> {filteredTasks.length} visible tasks
            </span>
            {reviewCount > 0 && (
              <span className="inline-flex items-center gap-1 text-xs text-warning">
                <AlertTriangle size={12} /> human decisions pending
              </span>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-auto p-4">
          {mode === "board" ? (
            <div className="flex gap-4 h-full min-w-max">
              {COLUMNS.map((col) => {
                const columnTasks = filteredTasks.filter((t) => t.status === col.status);
                return (
                  <div key={col.status} className="w-72 flex flex-col shrink-0">
                    <div className="flex items-center justify-between mb-3 px-1">
                      <span className={`text-xs font-medium uppercase tracking-wider ${col.color}`}>{col.label}</span>
                      <span className="text-xs text-text-muted bg-surface-elevated px-2 py-0.5 rounded-full">{columnTasks.length}</span>
                    </div>
                    <div className="flex-1 space-y-2 overflow-y-auto">
                      {columnTasks.map((task) => (
                        <TaskCard key={task.id} task={task} />
                      ))}
                      {columnTasks.length === 0 && (
                        <div className="text-xs text-text-muted text-center py-8 border border-dashed border-border rounded-lg">
                          No tasks
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-surface border border-border rounded-xl overflow-hidden">
              <div className="grid grid-cols-[minmax(0,2fr)_auto_auto_auto] gap-3 px-4 py-3 border-b border-border text-[11px] uppercase tracking-[0.2em] text-text-muted">
                <div>Task</div>
                <div>Priority</div>
                <div>Trust</div>
                <div className="text-right">Agent / Age</div>
              </div>
              {filteredTasks.length > 0 ? (
                filteredTasks.map((task) => <TaskRow key={task.id} task={task} />)
              ) : (
                <div className="px-4 py-10 text-sm text-text-muted text-center">No tasks in this view.</div>
              )}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}

export default function TasksPage() {
  return (
    <Suspense fallback={<Layout><div className="px-6 py-10 text-sm text-text-muted">Loading tasks view…</div></Layout>}>
      <TasksPageInner />
    </Suspense>
  );
}
