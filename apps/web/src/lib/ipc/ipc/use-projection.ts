import { useContext, useEffect, useState } from "react";
import { IpcContext } from "./provider";

/**
 * Subscribe to a named projection and return its latest snapshot (or
 * `null` if the daemon hasn't sent one yet, e.g. offline).
 */
export function useProjection<T = any>(name: string): T | null {
  const client = useContext(IpcContext);
  const [data, setData] = useState<T | null>(null);

  useEffect(() => {
    if (!client) return;
    const unsub = client.subscribeProjection<T>(name, setData);
    return unsub;
  }, [client, name]);

  return data;
}
