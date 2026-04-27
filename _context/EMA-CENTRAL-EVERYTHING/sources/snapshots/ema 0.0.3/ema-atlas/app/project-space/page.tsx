import Link from "next/link";

import { SiteShell } from "@/components/site-shell";

export default function ProjectSpacePage() {
  return (
    <SiteShell
      eyebrow="Identity"
      title="Org · Project · Space"
      intro="EMA's identity shape runs Org → Project → Space, with users and agents threaded through. Projects are the hard boundary; Spaces are the default collaboration boundary inside a project. Three questions stay open here: Q1 (are agents first-class org/space members?), Q3 (Project↔Space cardinality), and Q10 (permission mapping)."
    >
      <section>
        <div className="panel">
          <p className="panel__tag">Shape</p>
          <h2 className="panel__title">Entities in order</h2>
          <p className="panel__lede">
            Four entities, read top-to-bottom. Each card names its one-line
            purpose, one invariant, and the open question it pressures.
          </p>
          <div className="route-links">
            <div className="panel">
              <div className="vapp-card__head">
                <p className="panel__tag">1</p>
                <span className="chip">Org</span>
              </div>
              <h3 className="panel__title">Org</h3>
              <p className="list__copy">
                Billing, tenancy, and the outer wrapper around projects.
              </p>
              <div>
                <span className="panel__label">Invariant</span>
                <p className="list__copy">
                  One billing relationship; projects never migrate across orgs
                  silently.
                </p>
              </div>
              <div>
                <span className="panel__label">Open flag</span>
                <span className="chip chip--ghost">Q3 — can a Space cross orgs?</span>
              </div>
            </div>

            <div className="panel">
              <div className="vapp-card__head">
                <p className="panel__tag">2</p>
                <span className="chip">Project</span>
              </div>
              <h3 className="panel__title">Project</h3>
              <p className="list__copy">
                The hard boundary. All canonical state scopes to a project.
              </p>
              <div>
                <span className="panel__label">Invariant</span>
                <p className="list__copy">
                  Project is a hard boundary — no implicit leaks of event_log or
                  canonical ids across projects.
                </p>
              </div>
              <div>
                <span className="panel__label">Open flag</span>
                <span className="chip chip--ghost">Q3 — Project↔Space cardinality</span>
              </div>
            </div>

            <div className="panel">
              <div className="vapp-card__head">
                <p className="panel__tag">3</p>
                <span className="chip">Space</span>
              </div>
              <h3 className="panel__title">Space</h3>
              <p className="list__copy">
                Default collaboration boundary — where humans and agents meet.
              </p>
              <div>
                <span className="panel__label">Invariant</span>
                <p className="list__copy">
                  A Space has a membership list and a collaboration surface; it
                  does not own canonical truth.
                </p>
              </div>
              <div>
                <span className="panel__label">Open flag</span>
                <span className="chip chip--ghost">Q10 — permission mapping</span>
              </div>
            </div>

            <div className="panel">
              <div className="vapp-card__head">
                <p className="panel__tag">4</p>
                <span className="chip">Agent / User</span>
              </div>
              <h3 className="panel__title">Agent / User</h3>
              <p className="list__copy">
                The actors. Humans and agents both act into spaces.
              </p>
              <div>
                <span className="panel__label">Invariant</span>
                <p className="list__copy">
                  Every canonical action is attributed to a stable actor id,
                  human or agent.
                </p>
              </div>
              <div>
                <span className="panel__label">Open flag</span>
                <span className="chip chip--ghost">Q1 — agents first-class?</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section>
        <div className="panel">
          <p className="panel__tag">Mock nested explorer</p>
          <h2 className="panel__title">Two orgs, rendered</h2>
          <p className="panel__lede">
            Every id below is canonical; the surface renders, the control plane
            holds. Static — no interactivity.
          </p>
          <ul className="inline-list">
            <li>
              <strong>org:</strong> <code>personal</code>
              <ul className="inline-list">
                <li>
                  <strong>project:</strong> <code>inbox</code>
                  <ul className="inline-list">
                    <li>
                      <strong>space:</strong> <code>triage</code> — session{" "}
                      <code>ses_01hf_a1b2</code>, agent <code>claude-a1</code>
                    </li>
                    <li>
                      <strong>space:</strong> <code>drafts</code> — session{" "}
                      <code>ses_01hf_c3d4</code>, agent <code>claude-a2</code>
                    </li>
                  </ul>
                </li>
                <li>
                  <strong>project:</strong> <code>atlas</code>
                  <ul className="inline-list">
                    <li>
                      <strong>space:</strong> <code>map</code> — session{" "}
                      <code>ses_01hf_e5f6</code>, agent <code>claude-a3</code>
                    </li>
                    <li>
                      <strong>space:</strong> <code>notes</code> — session{" "}
                      <code>ses_01hf_g7h8</code>, agent <code>codex-b1</code>
                    </li>
                  </ul>
                </li>
              </ul>
            </li>
            <li>
              <strong>org:</strong> <code>acme-labs</code>
              <ul className="inline-list">
                <li>
                  <strong>project:</strong> <code>nova</code>
                  <ul className="inline-list">
                    <li>
                      <strong>space:</strong> <code>design</code> — session{" "}
                      <code>ses_01hf_j9k0</code>, agent <code>claude-c1</code>
                    </li>
                    <li>
                      <strong>space:</strong> <code>eng</code> — session{" "}
                      <code>ses_01hf_l1m2</code>, agent <code>claude-c2</code>
                    </li>
                  </ul>
                </li>
                <li>
                  <strong>project:</strong> <code>atlas-fork</code>
                  <ul className="inline-list">
                    <li>
                      <strong>space:</strong> <code>intake</code> — session{" "}
                      <code>ses_01hf_n3p4</code>, agent <code>codex-d1</code>
                    </li>
                    <li>
                      <strong>space:</strong> <code>review</code> — session{" "}
                      <code>ses_01hf_q5r6</code>, agent <code>codex-d2</code>
                    </li>
                  </ul>
                </li>
              </ul>
            </li>
          </ul>
          <p className="list__copy">
            Caption: every id is canonical; surface renders; control plane
            holds.
          </p>
        </div>
      </section>

      <section>
        <div className="panel">
          <div className="vapp-card__head">
            <p className="panel__tag">Cardinality pressure</p>
            <span className="chip chip--ghost">Q3-open</span>
          </div>
          <h2 className="panel__title">Three candidate answers for Project↔Space</h2>
          <p className="panel__lede">
            Three shapes are on the table. Each enables something, forces
            something, and breaks something. We do not pick here.
          </p>
          <div>
            <span className="panel__label">Candidate A — 1 Project : N Spaces (tree)</span>
            <ul className="inline-list">
              <li><strong>Enables:</strong> clean scoping; a Space is always inside exactly one Project.</li>
              <li><strong>Forces you to build first:</strong> nothing exotic — plain tree membership, project-scoped event_log.</li>
              <li><strong>Breaks:</strong> cross-project collaboration; a Space cannot join two projects, so shared work duplicates.</li>
            </ul>
          </div>
          <div>
            <span className="panel__label">Candidate B — M Projects : N Spaces (shared spaces)</span>
            <ul className="inline-list">
              <li><strong>Enables:</strong> a Space participates in several projects — shared design review, shared ops room.</li>
              <li><strong>Forces you to build first:</strong> per-action project attribution on every event, and a merge policy for canonical ids visible in a shared Space.</li>
              <li><strong>Breaks:</strong> the &quot;Project is the hard boundary&quot; invariant unless attribution is airtight; audit becomes harder.</li>
            </ul>
          </div>
          <div>
            <span className="panel__label">Candidate C — Spaces cross Orgs (federated)</span>
            <ul className="inline-list">
              <li><strong>Enables:</strong> cross-tenant collaboration — vendor spaces, partner spaces, client spaces.</li>
              <li><strong>Forces you to build first:</strong> federation protocol, cross-org identity mapping, and per-org canonical logs that reconcile.</li>
              <li><strong>Breaks:</strong> the single-tenancy assumption in billing and the clean org-scoped permission model.</li>
            </ul>
          </div>
          <p className="list__copy">
            <strong>Q3 unresolved.</strong> No pick here — the atlas names the
            pressure, not the answer.
          </p>
        </div>
      </section>

      <section>
        <div className="panel">
          <div className="vapp-card__head">
            <p className="panel__tag">Permissions mapping</p>
            <span className="chip chip--ghost">Q10-open</span>
          </div>
          <h2 className="panel__title">Four levels, mapped to runtime/tool scopes</h2>
          <p className="panel__lede">
            First-pass mapping from org/space permission levels to what a caller
            can actually do in Hermes. Every line ends unresolved.
          </p>
          <ul className="inline-list">
            <li>
              <strong><code>admin</code></strong> — full project configuration,
              can grant membership, can register agents and drivers, sees every
              space in the project. Q10 unresolved: exact mapping TBD.
            </li>
            <li>
              <strong><code>member</code></strong> — acts in joined spaces,
              starts Hermes sessions, invokes permitted tools, writes to
              event_log through standard actions. Q10 unresolved: exact mapping
              TBD.
            </li>
            <li>
              <strong><code>guest</code></strong> — read-mostly in a named
              space; can comment and observe sessions, cannot start runs or
              mutate canonical state. Q10 unresolved: exact mapping TBD.
            </li>
            <li>
              <strong><code>agent</code></strong> — scoped tool + session
              privileges attached to an actor id; every call is attributed and
              bounded by the space it was invited into. Q10 unresolved: exact
              mapping TBD.
            </li>
          </ul>
        </div>
      </section>

      <section>
        <div className="panel">
          <div className="vapp-card__head">
            <p className="panel__tag">Agent identity</p>
            <span className="chip chip--ghost">Q1-open</span>
          </div>
          <h2 className="panel__title">Are agents first-class members?</h2>
          <p className="panel__lede">
            When <code>claude-a1</code> acts in <code>acme-labs / nova / eng</code>,
            is it a member of that space and org, or is it an attributed actor
            operating on a human&apos;s behalf? Two candidates.
          </p>
          <div>
            <span className="panel__label">Candidate 1 — First-class org/space members</span>
            <ul className="inline-list">
              <li><strong>Tradeoff:</strong> agents have their own membership rows, permission levels, and audit trail — mirrors humans.</li>
              <li><strong>Cost:</strong> org admin must provision and deprovision agents like users; billing and seat questions get sharper; lifecycle management grows.</li>
            </ul>
          </div>
          <div>
            <span className="panel__label">Candidate 2 — Attributed actors only</span>
            <ul className="inline-list">
              <li><strong>Tradeoff:</strong> an agent always acts &quot;on behalf of&quot; a human principal; its actor id is a scoped token, not a member.</li>
              <li><strong>Cost:</strong> multi-agent autonomy gets awkward — who owns a background agent that runs overnight? Attribution chains grow and shared-space semantics blur.</li>
            </ul>
          </div>
          <p className="list__copy">
            <strong>Q1 unresolved.</strong> No pick here either.
          </p>
        </div>
      </section>

      <section>
        <div className="panel">
          <p className="panel__tag">Navigate</p>
          <h2 className="panel__title">Related</h2>
          <div className="route-links">
            <Link className="chip" href="/state-planes">
              State planes
            </Link>
            <Link className="chip" href="/canonical-rule">
              Canonical rule
            </Link>
            <Link className="chip" href="/parts/identity-project-space">
              Identity · Project · Space part
            </Link>
            <Link className="chip" href="/hq/personal">
              HQ / personal
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
