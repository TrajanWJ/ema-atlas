import { useEffect, useState } from "react";
import { MOCK_PROJECTION_LABEL } from "./mock-projections";

/**
 * Settings — shell preferences that exercise place.org-ripped controls.
 *
 * Every control here is volatile (no localStorage / no daemon writer
 * yet). Surfaces that mutate canon must flow through a daemon writer;
 * these knobs only tune the browser view. Per the honest-mocks
 * discipline, the panel carries a visible draft label and each
 * control declares its settings-domain tag.
 *
 * Settings domains tracked:
 *  - theme: data-theme on <html> (dark/light/auto)
 *  - contrast: data-contrast on <html> (normal/increased/high)
 *  - glass intensity: --glass-blur-* vars (3–48px)
 *  - wallpaper breathing rate: --ema-wallpaper-breath-rate (12s–90s)
 */

type ThemeMode = "dark" | "light" | "auto";
type ContrastMode = "normal" | "increased" | "high";

const THEMES: Array<{ value: ThemeMode; label: string }> = [
  { value: "dark", label: "Dark" },
  { value: "light", label: "Light" },
  { value: "auto", label: "Auto" },
];

const CONTRASTS: Array<{ value: ContrastMode; label: string }> = [
  { value: "normal", label: "Normal" },
  { value: "increased", label: "Increased" },
  { value: "high", label: "High" },
];

export function SettingsPage() {
  const [theme, setTheme] = useState<ThemeMode>("dark");
  const [contrast, setContrast] = useState<ContrastMode>("normal");
  const [glassIntensity, setGlassIntensity] = useState(20);
  const [breathRate, setBreathRate] = useState(24);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "auto") root.removeAttribute("data-theme");
    else root.setAttribute("data-theme", theme);
  }, [theme]);

  useEffect(() => {
    const root = document.documentElement;
    if (contrast === "normal") root.removeAttribute("data-contrast");
    else root.setAttribute("data-contrast", contrast);
  }, [contrast]);

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty("--glass-blur-ambient", `${Math.max(2, glassIntensity * 0.3)}px`);
    root.style.setProperty("--glass-blur-surface", `${glassIntensity}px`);
    root.style.setProperty("--glass-blur-elevated", `${glassIntensity * 1.4}px`);
    root.style.setProperty("--glass-blur-accent", `${glassIntensity * 1.6}px`);
  }, [glassIntensity]);

  useEffect(() => {
    document.documentElement.style.setProperty(
      "--ema-wallpaper-breath-rate",
      `${breathRate}s`,
    );
  }, [breathRate]);

  return (
    <section className="ema-settings">
      <header className="ema-settings__header">
        <div>
          <span className="ema-settings__eyebrow">preferences</span>
          <h1 className="ema-settings__title">Settings</h1>
          <p className="ema-settings__lede">
            Shell preferences that tune how the virtual desktop feels.
            Org-level, space-level, and project-level settings will live
            in their own panels as their daemon writers come online.
          </p>
        </div>
        <span
          className="ema-pill ema-pill--hot"
          title="Changes do not persist. No daemon writer exists for preferences yet."
        >
          {MOCK_PROJECTION_LABEL} — draft | local only
        </span>
      </header>

      <div className="ema-settings__grid">
        <SegmentedField
          label="Theme"
          eyebrow="appearance"
          value={theme}
          options={THEMES}
          onChange={setTheme}
        />
        <SegmentedField
          label="Contrast"
          eyebrow="accessibility"
          value={contrast}
          options={CONTRASTS}
          onChange={setContrast}
        />
        <RangeField
          label="Glass blur intensity"
          eyebrow="surface depth"
          min={4}
          max={48}
          step={1}
          value={glassIntensity}
          valueLabel={`${glassIntensity}px`}
          onChange={setGlassIntensity}
        />
        <RangeField
          label="Wallpaper breathing rate"
          eyebrow="ambience"
          min={12}
          max={90}
          step={2}
          value={breathRate}
          valueLabel={`${breathRate}s`}
          onChange={setBreathRate}
        />
      </div>
    </section>
  );
}

function SegmentedField<T extends string>({
  label,
  eyebrow,
  value,
  options,
  onChange,
}: {
  label: string;
  eyebrow: string;
  value: T;
  options: Array<{ value: T; label: string }>;
  onChange: (v: T) => void;
}) {
  return (
    <div className="ema-settings__field">
      <div className="ema-settings__field-head">
        <span className="ema-settings__field-eyebrow">{eyebrow}</span>
        <span className="ema-settings__field-label">{label}</span>
      </div>
      <div className="ema-segmented" role="radiogroup" aria-label={label}>
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={value === opt.value}
            className={
              value === opt.value
                ? "ema-segmented__option is-active"
                : "ema-segmented__option"
            }
            onClick={() => onChange(opt.value)}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function RangeField({
  label,
  eyebrow,
  min,
  max,
  step,
  value,
  valueLabel,
  onChange,
}: {
  label: string;
  eyebrow: string;
  min: number;
  max: number;
  step: number;
  value: number;
  valueLabel: string;
  onChange: (v: number) => void;
}) {
  return (
    <div className="ema-settings__field">
      <div className="ema-settings__field-head">
        <span className="ema-settings__field-eyebrow">{eyebrow}</span>
        <span className="ema-settings__field-label">{label}</span>
        <span className="ema-settings__field-value">{valueLabel}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-label={label}
      />
    </div>
  );
}
