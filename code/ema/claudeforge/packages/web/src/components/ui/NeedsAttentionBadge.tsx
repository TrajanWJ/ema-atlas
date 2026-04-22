interface NeedsAttentionBadgeProps {
  count: number;
  label?: string;
}

export function NeedsAttentionBadge({ count, label = "Needs attention" }: NeedsAttentionBadgeProps) {
  if (count <= 0) return null;

  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-warning/15 text-warning px-2 py-0.5 text-[11px] font-medium">
      {count}
      <span>{label}</span>
    </span>
  );
}
