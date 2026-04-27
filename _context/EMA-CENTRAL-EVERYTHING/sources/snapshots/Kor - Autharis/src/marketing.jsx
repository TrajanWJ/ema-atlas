// Marketing homepage — v2, stronger branding, color-blocked hero,
// physical timecard illustration, bolder typography.

const { useState } = React;

// Hero copy variants — switchable live from the Tweaks panel
const HERO_COPY = {
  editorial: {
    eyebrow: 'The human layer · Est. 2026',
    headline: ['Remote hourly talent for the work ', 'AI can’t do alone.'],
    lead: 'Autharis connects businesses with vetted remote professionals for short-term, hourly work across operations, customer service, coordination, research, and AI-related workflows. Pay only for approved hours.',
    cta: 'Find talent →',
    alt: 'Join as talent',
    support: '— For teams that need capable humans, not just another tool.',
  },
  punchy: {
    eyebrow: 'Humans. On demand.',
    headline: ['The AI can handle the rest. ', 'We handle the rest.'],
    lead: 'Spin up vetted remote operators in days, not quarters. Hourly billing, approved-only pay, zero procurement theatre.',
    cta: 'Get operators →',
    alt: 'Work with us',
    support: '— Built for teams moving faster than their org chart.',
  },
  serious: {
    eyebrow: 'Operator network · For regulated & complex ops',
    headline: ['A remote workforce for the work that ', 'still requires judgment.'],
    lead: 'Autharis places experienced operators into your workflows — clinical outreach, case coordination, customer recovery, human review on automated pipelines. Billed hourly, audited, and reviewable before payment.',
    cta: 'Request operators',
    alt: 'Apply to the network',
    support: '— Trusted by regulated teams in healthcare, finance, and public services.',
  },
  warm: {
    eyebrow: 'Remote work · Made human',
    headline: ['Meet the people behind ', 'the work that gets done.'],
    lead: 'Autharis is a community of remote professionals ready to plug into your team. Flexible hours, real context, paid only for approved work. Your next best hire, without the hire.',
    cta: 'Browse talent',
    alt: 'Become a pro',
    support: '— A marketplace built on trust, not resumes.',
  },
};

function Wordmark({ size = 'md' }) {
  const fs = size === 'lg' ? 28 : size === 'sm' ? 18 : 22;
  const gs = size === 'lg' ? 32 : size === 'sm' ? 20 : 26;
  return (
    <div className="wordmark" style={{fontSize: fs}}>
      <span className="wordmark-glyph" style={{width: gs, height: gs}}>
        <svg viewBox="0 0 32 32" width={gs} height={gs}>
          <rect x="0" y="0" width="32" height="32" rx="4" fill="var(--brand-ink)"/>
          {/* Clock-hand mark + serif A */}
          <circle cx="16" cy="16" r="11" fill="none" stroke="var(--brand-paper)" strokeWidth="1.2"/>
          <path d="M16 16 L16 7" stroke="var(--brand-terra)" strokeWidth="2" strokeLinecap="round"/>
          <path d="M16 16 L22 19" stroke="var(--brand-paper)" strokeWidth="1.6" strokeLinecap="round"/>
          <circle cx="16" cy="16" r="1.6" fill="var(--brand-paper)"/>
        </svg>
      </span>
      <span>Autharis</span>
    </div>
  );
}

function MarketingPage({ onGoToClient, onGoToTalent }) {
  const tw = (typeof window !== 'undefined' && window.TWEAKS) || {};
  const copy = HERO_COPY[tw.copyVariant] || HERO_COPY.editorial;
  return (
    <div className="mk-scroll">
      <nav className="mk-nav">
        <Wordmark />
        <div className="mk-nav-links">
          <a>How it works</a>
          <a>For businesses</a>
          <a>For talent</a>
          <a>AI teams</a>
          <a>Pricing</a>
        </div>
        <div className="spacer" />
        <button className="btn btn-ghost btn-sm" onClick={onGoToTalent}>{copy.alt}</button>
        <button className="btn btn-accent btn-sm" onClick={onGoToClient}>{copy.cta}</button>
      </nav>

      {/* HERO — two-column, color-blocked */}
      <div className="mk-hero-wrap">
        <div className="mk-hero-left">
          <div className="mk-hero-eyebrow">{copy.eyebrow}</div>
          <h1>
            {copy.headline[0]}<em>{copy.headline[1]}</em>
          </h1>
          <p className="mk-hero-lead">
            {copy.lead}
          </p>
          <div className="mk-cta-row">
            <button className="btn btn-accent btn-xl" onClick={onGoToClient}>
              {copy.cta}
            </button>
            <button className="btn btn-ghost btn-xl" onClick={onGoToTalent}>
              {copy.alt}
            </button>
          </div>
          <p className="mk-support">{copy.support}</p>
        </div>
        <div className="mk-hero-right">
          <div className="timecard">
            <div className="timecard-punch"></div>
            <div className="timecard-punch b2"></div>
            <div className="timecard-punch b3"></div>
            <div className="timecard-stamp">Approved</div>
            <div className="timecard-header">
              <span>№ 00472</span>
              <span>Wk 16 · 2026</span>
            </div>
            <div className="timecard-title">Timesheet — Maya L.</div>
            <div className="timecard-sub">Customer operations · Meridian Health</div>
            <div className="timecard-row"><span>Mon</span><span>Inbox triage + replies</span><span className="hrs">4.0h</span></div>
            <div className="timecard-row"><span>Tue</span><span>Patient outreach calls</span><span className="hrs">3.5h</span></div>
            <div className="timecard-row"><span>Wed</span><span>Case coordination</span><span className="hrs">5.0h</span></div>
            <div className="timecard-row"><span>Thu</span><span>QA on AI triage queue</span><span className="hrs">4.5h</span></div>
            <div className="timecard-row"><span>Fri</span><span>Docs + handoff</span><span className="hrs">3.0h</span></div>
            <div className="timecard-total"><span>TOTAL</span><span>20.0 hrs · $840</span></div>
          </div>
        </div>
      </div>

      {/* Ticker */}
      <div className="mk-ticker">
        <span className="dot"></span><span>Ops backlog cleared</span>
        <span className="dot"></span><span>Patient outreach, 40 hrs / wk</span>
        <span className="dot"></span><span>AI triage QA</span>
        <span className="dot"></span><span>Inbox coverage, transitions</span>
        <span className="dot"></span><span>Pipeline research</span>
        <span className="dot"></span><span>Care coordination</span>
        <span className="dot"></span><span>Human-in-the-loop review</span>
      </div>

      {/* Positioning */}
      <div className="mk">
        <section className="mk-section">
          <div className="mk-section-head">
            <div className="eyebrow">01 / Positioning</div>
            <div>
              <h2>A practical layer between <em>automation</em> and real work.</h2>
              <p>
                Hiring full-time isn&rsquo;t always the right move, and software on its own can&rsquo;t handle every task. Autharis gives you a flexible way to access remote professionals for the work that still needs human judgment, communication, and follow-through — whether or not AI is in the stack.
              </p>
            </div>
          </div>
        </section>
      </div>

      {/* How it works */}
      <div className="mk">
        <section className="mk-section">
          <div className="mk-section-head">
            <div className="eyebrow">02 / How it works</div>
            <div>
              <h2>Three steps. <em>No long procurement.</em></h2>
            </div>
          </div>
          <div className="mk-steps">
            <div className="mk-step">
              <div className="mk-step-num">i · Describe</div>
              <h3>Tell us what needs to get done</h3>
              <p>Describe the work, required skills, expected hours, and any preferred industry background. Move from &ldquo;we&rsquo;re stuck&rdquo; to &ldquo;we have options&rdquo; without friction.</p>
            </div>
            <div className="mk-step">
              <div className="mk-step-num">ii · Match</div>
              <h3>Review matched professionals</h3>
              <p>We surface a focused shortlist based on skills, availability, work preferences, and relevant experience — not generic applications.</p>
            </div>
            <div className="mk-step">
              <div className="mk-step-num">iii · Approve</div>
              <h3>Start work and approve hours</h3>
              <p>Your professional plugs in remotely with clear expectations and simple time tracking. Review and approve hours. Pay for completed work — nothing more.</p>
            </div>
          </div>
        </section>
      </div>

      {/* Two sides */}
      <div className="mk">
        <section className="mk-section">
          <div className="mk-section-head">
            <div className="eyebrow">03 / Both sides</div>
            <div>
              <h2>Real people, exactly where you <em>need them.</em></h2>
            </div>
          </div>
          <div className="mk-two">
            <div className="mk-two-card biz">
              <div className="eyebrow">For businesses</div>
              <h3>Capable humans on call, not on payroll.</h3>
              <p>Clearing a backlog, managing a surge, supporting customers, or running internal projects — add human capacity without a long hiring cycle or a full-time commitment.</p>
              <ul>
                <li>Fill critical gaps without launching a full recruiting process</li>
                <li>Add hourly support across operations, CX, and project work</li>
                <li>Stay flexible as workload changes from week to week</li>
                <li>Pay for approved hours — not fixed fees or retainers</li>
              </ul>
            </div>
            <div className="mk-two-card tal">
              <div className="eyebrow">For talent</div>
              <h3>Turn your experience into flexible remote work.</h3>
              <p>Build a work-ready profile from your existing experience, then match into hourly remote opportunities that fit your skills and schedule.</p>
              <ul>
                <li>Create your profile from your resume in a few steps</li>
                <li>Show what you do today and what you&rsquo;d like to do more of</li>
                <li>Match into paid remote work aligned to your skills</li>
                <li>Take on short-term engagements without rebuilding your career story</li>
              </ul>
            </div>
          </div>
        </section>
      </div>

      {/* Categories */}
      <div className="mk">
        <section className="mk-section">
          <div className="mk-section-head">
            <div className="eyebrow">04 / Service categories</div>
            <div>
              <h2>Flexible support across core business functions.</h2>
              <p>Autharis focuses on the kinds of remote hourly work that benefit most from capable humans — even when AI is in the mix.</p>
            </div>
          </div>
          <div className="mk-categories">
            {[
              ['Admin support', 'Scheduling, inbox and calendar management, document prep, data entry, travel and logistics.'],
              ['Customer support', 'Email and chat support, inbound and outbound comms, account coordination, empathetic follow-up.'],
              ['Operations', 'Project coordination, workflow tracking, vendor follow-up, and the day-to-day support that keeps teams moving.'],
              ['Care coordination', 'Patient, client, or member support roles involving navigation, outreach, intake, and service coordination.'],
              ['Sales & outreach', 'Prospecting, list building, appointment setting, follow-up comms, and pipeline support.'],
              ['Research', 'Market and desk research, light analysis, online research tasks, and administrative project support.'],
            ].map(([title, blurb], i) => (
              <div className="mk-cat" key={title}>
                <span className="mk-cat-num">0{i+1} / 06</span>
                <h4>{title}</h4>
                <p>{blurb}</p>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Pull quote */}
      <div className="mk-pull">
        <div className="mk-pull-inner">
          <div className="eyebrow">05 / The human layer</div>
          <h2>When automation <em>isn&rsquo;t enough.</em></h2>
          <p>
            AI doesn&rsquo;t replace context, judgment, or accountability. Many workflows still need a person to interpret nuance, talk to customers, handle edge cases, review outputs, and decide when something doesn&rsquo;t fit the pattern. Autharis gives you access to professionals who step in exactly where automation stops short.
          </p>
        </div>
      </div>

      {/* Use cases */}
      <div className="mk">
        <section className="mk-section">
          <div className="mk-section-head">
            <div className="eyebrow">06 / Where Autharis fits</div>
            <div>
              <h2>Real work. <em>Not another headcount.</em></h2>
            </div>
          </div>
          <div className="mk-use-cases">
            {[
              'Clearing admin or operations backlog during peak seasons.',
              'Supporting customer communication during growth or team transitions.',
              'Adding project coordination during launches, implementations, or change initiatives.',
              'Extending care, case, or member support without burning out internal teams.',
              'Providing human review, QA, or annotation around AI and automated workflows.',
            ].map((text, i) => (
              <div className="mk-use-case" key={i}>
                <span className="mk-use-case-num">{String(i+1).padStart(2,'0')} / 05</span>
                <div className="mk-use-case-text">{text}</div>
                <span style={{color:'var(--ink-3)'}}>→</span>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Closing */}
      <div className="mk">
        <div className="mk-closing">
          <div className="mk-closing-inner">
            <div className="eyebrow">07 / Get started</div>
            <h2>Put the <em>right people</em> behind the work.</h2>
            <p>Whether you&rsquo;re looking for flexible support or flexible work, Autharis connects real people with the tasks and workflows that still need a human touch.</p>
            <div className="mk-cta-row">
              <button className="btn btn-accent btn-xl" onClick={onGoToClient}>
                Request talent →
              </button>
              <button className="btn btn-xl" style={{background: 'transparent', color: 'var(--brand-paper)', border: '1px solid rgba(242,233,214,0.3)'}} onClick={onGoToTalent}>
                Create your profile
              </button>
            </div>
          </div>
        </div>

        <footer className="mk-footer">
          <span>Autharis — © 2026</span>
          <span>A marketplace for hourly remote work</span>
          <span>hello@autharis.co</span>
        </footer>
      </div>
    </div>
  );
}

window.MarketingPage = MarketingPage;
window.Wordmark = Wordmark;
