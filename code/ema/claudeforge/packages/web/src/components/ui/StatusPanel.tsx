import type { ReactNode } from "react";

interface StatusPanelItem {
  label: string;
  value: ReactNode;
  detail?: ReactNode;
}

interface StatusPanelProps {
  title?: string;
  items: StatusPanelItem[];
}

export function StatusPanel({ title = "Status", items }: StatusPanelProps) {
  return (
    <div className="bg-surface border border-border rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-border text-[11px] uppercase tracking-[0.2em] text-text-muted">
        {title}
      </div>
      <div className="divide-y divide-border">
        {items.map((item) => (
          <div key={item.label} className="px-4 py-3">
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs uppercase tracking-[0.16em] text-text-muted">{item.label}</span>
              <div className="text-sm font-medium text-text-primary text-right">{item.value}</div>
            </div>
            {item.detail ? <div className="mt-1 text-xs text-text-secondary">{item.detail}</div> : null}
          </div>
        ))}
      </div>
    </div>
  );
}
