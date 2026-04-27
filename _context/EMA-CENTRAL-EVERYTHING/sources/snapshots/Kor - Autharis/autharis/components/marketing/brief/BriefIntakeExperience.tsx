"use client";

import Link from "next/link";
import { useState } from "react";
import styles from "./brief-intake-experience.module.css";
import { briefIntakeContent, buildBriefPreview } from "@/lib/marketing/brief";

function Wordmark() {
  return (
    <div className={styles.wordmark}>
      <span className={styles.wordmarkGlyph} aria-hidden="true">
        <svg viewBox="0 0 36 36" role="presentation">
          <rect x="1" y="1" width="34" height="34" rx="10" />
          <circle cx="18" cy="18" r="10.5" className={styles.wordmarkRing} />
          <path d="M18 18V8.5" className={styles.wordmarkHandPrimary} />
          <path d="M18 18 25 22" className={styles.wordmarkHandSecondary} />
          <circle cx="18" cy="18" r="1.9" className={styles.wordmarkPin} />
        </svg>
      </span>
      <span className={styles.wordmarkText}>Autharis</span>
    </div>
  );
}

export function BriefIntakeExperience() {
  const [scenarioId, setScenarioId] = useState(
    briefIntakeContent.scenarios[0].id,
  );
  const [stageId, setStageId] = useState(briefIntakeContent.stages[0].id);
  const [coverageId, setCoverageId] = useState(
    briefIntakeContent.coverages[1].id,
  );
  const [priorityIds, setPriorityIds] = useState<string[]>([
    briefIntakeContent.priorities[0].id,
    briefIntakeContent.priorities[3].id,
  ]);

  const preview = buildBriefPreview({
    scenarioId,
    stageId,
    coverageId,
    priorityIds,
  });

  function togglePriority(priorityId: string) {
    setPriorityIds((current) => {
      if (current.includes(priorityId)) {
        if (current.length === 1) {
          return current;
        }

        return current.filter((item) => item !== priorityId);
      }

      if (current.length === 3) {
        return [...current.slice(1), priorityId];
      }

      return [...current, priorityId];
    });
  }

  return (
    <main className={styles.surface}>
      <section className={styles.heroSection}>
        <div className={styles.heroBackdrop} aria-hidden="true" />
        <header className={styles.masthead}>
          <Wordmark />
          <nav className={styles.nav} aria-label="Brief demo links">
            <Link href="/marketing">Marketing</Link>
            <a href="#builder">Builder</a>
            <a href="#preview">Preview</a>
          </nav>
          <div className={styles.headerActions}>
            <Link className={styles.secondaryAction} href="/marketing">
              Back to editorial surface
            </Link>
            <a className={styles.primaryAction} href="#builder">
              Start the demo
            </a>
          </div>
        </header>

        <div className={styles.heroGrid}>
          <div className={styles.heroCopy}>
            <p className={styles.eyebrow}>{briefIntakeContent.hero.eyebrow}</p>
            <h1>{briefIntakeContent.hero.title}</h1>
            <p className={styles.heroLead}>{briefIntakeContent.hero.lead}</p>
            <p className={styles.heroSupport}>{briefIntakeContent.hero.support}</p>

            <ul className={styles.principles}>
              {briefIntakeContent.principles.map((principle) => (
                <li key={principle}>{principle}</li>
              ))}
            </ul>
          </div>

          <aside className={styles.heroCard}>
            <p className={styles.panelKicker}>Current sample</p>
            <h2>{preview.scenario.title}</h2>
            <p>{preview.scenario.summary}</p>
            <dl className={styles.snapshotGrid}>
              <div>
                <dt>Expected weekly hours</dt>
                <dd>{preview.coverage.label}</dd>
              </div>
              <div>
                <dt>Match window</dt>
                <dd>{preview.scenario.matchWindow}</dd>
              </div>
              <div>
                <dt>Operator profile</dt>
                <dd>{preview.scenario.operatorProfile}</dd>
              </div>
              <div>
                <dt>Review cadence</dt>
                <dd>{preview.scenario.approvalCadence}</dd>
              </div>
            </dl>
          </aside>
        </div>
      </section>

      <section className={styles.storyBand}>
        {briefIntakeContent.trustNotes.map((note) => (
          <article key={note.title} className={styles.storyCard}>
            <p className={styles.panelKicker}>{note.title}</p>
            <p>{note.detail}</p>
          </article>
        ))}
      </section>

      <section id="builder" className={styles.builderSection}>
        <div className={styles.sectionHeading}>
          <div>
            <p className={styles.sectionIndex}>01 / Shape the request</p>
            <h2>Choose the kind of workflow that actually needs the human layer.</h2>
          </div>
          <p>
            The interaction below is intentionally editorial rather than form-heavy.
            It frames the intake around trust signals, systems, and reviewability.
          </p>
        </div>

        <div className={styles.scenarioGrid}>
          {briefIntakeContent.scenarios.map((scenario) => {
            const isActive = scenario.id === scenarioId;

            return (
              <button
                key={scenario.id}
                type="button"
                className={isActive ? styles.scenarioCardActive : styles.scenarioCard}
                onClick={() => setScenarioId(scenario.id)}
              >
                <p className={styles.panelKicker}>{scenario.eyebrow}</p>
                <h3>{scenario.title}</h3>
                <p>{scenario.summary}</p>
                <span>{scenario.matchWindow}</span>
              </button>
            );
          })}
        </div>

        <div className={styles.builderGrid}>
          <div className={styles.controlsColumn}>
            <section className={styles.controlPanel}>
              <div className={styles.controlHeader}>
                <p className={styles.sectionIndex}>02 / Team context</p>
                <h3>What kind of moment is this for the client team?</h3>
              </div>
              <div className={styles.choiceStack}>
                {briefIntakeContent.stages.map((stage) => {
                  const isActive = stage.id === stageId;

                  return (
                    <button
                      key={stage.id}
                      type="button"
                      className={isActive ? styles.choiceCardActive : styles.choiceCard}
                      onClick={() => setStageId(stage.id)}
                    >
                      <strong>{stage.label}</strong>
                      <span>{stage.note}</span>
                    </button>
                  );
                })}
              </div>
            </section>

            <section className={styles.controlPanel}>
              <div className={styles.controlHeader}>
                <p className={styles.sectionIndex}>03 / Coverage</p>
                <h3>Set the weekly shape before you set the shortlist.</h3>
              </div>
              <div className={styles.choiceStack}>
                {briefIntakeContent.coverages.map((coverage) => {
                  const isActive = coverage.id === coverageId;

                  return (
                    <button
                      key={coverage.id}
                      type="button"
                      className={isActive ? styles.choiceCardActive : styles.choiceCard}
                      onClick={() => setCoverageId(coverage.id)}
                    >
                      <strong>{coverage.label}</strong>
                      <span>{coverage.note}</span>
                    </button>
                  );
                })}
              </div>
            </section>

            <section className={styles.controlPanel}>
              <div className={styles.controlHeader}>
                <p className={styles.sectionIndex}>04 / Priorities</p>
                <h3>Pick up to three signals the operator needs to protect.</h3>
              </div>
              <div className={styles.priorityGrid}>
                {briefIntakeContent.priorities.map((priority) => {
                  const isActive = priorityIds.includes(priority.id);

                  return (
                    <button
                      key={priority.id}
                      type="button"
                      className={isActive ? styles.priorityChipActive : styles.priorityChip}
                      onClick={() => togglePriority(priority.id)}
                      aria-pressed={isActive}
                    >
                      <strong>{priority.label}</strong>
                      <span>{priority.detail}</span>
                    </button>
                  );
                })}
              </div>
            </section>
          </div>

          <aside id="preview" className={styles.previewColumn}>
            <section className={styles.previewCard}>
              <div className={styles.previewHeader}>
                <div>
                  <p className={styles.panelKicker}>Generated brief preview</p>
                  <h3>{preview.briefLabel}</h3>
                </div>
                <span className={styles.previewBadge}>Demo only</span>
              </div>

              <p className={styles.previewSummary}>{preview.summary}</p>

              <div className={styles.previewMeta}>
                <div>
                  <span>Coverage</span>
                  <strong>{preview.coverage.label}</strong>
                </div>
                <div>
                  <span>Shortlist target</span>
                  <strong>{preview.scenario.matchWindow}</strong>
                </div>
                <div>
                  <span>Approval cadence</span>
                  <strong>{preview.scenario.approvalCadence}</strong>
                </div>
              </div>

              <div className={styles.previewBlock}>
                <p className={styles.blockLabel}>Operator focus</p>
                <p>{preview.shortlistHeadline}</p>
              </div>

              <div className={styles.columns}>
                <div className={styles.previewBlock}>
                  <p className={styles.blockLabel}>Systems in scope</p>
                  <ul className={styles.list}>
                    {preview.scenario.systems.map((system) => (
                      <li key={system}>{system}</li>
                    ))}
                  </ul>
                </div>

                <div className={styles.previewBlock}>
                  <p className={styles.blockLabel}>First deliverables</p>
                  <ul className={styles.list}>
                    {preview.scenario.deliverables.map((deliverable) => (
                      <li key={deliverable}>{deliverable}</li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className={styles.previewBlock}>
                <p className={styles.blockLabel}>Intake checklist</p>
                <ul className={styles.list}>
                  {preview.intakeChecklist.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>

              <div className={styles.previewBlock}>
                <p className={styles.blockLabel}>Signals Autharis would screen for</p>
                <ul className={styles.list}>
                  {preview.scenario.operatorSignals.map((signal) => (
                    <li key={signal}>{signal}</li>
                  ))}
                </ul>
              </div>
            </section>
          </aside>
        </div>
      </section>

      <section className={styles.timelineSection}>
        <div className={styles.sectionHeading}>
          <div>
            <p className={styles.sectionIndex}>05 / First-week shape</p>
            <h2>Show the client what the operating rhythm looks like before work begins.</h2>
          </div>
          <p>
            This keeps the demo grounded in actions, not just aesthetics: what gets
            reviewed, when, and where the operator should escalate.
          </p>
        </div>

        <div className={styles.timelineGrid}>
          {preview.scenario.timeline.map((step) => (
            <article key={step.label} className={styles.timelineCard}>
              <p className={styles.panelKicker}>{step.label}</p>
              <p>{step.detail}</p>
            </article>
          ))}
        </div>

        <div className={styles.bottomGrid}>
          <article className={styles.noteCard}>
            <p className={styles.panelKicker}>Watchouts</p>
            <ul className={styles.list}>
              {preview.scenario.watchouts.map((watchout) => (
                <li key={watchout}>{watchout}</li>
              ))}
            </ul>
          </article>

          <article className={styles.noteCard}>
            <p className={styles.panelKicker}>Why this flow is useful</p>
            <p>
              It gives sales, product, and operations a single object to react to:
              a brief that is specific enough to match against, but calm enough to
              feel client-ready.
            </p>
          </article>
        </div>
      </section>
    </main>
  );
}
