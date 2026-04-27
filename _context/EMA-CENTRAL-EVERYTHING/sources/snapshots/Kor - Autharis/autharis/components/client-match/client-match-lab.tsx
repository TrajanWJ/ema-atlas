'use client';

import Link from 'next/link';
import * as React from 'react';

import { ClientIcons } from '@/components/client/icons';
import { type ClientMatchLabAxis, type ClientMatchLabCandidate, type ClientMatchLabData } from '@/lib/client-match/data';

type MatchLabPanel = 'comparison' | 'interview' | 'launch';

const PANELS: { id: MatchLabPanel; label: string }[] = [
  { id: 'comparison', label: 'Compare' },
  { id: 'interview', label: 'Interview' },
  { id: 'launch', label: 'Launch' },
];

export function ClientMatchLab({ lab }: { lab: ClientMatchLabData }) {
  const [focusTalentId, setFocusTalentId] = React.useState(lab.focusTalentId);
  const [compareTalentId, setCompareTalentId] = React.useState(lab.compareTalentId);
  const [panel, setPanel] = React.useState<MatchLabPanel>('comparison');

  const focus = getCandidate(lab.candidates, focusTalentId);
  const compare = getCompareCandidate(lab.candidates, focus.talent.id, compareTalentId);

  const onChooseFocus = (candidateId: string) => {
    setFocusTalentId(candidateId);

    if (candidateId === compareTalentId) {
      setCompareTalentId(getAlternateCandidateId(lab.candidates, candidateId));
    }
  };

  const onChooseCompare = (candidateId: string) => {
    if (candidateId === focusTalentId) {
      setFocusTalentId(getAlternateCandidateId(lab.candidates, candidateId));
    }

    setCompareTalentId(candidateId);
  };

  return (
    <div className="match-lab">
      <div className="match-lab__frame">
        <header className="match-lab__hero">
          <div className="match-lab__hero-copy">
            <div className="match-lab__breadcrumbs">
              <Link href="/client/requests">Client requests</Link>
              <ClientIcons.ChevronRight size={12} />
              <Link href={`/client/matches/${lab.job.id}`}>Existing match screen</Link>
              <ClientIcons.ChevronRight size={12} />
              <span>Lab packet</span>
            </div>

            <div className="match-lab__eyebrow">Lane D4 · Client-adjacent match review</div>
            <h1>Comparison moments for a sharper hiring call</h1>
            <p>
              This lab keeps the existing shortlist story, then adds richer compare, interview, and launch views so a
              client can pressure-test two candidates before committing.
            </p>
          </div>

          <div className="match-lab__hero-actions">
            <Link className="match-lab__action match-lab__action--primary" href={`/client/matches/${lab.job.id}`}>
              <ClientIcons.Sparkles size={15} />
              <span>Open client screen</span>
            </Link>
            <button className="match-lab__action" type="button">
              <ClientIcons.ArrowDownload size={15} />
              <span>Share review packet</span>
            </button>
          </div>
        </header>

        <section className="match-lab__summary">
          <MetricCard label="Request" value={lab.job.title} note={`${lab.requestSummary.categoryLabel} · ${lab.requestSummary.targetHours}`} />
          <MetricCard label="Budget band" value={lab.requestSummary.weeklyBudget} note={lab.job.client} />
          <MetricCard label="Shortlist depth" value={`${lab.candidates.length} profiles`} note={lab.requestSummary.shortlistNote} />
          <MetricCard label="Current leader" value={`${focus.talent.score} fit`} note={focus.confidence} />
        </section>

        <div className="match-lab__workspace">
          <aside className="match-lab__rail">
            <div className="match-lab__section-head">
              <span>Shortlist</span>
              <span>{lab.candidates.length} ranked</span>
            </div>

            <div className="match-lab__candidate-stack">
              {lab.candidates.map((candidate, index) => {
                const isFocus = candidate.talent.id === focus.talent.id;
                const isCompare = candidate.talent.id === compare.talent.id;

                return (
                  <article
                    className="match-lab__candidate-card"
                    data-compare={isCompare ? 'true' : 'false'}
                    data-focus={isFocus ? 'true' : 'false'}
                    key={candidate.talent.id}
                  >
                    <div className="match-lab__candidate-rank">0{index + 1}</div>

                    <div className="match-lab__candidate-main">
                      <div className="match-lab__candidate-head">
                        <div>
                          <h2>{candidate.talent.name}</h2>
                          <p>
                            {candidate.talent.title} · {candidate.talent.city}
                          </p>
                        </div>
                        <div className="match-lab__score-pill">{candidate.talent.score}</div>
                      </div>

                      <p className="match-lab__candidate-headline">{candidate.headline}</p>

                      <div className="match-lab__skill-row">
                        {candidate.talent.skills.slice(0, 3).map((skill) => (
                          <span className="match-lab__skill-chip" key={skill}>
                            {skill}
                          </span>
                        ))}
                      </div>

                      <div className="match-lab__candidate-actions">
                        <button
                          aria-pressed={isFocus}
                          className="match-lab__toggle"
                          onClick={() => onChooseFocus(candidate.talent.id)}
                          type="button"
                        >
                          Focus
                        </button>
                        <button
                          aria-pressed={isCompare}
                          className="match-lab__toggle match-lab__toggle--quiet"
                          onClick={() => onChooseCompare(candidate.talent.id)}
                          type="button"
                        >
                          Compare
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </aside>

          <main className="match-lab__board">
            <section className="match-lab__spotlights">
              <SpotlightCard candidate={focus} label="Focus candidate" variant="focus" />
              <SpotlightCard candidate={compare} label="Compare against" variant="compare" />
            </section>

            <section className="match-lab__panel-shell">
              <div className="match-lab__panel-head">
                <div>
                  <div className="match-lab__section-label">Decision view</div>
                  <h2>{panel === 'comparison' ? 'Score-by-score compare' : panel === 'interview' ? 'Live interview cues' : 'Launch readiness plan'}</h2>
                </div>

                <div className="match-lab__panel-switcher" role="tablist" aria-label="Match review panels">
                  {PANELS.map((option) => (
                    <button
                      aria-pressed={panel === option.id}
                      className="match-lab__toggle"
                      data-active={panel === option.id ? 'true' : 'false'}
                      key={option.id}
                      onClick={() => setPanel(option.id)}
                      type="button"
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {panel === 'comparison' ? (
                <ComparisonPanel axes={lab.axes} compare={compare} focus={focus} />
              ) : null}

              {panel === 'interview' ? (
                <InterviewPanel compare={compare} focus={focus} />
              ) : null}

              {panel === 'launch' ? (
                <LaunchPanel compare={compare} focus={focus} />
              ) : null}
            </section>
          </main>

          <aside className="match-lab__decision">
            <div className="match-lab__decision-card">
              <div className="match-lab__section-label">Decision recommendation</div>
              <h2>{focus.talent.name}</h2>
              <p>{focus.recommendation}</p>
              <div className="match-lab__decision-note">{focus.teamNote}</div>
            </div>

            <div className="match-lab__decision-card">
              <div className="match-lab__section-label">Proof to anchor on</div>
              <div className="match-lab__list">
                {focus.proofPoints.map((item) => (
                  <div className="match-lab__list-row" key={item.label}>
                    <strong>{item.label}</strong>
                    <span>{item.detail}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="match-lab__decision-card">
              <div className="match-lab__section-label">Next route handoff</div>
              <div className="match-lab__link-stack">
                <Link className="match-lab__inline-link" href={`/client/matches/${lab.job.id}`}>
                  <span>Return to client shortlist</span>
                  <ClientIcons.Arrow size={14} />
                </Link>
                <Link className="match-lab__inline-link" href="/client/requests">
                  <span>Open request backlog</span>
                  <ClientIcons.Arrow size={14} />
                </Link>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

function SpotlightCard({
  candidate,
  label,
  variant,
}: {
  candidate: ClientMatchLabCandidate;
  label: string;
  variant: 'focus' | 'compare';
}) {
  return (
    <article className="match-lab__spotlight" data-variant={variant}>
      <div className="match-lab__spotlight-head">
        <div>
          <div className="match-lab__section-label">{label}</div>
          <h2>{candidate.talent.name}</h2>
          <p>
            {candidate.talent.title} · {candidate.talent.timezone} · {candidate.talent.availability}
          </p>
        </div>
        <div className="match-lab__score-plate">
          <span>{candidate.talent.score}</span>
          <small>fit</small>
        </div>
      </div>

      <p className="match-lab__spotlight-copy">{candidate.headline}</p>

      <div className="match-lab__signal-grid">
        {candidate.signalCards.map((signal) => (
          <div className="match-lab__signal" data-tone={signal.tone} key={signal.label}>
            <span>{signal.label}</span>
            <strong>{signal.value}</strong>
            <small>{signal.note}</small>
          </div>
        ))}
      </div>

      <div className="match-lab__footnote">
        <span>{candidate.availabilityStart}</span>
        <span>{candidate.confidence}</span>
      </div>
    </article>
  );
}

function ComparisonPanel({
  axes,
  compare,
  focus,
}: {
  axes: ClientMatchLabAxis[];
  compare: ClientMatchLabCandidate;
  focus: ClientMatchLabCandidate;
}) {
  return (
    <div className="match-lab__compare-grid">
      {axes.map((axis) => {
        const focusValue = axis.values[focus.talent.id];
        const compareValue = axis.values[compare.talent.id];

        return (
          <article className="match-lab__axis" key={axis.label}>
            <div className="match-lab__axis-head">
              <h3>{axis.label}</h3>
              <span>{axis.max} max</span>
            </div>

            <div className="match-lab__axis-row">
              <ScoreBar candidate={focus} max={axis.max} value={focusValue} />
              <ScoreBar candidate={compare} max={axis.max} value={compareValue} />
            </div>
          </article>
        );
      })}
    </div>
  );
}

function InterviewPanel({ compare, focus }: { compare: ClientMatchLabCandidate; focus: ClientMatchLabCandidate }) {
  return (
    <div className="match-lab__dual-panels">
      <InsightColumn candidate={focus} title="Questions to ask" values={focus.interviewPrompts} />
      <InsightColumn candidate={compare} title="Questions to ask" values={compare.interviewPrompts} />

      <InsightColumn candidate={focus} title="Watchouts to pressure-test" values={focus.watchouts} />
      <InsightColumn candidate={compare} title="Watchouts to pressure-test" values={compare.watchouts} />
    </div>
  );
}

function LaunchPanel({ compare, focus }: { compare: ClientMatchLabCandidate; focus: ClientMatchLabCandidate }) {
  return (
    <div className="match-lab__dual-panels">
      <LaunchColumn candidate={focus} />
      <LaunchColumn candidate={compare} />
    </div>
  );
}

function LaunchColumn({ candidate }: { candidate: ClientMatchLabCandidate }) {
  return (
    <article className="match-lab__insight-card">
      <div className="match-lab__section-label">{candidate.talent.name}</div>
      <h3>First-week plan</h3>

      <div className="match-lab__timeline">
        {candidate.launchPlan.map((item) => (
          <div className="match-lab__timeline-row" key={item.label}>
            <strong>{item.label}</strong>
            <span>{item.detail}</span>
          </div>
        ))}
      </div>
    </article>
  );
}

function InsightColumn({
  candidate,
  title,
  values,
}: {
  candidate: ClientMatchLabCandidate;
  title: string;
  values: string[];
}) {
  return (
    <article className="match-lab__insight-card">
      <div className="match-lab__section-label">{candidate.talent.name}</div>
      <h3>{title}</h3>
      <ul className="match-lab__bullet-list">
        {values.map((value) => (
          <li key={value}>{value}</li>
        ))}
      </ul>
    </article>
  );
}

function ScoreBar({
  candidate,
  max,
  value,
}: {
  candidate: ClientMatchLabCandidate;
  max: number;
  value: { note: string; score: number };
}) {
  const width = `${Math.max(8, Math.round((value.score / max) * 100))}%`;

  return (
    <div className="match-lab__score-row">
      <div className="match-lab__score-row-head">
        <strong>{candidate.talent.name}</strong>
        <span>
          {value.score}/{max}
        </span>
      </div>
      <div className="match-lab__bar-track">
        <div className="match-lab__bar-fill" style={{ width }} />
      </div>
      <p>{value.note}</p>
    </div>
  );
}

function MetricCard({ label, note, value }: { label: string; note: string; value: string }) {
  return (
    <article className="match-lab__metric">
      <span>{label}</span>
      <strong>{value}</strong>
      <p>{note}</p>
    </article>
  );
}

function getCandidate(candidates: ClientMatchLabCandidate[], candidateId: string) {
  return candidates.find((candidate) => candidate.talent.id === candidateId) ?? candidates[0];
}

function getCompareCandidate(candidates: ClientMatchLabCandidate[], focusCandidateId: string, compareCandidateId: string) {
  return (
    candidates.find(
      (candidate) => candidate.talent.id === compareCandidateId && candidate.talent.id !== focusCandidateId,
    ) ??
    candidates.find((candidate) => candidate.talent.id !== focusCandidateId) ??
    candidates[0]
  );
}

function getAlternateCandidateId(candidates: ClientMatchLabCandidate[], excludedId: string) {
  return candidates.find((candidate) => candidate.talent.id !== excludedId)?.talent.id ?? excludedId;
}
