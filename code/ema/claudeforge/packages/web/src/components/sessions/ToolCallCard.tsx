"use client";

import { useState } from "react";
import {
  FileCode,
  Pencil,
  FilePlus,
  Terminal,
  Search,
  CheckCircle,
  XCircle,
  Sparkles,
  Zap,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import type { ToolCall, ToolCallKind } from "@claudeforge/shared";

const TOOL_CONFIG: Record<
  ToolCallKind,
  { icon: any; borderColor: string; label: string }
> = {
  read: { icon: FileCode, borderColor: "border-l-info", label: "Read" },
  edit: { icon: Pencil, borderColor: "border-l-warning", label: "Edit" },
  write: { icon: FilePlus, borderColor: "border-l-primary", label: "Write" },
  bash: { icon: Terminal, borderColor: "border-l-success", label: "Shell" },
  search: { icon: Search, borderColor: "border-l-secondary", label: "Search" },
  done: { icon: CheckCircle, borderColor: "border-l-success", label: "Done" },
  error: { icon: XCircle, borderColor: "border-l-error", label: "Error" },
  thinking: {
    icon: Sparkles,
    borderColor: "border-l-text-muted",
    label: "Thinking",
  },
  generic: { icon: Zap, borderColor: "border-l-text-secondary", label: "Tool" },
};

export function ToolCallCard({ toolCall }: { toolCall: ToolCall }) {
  const [expanded, setExpanded] = useState(toolCall.kind !== "thinking");
  const config = TOOL_CONFIG[toolCall.kind] ?? TOOL_CONFIG.generic;
  const Icon = config.icon;

  return (
    <div
      className={`border-l-2 ${config.borderColor} bg-input rounded-r-lg overflow-hidden animate-fade-in`}
    >
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 w-full px-3 py-2 text-xs text-text-secondary hover:text-text-primary transition-colors"
      >
        <Icon size={14} strokeWidth={1.5} />
        <span className="font-mono truncate">{toolCall.title}</span>
        {toolCall.filePath && toolCall.kind !== "bash" && (
          <span className="text-text-muted ml-auto truncate max-w-[200px]">
            {toolCall.filePath}
          </span>
        )}
        {expanded ? (
          <ChevronDown size={12} className="shrink-0" />
        ) : (
          <ChevronRight size={12} className="shrink-0" />
        )}
      </button>

      {/* Content */}
      {expanded && (toolCall.input || toolCall.output) && (
        <div className="px-3 pb-2">
          {toolCall.output && (
            <pre className="text-xs font-mono text-text-secondary overflow-x-auto max-h-64 overflow-y-auto whitespace-pre-wrap">
              {toolCall.output.slice(0, 5000)}
            </pre>
          )}
          {toolCall.input && !toolCall.output && (
            <pre className="text-xs font-mono text-text-secondary overflow-x-auto max-h-64 overflow-y-auto whitespace-pre-wrap">
              {toolCall.input.slice(0, 5000)}
            </pre>
          )}
        </div>
      )}
    </div>
  );
}
