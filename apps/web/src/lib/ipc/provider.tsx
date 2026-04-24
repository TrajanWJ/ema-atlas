import { createContext, useEffect, useMemo, useState, ReactNode } from "react";
import { createIpcClient, IpcClient } from "@ema/surface-core/ipc-client";

export const IpcContext = createContext<IpcClient | null>(null);

export function IpcProvider({ children }: { children: ReactNode }) {
  const [client] = useState<IpcClient>(() =>
    createIpcClient({
      url: inferDaemonUrl(),
      surface: "web",
    }),
  );

  useEffect(() => {
    client.connect();
    return () => client.disconnect();
  }, [client]);

  const value = useMemo(() => client, [client]);
  return <IpcContext.Provider value={value}>{children}</IpcContext.Provider>;
}

function inferDaemonUrl(): string {
  // In dev the daemon is on 127.0.0.1:49555. Surfaces never talk to a
  // remote host; EMA's remote reach is daemon→daemon replication.
  return "ws://127.0.0.1:49555";
}
