// Client-side product: dashboard, job requests (new + detail), matches
// with the single-top-pick + alternates layout, timesheets to approve,
// and invoices.

const { useState, useMemo } = React;

function ClientApp({ state, setState }) {
  const route = state.clientRoute || { name: 'dashboard' };
  const go = (r) => setState({ ...state, clientRoute: r });

  return (
    <div className="product">
      <aside className="sidebar">
        <div className="sidebar-section">Cedar Health Co-op</div>
        <div className="sidebar-item" data-active={route.name === 'dashboard'} onClick={() => go({ name: 'dashboard' })}>
          <Icons.Grid size={15} /> Overview
        </div>
        <div className="sidebar-item" data-active={route.name === 'requests' || route.name === 'new-request'} onClick={() => go({ name: 'requests' })}>
          <Icons.Brief size={15} /> Job requests <span className="count">4</span>
        </div>
        <div className="sidebar-item" data-active={route.name === 'matches'} onClick={() => go({ name: 'matches' })}>
          <Icons.Sparkles size={15} /> Matches <span className="count">3</span>
        </div>
        <div className="sidebar-item" data-active={route.name === 'engagements'} onClick={() => go({ name: 'engagements' })}>
          <Icons.Users size={15} /> Engagements <span className="count">2</span>
        </div>
        <div className="sidebar-item" data-active={route.name === 'timesheets'} onClick={() => go({ name: 'timesheets' })}>
          <Icons.Clock size={15} /> Timesheets <span className="count">2</span>
        </div>
        <div className="sidebar-item" data-active={route.name === 'invoices'} onClick={() => go({ name: 'invoices' })}>
          <Icons.Cash size={15} /> Invoices
        </div>

        <div className="sidebar-section" style={{marginTop: 'auto'}}>Team</div>
        <div className="sidebar-item"><Icons.Settings size={15} /> Company settings</div>
      </aside>

      <main className="main-area">
        {route.name === 'dashboard' && <ClientDashboard go={go} />}
        {route.name === 'requests' && <ClientRequests go={go} />}
        {route.name === 'new-request' && <NewRequestFlow state={state} setState={setState} />}
        {route.name === 'matches' && <MatchesPage jobId={route.jobId || 'jr-001'} go={go} state={state} />}
        {route.name === 'engagements' && <EngagementsPage go={go} />}
        {route.name === 'timesheets' && <TimesheetsApproval state={state} setState={setState} />}
        {route.name === 'invoices' && <InvoicesPage state={state} />}
      </main>
    </div>
  );
}

/* ——— Dashboard ——— */
function ClientDashboard({ go }) {
  const { ENGAGEMENTS, TIMESHEETS } = window.AUTHARIS_DATA;
  const pending = TIMESHEETS.filter(t => t.status === 'Submitted');

  return (
    <>
      <header className="page-head">
        <div>
          <div className="breadcrumbs"><span>Cedar Health Co-op</span> <Icons.ChevR size={10} /> <span>Overview</span></div>
          <h1>Good morning, Maya.</h1>
          <p>You have <strong>{pending.length} timesheets</strong> waiting for approval and <strong>3 new matches</strong> on your active requests.</p>
        </div>
        <div style={{display: 'flex', gap: 10}}>
          <button className="btn btn-ghost">Invite teammate</button>
          <button className="btn btn-primary" onClick={() => go({ name: 'new-request' })}>
            <Icons.Plus size={14}/> New request
          </button>
        </div>
      </header>

      <div className="content-pad" style={{display: 'flex', flexDirection: 'column', gap: 28}}>
        <div className="grid-4">
          <div className="kpi">
            <div className="kpi-label">Hours this week</div>
            <div className="kpi-value">30.5</div>
            <div className="kpi-delta pos">+4.5 vs last week</div>
          </div>
          <div className="kpi">
            <div className="kpi-label">Pending approval</div>
            <div className="kpi-value">{pending.length}</div>
            <div className="kpi-delta">2 engagements</div>
          </div>
          <div className="kpi">
            <div className="kpi-label">Open requests</div>
            <div className="kpi-value">3</div>
            <div className="kpi-delta pos">1 shortlist ready</div>
          </div>
          <div className="kpi">
            <div className="kpi-label">Spend — April</div>
            <div className="kpi-value">$3,430</div>
            <div className="kpi-delta">Paid in full</div>
          </div>
        </div>

        <section>
          <SectionHead title="Needs your attention" hint="Four items. Tackle in order." />
          <div style={{display: 'flex', flexDirection: 'column', gap: 10}}>
            <ActionRow
              tag="Match ready"
              title="AI support review — overflow QA · Lumen AI"
              meta="3 candidates · top pick: Jakob Lindqvist (78)"
              cta="Review shortlist"
              onClick={() => go({ name: 'matches', jobId: 'jr-002' })}
            />
            <ActionRow
              tag="Timesheet"
              title="Amara Okafor · 18.5 hrs · Apr 13 – 19"
              meta="Cedar Health Co-op · submitted Sat 21:42"
              cta="Approve hours"
              onClick={() => go({ name: 'timesheets' })}
            />
            <ActionRow
              tag="Timesheet"
              title="Jakob Lindqvist · 12 hrs · Apr 13 – 19"
              meta="Lumen AI · submitted Sat 18:05"
              cta="Approve hours"
              onClick={() => go({ name: 'timesheets' })}
            />
            <ActionRow
              tag="Draft"
              title="EA coverage — founder, 20 hrs/wk"
              meta="Saved as draft · last edit 2 days ago"
              cta="Finish & publish"
              onClick={() => go({ name: 'new-request' })}
            />
          </div>
        </section>

        <section>
          <SectionHead title="Active engagements" hint="2 in flight." />
          <div className="grid-2">
            {ENGAGEMENTS.map(e => (
              <div className="paper" key={e.id} style={{padding: 20}}>
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start'}}>
                  <div>
                    <div className="eyebrow" style={{marginBottom: 6}}>{e.client}</div>
                    <div style={{fontFamily: 'var(--font-display)', fontSize: 20, letterSpacing: '-0.01em'}}>{e.jobTitle}</div>
                  </div>
                  <span className="status status-active">Active</span>
                </div>
                <div style={{display: 'flex', gap: 20, marginTop: 18, paddingTop: 18, borderTop: '1px solid var(--line-soft)'}}>
                  <InlineStat label="Talent" value={e.talentName} />
                  <InlineStat label="Rate" value={`$${e.rate}/hr`} />
                  <InlineStat label="This week" value={`${e.hoursThisWeek} hrs`} />
                  <InlineStat label="Approved" value={`${e.hoursApproved} hrs`} />
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}

function SectionHead({ title, hint }) {
  return (
    <div style={{display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 14}}>
      <h2 style={{fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 500, margin: 0, letterSpacing: '-0.01em'}}>{title}</h2>
      <span style={{color: 'var(--ink-3)', fontSize: 13}}>{hint}</span>
    </div>
  );
}

function InlineStat({ label, value }) {
  return (
    <div style={{flex: 1}}>
      <div style={{fontFamily: 'var(--font-mono)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--ink-3)', marginBottom: 3}}>{label}</div>
      <div style={{fontSize: 14, color: 'var(--ink)'}}>{value}</div>
    </div>
  );
}

function ActionRow({ tag, title, meta, cta, onClick }) {
  return (
    <div style={{
      display: 'grid', gridTemplateColumns: '110px 1fr auto', gap: 20, alignItems: 'center',
      padding: '16px 20px', background: 'var(--bg-raised)', border: '1px solid var(--line)',
      borderRadius: 'var(--r-md)'
    }}>
      <span className="badge badge-outline">{tag}</span>
      <div>
        <div style={{fontSize: 15, color: 'var(--ink)'}}>{title}</div>
        <div style={{fontSize: 12, color: 'var(--ink-3)', marginTop: 3}}>{meta}</div>
      </div>
      <button className="btn btn-ghost btn-sm" onClick={onClick}>{cta} <Icons.Arrow size={12} /></button>
    </div>
  );
}

/* ——— Requests list ——— */
function ClientRequests({ go }) {
  const { JOB_REQUESTS, CATEGORIES } = window.AUTHARIS_DATA;
  const catOf = (id) => CATEGORIES.find(c => c.id === id)?.label || id;
  const [filter, setFilter] = useState('all');

  const rows = filter === 'all' ? JOB_REQUESTS : JOB_REQUESTS.filter(r => r.status === filter);

  return (
    <>
      <header className="page-head">
        <div>
          <div className="breadcrumbs"><span>Cedar Health Co-op</span> <Icons.ChevR size={10} /> <span>Job requests</span></div>
          <h1>Job requests</h1>
          <p>Post structured requests. We&rsquo;ll surface a shortlist — usually within a day.</p>
        </div>
        <div style={{display: 'flex', gap: 10}}>
          <div className="segmented">
            {['all', 'Draft', 'Reviewing', 'Matched'].map(v => (
              <button key={v} data-active={filter === v} onClick={() => setFilter(v)}>
                {v === 'all' ? 'All' : v}
              </button>
            ))}
          </div>
          <button className="btn btn-primary" onClick={() => go({ name: 'new-request' })}>
            <Icons.Plus size={14}/> New request
          </button>
        </div>
      </header>

      <div className="content-pad">
        <div style={{border: '1px solid var(--line)', borderRadius: 'var(--r-md)', overflow: 'hidden', background: 'var(--bg-raised)'}}>
          <table className="table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Category</th>
                <th>Hours</th>
                <th>Budget</th>
                <th>Matches</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.id} className="clickable" onClick={() => go({ name: 'matches', jobId: r.id })}>
                  <td>
                    <div style={{fontSize: 14, color: 'var(--ink)'}}>{r.title}</div>
                    <div style={{fontSize: 11, color: 'var(--ink-3)', marginTop: 2}}>Posted {r.posted} · {r.duration}</div>
                  </td>
                  <td><span className="chip">{catOf(r.category)}</span></td>
                  <td>{r.hoursPerWeek} / wk</td>
                  <td>${r.budget[0]}–${r.budget[1]}</td>
                  <td>{r.matches || '—'}</td>
                  <td>
                    <span className={
                      'status ' +
                      (r.status === 'Matched' ? 'status-active' :
                       r.status === 'Reviewing' ? 'status-review' :
                       r.status === 'Shortlist ready' ? 'status-pending' :
                       'status-closed')
                    }>{r.status}</span>
                  </td>
                  <td style={{width: 40}}><Icons.ChevR size={14} className="ink-3" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

/* ——— New request flow (3 steps) ——— */
function NewRequestFlow({ state, setState }) {
  const { CATEGORIES, SKILLS } = window.AUTHARIS_DATA;
  const [step, setStep] = useState(state.newRequest?.step || 1);
  const [form, setForm] = useState(state.newRequest?.form || {
    title: '',
    category: 'care',
    description: '',
    hoursPerWeek: 20,
    duration: '3 months',
    timezone: 'GMT ± 3',
    budget: [40, 55],
    skills: ['Care Coordination', 'Intake'],
    industry: 'Healthcare',
  });
  const update = (patch) => setForm(f => ({ ...f, ...patch }));
  const toggleSkill = (s) => update({ skills: form.skills.includes(s) ? form.skills.filter(x => x !== s) : [...form.skills, s] });

  const goMatches = () => setState({ ...state, clientRoute: { name: 'matches', jobId: 'jr-001' } });

  return (
    <>
      <header className="page-head">
        <div>
          <div className="breadcrumbs">
            <span>Job requests</span> <Icons.ChevR size={10} />
            <span>New request</span> <Icons.ChevR size={10} />
            <span>Step {step} of 3</span>
          </div>
          <h1>{step === 1 ? 'What needs to get done?' : step === 2 ? 'Skills & fit' : 'Review & publish'}</h1>
          <p>{step === 1 ? 'Keep it brief — we&rsquo;ll structure it for the match engine.' : step === 2 ? 'Which skills matter, and what does the right fit look like?' : 'Last look. You can edit or publish.'}</p>
        </div>
        <div style={{display: 'flex', gap: 10}}>
          <button className="btn btn-ghost" onClick={() => setState({ ...state, clientRoute: { name: 'requests' } })}>Save as draft</button>
          {step < 3 && <button className="btn btn-primary" onClick={() => setStep(step + 1)}>Continue <Icons.Arrow size={12}/></button>}
          {step === 3 && <button className="btn btn-accent" onClick={goMatches}><Icons.Send size={14}/> Publish request</button>}
        </div>
      </header>

      <div className="content-pad" style={{maxWidth: 860}}>
        <div style={{display: 'flex', gap: 6, marginBottom: 32}}>
          {[1,2,3].map(n => (
            <div key={n} style={{
              height: 3, flex: 1, borderRadius: 2,
              background: n <= step ? 'var(--accent)' : 'var(--line)'
            }} />
          ))}
        </div>

        {step === 1 && (
          <div style={{display: 'flex', flexDirection: 'column', gap: 22}}>
            <div className="field">
              <label className="field-label">Title</label>
              <input className="input" value={form.title} onChange={e => update({ title: e.target.value })} placeholder="Patient intake coordinator — evenings" />
            </div>
            <div className="field">
              <label className="field-label">Category</label>
              <div style={{display: 'flex', flexWrap: 'wrap', gap: 8}}>
                {CATEGORIES.map(c => (
                  <button key={c.id} className={'chip chip-interactive ' + (form.category === c.id ? 'chip-selected' : '')} onClick={() => update({ category: c.id })}>
                    {c.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="field">
              <label className="field-label">Describe the work</label>
              <textarea className="textarea" rows={5} value={form.description} onChange={e => update({ description: e.target.value })} placeholder="What the person will own, where they'll plug in, what success looks like." />
            </div>
            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16}}>
              <div className="field">
                <label className="field-label">Hours / week</label>
                <input className="input" type="number" value={form.hoursPerWeek} onChange={e => update({ hoursPerWeek: +e.target.value })}/>
              </div>
              <div className="field">
                <label className="field-label">Duration</label>
                <input className="input" value={form.duration} onChange={e => update({ duration: e.target.value })}/>
              </div>
              <div className="field">
                <label className="field-label">Timezone preference</label>
                <input className="input" value={form.timezone} onChange={e => update({ timezone: e.target.value })}/>
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div style={{display: 'flex', flexDirection: 'column', gap: 22}}>
            <div className="field">
              <label className="field-label">Hourly budget ({`$${form.budget[0]}–$${form.budget[1]}`})</label>
              <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12}}>
                <input className="input" type="number" value={form.budget[0]} onChange={e => update({ budget: [+e.target.value, form.budget[1]] })}/>
                <input className="input" type="number" value={form.budget[1]} onChange={e => update({ budget: [form.budget[0], +e.target.value] })}/>
              </div>
              <div className="field-hint">Lower bound biases toward breadth; upper bound toward expertise. You can adjust later.</div>
            </div>

            <div className="field">
              <label className="field-label">Required & nice-to-have skills</label>
              <div style={{display: 'flex', flexWrap: 'wrap', gap: 6}}>
                {SKILLS.map(s => (
                  <button key={s} className={'chip chip-interactive ' + (form.skills.includes(s) ? 'chip-selected' : '')} onClick={() => toggleSkill(s)}>
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div className="field">
              <label className="field-label">Industry familiarity (optional)</label>
              <select className="select" value={form.industry} onChange={e => update({ industry: e.target.value })}>
                {['Healthcare','SaaS','Fintech','Consumer','AI','Developer Tools','No preference'].map(i => <option key={i}>{i}</option>)}
              </select>
              <div className="field-hint">A preference layer, not a hard filter.</div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="paper" style={{padding: 28}}>
            <div style={{fontFamily: 'var(--font-display)', fontSize: 24, letterSpacing: '-0.01em', marginBottom: 4}}>
              {form.title || 'Untitled request'}
            </div>
            <div style={{color: 'var(--ink-3)', fontSize: 13, marginBottom: 22}}>
              Cedar Health Co-op · {CATEGORIES.find(c => c.id === form.category)?.label} · {form.industry}
            </div>
            <p style={{color: 'var(--ink-2)', lineHeight: 1.6, fontSize: 14}}>{form.description || 'No description yet.'}</p>
            <div style={{display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginTop: 24, paddingTop: 20, borderTop: '1px solid var(--line-soft)'}}>
              <InlineStat label="Hours/wk" value={form.hoursPerWeek} />
              <InlineStat label="Duration" value={form.duration} />
              <InlineStat label="Timezone" value={form.timezone} />
              <InlineStat label="Budget" value={`$${form.budget[0]}–$${form.budget[1]}/hr`} />
            </div>
            <div style={{marginTop: 20}}>
              <div className="eyebrow" style={{marginBottom: 10}}>Skills</div>
              <div style={{display: 'flex', flexWrap: 'wrap', gap: 6}}>
                {form.skills.map(s => <span key={s} className="chip chip-accent">{s}</span>)}
              </div>
            </div>
          </div>
        )}

        {step > 1 && (
          <div style={{marginTop: 24}}>
            <button className="btn btn-quiet" onClick={() => setStep(step - 1)}>← Back</button>
          </div>
        )}
      </div>
    </>
  );
}

window.ClientApp = ClientApp;
window.ClientApp_Sections = { SectionHead, InlineStat, ActionRow };
