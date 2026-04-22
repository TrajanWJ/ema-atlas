'use client';

import { useRef, useEffect, useCallback, useState } from 'react';
import { hexToHsl, hslToHex } from '@/src/lib/color-utils';

interface ColorPickerProps {
  value: string;
  onChange: (hex: string) => void;
}

function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v));
}

export function ColorPicker({ value, onChange }: ColorPickerProps) {
  const padRef = useRef<HTMLCanvasElement>(null);
  const railRef = useRef<HTMLCanvasElement>(null);
  const [hexInput, setHexInput] = useState(value);

  const hsl = hexToHsl(value);
  const { h, s, l } = hsl;

  // Sync input when value changes externally
  useEffect(() => {
    setHexInput(value);
  }, [value]);

  // Draw sat/light pad
  useEffect(() => {
    const canvas = padRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // White→hue gradient (saturation axis)
    const satGrad = ctx.createLinearGradient(0, 0, canvas.width, 0);
    satGrad.addColorStop(0, 'hsl(0, 0%, 100%)');
    satGrad.addColorStop(1, `hsl(${h}, 100%, 50%)`);
    ctx.fillStyle = satGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Transparent→black gradient (lightness axis)
    const lightGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    lightGrad.addColorStop(0, 'rgba(0,0,0,0)');
    lightGrad.addColorStop(1, 'rgba(0,0,0,1)');
    ctx.fillStyle = lightGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, [h]);

  // Draw hue rail
  useEffect(() => {
    const canvas = railRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const grad = ctx.createLinearGradient(0, 0, canvas.width, 0);
    for (let i = 0; i <= 360; i += 30) {
      grad.addColorStop(i / 360, `hsl(${i}, 100%, 50%)`);
    }
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, []);

  const handlePadInteraction = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement> | React.PointerEvent<HTMLCanvasElement>) => {
      const canvas = padRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const x = clamp((e.clientX - rect.left) / rect.width, 0, 1);
      const y = clamp((e.clientY - rect.top) / rect.height, 0, 1);

      // Convert canvas position to HSL
      // x → saturation (0..1), y → lightness (1..0) mapped from pad model
      // Pad model: white top-left, hue top-right, black bottom
      const newS = x;
      const newL = (1 - y) * (1 - x / 2); // approximate perceived lightness
      onChange(hslToHex(h, newS, clamp(newL, 0.01, 0.99)));
    },
    [h, onChange],
  );

  const handleRailInteraction = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement> | React.PointerEvent<HTMLCanvasElement>) => {
      const canvas = railRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const x = clamp((e.clientX - rect.left) / rect.width, 0, 1);
      const newH = x * 360;
      onChange(hslToHex(newH, s, l));
    },
    [s, l, onChange],
  );

  const handleHexBlur = () => {
    const cleaned = hexInput.startsWith('#') ? hexInput : `#${hexInput}`;
    if (/^#[0-9a-fA-F]{6}$/.test(cleaned)) {
      onChange(cleaned.toLowerCase());
    } else {
      setHexInput(value);
    }
  };

  // Indicator positions
  const padX = s * 180;
  const padY = (1 - l * 2 + s * l) * 180; // inverse of the lightness formula above (approx)
  const railX = (h / 360) * 100;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {/* Sat/Light pad */}
      <div style={{ position: 'relative', width: '180px', height: '180px', borderRadius: '6px', overflow: 'hidden' }}>
        <canvas
          ref={padRef}
          width={180}
          height={180}
          style={{ display: 'block', cursor: 'crosshair' }}
          onClick={handlePadInteraction}
          onPointerMove={(e) => { if (e.buttons > 0) handlePadInteraction(e); }}
        />
        {/* Circular indicator */}
        <div
          style={{
            position: 'absolute',
            left: `${clamp(padX, 0, 180)}px`,
            top: `${clamp(padY, 0, 180)}px`,
            width: '12px',
            height: '12px',
            borderRadius: '50%',
            border: '2px solid white',
            boxShadow: '0 0 2px rgba(0,0,0,0.6)',
            transform: 'translate(-50%, -50%)',
            pointerEvents: 'none',
            background: value,
          }}
        />
      </div>

      {/* Hue rail */}
      <div style={{ position: 'relative', height: '16px', borderRadius: '4px', overflow: 'hidden' }}>
        <canvas
          ref={railRef}
          width={180}
          height={16}
          style={{ display: 'block', width: '100%', height: '16px', cursor: 'crosshair' }}
          onClick={handleRailInteraction}
          onPointerMove={(e) => { if (e.buttons > 0) handleRailInteraction(e); }}
        />
        {/* Vertical line indicator */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            left: `${railX}%`,
            width: '3px',
            background: 'white',
            boxShadow: '0 0 2px rgba(0,0,0,0.6)',
            transform: 'translateX(-50%)',
            pointerEvents: 'none',
            borderRadius: '1px',
          }}
        />
      </div>

      {/* Hex input */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <div
          style={{
            width: '20px',
            height: '20px',
            borderRadius: '4px',
            background: value,
            border: '1px solid var(--place-border-default)',
            flexShrink: 0,
          }}
        />
        <input
          type="text"
          value={hexInput}
          onChange={(e) => setHexInput(e.target.value)}
          onBlur={handleHexBlur}
          onKeyDown={(e) => { if (e.key === 'Enter') handleHexBlur(); }}
          style={{
            flex: 1,
            fontSize: '0.7rem',
            fontFamily: 'monospace',
            padding: '3px 6px',
            borderRadius: '4px',
            border: '1px solid var(--place-border-default)',
            background: 'var(--place-surface-2)',
            color: 'var(--place-text-primary)',
            outline: 'none',
          }}
        />
      </div>
    </div>
  );
}
