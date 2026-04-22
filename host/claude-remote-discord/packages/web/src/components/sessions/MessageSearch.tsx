"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { X, ChevronUp, ChevronDown } from "lucide-react";

interface MessageSearchProps {
  messages: Array<{ id: string; content: string }>;
  onClose: () => void;
  onHighlight: (messageId: string | null) => void;
}

export function MessageSearch({
  messages,
  onClose,
  onHighlight,
}: MessageSearchProps) {
  const [query, setQuery] = useState("");
  const [currentMatch, setCurrentMatch] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const matches = query.length >= 2
    ? messages
        .filter((m) => m.content.toLowerCase().includes(query.toLowerCase()))
        .map((m) => m.id)
    : [];

  const totalMatches = matches.length;

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (totalMatches > 0) {
      const idx = Math.min(currentMatch, totalMatches - 1);
      setCurrentMatch(idx);
      onHighlight(matches[idx]);
    } else {
      onHighlight(null);
    }
  }, [query, totalMatches]);

  const navigate = useCallback(
    (direction: "up" | "down") => {
      if (totalMatches === 0) return;
      const next =
        direction === "down"
          ? (currentMatch + 1) % totalMatches
          : (currentMatch - 1 + totalMatches) % totalMatches;
      setCurrentMatch(next);
      onHighlight(matches[next]);
    },
    [currentMatch, totalMatches, matches, onHighlight],
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      onClose();
      return;
    }
    if (e.key === "Enter") {
      e.preventDefault();
      navigate(e.shiftKey ? "up" : "down");
    }
  };

  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-surface border-b border-border">
      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Search messages..."
        className="flex-1 bg-input border border-border rounded px-2 py-1 text-sm text-text-primary placeholder-text-muted outline-none focus:border-primary"
      />
      {query.length >= 2 && (
        <span className="text-xs text-text-muted whitespace-nowrap">
          {totalMatches > 0
            ? `${currentMatch + 1} of ${totalMatches}`
            : "No matches"}
        </span>
      )}
      <button
        onClick={() => navigate("up")}
        disabled={totalMatches === 0}
        className="text-text-secondary hover:text-text-primary disabled:text-text-muted transition-colors"
      >
        <ChevronUp size={16} />
      </button>
      <button
        onClick={() => navigate("down")}
        disabled={totalMatches === 0}
        className="text-text-secondary hover:text-text-primary disabled:text-text-muted transition-colors"
      >
        <ChevronDown size={16} />
      </button>
      <button
        onClick={onClose}
        className="text-text-secondary hover:text-text-primary transition-colors"
      >
        <X size={16} />
      </button>
    </div>
  );
}

/** Highlight matching text in a string */
export function highlightText(
  text: string,
  query: string,
): React.ReactNode {
  if (!query || query.length < 2) return text;
  const lower = text.toLowerCase();
  const qLower = query.toLowerCase();
  const idx = lower.indexOf(qLower);
  if (idx === -1) return text;

  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-primary/30 text-text-primary rounded-sm px-0.5">
        {text.slice(idx, idx + query.length)}
      </mark>
      {text.slice(idx + query.length)}
    </>
  );
}
