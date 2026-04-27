'use client';

import * as React from 'react';

import { type SurfaceDefinition, SURFACES, type SurfaceId } from '@/lib/surfaces';
import { writeStoredSurface } from '@/lib/storage';

export type SurfaceSwitcherProps = {
  value: SurfaceId;
  onValueChange?: (surface: SurfaceId) => void;
  surfaces?: readonly SurfaceDefinition[];
  persist?: boolean;
  label?: string;
  meta?: React.ReactNode | React.ReactNode[];
  className?: string;
};

export function SurfaceSwitcher({
  value,
  onValueChange,
  surfaces = SURFACES,
  persist = false,
  label = 'Autharis · Prototype',
  meta,
  className = '',
}: SurfaceSwitcherProps) {
  function handleSelect(surface: SurfaceId) {
    if (persist) writeStoredSurface(surface);
    onValueChange?.(surface);
  }

  const metaItems = Array.isArray(meta) ? meta : meta ? [meta] : [];

  return (
    <div className={['surface-bar', className].filter(Boolean).join(' ')} role="tablist" aria-label="Autharis surfaces">
      <span className="surface-bar-label">{label}</span>

      {surfaces.map((surface) => (
        <button
          key={surface.id}
          type="button"
          className="surface-tab"
          role="tab"
          data-active={value === surface.id}
          aria-selected={value === surface.id}
          onClick={() => handleSelect(surface.id)}
          title={surface.description}
        >
          <span className="surface-tab-dot" aria-hidden />
          <span>{surface.shortLabel}</span>
        </button>
      ))}

      {metaItems.length ? (
        <div className="surface-meta">
          {metaItems.map((item, index) => (
            <React.Fragment key={index}>{item}</React.Fragment>
          ))}
        </div>
      ) : null}
    </div>
  );
}

