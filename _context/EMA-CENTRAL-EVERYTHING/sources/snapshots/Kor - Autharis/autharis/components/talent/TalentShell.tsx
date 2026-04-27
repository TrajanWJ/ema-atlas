import Link from "next/link";
import type { ReactNode } from "react";

import {
  talentEngagements,
  talentOpportunities,
  talentProfile,
} from "@/lib/talent/data";
import {
  BriefcaseIcon,
  ClockIcon,
  PulseIcon,
  SparklesIcon,
  UserIcon,
  WalletIcon,
} from "@/components/talent/TalentIcons";

type TalentSection = "profile" | "opportunities" | "engagements" | "timesheets" | "earnings";

type TalentShellProps = {
  active: TalentSection;
  children: ReactNode;
};

const navigation = [
  { id: "profile", href: "/talent", label: "Profile", icon: UserIcon, meta: "Bio, focus, skills" },
  {
    id: "opportunities",
    href: "/talent/opportunities",
    label: "Opportunities",
    icon: SparklesIcon,
    meta: `${talentOpportunities.length} curated matches`,
  },
  {
    id: "engagements",
    href: "/talent/engagements",
    label: "Engagements",
    icon: BriefcaseIcon,
    meta: `${talentEngagements.length} live placements`,
  },
  { id: "timesheets", href: "/talent/timesheets", label: "Timesheets", icon: ClockIcon, meta: "Current week + history" },
  { id: "earnings", href: "/talent/earnings", label: "Earnings", icon: WalletIcon, meta: "Payouts and invoices" },
] as const;

export function TalentShell({ active, children }: TalentShellProps) {
  return (
    <div className="talent-route">
      <div className="talent-shell">
        <aside className="talent-sidebar">
          <div className="talent-sidebar__brand">
            <div className="talent-sidebar__eyebrow">Autharis Talent Desk</div>
            <div className="talent-sidebar__identity">
              <div className="talent-sidebar__avatar">{talentProfile.initials}</div>
              <div>
                <h1>{talentProfile.name}</h1>
                <p>{talentProfile.title}</p>
              </div>
            </div>
          </div>

          <section className="talent-sidebar__score">
            <div>
              <div className="talent-sidebar__eyebrow">Match signal</div>
              <div className="talent-sidebar__scoreValue">{talentProfile.fitAverage}</div>
              <p>Average fit score across current shortlist and active work.</p>
            </div>
            <div className="talent-sidebar__scoreMeta">
              <span>{talentProfile.city}</span>
              <span>{talentProfile.weeklyAvailability} hrs/week</span>
              <span>{talentProfile.status}</span>
            </div>
          </section>

          <nav className="talent-sidebar__nav" aria-label="Talent navigation">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = item.id === active;

              return (
                <Link
                  aria-current={isActive ? "page" : undefined}
                  className="talent-navLink"
                  data-active={isActive}
                  href={item.href}
                  key={item.id}
                >
                  <span className="talent-navLink__icon">
                    <Icon size={16} />
                  </span>
                  <span className="talent-navLink__copy">
                    <strong>{item.label}</strong>
                    <span>{item.meta}</span>
                  </span>
                </Link>
              );
            })}
          </nav>

          <section className="talent-sidebar__note">
            <div className="talent-sidebar__eyebrow">Current focus</div>
            <p>{talentProfile.focus}</p>
            <div className="talent-sidebar__pillRow">
              <span className="chip chip-accent">
                <PulseIcon size={14} />
                Reliable approval history
              </span>
            </div>
          </section>
        </aside>

        <main className="talent-main">{children}</main>
      </div>
    </div>
  );
}
