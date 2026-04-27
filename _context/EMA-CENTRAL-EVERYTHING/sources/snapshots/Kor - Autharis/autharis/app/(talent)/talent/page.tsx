import { TalentProfileEditor } from "@/components/talent/TalentProfileEditor";
import { TalentShell } from "@/components/talent/TalentShell";
import { ChevronRightIcon } from "@/components/talent/TalentIcons";
import { talentMatchSignals } from "@/lib/talent/data";

export default function TalentProfilePage() {
  return (
    <TalentShell active="profile">
      <section className="paper talent-hero">
        <div className="talent-hero__copy">
          <div className="talent-breadcrumbs">
            <span>Talent</span>
            <ChevronRightIcon size={12} />
            <span>Profile</span>
          </div>
          <h2>Your profile should read like a calm operator, not a keyword dump.</h2>
          <p>
            Autharis uses this page to understand the work you already do well and the work
            you want next. Both signals need to stay visible.
          </p>
        </div>
        <div className="talent-hero__rail">
          <div className="eyebrow">What matching looks for</div>
          <ul className="talent-heroList">
            {talentMatchSignals.map((signal) => (
              <li key={signal}>{signal}</li>
            ))}
          </ul>
        </div>
      </section>

      <TalentProfileEditor />
    </TalentShell>
  );
}
