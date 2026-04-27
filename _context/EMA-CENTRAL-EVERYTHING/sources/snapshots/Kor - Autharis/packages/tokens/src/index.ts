// @autharis/tokens — typed mirror of autharis/styles/tokens.css
// Hand-maintained: the source CSS uses var() chains, color-mix(), and multiple
// selectors (:root and [data-theme="dark"]) that a trivial parser would not
// represent faithfully. Keep this file in lockstep with src/tokens.css when
// tokens change. See decisions.md for the sync contract.

export const colors = {
  // Brand palette (fixed)
  brandInk: "#0A0A0B",
  brandInk2: "#1A1A1D",
  brandPaper: "#F6F5F0",
  brandCream: "#EDEBE0",
  brandTerra: "#E8552B",
  brandLime: "#D4F755",
  brandMoss: "#5C8F3A",
  brandSky: "#4B8FC9",
  brandRose: "#F2B5A0",

  // Light surfaces
  bg: "var(--brand-paper)",
  bgRaised: "#FFFFFF",
  bgSunken: "var(--brand-cream)",
  bgContrast: "var(--brand-ink)",

  // Ink (light)
  ink: "#111113",
  ink2: "#333338",
  ink3: "#555560",
  ink4: "#8A8A92",

  // Lines (light)
  line: "#D9D7CE",
  lineSoft: "#E6E4DA",
  lineStrong: "#B0AEA4",

  // Accent (runtime-tweakable)
  accent: "var(--brand-terra)",
  accentInk: "#FFFFFF",
  accentText: "var(--brand-terra)",
  accentSoft: "color-mix(in oklch, var(--accent) 12%, var(--bg))",
  accentLine: "color-mix(in oklch, var(--accent) 45%, var(--line))",

  // Semantic
  pos: "#3E7A2A",
  neg: "#C13A22",
  warn: "#B07C0E",
} as const;

export const colorsDark = {
  bg: "#0A0A0B",
  bgRaised: "#141416",
  bgSunken: "#050506",
  bgContrast: "var(--brand-paper)",

  ink: "#F2F1EB",
  ink2: "#C9C7BF",
  ink3: "#95938B",
  ink4: "#5F5D57",

  line: "#262629",
  lineSoft: "#1A1A1C",
  lineStrong: "#35353A",

  accentSoft: "color-mix(in oklch, var(--accent) 20%, var(--bg))",
  accentLine: "color-mix(in oklch, var(--accent) 45%, var(--line))",

  pos: "#6FC84A",
  neg: "#E8553A",
  warn: "#E8B324",
} as const;

// The source tokens.css does not define an explicit spacing scale; space values
// are applied inline in consuming surfaces. This 4px-based scale is the de-facto
// cadence observed across Wave 1/1.5 components — surfaced here so non-CSS
// consumers (Python reports, RN mobile) have a shared grid.
export const space = {
  "0": "0px",
  "1": "2px",
  "2": "4px",
  "3": "8px",
  "4": "12px",
  "5": "16px",
  "6": "20px",
  "7": "24px",
  "8": "32px",
  "9": "40px",
  "10": "48px",
  "11": "64px",
  "12": "80px",
  "13": "96px",
} as const;

export const radius = {
  xs: "2px",
  sm: "4px",
  md: "8px",
  lg: "14px",
  full: "999px",
} as const;

export const type = {
  family: {
    display: "'Inter Tight', 'Geist', system-ui, sans-serif",
    body: "'Geist', 'Inter Tight', system-ui, sans-serif",
    mono: "'Geist Mono', ui-monospace, monospace",
  },
  size: {
    xs: "11px",
    sm: "13px",
    base: "14px",
    md: "15px",
    lg: "17px",
    xl: "20px",
    "2xl": "26px",
    "3xl": "34px",
    "4xl": "48px",
    "5xl": "64px",
    "6xl": "88px",
  },
} as const;

// Motion: the source CSS does not declare explicit durations/easings — the live
// prototype uses these values inline. Mirrored here so every deliverable agrees.
export const motion = {
  duration: {
    instant: "80ms",
    fast: "140ms",
    base: "200ms",
    slow: "320ms",
    slower: "520ms",
  },
  easing: {
    standard: "cubic-bezier(0.2, 0.7, 0.2, 1)",
    entrance: "cubic-bezier(0.16, 1, 0.3, 1)",
    exit: "cubic-bezier(0.4, 0, 1, 1)",
    linear: "linear",
  },
} as const;

export const shadow = {
  sm: "0 1px 0 rgba(10,10,11,0.04)",
  md: "0 1px 0 rgba(10,10,11,0.04), 0 12px 28px -12px rgba(10,10,11,0.18)",
  lg: "0 2px 0 rgba(10,10,11,0.04), 0 32px 70px -24px rgba(10,10,11,0.25)",
} as const;

export const density = {
  comfortable: 1,
  compact: 0.82,
} as const;

/** Wrap a custom-property name as a CSS `var(...)` reference. */
export function cssVar(name: string): string {
  const prefixed = name.startsWith("--") ? name : `--${name}`;
  return `var(${prefixed})`;
}

export { deliverables } from "./deliverables.js";
export type { Deliverable } from "./deliverables.js";
