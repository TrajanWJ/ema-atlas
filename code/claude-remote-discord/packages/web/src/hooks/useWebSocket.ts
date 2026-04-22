"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import type { ServerEvent } from "@claudeforge/shared";

const WS_URL = process.env.NEXT_PUBLIC_WS_URL ?? "ws://localhost:3001/ws";

export function useWebSocket(onEvent: (event: ServerEvent) => void) {
  const wsRef = useRef<WebSocket | null>(null);
  const [connected, setConnected] = useState(false);
  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;

  useEffect(() => {
    let ws: WebSocket;
    let retryTimeout: ReturnType<typeof setTimeout>;

    function connect() {
      ws = new WebSocket(WS_URL);
      wsRef.current = ws;

      ws.onopen = () => {
        setConnected(true);
        console.log("[ws] Connected");
      };

      ws.onmessage = (evt) => {
        try {
          const event = JSON.parse(evt.data) as ServerEvent;
          onEventRef.current(event);
        } catch {}
      };

      ws.onclose = () => {
        setConnected(false);
        console.log("[ws] Disconnected, retrying in 3s...");
        retryTimeout = setTimeout(connect, 3000);
      };

      ws.onerror = () => {
        ws.close();
      };
    }

    connect();

    return () => {
      clearTimeout(retryTimeout);
      ws?.close();
    };
  }, []);

  const send = useCallback((data: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data));
    }
  }, []);

  return { connected, send };
}
