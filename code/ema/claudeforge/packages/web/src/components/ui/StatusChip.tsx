import type { ReactNode } from "react";

interface StatusChipProps {
  children: ReactNode;
  tone?: "neutral" | "success" | "warning" | "error" | "info" | "primary";
}

const TONE_STYLES: Record<NonNullable<StatusChipProps["tone"]>, string> = {
  neutral: "bg-text-muted/15 text-text-secondary",
  success: "bg-success/15 text-success",
  warning: "bg-warning/15 text-warning",
  error: "bg-error/15 text-error",
  info: "bg-info/15 text-info",
  primary: "bg-primary/15 text-primary",
};

export function StatusChip({ children, tone = "neutral" }: StatusChipProps) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${TONE_STYLES[tone]}`}>
      {children}
    </span>
  );
}
