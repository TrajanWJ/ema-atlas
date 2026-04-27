import { TalentShell } from "@/components/talent/TalentShell";
import { ArrowRightIcon, ChevronRightIcon } from "@/components/talent/TalentIcons";
import { formatCurrency, talentOpportunities } from "@/lib/talent/data";

export default function TalentOpportunitiesPage() {
  return (
    <TalentShell active="opportunities">
      <section className="paper talent-hero talent-hero--compact">
        <div className="talent-hero__copy">
          <div className="talent-breadcrumbs">
            <span>Talent</span>
            <ChevronRightIcon size={12} />
            <span>Opportunities</span>
          </div>
          <h2>Curated roles, ranked for actual overlap.</h2>
          <p>
            Each brief below is surfaced because the role shape, hours, and category fit your
            working profile.
          </p>
        </div>
      </section>

      <section className="talent-stack">
        {talentOpportunities.map((opportunity) => (
          <article className="paper talent-opportunityCard" key={opportunity.id}>
            <div className="talent-opportunityCard__score">
              <span>Fit</span>
              <strong>{opportunity.matchScore}</strong>
            </div>

            <div className="talent-opportunityCard__body">
              <div className="talent-opportunityCard__meta">
                <span className="badge">{opportunity.category}</span>
                <span>{opportunity.posted}</span>
              </div>
              <h3>{opportunity.title}</h3>
              <p className="talent-muted">
                {opportunity.client} · {opportunity.hoursPerWeek} hrs/week · {opportunity.duration} ·{" "}
                {formatCurrency(opportunity.budgetRange[0])} - {formatCurrency(opportunity.budgetRange[1])}/hr
              </p>
              <p>{opportunity.rationale}</p>
              <div className="talent-chipRow">
                {opportunity.skills.map((skill) => (
                  <span className="chip" key={skill}>
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            <div className="talent-opportunityCard__actions">
              <div className="talent-noteCard">
                <strong>{opportunity.format}</strong>
                <span>{opportunity.timezone}</span>
              </div>
              <div className="talent-inlineActions">
                <button className="btn btn-ghost" type="button">
                  Not now
                </button>
                <button className="btn btn-primary" type="button">
                  Express interest
                  <ArrowRightIcon size={14} />
                </button>
              </div>
            </div>
          </article>
        ))}
      </section>
    </TalentShell>
  );
}
