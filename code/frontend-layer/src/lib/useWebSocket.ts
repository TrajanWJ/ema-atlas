"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import type { ConnectionStatus, ChatMessage, AgentEvent } from "./types";
import { AGENTS } from "./types";

// Try multiple WS paths — gateway may need /ws suffix
const WS_URLS = ["ws://localhost:18789/ws", "ws://localhost:18789"];
const MAX_BACKOFF = 60000;

interface WebSocketState {
  status: ConnectionStatus;
  messages: ChatMessage[];
  agentEvents: AgentEvent[];
}

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

export function useWebSocket() {
  const [state, setState] = useState<WebSocketState>({
    status: "disconnected",
    messages: [],
    agentEvents: [],
  });

  const wsRef = useRef<WebSocket | null>(null);
  const backoffRef = useRef(1000);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const wsUrlIndexRef = useRef(0);

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    setState((s) => ({ ...s, status: "connecting" }));

    const wsUrl = WS_URLS[wsUrlIndexRef.current % WS_URLS.length];

    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        backoffRef.current = 1000;
        setState((s) => ({ ...s, status: "connected" }));
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          // Handle different message types from the gateway
          if (data.type === "message" || data.content) {
            const msg: ChatMessage = {
              id: `msg-${++msgCounter}`,
              sender: data.sender || data.from || "system",
              senderAgent: parseAgentFromSender(data.sender || data.from || ""),
              content: data.content || data.text || data.message || JSON.stringify(data),
              timestamp: data.timestamp ? new Date(data.timestamp).getTime() : Date.now(),
              channel: data.channel,
            };
            setState((s) => ({
              ...s,
              messages: [...s.messages.slice(-500), msg],
            }));
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
            setState((s) => ({
              ...s,
              agentEvents: [...s.agentEvents.slice(-200), evt],
            }));
          }
        } catch {
          // Non-JSON message, treat as plain text
          const msg: ChatMessage = {
            id: `msg-${++msgCounter}`,
            sender: "system",
            senderAgent: "main",
            content: event.data,
            timestamp: Date.now(),
          };
          setState((s) => ({
            ...s,
            messages: [...s.messages.slice(-500), msg],
          }));
        }
      };

      ws.onclose = () => {
        setState((s) => ({ ...s, status: "disconnected" }));
        // Try next URL on reconnect
        wsUrlIndexRef.current++;
        const delay = Math.min(backoffRef.current, MAX_BACKOFF);
        backoffRef.current = delay * 2;
        reconnectTimerRef.current = setTimeout(connect, delay);
      };

      ws.onerror = () => {
        ws.close();
      };
    } catch {
      setState((s) => ({ ...s, status: "disconnected" }));
      const delay = Math.min(backoffRef.current, MAX_BACKOFF);
      backoffRef.current = delay * 2;
      reconnectTimerRef.current = setTimeout(connect, delay);
    }
  }, []);

  useEffect(() => {
    connect();
    return () => {
      clearTimeout(reconnectTimerRef.current);
      wsRef.current?.close();
    };
  }, [connect]);

  return state;
}
