"use client";

import { useState } from "react";
import {
  FileText,
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
  { icon: typeof FileText; color: string; label: string }
> = {
  read: { icon: FileText, color: "var(--color-info)", label: "Read" },
  edit: { icon: Pencil, color: "var(--color-warning)", label: "Edit" },
  write: { icon: FilePlus, color: "var(--color-success)", label: "Write" },
  bash: { icon: Terminal, color: "var(--color-primary)", label: "Shell" },
  search: { icon: Search, color: "var(--color-accent-warm)", label: "Search" },
  done: { icon: CheckCircle, color: "var(--color-success)", label: "Done" },
  error: { icon: XCircle, color: "var(--color-error)", label: "Error" },
  thinking: { icon: Sparkles, color: "var(--color-text-secondary)", label: "Thinking" },
  generic: { icon: Zap, color: "var(--color-text-secondary)", label: "Tool" },
};

const OUTPUT_LINE_LIMIT = 15;
const OUTPUT_CHAR_LIMIT = 5000;

function CollapsibleOutput({ text }: { text: string }) {
  const lines = text.split("\n");
  const isLong = lines.length > OUTPUT_LINE_LIMIT;
  const [showFull, setShowFull] = useState(false);

  const displayText =
    isLong && !showFull
      ? lines.slice(0, OUTPUT_LINE_LIMIT).join("\n")
      : text.slice(0, OUTPUT_CHAR_LIMIT);

  return (
    <>
      <pre className="text-xs font-mono text-text-secondary overflow-x-auto max-h-[300px] overflow-y-auto whitespace-pre-wrap leading-relaxed">
        {displayText}
      </pre>
      {isLong && (
        <button
          onClick={() => setShowFull(!showFull)}
          className="mt-1 text-xs text-text-muted hover:text-text-secondary transition-colors flex items-center gap-1"
        >
          {showFull ? (
            <>
              <ChevronDown size={12} />
              Show less
            </>
          ) : (
            <>
              <ChevronRight size={12} />
              Show {lines.length - OUTPUT_LINE_LIMIT} more lines
            </>
          )}
        </button>
      )}
    </>
  );
}

export function ToolCallCard({ toolCall }: { toolCall: ToolCall }) {
  const [expanded, setExpanded] = useState(false);
  const config = TOOL_CONFIG[toolCall.kind] ?? TOOL_CONFIG.generic;
  const Icon = config.icon;
  const content = toolCall.output || toolCall.input;

  return (
    <div
      className="bg-input rounded-r-lg overflow-hidden animate-fade-in"
      style={{ borderLeft: `3px solid ${config.color}` }}
    >
      {/* Header — always visible */}
      <button
        onClick={() => content && setExpanded(!expanded)}
        className="flex items-center gap-2 w-full px-3 py-2 text-xs text-text-secondary hover:text-text-primary transition-colors"
      >
        <Icon
          size={14}
          strokeWidth={1.5}
          style={{ color: config.color }}
          className="shrink-0"
        />
        <span className="font-semibold truncate">{toolCall.title}</span>
        {toolCall.filePath && toolCall.kind !== "bash" && (
          <span className="text-text-muted ml-auto truncate max-w-[240px] font-mono text-[11px]">
            {toolCall.filePath}
          </span>
        )}
        {content && (
          <span className="shrink-0 ml-auto">
            {expanded ? (
              <ChevronDown size={12} />
            ) : (
              <ChevronRight size={12} />
            )}
          </span>
        )}
      </button>

      {/* Expanded content */}
      {expanded && content && (
        <div className="px-3 pb-2 border-t border-border/50">
          <div className="mt-2">
            <CollapsibleOutput text={content} />
          </div>
        </div>
      )}
    </div>
  );
}
