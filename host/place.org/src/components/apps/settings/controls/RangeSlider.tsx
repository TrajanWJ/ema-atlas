'use client';

import type { ReactNode } from 'react';

interface Tick {
  value: number;
  label: string;
}

interface RangeSliderProps {
  min: number;
  max: number;
  step?: number;
  value: number;
  onChange: (v: number) => void;
  ticks?: Tick[];
  showValue?: boolean;
  formatValue?: (v: number) => string;
  label?: string;
}

export function RangeSlider({
  min,
  max,
  step = 1,
  value,
  onChange,
  ticks,
  showValue = false,
  formatValue,
  label,
}: RangeSliderProps) {
  const display = formatValue ? formatValue(value) : String(value);
  const pct = ((value - min) / (max - min)) * 100;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      {(label || showValue) && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {label && (
            <span style={{ fontSize: '0.7rem', color: 'var(--place-text-secondary)' }}>
              {label}
            </span>
          )}
          {showValue && (
            <span style={{ fontSize: '0.7rem', color: 'var(--place-text-tertiary)', marginLeft: 'auto' }}>
              {display}
            </span>
          )}
        </div>
      )}

      <div style={{ position: 'relative' }}>
        <style>{`
          .place-range::-webkit-slider-thumb {
            -webkit-appearance: none;
            width: 14px;
            height: 14px;
            border-radius: 50%;
            background: var(--place-primary-400);
            cursor: pointer;
            margin-top: -5px;
          }
          .place-range::-moz-range-thumb {
            width: 14px;
            height: 14px;
            border-radius: 50%;
            background: var(--place-primary-400);
            cursor: pointer;
            border: none;
          }
          .place-range::-webkit-slider-runnable-track {
            height: 4px;
            border-radius: 2px;
            background: linear-gradient(to right, var(--place-primary-400) ${pct}%, var(--place-surface-3) ${pct}%);
          }
          .place-range::-moz-range-track {
            height: 4px;
            border-radius: 2px;
            background: var(--place-surface-3);
          }
        `}</style>
        <input
          type="range"
          className="place-range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          role="slider"
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuenow={value}
          aria-valuetext={display}
          style={{
            WebkitAppearance: 'none',
            appearance: 'none',
            width: '100%',
            background: 'transparent',
            cursor: 'pointer',
            outline: 'none',
          }}
        />
      </div>

      {ticks && ticks.length > 0 && (
        <div style={{ position: 'relative', height: '16px' }}>
          {ticks.map((tick) => {
            const tickPct = ((tick.value - min) / (max - min)) * 100;
            return (
              <span
                key={tick.value}
                style={{
                  position: 'absolute',
                  left: `${tickPct}%`,
                  transform: 'translateX(-50%)',
                  fontSize: '0.6rem',
                  color: 'var(--place-text-tertiary)',
                  whiteSpace: 'nowrap',
                }}
              >
                {tick.label}
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}
