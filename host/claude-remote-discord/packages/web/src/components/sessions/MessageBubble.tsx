"use client";

import { useState, memo } from "react";
import type { ChatMessage, MessageAnnotation } from "@claudeforge/shared";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ToolCallCard } from "./ToolCallCard";
import { User, Bot, AlertTriangle, Copy, Check, Bookmark, StickyNote, X } from "lucide-react";

function relativeTime(timestamp: number): string {
  const diff = Math.floor((Date.now() - timestamp) / 1000);
  if (diff < 10) return "just now";
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function AnnotationButtons({
  messageId,
  annotations,
  onAnnotate,
  onDeleteAnnotation,
}: {
  messageId: string;
  annotations: MessageAnnotation[];
  onAnnotate?: (messageId: string, type: "bookmark" | "note", content?: string) => void;
  onDeleteAnnotation?: (id: string) => void;
}) {
  const [showNoteInput, setShowNoteInput] = useState(false);
  const [noteText, setNoteText] = useState("");

  const isBookmarked = annotations.some((a) => a.type === "bookmark");
  const notes = annotations.filter((a) => a.type === "note");

  const handleBookmarkToggle = () => {
    const existing = annotations.find((a) => a.type === "bookmark");
    if (existing) {
      onDeleteAnnotation?.(existing.id);
    } else {
      onAnnotate?.(messageId, "bookmark");
    }
  };

  const handleNoteSubmit = () => {
    if (noteText.trim()) {
      onAnnotate?.(messageId, "note", noteText.trim());
      setNoteText("");
      setShowNoteInput(false);
    }
  };

  return (
    <div className="flex items-center gap-0.5">
      <button
        onClick={handleBookmarkToggle}
        className={`p-1 rounded transition-all ${
          isBookmarked
            ? "text-primary opacity-100"
            : "opacity-0 group-hover:opacity-100 text-text-muted hover:text-primary"
        } hover:bg-primary/10`}
        title={isBookmarked ? "Remove bookmark" : "Bookmark"}
      >
        <Bookmark size={14} fill={isBookmarked ? "currentColor" : "none"} />
      </button>
      <div className="relative">
        <button
          onClick={() => setShowNoteInput(!showNoteInput)}
          className={`p-1 rounded transition-all ${
            notes.length > 0
              ? "text-accent-warm opacity-100"
              : "opacity-0 group-hover:opacity-100 text-text-muted hover:text-accent-warm"
          } hover:bg-accent-warm/10`}
          title="Add note"
        >
          <StickyNote size={14} />
          {notes.length > 0 && (
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-accent-warm text-void text-[8px] rounded-full flex items-center justify-center">
              {notes.length}
            </span>
          )}
        </button>
        {showNoteInput && (
          <div className="absolute top-full right-0 mt-1 z-50 w-64 bg-surface border border-border rounded-lg shadow-lg p-2">
            {notes.map((note) => (
              <div key={note.id} className="flex items-start gap-1 mb-1 text-xs text-text-secondary bg-void rounded px-2 py-1">
                <span className="flex-1">{note.content}</span>
                <button
                  onClick={() => onDeleteAnnotation?.(note.id)}
                  className="text-text-muted hover:text-error shrink-0"
                >
                  <X size={10} />
                </button>
              </div>
            ))}
            <div className="flex gap-1">
              <input
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleNoteSubmit()}
                placeholder="Add a note..."
                className="flex-1 bg-void border border-border rounded px-2 py-1 text-xs text-text-primary outline-none focus:border-primary placeholder:text-text-muted"
                autoFocus
              />
              <button
                onClick={handleNoteSubmit}
                disabled={!noteText.trim()}
                className="text-xs text-primary px-2 py-1 rounded hover:bg-primary/10 disabled:opacity-50"
              >
                Add
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <button
      onClick={handleCopy}
      className="opacity-0 group-hover:opacity-100 transition-opacity text-text-muted hover:text-text-primary p-1 rounded hover:bg-primary/10"
      title="Copy message"
    >
      {copied ? <Check size={14} className="text-success" /> : <Copy size={14} />}
    </button>
  );
}

export function MessageBubble({
  message,
  annotations = [],
  onAnnotate,
  onDeleteAnnotation,
}: {
  message: ChatMessage;
  annotations?: MessageAnnotation[];
  onAnnotate?: (messageId: string, type: "bookmark" | "note", content?: string) => void;
  onDeleteAnnotation?: (id: string) => void;
}) {
  const isUser = message.role === "user";
  const absoluteTime = new Date(message.createdAt).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  // Tool call messages
  if (message.toolCall) {
    return (
      <div className="px-4 py-1 animate-fade-in">
        <ToolCallCard toolCall={message.toolCall} />
      </div>
    );
  }

  // System messages (errors, notifications)
  if (message.role === "system") {
    return (
      <div className="px-4 py-2 mx-4 my-1 bg-error/5 border border-error/20 rounded-lg animate-fade-in">
        <div className="flex gap-3">
          <div className="w-7 h-7 rounded-full bg-error/20 text-error flex items-center justify-center shrink-0 mt-0.5">
            <AlertTriangle size={14} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline gap-2">
              <span className="text-xs font-medium text-error">System</span>
              <span className="text-[11px] text-text-muted" title={absoluteTime}>
                {relativeTime(message.createdAt)}
              </span>
            </div>
            <div className="text-sm text-error/80 mt-0.5">{message.content}</div>
          </div>
        </div>
      </div>
    );
  }

  // User messages — right-aligned
  if (isUser) {
    return (
      <div className="px-4 py-2 flex justify-end animate-fade-in group">
        <div className="max-w-[75%] flex items-start gap-2">
          <AnnotationButtons
            messageId={message.id}
            annotations={annotations}
            onAnnotate={onAnnotate}
            onDeleteAnnotation={onDeleteAnnotation}
          />
          <CopyButton text={message.content} />
          <div className="bg-primary/10 border-l-2 border-primary rounded-lg px-4 py-2.5">
            <div className="flex items-baseline gap-2 mb-0.5">
              <span className="text-xs font-medium text-primary">You</span>
              <span className="text-[11px] text-text-muted" title={absoluteTime}>
                {relativeTime(message.createdAt)}
              </span>
            </div>
            <div className="text-sm text-text-primary whitespace-pre-wrap break-words">
              {message.content}
            </div>
          </div>
          <div className="w-7 h-7 rounded-full bg-primary/20 text-primary flex items-center justify-center shrink-0 mt-0.5">
            <User size={14} />
          </div>
        </div>
      </div>
    );
  }

  // Assistant messages — left-aligned with markdown
  return (
    <div className="px-4 py-2 flex gap-3 animate-fade-in group">
      <div className="w-7 h-7 rounded-full bg-accent-warm/20 text-accent-warm flex items-center justify-center shrink-0 mt-0.5">
        <Bot size={14} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2 mb-0.5">
          <span className="text-xs font-medium text-text-primary">Claude</span>
          <span className="text-[11px] text-text-muted" title={absoluteTime}>
            {relativeTime(message.createdAt)}
          </span>
          <CopyButton text={message.content} />
          <AnnotationButtons
            messageId={message.id}
            annotations={annotations}
            onAnnotate={onAnnotate}
            onDeleteAnnotation={onDeleteAnnotation}
          />
        </div>
        <div className="text-sm text-text-primary prose-chat break-words">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {message.content}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  );
}

/** Renders consecutive messages from the same role as a visual group */
export function MessageGroup({
  messages,
  highlightedMessageId,
}: {
  messages: ChatMessage[];
  highlightedMessageId: string | null;
}) {
  if (messages.length === 0) return null;
  const isUser = messages[0].role === "user";
  const firstTime = new Date(messages[0].createdAt).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  if (isUser) {
    return (
      <div className="px-4 py-2 flex justify-end animate-fade-in group">
        <div className="max-w-[75%]">
          <div className="flex items-baseline gap-2 mb-1 justify-end">
            <span className="text-xs font-medium text-primary">You</span>
            <span className="text-[11px] text-text-muted">{firstTime}</span>
          </div>
          <div className="space-y-1">
            {messages.map((msg, i) => (
              <div
                key={msg.id}
                id={`msg-${msg.id}`}
                className={`bg-primary/10 rounded-lg px-4 py-2 ${i === 0 ? "border-l-2 border-primary" : "border-l-2 border-primary/30 ml-2"} ${
                  highlightedMessageId === msg.id ? "bg-primary/15" : ""
                }`}
              >
                <div className="text-sm text-text-primary whitespace-pre-wrap break-words">
                  {msg.content}
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="w-7 h-7 rounded-full bg-primary/20 text-primary flex items-center justify-center shrink-0 mt-0.5 ml-2">
          <User size={14} />
        </div>
      </div>
    );
  }

  // Assistant group
  return (
    <div className="px-4 py-2 flex gap-3 animate-fade-in group">
      <div className="w-7 h-7 rounded-full bg-accent-warm/20 text-accent-warm flex items-center justify-center shrink-0 mt-0.5">
        <Bot size={14} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2 mb-0.5">
          <span className="text-xs font-medium text-text-primary">Claude</span>
          <span className="text-[11px] text-text-muted">{firstTime}</span>
        </div>
        <div className="space-y-2">
          {messages.map((msg) => (
            <div
              key={msg.id}
              id={`msg-${msg.id}`}
              className={`text-sm text-text-primary prose-chat break-words ${
                highlightedMessageId === msg.id ? "bg-primary/5 rounded px-2 py-1" : ""
              }`}
            >
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {msg.content}
              </ReactMarkdown>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
