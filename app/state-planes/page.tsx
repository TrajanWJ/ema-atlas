import Link from "next/link";

import { SiteShell } from "@/components/site-shell";

export default function StatePlanesPage() {
  return (
    <SiteShell
      eyebrow="Cross-cutting"
      title="Four state planes"
      intro="EMA splits state into four planes: control, runtime, collaboration, and workspace. Each plane has one owner and a short list of canonical objects. The rule across the atlas is the same: surfaces render all four; surfaces own none."
    >
      <section>
        <div className="panel">
          <div className="vapp-card__head">
            <p className="panel__tag">Plane 1</p>
            <span className="chip">Canonical</span>
          </div>
          <h2 className="panel__title">Control plane</h2>
          <p className="panel__lede">
            The truth layer. Every canonical mutation in EMA lands here as an
            append-only record with lineage preserved.
          </p>
          <div>
            <span className="panel__label">Owner</span>
            <p className="list__copy">
              EMA <code>event_log</code> — the canonical log subsystem.
            </p>
          </div>
          <div>
            <span className="panel__label">Canonical objects</span>
            <div className="route-links">
              <span className="chip"><code>event_log</code></span>
              <span className="chip"><code>ExecutionId</code></span>
              <span className="chip"><code>DispatchId</code></span>
              <span className="chip"><code>IncidentId</code></span>
              <span className="chip"><code>ProposalId</code></span>
            </div>
          </div>
          <div>
            <span className="panel__label">Invariants</span>
            <ul className="inline-list">
              <li>Append-only — entries are never rewritten in place.</li>
              <li>Canonical ids — every object is addressable by a stable id.</li>
              <li>Lineage preserved — proposal → execution → dispatch → incident chains stay intact.</li>
            </ul>
          </div>
          <div>
            <span className="panel__label">If another plane holds it</span>
            <p className="list__copy">
              Truth fragments. If a surface keeps its own incident list or a
              runtime driver decides what &quot;dispatched&quot; means, EMA loses
              canonicality: two readers disagree on the same id, audits stop
              reconciling, and lineage breaks the moment the surface is
              refreshed.
            </p>
          </div>
        </div>
      </section>

      <section>
        <div className="panel">
          <div className="vapp-card__head">
            <p className="panel__tag">Plane 2</p>
            <span className="chip">Canonical</span>
          </div>
          <h2 className="panel__title">Runtime plane</h2>
          <p className="panel__lede">
            Live execution. Sessions, provider handles, and in-flight tool calls
            — none of which survive a restart, all of which must hand their
            result back to the control plane.
          </p>
          <div>
            <span className="panel__label">Owner</span>
            <p className="list__copy">Hermes and its drivers.</p>
          </div>
          <div>
            <span className="panel__label">Canonical objects</span>
            <div className="route-links">
              <span className="chip"><code>SessionId</code></span>
              <span className="chip"><code>ProviderId</code></span>
              <span className="chip"><code>ToolCall</code></span>
              <span className="chip"><code>RunHandle</code></span>
              <span className="chip"><code>DriverId</code></span>
            </div>
          </div>
          <div>
            <span className="panel__label">Invariants</span>
            <ul className="inline-list">
              <li>Live-only — state exists for the duration of a run and no longer.</li>
              <li>Ephemeral continuity — reconnects resume a session, they do not persist one.</li>
              <li>Hands results to the control plane — every completed run produces an event-log entry.</li>
            </ul>
          </div>
          <div>
            <span className="panel__label">If another plane holds it</span>
            <p className="list__copy">
              The system freezes live state into stale truth. If a surface
              caches <code>ToolCall</code> progress as durable data, or the
              event_log tries to stream token-level deltas, EMA conflates
              &quot;in flight&quot; with &quot;decided&quot; and the split
              between Hermes and the control plane collapses.
            </p>
          </div>
        </div>
      </section>

      <section>
        <div className="panel">
          <div className="vapp-card__head">
            <p className="panel__tag">Plane 3</p>
            <span className="chip chip--ghost">Q2-open</span>
          </div>
          <h2 className="panel__title">Collaboration plane</h2>
          <p className="panel__lede">
            Shared human-and-agent thinking surface: wiki graph, inline threads,
            canvas. The objects are clear; the owning subsystem is not yet
            decided.
          </p>
          <div>
            <span className="panel__label">Owner</span>
            <p className="list__copy">
              <strong>TBD — Q2-open.</strong> No subsystem has been named the
              canonical owner of collaboration state.
            </p>
          </div>
          <div>
            <span className="panel__label">Candidate objects</span>
            <div className="route-links">
              <span className="chip chip--ghost">wiki nodes</span>
              <span className="chip chip--ghost">typed edges</span>
              <span className="chip chip--ghost">comments</span>
              <span className="chip chip--ghost">inline-prompt threads</span>
              <span className="chip chip--ghost">cursors</span>
            </div>
          </div>
          <div>
            <span className="panel__label">Candidate transports — Q8 unresolved</span>
            <div className="route-links">
              <span className="chip chip--ghost">Yjs</span>
              <span className="chip chip--ghost">Automerge</span>
              <span className="chip chip--ghost">pure-Elixir CRDT</span>
              <span className="chip chip--ghost">centralized event_log</span>
              <span className="chip chip--ghost">hybrid</span>
            </div>
          </div>
          <div>
            <span className="panel__label">If this plane is absorbed</span>
            <p className="list__copy">
              Absorbed into the control plane, <code>event_log</code> becomes a
              chat transcript — every keystroke and cursor move bloats the
              canonical log, and truth is buried under presence noise. Absorbed
              into surface state, collaboration becomes whatever the last tab
              rendered — wiki edits stop converging, threads fork per surface,
              and there is no shared object to reconcile against.
            </p>
          </div>
        </div>
      </section>

      <section>
        <div className="panel">
          <div className="vapp-card__head">
            <p className="panel__tag">Plane 4</p>
            <span className="chip">Canonical</span>
          </div>
          <h2 className="panel__title">Workspace plane</h2>
          <p className="panel__lede">
            Files on disk: plans, handoffs, actor definitions, exports,
            swarm-state. The plane that agents and humans both read with
            ordinary tools.
          </p>
          <div>
            <span className="panel__label">Owner</span>
            <p className="list__copy">
              The repo-owned <code>workspace/shared/</code> directory.
            </p>
          </div>
          <div>
            <span className="panel__label">Canonical objects</span>
            <div className="route-links">
              <span className="chip">plans</span>
              <span className="chip">handoffs</span>
              <span className="chip">actors</span>
              <span className="chip">exports</span>
              <span className="chip">swarm-state</span>
            </div>
          </div>
          <div>
            <span className="panel__label">Invariants</span>
            <ul className="inline-list">
              <li>Grep-friendly — plain text, predictable paths.</li>
              <li>Agent-friendly — any actor can read and write with file tools.</li>
              <li>Typed-contract — file shapes are defined, not freeform.</li>
            </ul>
          </div>
          <div>
            <span className="panel__label">Current shape</span>
            <p className="list__copy">
              Governed by <code>WORKSPACE_CONTRACT.md</code> and
              <code> STATUS_VOCAB.md</code> — the typed contract and status
              vocabulary the swarm reads against.
            </p>
          </div>
        </div>
      </section>

      <section>
        <div className="panel">
          <p className="panel__tag">Pressure</p>
          <h2 className="panel__title">Plane collisions — forbidden patterns</h2>
          <p className="panel__lede">
            Four specific violations. Any one of them means a plane has been
            pulled out of its owner and the canonical rule is broken.
          </p>
          <ul className="inline-list">
            <li>
              <strong>Surface stores incident state.</strong> Incidents belong
              to the control plane; a surface caching its own list is a second
              truth.
            </li>
            <li>
              <strong>Chat history is the truth layer.</strong> Runtime
              transcripts are not <code>event_log</code>; canonicality cannot
              live in a token stream.
            </li>
            <li>
              <strong>Hermes decides canonicality on its own.</strong> Drivers
              execute; the control plane decides what happened. A driver that
              writes its own canonical record skips the log.
            </li>
            <li>
              <strong>Wiki edits bypass event_log.</strong> When a collaboration
              mutation needs to be canonical, it goes through a control-plane
              action — it does not land as a side-effect of a CRDT merge.
            </li>
          </ul>
        </div>
      </section>

      <section>
        <div className="panel">
          <p className="panel__tag">Navigate</p>
          <h2 className="panel__title">Related</h2>
          <div className="route-links">
            <Link className="chip" href="/canonical-rule">
              Canonical rule
            </Link>
            <Link className="chip" href="/surfaces-map">
              Surfaces map
            </Link>
            <Link className="chip" href="/parts/authority-control-plane">
              Authority / control plane
            </Link>
            <Link className="chip" href="/parts/shared-workspace">
              Shared workspace
            </Link>
            <Link className="chip" href="/questions">
              Open questions
            </Link>
          </div>
        </div>
      </section>
    </SiteShell>
  );
}
