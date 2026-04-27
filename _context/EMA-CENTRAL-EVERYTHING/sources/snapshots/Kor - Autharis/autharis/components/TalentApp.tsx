'use client';
import * as React from 'react';
import { useState } from 'react';
import { useApp } from './AppContext';
import { Icons } from './legacy-icons';
import { SKILLS, CATEGORIES, JOB_REQUESTS, ENGAGEMENTS } from '../lib/data';

type Route = { name: string };

export function TalentApp() {
  const { state, setState } = useApp();
  const route: Route = state.talentRoute || { name: 'profile' };
  const go = (r: Route) => setState({ ...state, talentRoute: r });

  return (
    <div className="product">
      <aside className="sidebar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 10px 18px', borderBottom: '1px solid var(--line)', marginBottom: 12 }}>
          <div className="avatar" style={{ fontFamily: 'var(--font-display)', fontWeight: 500 }}>AO</div>
          <div>
            <div style={{ fontSize: 13, color: 'var(--ink)' }}>Amara Okafor</div>
            <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>Active · 94 fit avg</div>
          </div>
        </div>

        <div className="sidebar-item" data-active={route.name === 'profile'} onClick={() => go({ name: 'profile' })}><Icons.User size={15} /> My profile</div>
        <div className="sidebar-item" data-active={route.name === 'opportunities'} onClick={() => go({ name: 'opportunities' })}><Icons.Sparkles size={15} /> Opportunities <span className="count">3</span></div>
        <div className="sidebar-item" data-active={route.name === 'engagements'} onClick={() => go({ name: 'engagements' })}><Icons.Brief size={15} /> Engagements <span className="count">2</span></div>
        <div className="sidebar-item" data-active={route.name === 'timesheet'} onClick={() => go({ name: 'timesheet' })}><Icons.Clock size={15} /> Timesheets</div>
        <div className="sidebar-item" data-active={route.name === 'earnings'} onClick={() => go({ name: 'earnings' })}><Icons.Cash size={15} /> Earnings</div>
      </aside>

      <main className="main-area">
        {route.name === 'profile' && <TalentProfile />}
        {route.name === 'opportunities' && <TalentOpportunities />}
        {route.name === 'engagements' && <TalentEngagements />}
        {route.name === 'timesheet' && <TalentTimesheet />}
        {route.name === 'earnings' && <TalentEarnings />}
      </main>
    </div>
  );
}

function TalentProfile() {
  const [skills, setSkills] = useState<string[]>(['Project Coordination', 'Care Coordination', 'Notion', 'Intake', 'QA Review']);
  const [cats, setCats] = useState<string[]>(['ops', 'care']);
  const toggle = (arr: string[], setA: (a: string[]) => void, s: string) => setA(arr.includes(s) ? arr.filter(x => x !== s) : [...arr, s]);

  return (
    <>
      <header className="page-head">
        <div>
          <div className="breadcrumbs"><span>Talent</span> <Icons.ChevR size={10} /> <span>Profile</span></div>
          <h1>Your profile</h1>
          <p>What you do today <em>and</em> the work you&rsquo;re open to. Both matter.</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-ghost">Preview public view</button>
          <button className="btn btn-primary">Save changes</button>
        </div>
      </header>
      <div className="content-pad" style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 32, maxWidth: 1180 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <section className="paper" style={{ padding: 28 }}>
            <div className="eyebrow" style={{ marginBottom: 14 }}>Identity</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="field"><label className="field-label">Full name</label><input className="input" defaultValue="Amara Okafor" /></div>
              <div className="field"><label className="field-label">Current title</label><input className="input" defaultValue="Operations lead, Cedar Health" /></div>
              <div className="field"><label className="field-label">City / timezone</label><input className="input" defaultValue="Lagos · GMT" /></div>
              <div className="field"><label className="field-label">Years of experience</label><input className="input" type="number" defaultValue={8} /></div>
            </div>
          </section>

          <section className="paper" style={{ padding: 28 }}>
            <div className="eyebrow" style={{ marginBottom: 10 }}>Work I&rsquo;m open to</div>
            <div className="field-hint" style={{ marginBottom: 14 }}>Your current title is one thing. The work you want next is another. Pick as many as apply.</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {CATEGORIES.map(c => (
                <button key={c.id} className={'chip chip-interactive ' + (cats.includes(c.id) ? 'chip-selected' : '')} onClick={() => toggle(cats, setCats, c.id)}>{c.label}</button>
              ))}
            </div>
          </section>

          <section className="paper" style={{ padding: 28 }}>
            <div className="eyebrow" style={{ marginBottom: 14 }}>Skills</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {SKILLS.map(s => (
                <button key={s} className={'chip chip-interactive ' + (skills.includes(s) ? 'chip-selected' : '')} onClick={() => toggle(skills, setSkills, s)}>{s}</button>
              ))}
            </div>
          </section>

          <section className="paper" style={{ padding: 28 }}>
            <div className="eyebrow" style={{ marginBottom: 14 }}>About me</div>
            <textarea className="textarea" rows={5} defaultValue="Eight years coordinating care navigation and ops. Comfortable running intake queues, building Notion workspaces, and turning messy inboxes into reliable workflows." />
          </section>
        </div>

        <aside>
          <div className="paper" style={{ padding: 22 }}>
            <div className="eyebrow" style={{ marginBottom: 12 }}>Availability & rate</div>
            <div className="field" style={{ marginBottom: 14 }}><label className="field-label">Hourly rate</label><input className="input" defaultValue="$42/hr" /></div>
            <div className="field" style={{ marginBottom: 14 }}><label className="field-label">Hours per week</label><input className="input" defaultValue="20" /></div>
            <div className="field">
              <label className="field-label">Status</label>
              <div className="segmented" style={{ width: '100%' }}>
                <button data-active={true} style={{ flex: 1 }}>Open to work</button>
                <button style={{ flex: 1 }}>Paused</button>
              </div>
            </div>
          </div>
          <div className="paper" style={{ padding: 22, marginTop: 16 }}>
            <div className="eyebrow" style={{ marginBottom: 10 }}>Résumé</div>
            <div style={{ fontSize: 13, color: 'var(--ink-2)' }}>amara_okafor_cv.pdf</div>
            <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 2 }}>Parsed · 12 roles extracted</div>
            <button className="btn btn-ghost btn-sm" style={{ marginTop: 12 }}>Replace</button>
          </div>
        </aside>
      </div>
    </>
  );
}

function TalentOpportunities() {
  const cat = (id: string) => CATEGORIES.find(c => c.id === id)?.label;
  return (
    <>
      <header className="page-head">
        <div>
          <div className="breadcrumbs"><span>Talent</span> <Icons.ChevR size={10} /> <span>Opportunities</span></div>
          <h1>Work you&rsquo;re matched to</h1>
          <p>Surfaced because of skill overlap, availability, and preferred work category.</p>
        </div>
      </header>
      <div className="content-pad" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {JOB_REQUESTS.filter(j => j.status !== 'Draft').map(j => (
          <div key={j.id} className="paper" style={{ padding: 22, display: 'grid', gridTemplateColumns: '60px 1fr auto', gap: 20, alignItems: 'center' }}>
            <div className="score-ring-sm" style={{ ['--p' as any]: 82 }}>
              <span className="score-ring-sm-value">82</span>
            </div>
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 19, letterSpacing: '-0.01em' }}>{j.title}</div>
              <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 3 }}>{j.client} · {cat(j.category)} · {j.hoursPerWeek} hrs/wk · ${j.budget[0]}–${j.budget[1]}/hr</div>
              <div style={{ display: 'flex', gap: 6, marginTop: 10, flexWrap: 'wrap' }}>
                {j.skills.map(s => <span key={s} className="chip">{s}</span>)}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-ghost btn-sm">Not interested</button>
              <button className="btn btn-primary btn-sm">Express interest <Icons.Arrow size={12} /></button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

function TalentEngagements() {
  return (
    <>
      <header className="page-head">
        <div>
          <div className="breadcrumbs"><span>Talent</span> <Icons.ChevR size={10} /> <span>Engagements</span></div>
          <h1>Your engagements</h1>
        </div>
      </header>
      <div className="content-pad" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {ENGAGEMENTS.map(e => (
          <div key={e.id} className="paper" style={{ padding: 24, display: 'grid', gridTemplateColumns: '1fr auto', gap: 20 }}>
            <div>
              <div className="eyebrow" style={{ marginBottom: 4 }}>{e.client}</div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, letterSpacing: '-0.01em' }}>{e.jobTitle}</div>
              <div style={{ color: 'var(--ink-3)', fontSize: 12, marginTop: 4 }}>Since {e.started} · ${e.rate}/hr</div>
              <div style={{ display: 'flex', gap: 24, marginTop: 16 }}>
                <div><div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--ink-3)' }}>This week</div><div style={{ fontFamily: 'var(--font-display)', fontSize: 22 }}>{e.hoursThisWeek} hrs</div></div>
                <div><div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--ink-3)' }}>Approved</div><div style={{ fontFamily: 'var(--font-display)', fontSize: 22 }}>{e.hoursApproved} hrs</div></div>
                <div><div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--ink-3)' }}>Earned</div><div style={{ fontFamily: 'var(--font-display)', fontSize: 22 }}>${(e.hoursApproved * e.rate).toLocaleString()}</div></div>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <span className="status status-active">Active</span>
              <button className="btn btn-primary btn-sm">Log hours</button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

function TalentTimesheet() {
  const { state, setState } = useApp();
  const days = ['Mon, Apr 20', 'Tue, Apr 21', 'Wed, Apr 22', 'Thu, Apr 23', 'Fri, Apr 24'];
  const [entries, setEntries] = useState<any[]>(state.talentDraft || days.map(d => ({ day: d, hours: '', note: '' })));
  const [submitted, setSubmitted] = useState(false);
  const total = entries.reduce((s, e) => s + (parseFloat(e.hours) || 0), 0);

  const update = (i: number, key: string, val: string) => {
    const next = entries.map((e, j) => (i === j ? { ...e, [key]: val } : e));
    setEntries(next);
    setState({ ...state, talentDraft: next });
  };

  return (
    <>
      <header className="page-head">
        <div>
          <div className="breadcrumbs"><span>Talent</span> <Icons.ChevR size={10} /><span>Timesheets</span> <Icons.ChevR size={10} /><span>Current week</span></div>
          <h1>Log this week&rsquo;s hours</h1>
          <p>Engagement: Patient intake coordinator · Cedar Health Co-op · $48/hr</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-ghost" onClick={() => setState({ ...state, talentDraft: null })}>Discard</button>
          <button className="btn btn-primary" disabled={total === 0 || submitted} onClick={() => setSubmitted(true)}>{submitted ? 'Submitted ✓' : 'Submit for approval'}</button>
        </div>
      </header>

      <div className="content-pad" style={{ maxWidth: 960 }}>
        <div className="paper" style={{ overflow: 'hidden' }}>
          <div className="timesheet-row head">
            <span>Day</span><span>Notes</span><span style={{ textAlign: 'right' }}>Hours</span><span></span>
          </div>
          {entries.map((e, i) => (
            <div key={i} className="timesheet-row">
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--ink-2)' }}>{e.day}</span>
              <input className="input" style={{ height: 30, border: '1px solid var(--line-soft)', background: 'transparent' }} placeholder="What did you work on?" value={e.note} onChange={ev => update(i, 'note', ev.target.value)} />
              <input className="input hours-input" style={{ marginLeft: 'auto' }} placeholder="0.0" value={e.hours} onChange={ev => update(i, 'hours', ev.target.value)} />
              <span></span>
            </div>
          ))}
          <div className="timesheet-row" style={{ background: 'var(--bg-sunken)' }}>
            <span></span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--ink-3)' }}>Total · ${(total * 48).toFixed(2)}</span>
            <span style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: 500 }}>{total.toFixed(1)}</span>
            <span></span>
          </div>
        </div>

        {submitted && (
          <div style={{ marginTop: 24, padding: 20, background: 'var(--accent-soft)', border: '1px solid var(--accent-line)', borderRadius: 'var(--r-md)', display: 'flex', alignItems: 'center', gap: 14 }}>
            <Icons.Check size={20} stroke={2} />
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 17 }}>Submitted for approval</div>
              <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>Cedar Health Co-op will review. You&rsquo;ll get an email the moment it&rsquo;s decided.</div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

function TalentEarnings() {
  return (
    <>
      <header className="page-head">
        <div>
          <div className="breadcrumbs"><span>Talent</span> <Icons.ChevR size={10} /><span>Earnings</span></div>
          <h1>Earnings</h1>
          <p>April 2026 · paid in full.</p>
        </div>
      </header>
      <div className="content-pad" style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
        <div className="grid-3">
          <div className="kpi"><div className="kpi-label">YTD earnings</div><div className="kpi-value">$12,480</div><div className="kpi-delta pos">+18% vs Jan–Mar</div></div>
          <div className="kpi"><div className="kpi-label">Hours approved</div><div className="kpi-value">260</div><div className="kpi-delta">Across 2 engagements</div></div>
          <div className="kpi"><div className="kpi-label">Avg weekly</div><div className="kpi-value">18.2 hrs</div><div className="kpi-delta">Target: 20</div></div>
        </div>
        <div className="paper" style={{ overflow: 'hidden' }}>
          <table className="table">
            <thead><tr><th>Week</th><th>Engagement</th><th>Hours</th><th>Rate</th><th>Payout</th><th>Status</th></tr></thead>
            <tbody>
              {([
                ['Apr 13 – 19', 'Cedar Health Co-op', 18.5, 48, 'Pending'],
                ['Apr 06 – 12', 'Cedar Health Co-op', 19, 48, 'Paid'],
                ['Mar 30 – Apr 5', 'Cedar Health Co-op', 20, 48, 'Paid'],
                ['Mar 23 – 29', 'Cedar Health Co-op', 22, 42, 'Paid'],
              ] as [string, string, number, number, string][]).map((r, i) => (
                <tr key={i}>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{r[0]}</td>
                  <td>{r[1]}</td>
                  <td>{r[2]}</td>
                  <td>${r[3]}/hr</td>
                  <td style={{ fontFamily: 'var(--font-mono)' }}>${(r[2] * r[3]).toFixed(2)}</td>
                  <td><span className={'status ' + (r[4] === 'Paid' ? 'status-paid' : 'status-pending')}>{r[4]}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
