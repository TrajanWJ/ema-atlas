interface SavedViewBarProps {
  views: string[];
  activeView: string;
  onSelect: (view: string) => void;
}

export function SavedViewBar({ views, activeView, onSelect }: SavedViewBarProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {views.map((view) => {
        const active = view === activeView;
        return (
          <button
            key={view}
            onClick={() => onSelect(view)}
            className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
              active
                ? "bg-primary/15 text-primary border border-primary/20"
                : "bg-surface-elevated text-text-secondary border border-border hover:text-text-primary"
            }`}
          >
            {view}
          </button>
        );
      })}
    </div>
  );
}
