import { listIncidents } from "../../lib/db";
import { IncidentRow } from "../../components/IncidentRow";
import { SERVICES } from "../../lib/services";

export const dynamic = "force-dynamic";

interface SearchParams {
  id?: string;
}

export default async function IncidentsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const incidents = listIncidents();
  const selectedId = params.id ? Number(params.id) : null;
  const selected =
    selectedId != null ? incidents.find((i) => i.id === selectedId) : null;

  return (
    <main>
      <header style={{ marginBottom: 24 }}>
        <div className="eyebrow">Autharis status</div>
        <h1 className="display">Incident history</h1>
        <p style={{ color: "var(--ink-3)", margin: "4px 0 0", maxWidth: 640 }}>
          Past and ongoing incidents across Autharis services. Click any row for
          the full postmortem note.
        </p>
      </header>

      {selected ? (
        <section className="paper" style={{ marginBottom: 28 }}>
          <div className="eyebrow" style={{ marginBottom: 6 }}>
            Incident #{selected.id}
          </div>
          <h2 style={{ margin: "0 0 8px" }}>
            {SERVICES.find((s) => s.id === selected.service)?.name ??
              selected.service}
          </h2>
          <div style={{ color: "var(--ink-3)", fontSize: "var(--fs-sm)" }}>
            Opened{" "}
            <span className="mono">
              {new Date(selected.opened_at).toISOString()}
            </span>{" "}
            · Closed{" "}
            <span className="mono">
              {selected.closed_at
                ? new Date(selected.closed_at).toISOString()
                : "—"}
            </span>
          </div>
          <p style={{ marginTop: 12 }}>{selected.note}</p>
          <a href="/incidents" style={{ fontSize: "var(--fs-sm)" }}>
            ← back to all
          </a>
        </section>
      ) : null}

      <section className="paper">
        {incidents.length === 0 ? (
          <div style={{ color: "var(--ink-3)" }}>
            No incidents recorded. Run <span className="mono">pnpm seed</span>{" "}
            to populate a synthetic history.
          </div>
        ) : (
          incidents.map((inc) => (
            <a
              key={inc.id}
              href={`/incidents?id=${inc.id}`}
              style={{ textDecoration: "none", display: "block" }}
            >
              <IncidentRow incident={inc} />
            </a>
          ))
        )}
      </section>
    </main>
  );
}
