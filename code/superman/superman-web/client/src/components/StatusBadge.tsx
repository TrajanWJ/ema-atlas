interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md';
}

const statusColors: Record<string, { bg: string; text: string; dot: string }> = {
  critical: { bg: 'bg-danger/10', text: 'text-danger', dot: 'bg-danger' },
  high: { bg: 'bg-warning/10', text: 'text-warning', dot: 'bg-warning' },
  medium: { bg: 'bg-cyan/10', text: 'text-cyan', dot: 'bg-cyan' },
  low: { bg: 'bg-muted/10', text: 'text-muted', dot: 'bg-muted' },
  resolved: { bg: 'bg-success/10', text: 'text-success', dot: 'bg-success' },
  backlog: { bg: 'bg-muted/10', text: 'text-muted', dot: 'bg-muted' },
  in_progress: { bg: 'bg-cyan/10', text: 'text-cyan', dot: 'bg-cyan' },
  done: { bg: 'bg-success/10', text: 'text-success', dot: 'bg-success' },
  complete: { bg: 'bg-success/10', text: 'text-success', dot: 'bg-success' },
  partial: { bg: 'bg-warning/10', text: 'text-warning', dot: 'bg-warning' },
  broken: { bg: 'bg-danger/10', text: 'text-danger', dot: 'bg-danger' },
};

export function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const colors = statusColors[status] || statusColors.low;
  const label = status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

  return (
    <span className={`
      inline-flex items-center gap-1.5 rounded-full font-medium
      ${colors.bg} ${colors.text}
      ${size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs'}
    `}>
      <span className={`w-1.5 h-1.5 rounded-full ${colors.dot}`} />
      {label}
    </span>
  );
}
