import Link from "next/link";

import { SiteShell } from "@/components/site-shell";

import { VAppGroup, statusLabel, vapps } from "./_data";

const groupOrder: { key: VAppGroup; label: string; blurb: string }[] = [
  {
    key: "vapp",
    label: "vApps",
    blurb:
      "Virtual apps that render inside the EMA shell. Each owns no canonical state; each draws from one or more state planes (control / runtime / collab / workspace).",
  },
  {
    key: "shell",
    label: "Top-level shells",
    blurb:
      "Launchpad, HQ, and Virtual Desktop are not vApps proper — they are the surfaces that host vApps. Listed here so the eight named app surfaces stay together.",
  },
];

export default function VAppsPage() {
  const counts = {
    total: vapps.length,
    vapp: vapps.filter((v) => v.group === "vapp").length,
    shell: vapps.filter((v) => v.group === "shell").length,
    planned: vapps.filter((v) => v.status === "planned").length,
  };

  return (
    <SiteShell
      eyebrow="App Model"
      title="Eight named surfaces, one inhabited place"
      intro="The vApps and shells named in 05-fresh-context-project-app-model.md and the GLOSSARY. Each carries a smallest-provable-slice question so the order we ship in stays an argument, not a default."
    >
      <section className="section-grid">
        <article className="panel panel--hero">
          <p className="panel__tag">Stage / Naming</p>
          <h2 className="panel__title">
            Surfaces don&apos;t own state. Naming the surfaces makes that easier to enforce.
          </h2>
          <p className="panel__lede">
            Each card below answers the pressure-check from{" "}
            <code>howto/add-a-vapp.md</code>: which Part(s) of EMA it
            expresses, and what the smallest slice would be if we built it
            first. Briefs live under <code>content/vapps/</code>.
          </p>
          <div className="stat-ribbon">
            <div className="stat">
              <span className="stat__value">{counts.total}</span>
              <span>Named surfaces</span>
            </div>
            <div className="stat">
              <span className="stat__value">{counts.vapp}</span>
              <span>vApps proper</span>
            </div>
            <div className="stat">
              <span className="stat__value">{counts.shell}</span>
              <span>Top-level shells</span>
            </div>
            <div className="stat">
              <span className="stat__value">{counts.planned}</span>
              <span>Planned today</span>
            </div>
          </div>
          <div className="panel__actions">
            <Link className="chip" href="/parts">
              Parts
            </Link>
            <Link className="chip" href="/questions">
              Open Questions
            </Link>
            <Link className="chip" href="/research">
              Research
            </Link>
          </div>
        </article>
      </section>

      {groupOrder.map((group) => {
        const items = vapps.filter((v) => v.group === group.key);
        return (
          <section key={group.key}>
            <div className="panel">
              <p className="panel__tag">{group.label}</p>
              <h2 className="panel__title">{items.length} surface{items.length === 1 ? "" : "s"}</h2>
              <p className="panel__lede">{group.blurb}</p>
            </div>
            <div className="card-grid">
              {items.map((v) => (
                <article className="panel vapp-card" key={v.slug}>
                  <div className="vapp-card__head">
                    <p className="list__eyebrow">{group.key === "vapp" ? "vApp" : "Shell"}</p>
                    <span className={`vapp-card__status vapp-card__status--${v.status}`}>
                      {statusLabel(v.status)}
                    </span>
                  </div>
                  <h3 className="list__title">
                    <Link href={`/vapps/${v.slug}`}>{v.name}</Link>
                  </h3>
                  <p className="list__copy">{v.oneLiner}</p>
                  <div>
                    <span className="panel__label">Expresses Part(s)</span>
                    <ul className="inline-list">
                      {v.parts.map((p) => (
                        <li key={p}>{p}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <span className="panel__label">Smallest provable slice</span>
                    <p className="list__copy">{v.smallestSlice}</p>
                  </div>
                </article>
              ))}
            </div>
          </section>
        );
      })}
    </SiteShell>
  );
}
