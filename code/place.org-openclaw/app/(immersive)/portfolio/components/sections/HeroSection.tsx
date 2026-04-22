'use client';

import { useState } from 'react';
import { motion } from 'motion/react';
import type { Variants } from 'motion/react';
import { PATTERN_META, PATTERN_ROWS, type JugglePattern } from '../../lib/juggling';
import { ScrollIndicator } from '../ui/ScrollIndicator';
import { JugglingCascade } from '../JugglingCascade';
import { DraggableElement } from '../ui/DraggableElement';
import type { VariantConfig } from '../../lib/variantStore';

const CUSTOM_EASE = [0.23, 0.32, 0.23, 0.2] as const;

const charVariant: Variants = {
  hidden: { opacity: 0, y: 50 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [...CUSTOM_EASE] },
  },
};

const NAME = 'TRAJAN';

function cascadePositionStyle(position: string): React.CSSProperties {
  const shift = { marginTop: '5%', marginLeft: '5%' } as const;
  switch (position) {
    case 'center':
      return { inset: 0, ...shift };
    case 'center-right':
      return { top: 0, bottom: 0, right: 0, width: '50%', ...shift };
    case 'center-left':
      return { top: 0, bottom: 0, left: 0, width: '50%', ...shift };
    case 'left':
      return { top: 0, bottom: 0, left: 0, width: '35%', ...shift };
    case 'right':
      return { top: 0, bottom: 0, right: 0, width: '35%', ...shift };
    default:
      return { inset: 0, ...shift };
  }
}

type HeroSectionProps = {
  config: VariantConfig;
  collaborationOn: boolean;
};

export function HeroSection({ config, collaborationOn }: HeroSectionProps) {
  const [ballCount, setBallCount] = useState(3);
  const [jugglePattern, setJugglePattern] = useState<JugglePattern>('cascade');
  const [customSliders, setCustomSliders] = useState<Record<string, number>>({});

  const meta = PATTERN_META[jugglePattern];
  const hasVariableCount = meta.minBalls !== undefined && meta.maxBalls !== undefined;
  const hasSliders = (meta.sliders ?? []).length > 0;

  function selectPattern(p: JugglePattern) {
    setJugglePattern(p);
    const m = PATTERN_META[p];
    setBallCount(m.balls);
    const defaults: Record<string, number> = {};
    for (const s of m.sliders ?? []) {
      defaults[s.key] = s.default;
    }
    setCustomSliders(defaults);
  }

  return (
    <section
      className="portfolio-section"
      style={{
        background: config.bg,
        justifyContent: 'center',
        alignItems: 'flex-start',
        position: 'relative',
      }}
    >
      {/* Location info */}
      <motion.span
        className="mono-xs"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5, duration: 0.5 }}
        style={{
          position: 'absolute',
          top: 24,
          left: 24,
          color: config.textSecondary,
        }}
      >
        Virginia &middot; 2026
      </motion.span>

      {/* Accent circle */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 60, damping: 12, delay: 0.1 }}
        style={{
          position: 'absolute',
          width: 'clamp(32px, 5vw, 56px)',
          height: 'clamp(32px, 5vw, 56px)',
          left: 'clamp(60px, 8vw, 120px)',
          top: 'clamp(80px, 12vh, 140px)',
          pointerEvents: 'none',
        }}
      >
        <div style={{ width: '100%', height: '100%', borderRadius: '50%', background: config.accent }} />
      </motion.div>

      {/* Juggling animation */}
      <JugglingCascade
        style={cascadePositionStyle(config.cascadePosition)}
        visibleCount={ballCount}
        pattern={jugglePattern}
        bias={customSliders.bias}
        crossDepth={customSliders.crossDepth}
      />

      {/* ── Pattern controls ── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.8, duration: 0.5 }}
        style={{
          position: 'absolute',
          bottom: 'clamp(40px, 6vh, 80px)',
          right: 'clamp(40px, 8vw, 140px)',
          zIndex: 3,
          width: 'clamp(260px, 24vw, 320px)',
        }}
      >
        <div
          style={{
            background: `color-mix(in srgb, ${config.bg} 70%, transparent)`,
            backdropFilter: 'blur(20px) saturate(1.4)',
            WebkitBackdropFilter: 'blur(20px) saturate(1.4)',
            borderRadius: 16,
            border: `1px solid color-mix(in srgb, ${config.textSecondary} 12%, transparent)`,
            padding: '16px 18px 14px',
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
            boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
          }}
        >
          {/* Pattern rows */}
          {PATTERN_ROWS.map((row, rowIdx) => (
            <div key={row.label}>
              <span
                style={{
                  display: 'block',
                  fontSize: 9,
                  fontFamily: 'var(--font-jetbrains-mono, monospace)',
                  color: config.textSecondary,
                  opacity: 0.45,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  marginBottom: 4,
                }}
              >
                {row.label}
              </span>
              <div style={{ display: 'flex', gap: 5 }}>
                {row.patterns.map((p) => {
                  const active = jugglePattern === p;
                  return (
                    <button
                      key={p}
                      onClick={() => selectPattern(p)}
                      style={{
                        flex: 1,
                        padding: '6px 2px',
                        borderRadius: 8,
                        border: active
                          ? `1.5px solid ${config.accent}`
                          : `1px solid color-mix(in srgb, ${config.textSecondary} 10%, transparent)`,
                        fontSize: 10,
                        fontFamily: 'var(--font-cinzel, serif)',
                        fontWeight: active ? 600 : 400,
                        letterSpacing: '0.04em',
                        textTransform: 'uppercase',
                        cursor: 'pointer',
                        background: active
                          ? config.accent
                          : 'transparent',
                        color: active ? '#fff' : config.textSecondary,
                        transition: 'all 0.2s ease',
                        lineHeight: 1,
                      }}
                    >
                      {PATTERN_META[p].label}
                    </button>
                  );
                })}
              </div>
              {/* Divider between rows (except last) */}
              {rowIdx < PATTERN_ROWS.length - 1 && (
                <div
                  style={{
                    height: 1,
                    background: `color-mix(in srgb, ${config.textSecondary} 8%, transparent)`,
                    marginTop: 10,
                  }}
                />
              )}
            </div>
          ))}

          {/* Sliders section */}
          {(hasVariableCount || hasSliders) && (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
                paddingTop: 4,
                borderTop: `1px solid color-mix(in srgb, ${config.textSecondary} 10%, transparent)`,
              }}
            >
              {/* Ball count */}
              {hasVariableCount && (
                <SliderRow
                  value={ballCount}
                  min={meta.minBalls ?? 3}
                  max={meta.maxBalls ?? 9}
                  step={1}
                  label="balls"
                  displayValue={String(ballCount)}
                  accent={config.accent}
                  textColor={config.textColor}
                  textSecondary={config.textSecondary}
                  onChange={setBallCount}
                />
              )}

              {/* Custom sliders */}
              {(meta.sliders ?? []).map((s) => {
                const val = customSliders[s.key] ?? s.default;
                return (
                  <SliderRow
                    key={s.key}
                    value={val * 100}
                    min={s.min * 100}
                    max={s.max * 100}
                    step={s.step * 100}
                    label={s.label}
                    displayValue={`${Math.round(val * 100)}%`}
                    accent={config.accent}
                    textColor={config.textColor}
                    textSecondary={config.textSecondary}
                    onChange={(v) =>
                      setCustomSliders((prev) => ({
                        ...prev,
                        [s.key]: v / 100,
                      }))
                    }
                  />
                );
              })}
            </div>
          )}
        </div>
      </motion.div>

      {/* ── Name & tagline ── */}
      <div className="max-w-6xl mx-auto px-6 w-full" style={{ position: 'relative', zIndex: 2 }}>
        <motion.p
          className="mono-xs"
          style={{ color: config.textSecondary, marginBottom: 12, opacity: 0.6 }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.6 }}
          transition={{ delay: 1.4, duration: 0.5 }}
        >
          &ldquo;I know how to juggle&rdquo;
        </motion.p>

        <DraggableElement id="hero-name" disabled={!collaborationOn} style={{ position: 'relative' }}>
          <motion.h1
            className="display-xl"
            style={{
              color: config.textColor,
              marginBottom: 24,
              fontFamily: config.specialFont ?? undefined,
            }}
            initial="hidden"
            animate="visible"
            transition={{ staggerChildren: 0.08, delayChildren: 0.2 }}
            aria-label={NAME}
          >
            {NAME.split('').map((char, i) => (
              <motion.span
                key={`${char}-${i}`}
                variants={charVariant}
                style={{ display: 'inline-block' }}
              >
                {char}
              </motion.span>
            ))}
          </motion.h1>
        </DraggableElement>

        <DraggableElement
          id="hero-tagline"
          disabled={!collaborationOn}
          style={{ position: 'relative', maxWidth: '28ch', marginLeft: 'clamp(40px, 8vw, 120px)' }}
        >
          <motion.p
            className="body-lg"
            style={{ color: config.textSecondary, lineHeight: 1.6 }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.0, duration: 0.6 }}
          >
            Building systems that keep everything in the air.
          </motion.p>
        </DraggableElement>
      </div>

      <ScrollIndicator />
    </section>
  );
}

// ── Slider row component ─────────────────────────────────────────────

function SliderRow({
  value,
  min,
  max,
  step,
  label,
  displayValue,
  accent,
  textColor,
  textSecondary,
  onChange,
}: {
  value: number;
  min: number;
  max: number;
  step: number;
  label: string;
  displayValue: string;
  accent: string;
  textColor: string;
  textSecondary: string;
  onChange: (v: number) => void;
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <span
        style={{
          fontFamily: 'var(--font-cinzel, serif)',
          fontSize: 14,
          fontWeight: 600,
          color: textColor,
          minWidth: 32,
          textAlign: 'right',
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {displayValue}
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{
          flex: 1,
          accentColor: accent,
          cursor: 'pointer',
          height: 4,
        }}
      />
      <span
        style={{
          fontFamily: 'var(--font-jetbrains-mono, monospace)',
          fontSize: 9,
          color: textSecondary,
          opacity: 0.5,
          whiteSpace: 'nowrap',
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          minWidth: 28,
        }}
      >
        {label}
      </span>
    </div>
  );
}
