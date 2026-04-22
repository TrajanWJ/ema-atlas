import { Clock, FolderOpen, Terminal, ListChecks } from "lucide-react";
import type { WorkstreamSeed } from "./WorkstreamCard";
import { StatusChip } from "@/components/ui/StatusChip";
import { TrustBadge } from "@/components/ui/TrustBadge";
import { StatusPanel } from "@/components/ui/StatusPanel";

function formatTime(timestamp: number) {
  return new Date(timestamp).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

export function WorkstreamDetail({ workstream }: { workstream: WorkstreamSeed | undefined }) {
  if (!workstream) {
    return <div className="px-6 py-10 text-sm text-text-muted text-center">Select a workstream to inspect.</div>;
  }

  const activeSessions = workstream.sessions.filter((session) => session.status === "active").length;
  const reviewTasks = workstream.tasks.filter((task) => task.status === "review").length;
  const latestActivity = Math.max(
    workstream.project.updatedAt,
    ...workstream.sessions.map((session) => session.lastActivity),
    ...workstream.tasks.map((task) => task.updatedAt)
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <FolderOpen size={16} className="text-info" />
            <h2 className="text-xl font-semibold">{workstream.title}</h2>
          </div>
          <p className="text-sm text-text-secondary mt-2 max-w-3xl">{workstream.summary}</p>
        </div>
        <div className="flex flex-wrap gap-2 justify-end">
          <TrustBadge state={activeSessions > 0 ? "observed" : "inferred"} />
          <StatusChip tone={reviewTasks > 0 ? "warning" : "success"}>{reviewTasks > 0 ? "Needs review" : "Stable"}</StatusChip>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1.3fr_360px] gap-6">
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-surface border border-border rounded-xl p-4">
              <div className="text-[11px] uppercase tracking-[0.2em] text-text-muted">Sessions</div>
              <div className="mt-2 text-2xl font-semibold">{workstream.sessions.length}</div>
            </div>
            <div className="bg-surface border border-border rounded-xl p-4">
              <div className="text-[11px] uppercase tracking-[0.2em] text-text-muted">Tasks</div>
              <div className="mt-2 text-2xl font-semibold">{workstream.tasks.length}</div>
            </div>
            <div className="bg-surface border border-border rounded-xl p-4">
              <div className="text-[11px] uppercase tracking-[0.2em] text-text-muted">Latest activity</div>
              <div className="mt-2 text-sm font-medium">{formatTime(latestActivity)}</div>
            </div>
          </div>

          <div className="bg-surface border border-border rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-border text-[11px] uppercase tracking-[0.2em] text-text-muted">Live sessions</div>
            <div className="divide-y divide-border">
              {workstream.sessions.map((session) => (
                <div key={session.id} className="px-4 py-3 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-text-primary truncate">{session.name}</div>
                    <div className="text-xs text-text-muted mt-1 inline-flex items-center gap-1"><Terminal size={10} /> {session.provider} · {session.model ?? "default"}</div>
                  </div>
                  <StatusChip tone={session.status === "active" ? "success" : session.status === "idle" ? "warning" : session.status === "error" ? "error" : "neutral"}>{session.status}</StatusChip>
                </div>
              ))}
              {workstream.sessions.length === 0 ? <div className="px-4 py-10 text-sm text-text-muted text-center">No sessions in this workstream yet.</div> : null}
            </div>
          </div>

          <div className="bg-surface border border-border rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-border text-[11px] uppercase tracking-[0.2em] text-text-muted">Open tasks</div>
            <div className="divide-y divide-border">
              {workstream.tasks.map((task) => (
                <div key={task.id} className="px-4 py-3 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-text-primary truncate">{task.title}</div>
                    <div className="text-xs text-text-muted mt-1 inline-flex items-center gap-1"><ListChecks size={10} /> {task.agent ?? "unassigned"}</div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 justify-end">
                    <StatusChip tone={task.status === "done" ? "success" : task.status === "review" ? "warning" : task.status === "in_progress" ? "info" : "neutral"}>{task.status}</StatusChip>
                    <StatusChip tone={task.priority === "critical" ? "error" : task.priority === "high" ? "warning" : "neutral"}>{task.priority}</StatusChip>
                  </div>
                </div>
              ))}
              {workstream.tasks.length === 0 ? <div className="px-4 py-10 text-sm text-text-muted text-center">No tasks attached yet.</div> : null}
            </div>
          </div>
        </div>

        <StatusPanel
          title="Workstream status"
          items={[
            { label: "Location", value: workstream.project.name, detail: workstream.project.directory },
            { label: "Observed state", value: <TrustBadge state={activeSessions > 0 ? "observed" : "inferred"} />, detail: activeSessions > 0 ? "At least one active execution is currently attached." : "No active execution observed right now." },
            { label: "Review queue", value: reviewTasks, detail: reviewTasks > 0 ? "Tasks currently waiting for human review." : "No review backlog at the moment." },
            { label: "Latest activity", value: formatTime(latestActivity), detail: <span className="inline-flex items-center gap-1"><Clock size={12} /> Most recent session/task/project update.</span> },
          ]}
        />
      </div>
    </div>
  );
}
