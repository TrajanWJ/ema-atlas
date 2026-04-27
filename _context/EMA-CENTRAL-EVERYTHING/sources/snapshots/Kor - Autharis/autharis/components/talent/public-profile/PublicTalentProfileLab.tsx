import Link from "next/link";

import {
  ArrowRightIcon,
  BriefcaseIcon,
  CheckIcon,
  ClockIcon,
  PulseIcon,
  SparklesIcon,
  UserIcon,
} from "@/components/talent/TalentIcons";
import {
  publicProfileAvailability,
  publicProfileMetrics,
  talentPublicProfile,
} from "@/lib/talent-profile/data";

export function PublicTalentProfileLab() {
  return (
    <div className="talent-public-page">
      <section className="talent-public-hero">
        <div className="talent-public-heroCopy">
          <div className="talent-public-kicker">
            <span className="badge badge-outline">Lab route</span>
            <span className="badge badge-ink">Shareable dossier</span>
          </div>

          <div className="talent-public-identity">
            <div className="talent-public-avatar">{talentPublicProfile.initials}</div>
            <div>
              <p className="talent-public-overline">Autharis Talent Dossier</p>
              <h1>{talentPublicProfile.name}</h1>
              <p className="talent-public-title">{talentPublicProfile.publicTitle}</p>
            </div>
          </div>

          <p className="talent-public-summary">{talentPublicProfile.summary}</p>

          <div className="talent-public-chipRow" aria-label="Profile facts">
            <span className="chip chip-accent">
              <PulseIcon size={14} />
              {talentPublicProfile.fitSignal}
            </span>
            <span className="chip">
              <ClockIcon size={14} />
              {talentPublicProfile.availabilityLine}
            </span>
            <span className="chip">
              <BriefcaseIcon size={14} />
              {talentPublicProfile.location}
            </span>
          </div>

          <div className="talent-public-actions">
            <a
              className="btn btn-primary"
              href="mailto:intros@autharis.co?subject=Intro%20request%20for%20Amara%20Okafor"
            >
              Request intro
              <ArrowRightIcon size={15} />
            </a>
            <Link className="btn btn-ghost" href="/talent">
              View internal talent desk
            </Link>
          </div>
        </div>

        <aside className="talent-public-shareCard">
          <div className="talent-public-shareHead">
            <div>
              <div className="talent-public-overline">Public profile preview</div>
              <h2>Ready to send as a shortlist link.</h2>
            </div>
            <span className="status status-active">{talentPublicProfile.status}</span>
          </div>

          <dl className="talent-public-shareMeta">
            <div>
              <dt>Dossier ID</dt>
              <dd>{talentPublicProfile.dossierId}</dd>
            </div>
            <div>
              <dt>Updated</dt>
              <dd>{talentPublicProfile.updatedAt}</dd>
            </div>
            <div>
              <dt>Rate</dt>
              <dd>{talentPublicProfile.rate}</dd>
            </div>
            <div>
              <dt>Response</dt>
              <dd>{talentPublicProfile.responseTime}</dd>
            </div>
          </dl>

          <div className="talent-public-note">
            <SparklesIcon size={16} />
            <p>
              The public view keeps the operator story, fit signal, and proof of work visible
              without exposing the internal editing surface.
            </p>
          </div>
        </aside>
      </section>

      <div className="talent-public-grid">
        <section className="talent-public-panel">
          <div className="talent-public-panelHead">
            <div>
              <p className="talent-public-overline">Why teams book her</p>
              <h2>Operational calm with visible follow-through.</h2>
            </div>
          </div>

          <div className="talent-public-metrics">
            {publicProfileMetrics.map((metric) => (
              <article className="talent-public-metricCard" key={metric.label}>
                <span>{metric.label}</span>
                <strong>{metric.value}</strong>
                <p>{metric.detail}</p>
              </article>
            ))}
          </div>

          <div className="talent-public-copyBlock">
            <p>{talentPublicProfile.bio}</p>
            {talentPublicProfile.introPoints.map((point) => (
              <div className="talent-public-inlineCheck" key={point}>
                <CheckIcon size={15} />
                <span>{point}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="talent-public-panel">
          <div className="talent-public-panelHead">
            <div>
              <p className="talent-public-overline">Practice areas</p>
              <h2>Where she plugs in fastest.</h2>
            </div>
          </div>

          <div className="talent-public-practiceGrid">
            {talentPublicProfile.practiceAreas.map((area) => (
              <article className="talent-public-practiceCard" key={area.label}>
                <div className="talent-public-iconBadge">
                  <UserIcon size={16} />
                </div>
                <div>
                  <h3>{area.label}</h3>
                  <p>{area.blurb}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="talent-public-panel">
          <div className="talent-public-panelHead">
            <div>
              <p className="talent-public-overline">Recent proof</p>
              <h2>Client work that reads like operator evidence.</h2>
            </div>
          </div>

          <div className="talent-public-proofStack">
            {talentPublicProfile.recentProof.map((proof) => (
              <article className="talent-public-proofCard" key={`${proof.client}-${proof.role}`}>
                <div className="talent-public-proofHead">
                  <div>
                    <h3>{proof.client}</h3>
                    <p>{proof.role}</p>
                  </div>
                  <span className="badge badge-outline">{proof.detail}</span>
                </div>
                <p className="talent-public-proofCadence">{proof.cadence}</p>
                <ul>
                  {proof.deliverables.map((deliverable) => (
                    <li key={deliverable}>{deliverable}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </section>

        <section className="talent-public-panel talent-public-panel--stacked">
          <div className="talent-public-panelHead">
            <div>
              <p className="talent-public-overline">Working style</p>
              <h2>How she keeps a brief steady.</h2>
            </div>
          </div>

          <div className="talent-public-listBlock">
            <h3>Operating principles</h3>
            <ul className="talent-public-list">
              {talentPublicProfile.principles.map((principle) => (
                <li key={principle}>{principle}</li>
              ))}
            </ul>
          </div>

          <div className="talent-public-listBlock">
            <h3>Useful artifacts</h3>
            <ul className="talent-public-list">
              {talentPublicProfile.artifacts.map((artifact) => (
                <li key={artifact}>{artifact}</li>
              ))}
            </ul>
          </div>

          <div className="talent-public-listBlock">
            <h3>Toolbelt</h3>
            <div className="talent-public-pillGrid">
              {talentPublicProfile.toolbelt.map((skill) => (
                <span className="chip" key={skill}>
                  {skill}
                </span>
              ))}
            </div>
          </div>
        </section>

        <section className="talent-public-panel">
          <div className="talent-public-panelHead">
            <div>
              <p className="talent-public-overline">Current fit signals</p>
              <h2>The kinds of briefs lining up right now.</h2>
            </div>
          </div>

          <div className="talent-public-opportunityList">
            {talentPublicProfile.opportunitySignals.map((signal) => (
              <article className="talent-public-opportunityCard" key={`${signal.client}-${signal.title}`}>
                <div className="talent-public-opportunityHead">
                  <div>
                    <h3>{signal.title}</h3>
                    <p>{signal.client}</p>
                  </div>
                  <SparklesIcon size={17} />
                </div>
                <p>{signal.rationale}</p>
                <span>{signal.format}</span>
              </article>
            ))}
          </div>
        </section>

        <section className="talent-public-panel talent-public-panel--stacked">
          <div className="talent-public-panelHead">
            <div>
              <p className="talent-public-overline">Availability and references</p>
              <h2>Everything needed before a warm intro.</h2>
            </div>
          </div>

          <div className="talent-public-availability">
            {publicProfileAvailability.map((item) => (
              <article className="talent-public-availabilityCard" key={item.label}>
                <span>{item.label}</span>
                <strong>{item.detail}</strong>
              </article>
            ))}
          </div>

          <div className="talent-public-listBlock">
            <h3>Reference package</h3>
            <ul className="talent-public-list">
              {talentPublicProfile.references.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </section>
      </div>
    </div>
  );
}

