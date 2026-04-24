import { ConnectorsPanel } from "./connectors-panel";
import { AttachmentList } from "./attachment-list";

/**
 * The git-ema vApp page.
 *
 *   scope="user"    — standalone /git-ema page, shows every attachment
 *                     the current user can see + connector management.
 *   scope="project" — rendered from within a project, scoped to that
 *                     project's attachments.
 *
 * The connectors panel is shown in both modes; the attachment list
 * scopes its projection name accordingly.
 */
export function GitEmaPage({ scope }: { scope: "user" | "project" }) {
  return (
    <section className="ema-vapp ema-vapp--git-ema">
      <header className="ema-vapp__header">
        <p className="ema-kicker">files + repos surface</p>
        <h1>git-ema</h1>
        <p className="ema-vapp__tagline">
          Files and codebases, native to EMA.
        </p>
      </header>

      <ConnectorsPanel />

      <section className="ema-vapp__section">
        <h2>
          Attachments {scope === "project" ? "(this project)" : "(all visible)"}
        </h2>
        <AttachmentList scope={scope} />
      </section>
    </section>
  );
}
