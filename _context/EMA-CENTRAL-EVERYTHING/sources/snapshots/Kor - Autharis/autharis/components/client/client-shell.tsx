'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import * as React from 'react';

import { ClientIcons } from '@/components/client/icons';
import { CLIENT_ENGAGEMENTS, CLIENT_JOB_REQUESTS, CLIENT_TIMESHEETS } from '@/lib/client/data';

const NAV_ITEMS = [
  { href: '/client', label: 'Overview', icon: ClientIcons.Grid, match: /^\/client$/, count: null },
  { href: '/client/requests', label: 'Job requests', icon: ClientIcons.Brief, match: /^\/client\/requests/, count: CLIENT_JOB_REQUESTS.length },
  { href: '/client/matches/jr-002', label: 'Matches', icon: ClientIcons.Sparkles, match: /^\/client\/matches/, count: 3 },
  { href: '/client/engagements', label: 'Engagements', icon: ClientIcons.Users, match: /^\/client\/engagements/, count: CLIENT_ENGAGEMENTS.length },
  { href: '/client/timesheets', label: 'Timesheets', icon: ClientIcons.Clock, match: /^\/client\/timesheets/, count: CLIENT_TIMESHEETS.filter((timesheet) => timesheet.status === 'Submitted').length },
  { href: '/client/invoices', label: 'Invoices', icon: ClientIcons.Cash, match: /^\/client\/invoices/, count: null },
] as const;

export function ClientShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="client-surface">
      <div className="client-shell">
        <aside className="client-sidebar">
          <div className="client-sidebar__section">Cedar Health Co-op</div>
          <nav className="client-sidebar__nav" aria-label="Client product navigation">
            {NAV_ITEMS.map((item) => {
              const active = item.match.test(pathname);
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  className="client-sidebar__link"
                  data-active={active ? 'true' : 'false'}
                  href={item.href}
                >
                  <span className="client-sidebar__link-label">
                    <Icon size={15} />
                    <span>{item.label}</span>
                  </span>
                  {item.count !== null ? <span className="client-sidebar__count">{item.count}</span> : null}
                </Link>
              );
            })}
          </nav>

          <div className="client-sidebar__footer">
            <div className="client-sidebar__section">Team</div>
            <button className="client-sidebar__ghost" type="button">
              <ClientIcons.Settings size={15} />
              <span>Company settings</span>
            </button>
          </div>
        </aside>

        <main className="client-main">{children}</main>
      </div>
    </div>
  );
}
