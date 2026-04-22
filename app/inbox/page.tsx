import Link from "next/link";
import { SiteShell } from "@/components/site-shell";

export default function InboxPage() {
  return (
    <SiteShell
      eyebrow="Workspace plane"
      title="Inbox"
      intro="The shared workspace inbox is the promotion pipeline — a filesystem landing zone at workspace/shared/inbox/ where informal capture lands before it earns a typed home under handoffs/, plans/, or notes/. It governs the tension between open-capture (just drop a file) and typed-capture (every artifact must declare its kind). Items here are not yet canonical; promotion is a control-plane action, not a folder move."
    >
      <section>
        <h2>Mock inbox items</h2>
        <p className="lede">
          Six captured items sitting under <code>workspace/shared/inbox/</code>. Each one carries a kind-guess chip but has not yet been promoted — the kind-guess is the indexer's classification, not a commitment.
        </p>
        <div className="card-grid">
          <article className="vapp-card">
            <h3>inbox/2026-04-22-thread-idea.md</h3>
            <p><strong>kind-guess:</strong> <code>note</code> &nbsp; <strong>author:</strong> <code>@tawj</code></p>
            <p><strong>captured-at:</strong> <code>2026-04-22T09:14:02Z</code></p>
            <p><strong>promote-target:</strong> <code>workspace/shared/notes/2026-04-22-thread-idea.md</code></p>
          </article>
          <article className="vapp-card">
            <h3>inbox/2026-04-22-atlas-surfaces-draft.md</h3>
            <p><strong>kind-guess:</strong> <code>draft-handoff</code> &nbsp; <strong>author:</strong> <code>@claude-a1</code></p>
            <p><strong>captured-at:</strong> <code>2026-04-22T10:02:51Z</code></p>
            <p><strong>promote-target:</strong> <code>workspace/shared/handoffs/handoff_01H…</code></p>
          </article>
          <article className="vapp-card">
            <h3>inbox/2026-04-22-indexer-plan-fragment.md</h3>
            <p><strong>kind-guess:</strong> <code>plan-fragment</code> &nbsp; <strong>author:</strong> <code>@claude-b2</code></p>
            <p><strong>captured-at:</strong> <code>2026-04-22T11:33:18Z</code></p>
            <p><strong>promote-target:</strong> <code>workspace/shared/plans/indexer-v1.md</code></p>
          </article>
          <article className="vapp-card">
            <h3>inbox/2026-04-22-q3-cardinality.md</h3>
            <p><strong>kind-guess:</strong> <code>question</code> &nbsp; <strong>author:</strong> <code>@tawj</code></p>
            <p><strong>captured-at:</strong> <code>2026-04-22T12:47:09Z</code></p>
            <p><strong>promote-target:</strong> <code>workspace/shared/notes/questions/q3-project-space.md</code></p>
          </article>
          <article className="vapp-card">
            <h3>inbox/2026-04-22-export-seed.md</h3>
            <p><strong>kind-guess:</strong> <code>export-seed</code> &nbsp; <strong>author:</strong> <code>@claude-a1</code></p>
            <p><strong>captured-at:</strong> <code>2026-04-22T14:05:44Z</code></p>
            <p><strong>promote-target:</strong> <code>workspace/shared/exports/2026-04-22-atlas-slice/</code></p>
          </article>
          <article className="vapp-card">
            <h3>inbox/2026-04-22-scratch.md</h3>
            <p><strong>kind-guess:</strong> <code>unknown</code> &nbsp; <strong>author:</strong> <code>@claude-b2</code></p>
            <p><strong>captured-at:</strong> <code>2026-04-22T15:30:00Z</code></p>
            <p><strong>promote-target:</strong> <em>unresolved — awaits classification</em></p>
          </article>
        </div>
      </section>

      <section>
        <h2>Promotion flow</h2>
        <p className="lede">Five steps, four control-plane events. The inbox is a workspace-plane surface; promotion emits the events that make the artifact canonical.</p>
        <ol>
          <li><strong>captured</strong> — a file lands under <code>workspace/shared/inbox/</code>. Event: <code>inbox.item.created</code>.</li>
          <li><strong>classified</strong> — the indexer assigns a kind-guess (<code>note</code>, <code>draft-handoff</code>, <code>plan-fragment</code>, <code>question</code>, <code>export-seed</code>, <code>unknown</code>). Event: <code>inbox.item.classified</code>.</li>
          <li><strong>promoted</strong> — an actor invokes the control-plane promote command; the file is rewritten into its typed target (<code>→ handoffs/</code>, <code>→ plans/</code>, or <code>→ notes/</code>). Event: <code>inbox.item.promoted</code>.</li>
          <li><strong>(→ handoffs/plans/notes)</strong> — the typed artifact now lives under its canonical directory with its own lifecycle; the inbox row becomes a pointer.</li>
          <li><strong>archived-from-inbox</strong> — the inbox entry is moved to <code>workspace/shared/inbox/_archive/YYYY-MM/</code>. Event: <code>inbox.item.archived</code>.</li>
        </ol>
      </section>

      <section>
        <h2>Typed targets</h2>
        <p className="lede">Three directories a promoted inbox item can land in. Each has a one-line contract; an inbox item is not canonical until it lives in one of these.</p>
        <div className="card-grid">
          <article className="vapp-card">
            <h3>workspace/shared/handoffs/</h3>
            <p>Typed transfer artifacts moving a lane between actors — each file is a handoff with from/to/lane and a linked chronicle of <code>handoff.*</code> events.</p>
          </article>
          <article className="vapp-card">
            <h3>workspace/shared/plans/</h3>
            <p>Durable intent documents — each file names a scope, a target slice, and the open questions it leaves on the table; referenced by executions, not by chat.</p>
          </article>
          <article className="vapp-card">
            <h3>workspace/shared/notes/</h3>
            <p>Free-form but attributed prose — each file records author, captured-at, and a subject; acceptable as a long-term home for items that never needed a stronger type.</p>
          </article>
        </div>
      </section>

      <section>
        <h2>Promotion vs everything-counts (decision pressure)</h2>
        <p className="lede">Two candidate stances for the inbox, held in tension. <code>content/briefs/shared-workspace.md</code> names both; this route does not pick.</p>
        <div className="card-grid">
          <article className="vapp-card">
            <h3>Promotion-required</h3>
            <p>Stance 1 in the brief. The workspace stays small and deliberate because every artifact had to earn its type. Promotion is a control-plane action with real friction — a file in <code>inbox/</code> that nobody promotes quietly expires. The cost is informal capture: useful signal lives outside the workspace because it never cleared the bar.</p>
          </article>
          <article className="vapp-card">
            <h3>Everything-counts</h3>
            <p>Stance 2 in the brief. Anything in <code>workspace/shared/</code> — inbox included — is a first-class workspace object. Capture is frictionless and the workspace feels lush and inhabited. The cost is sediment: the inbox silts up unless a composting model prunes it, and "what happened here" queries get noisier over time.</p>
          </article>
        </div>
        <p className="lede"><em>The tension is not resolved on this route.</em> It is surfaced so the promote-command design does not quietly commit to one stance.</p>
      </section>

      <nav className="chips">
        <Link href="/handoff">/handoff</Link>
        <Link href="/canonical-rule">/canonical-rule</Link>
        <Link href="/parts/shared-workspace">/parts/shared-workspace</Link>
        <Link href="/agent-environment">/agent-environment</Link>
        <Link href="/questions">/questions</Link>
      </nav>
    </SiteShell>
  );
}
