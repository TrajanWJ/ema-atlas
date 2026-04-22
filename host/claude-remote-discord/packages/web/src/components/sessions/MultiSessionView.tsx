"use client";

import { useState, useRef, useCallback } from "react";
import { useSessionStore } from "@/stores/session-store";
import { ChatView } from "./ChatView";
import { X, Hash } from "lucide-react";

export function MultiSessionView() {
  const { sessions } = useSessionStore();
  const [leftSessionId, setLeftSessionId] = useState<string | null>(null);
  const [rightSessionId, setRightSessionId] = useState<string | null>(null);
  const [splitRatio, setSplitRatio] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  const handleMouseDown = useCallback(() => {
    dragging.current = true;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";

    const handleMouseMove = (e: MouseEvent) => {
      if (!dragging.current || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const pct = ((e.clientX - rect.left) / rect.width) * 100;
      setSplitRatio(Math.max(20, Math.min(80, pct)));
    };

    const handleMouseUp = () => {
      dragging.current = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  }, []);

  const SessionPicker = ({
    selectedId,
    onSelect,
    excludeId,
  }: {
    selectedId: string | null;
    onSelect: (id: string | null) => void;
    excludeId: string | null;
  }) => (
    <div className="flex-1 flex items-center justify-center bg-void">
      <div className="text-center p-6">
        <p className="text-sm text-text-muted mb-3">Select a session</p>
        <div className="space-y-1 max-h-[300px] overflow-y-auto">
          {sessions
            .filter((s) => s.id !== excludeId)
            .map((s) => (
              <button
                key={s.id}
                onClick={() => onSelect(s.id)}
                className={`flex items-center gap-2 w-full px-3 py-2 rounded text-sm transition-colors ${
                  selectedId === s.id
                    ? "bg-primary/10 text-primary"
                    : "text-text-secondary hover:text-text-primary hover:bg-primary/5"
                }`}
              >
                <Hash size={14} />
                <span className="truncate">{s.name}</span>
              </button>
            ))}
          {sessions.length === 0 && (
            <p className="text-xs text-text-muted">No sessions available</p>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div ref={containerRef} className="flex h-full overflow-hidden">
      {/* Left pane */}
      <div style={{ width: `${splitRatio}%` }} className="flex flex-col min-w-0">
        {leftSessionId ? (
          <ScopedChatView
            sessionId={leftSessionId}
            onClose={() => setLeftSessionId(null)}
          />
        ) : (
          <SessionPicker
            selectedId={leftSessionId}
            onSelect={setLeftSessionId}
            excludeId={rightSessionId}
          />
        )}
      </div>

      {/* Divider */}
      <div
        onMouseDown={handleMouseDown}
        className="w-1 bg-border hover:bg-primary/50 cursor-col-resize shrink-0 transition-colors"
      />

      {/* Right pane */}
      <div style={{ width: `${100 - splitRatio}%` }} className="flex flex-col min-w-0">
        {rightSessionId ? (
          <ScopedChatView
            sessionId={rightSessionId}
            onClose={() => setRightSessionId(null)}
          />
        ) : (
          <SessionPicker
            selectedId={rightSessionId}
            onSelect={setRightSessionId}
            excludeId={leftSessionId}
          />
        )}
      </div>
    </div>
  );
}

/**
 * A ChatView scoped to a specific session ID, independent of global activeSession.
 * Uses a simplified version that renders its own session context.
 */
function ScopedChatView({
  sessionId,
  onClose,
}: {
  sessionId: string;
  onClose: () => void;
}) {
  const { setActiveSession } = useSessionStore();

  return (
    <div className="flex flex-col h-full relative">
      <button
        onClick={onClose}
        aria-label="Close pane"
        className="absolute top-2 right-2 z-10 text-text-muted hover:text-text-primary bg-surface/80 rounded p-1 transition-colors"
        title="Close pane"
      >
        <X size={14} />
      </button>
      <div
        className="flex-1 min-h-0"
        onClick={() => setActiveSession(sessionId)}
      >
        <ChatViewForSession sessionId={sessionId} />
      </div>
    </div>
  );
}

/** Minimal ChatView that uses a specific session ID */
function ChatViewForSession({ sessionId }: { sessionId: string }) {
  const { setActiveSession } = useSessionStore();

  // Set active session so ChatView renders it
  useState(() => {
    setActiveSession(sessionId);
  });

  return <ChatView />;
}
