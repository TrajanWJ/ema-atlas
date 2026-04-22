"use client";

import { useEffect, useCallback, useState } from "react";
import dynamic from "next/dynamic";
import { TopNav } from "./TopNav";
import { Sidebar } from "./Sidebar";
import { Breadcrumbs } from "./Breadcrumbs";
import { ConnectionStatusBanner } from "./ConnectionStatusBanner";
import { useWebSocket } from "@/hooks/useWebSocket";
import { useSessionStore } from "@/stores/session-store";
import { useSystemStore } from "@/stores/system-store";
import { useMessageQueue } from "@/stores/message-queue";
import { useToastStore } from "@/components/ui/Toast";
import { useAutoSave } from "@/hooks/useAutoSave";
import { api } from "@/lib/api";
import type { ServerEvent } from "@claudeforge/shared";

const CommandPalette = dynamic(() => import("./CommandPalette").then((m) => ({ default: m.CommandPalette })), {
  ssr: false,
});
const KeyboardShortcutsHelp = dynamic(() => import("./KeyboardShortcutsHelp").then((m) => ({ default: m.KeyboardShortcutsHelp })), {
  ssr: false,
});
const SessionComparison = dynamic(() => import("@/components/sessions/SessionComparison").then((m) => ({ default: m.SessionComparison })), {
  ssr: false,
});

export function Layout({
  children,
  splitView,
  onToggleSplit,
}: {
  children: React.ReactNode;
  splitView?: boolean;
  onToggleSplit?: () => void;
}) {
  const sessionStore = useSessionStore();
  const systemStore = useSystemStore();
  const messageQueue = useMessageQueue();
  const addToast = useToastStore((s) => s.addToast);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [compareIds, setCompareIds] = useState<{ a: string; b: string } | null>(null);

  // Auto-save UI state to localStorage
  useAutoSave();

  // Hydrate message queue from localStorage on mount
  useEffect(() => {
    messageQueue.hydrate();
  }, []);

  const handleEvent = useCallback((event: ServerEvent) => {
    switch (event.type) {
      case "session.created":
        sessionStore.addSession(event.session);
        break;
      case "session.updated":
        sessionStore.updateSession(event.session);
        break;
      case "session.status":
        sessionStore.updateSessionStatus(event.sessionId, event.status);
        break;
      case "session.closed":
        sessionStore.removeSession(event.sessionId);
        break;
      case "session.output": {
        const { sessionId, data } = event;
        switch (data.type) {
          case "text":
            sessionStore.appendStreamText(sessionId, data.content);
            break;
          case "tool_use":
            sessionStore.addMessage({
              id: data.toolCall.id,
              sessionId,
              role: "assistant",
              content: `Using tool: ${data.toolCall.title}`,
              createdAt: Date.now(),
              toolCall: data.toolCall,
            });
            break;
          case "tool_result":
            sessionStore.addMessage({
              id: data.toolCall.id + "_result",
              sessionId,
              role: "assistant",
              content: data.toolCall.output ?? "",
              createdAt: Date.now(),
              toolCall: { ...data.toolCall, output: data.toolCall.output },
            });
            break;
          case "done":
            sessionStore.clearStreamText(sessionId);
            break;
          case "error":
            sessionStore.addMessage({
              id: `err_${Date.now()}`,
              sessionId,
              role: "system",
              content: `Error: ${data.message}`,
              createdAt: Date.now(),
            });
            sessionStore.clearStreamText(sessionId);
            break;
          case "thinking":
            break;
          case "session_init":
            sessionStore.updateSession({
              ...sessionStore.sessions.find((s) => s.id === sessionId)!,
              providerSessionId: data.providerSessionId,
            } as import("@claudeforge/shared").SessionRecord);
            break;
          case "image":
            sessionStore.addMessage({
              id: `img_${Date.now()}`,
              sessionId,
              role: "assistant",
              content: `[Image: ${data.mediaType}]`,
              createdAt: Date.now(),
            });
            break;
          case "input_request":
            sessionStore.addMessage({
              id: `input_${Date.now()}`,
              sessionId,
              role: "system",
              content: `Input requested: ${data.question}${data.options ? `\nOptions: ${data.options.join(", ")}` : ""}`,
              createdAt: Date.now(),
            });
            break;
        }
        break;
      }
      case "message.created":
        sessionStore.addMessage(event.message);
        break;
      case "project.created":
        sessionStore.addProject(event.project);
        break;
      case "project.updated":
        sessionStore.updateProject(event.project);
        break;
      case "task.created":
        systemStore.addTask(event.task);
        break;
      case "task.updated":
        systemStore.updateTask(event.task);
        break;
      case "system.health":
        systemStore.setHealth(event.data);
        break;
      case "system.status":
        break;
      case "system.error":
        systemStore.addError(event.data);
        break;
    }
  }, []);

  const { status, retryCount, maxRetries, send, manualRetry, setOnReconnect } =
    useWebSocket(handleEvent);

  // Initial data load
  useEffect(() => {
    api.getProjects().then(sessionStore.setProjects).catch(console.error);
    api.getSessions().then(sessionStore.setSessions).catch(console.error);
    api.getTasks().then(systemStore.setTasks).catch(console.error);
  }, []);

  // On reconnect: refetch state, drain message queue, clear stale streams
  useEffect(() => {
    setOnReconnect(() => {
      // Refetch all state
      api.getProjects().then(sessionStore.setProjects).catch(console.error);
      api.getSessions().then(sessionStore.setSessions).catch(console.error);
      api.getTasks().then(systemStore.setTasks).catch(console.error);

      // Clear stale streaming text
      const streamingText = useSessionStore.getState().streamingText;
      for (const sessionId of streamingText.keys()) {
        sessionStore.clearStreamText(sessionId);
      }

      // Drain queued messages
      const queued = messageQueue.drain();
      for (const msg of queued) {
        messageQueue.markSending(msg.id);
        const sent = send({ type: "session.message", sessionId: msg.sessionId, content: msg.content });
        if (sent) {
          messageQueue.remove(msg.id);
        } else {
          messageQueue.markFailed(msg.id, "WebSocket not ready");
        }
      }

      addToast("success", "Reconnected to server");
    });
  }, [send, setOnReconnect, addToast]);

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMod = e.metaKey || e.ctrlKey;

      // Ctrl+K / Cmd+K — open command palette
      if (isMod && e.key === "k") {
        e.preventDefault();
        setPaletteOpen((prev) => !prev);
      }

      // Ctrl+/ — toggle sidebar
      if (isMod && e.key === "/") {
        e.preventDefault();
        setSidebarOpen((prev) => !prev);
      }

      // ? — show keyboard shortcuts (only when not typing in an input)
      if (e.key === "?" && !paletteOpen) {
        const tag = (e.target as HTMLElement).tagName;
        if (tag !== "INPUT" && tag !== "TEXTAREA" && !(e.target as HTMLElement).isContentEditable) {
          e.preventDefault();
          setShortcutsOpen((prev) => !prev);
        }
      }

      // Escape — close overlays, then sidebar, then deselect
      if (e.key === "Escape") {
        if (paletteOpen) {
          setPaletteOpen(false);
        } else if (shortcutsOpen) {
          setShortcutsOpen(false);
        } else if (sidebarOpen) {
          setSidebarOpen(false);
        } else {
          sessionStore.setActiveSession(null);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [sidebarOpen, paletteOpen, shortcutsOpen]);

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* Skip to main content — accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:z-[300] focus:top-2 focus:left-2 focus:px-4 focus:py-2 focus:bg-primary focus:text-white focus:rounded-lg focus:text-sm focus:font-medium"
      >
        Skip to main content
      </a>
      <ConnectionStatusBanner
        status={status}
        retryCount={retryCount}
        maxRetries={maxRetries}
        onRetry={manualRetry}
      />
      <TopNav
        connected={status === "connected"}
        onToggleSidebar={() => setSidebarOpen((prev) => !prev)}
        splitView={splitView}
        onToggleSplit={onToggleSplit}
      />
      <Breadcrumbs />
      <div className="flex flex-1 overflow-hidden relative">
        {/* Desktop sidebar */}
        <div className="hidden md:block">
          <Sidebar onSessionSelect={() => setSidebarOpen(false)} />
        </div>

        {/* Mobile sidebar overlay */}
        {sidebarOpen && (
          <>
            <div
              className="fixed inset-0 z-40 bg-black/50 md:hidden"
              onClick={() => setSidebarOpen(false)}
            />
            <div className="fixed inset-y-0 left-0 z-50 md:hidden sidebar-slide-in">
              <Sidebar onSessionSelect={() => setSidebarOpen(false)} />
            </div>
          </>
        )}

        <main id="main-content" className="flex-1 overflow-hidden">{children}</main>
      </div>

      <CommandPalette
        open={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        onCompare={(a, b) => {
          setPaletteOpen(false);
          setCompareIds({ a, b });
        }}
        onShowShortcuts={() => {
          setPaletteOpen(false);
          setShortcutsOpen(true);
        }}
      />
      <KeyboardShortcutsHelp open={shortcutsOpen} onClose={() => setShortcutsOpen(false)} />
      {compareIds && (
        <SessionComparison
          sessionA={compareIds.a}
          sessionB={compareIds.b}
          onClose={() => setCompareIds(null)}
        />
      )}
    </div>
  );
}
