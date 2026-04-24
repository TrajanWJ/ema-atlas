import { useCommand, useProjection } from "../../lib/ipc";

type Attachment = {
  id: string;
  display_name: string;
  kind: string;
  source: string;
};

export type LinkTarget = {
  object_kind:
    | "project"
    | "space"
    | "blueprint_section"
    | "proposal"
    | "incident"
    | "lane_item";
  object_id: string;
};

/**
 * The shared attach dialog. Any vApp can open this to link an existing
 * attachment to one of its objects. Creating a brand-new attachment (via
 * picker) is done from the git-ema page itself; this dialog only links.
 *
 * Anti-silo rule: other vApps MUST NOT build their own attach UI. They
 * render this.
 */
export function AttachDialog({
  object,
  onClose,
}: {
  object: LinkTarget;
  onClose: () => void;
}) {
  const p = useProjection("git_ema.user_attachments");
  const attachments: Attachment[] = p?.attachments ?? [];
  const dispatch = useCommand();

  async function link(attachmentId: string) {
    await dispatch("attachment.link", {
      attachment_id: attachmentId,
      object_kind: object.object_kind,
      object_id: object.object_id,
    });
    onClose();
  }

  return (
    <div className="ema-modal" role="dialog" aria-label="Attach to object">
      <div className="ema-modal__backdrop" onClick={onClose} />
      <div className="ema-modal__panel">
        <header className="ema-modal__header">
          <h3>Attach to {object.object_kind}</h3>
          <button onClick={onClose}>Close</button>
        </header>
        {attachments.length === 0 ? (
          <p>
            No attachments yet. Go to{" "}
            <a href="/git-ema">git-ema</a> to import some first.
          </p>
        ) : (
          <ul className="ema-attach__list">
            {attachments.map((a) => (
              <li key={a.id} className="ema-attach__row">
                <span>{a.display_name}</span>
                <span className="ema-attach__meta">
                  {a.source} · {a.kind}
                </span>
                <button onClick={() => link(a.id)}>Attach</button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
