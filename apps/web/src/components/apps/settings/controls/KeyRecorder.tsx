'use client';

import { useState, useEffect, useRef } from 'react';

interface KeyRecorderProps {
  value: string;
  onChange: (combo: string) => void;
}

function buildCombo(e: KeyboardEvent): string | null {
  const key = e.key;
  if (['Control', 'Shift', 'Alt', 'Meta', 'Escape'].includes(key)) return null;

  const parts: string[] = [];
  if (e.ctrlKey) parts.push('Ctrl');
  if (e.altKey) parts.push('Alt');
  if (e.shiftKey) parts.push('Shift');
  if (e.metaKey) parts.push('Meta');

  const displayKey = key.length === 1 ? key.toUpperCase() : key;
  parts.push(displayKey);

  return parts.join('+');
}

export function KeyRecorder({ value, onChange }: KeyRecorderProps) {
  const [recording, setRecording] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!recording) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      e.preventDefault();
      if (e.key === 'Escape') {
        setRecording(false);
        return;
      }
      const combo = buildCombo(e);
      if (combo) {
        onChange(combo);
        setRecording(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown, { capture: true });
    return () => window.removeEventListener('keydown', handleKeyDown, { capture: true });
  }, [recording, onChange]);

  // Cancel if focus leaves
  useEffect(() => {
    if (!recording) return;
    const handleBlur = () => setRecording(false);
    window.addEventListener('blur', handleBlur);
    return () => window.removeEventListener('blur', handleBlur);
  }, [recording]);

  return (
    <div
      ref={containerRef}
      onClick={() => setRecording((prev) => !prev)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setRecording((prev) => !prev); } }}
      aria-label={`Keyboard shortcut: ${value || 'none'}. Click to record new shortcut.`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '5px 10px',
        borderRadius: '6px',
        border: `1.5px solid ${recording ? 'var(--place-primary-400)' : 'var(--place-border-default)'}`,
        background: recording ? 'var(--place-primary-subtle)' : 'var(--place-surface-2)',
        cursor: 'pointer',
        minWidth: '120px',
        transition: 'border-color 0.15s, background 0.15s',
        animation: recording ? 'place-pulse-border 1s ease-in-out infinite' : 'none',
      }}
    >
      <style>{`
        @keyframes place-pulse-border {
          0%, 100% { box-shadow: 0 0 0 0 var(--place-primary-subtle); }
          50% { box-shadow: 0 0 0 3px var(--place-primary-subtle); }
        }
      `}</style>

      {recording ? (
        <span style={{ fontSize: '0.7rem', color: 'var(--place-primary-400)', fontStyle: 'italic' }}>
          Press keys...
        </span>
      ) : value ? (
        <span style={{ display: 'flex', gap: '3px', alignItems: 'center', flexWrap: 'wrap' }}>
          {value.split('+').map((part, i) => (
            <kbd
              key={i}
              style={{
                fontSize: '0.65rem',
                fontFamily: 'monospace',
                padding: '1px 5px',
                borderRadius: '3px',
                background: 'var(--place-surface-3)',
                border: '1px solid var(--place-border-default)',
                color: 'var(--place-text-primary)',
              }}
            >
              {part}
            </kbd>
          ))}
        </span>
      ) : (
        <span style={{ fontSize: '0.7rem', color: 'var(--place-text-tertiary)' }}>
          Click to record
        </span>
      )}
    </div>
  );
}
