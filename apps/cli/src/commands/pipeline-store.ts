import { CANONICAL_DB, sqlEscape, sqliteJson } from "./substrate-utils.js";

export type PipelinePayload = Record<string, unknown>;

export interface CanonicalEventRow {
  readonly txid: number;
  readonly event_id: string;
  readonly kind: string;
  readonly ts: string;
  readonly actor: string;
  readonly org_id: string;
  readonly space_id: string | null;
  readonly project_id: string | null;
  readonly dispatch_id: string | null;
  readonly execution_id: string | null;
  readonly payload_json: string;
  readonly payload?: unknown;
}

export interface ActorRecord {
  readonly id: string;
  readonly actor_id: string;
  readonly kind: string;
  readonly display_name: string;
  readonly role: string | null;
  readonly dispatch: string | null;
  readonly perspective: string | null;
  readonly created_at: string;
  readonly created_by: string;
}

export interface IntentRecord {
  readonly id: string;
  readonly intent_id: string;
  readonly slug: string;
  readonly title: string;
  readonly body: string | null;
  readonly kind: string;
  readonly status: string;
  readonly project_id: string | null;
  readonly space_id: string | null;
  readonly actor_id: string;
  readonly exit_condition: string | null;
  readonly created_at: string;
  readonly updated_at: string;
}

export interface ProposalRecord {
  readonly id: string;
  readonly proposal_id: string;
  readonly intent_id: string;
  readonly title: string;
  readonly body: string | null;
  readonly plan: string | null;
  readonly status: string;
  readonly approver_required: boolean;
  readonly proposed_by_actor_id: string;
  readonly approved_by_actor_id: string | null;
  readonly rejected_by_actor_id: string | null;
  readonly rationale: string | null;
  readonly created_at: string;
  readonly decided_at: string | null;
}

export function parsePayload(value: string): unknown {
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

export function payloadObject(value: string): PipelinePayload {
  const parsed = parsePayload(value);
  return parsed && typeof parsed === "object" && !Array.isArray(parsed)
    ? parsed as PipelinePayload
    : {};
}

export function tableExists(table: string): boolean {
  return sqliteJson<{ name: string }>(
    CANONICAL_DB,
    `select name from sqlite_master where type='table' and name='${sqlEscape(table)}' limit 1;`,
  ).length > 0;
}

export function actorById(actorId: string): ActorRecord | null {
  return actorRecords().find((actor) => actor.actor_id === actorId) ?? null;
}

export function actorRecords(): ActorRecord[] {
  const rows = sqliteJson<CanonicalEventRow>(CANONICAL_DB, `
    select txid, event_id, kind, ts, actor, org_id, space_id, project_id,
           dispatch_id, execution_id, payload_json
    from events
    where kind = 'actor.created'
    order by txid asc;
  `);
  const byId = new Map<string, ActorRecord>();
  for (const row of rows) {
    const payload = payloadObject(row.payload_json);
    const actorId = stringField(payload, "actor_id") ?? stringField(payload, "id");
    if (!actorId) continue;
    byId.set(actorId, {
      id: actorId,
      actor_id: actorId,
      kind: stringField(payload, "kind") ?? "unknown",
      display_name: stringField(payload, "display_name") ?? actorId,
      role: stringField(payload, "role"),
      dispatch: stringField(payload, "dispatch"),
      perspective: stringField(payload, "perspective"),
      created_at: row.ts,
      created_by: row.actor,
    });
  }
  return [...byId.values()];
}

export function eventsMentioning(id: string): CanonicalEventRow[] {
  return sqliteJson<CanonicalEventRow>(CANONICAL_DB, `
    select txid, event_id, kind, ts, actor, org_id, space_id, project_id,
           dispatch_id, execution_id, payload_json
    from events
    where actor = '${sqlEscape(id)}'
       or payload_json like '%${sqlEscape(id)}%'
    order by txid asc;
  `).map((row) => ({ ...row, payload: parsePayload(row.payload_json) }));
}

export function intentById(intentId: string): IntentRecord | null {
  const fromTable = tableExists("intents")
    ? sqliteJson<IntentTableRow>(CANONICAL_DB, `
        select intent_id, slug, title, body, kind, status, project_id, space_id,
               actor_id, exit_condition, created_at, updated_at
        from intents
        where intent_id = '${sqlEscape(intentId)}'
        limit 1;
      `)[0]
    : null;
  if (fromTable) return normalizeIntentRow(fromTable);
  return intentFromEvents(intentId);
}

export function intentRecords(filters: {
  readonly project?: string;
  readonly space?: string;
  readonly actor?: string;
  readonly status?: string;
  readonly kind?: string;
} = {}): IntentRecord[] {
  if (tableExists("intents")) {
    const where = [
      filters.project ? `project_id = '${sqlEscape(filters.project)}'` : null,
      filters.space ? `space_id = '${sqlEscape(filters.space)}'` : null,
      filters.actor ? `actor_id = '${sqlEscape(filters.actor)}'` : null,
      filters.status ? `status = '${sqlEscape(filters.status)}'` : null,
      filters.kind ? `kind = '${sqlEscape(filters.kind)}'` : null,
    ].filter(Boolean);
    return sqliteJson<IntentTableRow>(CANONICAL_DB, `
      select intent_id, slug, title, body, kind, status, project_id, space_id,
             actor_id, exit_condition, created_at, updated_at
      from intents
      ${where.length > 0 ? `where ${where.join(" and ")}` : ""}
      order by created_at desc;
    `).map(normalizeIntentRow);
  }
  return intentRecordsFromEvents().filter((intent) =>
    (!filters.project || intent.project_id === filters.project) &&
    (!filters.space || intent.space_id === filters.space) &&
    (!filters.actor || intent.actor_id === filters.actor) &&
    (!filters.status || intent.status === filters.status) &&
    (!filters.kind || intent.kind === filters.kind)
  );
}

export function proposalById(proposalId: string): ProposalRecord | null {
  const fromTable = tableExists("proposals")
    ? sqliteJson<ProposalTableRow>(CANONICAL_DB, `
        select proposal_id, intent_id, title, body, plan, status,
               approver_required, proposed_by_actor_id, approved_by_actor_id,
               rejected_by_actor_id, rationale, created_at, decided_at
        from proposals
        where proposal_id = '${sqlEscape(proposalId)}'
        limit 1;
      `)[0]
    : null;
  if (fromTable) return normalizeProposalRow(fromTable);
  return proposalFromEvents(proposalId);
}

export function proposalRecords(filters: {
  readonly intent?: string;
  readonly status?: string;
} = {}): ProposalRecord[] {
  if (tableExists("proposals")) {
    const where = [
      filters.intent ? `intent_id = '${sqlEscape(filters.intent)}'` : null,
      filters.status ? `status = '${sqlEscape(filters.status)}'` : null,
    ].filter(Boolean);
    return sqliteJson<ProposalTableRow>(CANONICAL_DB, `
      select proposal_id, intent_id, title, body, plan, status,
             approver_required, proposed_by_actor_id, approved_by_actor_id,
             rejected_by_actor_id, rationale, created_at, decided_at
      from proposals
      ${where.length > 0 ? `where ${where.join(" and ")}` : ""}
      order by created_at desc;
    `).map(normalizeProposalRow);
  }
  return proposalRecordsFromEvents().filter((proposal) =>
    (!filters.intent || proposal.intent_id === filters.intent) &&
    (!filters.status || proposal.status === filters.status)
  );
}

export function proposalsForIntent(intentId: string): ProposalRecord[] {
  return proposalRecords({ intent: intentId });
}

function intentFromEvents(intentId: string): IntentRecord | null {
  return intentRecordsFromEvents().find((intent) => intent.intent_id === intentId) ?? null;
}

function intentRecordsFromEvents(): IntentRecord[] {
  const rows = sqliteJson<CanonicalEventRow>(CANONICAL_DB, `
    select txid, event_id, kind, ts, actor, org_id, space_id, project_id,
           dispatch_id, execution_id, payload_json
    from events
    where kind in ('intent.created', 'intent.updated')
    order by txid asc;
  `);
  const byId = new Map<string, IntentRecord>();
  for (const row of rows) {
    const payload = payloadObject(row.payload_json);
    const intentId = stringField(payload, "intent_id");
    if (!intentId) continue;
    if (row.kind === "intent.created") {
      byId.set(intentId, {
        id: intentId,
        intent_id: intentId,
        slug: stringField(payload, "slug") ?? intentId.toLowerCase(),
        title: stringField(payload, "title") ?? intentId,
        body: stringField(payload, "body"),
        kind: stringField(payload, "kind") ?? "feature",
        status: stringField(payload, "status") ?? "open",
        project_id: stringField(payload, "project_id"),
        space_id: stringField(payload, "space_id"),
        actor_id: stringField(payload, "actor_id") ?? row.actor,
        exit_condition: stringField(payload, "exit_condition"),
        created_at: stringField(payload, "created_at") ?? row.ts,
        updated_at: row.ts,
      });
      continue;
    }
    const current = byId.get(intentId);
    if (!current) continue;
    byId.set(intentId, {
      ...current,
      title: stringField(payload, "title") ?? current.title,
      body: "body" in payload ? stringField(payload, "body") : current.body,
      status: stringField(payload, "status") ?? current.status,
      exit_condition: "exit_condition" in payload ? stringField(payload, "exit_condition") : current.exit_condition,
      updated_at: stringField(payload, "updated_at") ?? row.ts,
    });
  }
  return [...byId.values()].sort((a, b) => b.created_at.localeCompare(a.created_at));
}

function proposalFromEvents(proposalId: string): ProposalRecord | null {
  return proposalRecordsFromEvents().find((proposal) => proposal.proposal_id === proposalId) ?? null;
}

function proposalRecordsFromEvents(): ProposalRecord[] {
  const rows = sqliteJson<CanonicalEventRow>(CANONICAL_DB, `
    select txid, event_id, kind, ts, actor, org_id, space_id, project_id,
           dispatch_id, execution_id, payload_json
    from events
    where kind in ('proposal.drafted', 'proposal.created', 'proposal.approved', 'proposal.rejected')
    order by txid asc;
  `);
  const byId = new Map<string, ProposalRecord>();
  for (const row of rows) {
    const payload = payloadObject(row.payload_json);
    const proposalId = stringField(payload, "proposal_id");
    if (!proposalId) continue;
    if (row.kind === "proposal.created" || row.kind === "proposal.drafted") {
      byId.set(proposalId, {
        id: proposalId,
        proposal_id: proposalId,
        intent_id: stringField(payload, "intent_id") ?? "",
        title: stringField(payload, "title") ?? proposalId,
        body: stringField(payload, "body"),
        plan: stringField(payload, "plan"),
        status: row.kind === "proposal.drafted" ? "drafted" : stringField(payload, "status") ?? "created",
        approver_required: boolField(payload, "approver_required") ?? row.kind !== "proposal.drafted",
        proposed_by_actor_id: stringField(payload, "proposed_by_actor_id") ?? stringField(payload, "draft_by") ?? row.actor,
        approved_by_actor_id: null,
        rejected_by_actor_id: null,
        rationale: null,
        created_at: stringField(payload, "created_at") ?? row.ts,
        decided_at: null,
      });
      continue;
    }
    const current = byId.get(proposalId);
    if (!current) continue;
    if (row.kind === "proposal.approved") {
      byId.set(proposalId, {
        ...current,
        status: "approved",
        approved_by_actor_id: stringField(payload, "approved_by_actor_id") ?? row.actor,
        rationale: stringField(payload, "rationale"),
        decided_at: stringField(payload, "approved_at") ?? row.ts,
      });
    } else if (row.kind === "proposal.rejected") {
      byId.set(proposalId, {
        ...current,
        status: "rejected",
        rejected_by_actor_id: stringField(payload, "rejected_by_actor_id") ?? row.actor,
        rationale: stringField(payload, "rationale"),
        decided_at: stringField(payload, "rejected_at") ?? row.ts,
      });
    }
  }
  return [...byId.values()].sort((a, b) => b.created_at.localeCompare(a.created_at));
}

type IntentTableRow = {
  readonly intent_id: string;
  readonly slug: string;
  readonly title: string;
  readonly body: string | null;
  readonly kind: string;
  readonly status: string;
  readonly project_id: string | null;
  readonly space_id: string | null;
  readonly actor_id: string;
  readonly exit_condition: string | null;
  readonly created_at: string;
  readonly updated_at: string;
};

type ProposalTableRow = {
  readonly proposal_id: string;
  readonly intent_id: string;
  readonly title: string;
  readonly body: string | null;
  readonly plan: string | null;
  readonly status: string;
  readonly approver_required: number | string | boolean;
  readonly proposed_by_actor_id: string;
  readonly approved_by_actor_id: string | null;
  readonly rejected_by_actor_id: string | null;
  readonly rationale: string | null;
  readonly created_at: string;
  readonly decided_at: string | null;
};

function normalizeIntentRow(row: IntentTableRow): IntentRecord {
  return {
    id: row.intent_id,
    intent_id: row.intent_id,
    slug: row.slug,
    title: row.title,
    body: row.body,
    kind: row.kind,
    status: row.status,
    project_id: row.project_id,
    space_id: row.space_id,
    actor_id: row.actor_id,
    exit_condition: row.exit_condition,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

function normalizeProposalRow(row: ProposalTableRow): ProposalRecord {
  return {
    id: row.proposal_id,
    proposal_id: row.proposal_id,
    intent_id: row.intent_id,
    title: row.title,
    body: row.body,
    plan: row.plan,
    status: row.status,
    approver_required: boolish(row.approver_required),
    proposed_by_actor_id: row.proposed_by_actor_id,
    approved_by_actor_id: row.approved_by_actor_id,
    rejected_by_actor_id: row.rejected_by_actor_id,
    rationale: row.rationale,
    created_at: row.created_at,
    decided_at: row.decided_at,
  };
}

export function stringField(payload: PipelinePayload, key: string): string | null {
  const value = payload[key];
  return typeof value === "string" && value.length > 0 ? value : null;
}

function boolField(payload: PipelinePayload, key: string): boolean | null {
  const value = payload[key];
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;
  if (typeof value === "string") return value === "true" || value === "1";
  return null;
}

function boolish(value: number | string | boolean): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;
  return value === "1" || value === "true";
}
