'use client';

import type { ReactNode } from 'react';
import { motion } from 'motion/react';

interface Option {
  value: string;
  label: string;
  icon?: ReactNode;
}

interface SegmentedControlProps {
  options: Option[];
  value: string;
  onChange: (v: string) => void;
}

export function SegmentedControl({ options, value, onChange }: SegmentedControlProps) {
  return (
    <div
      role="radiogroup"
      style={{
        display: 'flex',
        background: 'var(--place-surface-3)',
        borderRadius: '6px',
        padding: '2px',
        gap: '2px',
        position: 'relative',
      }}
    >
      {options.map((opt) => {
        const isActive = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={isActive}
            onClick={() => onChange(opt.value)}
            style={{
              flex: 1,
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
              padding: '4px 8px',
              fontSize: '0.65rem',
              fontWeight: isActive ? 600 : 400,
              color: isActive ? 'var(--place-text-primary)' : 'var(--place-text-tertiary)',
              border: 'none',
              background: 'transparent',
              borderRadius: '4px',
              cursor: 'pointer',
              transition: 'color 0.15s',
              zIndex: 1,
            }}
          >
            {isActive && (
              <motion.div
                layoutId="segmented-indicator"
                style={{
                  position: 'absolute',
                  inset: 0,
                  borderRadius: '4px',
                  background: 'var(--place-surface-2)',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                  zIndex: -1,
                }}
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              />
            )}
            {opt.icon && (
              <span style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                {opt.icon}
              </span>
            )}
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
