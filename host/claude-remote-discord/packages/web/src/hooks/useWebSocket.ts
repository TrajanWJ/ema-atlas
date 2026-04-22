"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import type { ServerEvent, ClientCommand } from "@claudeforge/shared";

const MIN_RETRY_MS = 1_000;
const MAX_RETRY_MS = 30_000;
const MAX_RETRIES = 10;
const HEARTBEAT_INTERVAL_MS = 30_000;
const PONG_TIMEOUT_MS = 5_000;
const JITTER_FACTOR = 0.2; // ±20%

export type ConnectionStatus = "connected" | "connecting" | "reconnecting" | "disconnected";

function getWsUrl(): string {
  if (process.env.NEXT_PUBLIC_WS_URL) {
    return process.env.NEXT_PUBLIC_WS_URL;
  }
  if (typeof window !== "undefined") {
    const proto = window.location.protocol === "https:" ? "wss:" : "ws:";
    return `${proto}//${window.location.hostname}:3001/ws`;
  }
  return "ws://localhost:3001/ws";
}

function applyJitter(delay: number): number {
  const jitter = delay * JITTER_FACTOR;
  return delay + (Math.random() * 2 - 1) * jitter;
}

export function useWebSocket(onEvent: (event: ServerEvent) => void) {
  const wsRef = useRef<WebSocket | null>(null);
  const [status, setStatus] = useState<ConnectionStatus>("connecting");
  const [retryCount, setRetryCount] = useState(0);
  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;
  const retryDelayRef = useRef(MIN_RETRY_MS);
  const retryCountRef = useRef(0);
  const heartbeatTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pongTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastEventTimeRef = useRef<number>(Date.now());
  const subscriptionsRef = useRef<Set<string>>(new Set());
  const hasConnectedOnce = useRef(false);
  const onReconnectRef = useRef<(() => void) | null>(null);

  const clearHeartbeat = useCallback(() => {
    if (heartbeatTimerRef.current) {
      clearInterval(heartbeatTimerRef.current);
      heartbeatTimerRef.current = null;
    }
    if (pongTimerRef.current) {
      clearTimeout(pongTimerRef.current);
      pongTimerRef.current = null;
    }
  }, []);

  const startHeartbeat = useCallback((ws: WebSocket) => {
    clearHeartbeat();
    heartbeatTimerRef.current = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        // Send a ping message (browser WebSocket doesn't have ws.ping(),
        // so we send a JSON ping that also serves as keepalive)
        ws.send(JSON.stringify({ type: "ping" }));
        // Set pong timeout
        pongTimerRef.current = setTimeout(() => {
          console.log("[ws] Pong timeout — closing connection");
          ws.close(4000, "Pong timeout");
        }, PONG_TIMEOUT_MS);
      }
    }, HEARTBEAT_INTERVAL_MS);
  }, [clearHeartbeat]);

  useEffect(() => {
    let ws: WebSocket;
    let retryTimeout: ReturnType<typeof setTimeout>;
    let disposed = false;

    function connect() {
      if (disposed) return;

      const isReconnect = hasConnectedOnce.current;
      setStatus(isReconnect ? "reconnecting" : "connecting");

      const url = getWsUrl();
      ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        setStatus("connected");
        retryDelayRef.current = MIN_RETRY_MS;
        retryCountRef.current = 0;
        setRetryCount(0);
        hasConnectedOnce.current = true;
        console.log("[ws] Connected");

        startHeartbeat(ws);

        // Resync: replay missed events + resubscribe
        if (isReconnect) {
          // Request event replay from server
          ws.send(JSON.stringify({ type: "replay", since: lastEventTimeRef.current }));
          // Resubscribe to all tracked sessions
          for (const sessionId of subscriptionsRef.current) {
            ws.send(JSON.stringify({ type: "subscribe", sessionId }));
          }
          // Trigger reconnect callback (Layout uses this to refetch state)
          onReconnectRef.current?.();
        }
      };

      ws.onmessage = (evt) => {
        try {
          const data = JSON.parse(evt.data);
          // Handle pong response (clears the timeout)
          if (data.type === "pong") {
            if (pongTimerRef.current) {
              clearTimeout(pongTimerRef.current);
              pongTimerRef.current = null;
            }
            return;
          }
          lastEventTimeRef.current = Date.now();
          onEventRef.current(data as ServerEvent);
        } catch {
          /* ignore malformed messages */
        }
      };

      ws.onclose = () => {
        clearHeartbeat();
        if (disposed) return;

        retryCountRef.current++;
        const count = retryCountRef.current;
        setRetryCount(count);

        if (count >= MAX_RETRIES) {
          setStatus("disconnected");
          console.log("[ws] Max retries reached — giving up");
          return;
        }

        setStatus("reconnecting");
        const delay = applyJitter(retryDelayRef.current);
        console.log(`[ws] Disconnected, retrying in ${Math.round(delay / 1000)}s (attempt ${count}/${MAX_RETRIES})...`);
        retryTimeout = setTimeout(connect, delay);
        // Exponential backoff
        retryDelayRef.current = Math.min(retryDelayRef.current * 2, MAX_RETRY_MS);
      };

      ws.onerror = () => {
        ws.close();
      };
    }

    connect();

    return () => {
      disposed = true;
      clearHeartbeat();
      clearTimeout(retryTimeout);
      ws?.close();
    };
  }, [startHeartbeat, clearHeartbeat]);

  const send = useCallback((command: ClientCommand) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(command));
      return true;
    }
    return false;
  }, []);

  const subscribe = useCallback((sessionId: string) => {
    subscriptionsRef.current.add(sessionId);
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "subscribe", sessionId }));
    }
  }, []);

  const unsubscribe = useCallback((sessionId: string) => {
    subscriptionsRef.current.delete(sessionId);
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "unsubscribe", sessionId }));
    }
  }, []);

  const manualRetry = useCallback(() => {
    retryDelayRef.current = MIN_RETRY_MS;
    retryCountRef.current = 0;
    setRetryCount(0);
    // Close existing connection to trigger reconnect
    wsRef.current?.close();
  }, []);

  const setOnReconnect = useCallback((cb: () => void) => {
    onReconnectRef.current = cb;
  }, []);

  return {
    status,
    connected: status === "connected",
    retryCount,
    maxRetries: MAX_RETRIES,
    send,
    subscribe,
    unsubscribe,
    manualRetry,
    setOnReconnect,
  };
}
