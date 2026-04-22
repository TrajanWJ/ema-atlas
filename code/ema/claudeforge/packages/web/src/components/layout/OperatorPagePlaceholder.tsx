import type { ReactNode } from "react";

interface OperatorPagePlaceholderProps {
  icon?: ReactNode;
  title: string;
  eyebrow?: string;
  description: string;
  bullets: string[];
}

export function OperatorPagePlaceholder({
  icon,
  title,
  eyebrow = "EMA operator surface",
  description,
  bullets,
}: OperatorPagePlaceholderProps) {
  return (
    <div className="h-full flex flex-col">
      <div className="px-6 py-4 border-b border-border flex items-center gap-3 shrink-0">
        <div className="text-primary">{icon}</div>
        <div>
          <div className="text-xs uppercase tracking-[0.2em] text-text-muted">{eyebrow}</div>
          <h1 className="text-lg font-semibold">{title}</h1>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl space-y-6">
          <div className="bg-surface border border-border rounded-xl p-6">
            <p className="text-sm text-text-secondary leading-6">{description}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {bullets.map((bullet) => (
              <div key={bullet} className="bg-surface border border-border rounded-lg p-4 text-sm text-text-secondary leading-6">
                {bullet}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
