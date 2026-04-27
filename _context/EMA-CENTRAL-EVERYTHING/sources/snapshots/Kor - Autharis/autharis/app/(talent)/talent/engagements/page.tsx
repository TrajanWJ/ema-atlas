import { TalentShell } from "@/components/talent/TalentShell";
import { ChevronRightIcon } from "@/components/talent/TalentIcons";
import { formatCurrency, talentEngagements } from "@/lib/talent/data";

export default function TalentEngagementsPage() {
  return (
    <TalentShell active="engagements">
      <section className="paper talent-hero talent-hero--compact">
        <div className="talent-hero__copy">
          <div className="talent-breadcrumbs">
            <span>Talent</span>
            <ChevronRightIcon size={12} />
            <span>Engagements</span>
          </div>
          <h2>Everything live, with enough context to keep the week moving.</h2>
          <p>
            Active work is organized around hours, client relationship health, and the next
            concrete milestone.
          </p>
        </div>
      </section>

      <section className="talent-stack">
        {talentEngagements.map((engagement) => (
          <article className="paper talent-engagementCard" key={engagement.id}>
            <div className="talent-engagementCard__head">
              <div>
                <div className="eyebrow">{engagement.client}</div>
                <h3>{engagement.role}</h3>
                <p className="talent-muted">
                  Started {engagement.started} · {formatCurrency(engagement.rate)}/hr
                </p>
              </div>
              <span
                className={`status ${engagement.status === "active" ? "status-active" : "status-review"}`}
              >
                {engagement.status === "active" ? "Active" : "In review"}
              </span>
            </div>

            <div className="talent-engagementMetrics">
              <div className="talent-metricCard">
                <span>This week</span>
                <strong>{engagement.weeklyHours} hrs</strong>
                <p>Current pace against the active brief.</p>
              </div>
              <div className="talent-metricCard">
                <span>Approved</span>
                <strong>{engagement.approvedHours} hrs</strong>
                <p>Historical hours already cleared for payout.</p>
              </div>
              <div className="talent-metricCard">
                <span>Pending</span>
                <strong>{engagement.pendingHours} hrs</strong>
                <p>Awaiting the client&apos;s approval pass.</p>
              </div>
            </div>

            <div className="talent-engagementFoot">
              <div className="talent-noteCard">
                <strong>Next milestone</strong>
                <span>{engagement.nextMilestone}</span>
              </div>
              <div className="talent-noteCard">
                <strong>Relationship lead</strong>
                <span>{engagement.relationshipLead}</span>
              </div>
              <div className="talent-chipRow">
                {engagement.deliverables.map((deliverable) => (
                  <span className="chip" key={deliverable}>
                    {deliverable}
                  </span>
                ))}
              </div>
            </div>
          </article>
        ))}
      </section>
    </TalentShell>
  );
}
