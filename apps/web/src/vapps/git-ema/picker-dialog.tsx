import { useEffect, useState } from "react";
import { useCommand } from "../../lib/ipc";

type Connector = {
  id: string;
  provider: "google_drive" | "github";
  display_label: string;
};

type PickerItem = {
  id: string;
  display_name: string;
  kind_hint: string;
};

/**
 * Fake picker dialog. Fetches the daemon's hard-coded demo catalog for
 * the given connector and lets the user create attachments from any
 * picked item. No real API call.
 */
export function PickerDialog({
  connector,
  onClose,
}: {
  connector: Connector;
  onClose: () => void;
}) {
  const dispatch = useCommand();
  const [items, setItems] = useState<PickerItem[]>([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await dispatch("connector.list_picker_items", {
        connector_id: connector.id,
      });
      if (cancelled) return;
      // The daemon returns `picker_items` inline on command_result for
      // this query-style command; see shell-protocol.md.
      // Using `any` here because the CommandResult type upstream keeps
      // query payloads loose until typed bindings generate.
      const picker = (res as any).picker_items ?? [];
      setItems(picker);
    })();
    return () => {
      cancelled = true;
    };
  }, [connector.id, dispatch]);

  async function importOne(item: PickerItem) {
    setBusy(true);
    try {
      await dispatch("connector.import_resource", {
        connector_id: connector.id,
        picker_item_id: item.id,
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="ema-modal" role="dialog" aria-label="Browse source">
      <div className="ema-modal__backdrop" onClick={onClose} />
      <div className="ema-modal__panel">
        <header className="ema-modal__header">
          <h3>Browse {connector.display_label}</h3>
          <button onClick={onClose}>Close</button>
        </header>
        <ul className="ema-picker__list">
          {items.length === 0 && <li>(nothing to show)</li>}
          {items.map((it) => (
            <li key={it.id} className="ema-picker__item">
              <span>{it.display_name}</span>
              <span className="ema-picker__kind">{it.kind_hint}</span>
              <button onClick={() => importOne(it)} disabled={busy}>
                Import
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
