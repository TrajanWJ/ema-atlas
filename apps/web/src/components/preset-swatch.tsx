"use client";

import type { CSSProperties } from "react";
import type { ThemePreset } from "@ema/design-system";

/**
 * Tiny ~64x44 visual swatch rendering a theme preset's preview palette
 * as a miniature mock window: `void` background, `surface` rect, two dots
 * for `primary`/`secondary`, and a thin text line for `text`.
 *
 * Inline colors are intentional here — the swatches must render the
 * preset's *own* palette, not the currently active theme's tokens.
 */

export interface PresetSwatchProps {
  readonly preset: ThemePreset;
  readonly active: boolean;
  readonly onSelect: (id: string) => void;
}

export function PresetSwatch({ preset, active, onSelect }: PresetSwatchProps) {
  const { void: voidColor, surface, primary, secondary, text } = preset.preview;

  const buttonStyle: CSSProperties = {
    width: 64,
    height: 44,
    padding: 0,
    border: 0,
    borderRadius: 6,
    background: voidColor,
    cursor: "pointer",
    position: "relative",
    overflow: "hidden",
    transition: "transform 220ms var(--place-ease-smooth), box-shadow 220ms var(--place-ease-smooth)",
    transform: "scale(1)",
    boxShadow: active ? "0 0 0 2px var(--place-primary-400)" : "0 0 0 1px var(--place-border-default)",
  };

  const surfaceStyle: CSSProperties = {
    position: "absolute",
    left: 6,
    top: 6,
    right: 6,
    bottom: 6,
    background: surface,
    borderRadius: 3,
  };

  const primaryDotStyle: CSSProperties = {
    position: "absolute",
    left: 10,
    top: 10,
    width: 6,
    height: 6,
    borderRadius: "50%",
    background: primary,
  };

  const secondaryDotStyle: CSSProperties = {
    position: "absolute",
    left: 20,
    top: 10,
    width: 6,
    height: 6,
    borderRadius: "50%",
    background: secondary,
  };

  const textLineStyle: CSSProperties = {
    position: "absolute",
    left: 10,
    right: 10,
    bottom: 12,
    height: 2,
    background: text,
    borderRadius: 1,
    opacity: 0.85,
  };

  return (
    <button
      type="button"
      role="radio"
      aria-checked={active}
      aria-label={`${preset.name} theme`}
      data-preset-id={preset.id}
      className="ema-preset-swatch"
      style={buttonStyle}
      onClick={() => onSelect(preset.id)}
    >
      <span style={surfaceStyle} aria-hidden="true" />
      <span style={primaryDotStyle} aria-hidden="true" />
      <span style={secondaryDotStyle} aria-hidden="true" />
      <span style={textLineStyle} aria-hidden="true" />
    </button>
  );
}
