type ViewMode = "board" | "list";

interface ViewModeSwitcherProps {
  value: ViewMode;
  onChange: (mode: ViewMode) => void;
}

export function ViewModeSwitcher({ value, onChange }: ViewModeSwitcherProps) {
  return (
    <div className="inline-flex items-center rounded-lg border border-border bg-surface-elevated p-1 text-xs">
      {(["board", "list"] as ViewMode[]).map((mode) => (
        <button
          key={mode}
          onClick={() => onChange(mode)}
          className={`px-2.5 py-1 rounded-md capitalize transition-colors ${
            value === mode
              ? "bg-primary/15 text-primary"
              : "text-text-secondary hover:text-text-primary"
          }`}
        >
          {mode}
        </button>
      ))}
    </div>
  );
}
