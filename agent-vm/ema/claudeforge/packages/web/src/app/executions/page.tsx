"use client";

import { Suspense } from "react";
import { Layout } from "@/components/layout/Layout";
import { useSessionStore } from "@/stores/session-store";
import { useViewUrlState } from "@/hooks/useViewUrlState";
import { StatusPanel } from "@/components/ui/StatusPanel";
import { Boxes, Clock, Terminal, MessageSquare, FolderOpen } from "lucide-react";
import { StatusChip } from "@/components/ui/StatusChip";
import { TrustBadge } from "@/components/ui/TrustBadge";
import { NeedsAttentionBadge } from "@/components/ui/NeedsAttentionBadge";

function formatAge(timestamp: number) {
  const age = Math.floor((Date.now() - timestamp) / 60000);
  return age < 60 ? `${age}m ago` : `${Math.floor(age / 60)}h ago`;
}

function ExecutionsPageInner() {
  const { sessions, messages, activeSessionId, setActiveSession } = useSessionStore();
  const { state, setFocus } = useViewUrlState({ defaultView: "board" });
  const reviewCount = sessions.filter((session) => session.status === "error" || session.status === "idle").length;
  const focusedSessionId = state.focus?.startsWith("session:") ? state.focus.slice("session:".length) : activeSessionId;

  return (
    <Layout>
      <div className="h-full flex flex-col">
        <div className="px-6 py-4 border-b border-border shrink-0">
          <div className="flex items-center gap-2">
            <Boxes size={20} strokeWidth={1.5} className="text-primary" />
            <h1 className="text-lg font-semibold">Executions</h1>
            <StatusChip tone="info">Execution workbench seed</StatusChip>
          </div>
          <p className="text-sm text-text-secondary mt-1 max-w-3xl">
            Sessions are the current live proxy for executions. This page starts surfacing runtime truth, activity, and evidence in a form that can later deepen into timelines, stages, artifacts, and verification.
          </p>
          <div className="flex flex-wrap items-center gap-2 mt-3">
            <NeedsAttentionBadge count={reviewCount} label="sessions needing review" />
            <span className="text-xs text-text-muted">{sessions.length} tracked executions</span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 xl:grid-cols-[minmax(320px,420px)_1fr] gap-6 h-full">
            <div className="bg-surface border border-border rounded-xl overflow-hidden h-fit">
              <div className="px-4 py-3 border-b border-border text-[11px] uppercase tracking-[0.2em] text-text-muted">
                Active and recent executions
              </div>
              <div className="divide-y divide-border">
                {sessions.map((session) => {
                  return (
                    <button
                      key={session.id}
                      onClick={() => {
                        setActiveSession(session.id);
                        setFocus(`session:${session.id}`);
                      }}
                      className={`w-full text-left px-4 py-3 transition-colors ${
                        focusedSessionId === session.id ? "bg-primary/10" : "hover:bg-sidebar/40"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="text-sm font-medium text-text-primary truncate">{session.name}</div>
                          <div className="text-xs text-text-muted mt-1 flex items-center gap-2 flex-wrap">
                            <span className="inline-flex items-center gap-1"><FolderOpen size={10} /> {session.projectName}</span>
                            <span>{session.provider}</span>
                            <span>{session.model ?? "default model"}</span>
                          </div>
                        </div>
                        <StatusChip tone={session.status === "active" ? "success" : session.status === "error" ? "error" : session.status === "idle" ? "warning" : "neutral"}>
                          {session.status}
                        </StatusChip>
                      </div>
                    </button>
                  );
                })}
                {sessions.length === 0 && <div className="px-4 py-10 text-sm text-text-muted text-center">No executions visible yet.</div>}
              </div>
            </div>

            <div className="bg-surface border border-border rounded-xl overflow-hidden min-h-[420px]">
              <div className="px-4 py-3 border-b border-border flex items-center justify-between gap-3">
                <div>
                  <div className="text-[11px] uppercase tracking-[0.2em] text-text-muted">Execution detail</div>
                  <div className="text-sm text-text-secondary mt-1">
                    {focusedSessionId ? "Session-driven runtime evidence and status" : "Select an execution from the left"}
                  </div>
                </div>
              </div>

              {focusedSessionId ? (() => {
                const session = sessions.find((item) => item.id === focusedSessionId);
                if (!session) return <div className="px-4 py-10 text-sm text-text-muted">Execution missing.</div>;
                const sessionMessages = messages.get(focusedSessionId) ?? [];
                const toolCalls = sessionMessages.filter((message) => Boolean(message.toolCall));
                return (
                  <div className="p-4 space-y-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusChip tone="primary">{session.provider}</StatusChip>
                      <StatusChip tone={session.status === "active" ? "success" : session.status === "error" ? "error" : session.status === "idle" ? "warning" : "neutral"}>{session.status}</StatusChip>
                      <TrustBadge state={session.status === "active" ? "observed" : session.status === "stopped" ? "verified" : "inferred"} />
                      <span className="text-xs text-text-muted inline-flex items-center gap-1"><Clock size={12} /> {formatAge(session.lastActivity)}</span>
                    </div>

                    <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-sidebar/40 border border-border rounded-lg p-4">
                          <div className="text-[11px] uppercase tracking-[0.2em] text-text-muted">Messages</div>
                          <div className="mt-2 text-2xl font-semibold">{session.messageCount}</div>
                        </div>
                        <div className="bg-sidebar/40 border border-border rounded-lg p-4">
                          <div className="text-[11px] uppercase tracking-[0.2em] text-text-muted">Tool activity</div>
                          <div className="mt-2 text-2xl font-semibold">{toolCalls.length}</div>
                        </div>
                        <div className="bg-sidebar/40 border border-border rounded-lg p-4">
                          <div className="text-[11px] uppercase tracking-[0.2em] text-text-muted">Runtime cost</div>
                          <div className="mt-2 text-2xl font-semibold">${session.totalCost.toFixed(4)}</div>
                        </div>
                      </div>

                      <StatusPanel
                        title="Execution status"
                        items={[
                          { label: "State", value: <StatusChip tone={session.status === "active" ? "success" : session.status === "error" ? "error" : session.status === "idle" ? "warning" : "neutral"}>{session.status}</StatusChip>, detail: `${session.provider} · ${session.model ?? "default model"}` },
                          { label: "Observed truth", value: <TrustBadge state={session.status === "active" ? "observed" : session.status === "stopped" ? "verified" : "inferred"} />, detail: session.status === "active" ? "Live runtime output is currently flowing." : "State inferred from latest known session status." },
                          { label: "Last activity", value: formatAge(session.lastActivity), detail: new Date(session.lastActivity).toLocaleString() },
                          { label: "Project", value: session.projectName, detail: session.directory },
                        ]}
                      />
                    </div>

                    <div className="bg-sidebar/30 border border-border rounded-lg p-4">
                      <div className="text-[11px] uppercase tracking-[0.2em] text-text-muted mb-3">Recent evidence</div>
                      <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
                        {sessionMessages.slice(-12).reverse().map((message) => (
                          <div key={message.id} className="border border-border rounded-lg p-3 bg-surface-elevated/40">
                            <div className="flex items-center justify-between gap-3">
                              <div className="flex items-center gap-2 text-sm text-text-primary">
                                {message.toolCall ? <Terminal size={14} className="text-primary" /> : <MessageSquare size={14} className="text-info" />}
                                <span className="capitalize">{message.toolCall ? message.toolCall.kind : message.role}</span>
                              </div>
                              <span className="text-xs text-text-muted">{new Date(message.createdAt).toLocaleTimeString()}</span>
                            </div>
                            <div className="text-xs text-text-secondary mt-2 whitespace-pre-wrap break-words line-clamp-4">
                              {message.toolCall?.title ?? message.content}
                            </div>
                          </div>
                        ))}
                        {sessionMessages.length === 0 && <div className="text-sm text-text-muted">No evidence loaded for this execution yet.</div>}
                      </div>
                    </div>
                  </div>
                );
              })() : (
                <div className="px-4 py-12 text-sm text-text-muted text-center">Pick a session to inspect runtime evidence.</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default function ExecutionsPage() {
  return (
    <Suspense fallback={<Layout><div className="px-6 py-10 text-sm text-text-muted">Loading executions view…</div></Layout>}>
      <ExecutionsPageInner />
    </Suspense>
  );
}
