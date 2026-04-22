import Link from "next/link";

import { SiteShell } from "@/components/site-shell";

type VAppStatus = "planned" | "sketched" | "partial" | "shipped";
type VAppGroup = "vapp" | "shell";

type VAppEntry = {
  slug: string;
  name: string;
  group: VAppGroup;
  oneLiner: string;
  parts: string[];
  smallestSlice: string;
  status: VAppStatus;
};

/**
 * Source: 05-fresh-context-project-app-model.md (named app surfaces)
 * + GLOSSARY.md vApp / Launchpad / HQ / Virtual Desktop entries.
 *
 * Launchpad / HQ / Virtual Desktop are top-level *shells*, not vApps proper.
 */
const vapps: VAppEntry[] = [
  {
    slug: "wiki",
    name: "Wiki",
    group: "vapp",
    oneLiner:
      "Semantic-layer surface — Google Docs + Discord + Wikipedia + Obsidian feel, with inline comment, edit, and prompt.",
    parts: ["Semantic Layer / Knowledge System", "Shared Workspace"],
    smallestSlice:
      "A read-only renderer over content/briefs/*.md and the GLOSSARY, with inline-prompt stubs that open Chat with the selection as context.",
    status: "planned",
  },
  {
    slug: "chat",
    name: "Chat",
    group: "vapp",
    oneLiner:
      "EMA-native interface to local and hosted models — what Claude.ai, Codex, and Hermes-CLI each are individually, combined and tenanted.",
    parts: ["Harness / Execution Fabric", "Authority / Control Plane"],
    smallestSlice:
      "Single-driver (hermes-native) chat with one tool, one provider, and a chronicle pane wired to the control-plane event log. Smallest end-to-end proof of the canonical rule.",
    status: "planned",
  },
  {
    slug: "threads-server",
    name: "Threads / Server",
    group: "vapp",
    oneLiner:
      "EMA-native replacement for Discord channels-and-threads, mirrored back to Discord by webhook during migration.",
    parts: ["Shared Workspace", "Identity / Org / Project / Space"],
    smallestSlice:
      "Single-channel, read-only mirror of one Discord channel rendered in the EMA shell with stable thread ids — wedge, not vApp.",
    status: "planned",
  },
  {
    slug: "agent-virtual-environment",
    name: "Agent Virtual Environment",
    group: "vapp",
    oneLiner:
      "The agent's life as a place: virtual calendar, weekly phases, queues, responsibilities, checkups, todos, notes.",
    parts: ["Coordination / Agent Environment", "Shared Workspace"],
    smallestSlice:
      "Read-only daily timeline view over the existing dispatch event log, scoped to one agent. Adds the calendar metaphor without owning state.",
    status: "planned",
  },
  {
    slug: "blueprint",
    name: "Blueprint",
    group: "vapp",
    oneLiner:
      "Karpathy-style knowledge structuring; integrates with Wiki and intent capture as a typed subgraph.",
    parts: ["Semantic Layer / Knowledge System"],
    smallestSlice:
      "Promote the existing /futures-board route into a typed three-futures-per-question blueprint canvas — degenerate today, real after the collab plane lands.",
    status: "planned",
  },
  {
    slug: "launchpad",
    name: "Launchpad",
    group: "shell",
    oneLiner:
      "Top-level shell — Windows-8 / Start-style launcher hosting vApps and useful info tiles.",
    parts: ["Shells / Surfaces"],
    smallestSlice:
      "Single-row tile grid with Chat, Threads-stub, Files-stub, plus a project switcher. Useful the moment two real vApps exist.",
    status: "planned",
  },
  {
    slug: "hq",
    name: "HQ",
    group: "shell",
    oneLiner:
      "Per-user, per-project dashboard. Personal HQ aggregates across all Projects/Orgs the user belongs to.",
    parts: ["Shells / Surfaces", "Identity / Org / Project / Space"],
    smallestSlice:
      "Personal HQ that shows running Hermes sessions across projects + GitHub PR status per project — two feeds, one user.",
    status: "planned",
  },
  {
    slug: "virtual-desktop",
    name: "Virtual Desktop",
    group: "shell",
    oneLiner:
      "Main interface metaphor inherited from place.org — accessible as native desktop app or website.",
    parts: ["Shells / Surfaces", "Mesh / Replication / Presence"],
    smallestSlice:
      "Single-window desktop that hosts Chat with a wallpaper and a dock. Costume around v0.0.3 Chat — but the right costume.",
    status: "planned",
  },
];

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

function statusLabel(s: VAppStatus): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

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
                  <h3 className="list__title">{v.name}</h3>
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
