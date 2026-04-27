// RIP: codebase-agent-os-bridge owner-avatar pattern (circular initial
//      badge, kind-tinted ring). Shared between lane-board lane cards
//      and agent-roster actor cards so agents and humans read as the
//      same object language across regions.
import type { seeAgentWorkProjection } from "../mock-projections";

export type Actor = (typeof seeAgentWorkProjection.actors)[number];

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return "·";
  if (parts.length === 1) return parts[0]!.charAt(0).toUpperCase();
  return (parts[0]!.charAt(0) + parts[parts.length - 1]!.charAt(0)).toUpperCase();
}

export function ActorAvatar({
  actor,
  size = 28,
}: {
  actor: Actor | null | undefined;
  size?: number;
}) {
  const kind = actor?.kind ?? "unassigned";
  return (
    <span
      className="ema-avatar"
      data-kind={kind}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.42) }}
      title={actor ? `${actor.display_name} — ${actor.role}` : "unassigned"}
      aria-label={actor?.display_name ?? "unassigned"}
    >
      {actor ? initials(actor.display_name) : "·"}
    </span>
  );
}
