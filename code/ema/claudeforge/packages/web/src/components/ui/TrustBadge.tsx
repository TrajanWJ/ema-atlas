import { ShieldCheck, ShieldAlert, ShieldQuestion } from "lucide-react";

type TrustState = "observed" | "verified" | "stale" | "inferred";

const CONFIG: Record<TrustState, { label: string; className: string; icon: typeof ShieldCheck }> = {
  observed: { label: "Observed", className: "bg-info/15 text-info", icon: ShieldCheck },
  verified: { label: "Verified", className: "bg-success/15 text-success", icon: ShieldCheck },
  stale: { label: "Stale", className: "bg-warning/15 text-warning", icon: ShieldAlert },
  inferred: { label: "Inferred", className: "bg-text-muted/15 text-text-secondary", icon: ShieldQuestion },
};

export function TrustBadge({ state }: { state: TrustState }) {
  const conf = CONFIG[state];
  const Icon = conf.icon;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${conf.className}`}>
      <Icon size={12} />
      {conf.label}
    </span>
  );
}
