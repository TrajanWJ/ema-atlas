"use client";

/**
 * CommandPalette — glass-blurred fixed-top palette. Direct-rip from
 * donor; only import path is swapped so it consumes the
 * place-reflection `useCommandPalette` hook (which composes real
 * commands over `useCommand`).
 *
 * RIP: place.org src/components/desktop/CommandPalette.tsx
 */

import { useEffect, useRef, useState, useCallback } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useCommandPalette } from "../../commands/use-command-palette";
import type { CommandResult } from "../../commands/use-command-palette";

// ----------------------------------------------------------------------------
// Result row
// ----------------------------------------------------------------------------

interface ResultRowProps {
  readonly result: CommandResult;
  readonly selected: boolean;
  readonly onActivate: (result: CommandResult) => void;
  readonly onHover: () => void;
}

function ResultRow({ result, selected, onActivate, onHover }: ResultRowProps) {
  return (
    <button
      type="button"
      role="option"
      aria-selected={selected}
      className="w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors"
      style={{
        backgroundColor: selected ? "rgba(91,156,245,0.12)" : "transparent",
        color: selected ? "var(--place-text-primary)" : "var(--place-text-secondary)",
        borderLeft: selected ? "2px solid var(--place-secondary-400)" : "2px solid transparent",
      }}
      onClick={() => onActivate(result)}
      onMouseEnter={onHover}
    >
      <span className="text-base leading-none w-5 text-center shrink-0" aria-hidden="true">
        {result.icon}
      </span>
      <span className="flex-1 truncate text-sm font-medium" style={{ color: "var(--place-text-primary)" }}>
        {result.label}
      </span>
      {result.hint !== undefined && (
        <span className="text-xs shrink-0" style={{ color: "var(--place-text-secondary)" }}>
          {result.hint}
        </span>
      )}
    </button>
  );
}

// ----------------------------------------------------------------------------
// Main component
// ----------------------------------------------------------------------------

export function CommandPalette() {
  const { isOpen, query, results, setQuery, close } = useCommandPalette();
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSelectedIndex(0);
  }, [results]);

  useEffect(() => {
    if (isOpen) {
      setSelectedIndex(0);
      inputRef.current?.focus();
    } else {
      setQuery("");
    }
  }, [isOpen, setQuery]);

  const activate = useCallback(
    (result: CommandResult) => {
      result.action?.();
      close();
    },
    [close],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        close();
        return;
      }

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((i) => Math.min(i + 1, results.length - 1));
        return;
      }

      if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((i) => Math.max(i - 1, 0));
        return;
      }

      if (e.key === "Enter") {
        e.preventDefault();
        const selected = results[selectedIndex];
        if (selected !== undefined) {
          activate(selected);
        }
      }
    },
    [results, selectedIndex, activate, close],
  );

  useEffect(() => {
    const list = listRef.current;
    if (list === null) return;
    const item = list.children[selectedIndex] as HTMLElement | undefined;
    if (item !== undefined && typeof item.scrollIntoView === "function") {
      item.scrollIntoView({ block: "nearest" });
    }
  }, [selectedIndex]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="command-palette-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="Command palette"
          className="fixed inset-0 flex items-start justify-center pt-[20vh]"
          style={{ zIndex: 9000, backgroundColor: "rgba(6,6,16,0.6)" }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          onClick={(e) => {
            if (e.target === e.currentTarget) close();
          }}
        >
          <motion.div
            className="glass w-full max-w-xl rounded-2xl overflow-hidden"
            style={{ boxShadow: "0 24px 64px rgba(0,0,0,0.6), 0 0 0 1px var(--place-border-default)" }}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2, ease: [0.65, 0.05, 0, 1] }}
          >
            <div
              className="flex items-center gap-3 px-4 py-3 border-b"
              style={{ borderColor: "var(--place-border-default)" }}
            >
              <span
                className="text-lg shrink-0"
                style={{ color: "var(--place-text-secondary)" }}
                aria-hidden="true"
              >
                ⌘
              </span>
              <input
                ref={inputRef}
                type="text"
                role="combobox"
                aria-expanded={isOpen}
                aria-autocomplete="list"
                aria-controls="command-palette-list"
                aria-activedescendant={
                  results[selectedIndex] !== undefined
                    ? `cp-result-${results[selectedIndex].id}`
                    : undefined
                }
                className="flex-1 bg-transparent text-sm outline-none placeholder:opacity-40"
                style={{ color: "var(--place-text-primary)" }}
                placeholder="Search surfaces, commands…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
              />
              <kbd
                className="text-xs px-1.5 py-0.5 rounded"
                style={{
                  color: "var(--place-text-secondary)",
                  backgroundColor: "rgba(255,255,255,0.05)",
                  border: "1px solid var(--place-border-default)",
                }}
              >
                Esc
              </kbd>
            </div>

            {results.length > 0 && (
              <div
                ref={listRef}
                id="command-palette-list"
                role="listbox"
                aria-label="Results"
                className="overflow-y-auto py-2"
                style={{ maxHeight: "320px" }}
              >
                {results.map((result, index) => (
                  <ResultRow
                    key={result.id}
                    result={result}
                    selected={index === selectedIndex}
                    onActivate={activate}
                    onHover={() => setSelectedIndex(index)}
                  />
                ))}
              </div>
            )}

            {results.length === 0 && query.trim() !== "" && (
              <div
                className="px-4 py-6 text-center text-sm"
                style={{ color: "var(--place-text-secondary)" }}
              >
                No results for &quot;{query}&quot;
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
