import { useState } from 'react';
import { Queue } from './views/Queue';
import { Roster } from './views/Roster';
import { Disputes } from './views/Disputes';
import { Reports } from './views/Reports';
import { API_BASE_URL } from './sdk';

type ViewId = 'queue' | 'roster' | 'disputes' | 'reports';

const NAV: ReadonlyArray<{ id: ViewId; label: string }> = [
  { id: 'queue', label: 'Review queue' },
  { id: 'roster', label: 'Roster' },
  { id: 'disputes', label: 'Disputes' },
  { id: 'reports', label: 'Reports' },
];

export function App() {
  const [view, setView] = useState<ViewId>('queue');

  return (
    <div className="app">
      <header className="titlebar">
        <span>Autharis Admin</span>
        <span className="status">api · {API_BASE_URL}</span>
      </header>
      <nav className="nav" aria-label="Primary">
        {NAV.map((item) => (
          <button
            key={item.id}
            type="button"
            aria-current={view === item.id ? 'page' : undefined}
            onClick={() => setView(item.id)}
          >
            {item.label}
          </button>
        ))}
      </nav>
      <main className="main">
        {view === 'queue' && <Queue />}
        {view === 'roster' && <Roster />}
        {view === 'disputes' && <Disputes />}
        {view === 'reports' && <Reports />}
      </main>
    </div>
  );
}
