// Matches page — single top pick with alternates below (matching_moment).
// Plus 3 layout variants driven by the matchVariant tweak: 'hero' | 'dossier' | 'stack'.

const { useState: useS2, useMemo: useM2 } = React;

function MatchesPage({ jobId, go, state }) {
  const { TALENT, JOB_REQUESTS, CATEGORIES } = window.AUTHARIS_DATA;
  const variant = window.TWEAKS.matchVariant || 'hero';
  const job = JOB_REQUESTS.find(j => j.id === jobId) || JOB_REQUESTS[0];
  const ranked = useM2(() => [...TALENT].sort((a, b) => b.score - a.score), []);
  const top = ranked[0];
  const rest = ranked.slice(1, 5);
  const [accepted, setAccepted] = useS2(false);
  const [, bumpVariant] = useS2(0);

  return (
    <>
      <header className="page-head">
        <div>
          <div className="breadcrumbs">
            <span onClick={() => go({ name: 'requests' })} style={{cursor:'pointer'}}>Job requests</span>
            <Icons.ChevR size={10} />
            <span>{job.title}</span>
          </div>
          <h1>Your top match</h1>
          <p>A focused shortlist based on skills, availability, rate fit, timezone, and industry familiarity. One clear pick, alternates below.</p>
        </div>
        <div style={{display: 'flex', gap: 10}}>
          <div className="segmented">
            <button data-active={variant==='hero'} onClick={() => { window.TWEAKS.matchVariant='hero'; persistTweaks(); bumpVariant(v => v + 1); }}>Editorial</button>
            <button data-active={variant==='dossier'} onClick={() => { window.TWEAKS.matchVariant='dossier'; persistTweaks(); bumpVariant(v => v + 1); }}>Dossier</button>
            <button data-active={variant==='stack'} onClick={() => { window.TWEAKS.matchVariant='stack'; persistTweaks(); bumpVariant(v => v + 1); }}>Stack</button>
          </div>
          <button className="btn btn-ghost"><Icons.Filter size={13}/> Adjust filters</button>
        </div>
      </header>

      <div className="content-pad" style={{display:'flex', flexDirection:'column', gap: 28}}>
        {variant === 'hero' && <MatchHero talent={top} job={job} accepted={accepted} setAccepted={setAccepted} />}
        {variant === 'dossier' && <MatchDossier talent={top} job={job} accepted={accepted} setAccepted={setAccepted} />}
        {variant === 'stack' && <MatchStack talent={top} job={job} accepted={accepted} setAccepted={setAccepted} />}

        <section>
          <div style={{display:'flex', alignItems:'baseline', justifyContent:'space-between', marginBottom: 12}}>
            <h2 style={{fontFamily:'var(--font-display)', fontSize: 20, fontWeight: 500, margin:0, letterSpacing:'-0.01em'}}>Alternates</h2>
            <span style={{color:'var(--ink-3)', fontSize: 12}}>Ranked by fit score. Click to compare.</span>
          </div>
          <div style={{display:'flex', flexDirection:'column', gap: 10}}>
            {rest.map(t => <AltRow key={t.id} talent={t} />)}
          </div>
        </section>
      </div>
    </>
  );
}

function persistTweaks() {
  window.parent.postMessage({ type: '__edit_mode_set_keys', edits: { matchVariant: window.TWEAKS.matchVariant } }, '*');
}

/* Variant A — EDITORIAL (default): large card with photo/monogram panel, body, score ring */
function MatchHero({ talent, job, accepted, setAccepted }) {
  return (
    <div className="match-hero">
      <div className="match-hero-photo">
        <div>
          <div className="avatar avatar-xl" style={{background: 'var(--bg-raised)', color: 'var(--ink)', fontFamily: 'var(--font-display)', fontWeight: 500}}>
            {talent.initials}
          </div>
          <div style={{marginTop: 14, fontFamily:'var(--font-display)', fontSize: 24, fontWeight: 500, letterSpacing:'-0.01em'}}>
            {talent.name}
          </div>
          <div style={{color:'var(--ink-3)', fontSize: 13, marginTop: 2}}>{talent.city} · {talent.yearsExp} yrs</div>
        </div>
      </div>
      <div className="match-hero-body">
        <div style={{display:'flex', alignItems:'center', gap: 10, marginBottom: 14}}>
          <span className="badge badge-accent">Top pick</span>
          <span className="eyebrow">{talent.title}</span>
        </div>
        <p style={{fontFamily:'var(--font-display)', fontSize: 22, lineHeight: 1.4, fontStyle:'italic', fontWeight: 400, color:'var(--ink-2)', margin:'0 0 20px', textWrap:'balance'}}>
          &ldquo;{talent.bio}&rdquo;
        </p>
        <div style={{display:'flex', flexWrap:'wrap', gap: 6, marginBottom: 22}}>
          {talent.skills.map(s => {
            const overlap = job.skills && job.skills.includes(s);
            return <span key={s} className={'chip ' + (overlap ? 'chip-accent' : '')}>{s}</span>;
          })}
        </div>
        <div style={{borderTop:'1px solid var(--line-soft)', paddingTop: 16}}>
          <div className="eyebrow" style={{marginBottom: 10}}>Why this match</div>
          {Object.entries(talent.breakdown).map(([label, val]) => {
            const max = { 'Work category': 30, 'Skill overlap': 30, 'Availability': 15, 'Rate fit': 10, 'Timezone': 10, 'Industry familiarity': 5 }[label];
            return (
              <div className="progress-row" key={label}>
                <span className="label">{label}</span>
                <span className="progress-bar"><span style={{ width: `${(val/max)*100}%` }} /></span>
                <span className="val">{val}/{max}</span>
              </div>
            );
          })}
        </div>
      </div>
      <div className="match-hero-side">
        <div className="score-ring" style={{'--p': talent.score, marginLeft:'auto', marginRight:'auto'}}>
          <span className="score-ring-value">{talent.score}</span>
        </div>
        <div style={{textAlign:'center', marginTop: 10, fontFamily:'var(--font-mono)', fontSize: 10, letterSpacing:'0.14em', textTransform:'uppercase', color:'var(--ink-3)'}}>Fit score</div>
        <hr className="hr" style={{margin:'20px 0'}}/>
        <SideStat label="Rate" value={`$${talent.rate}/hr`} />
        <SideStat label="Available" value={talent.availability} />
        <SideStat label="Timezone" value={talent.timezone} />
        <SideStat label="Industries" value={talent.industries.join(', ')} />
        <div style={{display:'flex', flexDirection:'column', gap: 8, marginTop: 20}}>
          {!accepted ? (
            <>
              <button className="btn btn-accent" onClick={() => setAccepted(true)}>Start engagement <Icons.Arrow size={13}/></button>
              <button className="btn btn-ghost btn-sm">Request intro call</button>
              <button className="btn btn-quiet btn-sm">Pass on this match</button>
            </>
          ) : (
            <div style={{padding: 16, background: 'var(--accent-soft)', border: '1px solid var(--accent-line)', borderRadius: 'var(--r-sm)', textAlign:'center'}}>
              <Icons.Check size={18} stroke={2} />
              <div style={{fontFamily:'var(--font-display)', fontSize: 16, marginTop: 4}}>Engagement created</div>
              <div style={{fontSize: 12, color:'var(--ink-3)', marginTop: 4}}>We&rsquo;ll email the onboarding packet.</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SideStat({ label, value }) {
  return (
    <div style={{display:'flex', justifyContent:'space-between', padding: '8px 0', borderBottom: '1px dashed var(--line)'}}>
      <span style={{fontSize: 11, color:'var(--ink-3)', fontFamily:'var(--font-mono)', textTransform:'uppercase', letterSpacing:'0.1em'}}>{label}</span>
      <span style={{fontSize: 13, color:'var(--ink)'}}>{value}</span>
    </div>
  );
}

/* Variant B — DOSSIER: document-style layout with margin notes */
function MatchDossier({ talent, job, accepted, setAccepted }) {
  return (
    <div style={{background:'var(--bg-raised)', border:'1px solid var(--line)', borderRadius:'var(--r-md)', padding: 48, maxWidth: 1040}}>
      <div style={{display:'grid', gridTemplateColumns: '200px 1fr', gap: 48}}>
        <aside>
          <div className="eyebrow" style={{marginBottom: 8}}>File · 001</div>
          <div className="score-ring" style={{'--p': talent.score}}><span className="score-ring-value">{talent.score}</span></div>
          <div style={{fontFamily:'var(--font-mono)', fontSize: 10, textTransform:'uppercase', letterSpacing:'0.14em', color:'var(--ink-3)', marginTop: 10}}>Fit score</div>
          <div style={{marginTop: 28, display:'flex', flexDirection:'column', gap: 8, fontSize: 12, color:'var(--ink-2)'}}>
            <div><span style={{color:'var(--ink-3)'}}>Rate · </span>${talent.rate}/hr</div>
            <div><span style={{color:'var(--ink-3)'}}>Avail · </span>{talent.availability}</div>
            <div><span style={{color:'var(--ink-3)'}}>Zone · </span>{talent.timezone}</div>
            <div><span style={{color:'var(--ink-3)'}}>Exp · </span>{talent.yearsExp} years</div>
          </div>
        </aside>
        <div>
          <div className="eyebrow" style={{marginBottom: 12}}>Top pick · {job.title}</div>
          <h2 style={{fontFamily:'var(--font-display)', fontSize: 44, fontWeight: 400, letterSpacing:'-0.02em', lineHeight: 1.05, margin:'0 0 6px'}}>{talent.name}</h2>
          <div style={{fontSize: 14, color:'var(--ink-3)', marginBottom: 28}}>{talent.title} · {talent.city}</div>
          <p style={{fontSize: 15, lineHeight: 1.65, color:'var(--ink-2)', margin:'0 0 28px', maxWidth: '56ch'}}>{talent.bio}</p>
          <div style={{display:'flex', flexWrap:'wrap', gap: 6, marginBottom: 28}}>
            {talent.skills.map(s => {
              const overlap = job.skills && job.skills.includes(s);
              return <span key={s} className={'chip ' + (overlap ? 'chip-accent' : '')}>{s}</span>;
            })}
          </div>
          <div style={{borderTop:'1px solid var(--line-soft)', paddingTop: 20, display:'grid', gridTemplateColumns:'1fr 1fr', gap:'4px 32px'}}>
            {Object.entries(talent.breakdown).map(([label, val]) => {
              const max = { 'Work category': 30, 'Skill overlap': 30, 'Availability': 15, 'Rate fit': 10, 'Timezone': 10, 'Industry familiarity': 5 }[label];
              return (
                <div className="progress-row" key={label} style={{gridTemplateColumns:'130px 1fr 40px'}}>
                  <span className="label">{label}</span>
                  <span className="progress-bar"><span style={{ width: `${(val/max)*100}%` }} /></span>
                  <span className="val">{val}/{max}</span>
                </div>
              );
            })}
          </div>
          <div style={{display:'flex', gap: 10, marginTop: 32}}>
            {!accepted ? (
              <>
                <button className="btn btn-accent btn-lg" onClick={() => setAccepted(true)}>Start engagement <Icons.Arrow size={14}/></button>
                <button className="btn btn-ghost btn-lg">Request intro call</button>
                <button className="btn btn-quiet">Pass</button>
              </>
            ) : (
              <div className="badge badge-accent">Engagement created</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* Variant C — STACK: compact horizontal strip, emphasizes comparison-ready */
function MatchStack({ talent, job, accepted, setAccepted }) {
  return (
    <div style={{
      display:'grid', gridTemplateColumns: '1fr 360px', gap: 24
    }}>
      <div className="paper" style={{padding: 28}}>
        <div style={{display:'flex', gap: 20, alignItems:'flex-start'}}>
          <div className="avatar avatar-xl" style={{fontFamily: 'var(--font-display)', fontWeight: 500, background:'var(--accent-soft)', color:'var(--ink)', border:'1px solid var(--accent-line)'}}>{talent.initials}</div>
          <div style={{flex: 1}}>
            <div className="badge badge-accent" style={{marginBottom: 10}}>Top pick · {talent.score} fit</div>
            <div style={{fontFamily:'var(--font-display)', fontSize: 30, fontWeight: 500, letterSpacing:'-0.02em'}}>{talent.name}</div>
            <div style={{fontSize: 13, color:'var(--ink-3)', marginTop: 4}}>{talent.title} · {talent.city} · ${talent.rate}/hr</div>
          </div>
        </div>
        <p style={{fontSize: 14, lineHeight: 1.6, color:'var(--ink-2)', margin:'22px 0'}}>{talent.bio}</p>
        <div style={{display:'flex', flexWrap:'wrap', gap: 6, marginBottom: 22}}>
          {talent.skills.map(s => {
            const overlap = job.skills && job.skills.includes(s);
            return <span key={s} className={'chip ' + (overlap ? 'chip-accent' : '')}>{s}</span>;
          })}
        </div>
        <div style={{display:'flex', gap: 10}}>
          {!accepted ? (
            <>
              <button className="btn btn-accent" onClick={() => setAccepted(true)}>Start engagement</button>
              <button className="btn btn-ghost">Request intro</button>
              <button className="btn btn-quiet">Pass</button>
            </>
          ) : <div className="badge badge-accent">Engagement created</div>}
        </div>
      </div>
      <div className="paper" style={{padding: 22}}>
        <div className="eyebrow" style={{marginBottom: 12}}>Score breakdown</div>
        {Object.entries(talent.breakdown).map(([label, val]) => {
          const max = { 'Work category': 30, 'Skill overlap': 30, 'Availability': 15, 'Rate fit': 10, 'Timezone': 10, 'Industry familiarity': 5 }[label];
          return (
            <div className="progress-row" key={label} style={{gridTemplateColumns:'110px 1fr 40px'}}>
              <span className="label">{label}</span>
              <span className="progress-bar"><span style={{ width: `${(val/max)*100}%` }} /></span>
              <span className="val">{val}/{max}</span>
            </div>
          );
        })}
        <hr className="hr" style={{margin: '16px 0'}}/>
        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap: 10, fontSize: 12, color:'var(--ink-2)'}}>
          <div><span style={{color:'var(--ink-3)'}}>Avail · </span>{talent.availability}</div>
          <div><span style={{color:'var(--ink-3)'}}>Zone · </span>{talent.timezone}</div>
          <div><span style={{color:'var(--ink-3)'}}>Exp · </span>{talent.yearsExp} yrs</div>
          <div><span style={{color:'var(--ink-3)'}}>Industry · </span>{talent.industries[0]}</div>
        </div>
      </div>
    </div>
  );
}

function AltRow({ talent }) {
  return (
    <div className="match-alt">
      <div className="avatar" style={{background:'var(--bg-sunken)', fontFamily:'var(--font-display)', fontWeight: 500}}>{talent.initials}</div>
      <div>
        <div className="match-alt-name">{talent.name}</div>
        <div className="match-alt-meta">{talent.title} · {talent.city}</div>
      </div>
      <div style={{fontSize: 13, color:'var(--ink-2)'}}>${talent.rate}/hr</div>
      <div style={{fontSize: 13, color:'var(--ink-2)'}}>{talent.availability.split(' ')[0]} hrs</div>
      <div style={{fontSize: 13, color:'var(--ink-2)'}}>{talent.timezone}</div>
      <div style={{display:'flex', alignItems:'center', gap: 10, justifyContent:'flex-end'}}>
        <div className="score-ring-sm" style={{'--p': talent.score}}>
          <span className="score-ring-sm-value">{talent.score}</span>
        </div>
        <Icons.ChevR size={14} />
      </div>
    </div>
  );
}

/* ——— Engagements ——— */
function EngagementsPage({ go }) {
  const { ENGAGEMENTS } = window.AUTHARIS_DATA;
  return (
    <>
      <header className="page-head">
        <div>
          <div className="breadcrumbs"><span>Cedar Health Co-op</span> <Icons.ChevR size={10} /> <span>Engagements</span></div>
          <h1>Active engagements</h1>
          <p>Every accepted match becomes an engagement — the parent record for timesheets and invoices.</p>
        </div>
      </header>
      <div className="content-pad">
        <div style={{display:'flex', flexDirection:'column', gap: 16}}>
          {ENGAGEMENTS.map(e => (
            <div key={e.id} className="paper" style={{padding: 24, display:'grid', gridTemplateColumns:'1fr 1fr 1fr auto', gap: 24, alignItems:'center'}}>
              <div>
                <div className="eyebrow" style={{marginBottom: 4}}>{e.id}</div>
                <div style={{fontFamily:'var(--font-display)', fontSize: 19, letterSpacing:'-0.01em'}}>{e.jobTitle}</div>
                <div style={{fontSize: 12, color:'var(--ink-3)', marginTop: 2}}>Started {e.started}</div>
              </div>
              <div>
                <InlineStat label="Talent" value={e.talentName} />
                <div style={{marginTop: 8}}><InlineStat label="Rate" value={`$${e.rate}/hr`}/></div>
              </div>
              <div>
                <InlineStat label="Approved" value={`${e.hoursApproved} hrs`} />
                <div style={{marginTop: 8}}><InlineStat label="This week" value={`${e.hoursThisWeek} hrs`}/></div>
              </div>
              <div style={{display:'flex', flexDirection:'column', gap:8, alignItems:'flex-end'}}>
                <span className="status status-active">Active</span>
                <button className="btn btn-ghost btn-sm" onClick={() => go({ name: 'timesheets' })}>Review hours</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
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

/* ——— Timesheet approval ——— */
function TimesheetsApproval({ state, setState }) {
  const { TIMESHEETS } = window.AUTHARIS_DATA;
  const [selectedId, setSelectedId] = useS2(state.approvedIds ? null : TIMESHEETS[0].id);
  const approved = new Set(state.approvedIds || []);
  const rejected = new Set(state.rejectedIds || []);
  const selected = TIMESHEETS.find(t => t.id === selectedId);

  const approve = (id) => setState({ ...state, approvedIds: [...approved, id] });
  const reject  = (id) => setState({ ...state, rejectedIds: [...rejected, id] });

  const statusOf = (id, base) => approved.has(id) ? 'Approved' : rejected.has(id) ? 'Rejected' : base;

  return (
    <>
      <header className="page-head">
        <div>
          <div className="breadcrumbs"><span>Cedar Health Co-op</span> <Icons.ChevR size={10}/> <span>Timesheets</span></div>
          <h1>Approve hours</h1>
          <p>Invoices are generated only from approved timesheets. Full audit trail preserved.</p>
        </div>
      </header>

      <div style={{display:'grid', gridTemplateColumns: '340px 1fr', height:'calc(100vh - 34px - 130px)'}}>
        <div style={{borderRight:'1px solid var(--line)', overflowY:'auto'}}>
          {TIMESHEETS.map(t => {
            const st = statusOf(t.id, t.status);
            return (
              <div key={t.id} onClick={() => setSelectedId(t.id)} style={{
                padding:'16px 20px',
                borderBottom:'1px solid var(--line-soft)',
                cursor:'pointer',
                background: selectedId === t.id ? 'var(--bg-sunken)' : 'transparent',
              }}>
                <div style={{display:'flex', justifyContent:'space-between', marginBottom: 4}}>
                  <div style={{fontSize: 14, color:'var(--ink)'}}>{t.talentName}</div>
                  <span className={'status ' + (st === 'Approved' ? 'status-active' : st === 'Rejected' ? 'status-neg' : 'status-pending')}>{st}</span>
                </div>
                <div style={{fontSize: 12, color:'var(--ink-3)'}}>{t.engagementTitle}</div>
                <div style={{display:'flex', justifyContent:'space-between', marginTop: 8, fontFamily:'var(--font-mono)', fontSize: 11, color:'var(--ink-3)'}}>
                  <span>{t.weekOf}</span>
                  <span>{t.hours} hrs</span>
                </div>
              </div>
            );
          })}
        </div>

        {selected && (
          <div style={{overflowY:'auto', padding: '32px 40px'}}>
            <div style={{display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom: 24}}>
              <div>
                <div className="eyebrow" style={{marginBottom: 6}}>Timesheet · {selected.weekOf}</div>
                <h2 style={{fontFamily:'var(--font-display)', fontSize: 28, fontWeight: 400, letterSpacing:'-0.02em', margin: 0}}>{selected.engagementTitle}</h2>
                <div style={{color:'var(--ink-3)', fontSize: 13, marginTop: 6}}>{selected.talentName} · submitted {selected.submitted}</div>
              </div>
              <div style={{textAlign:'right'}}>
                <div style={{fontFamily:'var(--font-mono)', fontSize: 10, textTransform:'uppercase', letterSpacing:'0.12em', color:'var(--ink-3)'}}>Subtotal</div>
                <div style={{fontFamily:'var(--font-display)', fontSize: 36, fontWeight: 400, letterSpacing:'-0.02em'}}>${(selected.hours * selected.rate).toLocaleString()}</div>
                <div style={{color:'var(--ink-3)', fontSize: 12}}>{selected.hours} hrs × ${selected.rate}/hr</div>
              </div>
            </div>

            <div className="paper" style={{overflow:'hidden'}}>
              <div className="timesheet-row head">
                <span>Day</span>
                <span>Notes</span>
                <span style={{textAlign:'right'}}>Hours</span>
                <span></span>
              </div>
              {selected.entries.length === 0 && (
                <div style={{padding: '24px', color:'var(--ink-3)', fontSize: 13}}>Already approved · no editable entries.</div>
              )}
              {selected.entries.map((e, i) => (
                <div className="timesheet-row" key={i}>
                  <span style={{fontFamily:'var(--font-mono)', fontSize: 12, color:'var(--ink-2)'}}>{e.day}</span>
                  <span style={{color:'var(--ink-2)'}}>{e.note}</span>
                  <span style={{textAlign:'right', fontFamily:'var(--font-mono)'}}>{e.hours.toFixed(1)}</span>
                  <span></span>
                </div>
              ))}
              <div className="timesheet-row" style={{background:'var(--bg-sunken)', fontWeight: 500}}>
                <span></span>
                <span style={{fontFamily:'var(--font-mono)', fontSize: 11, textTransform:'uppercase', letterSpacing:'0.1em', color:'var(--ink-3)'}}>Total</span>
                <span style={{textAlign:'right', fontFamily:'var(--font-mono)'}}>{selected.hours.toFixed(1)}</span>
                <span></span>
              </div>
            </div>

            <div style={{display:'flex', gap: 12, marginTop: 24}}>
              {statusOf(selected.id, selected.status) === 'Submitted' ? (
                <>
                  <button className="btn btn-accent btn-lg" onClick={() => approve(selected.id)}>
                    <Icons.Check size={14} stroke={2}/> Approve {selected.hours} hrs
                  </button>
                  <button className="btn btn-ghost btn-lg" onClick={() => reject(selected.id)}>Reject with reason</button>
                  <button className="btn btn-quiet">Request adjustment</button>
                </>
              ) : (
                <div className="badge badge-accent" style={{padding:'8px 14px', fontSize: 11}}>
                  {statusOf(selected.id, selected.status)} · invoice {approved.has(selected.id) ? 'queued' : 'held'}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}

/* ——— Invoices ——— */
function InvoicesPage({ state }) {
  const { INVOICES } = window.AUTHARIS_DATA;
  const [openId, setOpenId] = useS2(null);
  const open = INVOICES.find(i => i.id === openId);

  return (
    <>
      <header className="page-head">
        <div>
          <div className="breadcrumbs"><span>Cedar Health Co-op</span> <Icons.ChevR size={10}/><span>Invoices</span></div>
          <h1>Invoices</h1>
          <p>Generated from approved timesheets. Platform fee, subtotal, and total computed transparently.</p>
        </div>
        <div style={{display:'flex', gap: 10}}>
          <button className="btn btn-ghost"><Icons.ArrowDL size={13}/> Export CSV</button>
          <button className="btn btn-ghost">All engagements</button>
        </div>
      </header>

      <div className="content-pad">
        <div style={{border:'1px solid var(--line)', borderRadius:'var(--r-md)', overflow:'hidden', background:'var(--bg-raised)'}}>
          <table className="table">
            <thead><tr><th>Invoice</th><th>Engagement</th><th>Period</th><th>Hours</th><th>Total</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {INVOICES.map(i => (
                <tr key={i.id} className="clickable" onClick={() => setOpenId(i.id)}>
                  <td style={{fontFamily:'var(--font-mono)', fontSize: 12}}>{i.id}</td>
                  <td>{i.client}</td>
                  <td>{i.period}</td>
                  <td>{i.hours}</td>
                  <td style={{fontFamily:'var(--font-mono)'}}>${i.total.toFixed(2)}</td>
                  <td><span className="status status-paid">{i.status}</span></td>
                  <td><Icons.ChevR size={14}/></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {open && (
          <div style={{position:'fixed', inset: 0, background:'rgba(26,24,20,0.4)', display:'flex', alignItems:'center', justifyContent:'center', zIndex: 70}} onClick={() => setOpenId(null)}>
            <div className="invoice-doc" onClick={e => e.stopPropagation()}>
              <div style={{display:'flex', justifyContent:'space-between', marginBottom: 32}}>
                <div>
                  <div style={{fontFamily:'var(--font-display)', fontSize: 22, letterSpacing:'-0.01em'}}>Autharis</div>
                  <div style={{fontSize: 11, color:'var(--ink-3)'}}>Invoice</div>
                </div>
                <div style={{textAlign:'right'}}>
                  <div style={{fontFamily:'var(--font-mono)', fontSize: 12}}>{open.id}</div>
                  <div style={{fontSize: 11, color:'var(--ink-3)', marginTop: 2}}>Issued {open.date}</div>
                </div>
              </div>
              <dl className="invoice-grid">
                <div><dt>Bill to</dt><dd>{open.client}<br/><span style={{color:'var(--ink-3)'}}>billing@cedarhealth.co</span></dd></div>
                <div><dt>Period</dt><dd>{open.period}</dd></div>
                <div><dt>Engagement</dt><dd>{open.engagement}</dd></div>
                <div><dt>Status</dt><dd><span className="status status-paid">{open.status}</span></dd></div>
              </dl>
              <table className="table" style={{border:'1px solid var(--line)'}}>
                <thead><tr><th>Description</th><th>Hours</th><th>Rate</th><th style={{textAlign:'right'}}>Amount</th></tr></thead>
                <tbody>
                  <tr><td>Approved hours · {open.period}</td><td>{open.hours}</td><td>${open.rate}/hr</td><td style={{textAlign:'right', fontFamily:'var(--font-mono)'}}>${open.subtotal.toFixed(2)}</td></tr>
                  <tr><td colSpan={3} style={{textAlign:'right', color:'var(--ink-3)'}}>Platform fee (10%)</td><td style={{textAlign:'right', fontFamily:'var(--font-mono)'}}>${open.fee.toFixed(2)}</td></tr>
                  <tr><td colSpan={3} style={{textAlign:'right', fontFamily:'var(--font-display)', fontSize: 16}}>Total due</td><td style={{textAlign:'right', fontFamily:'var(--font-mono)', fontSize: 16}}>${open.total.toFixed(2)}</td></tr>
                </tbody>
              </table>
              <div style={{display:'flex', justifyContent:'space-between', marginTop: 28}}>
                <button className="btn btn-ghost btn-sm" onClick={() => setOpenId(null)}>Close</button>
                <button className="btn btn-primary btn-sm"><Icons.ArrowDL size={12}/> Download PDF</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

window.MatchesPage = MatchesPage;
window.EngagementsPage = EngagementsPage;
window.TimesheetsApproval = TimesheetsApproval;
window.InvoicesPage = InvoicesPage;
