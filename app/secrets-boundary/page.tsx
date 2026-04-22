import Link from "next/link";

import { SiteShell } from "@/components/site-shell";

export default function SecretsBoundaryPage() {
  return (
    <SiteShell
      eyebrow="Cross-cutting"
      title="Secrets boundary"
      intro="Secrets belong to Hermes at execution time and nowhere else. The control plane only ever holds typed handles — references, not values. Surfaces never hold secrets; there is no exception, no caching, no fallback."
    >
      <section>
        <div className="panel">
          <p className="panel__tag">Ownership</p>
          <h2 className="panel__title">Who holds what</h2>
          <p className="panel__lede">
            The rule follows the canonical split. EMA owns truth — the typed
            reference is the truth. Hermes owns execution — the resolved value
            lives there and only there. Surfaces do not own state, and they do
            not get an exemption for credentials.
          </p>
        </div>
        <div className="card-grid">
          <article className="panel vapp-card">
            <div className="vapp-card__head">
              <p className="list__eyebrow">Control plane</p>
              <span className="chip">Typed handles</span>
            </div>
            <h3 className="list__title">Typed references only</h3>
            <p className="list__copy">
              EMA stores a handle, not a value — e.g.{" "}
              <code>secret_ref:openai.key:user_tawj</code>. The handle names a
              kind, a provider, and a scope. The control plane never holds
              the resolved string.
            </p>
          </article>
          <article className="panel vapp-card">
            <div className="vapp-card__head">
              <p className="list__eyebrow">Hermes</p>
              <span className="chip">Execution-time</span>
            </div>
            <h3 className="list__title">Resolves at execution time</h3>
            <p className="list__copy">
              Hermes asks the control plane to resolve a <code>secret_ref</code>{" "}
              at dispatch, holds the value in memory for the run, and zeroes it
              on exit. Nothing about the resolved value survives the process.
            </p>
          </article>
          <article className="panel vapp-card">
            <div className="vapp-card__head">
              <p className="list__eyebrow">Surfaces</p>
              <span className="chip">NEVER</span>
            </div>
            <h3 className="list__title">Surfaces do not hold secrets</h3>
            <p className="list__copy">
              Chat, Wiki, HQ, Blueprint, Threads, Launchpad, Virtual Desktop —
              none of them hold, cache, render, or pass secrets. Ever. If a
              surface has a secret in memory, the rule is already broken.
            </p>
          </article>
          <article className="panel vapp-card">
            <div className="vapp-card__head">
              <p className="list__eyebrow">Workspace</p>
              <span className="chip">Redacted refs</span>
            </div>
            <h3 className="list__title">Only redacted references in artifacts</h3>
            <p className="list__copy">
              Briefs, handoffs, and on-disk artifacts may reference a{" "}
              <code>secret_ref</code> by name. They must never inline a resolved
              value. Redaction is the default; a raw secret on disk is an
              incident.
            </p>
          </article>
        </div>
      </section>

      <section>
        <div className="panel">
          <p className="panel__tag">Kinds</p>
          <h2 className="panel__title">Typed secret kinds</h2>
          <p className="panel__lede">
            Every secret EMA knows about belongs to one of these kinds. Each
            kind names where the typed handle is referenced, who is authorized
            to resolve it, and how often it rotates.
          </p>
          <ul className="inline-list">
            <li>
              <code>provider.apikey</code> — referenced in dispatch payloads for
              model and tool providers. Resolution authority: EMA control plane,
              scoped to user/project. Rotation: 90 days, or on provider notice.
            </li>
            <li>
              <code>webhook.token</code> — referenced on inbound dispatch hooks
              and outbound callbacks. Resolution authority: EMA control plane,
              scoped to integration. Rotation: 30 days or on endpoint change.
            </li>
            <li>
              <code>oauth.refresh</code> — referenced when an integration
              dispatch needs a fresh access token. Resolution authority: EMA
              control plane, scoped to user + provider. Rotation: per provider
              policy, re-consented on scope change.
            </li>
            <li>
              <code>client.connection</code> — referenced by drivers connecting
              to customer systems (DBs, S3, internal APIs). Resolution
              authority: EMA control plane, scoped to project/space. Rotation:
              60 days or on personnel change.
            </li>
            <li>
              <code>cert.private</code> — referenced by signing and mTLS
              drivers. Resolution authority: EMA control plane, scoped to
              project. Rotation: at cert expiry, minimum yearly.
            </li>
            <li>
              <code>signing.key</code> — referenced when Hermes signs outbound
              artifacts or webhook payloads. Resolution authority: EMA control
              plane, scoped to space. Rotation: 180 days, or immediately on
              suspected compromise.
            </li>
          </ul>
        </div>
      </section>

      <section>
        <div className="panel">
          <p className="panel__tag">Forbidden</p>
          <h2 className="panel__title">Forbidden patterns</h2>
          <p className="panel__lede">
            Each of these is a direct violation of the secrets boundary. If you
            catch one shipping, treat it as an incident and roll it back — do
            not paper over it.
          </p>
          <ul className="inline-list">
            <li>
              A secret embedded in a wiki page — wiki is a surface, and surfaces
              never hold secrets. Only the <code>secret_ref</code> may appear.
            </li>
            <li>
              A secret pasted into a handoff markdown — handoffs travel through
              the workspace plane and are rendered by surfaces. Use the typed
              reference.
            </li>
            <li>
              A surface caching a resolved secret value for reuse — resolved
              values live and die inside Hermes. No surface-side cache, no
              &ldquo;just this once.&rdquo;
            </li>
            <li>
              A driver printing a secret into a chronicle row — chronicle rows
              are projections that surfaces render. Log the{" "}
              <code>secret_ref</code>, never the value.
            </li>
            <li>
              An <code>event_log</code> entry containing a raw secret — the
              control plane stores handles only. Only the <code>secret_ref</code>{" "}
              is allowed to land in canonical truth.
            </li>
          </ul>
        </div>
      </section>

      <section>
        <div className="panel">
          <p className="panel__tag">Resolution</p>
          <h2 className="panel__title">Resolution flow</h2>
          <p className="panel__lede">
            How a typed handle becomes a usable value at execution time, and
            nowhere else. Four steps, in order, every time.
          </p>
          <ul className="inline-list">
            <li>
              1. Dispatch carries <code>secret_ref</code>s. The control plane
              writes a dispatch that names the secrets it needs by typed
              reference — not by value, not by hint.
            </li>
            <li>
              2. Hermes requests resolution from the control plane. At execution
              start, Hermes sends each <code>secret_ref</code> back to EMA and
              asks for the value.
            </li>
            <li>
              3. The control plane authorizes against user, project, and space
              scope. If the scope on the handle does not match the dispatch
              actor and target, resolution is refused and the dispatch fails.
            </li>
            <li>
              4. Hermes receives an in-memory value with a TTL. The value lives
              only for the run, expires on TTL or process exit, and is zeroed.
              Nothing crosses back to any surface.
            </li>
          </ul>
        </div>
      </section>

      <section>
        <div className="panel">
          <p className="panel__tag">Incident</p>
          <h2 className="panel__title">What to do if a secret leaks</h2>
          <p className="panel__lede">
            Assume leaks happen. The boundary is defined as much by the response
            as by the rule. Run this procedure, in order, without improvising.
          </p>
          <ul className="inline-list">
            <li>
              Rotate the credential at the provider immediately. The old value
              is dead before anything else happens — no triage first, no
              &ldquo;confirm the leak&rdquo; first.
            </li>
            <li>
              Emit <code>incident.detected</code> on <code>event_log</code> with
              kind <code>secret.leaked</code>, naming the{" "}
              <code>secret_ref</code>, the scope, and the suspected leak
              surface.
            </li>
            <li>
              Scrub projections where possible — chronicle rows, rendered
              handoffs, cached briefs. The control plane is canonical; surface
              projections get rebuilt from truth with the value redacted.
            </li>
            <li>
              Record <code>incident.resolved</code> with the rotated{" "}
              <code>secret_ref</code> and a link back to the detection event.
              The handle persists; the value underneath it is new.
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
            <Link className="chip" href="/hermes-contract">
              Hermes contract
            </Link>
            <Link className="chip" href="/incidents">
              Incidents
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
