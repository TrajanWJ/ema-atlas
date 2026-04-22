"use client";

import type { ChatMessage } from "@claudeforge/shared";
import { ToolCallCard } from "./ToolCallCard";
import { User, Bot } from "lucide-react";

export function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";
  const time = new Date(message.createdAt).toLocaleTimeString([], {
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

  return (
    <div
      className={`px-4 py-2 flex gap-3 animate-fade-in ${
        isUser ? "bg-primary/5" : ""
      }`}
    >
      {/* Avatar */}
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
          isUser ? "bg-primary/20 text-primary" : "bg-accent-warm/20 text-accent-warm"
        }`}
      >
        {isUser ? <User size={16} /> : <Bot size={16} />}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2">
          <span className="text-sm font-medium text-text-primary">
            {isUser ? "You" : "Claude"}
          </span>
          <span className="text-xs text-text-muted">{time}</span>
        </div>
        <div className="text-sm text-text-primary mt-0.5 whitespace-pre-wrap break-words">
          {message.content}
        </div>
      </div>
    </div>
  );
}
