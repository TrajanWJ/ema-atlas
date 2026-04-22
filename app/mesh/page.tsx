import Link from "next/link";

import { SiteShell } from "@/components/site-shell";

export default function MeshPage() {
  return (
    <SiteShell
      eyebrow="Q9 — replication boundary"
      title="Mesh: strategic, not immediate"
      intro="The anti-drift rule for Q9 is blunt: P2P/mesh is strategic, but should not outrun local semantics. This page is pressure on that rule, not a blueprint. It exists to keep replication from pre-empting a single-host shape that is not yet coherent."
    >
      <section>
        <div className="panel">
          <p className="panel__tag">Rule (load-bearing)</p>
          <h2 className="panel__title">
            &ldquo;P2P/mesh is strategic, but should not outrun local semantics.&rdquo;
          </h2>
          <p className="panel__lede">
            Mesh is on the roadmap as a direction, not a near-term target.
            Before any replication layer is designed, the single-host story has
            to close. Otherwise the mesh inherits incoherence and amplifies it.
          </p>
          <ul className="inline-list">
            <li>
              Local first. A single daemon on a single machine must already
              have a clean <code>event_log</code>, canonical ids, and a working
              authority model before any second node exists.
            </li>
            <li>
              Replication is a later layer. It is a transport and consistency
              problem layered on top of local semantics — never a substitute
              for them.
            </li>
            <li>
              Mesh framing must not leak into single-host shape. No
              &ldquo;peer,&rdquo; &ldquo;node,&rdquo; or &ldquo;federation&rdquo;
              vocabulary in schemas or surfaces until the single-host version
              actually ships.
            </li>
          </ul>
        </div>
      </section>

      <section>
        <div className="panel">
          <p className="panel__tag">Candidates</p>
          <h2 className="panel__title">Three candidate boundaries</h2>
          <p className="panel__lede">
            Three points on the replication axis. Naming them makes the choice
            legible; it does not mean we pick one now.
          </p>
        </div>
        <div className="card-grid">
          <article className="panel vapp-card">
            <div className="vapp-card__head">
              <p className="list__eyebrow">Boundary 1</p>
              <span className="chip">Today</span>
            </div>
            <h3 className="list__title">Single host</h3>
            <p className="list__copy">
              Everything runs one daemon. Workspace is local,{" "}
              <code>event_log</code> is local, Hermes dispatches on the same
              machine. No peers, no replication, no federation.
            </p>
            <div>
              <span className="panel__label">Bets</span>
              <p className="list__copy">
                One owner per kind of state is achievable because there is
                literally one process.
              </p>
            </div>
            <div>
              <span className="panel__label">Tensions</span>
              <p className="list__copy">
                No collaboration across machines; no survivability if the host
                dies.
              </p>
            </div>
            <div>
              <span className="panel__label">Prereqs</span>
              <p className="list__copy">
                Nothing beyond the existing program — this is the baseline we
                must reach first.
              </p>
            </div>
          </article>
          <article className="panel vapp-card">
            <div className="vapp-card__head">
              <p className="list__eyebrow">Boundary 2</p>
              <span className="chip">Middle</span>
            </div>
            <h3 className="list__title">Project-sharded cluster</h3>
            <p className="list__copy">
              One daemon per project. Peers exchange summaries — decisions,
              incident resolutions, blueprint snapshots — but not raw event
              streams. Each project has a single writer.
            </p>
            <div>
              <span className="panel__label">Bets</span>
              <p className="list__copy">
                Sharding by project matches Q3&rsquo;s cardinality and keeps
                authority unambiguous per shard.
              </p>
            </div>
            <div>
              <span className="panel__label">Tensions</span>
              <p className="list__copy">
                Cross-project work (shared wiki, cross-org handoff) becomes a
                second protocol, not a feature.
              </p>
            </div>
            <div>
              <span className="panel__label">Prereqs</span>
              <p className="list__copy">
                Q3 resolved, canonical ids stable, single-host{" "}
                <code>event_log</code> semantics closed.
              </p>
            </div>
          </article>
          <article className="panel vapp-card">
            <div className="vapp-card__head">
              <p className="list__eyebrow">Boundary 3</p>
              <span className="chip">Far</span>
            </div>
            <h3 className="list__title">Peer-to-peer mesh</h3>
            <p className="list__copy">
              Daemons replicate with lease-based authority. Multi-writer
              surfaces use CRDT-merge where legal; canonical facts remain
              single-writer under lease. No central host.
            </p>
            <div>
              <span className="panel__label">Bets</span>
              <p className="list__copy">
                Leases plus CRDT can give concurrent editing without letting
                surfaces own truth.
              </p>
            </div>
            <div>
              <span className="panel__label">Tensions</span>
              <p className="list__copy">
                Authority becomes a distributed-systems problem; the canonical
                rule has to survive partition and rejoin.
              </p>
            </div>
            <div>
              <span className="panel__label">Prereqs</span>
              <p className="list__copy">
                Everything in boundary 2, plus Q1, Q2, and Q8 all closed, plus
                a transport picked deliberately.
              </p>
            </div>
          </article>
        </div>
      </section>

      <section>
        <div className="panel">
          <p className="panel__tag">Non-negotiable</p>
          <h2 className="panel__title">What must be coherent first</h2>
          <p className="panel__lede">
            None of the three boundaries above can be chosen until these five
            are closed on a single host. Any mesh work started earlier will
            re-open them under worse conditions.
          </p>
          <ul className="inline-list">
            <li>
              Single-host <code>event_log</code> semantics — append rules,
              ordering, and projection contracts have to be stable before a
              second writer exists anywhere.
            </li>
            <li>
              Canonical ids — every <code>ExecutionId</code>, project id, and
              entity id has to be globally unique and stable on one host before
              being asked to be stable across hosts.
            </li>
            <li>
              Q3 project &harr; space cardinality — we cannot replicate a
              relationship we have not yet decided is 1:1, 1:N, or N:N.
            </li>
            <li>
              Q1 agent identity — attribution must be unambiguous locally
              before it is asked to survive replication and merge.
            </li>
            <li>
              Q8 sync model for docs — the single-host reconciliation story
              between surfaces and <code>event_log</code> has to land before
              cross-host reconciliation is even drafted.
            </li>
          </ul>
        </div>
      </section>

      <section>
        <div className="panel">
          <p className="panel__tag">Defer</p>
          <h2 className="panel__title">Mesh-tempting decisions to defer</h2>
          <p className="panel__lede">
            Each of these is easy to pre-lock because it feels like
            &ldquo;design for the future.&rdquo; Pre-locking any of them bends
            the single-host shape toward a mesh we have not committed to.
          </p>
          <ul className="inline-list">
            <li>
              Peer discovery — do not pick a discovery protocol (mDNS, DHT,
              rendezvous server) while there are zero peers in the system.
            </li>
            <li>
              Multi-writer wiki — do not design wiki storage around CRDT merge
              before the single-writer wiki contract is defined.
            </li>
            <li>
              Federated proposals — do not let proposal flow assume proposals
              originate off-host; keep the proposal surface single-origin for
              now.
            </li>
            <li>
              Cross-org handoff — do not model organizations, trust domains, or
              inter-org ACLs until one org on one host behaves correctly.
            </li>
          </ul>
        </div>
      </section>

      <section>
        <div className="panel">
          <p className="panel__tag">Failure mode</p>
          <h2 className="panel__title">If we shipped mesh tomorrow, what breaks</h2>
          <p className="panel__lede">
            Concrete failures, not vibes. Each one is a direct consequence of
            replicating before local semantics are closed.
          </p>
          <ul className="inline-list">
            <li>
              Provenance collisions — two peers emit events with the same
              logical id because canonical id generation is still local-only,
              and <code>event_log</code> cannot tell which one is truth.
            </li>
            <li>
              Duplicate incident resolution — the same incident is closed
              independently on two peers, producing two resolution events that
              both claim canonicality.
            </li>
            <li>
              Authority ambiguity on decisions — a decision is recorded on peer
              A and superseded on peer B before they sync; no lease model
              exists yet to arbitrate, so both stand.
            </li>
            <li>
              Q2 collab-plane forced to pick a transport — the collaboration
              plane cannot stay abstract once two hosts exist, so a transport
              gets chosen under deadline pressure rather than on merit.
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
            <Link className="chip" href="/state-planes">
              State planes
            </Link>
            <Link className="chip" href="/project-space">
              Project / space
            </Link>
            <Link className="chip" href="/parts/identity-project-space">
              Identity / project / space
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
