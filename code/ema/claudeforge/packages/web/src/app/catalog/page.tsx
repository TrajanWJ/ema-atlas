"use client";

import { Search, FolderOpen, Bot, MessageSquare } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { useSessionStore } from "@/stores/session-store";
import { StatusChip } from "@/components/ui/StatusChip";
import { TrustBadge } from "@/components/ui/TrustBadge";

export default function CatalogPage() {
  const { projects, sessions } = useSessionStore();
  const providers = Array.from(new Set(sessions.map((session) => session.provider)));

  return (
    <Layout>
      <div className="h-full flex flex-col">
        <div className="px-6 py-4 border-b border-border shrink-0">
          <div className="flex items-center gap-2">
            <Search size={20} strokeWidth={1.5} className="text-primary" />
            <h1 className="text-lg font-semibold">Catalog</h1>
            <StatusChip tone="info">Entity spine seed</StatusChip>
          </div>
          <p className="text-sm text-text-secondary mt-1 max-w-3xl">
            The current catalog starts from project locations, active sessions, and providers. This is the foundation for a broader EMA entity spine with ownership, health, trust state, and related work.
          </p>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-surface border border-border rounded-xl p-4">
              <div className="text-[11px] uppercase tracking-[0.2em] text-text-muted">Locations</div>
              <div className="mt-2 text-2xl font-semibold">{projects.length}</div>
            </div>
            <div className="bg-surface border border-border rounded-xl p-4">
              <div className="text-[11px] uppercase tracking-[0.2em] text-text-muted">Sessions</div>
              <div className="mt-2 text-2xl font-semibold">{sessions.length}</div>
            </div>
            <div className="bg-surface border border-border rounded-xl p-4">
              <div className="text-[11px] uppercase tracking-[0.2em] text-text-muted">Providers</div>
              <div className="mt-2 text-2xl font-semibold">{providers.length}</div>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <div className="bg-surface border border-border rounded-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-border flex items-center gap-2 text-sm font-semibold">
                <FolderOpen size={16} className="text-info" /> Project locations
              </div>
              <div className="divide-y divide-border">
                {projects.map((project) => {
                  const projectSessions = sessions.filter((session) => session.projectId === project.id);
                  const activeCount = projectSessions.filter((session) => session.status === "active").length;
                  return (
                    <div key={project.id} className="px-4 py-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="text-sm font-medium text-text-primary truncate">{project.name}</div>
                          <div className="text-xs text-text-muted truncate mt-1">{project.directory}</div>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap justify-end">
                          <TrustBadge state={activeCount > 0 ? "observed" : "inferred"} />
                          <StatusChip tone={activeCount > 0 ? "success" : "neutral"}>{activeCount} active</StatusChip>
                        </div>
                      </div>
                    </div>
                  );
                })}
                {projects.length === 0 && <div className="px-4 py-10 text-sm text-text-muted text-center">No locations discovered yet.</div>}
              </div>
            </div>

            <div className="bg-surface border border-border rounded-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-border flex items-center gap-2 text-sm font-semibold">
                <MessageSquare size={16} className="text-primary" /> Sessions and providers
              </div>
              <div className="divide-y divide-border">
                {sessions.map((session) => (
                  <div key={session.id} className="px-4 py-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-text-primary truncate">{session.name}</div>
                        <div className="text-xs text-text-muted mt-1 flex items-center gap-2 flex-wrap">
                          <span className="inline-flex items-center gap-1"><Bot size={10} /> {session.provider}</span>
                          <span>{session.projectName}</span>
                          <span>{session.model ?? "default model"}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap justify-end">
                        <TrustBadge state={session.status === "active" ? "observed" : session.status === "stopped" ? "verified" : "inferred"} />
                        <StatusChip tone={session.status === "active" ? "success" : session.status === "error" ? "error" : session.status === "idle" ? "warning" : "neutral"}>
                          {session.status}
                        </StatusChip>
                      </div>
                    </div>
                  </div>
                ))}
                {sessions.length === 0 && <div className="px-4 py-10 text-sm text-text-muted text-center">No sessions tracked yet.</div>}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
