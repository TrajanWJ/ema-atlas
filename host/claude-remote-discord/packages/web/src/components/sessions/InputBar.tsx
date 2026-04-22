"use client";

import { useState, useRef, useCallback } from "react";
import { Send, Paperclip } from "lucide-react";

export function InputBar({
  onSend,
  disabled,
}: {
  onSend: (content: string) => void;
  disabled?: boolean;
}) {
  const [text, setText] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = useCallback(() => {
    const trimmed = text.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setText("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  }, [text, disabled, onSend]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInput = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 200) + "px";
  };

  return (
    <div className="border-t border-border bg-surface px-4 py-3 shrink-0 sticky bottom-0 z-10">
      <div className="flex items-end gap-2 bg-input border border-border rounded-lg px-3 py-2 focus-within:border-primary focus-within:ring-1 focus-within:ring-primary/25 transition-colors">
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          onInput={handleInput}
          placeholder={disabled ? "Session is not active..." : "Send a message..."}
          aria-label="Message input"
          disabled={disabled}
          rows={1}
          className="flex-1 bg-transparent text-sm text-text-primary placeholder-text-muted outline-none resize-none max-h-[200px]"
        />
        <button
          onClick={handleSend}
          disabled={disabled || !text.trim()}
          aria-label="Send message"
          className="text-primary hover:text-primary-hover disabled:text-text-muted transition-colors shrink-0 mb-0.5"
        >
          <Send size={18} strokeWidth={1.5} />
        </button>
      </div>
      <div className="flex items-center justify-between mt-1 px-1">
        <span className="text-xs text-text-muted">
          Enter to send · Shift+Enter for new line
        </span>
      </div>
    </div>
  );
}
