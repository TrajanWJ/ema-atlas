'use client';

import Link from 'next/link';
import * as React from 'react';

import { ClientIcons } from '@/components/client/icons';
import {
  CLIENT_CATEGORIES,
  CLIENT_ENGAGEMENTS,
  CLIENT_INVOICES,
  CLIENT_JOB_REQUESTS,
  CLIENT_MATCH_VARIANTS,
  CLIENT_SKILLS,
  CLIENT_TIMESHEETS,
  MatchVariant,
  MATCH_BREAKDOWN_MAX,
  type ClientSkill,
  getCategoryLabel,
  getClientJobRequest,
  getDashboardSummary,
  getRankedTalent,
} from '@/lib/client/data';

type MatchProps = {
  accepted: boolean;
  jobId: string;
  onAccept: () => void;
  variant: MatchVariant;
};

export function DashboardScreen() {
  const summary = getDashboardSummary();

  return (
    <>
      <header className="client-pagehead">
        <div>
          <div className="client-breadcrumbs">
            <span>Cedar Health Co-op</span>
            <ClientIcons.ChevronRight size={10} />
            <span>Overview</span>
          </div>
          <h1>Good morning, Maya.</h1>
          <p>
            You have <strong>{summary.pendingTimesheets} timesheets</strong> waiting for approval and{' '}
            <strong>{summary.matchReady} new matches</strong> on your active requests.
          </p>
        </div>

        <div className="client-actions">
          <button className="client-btn client-btn--ghost" type="button">
            Invite teammate
          </button>
          <Link className="client-btn client-btn--primary" href="/client/requests/new">
            <ClientIcons.Plus size={14} />
            <span>New request</span>
          </Link>
        </div>
      </header>

      <div className="client-content">
        <section className="client-kpis">
          <MetricCard label="Hours this week" value={summary.thisWeekHours.toFixed(1)} note="+4.5 vs last week" noteTone="positive" />
          <MetricCard label="Pending approval" value={`${summary.pendingTimesheets}`} note="2 engagements" />
          <MetricCard label="Open requests" value={`${summary.openRequests}`} note="1 shortlist ready" noteTone="positive" />
          <MetricCard label="Spend - April" value={`$${summary.currentSpend.toFixed(0)}`} note="Paid in full" />
        </section>

        <section className="client-section">
          <SectionHead hint="Four items. Tackle in order." title="Needs your attention" />
          <div className="client-stack">
            <ActionRow
              cta="Review shortlist"
              href="/client/matches/jr-002"
              meta="3 candidates · top pick: Jakob Lindqvist (78)"
              tag="Match ready"
              title="AI support review - overflow QA · Lumen AI"
            />
            <ActionRow
              cta="Approve hours"
              href="/client/timesheets"
              meta="Cedar Health Co-op · submitted Sat 21:42"
              tag="Timesheet"
              title="Amara Okafor · 18.5 hrs · Apr 13 - 19"
            />
            <ActionRow
              cta="Approve hours"
              href="/client/timesheets"
              meta="Lumen AI · submitted Sat 18:05"
              tag="Timesheet"
              title="Jakob Lindqvist · 12 hrs · Apr 13 - 19"
            />
            <ActionRow
              cta="Finish and publish"
              href="/client/requests/new"
              meta="Saved as draft · last edit 2 days ago"
              tag="Draft"
              title="EA coverage - founder, 20 hrs/wk"
            />
          </div>
        </section>

        <section className="client-section">
          <SectionHead hint="2 in flight." title="Active engagements" />
          <div className="client-grid client-grid--two">
            {CLIENT_ENGAGEMENTS.map((engagement) => (
              <article className="client-panel client-panel--engagement" key={engagement.id}>
                <div className="client-panel__header">
                  <div>
                    <div className="client-eyebrow">{engagement.client}</div>
                    <h3>{engagement.jobTitle}</h3>
                  </div>
                  <span className="client-status client-status--active">Active</span>
                </div>
                <dl className="client-inline-stats">
                  <StatPair label="Talent" value={engagement.talentName} />
                  <StatPair label="Rate" value={`$${engagement.rate}/hr`} />
                  <StatPair label="This week" value={`${engagement.hoursThisWeek} hrs`} />
                  <StatPair label="Approved" value={`${engagement.hoursApproved} hrs`} />
                </dl>
              </article>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}

export function RequestsScreen() {
  const [filter, setFilter] = React.useState<'all' | 'Draft' | 'Reviewing' | 'Matched' | 'Shortlist ready'>('all');
  const rows =
    filter === 'all' ? CLIENT_JOB_REQUESTS : CLIENT_JOB_REQUESTS.filter((request) => request.status === filter);

  return (
    <>
      <header className="client-pagehead">
        <div>
          <div className="client-breadcrumbs">
            <span>Cedar Health Co-op</span>
            <ClientIcons.ChevronRight size={10} />
            <span>Job requests</span>
          </div>
          <h1>Job requests</h1>
          <p>Post structured requests. Autharis will surface a shortlist, usually within a day.</p>
        </div>

        <div className="client-actions">
          <div className="client-segmented" role="tablist" aria-label="Request filter">
            {(['all', 'Draft', 'Reviewing', 'Shortlist ready', 'Matched'] as const).map((value) => (
              <button
                aria-pressed={filter === value}
                data-active={filter === value ? 'true' : 'false'}
                key={value}
                onClick={() => setFilter(value)}
                type="button"
              >
                {value === 'all' ? 'All' : value}
              </button>
            ))}
          </div>

          <Link className="client-btn client-btn--primary" href="/client/requests/new">
            <ClientIcons.Plus size={14} />
            <span>New request</span>
          </Link>
        </div>
      </header>

      <div className="client-content">
        <div className="client-table-wrap">
          <table className="client-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Category</th>
                <th>Hours</th>
                <th>Budget</th>
                <th>Matches</th>
                <th>Status</th>
                <th aria-hidden="true"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((request) => (
                <tr key={request.id}>
                  <td>
                    <div className="client-table__primary">{request.title}</div>
                    <div className="client-table__secondary">
                      Posted {request.posted} · {request.duration}
                    </div>
                  </td>
                  <td>
                    <span className="client-chip">{getCategoryLabel(request.category)}</span>
                  </td>
                  <td>{request.hoursPerWeek} / wk</td>
                  <td>
                    ${request.budget[0]}-${request.budget[1]}
                  </td>
                  <td>{request.matches || '-'}</td>
                  <td>
                    <span className={`client-status ${statusTone(request.status)}`}>{request.status}</span>
                  </td>
                  <td className="client-table__action">
                    <Link className="client-inline-link" href={`/client/matches/${request.id}`}>
                      <span>Open</span>
                      <ClientIcons.ChevronRight size={14} />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

export function NewRequestScreen() {
  const [step, setStep] = React.useState(1);
  const [form, setForm] = React.useState({
    title: '',
    category: 'care',
    description: '',
    hoursPerWeek: 20,
    duration: '3 months',
    timezone: 'GMT +/- 3',
    budget: [40, 55] as [number, number],
    skills: ['Care Coordination', 'Intake'] as string[],
    industry: 'Healthcare',
  });

  const update = (patch: Partial<typeof form>) => {
    setForm((current) => ({ ...current, ...patch }));
  };

  const toggleSkill = (skill: string) => {
    setForm((current) => ({
      ...current,
      skills: current.skills.includes(skill)
        ? current.skills.filter((item) => item !== skill)
        : [...current.skills, skill],
    }));
  };

  return (
    <>
      <header className="client-pagehead">
        <div>
          <div className="client-breadcrumbs">
            <Link href="/client/requests">Job requests</Link>
            <ClientIcons.ChevronRight size={10} />
            <span>New request</span>
            <ClientIcons.ChevronRight size={10} />
            <span>Step {step} of 3</span>
          </div>
          <h1>{step === 1 ? 'What needs to get done?' : step === 2 ? 'Skills and fit' : 'Review and publish'}</h1>
          <p>
            {step === 1
              ? 'Keep it brief. We will structure it for the match engine.'
              : step === 2
                ? 'Which skills matter, and what does the right fit look like?'
                : 'Last look. You can still edit before you publish.'}
          </p>
        </div>

        <div className="client-actions">
          <Link className="client-btn client-btn--ghost" href="/client/requests">
            Save as draft
          </Link>
          {step < 3 ? (
            <button className="client-btn client-btn--primary" onClick={() => setStep((current) => current + 1)} type="button">
              <span>Continue</span>
              <ClientIcons.Arrow size={12} />
            </button>
          ) : (
            <Link className="client-btn client-btn--accent" href="/client/matches/jr-001">
              <ClientIcons.Send size={14} />
              <span>Publish request</span>
            </Link>
          )}
        </div>
      </header>

      <div className="client-content client-content--narrow">
        <div className="client-step-progress" aria-label="Request progress">
          {[1, 2, 3].map((value) => (
            <span data-active={value <= step ? 'true' : 'false'} key={value} />
          ))}
        </div>

        {step === 1 ? (
          <div className="client-form">
            <Field label="Title">
              <input
                className="client-input"
                onChange={(event) => update({ title: event.target.value })}
                placeholder="Patient intake coordinator - evenings"
                value={form.title}
              />
            </Field>

            <Field label="Category">
              <div className="client-pill-grid">
                {CLIENT_CATEGORIES.map((category) => (
                  <button
                    className="client-select-chip"
                    data-active={form.category === category.id ? 'true' : 'false'}
                    key={category.id}
                    onClick={() => update({ category: category.id })}
                    type="button"
                  >
                    <span>{category.label}</span>
                    <small>{category.blurb}</small>
                  </button>
                ))}
              </div>
            </Field>

            <Field label="Describe the work">
              <textarea
                className="client-textarea"
                onChange={(event) => update({ description: event.target.value })}
                placeholder="What the person will own, where they will plug in, and what success looks like."
                rows={6}
                value={form.description}
              />
            </Field>

            <div className="client-grid client-grid--three">
              <Field label="Hours / week">
                <input
                  className="client-input"
                  onChange={(event) => update({ hoursPerWeek: Number(event.target.value) })}
                  type="number"
                  value={form.hoursPerWeek}
                />
              </Field>
              <Field label="Duration">
                <input
                  className="client-input"
                  onChange={(event) => update({ duration: event.target.value })}
                  value={form.duration}
                />
              </Field>
              <Field label="Timezone preference">
                <input
                  className="client-input"
                  onChange={(event) => update({ timezone: event.target.value })}
                  value={form.timezone}
                />
              </Field>
            </div>
          </div>
        ) : null}

        {step === 2 ? (
          <div className="client-form">
            <Field hint="Lower bound biases toward breadth; upper bound toward expertise." label={`Hourly budget ($${form.budget[0]}-$${form.budget[1]})`}>
              <div className="client-grid client-grid--two">
                <input
                  className="client-input"
                  onChange={(event) => update({ budget: [Number(event.target.value), form.budget[1]] })}
                  type="number"
                  value={form.budget[0]}
                />
                <input
                  className="client-input"
                  onChange={(event) => update({ budget: [form.budget[0], Number(event.target.value)] })}
                  type="number"
                  value={form.budget[1]}
                />
              </div>
            </Field>

            <Field label="Required and nice-to-have skills">
              <div className="client-skill-grid">
                {CLIENT_SKILLS.map((skill) => (
                  <button
                    className="client-chip client-chip--interactive"
                    data-active={form.skills.includes(skill) ? 'true' : 'false'}
                    key={skill}
                    onClick={() => toggleSkill(skill)}
                    type="button"
                  >
                    {skill}
                  </button>
                ))}
              </div>
            </Field>

            <Field hint="A preference layer, not a hard filter." label="Industry familiarity">
              <select className="client-select" onChange={(event) => update({ industry: event.target.value })} value={form.industry}>
                {['Healthcare', 'SaaS', 'Fintech', 'Consumer', 'AI', 'Developer Tools', 'No preference'].map((industry) => (
                  <option key={industry} value={industry}>
                    {industry}
                  </option>
                ))}
              </select>
            </Field>
          </div>
        ) : null}

        {step === 3 ? (
          <article className="client-panel client-panel--review">
            <div className="client-review__title">{form.title || 'Untitled request'}</div>
            <div className="client-review__meta">
              Cedar Health Co-op · {getCategoryLabel(form.category as (typeof CLIENT_CATEGORIES)[number]['id'])} · {form.industry}
            </div>
            <p>{form.description || 'No description yet.'}</p>

            <dl className="client-inline-stats client-inline-stats--review">
              <StatPair label="Hours/wk" value={`${form.hoursPerWeek}`} />
              <StatPair label="Duration" value={form.duration} />
              <StatPair label="Timezone" value={form.timezone} />
              <StatPair label="Budget" value={`$${form.budget[0]}-$${form.budget[1]}/hr`} />
            </dl>

            <div className="client-review__skills">
              <div className="client-eyebrow">Skills</div>
              <div className="client-skill-grid">
                {form.skills.map((skill) => (
                  <span className="client-chip client-chip--accent" key={skill}>
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          </article>
        ) : null}

        {step > 1 ? (
          <button className="client-btn client-btn--quiet" onClick={() => setStep((current) => current - 1)} type="button">
            Back
          </button>
        ) : null}
      </div>
    </>
  );
}

export function MatchesScreen({ jobId }: { jobId: string }) {
  const [variant, setVariant] = React.useState<MatchVariant>('hero');
  const [accepted, setAccepted] = React.useState(false);
  const job = getClientJobRequest(jobId);
  const rankedTalent = React.useMemo(() => getRankedTalent(), []);
  const alternates = rankedTalent.slice(1, 5);

  return (
    <>
      <header className="client-pagehead">
        <div>
          <div className="client-breadcrumbs">
            <Link href="/client/requests">Job requests</Link>
            <ClientIcons.ChevronRight size={10} />
            <span>{job.title}</span>
          </div>
          <h1>Your top match</h1>
          <p>
            A focused shortlist based on skills, availability, rate fit, timezone, and industry familiarity. One clear
            pick, alternates below.
          </p>
        </div>

        <div className="client-actions">
          <div className="client-segmented" role="tablist" aria-label="Match card variants">
            {CLIENT_MATCH_VARIANTS.map((option) => (
              <button
                aria-pressed={variant === option.id}
                data-active={variant === option.id ? 'true' : 'false'}
                key={option.id}
                onClick={() => setVariant(option.id)}
                type="button"
              >
                {option.label}
              </button>
            ))}
          </div>

          <button className="client-btn client-btn--ghost" type="button">
            <ClientIcons.Filter size={13} />
            <span>Adjust filters</span>
          </button>
        </div>
      </header>

      <div className="client-content">
        <MatchHighlight accepted={accepted} jobId={job.id} onAccept={() => setAccepted(true)} variant={variant} />

        <section className="client-section">
          <SectionHead hint="Ranked by fit score. Click to compare." title="Alternates" />
          <div className="client-stack">
            {alternates.map((talent) => (
              <article className="client-alt-row" key={talent.id}>
                <div className="client-avatar client-avatar--small">{talent.initials}</div>
                <div>
                  <div className="client-alt-row__name">{talent.name}</div>
                  <div className="client-alt-row__meta">
                    {talent.title} · {talent.city}
                  </div>
                </div>
                <div className="client-alt-row__stat">${talent.rate}/hr</div>
                <div className="client-alt-row__stat">{talent.availability.split(' ')[0]} hrs</div>
                <div className="client-alt-row__stat">{talent.timezone}</div>
                <div className="client-alt-row__score">
                  <ScoreRing score={talent.score} size="small" />
                  <ClientIcons.ChevronRight size={14} />
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}

function MatchHighlight({ accepted, jobId, onAccept, variant }: MatchProps) {
  const job = getClientJobRequest(jobId);
  const talent = getRankedTalent()[0];

  if (variant === 'dossier') {
    return (
      <article className="client-match client-match--dossier">
        <aside className="client-match__sidebar">
          <div className="client-eyebrow">File · 001</div>
          <ScoreRing score={talent.score} />
          <div className="client-score-label">Fit score</div>
          <div className="client-match__meta-stack">
            <span>Rate · ${talent.rate}/hr</span>
            <span>Avail · {talent.availability}</span>
            <span>Zone · {talent.timezone}</span>
            <span>Exp · {talent.yearsExp} years</span>
          </div>
        </aside>

        <div className="client-match__content">
          <div className="client-eyebrow">Top pick · {job.title}</div>
          <h2>{talent.name}</h2>
          <div className="client-match__subhead">
            {talent.title} · {talent.city}
          </div>
          <p>{talent.bio}</p>
          <SkillRow jobId={job.id} skills={talent.skills} />
          <BreakdownGrid breakdown={talent.breakdown} />
          <MatchActions accepted={accepted} compact={false} onAccept={onAccept} />
        </div>
      </article>
    );
  }

  if (variant === 'stack') {
    return (
      <section className="client-match client-match--stack">
        <article className="client-panel client-match__stack-card">
          <div className="client-match__stack-head">
            <div className="client-avatar client-avatar--large client-avatar--accent">{talent.initials}</div>
            <div className="client-match__stack-copy">
              <span className="client-badge client-badge--accent">Top pick · {talent.score} fit</span>
              <h2>{talent.name}</h2>
              <div className="client-match__subhead">
                {talent.title} · {talent.city} · ${talent.rate}/hr
              </div>
            </div>
          </div>
          <p>{talent.bio}</p>
          <SkillRow jobId={job.id} skills={talent.skills} />
          <MatchActions accepted={accepted} compact onAccept={onAccept} />
        </article>

        <article className="client-panel client-match__stack-side">
          <div className="client-eyebrow">Score breakdown</div>
          <BreakdownGrid breakdown={talent.breakdown} compact />
          <hr className="client-rule" />
          <div className="client-match__facts">
            <span>Avail · {talent.availability}</span>
            <span>Zone · {talent.timezone}</span>
            <span>Exp · {talent.yearsExp} yrs</span>
            <span>Industry · {talent.industries[0]}</span>
          </div>
        </article>
      </section>
    );
  }

  return (
    <section className="client-match client-match--hero">
      <div className="client-match__portrait">
        <div className="client-avatar client-avatar--large">{talent.initials}</div>
        <div className="client-match__portrait-name">{talent.name}</div>
        <div className="client-match__portrait-meta">
          {talent.city} · {talent.yearsExp} yrs
        </div>
      </div>

      <div className="client-match__content">
        <div className="client-match__hero-tags">
          <span className="client-badge client-badge--accent">Top pick</span>
          <span className="client-eyebrow">{talent.title}</span>
        </div>
        <p className="client-match__quote">&ldquo;{talent.bio}&rdquo;</p>
        <SkillRow jobId={job.id} skills={talent.skills} />
        <div className="client-match__breakdown">
          <div className="client-eyebrow">Why this match</div>
          <BreakdownGrid breakdown={talent.breakdown} />
        </div>
      </div>

      <aside className="client-match__rail">
        <ScoreRing score={talent.score} />
        <div className="client-score-label">Fit score</div>
        <hr className="client-rule" />
        <FactRow label="Rate" value={`$${talent.rate}/hr`} />
        <FactRow label="Available" value={talent.availability} />
        <FactRow label="Timezone" value={talent.timezone} />
        <FactRow label="Industries" value={talent.industries.join(', ')} />
        <MatchActions accepted={accepted} compact={false} onAccept={onAccept} />
      </aside>
    </section>
  );
}

export function EngagementsScreen() {
  return (
    <>
      <header className="client-pagehead">
        <div>
          <div className="client-breadcrumbs">
            <span>Cedar Health Co-op</span>
            <ClientIcons.ChevronRight size={10} />
            <span>Engagements</span>
          </div>
          <h1>Active engagements</h1>
          <p>Every accepted match becomes an engagement, the parent record for timesheets and invoices.</p>
        </div>
      </header>

      <div className="client-content">
        <div className="client-stack client-stack--spacious">
          {CLIENT_ENGAGEMENTS.map((engagement) => (
            <article className="client-panel client-panel--engagement-list" key={engagement.id}>
              <div>
                <div className="client-eyebrow">{engagement.id}</div>
                <h3>{engagement.jobTitle}</h3>
                <div className="client-table__secondary">Started {engagement.started}</div>
              </div>

              <div>
                <StatPair label="Talent" value={engagement.talentName} />
                <div className="client-stat-spacer">
                  <StatPair label="Rate" value={`$${engagement.rate}/hr`} />
                </div>
              </div>

              <div>
                <StatPair label="Approved" value={`${engagement.hoursApproved} hrs`} />
                <div className="client-stat-spacer">
                  <StatPair label="This week" value={`${engagement.hoursThisWeek} hrs`} />
                </div>
              </div>

              <div className="client-panel__actions">
                <span className="client-status client-status--active">Active</span>
                <Link className="client-btn client-btn--ghost client-btn--small" href="/client/timesheets">
                  Review hours
                </Link>
              </div>
            </article>
          ))}
        </div>
      </div>
    </>
  );
}

export function TimesheetsScreen() {
  const [selectedId, setSelectedId] = React.useState(CLIENT_TIMESHEETS[0]?.id ?? '');
  const [approvedIds, setApprovedIds] = React.useState<string[]>([]);
  const [rejectedIds, setRejectedIds] = React.useState<string[]>([]);

  const selected = CLIENT_TIMESHEETS.find((timesheet) => timesheet.id === selectedId) ?? CLIENT_TIMESHEETS[0];

  const statusOf = React.useCallback(
    (id: string, base: string) => {
      if (approvedIds.includes(id)) {
        return 'Approved';
      }
      if (rejectedIds.includes(id)) {
        return 'Rejected';
      }
      return base;
    },
    [approvedIds, rejectedIds],
  );

  return (
    <>
      <header className="client-pagehead">
        <div>
          <div className="client-breadcrumbs">
            <span>Cedar Health Co-op</span>
            <ClientIcons.ChevronRight size={10} />
            <span>Timesheets</span>
          </div>
          <h1>Approve hours</h1>
          <p>Invoices are generated only from approved timesheets. Full audit trail preserved.</p>
        </div>
      </header>

      <div className="client-timesheets">
        <aside className="client-timesheets__list">
          {CLIENT_TIMESHEETS.map((timesheet) => {
            const status = statusOf(timesheet.id, timesheet.status);

            return (
              <button
                className="client-timesheets__item"
                data-active={timesheet.id === selected.id ? 'true' : 'false'}
                key={timesheet.id}
                onClick={() => setSelectedId(timesheet.id)}
                type="button"
              >
                <div className="client-timesheets__item-top">
                  <span>{timesheet.talentName}</span>
                  <span className={`client-status ${statusTone(status)}`}>{status}</span>
                </div>
                <div className="client-table__secondary">{timesheet.engagementTitle}</div>
                <div className="client-timesheets__item-meta">
                  <span>{timesheet.weekOf}</span>
                  <span>{timesheet.hours} hrs</span>
                </div>
              </button>
            );
          })}
        </aside>

        <section className="client-timesheets__detail">
          <div className="client-timesheets__summary">
            <div>
              <div className="client-eyebrow">Timesheet · {selected.weekOf}</div>
              <h2>{selected.engagementTitle}</h2>
              <div className="client-table__secondary">
                {selected.talentName} · submitted {selected.submitted}
              </div>
            </div>

            <div className="client-timesheets__subtotal">
              <div className="client-eyebrow">Subtotal</div>
              <div className="client-timesheets__total">${(selected.hours * selected.rate).toLocaleString()}</div>
              <div className="client-table__secondary">
                {selected.hours} hrs × ${selected.rate}/hr
              </div>
            </div>
          </div>

          <div className="client-panel">
            <div className="client-timesheets__row client-timesheets__row--head">
              <span>Day</span>
              <span>Notes</span>
              <span>Hours</span>
            </div>
            {selected.entries.length === 0 ? (
              <div className="client-timesheets__empty">Already approved · no editable entries.</div>
            ) : (
              selected.entries.map((entry) => (
                <div className="client-timesheets__row" key={`${selected.id}-${entry.day}`}>
                  <span>{entry.day}</span>
                  <span>{entry.note}</span>
                  <span>{entry.hours.toFixed(1)}</span>
                </div>
              ))
            )}
            <div className="client-timesheets__row client-timesheets__row--total">
              <span></span>
              <span>Total</span>
              <span>{selected.hours.toFixed(1)}</span>
            </div>
          </div>

          <div className="client-actions client-actions--detail">
            {statusOf(selected.id, selected.status) === 'Submitted' ? (
              <>
                <button
                  className="client-btn client-btn--accent"
                  onClick={() =>
                    setApprovedIds((current) => (current.includes(selected.id) ? current : [...current, selected.id]))
                  }
                  type="button"
                >
                  <ClientIcons.Check size={14} stroke={2} />
                  <span>Approve {selected.hours} hrs</span>
                </button>
                <button
                  className="client-btn client-btn--ghost"
                  onClick={() =>
                    setRejectedIds((current) => (current.includes(selected.id) ? current : [...current, selected.id]))
                  }
                  type="button"
                >
                  Reject with reason
                </button>
                <button className="client-btn client-btn--quiet" type="button">
                  Request adjustment
                </button>
              </>
            ) : (
              <span className="client-badge client-badge--accent">
                {statusOf(selected.id, selected.status)} · invoice{' '}
                {approvedIds.includes(selected.id) || selected.status === 'Approved' ? 'queued' : 'held'}
              </span>
            )}
          </div>
        </section>
      </div>
    </>
  );
}

export function InvoicesScreen() {
  const [openId, setOpenId] = React.useState<string | null>(null);
  const selectedInvoice = CLIENT_INVOICES.find((invoice) => invoice.id === openId) ?? null;

  return (
    <>
      <header className="client-pagehead">
        <div>
          <div className="client-breadcrumbs">
            <span>Cedar Health Co-op</span>
            <ClientIcons.ChevronRight size={10} />
            <span>Invoices</span>
          </div>
          <h1>Invoices</h1>
          <p>Generated from approved timesheets. Platform fee, subtotal, and total computed transparently.</p>
        </div>

        <div className="client-actions">
          <button className="client-btn client-btn--ghost" type="button">
            <ClientIcons.ArrowDownload size={13} />
            <span>Export CSV</span>
          </button>
          <button className="client-btn client-btn--ghost" type="button">
            All engagements
          </button>
        </div>
      </header>

      <div className="client-content">
        <div className="client-table-wrap">
          <table className="client-table">
            <thead>
              <tr>
                <th>Invoice</th>
                <th>Engagement</th>
                <th>Period</th>
                <th>Hours</th>
                <th>Total</th>
                <th>Status</th>
                <th aria-hidden="true"></th>
              </tr>
            </thead>
            <tbody>
              {CLIENT_INVOICES.map((invoice) => (
                <tr key={invoice.id}>
                  <td className="client-table__mono">{invoice.id}</td>
                  <td>{invoice.client}</td>
                  <td>{invoice.period}</td>
                  <td>{invoice.hours}</td>
                  <td className="client-table__mono">${invoice.total.toFixed(2)}</td>
                  <td>
                    <span className="client-status client-status--paid">{invoice.status}</span>
                  </td>
                  <td className="client-table__action">
                    <button className="client-inline-link" onClick={() => setOpenId(invoice.id)} type="button">
                      <span>View</span>
                      <ClientIcons.ChevronRight size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {selectedInvoice ? (
          <div className="client-modal-backdrop" onClick={() => setOpenId(null)} role="presentation">
            <article className="client-invoice" onClick={(event) => event.stopPropagation()}>
              <div className="client-invoice__header">
                <div>
                  <div className="client-invoice__brand">Autharis</div>
                  <div className="client-table__secondary">Invoice</div>
                </div>
                <div className="client-invoice__meta">
                  <div className="client-table__mono">{selectedInvoice.id}</div>
                  <div className="client-table__secondary">Issued {selectedInvoice.date}</div>
                </div>
              </div>

              <dl className="client-invoice__grid">
                <div>
                  <dt>Bill to</dt>
                  <dd>
                    {selectedInvoice.client}
                    <br />
                    <span>billing@cedarhealth.co</span>
                  </dd>
                </div>
                <div>
                  <dt>Period</dt>
                  <dd>{selectedInvoice.period}</dd>
                </div>
                <div>
                  <dt>Engagement</dt>
                  <dd>{selectedInvoice.engagement}</dd>
                </div>
                <div>
                  <dt>Status</dt>
                  <dd>
                    <span className="client-status client-status--paid">{selectedInvoice.status}</span>
                  </dd>
                </div>
              </dl>

              <table className="client-table client-table--invoice">
                <thead>
                  <tr>
                    <th>Description</th>
                    <th>Hours</th>
                    <th>Rate</th>
                    <th>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Approved hours · {selectedInvoice.period}</td>
                    <td>{selectedInvoice.hours}</td>
                    <td>${selectedInvoice.rate}/hr</td>
                    <td className="client-table__mono">${selectedInvoice.subtotal.toFixed(2)}</td>
                  </tr>
                  <tr>
                    <td colSpan={3}>Platform fee (10%)</td>
                    <td className="client-table__mono">${selectedInvoice.fee.toFixed(2)}</td>
                  </tr>
                  <tr>
                    <td className="client-invoice__total-label" colSpan={3}>
                      Total due
                    </td>
                    <td className="client-invoice__total-value">${selectedInvoice.total.toFixed(2)}</td>
                  </tr>
                </tbody>
              </table>

              <div className="client-actions">
                <button className="client-btn client-btn--ghost client-btn--small" onClick={() => setOpenId(null)} type="button">
                  Close
                </button>
                <button className="client-btn client-btn--primary client-btn--small" type="button">
                  <ClientIcons.ArrowDownload size={12} />
                  <span>Download PDF</span>
                </button>
              </div>
            </article>
          </div>
        ) : null}
      </div>
    </>
  );
}

function ActionRow({
  cta,
  href,
  meta,
  tag,
  title,
}: {
  cta: string;
  href: string;
  meta: string;
  tag: string;
  title: string;
}) {
  return (
    <article className="client-action-row">
      <span className="client-badge client-badge--outline">{tag}</span>
      <div>
        <div className="client-action-row__title">{title}</div>
        <div className="client-action-row__meta">{meta}</div>
      </div>
      <Link className="client-btn client-btn--ghost client-btn--small" href={href}>
        <span>{cta}</span>
        <ClientIcons.Arrow size={12} />
      </Link>
    </article>
  );
}

function BreakdownGrid({ breakdown, compact = false }: { breakdown: Record<string, number>; compact?: boolean }) {
  return (
    <div className={`client-breakdown ${compact ? 'client-breakdown--compact' : ''}`}>
      {Object.entries(breakdown).map(([label, value]) => {
        const max = MATCH_BREAKDOWN_MAX[label] ?? 100;

        return (
          <div className="client-progress" key={label}>
            <span className="client-progress__label">{label}</span>
            <span className="client-progress__bar">
              <span style={{ width: `${(value / max) * 100}%` }} />
            </span>
            <span className="client-progress__value">
              {value}/{max}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function FactRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="client-fact-row">
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}

function Field({
  children,
  hint,
  label,
}: {
  children: React.ReactNode;
  hint?: string;
  label: string;
}) {
  return (
    <label className="client-field">
      <span className="client-field__label">{label}</span>
      {children}
      {hint ? <span className="client-field__hint">{hint}</span> : null}
    </label>
  );
}

function MatchActions({
  accepted,
  compact,
  onAccept,
}: {
  accepted: boolean;
  compact: boolean;
  onAccept: () => void;
}) {
  return (
    <div className={`client-match__actions ${compact ? 'client-match__actions--compact' : ''}`}>
      {accepted ? (
        <div className="client-acceptance">
          <ClientIcons.Check size={18} stroke={2} />
          <div>
            <strong>Engagement created</strong>
            <span>We will email the onboarding packet.</span>
          </div>
        </div>
      ) : (
        <>
          <button className="client-btn client-btn--accent" onClick={onAccept} type="button">
            <span>Start engagement</span>
            <ClientIcons.Arrow size={13} />
          </button>
          <button className="client-btn client-btn--ghost" type="button">
            Request intro call
          </button>
          <button className="client-btn client-btn--quiet" type="button">
            Pass on this match
          </button>
        </>
      )}
    </div>
  );
}

function MetricCard({
  label,
  note,
  noteTone,
  value,
}: {
  label: string;
  note: string;
  noteTone?: 'positive';
  value: string;
}) {
  return (
    <article className="client-metric">
      <div className="client-metric__label">{label}</div>
      <div className="client-metric__value">{value}</div>
      <div className={`client-metric__note ${noteTone === 'positive' ? 'client-metric__note--positive' : ''}`}>{note}</div>
    </article>
  );
}

function ScoreRing({ score, size = 'default' }: { score: number; size?: 'default' | 'small' }) {
  return (
    <div className={`client-score-ring client-score-ring--${size}`} style={{ ['--client-score' as string]: `${score}` }}>
      <span>{score}</span>
    </div>
  );
}

function SectionHead({ hint, title }: { hint: string; title: string }) {
  return (
    <div className="client-section__head">
      <h2>{title}</h2>
      <span>{hint}</span>
    </div>
  );
}

function SkillRow({ jobId, skills }: { jobId: string; skills: ClientSkill[] }) {
  const job = getClientJobRequest(jobId);

  return (
    <div className="client-skill-grid">
      {skills.map((skill) => {
        const overlap = job.skills.includes(skill);

        return (
          <span className={`client-chip ${overlap ? 'client-chip--accent' : ''}`} key={skill}>
            {skill}
          </span>
        );
      })}
    </div>
  );
}

function StatPair({ label, value }: { label: string; value: string }) {
  return (
    <div className="client-stat">
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

function statusTone(status: string) {
  if (status === 'Active' || status === 'Matched' || status === 'Approved') {
    return 'client-status--active';
  }
  if (status === 'Shortlist ready' || status === 'Submitted') {
    return 'client-status--pending';
  }
  if (status === 'Rejected') {
    return 'client-status--negative';
  }
  if (status === 'Reviewing') {
    return 'client-status--review';
  }
  if (status === 'Paid') {
    return 'client-status--paid';
  }
  return 'client-status--muted';
}
