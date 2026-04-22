"use client";

import { useState, useRef, useEffect } from "react";
import { AGENTS } from "@/lib/types";
import { useToast } from "./ToastProvider";

interface ComposeOverlayProps {
  open: boolean;
  onClose: () => void;
  preselectedAgent?: string;
}

const SEND_AGENTS = Object.values(AGENTS).filter(a => a.id !== "user");

export default function ComposeOverlay({ open, onClose, preselectedAgent }: ComposeOverlayProps) {
  const [message, setMessage] = useState("");
  const [selectedAgent, setSelectedAgent] = useState(preselectedAgent || "main");
  const [sending, setSending] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (preselectedAgent) setSelectedAgent(preselectedAgent);
  }, [preselectedAgent]);

  useEffect(() => {
    if (open && textareaRef.current) {
      setTimeout(() => textareaRef.current?.focus(), 300);
    }
    if (!open) {
      setMessage("");
      setSending(false);
    }
  }, [open]);

  const handleSend = async () => {
    if (!message.trim() || sending) return;
    setSending(true);
    try {
      const res = await fetch("/api/messages/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: message.trim(), agent: selectedAgent }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast(`Message sent to ${AGENTS[selectedAgent]?.name || selectedAgent}`, "success");
        setMessage("");
        onClose();
      } else {
        toast(data.error || "Failed to send message", "error");
      }
    } catch {
      toast("Network error — couldn't send", "error");
    } finally {
      setSending(false);
    }
  };

  if (!open) return null;

  const agent = AGENTS[selectedAgent];

  return (
    <div
      className="fixed inset-0 z-[60] flex flex-col"
      style={{
        background: "rgba(10, 10, 14, 0.97)",
        backdropFilter: "blur(30px)",
        animation: "compose-enter 0.3s ease-out",
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 shrink-0"
        style={{ borderBottom: "1px solid var(--color-border)" }}
      >
        <button onClick={onClose} className="text-sm font-medium px-3 py-1 rounded-lg"
          style={{ color: "var(--color-text-secondary)" }}
        >
          Cancel
        </button>
        <span className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>
          Send Message
        </span>
        <button
          onClick={handleSend}
          disabled={!message.trim() || sending}
          className="text-sm font-semibold px-4 py-1.5 rounded-lg transition-opacity"
          style={{
            background: agent?.color || "var(--color-accent)",
            color: "#000",
            opacity: !message.trim() || sending ? 0.4 : 1,
          }}
        >
          {sending ? "..." : "Send"}
        </button>
      </div>

      {/* Agent selector chips */}
      <div className="px-4 py-3 shrink-0 overflow-x-auto">
        <div className="flex gap-2">
          {SEND_AGENTS.map(a => (
            <button
              key={a.id}
              onClick={() => setSelectedAgent(a.id)}
              className="shrink-0 px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5 transition-all"
              style={{
                background: selectedAgent === a.id ? `${a.color}30` : "var(--color-surface-elevated)",
                border: `1.5px solid ${selectedAgent === a.id ? a.color : "transparent"}`,
                color: selectedAgent === a.id ? a.color : "var(--color-text-secondary)",
              }}
            >
              <span>{a.emoji}</span>
              <span>{a.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Text area */}
      <div className="flex-1 px-4">
        <textarea
          ref={textareaRef}
          value={message}
          onChange={e => setMessage(e.target.value)}
          placeholder={`Message ${agent?.name || "agent"}...`}
          className="w-full h-full resize-none text-sm p-3 rounded-xl outline-none"
          style={{
            background: "var(--color-surface)",
            color: "var(--color-text-primary)",
            border: "1px solid var(--color-border)",
            caretColor: agent?.color || "var(--color-accent)",
            maxHeight: "60vh",
          }}
          onKeyDown={e => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleSend();
          }}
        />
      </div>

      {/* Bottom hint */}
      <div className="px-4 py-3 text-center shrink-0">
        <span className="text-[10px]" style={{ color: "var(--color-text-secondary)" }}>
          ⌘+Enter to send • Sending to {agent?.emoji} {agent?.name}
        </span>
      </div>

      <style jsx>{`
        @keyframes compose-enter {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
