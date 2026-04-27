import * as React from 'react';

import { ShellNavItem } from '@/components/ui';

import { Wordmark } from './Wordmark';

export type AppShellNavEntry = {
  id: string;
  label: React.ReactNode;
  icon?: React.ReactNode;
  href?: string;
  active?: boolean;
  count?: React.ReactNode;
  onSelect?: () => void;
};

export type AppShellChromeProps = {
  brandKicker?: React.ReactNode;
  contextLabel?: React.ReactNode;
  nav?: readonly AppShellNavEntry[];
  actions?: React.ReactNode;
  className?: string;
};

export function AppShellChrome({
  brandKicker = 'Shared shell',
  contextLabel,
  nav = [],
  actions,
  className = '',
}: AppShellChromeProps) {
  return (
    <header className={['appbar', className].filter(Boolean).join(' ')}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          minWidth: 0,
          flexShrink: 0,
        }}
      >
        <Wordmark scale="sm" kicker={brandKicker} />
        {contextLabel ? (
          <span
            className="mono"
            style={{
              fontSize: 10,
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
              color: 'var(--ink-4)',
              whiteSpace: 'nowrap',
            }}
          >
            {contextLabel}
          </span>
        ) : null}
      </div>

      {nav.length ? (
        <nav
          className="appbar-nav"
          aria-label="Workspace navigation"
          style={{
            minWidth: 0,
            overflowX: 'auto',
            scrollbarWidth: 'none',
          }}
        >
          {nav.map((item) =>
            item.href ? (
              <ShellNavItem
                key={item.id}
                href={item.href}
                label={item.label}
                icon={item.icon}
                count={item.count}
                active={item.active}
              />
            ) : (
              <ShellNavItem
                key={item.id}
                label={item.label}
                icon={item.icon}
                count={item.count}
                active={item.active}
                onClick={item.onSelect}
              />
            ),
          )}
        </nav>
      ) : null}

      <div className="spacer" />

      {actions ? (
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 10,
            marginLeft: 16,
            flexShrink: 0,
          }}
        >
          {actions}
        </div>
      ) : null}
    </header>
  );
}

