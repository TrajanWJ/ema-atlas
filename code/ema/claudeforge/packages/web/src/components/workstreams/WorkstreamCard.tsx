import { FolderOpen, MessageSquare, CheckCircle2, AlertTriangle } from "lucide-react";
import type { ProjectLocation, SessionRecord, TaskRecord } from "@claudeforge/shared";
import { StatusChip } from "@/components/ui/StatusChip";
import { TrustBadge } from "@/components/ui/TrustBadge";

export interface WorkstreamSeed {
  id: string;
  title: string;
  summary: string;
  project: ProjectLocation;
  sessions: SessionRecord[];
  tasks: TaskRecord[];
}

export function WorkstreamCard({ workstream, active, onSelect }: { workstream: WorkstreamSeed; active: boolean; onSelect: () => void }) {
  const activeSessions = workstream.sessions.filter((session) => session.status === "active").length;
  const reviewTasks = workstream.tasks.filter((task) => task.status === "review").length;
  const doneTasks = workstream.tasks.filter((task) => task.status === "done").length;

  return (
    <button
      onClick={onSelect}
      className={`w-full text-left bg-surface border rounded-xl p-4 transition-colors ${
        active ? "border-primary bg-primary/5" : "border-border hover:border-primary/25"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <FolderOpen size={15} className="text-info" />
            <span className="text-sm font-semibold text-text-primary truncate">{workstream.title}</span>
          </div>
          <p className="text-xs text-text-secondary mt-2 line-clamp-2">{workstream.summary}</p>
        </div>
        <TrustBadge state={activeSessions > 0 ? "observed" : "inferred"} />
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <StatusChip tone={activeSessions > 0 ? "success" : "neutral"}>{activeSessions} active sessions</StatusChip>
        <StatusChip tone={reviewTasks > 0 ? "warning" : "neutral"}>{reviewTasks} in review</StatusChip>
        <StatusChip tone="primary">{workstream.tasks.length} tasks</StatusChip>
      </div>
      <div className="mt-3 flex items-center gap-3 text-xs text-text-muted">
        <span className="inline-flex items-center gap-1"><MessageSquare size={11} /> {workstream.sessions.length} sessions</span>
        <span className="inline-flex items-center gap-1"><CheckCircle2 size={11} /> {doneTasks} done</span>
        {reviewTasks > 0 ? <span className="inline-flex items-center gap-1 text-warning"><AlertTriangle size={11} /> review pending</span> : null}
      </div>
    </button>
  );
}
