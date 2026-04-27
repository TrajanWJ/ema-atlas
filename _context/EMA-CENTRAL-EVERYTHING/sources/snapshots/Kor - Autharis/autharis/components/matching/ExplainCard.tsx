import { Badge } from '@/components/ui/Badge';
import { Pill } from '@/components/ui/Pill';
import type { RankedMatch } from '@/lib/matching';

import styles from './ExplainCard.module.css';

type ExplainCardProps = {
  match: RankedMatch;
  requestLabel?: string;
  className?: string;
};

const CONFIDENCE_TONE = {
  High: 'accent',
  Low: 'outline',
  Medium: 'default',
} as const;

export function ExplainCard({
  match,
  requestLabel,
  className = '',
}: ExplainCardProps) {
  const classes = [styles.card, className].filter(Boolean).join(' ');

  return (
    <article className={classes}>
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>
            Rank #{match.rank}
            {requestLabel ? ` · ${requestLabel}` : ''}
          </p>
          <h3 className={styles.name}>{match.talent.name}</h3>
          <p className={styles.meta}>
            {match.talent.title} · {match.talent.city} ({match.talent.timezone}) · $
            {match.talent.rate}/hr · {match.talent.availability}
          </p>
        </div>

        <div className={styles.scoreBlock}>
          <div className={styles.scoreValue}>
            <span className={styles.scoreNumber}>{match.score.total}</span>
            <span className={styles.scoreSuffix}>/100</span>
          </div>
          <Badge tone={CONFIDENCE_TONE[match.score.confidence]}>
            {match.score.confidence} confidence
          </Badge>
        </div>
      </header>

      <p className={styles.summary}>{match.score.summary}</p>

      <section className={styles.section} aria-labelledby={`${match.talent.id}-skills`}>
        <h4 className={styles.sectionTitle} id={`${match.talent.id}-skills`}>
          Requested skill coverage
        </h4>
        <div className={styles.chipRow}>
          {match.score.matchedSkills.map((skill) => (
            <Pill key={skill} tone="accent">
              {skill}
            </Pill>
          ))}
          {match.score.missingSkills.map((skill) => (
            <Pill key={skill} tone="quiet">
              Missing: {skill}
            </Pill>
          ))}
          {match.score.matchedSkills.length === 0 && match.score.missingSkills.length === 0 ? (
            <Pill tone="quiet">No required skills supplied</Pill>
          ) : null}
        </div>
      </section>

      <section className={styles.section} aria-labelledby={`${match.talent.id}-breakdown`}>
        <h4 className={styles.sectionTitle} id={`${match.talent.id}-breakdown`}>
          Score breakdown
        </h4>
        <div className={styles.breakdownList}>
          {match.score.breakdown.map((item) => (
            <div className={styles.breakdownItem} key={item.key}>
              <div className={styles.breakdownHead}>
                <span>{item.label}</span>
                <strong>
                  {item.score}/{item.max}
                </strong>
              </div>
              <div className={styles.breakdownTrack}>
                <span
                  className={styles.breakdownFill}
                  style={{ width: `${(item.score / item.max) * 100}%` }}
                />
              </div>
              <p className={styles.breakdownReason}>{item.reason}</p>
            </div>
          ))}
        </div>
      </section>

      <section className={styles.section} aria-labelledby={`${match.talent.id}-signals`}>
        <h4 className={styles.sectionTitle} id={`${match.talent.id}-signals`}>
          Key signals
        </h4>
        <ul className={styles.list}>
          {match.score.strengths.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <section className={styles.section} aria-labelledby={`${match.talent.id}-watchouts`}>
        <h4 className={styles.sectionTitle} id={`${match.talent.id}-watchouts`}>
          Watchouts
        </h4>
        <ul className={styles.list}>
          {match.score.watchouts.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>
    </article>
  );
}
