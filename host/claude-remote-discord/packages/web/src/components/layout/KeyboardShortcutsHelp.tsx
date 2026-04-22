"use client";

import { Keyboard } from "lucide-react";
import { useFocusTrap } from "@/hooks/useFocusTrap";

const SHORTCUT_GROUPS = [
  {
    label: "GENERAL",
    shortcuts: [
      { keys: ["Ctrl", "K"], description: "Open command palette" },
      { keys: ["Ctrl", "/"], description: "Toggle sidebar" },
      { keys: ["?"], description: "Show keyboard shortcuts" },
      { keys: ["Esc"], description: "Close overlay / deselect session" },
    ],
  },
  {
    label: "SESSIONS",
    shortcuts: [
      { keys: ["Ctrl", "F"], description: "Search in session messages" },
    ],
  },
  {
    label: "COMMAND PALETTE",
    shortcuts: [
      { keys: ["\u2191", "\u2193"], description: "Navigate results" },
      { keys: ["Enter"], description: "Select item" },
      { keys: ["Esc"], description: "Close palette" },
    ],
  },
];

function Kbd({ children }: { children: string }) {
  return (
    <kbd className="inline-flex items-center justify-center min-w-[24px] h-6 px-1.5 text-[11px] font-mono bg-void border border-border rounded text-text-secondary">
      {children}
    </kbd>
  );
}

export function KeyboardShortcutsHelp({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const trapRef = useFocusTrap(open);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-start justify-center pt-[15vh]" role="dialog" aria-modal="true" aria-label="Keyboard shortcuts" ref={trapRef}>
      <div className="fixed inset-0 bg-black/60" onClick={onClose} aria-hidden="true" />
      <div className="relative w-full max-w-md mx-4 bg-surface border border-border rounded-xl shadow-2xl overflow-hidden animate-fade-in">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
          <Keyboard size={18} strokeWidth={1.5} className="text-text-muted" />
          <span className="text-sm font-medium text-text-primary">Keyboard Shortcuts</span>
          <div className="flex-1" />
          <kbd className="text-[10px] text-text-muted bg-void px-1.5 py-0.5 rounded border border-border">
            ESC
          </kbd>
        </div>

        <div className="max-h-[50vh] overflow-y-auto py-2">
          {SHORTCUT_GROUPS.map((group) => (
            <div key={group.label}>
              <div className="px-4 pt-3 pb-1 text-[11px] font-medium tracking-wider text-text-muted uppercase">
                {group.label}
              </div>
              {group.shortcuts.map((shortcut) => (
                <div
                  key={shortcut.description}
                  className="flex items-center justify-between px-4 py-1.5"
                >
                  <span className="text-sm text-text-secondary">{shortcut.description}</span>
                  <div className="flex items-center gap-1">
                    {shortcut.keys.map((key, i) => (
                      <span key={i} className="flex items-center gap-1">
                        {i > 0 && <span className="text-[10px] text-text-muted">+</span>}
                        <Kbd>{key}</Kbd>
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>

        <div className="px-4 py-2 border-t border-border text-[11px] text-text-muted text-center">
          Press <Kbd>?</Kbd> to toggle this panel
        </div>
      </div>
    </div>
  );
}
