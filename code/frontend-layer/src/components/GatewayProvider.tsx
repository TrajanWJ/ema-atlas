"use client";

import { useEffect } from "react";
import { useGatewayStore } from "@/lib/stores/gatewayStore";

export default function GatewayProvider() {
  const connect = useGatewayStore((s) => s.connect);
  const connected = useGatewayStore((s) => s.connected);
  const connecting = useGatewayStore((s) => s.connecting);

  useEffect(() => {
    if (!connected && !connecting) {
      connect().catch((e) => {
        console.warn("[GatewayProvider] Initial connect failed:", e);
      });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return null;
}
