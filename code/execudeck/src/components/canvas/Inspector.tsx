'use client';

export function Inspector() {
  return (
    <div className="border-t border-border bg-card p-3">
      <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
        Inspector
      </div>
      <div className="text-xs text-muted-foreground">
        Select a component node to inspect its properties.
      </div>
    </div>
  );
}
