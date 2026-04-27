import {
  MOCK_PROJECTION_LABEL,
  gitEmaAttachmentsProjection,
} from "../../app/mock-projections";
import { useCommand, useProjection } from "../../lib/ipc";

type Attachment = {
  id: string;
  kind: string;
  source: string;
  display_name: string;
  mime?: string;
  size_bytes?: number;
};

export function AttachmentList({ scope }: { scope: "user" | "project" }) {
  const projection =
    scope === "project"
      ? "git_ema.project_attachments"
      : "git_ema.user_attachments";

  const p = useProjection(projection);
  const isMock = p == null;
  const attachments: Attachment[] =
    p?.attachments ?? gitEmaAttachmentsProjection.attachments;
  const dispatch = useCommand();

  if (attachments.length === 0) {
    return <p className="ema-attachments__empty">No attachments yet.</p>;
  }

  async function remove(id: string) {
    await dispatch("attachment.delete", { attachment_id: id });
  }

  return (
    <>
      {isMock && (
        <p className="ema-projection-note">
          Showing {MOCK_PROJECTION_LABEL}; delete buttons are disabled until a
          daemon projection is present.
        </p>
      )}
      <ul className="ema-attachments__list">
        {attachments.map((a) => (
          <li
            key={a.id}
            className="ema-attachment-row"
            data-kind={a.kind}
            data-state="attached"
          >
            <span className="ema-attachment-row__kind" data-kind={a.kind}>
              {iconFor(a.kind)}
            </span>
            <span className="ema-attachment-row__name">{a.display_name}</span>
            <span className="ema-attachment-row__source">{a.source}</span>
            <button onClick={() => remove(a.id)} disabled={isMock}>
              Delete
            </button>
          </li>
        ))}
      </ul>
    </>
  );
}

function iconFor(kind: string): string {
  switch (kind) {
    case "git_repo":
    case "git_path":
      return "⎇";
    case "drive_file":
    case "drive_folder":
      return "▤";
    case "folder":
      return "▥";
    default:
      return "◻";
  }
}
