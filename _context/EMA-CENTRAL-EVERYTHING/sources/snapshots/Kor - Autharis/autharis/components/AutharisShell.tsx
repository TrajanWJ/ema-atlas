'use client';
import * as React from 'react';
import { AppProvider, useApp } from './AppContext';
import { MarketingPage } from './Marketing';
import { ClientApp } from './ClientApp';
import { TalentApp } from './TalentApp';
import { AdminApp } from './AdminApp';
import { TweaksPanel } from './TweaksPanel';

const SURFACES = [
  { id: 'marketing', label: 'Marketing' },
  { id: 'client',    label: 'Client app' },
  { id: 'talent',    label: 'Talent app' },
  { id: 'admin',     label: 'Admin' },
];

function Shell() {
  const { surface, setSurface, tweaksOpen, setTweaksOpen } = useApp();
  return (
    <div className="app-shell">
      <div className="surface-bar">
        <span className="surface-bar-label">Autharis · Prototype</span>
        {SURFACES.map(s => (
          <div key={s.id} className="surface-tab" data-active={surface === s.id} onClick={() => setSurface(s.id)}>
            <span className="surface-tab-dot" /> {s.label}
          </div>
        ))}
        <div className="surface-meta">
          <span>Apr 20, 2026</span>
          <span>·</span>
          <span>v0.1 preview</span>
          <span>·</span>
          <button onClick={() => setTweaksOpen(!tweaksOpen)} style={{ color: 'inherit', opacity: 0.7, fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
            {tweaksOpen ? 'Close tweaks' : 'Tweaks'}
          </button>
        </div>
      </div>

      <div className="app-body">
        <div className="app-main">
          <div className="app-content" key={surface}>
            {surface === 'marketing' && <MarketingPage />}
            {surface === 'client' && <ClientApp />}
            {surface === 'talent' && <TalentApp />}
            {surface === 'admin' && <AdminApp />}
          </div>
        </div>
      </div>

      {tweaksOpen && <TweaksPanel />}
    </div>
  );
}

export function AutharisShell() {
  return (
    <AppProvider>
      <Shell />
    </AppProvider>
  );
}
