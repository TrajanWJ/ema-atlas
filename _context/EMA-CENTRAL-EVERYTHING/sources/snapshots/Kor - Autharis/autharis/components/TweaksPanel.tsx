'use client';
import * as React from 'react';
import { useEffect, useRef, useState } from 'react';
import { useApp } from './AppContext';
import { ACCENT_SWATCHES, COPY_VARIANTS, Tweaks } from '../lib/tweaks';

type Pos = { left?: number; top?: number; right?: number; bottom?: number };

export function TweaksPanel() {
  const { tweaks, setTweaks } = useApp();
  const [pos, setPos] = useState<Pos>({ right: 20, bottom: 20 });
  const dragState = useRef<{ offX: number; offY: number; w: number; h: number } | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('autharis:tweaks-pos');
      if (raw) setPos(JSON.parse(raw));
    } catch {}
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) { try { localStorage.setItem('autharis:tweaks-pos', JSON.stringify(pos)); } catch {} }
  }, [pos, hydrated]);

  const update = (patch: Partial<Tweaks>) => setTweaks({ ...tweaks, ...patch });

  const onMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest('button')) return;
    e.preventDefault();
    const el = (e.currentTarget.parentElement as HTMLElement);
    const rect = el.getBoundingClientRect();
    dragState.current = {
      offX: e.clientX - rect.left,
      offY: e.clientY - rect.top,
      w: rect.width,
      h: rect.height,
    };
    document.body.style.userSelect = 'none';
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };
  const onMove = (e: MouseEvent) => {
    const d = dragState.current; if (!d) return;
    const vw = window.innerWidth, vh = window.innerHeight;
    const left = Math.max(8, Math.min(vw - d.w - 8, e.clientX - d.offX));
    const top = Math.max(8, Math.min(vh - d.h - 8, e.clientY - d.offY));
    setPos({ left, top });
  };
  const onUp = () => {
    dragState.current = null;
    document.body.style.userSelect = '';
    window.removeEventListener('mousemove', onMove);
    window.removeEventListener('mouseup', onUp);
  };

  const style: React.CSSProperties = {};
  if (pos.left != null) style.left = pos.left;
  if (pos.top != null) style.top = pos.top;
  if (pos.right != null) style.right = pos.right;
  if (pos.bottom != null) style.bottom = pos.bottom;

  return (
    <div className="tweaks-panel" style={style}>
      <div className="tweaks-panel-head" onMouseDown={onMouseDown} style={{ cursor: 'grab' }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          <span style={{ display: 'inline-flex', flexDirection: 'column', gap: 2 }}>
            <span style={{ display: 'flex', gap: 2 }}>
              <span style={{ width: 3, height: 3, background: 'currentColor', borderRadius: 1, opacity: 0.6 }} />
              <span style={{ width: 3, height: 3, background: 'currentColor', borderRadius: 1, opacity: 0.6 }} />
            </span>
            <span style={{ display: 'flex', gap: 2 }}>
              <span style={{ width: 3, height: 3, background: 'currentColor', borderRadius: 1, opacity: 0.6 }} />
              <span style={{ width: 3, height: 3, background: 'currentColor', borderRadius: 1, opacity: 0.6 }} />
            </span>
            <span style={{ display: 'flex', gap: 2 }}>
              <span style={{ width: 3, height: 3, background: 'currentColor', borderRadius: 1, opacity: 0.6 }} />
              <span style={{ width: 3, height: 3, background: 'currentColor', borderRadius: 1, opacity: 0.6 }} />
            </span>
          </span>
          Tweaks
        </span>
        <span style={{ opacity: 0.6 }}>Live</span>
      </div>
      <div className="tweaks-panel-body">
        <div className="tweaks-row">
          <span className="tweaks-row-label">Accent</span>
          <div className="tweaks-swatch-row">
            {ACCENT_SWATCHES.map(s => (
              <button key={s.color} title={s.name}
                className="tweaks-swatch"
                data-active={tweaks.accent === s.color}
                style={{ background: s.color }}
                onClick={() => update({ accent: s.color })} />
            ))}
          </div>
        </div>
        <div className="tweaks-row">
          <span className="tweaks-row-label">Theme</span>
          <div className="segmented">
            {([['dark', 'Dark'], ['light', 'Light']] as const).map(([id, label]) => (
              <button key={id} data-active={tweaks.theme === id} onClick={() => update({ theme: id })}>{label}</button>
            ))}
          </div>
        </div>
        <div className="tweaks-row">
          <span className="tweaks-row-label">Density</span>
          <div className="segmented">
            {([['comfortable', 'Comfortable'], ['compact', 'Compact']] as const).map(([id, label]) => (
              <button key={id} data-active={tweaks.density === id} onClick={() => update({ density: id })}>{label}</button>
            ))}
          </div>
        </div>
        <div className="tweaks-row">
          <span className="tweaks-row-label">Hero copy</span>
          <div className="segmented" style={{ flexWrap: 'wrap' }}>
            {COPY_VARIANTS.map(([id, label]) => (
              <button key={id} data-active={(tweaks.copyVariant || 'editorial') === id} onClick={() => update({ copyVariant: id })}>{label}</button>
            ))}
          </div>
        </div>
        <div className="tweaks-row">
          <span className="tweaks-row-label">Match card</span>
          <div className="segmented">
            {([['hero', 'Editorial'], ['dossier', 'Dossier'], ['stack', 'Stack']] as const).map(([id, label]) => (
              <button key={id} data-active={tweaks.matchVariant === id} onClick={() => update({ matchVariant: id })}>{label}</button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
