/**
 * The visible honest-mock badge component. Per user's `ema-honest-mocks`
 * skill, every control or data panel that does NOT flow through a real
 * daemon writer must carry a visible tag + CLI equivalent.
 *
 * Four allowed `kind` strings (no others). Adding a new kind requires
 * updating the doctrine and this union.
 */

import type { ReactNode } from "react";

export type HonestMockKind =
  | "mocked"
  | "draft"
  | "local only"
  | "pending daemon writer";

export interface MockedLabelProps {
  readonly kind: HonestMockKind;
  readonly cli?: string;
  readonly children?: ReactNode;
}

const KIND_COLORS: Record<HonestMockKind, string> = {
  mocked: "#c98a2a",
  draft: "#5a88b8",
  "local only": "#7a7a7a",
  "pending daemon writer": "#8a5ab0",
};

export function MockedLabel({ kind, cli, children }: MockedLabelProps) {
  const color = KIND_COLORS[kind];
  return (
    <span
      className="ema-honest-mock"
      data-kind={kind}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "2px 6px",
        borderRadius: 4,
        fontSize: 10,
        letterSpacing: 0.3,
        textTransform: "uppercase",
        color,
        border: `1px solid ${color}`,
        background: "rgba(0, 0, 0, 0.35)",
      }}
      title={cli ? `CLI equivalent: ${cli}` : undefined}
    >
      <span aria-hidden="true">●</span>
      <span>{kind}</span>
      {cli ? <code style={{ fontSize: 9, opacity: 0.85 }}>{cli}</code> : null}
      {children}
    </span>
  );
}
