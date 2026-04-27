'use client';
import * as React from 'react';
import { useState } from 'react';
import { useApp } from './AppContext';
import { Icons } from './legacy-icons';
import { ADMIN_QUEUE, TALENT } from '../lib/data';

type Route = { name: string };

export function AdminApp() {
  const { state, setState } = useApp();
  const route: Route = state.adminRoute || { name: 'queue' };
  const go = (r: Route) => setState({ ...state, adminRoute: r });

  return (
    <div className="product">
      <aside className="sidebar">
        <div style={{ padding: '6px 10px 18px', marginBottom: 12, borderBottom: '1px solid var(--line)' }}>
          <div className="eyebrow" style={{ marginBottom: 4 }}>Admin console</div>
          <div style={{ fontSize: 13, color: 'var(--ink)' }}>Platform operations</div>
        </div>
        <div className="sidebar-item" data-active={route.name === 'queue'} onClick={() => go({ name: 'queue' })}><Icons.Bell size={15} /> Review queue <span className="count">5</span></div>
        <div className="sidebar-item" data-active={route.name === 'talent'} onClick={() => go({ name: 'talent' })}><Icons.Users size={15} /> Talent</div>
        <div className="sidebar-item" data-active={route.name === 'companies'} onClick={() => go({ name: 'companies' })}><Icons.Brief size={15} /> Companies</div>
        <div className="sidebar-item" data-active={route.name === 'matching'} onClick={() => go({ name: 'matching' })}><Icons.Sparkles size={15} /> Matching runs</div>
        <div className="sidebar-item" data-active={route.name === 'disputes'} onClick={() => go({ name: 'disputes' })}><Icons.Shield size={15} /> Disputes <span className="count">1</span></div>
        <div className="sidebar-item" data-active={route.name === 'reports'} onClick={() => go({ name: 'reports' })}><Icons.Grid size={15} /> Reports</div>
      </aside>

      <main className="main-area">
        {route.name === 'queue' && <AdminQueue />}
        {route.name === 'talent' && <AdminTalentTable />}
        {route.name === 'companies' && <AdminCompanies />}
        {route.name === 'matching' && <AdminMatching />}
        {route.name === 'disputes' && <AdminDisputes />}
        {route.name === 'reports' && <AdminReports />}
      </main>
    </div>
  );
}

function AdminQueue() {
  const [handled, setHandled] = useState<Set<number>>(new Set());
  const iconFor = (kind: string) => kind === 'profile' ? <Icons.User size={14} /> : kind === 'match' ? <Icons.Sparkles size={14} /> : <Icons.Shield size={14} />;

  return (
    <>
      <header className="page-head">
        <div>
          <div className="breadcrumbs"><span>Admin</span> <Icons.ChevR size={10} /> <span>Review queue</span></div>
          <h1>Review queue</h1>
          <p>Human-checked quality gate. Activate talent, review matches, resolve disputes.</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <div className="segmented">
            <button data-active={true}>All</button><button>High</button><button>Profiles</button><button>Matches</button>
          </div>
        </div>
      </header>

      <div className="content-pad" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {ADMIN_QUEUE.map((q, i) => {
          const done = handled.has(i);
          return (
            <div key={i} style={{
              display: 'grid', gridTemplateColumns: '30px 130px 1fr auto auto', gap: 18, alignItems: 'center',
              padding: '16px 20px',
              background: done ? 'var(--bg-sunken)' : 'var(--bg-raised)',
              border: '1px solid var(--line)', borderRadius: 'var(--r-md)',
              opacity: done ? 0.55 : 1,
            }}>
              <div style={{ width: 26, height: 26, borderRadius: 999, background: 'var(--bg-sunken)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ink-2)', border: '1px solid var(--line)' }}>
                {iconFor(q.kind)}
              </div>
              <span className={'status ' + (q.priority === 'high' ? 'status-neg' : q.priority === 'low' ? 'status-closed' : 'status-pending')}>{q.priority}</span>
              <div>
                <div style={{ fontSize: 14, color: 'var(--ink)' }}>{q.what}</div>
                <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 2 }}>{q.who} · {q.meta}</div>
              </div>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-3)' }}>{q.age}</span>
              <div style={{ display: 'flex', gap: 6 }}>
                {!done ? (
                  <>
                    <button className="btn btn-ghost btn-sm" onClick={() => setHandled(new Set([...handled, i]))}>Skip</button>
                    <button className="btn btn-primary btn-sm" onClick={() => setHandled(new Set([...handled, i]))}>Review</button>
                  </>
                ) : <span className="badge">Handled ✓</span>}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

function AdminTalentTable() {
  return (
    <>
      <header className="page-head">
        <div>
          <div className="breadcrumbs"><span>Admin</span> <Icons.ChevR size={10} /> <span>Talent</span></div>
          <h1>Talent roster</h1>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <div className="input" style={{ display: 'flex', alignItems: 'center', gap: 8, width: 280, padding: '0 10px' }}><Icons.Search size={14} /> <input style={{ border: 0, background: 'transparent', outline: 'none', flex: 1 }} placeholder="Search name, skill, city…" /></div>
          <button className="btn btn-ghost"><Icons.Filter size={13} /> Filter</button>
        </div>
      </header>
      <div className="content-pad">
        <div className="paper" style={{ overflow: 'hidden' }}>
          <table className="table">
            <thead><tr><th></th><th>Name</th><th>Title</th><th>Categories</th><th>Rate</th><th>Avail</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {TALENT.map(t => (
                <tr key={t.id} className="clickable">
                  <td style={{ width: 40 }}><div className="avatar avatar-sm" style={{ fontFamily: 'var(--font-display)', fontWeight: 500 }}>{t.initials}</div></td>
                  <td>{t.name}</td>
                  <td style={{ color: 'var(--ink-3)' }}>{t.title}</td>
                  <td>{t.categories.join(', ')}</td>
                  <td>${t.rate}/hr</td>
                  <td>{t.availability.split(' ')[0]}h</td>
                  <td><span className={'status ' + (t.status === 'Active' ? 'status-active' : 'status-pending')}>{t.status}</span></td>
                  <td><button className="btn btn-quiet btn-sm">Open</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

function AdminCompanies() {
  return (
    <>
      <header className="page-head">
        <div>
          <div className="breadcrumbs"><span>Admin</span> <Icons.ChevR size={10} /><span>Companies</span></div>
          <h1>Client companies</h1>
        </div>
      </header>
      <div className="content-pad">
        <div className="paper" style={{ overflow: 'hidden' }}>
          <table className="table">
            <thead><tr><th>Company</th><th>Users</th><th>Active requests</th><th>Engagements</th><th>YTD spend</th><th>Status</th></tr></thead>
            <tbody>
              {([
                ['Cedar Health Co-op', 4, 3, 2, '$8,420', 'Active'],
                ['Lumen AI', 2, 1, 1, '$6,120', 'Active'],
                ['Ladder Fintech', 3, 2, 0, '$1,240', 'Onboarding'],
                ['Meridian Logistics', 1, 0, 0, '—', 'Onboarding'],
              ] as [string, number, number, number, string, string][]).map((r, i) => (
                <tr key={i} className="clickable">
                  <td>{r[0]}</td>
                  <td>{r[1]}</td>
                  <td>{r[2]}</td>
                  <td>{r[3]}</td>
                  <td style={{ fontFamily: 'var(--font-mono)' }}>{r[4]}</td>
                  <td><span className={'status ' + (r[5] === 'Active' ? 'status-active' : 'status-pending')}>{r[5]}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

function AdminMatching() {
  const factors: [string, number][] = [
    ['Work category match', 30],
    ['Skill overlap', 30],
    ['Availability fit', 15],
    ['Rate fit', 10],
    ['Timezone fit', 10],
    ['Industry familiarity', 5],
  ];
  return (
    <>
      <header className="page-head">
        <div>
          <div className="breadcrumbs"><span>Admin</span> <Icons.ChevR size={10} /><span>Matching runs</span></div>
          <h1>Matching engine</h1>
          <p>Deterministic, rules-based scoring. Every match is auditable. Tune weights, then re-run.</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-ghost">History</button>
          <button className="btn btn-accent"><Icons.Sparkles size={13} /> Re-run all open requests</button>
        </div>
      </header>
      <div className="content-pad" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 28 }}>
        <div className="paper" style={{ padding: 28 }}>
          <div className="eyebrow" style={{ marginBottom: 14 }}>Scoring weights</div>
          {factors.map(([label, val]) => (
            <div key={label} style={{ padding: '10px 0', borderBottom: '1px dashed var(--line)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 13 }}>{label}</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--ink-2)' }}>{val}%</span>
              </div>
              <div className="progress-bar"><span style={{ width: `${val * 2.5}%` }} /></div>
            </div>
          ))}
          <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 14 }}>Sum = 100%. Weights persist across runs.</div>
        </div>

        <div className="paper" style={{ padding: 28 }}>
          <div className="eyebrow" style={{ marginBottom: 14 }}>Recent runs</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {([
              ['Run · 2026-04-20 · 09:12', 'All open requests', 4, 18],
              ['Run · 2026-04-18 · 21:00', 'jr-002 (Lumen AI)', 1, 3],
              ['Run · 2026-04-17 · 14:25', 'All open requests', 4, 17],
            ] as [string, string, number, number][]).map((r, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '14px 16px', background: 'var(--bg-sunken)', borderRadius: 'var(--r-sm)' }}>
                <div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{r[0]}</div>
                  <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 2 }}>{r[1]}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 20 }}>{r[3]} matches</div>
                  <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>{r[2]} requests</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

function AdminDisputes() {
  return (
    <>
      <header className="page-head">
        <div>
          <div className="breadcrumbs"><span>Admin</span> <Icons.ChevR size={10} /><span>Disputes</span></div>
          <h1>Disputes</h1>
          <p>Surface hours disagreements and approval friction early.</p>
        </div>
      </header>
      <div className="content-pad">
        <div className="paper" style={{ padding: 28 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <div>
              <div className="eyebrow" style={{ marginBottom: 6 }}>Dispute · TS-00017</div>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 400, letterSpacing: '-0.02em', margin: '0 0 6px' }}>Hours mismatch — Cedar Health Co-op</h2>
              <div style={{ color: 'var(--ink-3)', fontSize: 13 }}>Timesheet TS-00017 · Nia Thompson · week of Apr 06</div>
            </div>
            <span className="status status-neg">Open · 6 hrs</span>
          </div>
          <hr className="hr" style={{ margin: '20px 0' }} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 28 }}>
            <div>
              <div className="eyebrow" style={{ marginBottom: 8 }}>Client says</div>
              <p style={{ fontSize: 14, lineHeight: 1.6, color: 'var(--ink-2)', margin: 0 }}>Submitted 22 hours but the scope was capped at 18 for this week. We approved 18 and asked for the remaining 4 to be re-classified as next-week prep.</p>
            </div>
            <div>
              <div className="eyebrow" style={{ marginBottom: 8 }}>Talent says</div>
              <p style={{ fontSize: 14, lineHeight: 1.6, color: 'var(--ink-2)', margin: 0 }}>Stayed 4 hours late Thursday at a director&rsquo;s explicit request to prep the Friday board packet. Happy to split but it was this week&rsquo;s work.</p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
            <button className="btn btn-accent">Propose split · 20 hrs</button>
            <button className="btn btn-ghost">Uphold client</button>
            <button className="btn btn-ghost">Uphold talent</button>
            <button className="btn btn-quiet">Request evidence</button>
          </div>
        </div>
      </div>
    </>
  );
}

function AdminReports() {
  return (
    <>
      <header className="page-head">
        <div>
          <div className="breadcrumbs"><span>Admin</span> <Icons.ChevR size={10} /><span>Reports</span></div>
          <h1>Platform health</h1>
          <p>Success is measured in approved hours and match-to-engagement conversion.</p>
        </div>
      </header>
      <div className="content-pad" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        <div className="grid-4">
          <div className="kpi"><div className="kpi-label">Active talent</div><div className="kpi-value">142</div><div className="kpi-delta pos">+18 this month</div></div>
          <div className="kpi"><div className="kpi-label">Active clients</div><div className="kpi-value">26</div><div className="kpi-delta pos">+4 this month</div></div>
          <div className="kpi"><div className="kpi-label">Open requests</div><div className="kpi-value">18</div><div className="kpi-delta">Avg TTM 14h</div></div>
          <div className="kpi"><div className="kpi-label">Approved hrs · MTD</div><div className="kpi-value">3,840</div><div className="kpi-delta pos">+22% MoM</div></div>
        </div>
        <div className="grid-2">
          <div className="paper" style={{ padding: 28 }}>
            <div className="eyebrow" style={{ marginBottom: 14 }}>Match → engagement conversion</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 48, fontWeight: 400, letterSpacing: '-0.02em' }}>62%</div>
            <div style={{ fontSize: 13, color: 'var(--ink-3)', marginTop: 4 }}>Of matches presented, % accepted and started.</div>
            <div style={{ marginTop: 18 }}>
              {([['Care & case', 71], ['Admin support', 68], ['Ops', 64], ['CX', 58], ['AI review', 54], ['Research', 49]] as [string, number][]).map(([k, v]) => (
                <div key={k} className="progress-row" style={{ gridTemplateColumns: '110px 1fr 40px' }}>
                  <span className="label">{k}</span>
                  <span className="progress-bar"><span style={{ width: `${v}%` }} /></span>
                  <span className="val">{v}%</span>
                </div>
              ))}
            </div>
          </div>
          <div className="paper" style={{ padding: 28 }}>
            <div className="eyebrow" style={{ marginBottom: 14 }}>Platform revenue · last 12 weeks</div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 160 }}>
              {[38, 42, 45, 41, 48, 52, 55, 59, 63, 68, 72, 78].map((v, i) => (
                <div key={i} style={{ flex: 1, height: `${v * 1.6}px`, background: 'var(--accent)', opacity: 0.35 + (i / 20), borderRadius: '2px 2px 0 0' }} />
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--ink-3)' }}>
              <span>Jan 27</span><span>Apr 20</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
