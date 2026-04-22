"use client";

import { useEffect, useState } from "react";
import type { ConnectionStatus } from "@/hooks/useWebSocket";
import { useMessageQueue } from "@/stores/message-queue";

interface ConnectionStatusBannerProps {
  status: ConnectionStatus;
  retryCount: number;
  maxRetries: number;
  onRetry: () => void;
}

export function ConnectionStatusBanner({
  status,
  retryCount,
  maxRetries,
  onRetry,
}: ConnectionStatusBannerProps) {
  const queueCount = useMessageQueue((s) => s.queue.filter((m) => m.status === "queued").length);
  const [showConnected, setShowConnected] = useState(false);
  const [wasDisconnected, setWasDisconnected] = useState(false);

  // Show "Connected" briefly after reconnection, then hide
  useEffect(() => {
    if (status === "connected" && wasDisconnected) {
      setShowConnected(true);
      const timer = setTimeout(() => setShowConnected(false), 2000);
      return () => clearTimeout(timer);
    }
    if (status !== "connected") {
      setWasDisconnected(true);
      setShowConnected(false);
    }
  }, [status, wasDisconnected]);

  // Connected state — brief green flash then hidden
  if (status === "connected") {
    if (!showConnected) return null;
    return (
      <div
        role="status"
        aria-live="polite"
        className="bg-[#4ADE8020] text-[#4ADE80] text-sm px-4 py-2 text-center shrink-0 transition-all duration-300 ease-out"
      >
        <span className="inline-flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#4ADE80]" />
          Reconnected
          {queueCount > 0 && ` — sending ${queueCount} queued message${queueCount > 1 ? "s" : ""}`}
        </span>
      </div>
    );
  }

  // Connecting (first time)
  if (status === "connecting") {
    return (
      <div
        role="status"
        aria-live="polite"
        className="bg-[#FCD34D20] text-[#FCD34D] text-sm px-4 py-2 text-center shrink-0 transition-all duration-300 ease-out"
      >
        <span className="inline-flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#FCD34D] animate-pulse" />
          Connecting...
        </span>
      </div>
    );
  }

  // Reconnecting
  if (status === "reconnecting") {
    return (
      <div
        role="status"
        aria-live="polite"
        className="bg-[#FCD34D20] text-[#FCD34D] text-sm px-4 py-2 text-center shrink-0 transition-all duration-300 ease-out"
      >
        <span className="inline-flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#FCD34D] animate-pulse" />
          Reconnecting (attempt {retryCount}/{maxRetries})...
          {queueCount > 0 && (
            <span className="text-[#8892B0] ml-2">
              {queueCount} message{queueCount > 1 ? "s" : ""} queued
            </span>
          )}
        </span>
      </div>
    );
  }

  // Disconnected (max retries exceeded)
  return (
    <div
      role="alert"
      aria-live="assertive"
      className="bg-[#FB718530] text-[#FB7185] text-sm px-4 py-2 text-center shrink-0 transition-all duration-300 ease-out"
    >
      <span className="inline-flex items-center gap-3">
        <span className="w-2 h-2 rounded-full bg-[#FB7185]" />
        Connection lost
        {queueCount > 0 && (
          <span className="text-[#8892B0]">
            ({queueCount} message{queueCount > 1 ? "s" : ""} queued)
          </span>
        )}
        <button
          onClick={onRetry}
          className="ml-2 px-3 py-0.5 rounded bg-[#FB718530] hover:bg-[#FB718550] text-[#FB7185] font-medium transition-colors text-xs border border-[#FB718540]"
        >
          Retry
        </button>
      </span>
    </div>
  );
}
