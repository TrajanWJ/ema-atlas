// Region 6 of See Agent Work first screen per SURFACE-SLICE-A.md §"Region 6".
// Sprint 4: primary action is "run via daemon command IPC" for the supported
// action set; copy-to-clipboard remains as a secondary action.
import { useCallback, useState } from "react";
import type { AgentWorkspacePanelProps } from "./component-types";
import { sourcePillClass } from "./component-types";

type ActionId =
  | "lane.list"
  | "lane.claim"
  | "queue.list"
  | "queue.add"
  | "queue.close"
  | "checkup.runtime"
  | "agent.orient";

type SupportedAction = {
  readonly id: ActionId;
  readonly match: RegExp;
  readonly label: string;
  readonly needsForm: boolean;
};

const SUPPORTED_ACTIONS: readonly SupportedAction[] = [
  { id: "lane.list", match: /^ema lane list\b/, label: "lane list", needsForm: false },
  { id: "lane.claim", match: /^ema lane claim\b/, label: "lane claim", needsForm: true },
  { id: "queue.list", match: /^ema queue list\b/, label: "queue list", needsForm: false },
  { id: "queue.add", match: /^ema queue add\b/, label: "queue add", needsForm: true },
  { id: "queue.close", match: /^ema queue close\b/, label: "queue close", needsForm: true },
  { id: "checkup.runtime", match: /^ema checkup runtime\b/, label: "checkup runtime", needsForm: false },
  { id: "agent.orient", match: /^ema agent orient\b/, label: "agent orient", needsForm: false },
];

function detectAction(command: string): SupportedAction | null {
  return SUPPORTED_ACTIONS.find((entry) => entry.match.test(command)) ?? null;
}

const FORM_FIELDS: Record<ActionId, readonly { readonly name: string; readonly label: string; readonly required: boolean }[]> = {
  "lane.list": [],
  "lane.claim": [
    { name: "lane", label: "lane id", required: true },
    { name: "actor", label: "actor id", required: true },
    { name: "scope", label: "scope", required: true },
    { name: "goal", label: "goal", required: true },
    { name: "next", label: "next", required: true },
  ],
  "queue.list": [],
  "queue.add": [
    { name: "title", label: "title", required: true },
    { name: "why", label: "why", required: true },
    { name: "done_when", label: "done when", required: false },
    { name: "lane", label: "lane id (optional)", required: false },
  ],
  "queue.close": [
    { name: "queue_item", label: "queue item id", required: true },
    { name: "result", label: "result", required: true },
    { name: "verify", label: "verify (optional)", required: false },
  ],
  "checkup.runtime": [],
  "agent.orient": [],
};

type ExecResponse = {
  readonly ok?: boolean;
  readonly status?: string;
  readonly error?: string;
  readonly action?: string;
  readonly command?: readonly string[];
  readonly result?: unknown;
};

async function runAction(action: ActionId, args: Record<string, string>): Promise<string> {
  const response = await fetch("/api/agent-work/exec", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, args }),
  });
  const payload = (await response.json()) as ExecResponse;
  if (!response.ok || !payload.ok) {
    throw new Error(payload.error ?? `exec failed (${payload.status ?? `http_${response.status}`})`);
  }
  return summarize(action, payload.result);
}

function summarize(action: ActionId, result: unknown): string {
  if (!result || typeof result !== "object") return "ok";
  const record = result as Record<string, unknown>;
  if (action === "lane.list") {
    const lanes = Array.isArray(record.lanes) ? record.lanes.length : 0;
    return `ok — ${lanes} lane(s)`;
  }
  if (action === "queue.list") {
    const items = Array.isArray(record.queue_items)
      ? record.queue_items.length
      : Array.isArray(record.items)
        ? record.items.length
        : 0;
    return `ok — ${items} queue item(s)`;
  }
  if (action === "queue.add") {
    const id = typeof record.resource === "string" ? record.resource : "";
    return id ? `queued ${id}` : "ok";
  }
  if (action === "queue.close") return "queue item closed";
  if (action === "lane.claim") return "lane claimed";
  if (action === "checkup.runtime") return "checkup ok";
  if (action === "agent.orient") {
    const scope = (record.workspace_scope as Record<string, unknown> | undefined)?.project;
    return scope ? `oriented in ${String(scope)}` : "oriented";
  }
  return "ok";
}

export function CommandPanel({ projection, sourceLabel, isLive }: AgentWorkspacePanelProps) {
  const { controls } = projection;
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [runningId, setRunningId] = useState<string | null>(null);
  const [resultByLabel, setResultByLabel] = useState<Record<string, string>>({});
  const [formFor, setFormFor] = useState<{ readonly action: ActionId; readonly label: string } | null>(null);

  const copy = useCallback((label: string, command: string) => {
    if (typeof navigator === "undefined" || !navigator.clipboard) return;
    navigator.clipboard.writeText(command).then(() => {
      setCopiedId(label);
      setTimeout(() => setCopiedId((prev) => (prev === label ? null : prev)), 1400);
    });
  }, []);

  const run = useCallback(async (label: string, action: ActionId, args: Record<string, string>) => {
    setRunningId(label);
    try {
      const result = await runAction(action, args);
      setResultByLabel((prev) => ({ ...prev, [label]: result }));
    } catch (error) {
      setResultByLabel((prev) => ({
        ...prev,
        [label]: error instanceof Error ? error.message : String(error),
      }));
    } finally {
      setRunningId((prev) => (prev === label ? null : prev));
    }
  }, []);

  return (
    <section className="ema-panel ema-saw-region ema-saw-command-panel" aria-label="Command panel">
      <div className="ema-panel__heading">
        <div>
          <p className="ema-kicker">command panel</p>
          <h2>Queued controls · CLI parity</h2>
        </div>
        <span className={sourcePillClass(isLive)}>{sourceLabel}</span>
      </div>
      <div className="ema-saw-command-panel__grid">
        {controls.map((control) => {
          const action = detectAction(control.command);
          const stateLabel = action ? "daemon-backed" : "pending daemon writer";
          return (
            <article
              key={control.label}
              className="ema-saw-cmd-btn"
              data-state={action ? "daemon-backed" : control.state}
              data-action={action?.id ?? undefined}
            >
              <button
                type="button"
                className="ema-saw-cmd-btn__action"
                onClick={(e) => {
                  e.preventDefault();
                  if (!action) return;
                  if (action.needsForm) {
                    setFormFor({ action: action.id, label: control.label });
                    return;
                  }
                  void run(control.label, action.id, {});
                }}
                aria-label={`${control.label} (${stateLabel})`}
                title={action ? "Run daemon-backed command" : `${stateLabel} — copy CLI to run manually`}
                disabled={runningId === control.label || !action}
              >
                <span>{control.label}</span>
                <strong>{runningId === control.label ? "running" : action ? "run" : control.state}</strong>
                <small className="ema-saw-cmd-btn__hint">{stateLabel}</small>
              </button>
              <code className="ema-saw-cli">{control.command}</code>
              {resultByLabel[control.label] ? (
                <small className="ema-saw-cmd-btn__hint" data-result-for={control.label}>
                  {resultByLabel[control.label]}
                </small>
              ) : null}
              <button
                type="button"
                className="ema-saw-cmd-btn__copy"
                onClick={() => copy(control.label, control.command)}
              >
                {copiedId === control.label ? "copied" : "copy cli"}
              </button>
            </article>
          );
        })}
      </div>
      {formFor ? (
        <CommandForm
          action={formFor.action}
          label={formFor.label}
          onCancel={() => setFormFor(null)}
          onSubmit={async (args) => {
            setFormFor(null);
            await run(formFor.label, formFor.action, args);
          }}
        />
      ) : null}
    </section>
  );
}

function CommandForm({
  action,
  label,
  onCancel,
  onSubmit,
}: {
  readonly action: ActionId;
  readonly label: string;
  readonly onCancel: () => void;
  readonly onSubmit: (args: Record<string, string>) => Promise<void>;
}) {
  const fields = FORM_FIELDS[action];
  const [values, setValues] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <div
      className="ema-saw-cmd-form"
      role="dialog"
      aria-label={`${label} parameters`}
      data-action={action}
    >
      <p className="ema-saw-cmd-form__title">{label}</p>
      <form
        onSubmit={async (event) => {
          event.preventDefault();
          for (const field of fields) {
            if (field.required && !values[field.name]?.trim()) {
              setError(`'${field.name}' is required`);
              return;
            }
          }
          setSubmitting(true);
          setError(null);
          try {
            await onSubmit(values);
          } finally {
            setSubmitting(false);
          }
        }}
      >
        {fields.map((field) => (
          <label key={field.name} className="ema-saw-cmd-form__field">
            <span>
              {field.label}
              {field.required ? " *" : ""}
            </span>
            <input
              name={field.name}
              required={field.required}
              value={values[field.name] ?? ""}
              onChange={(event) =>
                setValues((prev) => ({ ...prev, [field.name]: event.target.value }))
              }
            />
          </label>
        ))}
        {error ? <p className="ema-saw-cmd-form__error">{error}</p> : null}
        <div className="ema-saw-cmd-form__actions">
          <button
            type="button"
            className="ema-saw-cmd-btn__copy"
            onClick={onCancel}
            disabled={submitting}
          >
            cancel
          </button>
          <button
            type="submit"
            className="ema-saw-cmd-btn__action"
            disabled={submitting}
          >
            {submitting ? "running" : "run"}
          </button>
        </div>
      </form>
    </div>
  );
}
