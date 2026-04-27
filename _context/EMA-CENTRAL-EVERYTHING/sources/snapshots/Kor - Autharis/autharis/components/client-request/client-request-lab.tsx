'use client';

import Link from 'next/link';
import * as React from 'react';

import { ClientIcons } from '@/components/client/icons';
import { CLIENT_SKILLS, getCategoryLabel, type ClientSkill } from '@/lib/client/data';
import {
  REQUEST_LAB_DEFAULT_DRAFT,
  REQUEST_LAB_INDUSTRIES,
  REQUEST_LAB_TIMEZONES,
  REQUEST_LAB_TEMPLATES,
  REQUEST_LAB_URGENCY,
  getRequestLabCategories,
  getRequestLabChecklist,
  getRequestLabNarrative,
  getRequestLabShortlist,
  getRequestLabSignals,
  type RequestLabCandidate,
  type RequestLabDraft,
} from '@/lib/client-request/data';

const STEP_LABELS = ['Brief', 'Filters', 'Shortlist', 'Review'] as const;

export function ClientRequestLab() {
  const [draft, setDraft] = React.useState<RequestLabDraft>(REQUEST_LAB_DEFAULT_DRAFT);
  const [step, setStep] = React.useState(0);
  const [selectedCandidateId, setSelectedCandidateId] = React.useState<string | null>(null);
  const [publishedAt, setPublishedAt] = React.useState<string | null>(null);

  const deferredDraft = React.useDeferredValue(draft);
  const shortlist = getRequestLabShortlist(deferredDraft);
  const checklist = getRequestLabChecklist(draft);
  const signals = getRequestLabSignals(deferredDraft);
  const selectedCandidate =
    shortlist.find((candidate) => candidate.talent.id === selectedCandidateId) ?? shortlist[0] ?? null;
  const checklistReady = checklist.every((item) => item.complete);

  function patchDraft(patch: Partial<RequestLabDraft>) {
    setDraft((current) => ({ ...current, ...patch }));
    setPublishedAt(null);
  }

  function toggleSkill(bucket: 'mustHave' | 'niceToHave', skill: ClientSkill) {
    setDraft((current) => {
      const nextSkills = current[bucket].includes(skill)
        ? current[bucket].filter((item) => item !== skill)
        : [...current[bucket], skill];

      return { ...current, [bucket]: nextSkills };
    });
    setPublishedAt(null);
  }

  function applyTemplate(templateId: string) {
    const template = REQUEST_LAB_TEMPLATES.find((item) => item.id === templateId);

    if (!template) {
      return;
    }

    setDraft(template.draft);
    setStep(0);
    setSelectedCandidateId(null);
    setPublishedAt(null);
  }

  function publishLabBrief() {
    setStep(3);
    setPublishedAt(
      new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      }).format(new Date())
    );
  }

  return (
    <div className="request-lab-surface">
      <div className="request-lab-frame">
        <header className="request-lab-hero">
          <div className="request-lab-hero__copy">
            <div className="request-lab-breadcrumbs">
              <Link href="/client">Client surface</Link>
              <ClientIcons.ChevronRight size={12} />
              <Link href="/client/requests">Job requests</Link>
              <ClientIcons.ChevronRight size={12} />
              <span>Request lab</span>
            </div>
            <div className="request-lab-eyebrow">Lane D3 sandbox</div>
            <h1>Pressure-test a request before it hits the matching desk.</h1>
            <p>
              Compose the brief, tune the fit signal, and watch the shortlist react in real time without touching the
              landed client surface.
            </p>
          </div>

          <div className="request-lab-hero__actions">
            <Link className="request-lab-button request-lab-button--ghost" href="/client/requests">
              Back to client requests
            </Link>
            {step < STEP_LABELS.length - 1 ? (
              <button
                className="request-lab-button request-lab-button--primary"
                onClick={() => setStep((current) => Math.min(current + 1, STEP_LABELS.length - 1))}
                type="button"
              >
                <span>Continue</span>
                <ClientIcons.Arrow size={12} />
              </button>
            ) : (
              <button
                className="request-lab-button request-lab-button--accent"
                disabled={!checklistReady}
                onClick={publishLabBrief}
                type="button"
              >
                <ClientIcons.Send size={14} />
                <span>Publish lab brief</span>
              </button>
            )}
          </div>
        </header>

        <section className="request-lab-statusbar">
          <div className="request-lab-stepper" aria-label="Composer steps">
            {STEP_LABELS.map((label, index) => (
              <button
                className="request-lab-step"
                data-active={index === step ? 'true' : 'false'}
                data-complete={index < step ? 'true' : 'false'}
                key={label}
                onClick={() => setStep(index)}
                type="button"
              >
                <span>{index + 1}</span>
                <strong>{label}</strong>
              </button>
            ))}
          </div>

          <div className="request-lab-signal-row">
            {signals.map((signal) => (
              <article className="request-lab-signal" data-tone={signal.tone} key={signal.label}>
                <span>{signal.label}</span>
                <strong>{signal.value}</strong>
                <p>{signal.detail}</p>
              </article>
            ))}
          </div>
        </section>

        <div className="request-lab-main">
          <section className="request-lab-column">
            <article className="request-lab-panel request-lab-panel--templates">
              <div className="request-lab-panel__head">
                <div>
                  <div className="request-lab-panel__eyebrow">Quick starts</div>
                  <h2>Use a proven setup</h2>
                </div>
                <p>Each template hydrates the lab with a distinct request pattern.</p>
              </div>

              <div className="request-lab-template-grid">
                {REQUEST_LAB_TEMPLATES.map((template) => (
                  <button
                    className="request-lab-template"
                    data-active={draft.title === template.draft.title ? 'true' : 'false'}
                    key={template.id}
                    onClick={() => applyTemplate(template.id)}
                    type="button"
                  >
                    <strong>{template.label}</strong>
                    <span>{template.blurb}</span>
                  </button>
                ))}
              </div>
            </article>

            {step === 0 ? (
              <article className="request-lab-panel">
                <SectionHeading
                  body="Start with the real operating problem and the behavior you want from the person on day one."
                  title="Brief framing"
                />

                <div className="request-lab-form">
                  <Field label="Client">
                    <input
                      className="request-lab-input"
                      onChange={(event) => patchDraft({ client: event.target.value })}
                      value={draft.client}
                    />
                  </Field>

                  <Field label="Title">
                    <input
                      className="request-lab-input"
                      onChange={(event) => patchDraft({ title: event.target.value })}
                      placeholder="Patient intake coordinator - evenings"
                      value={draft.title}
                    />
                  </Field>

                  <Field label="Category">
                    <div className="request-lab-category-grid">
                      {getRequestLabCategories().map((category) => (
                        <button
                          className="request-lab-category"
                          data-active={draft.category === category.id ? 'true' : 'false'}
                          key={category.id}
                          onClick={() => patchDraft({ category: category.id })}
                          type="button"
                        >
                          <strong>{category.label}</strong>
                          <span>{category.blurb}</span>
                        </button>
                      ))}
                    </div>
                  </Field>

                  <Field label="Describe the work">
                    <textarea
                      className="request-lab-textarea"
                      onChange={(event) => patchDraft({ description: event.target.value })}
                      rows={5}
                      value={draft.description}
                    />
                  </Field>

                  <Field label="What does success look like?">
                    <textarea
                      className="request-lab-textarea"
                      onChange={(event) => patchDraft({ outcome: event.target.value })}
                      rows={4}
                      value={draft.outcome}
                    />
                  </Field>
                </div>
              </article>
            ) : null}

            {step === 1 ? (
              <article className="request-lab-panel">
                <SectionHeading
                  body="Tune the filters the matching desk will actually care about, then keep nice-to-haves from becoming blockers."
                  title="Fit tuning"
                />

                <div className="request-lab-form">
                  <div className="request-lab-grid request-lab-grid--three">
                    <Field label="Hours / week">
                      <input
                        className="request-lab-input"
                        min={1}
                        onChange={(event) => patchDraft({ hoursPerWeek: Number(event.target.value) })}
                        type="number"
                        value={draft.hoursPerWeek}
                      />
                    </Field>

                    <Field label="Duration">
                      <input
                        className="request-lab-input"
                        onChange={(event) => patchDraft({ duration: event.target.value })}
                        value={draft.duration}
                      />
                    </Field>

                    <Field label="Urgency">
                      <select
                        className="request-lab-select"
                        onChange={(event) => patchDraft({ urgency: event.target.value as RequestLabDraft['urgency'] })}
                        value={draft.urgency}
                      >
                        {REQUEST_LAB_URGENCY.map((urgency) => (
                          <option key={urgency} value={urgency}>
                            {urgency}
                          </option>
                        ))}
                      </select>
                    </Field>
                  </div>

                  <div className="request-lab-grid request-lab-grid--three">
                    <Field label="Timezone">
                      <select
                        className="request-lab-select"
                        onChange={(event) => patchDraft({ timezone: event.target.value as RequestLabDraft['timezone'] })}
                        value={draft.timezone}
                      >
                        {REQUEST_LAB_TIMEZONES.map((timezone) => (
                          <option key={timezone} value={timezone}>
                            {timezone}
                          </option>
                        ))}
                      </select>
                    </Field>

                    <Field label="Budget floor">
                      <input
                        className="request-lab-input"
                        min={1}
                        onChange={(event) => patchDraft({ budget: [Number(event.target.value), draft.budget[1]] })}
                        type="number"
                        value={draft.budget[0]}
                      />
                    </Field>

                    <Field label="Budget ceiling">
                      <input
                        className="request-lab-input"
                        min={draft.budget[0]}
                        onChange={(event) => patchDraft({ budget: [draft.budget[0], Number(event.target.value)] })}
                        type="number"
                        value={draft.budget[1]}
                      />
                    </Field>
                  </div>

                  <Field hint="These heavily influence score and ordering." label="Must-have skills">
                    <div className="request-lab-chip-grid">
                      {CLIENT_SKILLS.map((skill) => (
                        <button
                          className="request-lab-chip"
                          data-active={draft.mustHave.includes(skill) ? 'true' : 'false'}
                          key={skill}
                          onClick={() => toggleSkill('mustHave', skill)}
                          type="button"
                        >
                          {skill}
                        </button>
                      ))}
                    </div>
                  </Field>

                  <Field hint="Useful preferences, but the shortlist should survive without them." label="Nice-to-have skills">
                    <div className="request-lab-chip-grid">
                      {CLIENT_SKILLS.map((skill) => (
                        <button
                          className="request-lab-chip request-lab-chip--soft"
                          data-active={draft.niceToHave.includes(skill) ? 'true' : 'false'}
                          key={skill}
                          onClick={() => toggleSkill('niceToHave', skill)}
                          type="button"
                        >
                          {skill}
                        </button>
                      ))}
                    </div>
                  </Field>

                  <div className="request-lab-grid request-lab-grid--two">
                    <Field label="Industry context">
                      <select
                        className="request-lab-select"
                        onChange={(event) => patchDraft({ industry: event.target.value })}
                        value={draft.industry}
                      >
                        {REQUEST_LAB_INDUSTRIES.map((industry) => (
                          <option key={industry} value={industry}>
                            {industry}
                          </option>
                        ))}
                      </select>
                    </Field>

                    <Field label="Internal notes">
                      <textarea
                        className="request-lab-textarea"
                        onChange={(event) => patchDraft({ teamNotes: event.target.value })}
                        rows={4}
                        value={draft.teamNotes}
                      />
                    </Field>
                  </div>
                </div>
              </article>
            ) : null}

            {step === 2 ? (
              <article className="request-lab-panel">
                <SectionHeading
                  body="Review the live stack, compare what is pushing a candidate up or down, and tighten the brief if the top fit looks wrong."
                  title="Shortlist pressure test"
                />

                <div className="request-lab-shortlist">
                  {shortlist.slice(0, 4).map((candidate, index) => (
                    <button
                      className="request-lab-candidate"
                      data-active={selectedCandidate?.talent.id === candidate.talent.id ? 'true' : 'false'}
                      key={candidate.talent.id}
                      onClick={() => setSelectedCandidateId(candidate.talent.id)}
                      type="button"
                    >
                      <div className="request-lab-candidate__score">
                        <span>#{index + 1}</span>
                        <strong>{candidate.score}</strong>
                      </div>

                      <div className="request-lab-candidate__body">
                        <div className="request-lab-candidate__topline">
                          <div>
                            <strong>{candidate.talent.name}</strong>
                            <span>{candidate.talent.title}</span>
                          </div>
                          <div className="request-lab-candidate__meta">
                            <span>{candidate.talent.timezone}</span>
                            <span>${candidate.talent.rate}/hr</span>
                          </div>
                        </div>

                        <p>{candidate.summary}</p>

                        <div className="request-lab-tag-row">
                          {candidate.matchedSkills.slice(0, 3).map((skill) => (
                            <span className="request-lab-tag" key={skill}>
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </article>
            ) : null}

            {step === 3 ? (
              <article className="request-lab-panel">
                <SectionHeading
                  body="This packet is what you would hand to the matching desk after the lab pass."
                  title="Review and publish"
                />

                {publishedAt ? (
                  <div className="request-lab-banner">
                    <ClientIcons.Check size={14} />
                    <span>Lab brief published to matching at {publishedAt}.</span>
                  </div>
                ) : null}

                <div className="request-lab-review">
                  <article className="request-lab-review-card">
                    <div className="request-lab-review-card__eyebrow">Narrative brief</div>
                    <h3>{draft.title}</h3>
                    <p>{getRequestLabNarrative(draft)}</p>

                    <dl className="request-lab-stat-grid">
                      <ReviewStat label="Category" value={getCategoryLabel(draft.category)} />
                      <ReviewStat label="Hours" value={`${draft.hoursPerWeek} / week`} />
                      <ReviewStat label="Duration" value={draft.duration} />
                      <ReviewStat label="Budget" value={`$${draft.budget[0]}-$${draft.budget[1]}/hr`} />
                    </dl>
                  </article>

                  <article className="request-lab-review-card">
                    <div className="request-lab-review-card__eyebrow">Launch checklist</div>
                    <div className="request-lab-checklist">
                      {checklist.map((item) => (
                        <div className="request-lab-checklist__item" data-complete={item.complete ? 'true' : 'false'} key={item.label}>
                          <div className="request-lab-checklist__icon">
                            {item.complete ? <ClientIcons.Check size={12} /> : <ClientIcons.ChevronRight size={12} />}
                          </div>
                          <div>
                            <strong>{item.label}</strong>
                            <p>{item.detail}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </article>
                </div>
              </article>
            ) : null}

            <div className="request-lab-footer">
              <button
                className="request-lab-button request-lab-button--quiet"
                disabled={step === 0}
                onClick={() => setStep((current) => Math.max(current - 1, 0))}
                type="button"
              >
                Back
              </button>

              <button
                className="request-lab-button request-lab-button--ghost"
                onClick={() => {
                  setDraft(REQUEST_LAB_DEFAULT_DRAFT);
                  setStep(0);
                  setSelectedCandidateId(null);
                  setPublishedAt(null);
                }}
                type="button"
              >
                Reset lab
              </button>
            </div>
          </section>

          <aside className="request-lab-rail">
            <article className="request-lab-panel request-lab-panel--sticky">
              <div className="request-lab-panel__head">
                <div>
                  <div className="request-lab-panel__eyebrow">Live top fit</div>
                  <h2>{selectedCandidate?.talent.name ?? 'No candidate selected'}</h2>
                </div>
                <div className="request-lab-score-pill">{selectedCandidate?.score ?? '-'}</div>
              </div>

              {selectedCandidate ? <CandidateSummary candidate={selectedCandidate} /> : <p>No candidate data yet.</p>}
            </article>

            <article className="request-lab-panel">
              <div className="request-lab-panel__head">
                <div>
                  <div className="request-lab-panel__eyebrow">Draft summary</div>
                  <h2>{draft.title || 'Untitled request'}</h2>
                </div>
                <div className="request-lab-mini-chip">{draft.urgency}</div>
              </div>

              <div className="request-lab-detail-list">
                <DetailRow label="Client" value={draft.client} />
                <DetailRow label="Timezone" value={draft.timezone} />
                <DetailRow label="Industry" value={draft.industry} />
                <DetailRow label="Budget" value={`$${draft.budget[0]}-$${draft.budget[1]}/hr`} />
              </div>

              <div className="request-lab-skill-stack">
                <div>
                  <span>Must have</span>
                  <div className="request-lab-tag-row">
                    {draft.mustHave.map((skill) => (
                      <span className="request-lab-tag request-lab-tag--dense" key={skill}>
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <span>Nice to have</span>
                  <div className="request-lab-tag-row">
                    {draft.niceToHave.map((skill) => (
                      <span className="request-lab-tag request-lab-tag--ghost" key={skill}>
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </article>
          </aside>
        </div>
      </div>
    </div>
  );
}

function CandidateSummary({ candidate }: { candidate: RequestLabCandidate }) {
  return (
    <div className="request-lab-candidate-summary">
      <div className="request-lab-candidate-summary__meta">
        <div>
          <strong>{candidate.talent.title}</strong>
          <span>
            {candidate.talent.city} · {candidate.talent.timezone}
          </span>
        </div>
        <div>
          <strong>${candidate.talent.rate}/hr</strong>
          <span>{candidate.talent.availability}</span>
        </div>
      </div>

      <p>{candidate.talent.bio}</p>

      <div className="request-lab-breakdown">
        {candidate.scoreLines.map((line) => (
          <div className="request-lab-breakdown__row" key={line.label}>
            <div className="request-lab-breakdown__label">
              <span>{line.label}</span>
              <strong>
                {line.value}/{line.max}
              </strong>
            </div>
            <div className="request-lab-breakdown__bar">
              <span style={{ width: `${(line.value / line.max) * 100}%` }} />
            </div>
          </div>
        ))}
      </div>

      <div className="request-lab-summary-block">
        <span>Why this profile works</span>
        <p>{candidate.summary}</p>
      </div>

      <div className="request-lab-summary-block">
        <span>Watchouts</span>
        <ul className="request-lab-list">
          {candidate.watchouts.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>
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
    <label className="request-lab-field">
      <span className="request-lab-field__label">{label}</span>
      {children}
      {hint ? <span className="request-lab-field__hint">{hint}</span> : null}
    </label>
  );
}

function SectionHeading({ body, title }: { body: string; title: string }) {
  return (
    <div className="request-lab-section-heading">
      <h2>{title}</h2>
      <p>{body}</p>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="request-lab-detail-row">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function ReviewStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="request-lab-stat">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
