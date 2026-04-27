// RIP: place.org Brain Dump (GTD inbox capture + queue-and-clarify pattern)
//      from atlas/ema-atlas origin/docs-place-org-era-research,
//      host/place.org-openclaw/docs/superpowers/specs/2026-03-20-place-org-design.md §5a
//
// EMA framing: Brain Dump is the first intent-capture surface. Everything
// typed here is `intent` in the intent → proposal → plan → spec → execution
// → canon pipeline (Master Design Doc §6). Until `ema_blueprint` / a future
// `ema_intents` writer ships, entries are persisted `local only` per the
// place-org-ux-manifesto staged-projection taxonomy; Task / Journal / Archive
// tags are `pending daemon writer` — the tag is intent, not action.

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";

import { EMA_SCOPE, MOCK_PROJECTION_LABEL } from "../../app/mock-projections";

type ProcessTag = "task" | "journal" | "archive";

type BrainDumpEntry = {
  id: string;
  text: string;
  created_at: string;
  source: "keyboard" | "voice";
  process_tag: ProcessTag | null;
};

const STORAGE_KEY = `ema:braindump:${EMA_SCOPE.projectId}`;

const CLI_HINT = `ema intent capture --project "${EMA_SCOPE.projectName}" "your thought here"`;

function loadFromLocalStorage(): BrainDumpEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (e): e is BrainDumpEntry =>
        typeof e === "object" &&
        e !== null &&
        typeof (e as BrainDumpEntry).id === "string" &&
        typeof (e as BrainDumpEntry).text === "string" &&
        typeof (e as BrainDumpEntry).created_at === "string",
    );
  } catch {
    return [];
  }
}

function saveToLocalStorage(entries: BrainDumpEntry[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch {
    // quota exceeded or private mode — entries are lost on reload; that's
    // fine for a local-only store.
  }
}

function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `local:${crypto.randomUUID()}`;
  }
  return `local:${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function relativeTime(isoNow: string, isoThen: string): string {
  const now = new Date(isoNow).getTime();
  const then = new Date(isoThen).getTime();
  const delta = Math.max(0, Math.floor((now - then) / 1000));
  if (delta < 5) return "just now";
  if (delta < 60) return `${delta}s ago`;
  if (delta < 3600) return `${Math.floor(delta / 60)}m ago`;
  if (delta < 86400) return `${Math.floor(delta / 3600)}h ago`;
  const days = Math.floor(delta / 86400);
  return `${days}d ago`;
}

export function BrainDumpPage() {
  const [entries, setEntries] = useState<BrainDumpEntry[]>(() => loadFromLocalStorage());
  const [draft, setDraft] = useState("");
  const [nowIso, setNowIso] = useState(() => new Date().toISOString());
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    saveToLocalStorage(entries);
  }, [entries]);

  useEffect(() => {
    const id = window.setInterval(() => setNowIso(new Date().toISOString()), 30_000);
    return () => window.clearInterval(id);
  }, []);

  const submit = useCallback(() => {
    const text = draft.trim();
    if (!text) return;
    const entry: BrainDumpEntry = {
      id: newId(),
      text,
      created_at: new Date().toISOString(),
      source: "keyboard",
      process_tag: null,
    };
    setEntries((prev) => [entry, ...prev]);
    setDraft("");
    textareaRef.current?.focus();
  }, [draft]);

  const handleKey = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
        e.preventDefault();
        submit();
      }
    },
    [submit],
  );

  const tagEntry = useCallback((id: string, tag: ProcessTag | null) => {
    setEntries((prev) =>
      prev.map((e) => (e.id === id ? { ...e, process_tag: tag } : e)),
    );
  }, []);

  const deleteEntry = useCallback((id: string) => {
    setEntries((prev) => prev.filter((e) => e.id !== id));
  }, []);

  const counts = useMemo(() => {
    const total = entries.length;
    const tagged = entries.filter((e) => e.process_tag !== null).length;
    const unprocessed = total - tagged;
    const chars = draft.length;
    const words = draft.trim() === "" ? 0 : draft.trim().split(/\s+/).length;
    return { total, tagged, unprocessed, chars, words };
  }, [entries, draft]);

  const canSubmit = draft.trim().length > 0;

  return (
    <section className="ema-vapp ema-vapp--braindump">
      <header className="ema-vapp__header ema-vapp__header--split">
        <div>
          <p className="ema-kicker">intent capture</p>
          <h1>Brain Dump</h1>
          <p className="ema-vapp__tagline">
            Fast capture, clarify later. Every entry is <em>intent</em> in the
            canonical pipeline: intent → proposal → plan → spec → execution →
            canon. Nothing here touches canon until a writer promotes it.
          </p>
          <p className="ema-bd-meta">
            <code>{EMA_SCOPE.projectName}</code> ·{" "}
            {counts.total} {counts.total === 1 ? "entry" : "entries"} ·{" "}
            {counts.unprocessed} unprocessed · {counts.tagged} tagged
          </p>
        </div>
        <aside className="ema-bd-notice" aria-label="staged projection notice">
          <span className="ema-pill ema-pill--hot">{MOCK_PROJECTION_LABEL}</span>
          <strong>Local only until the intent writer lands.</strong>
          <p>
            Entries persist in <code>localStorage</code> under{" "}
            <code>{STORAGE_KEY}</code>. Task / Journal / Archive tags are
            <code> pending daemon writer</code> — the tag is a local
            classification, not an action.
          </p>
        </aside>
      </header>

      <form
        className="ema-bd-capture"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
        aria-label="Capture a thought"
      >
        <textarea
          ref={textareaRef}
          className="ema-bd-capture__input"
          placeholder="What's on your mind? Enter to capture · Shift+Enter for newline"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKey}
          rows={3}
          autoFocus
          aria-label="Brain Dump entry"
        />
        <footer className="ema-bd-capture__footer">
          <div className="ema-bd-capture__meters">
            <span>{counts.words} {counts.words === 1 ? "word" : "words"}</span>
            <span>{counts.chars} chars</span>
            <span className="ema-pill" data-state="local">local only</span>
          </div>
          <div className="ema-bd-capture__actions">
            <button
              type="button"
              className="ema-secondary-action"
              disabled
              title="pending daemon writer — Web Speech capture not wired yet"
              aria-label="Voice capture (pending daemon writer)"
            >
              <span>Voice</span>
              <small>pending daemon writer</small>
            </button>
            <button
              type="submit"
              className="ema-primary-action"
              disabled={!canSubmit}
            >
              <span>Capture</span>
              <kbd>Enter</kbd>
            </button>
          </div>
        </footer>
      </form>

      <section className="ema-bd-queue" aria-label="Brain Dump queue">
        <div className="ema-panel__heading">
          <div>
            <p className="ema-kicker">queue</p>
            <h2>Unprocessed & tagged</h2>
          </div>
          <div className="ema-bd-queue__meta">
            <span className="ema-pill" data-state="local">local only</span>
            <button
              type="button"
              className="ema-secondary-action"
              disabled
              title="pending daemon writer — batch Process Mode lands with the intent writer"
            >
              <span>Process Mode</span>
              <small>pending daemon writer</small>
            </button>
          </div>
        </div>

        {entries.length === 0 ? (
          <EmptyState cliHint={CLI_HINT} />
        ) : (
          <ol className="ema-bd-queue__list">
            {entries.map((entry) => (
              <EntryCard
                key={entry.id}
                entry={entry}
                nowIso={nowIso}
                onTag={(tag) => tagEntry(entry.id, tag)}
                onClearTag={() => tagEntry(entry.id, null)}
                onDelete={() => deleteEntry(entry.id)}
              />
            ))}
          </ol>
        )}
      </section>
    </section>
  );
}

function EmptyState({ cliHint }: { cliHint: string }) {
  return (
    <div className="ema-bd-empty">
      <p className="ema-kicker">queue is empty</p>
      <p>Capture a thought above. Or use the CLI equivalent:</p>
      <code className="ema-saw-cli">{cliHint}</code>
      <p className="ema-bd-empty__hint">
        The CLI is <code>pending daemon writer</code> — same honest state as
        every intent-writing control in 0.0.5.
      </p>
    </div>
  );
}

function EntryCard({
  entry,
  nowIso,
  onTag,
  onClearTag,
  onDelete,
}: {
  entry: BrainDumpEntry;
  nowIso: string;
  onTag: (tag: ProcessTag) => void;
  onClearTag: () => void;
  onDelete: () => void;
}) {
  const rel = relativeTime(nowIso, entry.created_at);
  const tag = entry.process_tag;

  return (
    <li className="ema-bd-card" data-tag={tag ?? "untagged"}>
      <header className="ema-bd-card__meta">
        <span className="ema-kicker">{rel}</span>
        <span className="ema-pill" data-state="local">local only</span>
        {tag && (
          <span className="ema-pill ema-pill--hot" data-tag={tag}>
            tagged for: {tag} · pending daemon writer
          </span>
        )}
      </header>
      <p className="ema-bd-card__text">{entry.text}</p>
      <footer className="ema-bd-card__actions">
        <div className="ema-bd-card__tag-row" role="group" aria-label="Tag entry">
          <TagButton
            label="Task"
            active={tag === "task"}
            onClick={() => onTag("task")}
          />
          <TagButton
            label="Journal"
            active={tag === "journal"}
            onClick={() => onTag("journal")}
          />
          <TagButton
            label="Archive"
            active={tag === "archive"}
            onClick={() => onTag("archive")}
          />
          {tag && (
            <button
              type="button"
              className="ema-bd-card__clear"
              onClick={onClearTag}
              aria-label="Clear tag"
            >
              clear tag
            </button>
          )}
        </div>
        <button
          type="button"
          className="ema-bd-card__delete"
          onClick={onDelete}
          aria-label="Delete entry (local only)"
          title="Delete this entry — local only, no canonical effect"
        >
          delete
        </button>
      </footer>
    </li>
  );
}

function TagButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className="ema-bd-card__tag-btn"
      data-active={active ? "true" : "false"}
      onClick={onClick}
      title="pending daemon writer — tag is a local classification, no canon effect"
    >
      <span>{label}</span>
      {!active && <small>pending daemon writer</small>}
    </button>
  );
}
