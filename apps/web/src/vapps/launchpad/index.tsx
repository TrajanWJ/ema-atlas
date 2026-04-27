import {
  MOCK_PROJECTION_LABEL,
  mockTopbar,
  surfaceLinks,
  type SurfaceId,
} from "../../app/mock-projections";
import { useShell } from "../../shell/virtual-desktop-shell";

/**
 * Launchpad vApp (wave 1).
 *
 * Start surface + vApp switcher. Renders a tile grid over `surfaceLinks`
 * (minus Launchpad itself — the window IS Launchpad). Clicking a tile
 * opens or focuses that vApp's window via the shell context.
 *
 * No canonical writes. Daemon status card and tile statuses are
 * projection reads with visible staged/projection tags — see
 * `ema-honest-mocks` skill.
 */
export function LaunchpadPage() {
  const { openSurface } = useShell();
  const tiles = surfaceLinks.filter((s) => s.id !== "launchpad");
  const currentProject = mockTopbar.current_project;
  const counts = tiles.reduce(
    (acc, surface) => {
      acc[surface.status] += 1;
      return acc;
    },
    { live: 0, projection: 0, staged: 0 },
  );
  const openCoreSurfaces = () => {
    (["hq", "blueprint", "git-ema", "agent-work"] satisfies SurfaceId[]).forEach(openSurface);
  };

  return (
    <section className="ema-vapp ema-vapp--launchpad">
      <header className="ema-vapp__header ema-vapp__header--split">
        <div>
          <p className="ema-kicker">vDesktop launch surface</p>
          <h1>EMA Launchpad</h1>
          <p className="ema-vapp__tagline">
            Start surface for the operational shell — open any vApp or
            return here to survey the project.
          </p>
        </div>
        <div className="ema-lp-header-actions">
          <button type="button" className="ema-primary-action" onClick={openCoreSurfaces}>
            Open core vApps
          </button>
          <span className="ema-pill ema-pill--hot">{MOCK_PROJECTION_LABEL}</span>
        </div>
      </header>

      <article className="ema-lp-hero" aria-label="Project context">
        <div className="ema-lp-hero__scope">
          <p className="ema-kicker">current project</p>
          <strong>{currentProject.name}</strong>
          <small>
            {mockTopbar.current_org.name} · {mockTopbar.current_space.name}
          </small>
          <div className="ema-lp-env-readout" aria-label="Surface status counts">
            <span>{counts.live} live</span>
            <span>{counts.projection} projections</span>
            <span>{counts.staged} staged</span>
          </div>
        </div>
        <div className="ema-lp-daemon-card" data-status="pending">
          <span className="ema-kicker">daemon</span>
          <strong>127.0.0.1:49555</strong>
          <small>Gleam / BEAM control plane</small>
          <span className="ema-pill" data-state="pending">
            pending daemon writer
          </span>
        </div>
      </article>

      <section className="ema-lp-tiles" aria-label="vApp launcher">
        {tiles.map((surface) => (
          <LaunchpadTile
            key={surface.id}
            surface={surface}
            onOpen={() => openSurface(surface.id)}
          />
        ))}
      </section>
    </section>
  );
}

function LaunchpadTile({
  surface,
  onOpen,
}: {
  surface: {
    id: SurfaceId;
    label: string;
    path: string;
    eyebrow: string;
    status: "live" | "projection" | "staged";
  };
  onOpen: () => void;
}) {
  return (
    <button
      type="button"
      className="ema-lp-tile"
      data-status={surface.status}
      onClick={onOpen}
    >
      <span className="ema-lp-tile__eyebrow">{surface.eyebrow}</span>
      <strong className="ema-lp-tile__label">{surface.label}</strong>
      <small className="ema-lp-tile__desc">{describe(surface.id)}</small>
      <span className="ema-pill ema-lp-tile__status" data-state={surface.status}>
        {surface.status}
      </span>
    </button>
  );
}

function describe(id: SurfaceId): string {
  switch (id) {
    case "hq":
      return "Command room and event trail.";
    case "blueprint":
      return "Project map — sections, attachments, prose.";
    case "git-ema":
      return "Repos, diffs, and source attachments.";
    case "agent-work":
      return "Lanes, handoffs, and swarm coordination.";
    case "wiki":
      return "Durable notes and canon references.";
    case "threads":
      return "Coordination stream — staged surface.";
    case "braindump":
      return "Fast capture scratchpad — staged surface.";
    case "launchpad":
      return "Start surface and vApp switcher.";
  }
}
