'use client';

import type { ReactNode } from 'react';

interface Preset {
  id: string;
  name: string;
  preview: ReactNode;
}

interface PresetCardsProps {
  presets: Preset[];
  activeId?: string;
  onSelect: (id: string) => void;
}

export function PresetCards({ presets, activeId, onSelect }: PresetCardsProps) {
  return (
    <div
      style={{
        display: 'flex',
        gap: '8px',
        overflowX: 'auto',
        paddingBottom: '4px',
        scrollbarWidth: 'thin',
      }}
    >
      {presets.map((preset) => {
        const isActive = preset.id === activeId;
        return (
          <button
            key={preset.id}
            type="button"
            onClick={() => onSelect(preset.id)}
            title={preset.name}
            style={{
              flexShrink: 0,
              minWidth: '80px',
              minHeight: '60px',
              borderRadius: '8px',
              border: isActive
                ? '2px solid var(--place-primary-400)'
                : '2px solid var(--place-border-default)',
              background: 'var(--place-surface-2)',
              cursor: 'pointer',
              padding: 0,
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              transition: 'border-color 0.15s, box-shadow 0.15s',
              boxShadow: isActive
                ? '0 0 0 3px var(--place-primary-subtle)'
                : 'none',
            }}
          >
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {preset.preview}
            </div>
            <div
              style={{
                fontSize: '0.6rem',
                color: isActive ? 'var(--place-primary-400)' : 'var(--place-text-tertiary)',
                fontWeight: isActive ? 600 : 400,
                padding: '3px 6px',
                borderTop: '1px solid var(--place-border-subtle)',
                textAlign: 'center',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {preset.name}
            </div>
          </button>
        );
      })}
    </div>
  );
}
