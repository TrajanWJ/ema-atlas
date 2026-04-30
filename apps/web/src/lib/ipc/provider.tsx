"use client";

import { createContext, useEffect, useMemo, useState, ReactNode } from "react";
import { createIpcClient, IpcClient } from "@ema/surface-core/ipc-client";

export const IpcContext = createContext<IpcClient | null>(null);

export function IpcProvider({ children }: { children: ReactNode }) {
  // Lazy + crash-safe: createIpcClient could throw if the underlying
  // transport rejects. Wrap so a failed IPC client never blocks render.
  const [client] = useState<IpcClient | null>(() => {
    try {
      return createIpcClient({
        url: inferDaemonUrl(),
        surface: "web",
      });
    } catch (e) {
      // Daemon unreachable / transport unavailable — surface still mounts
      // with `null` client; useProjection() returns null gracefully.
      console.warn("[ipc] createIpcClient failed:", e);
      return null;
    }
  });

  useEffect(() => {
    if (!client) return;
    try {
      void client.connect();
    } catch (e) {
      console.warn("[ipc] connect failed:", e);
    }
    return () => {
      try {
        client.disconnect();
      } catch {
        /* swallow */
      }
    };
  }, [client]);

  const value = useMemo(() => client, [client]);
  return <IpcContext.Provider value={value}>{children}</IpcContext.Provider>;
}

function inferDaemonUrl(): string {
  // In dev the daemon is on 127.0.0.1:49555. Surfaces never talk to a
  // remote host; EMA's remote reach is daemon-to-daemon replication.
  return process.env.NEXT_PUBLIC_EMA_DAEMON_URL ?? "ws://127.0.0.1:49555";
}
