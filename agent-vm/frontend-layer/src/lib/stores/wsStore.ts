"use client";

import { create } from "zustand";
import type { ConnectionStatus, ChatMessage, AgentEvent } from "@/lib/types";
import { AGENTS } from "@/lib/types";
import { autoTagMessage } from "@/lib/autoTag";

const WS_URLS = ["ws://localhost:18789/ws", "ws://localhost:18789"];
const MAX_BACKOFF = 60000;

let msgCounter = 0;
let eventCounter = 0;

function parseAgentFromSender(sender: string): string {
  const lower = sender.toLowerCase();
  for (const key of Object.keys(AGENTS)) {
    if (lower.includes(key)) return key;
  }
  if (lower.includes("trajan") || lower === "user") return "user";
  return "main";
}

interface WSStore {
  status: ConnectionStatus;
  messages: ChatMessage[];
  agentEvents: AgentEvent[];
  // Internal connection state (not exposed)
  _ws: WebSocket | null;
  _backoff: number;
  _urlIndex: number;
  _reconnectTimer: ReturnType<typeof setTimeout> | undefined;
  // Actions
  connect: () => void;
  disconnect: () => void;
  sendMessage: (data: unknown) => void;
}

export const useWSStore = create<WSStore>((set, get) => ({
  status: "disconnected",
  messages: [],
  agentEvents: [],
  _ws: null,
  _backoff: 1000,
  _urlIndex: 0,
  _reconnectTimer: undefined,

  connect: () => {
    const state = get();
    if (state._ws?.readyState === WebSocket.OPEN) return;

    set({ status: "connecting" });

    const wsUrl = WS_URLS[state._urlIndex % WS_URLS.length];

    try {
      const ws = new WebSocket(wsUrl);
      set({ _ws: ws });

      ws.onopen = () => {
        set({ _backoff: 1000, status: "connected" });
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.type === "message" || data.content) {
            const msg: ChatMessage = {
              id: `msg-${++msgCounter}`,
              sender: data.sender || data.from || "system",
              senderAgent: parseAgentFromSender(data.sender || data.from || ""),
              content: data.content || data.text || data.message || JSON.stringify(data),
              timestamp: data.timestamp ? new Date(data.timestamp).getTime() : Date.now(),
              channel: data.channel,
              projectTag: autoTagMessage(data.content || data.text || data.message || ""),
            };
            set((s) => ({ messages: [...s.messages.slice(-500), msg] }));
          }

          if (data.type === "agent_event" || data.type === "session") {
            const evt: AgentEvent = {
              id: `evt-${++eventCounter}`,
              agentId: data.agentId || data.agent || "main",
              type: data.event === "spawn" ? "spawn" : data.event === "error" ? "error" : "complete",
              task: data.task || data.description || "",
              status: data.status === "failed" ? "failed" : data.status === "done" ? "done" : "running",
              startTime: data.startTime ? new Date(data.startTime).getTime() : Date.now(),
              endTime: data.endTime ? new Date(data.endTime).getTime() : undefined,
              result: data.result,
            };
            set((s) => ({ agentEvents: [...s.agentEvents.slice(-200), evt] }));
          }
        } catch {
          const msg: ChatMessage = {
            id: `msg-${++msgCounter}`,
            sender: "system",
            senderAgent: "main",
            content: event.data,
            timestamp: Date.now(),
          };
          set((s) => ({ messages: [...s.messages.slice(-500), msg] }));
        }
      };

      ws.onclose = () => {
        set((s) => {
          const nextIndex = s._urlIndex + 1;
          const delay = Math.min(s._backoff, MAX_BACKOFF);
          const timer = setTimeout(() => get().connect(), delay);
          return {
            status: "disconnected",
            _ws: null,
            _urlIndex: nextIndex,
            _backoff: delay * 2,
            _reconnectTimer: timer,
          };
        });
      };

      ws.onerror = () => {
        ws.close();
      };
    } catch {
      set((s) => {
        const delay = Math.min(s._backoff, MAX_BACKOFF);
        const timer = setTimeout(() => get().connect(), delay);
        return { status: "disconnected", _backoff: delay * 2, _reconnectTimer: timer };
      });
    }
  },

  disconnect: () => {
    const { _ws, _reconnectTimer } = get();
    clearTimeout(_reconnectTimer);
    _ws?.close();
    set({ _ws: null, status: "disconnected" });
  },

  sendMessage: (data: unknown) => {
    const { _ws } = get();
    if (_ws?.readyState === WebSocket.OPEN) {
      _ws.send(JSON.stringify(data));
    }
  },
}));
