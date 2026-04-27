'use client';

import * as React from 'react';

import { type SurfaceId } from '@/lib/surfaces';

import { AppShellChrome, type AppShellNavEntry } from './AppShellChrome';
import { SurfaceSwitcher } from './SurfaceSwitcher';

export type SurfaceFrameProps = {
  surface: SurfaceId;
  onSurfaceChange: (surface: SurfaceId) => void;
  surfaceMeta?: React.ReactNode | React.ReactNode[];
  persistSurface?: boolean;
  chromeNav?: readonly AppShellNavEntry[];
  chromeActions?: React.ReactNode;
  chromeContextLabel?: React.ReactNode;
  chromeBrandKicker?: React.ReactNode;
  children: React.ReactNode;
};

export function SurfaceFrame({
  surface,
  onSurfaceChange,
  surfaceMeta,
  persistSurface = false,
  chromeNav = [],
  chromeActions,
  chromeContextLabel,
  chromeBrandKicker,
  children,
}: SurfaceFrameProps) {
  return (
    <div className="app-shell">
      <SurfaceSwitcher
        value={surface}
        onValueChange={onSurfaceChange}
        persist={persistSurface}
        meta={surfaceMeta}
      />
      <div className="app-body">
        <div className="app-main">
          <AppShellChrome
            nav={chromeNav}
            actions={chromeActions}
            contextLabel={chromeContextLabel}
            brandKicker={chromeBrandKicker}
          />
          <div className="app-content">{children}</div>
        </div>
      </div>
    </div>
  );
}

