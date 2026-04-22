"use client";

import { useEffect, useCallback } from "react";
import { TopNav } from "./TopNav";
import { Sidebar } from "./Sidebar";
import { useWebSocket } from "@/hooks/useWebSocket";
import { useSessionStore } from "@/stores/session-store";
import { useSystemStore } from "@/stores/system-store";
import { api } from "@/lib/api";
import type { ServerEvent } from "@claudeforge/shared";

export function Layout({ children }: { children: React.ReactNode }) {
  const sessionStore = useSessionStore();
  const systemStore = useSystemStore();

  const handleEvent = useCallback((event: ServerEvent) => {
    switch (event.type) {
      case "session.created":
        sessionStore.addSession(event.session);
        break;
      case "session.updated":
        sessionStore.updateSession(event.session);
        break;
      case "session.closed":
        sessionStore.removeSession(event.sessionId);
        break;
      case "session.output":
        if (event.data.type === "text") {
          sessionStore.appendStreamText(event.sessionId, event.data.content);
        }
        break;
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
      case "system.error":
        systemStore.addError(event.data);
        break;
    }
  }, []);

  const { connected } = useWebSocket(handleEvent);

  // Initial data load
  useEffect(() => {
    api.getProjects().then(sessionStore.setProjects).catch(console.error);
    api.getSessions().then(sessionStore.setSessions).catch(console.error);
    api.getTasks().then(systemStore.setTasks).catch(console.error);
  }, []);

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <TopNav connected={connected} />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-hidden">{children}</main>
      </div>
    </div>
  );
}
