"use client";

interface KeyboardShortcutsProps {
  open: boolean;
  onClose: () => void;
}

const SHORTCUTS = [
  { keys: ["⌘", "K"], desc: "Open command palette" },
  { keys: ["Ctrl", "1"], desc: "Conversations tab" },
  { keys: ["Ctrl", "2"], desc: "Agent Activity tab" },
  { keys: ["Ctrl", "3"], desc: "Vault Browser tab" },
  { keys: ["/"], desc: "Focus vault search" },
  { keys: ["Esc"], desc: "Close modal / panel" },
  { keys: ["?"], desc: "Show this help" },
];

export default function KeyboardShortcuts({ open, onClose }: KeyboardShortcutsProps) {
  if (!open) return null;

  return (
    <div className="shortcuts-overlay" onClick={onClose}>
      <div
        className="animate-scale-fade-in w-80 rounded-xl p-5"
        style={{
          background: "var(--color-surface)",
          border: "1px solid var(--color-border)",
          boxShadow: "0 24px 48px rgba(0,0,0,0.5)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>
            ⌨️ Keyboard Shortcuts
          </h3>
          <button
            onClick={onClose}
            className="text-xs cursor-pointer"
            style={{ color: "var(--color-text-secondary)" }}
          >
            ✕
          </button>
        </div>
        <div className="space-y-2">
          {SHORTCUTS.map((s, i) => (
            <div key={i} className="flex items-center justify-between text-xs">
              <span style={{ color: "var(--color-text-secondary)" }}>{s.desc}</span>
              <div className="flex gap-1">
                {s.keys.map((k, j) => (
                  <kbd
                    key={j}
                    className="px-1.5 py-0.5 rounded text-[10px] font-mono"
                    style={{
                      background: "var(--color-surface-elevated)",
                      color: "var(--color-text-primary)",
                      border: "1px solid var(--color-border)",
                    }}
                  >
                    {k}
                  </kbd>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
