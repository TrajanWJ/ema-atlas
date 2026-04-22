'use client';

import type { ReactNode } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface ToggleWithSubProps {
  enabled: boolean;
  onToggle: (v: boolean) => void;
  label: string;
  description?: string;
  children?: ReactNode;
}

export function ToggleWithSub({
  enabled,
  onToggle,
  label,
  description,
  children,
}: ToggleWithSubProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          padding: '4px 0',
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--place-text-primary)', fontWeight: 500 }}>
            {label}
          </div>
          {description && (
            <div style={{ fontSize: '0.65rem', color: 'var(--place-text-tertiary)', marginTop: '2px' }}>
              {description}
            </div>
          )}
        </div>

        <button
          type="button"
          role="switch"
          aria-checked={enabled}
          onClick={() => onToggle(!enabled)}
          style={{
            width: '36px',
            height: '20px',
            borderRadius: '10px',
            border: 'none',
            background: enabled ? 'var(--place-primary-400)' : 'var(--place-surface-3)',
            cursor: 'pointer',
            position: 'relative',
            flexShrink: 0,
            transition: 'background 0.2s',
            padding: 0,
          }}
        >
          <motion.div
            animate={{ x: enabled ? 18 : 2 }}
            transition={{ type: 'spring', stiffness: 500, damping: 35 }}
            style={{
              position: 'absolute',
              top: '2px',
              width: '16px',
              height: '16px',
              borderRadius: '50%',
              background: 'white',
              boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
            }}
          />
        </button>
      </div>

      <AnimatePresence initial={false}>
        {enabled && children && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{ paddingTop: '8px', paddingLeft: '12px', borderLeft: '2px solid var(--place-surface-3)' }}>
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
