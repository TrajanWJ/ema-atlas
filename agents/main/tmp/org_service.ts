import { EventEmitter } from "node:events";

import { nanoid } from "nanoid";

import {
  membershipReceiptSchema,
  organizationInvitationSchema,
  organizationMemberSchema,
  organizationSchema,
  spaceMemberSchema,
  type MembershipReceipt,
  type Organization,
  type OrganizationInvitation,
  type OrganizationMember,
  type OrgRole,
} from "@ema/shared/schemas";
import { getDb } from "../../persistence/db.js";
import { getSpace } from "../spaces/service.js";
import { applyOrganizationsDdl } from "./schema.js";

type DbRow = Record<string, unknown>;

type JoinRequest = {
  display_name: string;
  email?: string | null | undefined;
  actor_id?: string | null | undefined;
};

export const organizationsEvents = new EventEmitter();

let initialised = false;

function nowIso(): string {
  return new Date().toISOString();
}

function encode(value: unknown): string {
  return JSON.stringify(value);
}

function decode<T>(raw: unknown, fallback: T): T {
  if (typeof raw !== "string" || raw.length === 0) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function slugify(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
}

function coerceBoolean(value: unknown): boolean {
  return value === 1 || value === true || value === "1";
}

function mapOrganizationRow(row: DbRow | undefined): Organization | null {
  if (!row) return null;
  const candidate = {
    id: String(row.id),
    name: String(row.name),
    slug: String(row.slug),
    description: typeof row.description === "string" ? row.description : null,
    avatar_url: typeof row.avatar_url === "string" ? row.avatar_url : null,
    owner_id: String(row.owner_id),
    settings: decode<Record<string, unknown>>(row.settings, {}),
    inserted_at: String(row.inserted_at),
    updated_at: String(row.updated_at),
  };
  const parsed = organizationSchema.safeParse(candidate);
  return parsed.success ? parsed.data : null;
}

function mapMemberRow(row: DbRow | undefined): OrganizationMember | null {
  if (!row) return null;
  const candidate = {
    id: String(row.id),
    organization_id: String(row.organization_id),
    actor_id: typeof row.actor_id === "string" ? row.actor_id : null,
    display_name: String(row.display_name),
    email: typeof row.email === "string" ? row.email : null,
    role: String(row.role),
    status: String(row.status),
    identity_pubkey:
      typeof row.identity_pubkey === "string" ? row.identity_pubkey : null,
    joined_at: typeof row.joined_at === "string" ? row.joined_at : null,
    invited_by: typeof row.invited_by === "string" ? row.invited_by : null,
    inserted_at: String(row.inserted_at),
    updated_at: String(row.updated_at),
  };
  const parsed = organizationMemberSchema.safeParse(candidate);
  return parsed.success ? parsed.data : null;
}

function mapInvitationRow(row: DbRow | undefined): OrganizationInvitation | null {
  if (!row) return null;
  const candidate = {
    id: String(row.id),
    organization_id: String(row.organization_id),
    token: String(row.token),
    role: String(row.role),
    created_by: String(row.created_by),
    expires_at: typeof row.expires_at === "string" ? row.expires_at : null,
    max_uses: typeof row.max_uses === "number" ? row.max_uses : null,
    use_count: Number(row.use_count ?? 0),
    used_by: decode<string[]>(row.used_by, []),
    starter_space_ids: decode<string[]>(row.starter_space_ids, []),
    revoked: coerceBoolean(row.revoked),
    link: typeof row.link === "string" ? row.link : null,
    inserted_at: String(row.inserted_at),
    updated_at: String(row.updated_at),
  };
  const parsed = organizationInvitationSchema.safeParse(candidate);
  return parsed.success ? parsed.data : null;
}

function mapReceiptRow(row: DbRow | undefined): MembershipReceipt | null {
  if (!row) return null;
  const candidate = {
    id: String(row.id),
    organization_id: String(row.organization_id),
    organization_member_id: String(row.organization_member_id),
    source_kind: String(row.source_kind),
    source_ref: typeof row.source_ref === "string" ? row.source_ref : null,
    granted_role: String(row.granted_role),
    starter_space_ids: decode<string[]>(row.starter_space_ids, []),
    accepted_at: typeof row.accepted_at === "string" ? row.accepted_at : null,
    revoked_at: typeof row.revoked_at === "string" ? row.revoked_at : null,
    inserted_at: String(row.inserted_at),
    updated_at: String(row.updated_at),
  };
  const parsed = membershipReceiptSchema.safeParse(candidate);
  return parsed.success ? parsed.data : null;
}

function getOrgRow(ref: string): DbRow | undefined {
  const db = getDb();
  return db
    .prepare("SELECT * FROM organizations WHERE id = ? OR slug = ? LIMIT 1")
    .get(ref, ref) as DbRow | undefined;
}

export class OrganizationNotFoundError extends Error {
  public readonly code = "organization_not_found";
  constructor(public readonly ref: string) {
    super(`Organization not found: ${ref}`);
  }
}

export class OrganizationSlugTakenError extends Error {
  public readonly code = "organization_slug_taken";
  constructor(public readonly slug: string) {
    super(`Organization slug already exists: ${slug}`);
  }
}

export class InvitationNotFoundError extends Error {
  public readonly code = "invitation_not_found";
  constructor(public readonly ref: string) {
    super(`Invitation not found: ${ref}`);
  }
}

export class InvitationInvalidError extends Error {
  public readonly code = "invitation_invalid";
  constructor(message: string) {
    super(message);
  }
}

export class OrganizationMemberNotFoundError extends Error {
  public readonly code = "organization_member_not_found";
  constructor(public readonly memberId: string) {
    super(`Organization member not found: ${memberId}`);
  }
}

export function initOrganizations(): void {
  if (initialised) return;
  applyOrganizationsDdl(getDb());
  initialised = true;
}

export interface CreateOrganizationInput {
  name: string;
  slug?: string | undefined;
  description?: string | null | undefined;
  avatar_url?: string | null | undefined;
  owner_id?: string | undefined;
  owner_display_name?: string | undefined;
  owner_email?: string | null | undefined;
  settings?: Record<string, unknown> | undefined;
  actor?: string | undefined;
}

export interface UpdateOrganizationInput {
  name?: string | undefined;
  slug?: string | undefined;
  description?: string | null | undefined;
  avatar_url?: string | null | undefined;
  settings?: Record<string, unknown> | undefined;
}

export interface CreateInvitationInput {
  created_by: string;
  role?: OrgRole | undefined;
  expires_at?: string | null | undefined;
  max_uses?: number | null | undefined;
  starter_space_ids?: string[] | undefined;
}

export function listOrganizations(): Organization[] {
  initOrganizations();
  const db = getDb();
  const rows = db
    .prepare("SELECT * FROM organizations ORDER BY inserted_at DESC")
    .all() as DbRow[];
  return rows
    .map((row) => mapOrganizationRow(row))
    .filter((row): row is Organization => row !== null);
}

export function getOrganization(ref: string): Organization | null {
  initOrganizations();
  return mapOrganizationRow(getOrgRow(ref));
}

export function requireOrganization(ref: string): Organization {
  const org = getOrganization(ref);
  if (!org) throw new OrganizationNotFoundError(ref);
  return org;
}

function requireInvitationByToken(token: string): OrganizationInvitation {
  initOrganizations();
  const db = getDb();
  const row = db
    .prepare("SELECT * FROM organization_invitations WHERE token = ? LIMIT 1")
    .get(token) as DbRow | undefined;
  const invitation = mapInvitationRow(row);
  if (!invitation) throw new InvitationNotFoundError(token);
  return invitation;
}

function requireMember(orgId: string, memberId: string): OrganizationMember {
  const db = getDb();
  const row = db
    .prepare(
      "SELECT * FROM organization_members WHERE organization_id = ? AND id = ? LIMIT 1",
    )
    .get(orgId, memberId) as DbRow | undefined;
  const member = mapMemberRow(row);
  if (!member) throw new OrganizationMemberNotFoundError(memberId);
  return member;
}

export function listOrganizationMembers(orgRef: string): OrganizationMember[] {
  initOrganizations();
  const org = requireOrganization(orgRef);
  const db = getDb();
  const rows = db
    .prepare(
      "SELECT * FROM organization_members WHERE organization_id = ? ORDER BY inserted_at ASC",
    )
    .all(org.id) as DbRow[];
  return rows
    .map((row) => mapMemberRow(row))
    .filter((row): row is OrganizationMember => row !== null);
}

export function listOrganizationInvitations(orgRef: string): OrganizationInvitation[] {
  initOrganizations();
  const org = requireOrganization(orgRef);
  const db = getDb();
  const rows = db
    .prepare(
      "SELECT * FROM organization_invitations WHERE organization_id = ? ORDER BY inserted_at DESC",
    )
    .all(org.id) as DbRow[];
  return rows
    .map((row) => mapInvitationRow(row))
    .filter((row): row is OrganizationInvitation => row !== null);
}

export function listMembershipReceipts(orgRef: string): MembershipReceipt[] {
  initOrganizations();
  const org = requireOrganization(orgRef);
  const db = getDb();
  const rows = db
    .prepare(
      "SELECT * FROM membership_receipts WHERE organization_id = ? ORDER BY inserted_at DESC",
    )
    .all(org.id) as DbRow[];
  return rows
    .map((row) => mapReceiptRow(row))
    .filter((row): row is MembershipReceipt => row !== null);
}

export function createOrganization(input: CreateOrganizationInput): Organization {
  initOrganizations();
  const db = getDb();
  const now = nowIso();
  const name = input.name.trim();
  const slug = slugify(input.slug ?? name);
  if (!slug) throw new OrganizationSlugTakenError("invalid-empty-slug");

  const existing = db
    .prepare("SELECT id FROM organizations WHERE slug = ? LIMIT 1")
    .get(slug) as DbRow | undefined;
  if (existing) throw new OrganizationSlugTakenError(slug);

  const orgId = `org_${nanoid(12)}`;
  const ownerId = input.owner_id ?? input.actor ?? `actor:local:${nanoid(10)}`;
  const ownerMemberId = `orgm_${nanoid(12)}`;

  db.prepare(
    `INSERT INTO organizations (
      id, name, slug, description, avatar_url, owner_id, settings, inserted_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    orgId,
    name,
    slug,
    input.description ?? null,
    input.avatar_url ?? null,
    ownerId,
    JSON.stringify(input.settings ?? {}),
    now,
    now,
  );

  db.prepare(
    `INSERT INTO organization_members (
      id, organization_id, actor_id, display_name, email, role, status, identity_pubkey, joined_at, invited_by, inserted_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, 'owner', 'active', NULL, ?, NULL, ?, ?)`,
  ).run(
    ownerMemberId,
    orgId,
    ownerId,
    input.owner_display_name ?? "Owner",
    input.owner_email ?? null,
    now,
    now,
    now,
  );

  const org = requireOrganization(orgId);
  organizationsEvents.emit("org:created", org);
  return org;
}

export function updateOrganization(ref: string, input: UpdateOrganizationInput): Organization {
  initOrganizations();
  const db = getDb();
  const org = requireOrganization(ref);
  const slug = input.slug !== undefined ? slugify(input.slug) : org.slug;
  if (!slug) throw new OrganizationSlugTakenError("invalid-empty-slug");
  const existing = db
    .prepare("SELECT id FROM organizations WHERE slug = ? AND id != ? LIMIT 1")
    .get(slug, org.id) as DbRow | undefined;
  if (existing) throw new OrganizationSlugTakenError(slug);

  db.prepare(
    `UPDATE organizations
       SET name = ?, slug = ?, description = ?, avatar_url = ?, settings = ?, updated_at = ?
     WHERE id = ?`,
  ).run(
    input.name?.trim() || org.name,
    slug,
    input.description !== undefined ? input.description : org.description,
    input.avatar_url !== undefined ? input.avatar_url : org.avatar_url ?? null,
    JSON.stringify(input.settings ?? org.settings),
    nowIso(),
    org.id,
  );

  const updated = requireOrganization(org.id);
  organizationsEvents.emit("org:updated", updated);
  return updated;
}

export function deleteOrganization(ref: string): { deleted: true; id: string } {
  initOrganizations();
  const db = getDb();
  const org = requireOrganization(ref);
  db.prepare("DELETE FROM membership_receipts WHERE organization_id = ?").run(org.id);
  db.prepare("DELETE FROM organization_invitations WHERE organization_id = ?").run(org.id);
  db.prepare("DELETE FROM organization_members WHERE organization_id = ?").run(org.id);
  db.prepare("UPDATE spaces SET organization_id = NULL WHERE organization_id = ?").run(org.id);
  db.prepare("DELETE FROM organizations WHERE id = ?").run(org.id);
  organizationsEvents.emit("org:deleted", { id: org.id });
  return { deleted: true, id: org.id };
}

function validateStarterSpaces(ids: string[]): string[] {
  return ids.map((id) => {
    const space = getSpace(id);
    if (!space) throw new InvitationInvalidError(`starter_space_missing:${id}`);
    return space.id;
  });
}

export function createInvitation(orgRef: string, input: CreateInvitationInput): { invitation: OrganizationInvitation; link: string } {
  initOrganizations();
  const db = getDb();
  const org = requireOrganization(orgRef);
  const now = nowIso();
  const starterSpaceIds = validateStarterSpaces(input.starter_space_ids ?? []);
  const id = `orginv_${nanoid(12)}`;
  const token = `orgtok_${nanoid(24)}`;
  const link = `/join/${token}`;

  db.prepare(
    `INSERT INTO organization_invitations (
      id, organization_id, token, role, created_by, expires_at, max_uses, use_count, used_by, starter_space_ids, revoked, link, inserted_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, 0, '[]', ?, 0, ?, ?, ?)`,
  ).run(
    id,
    org.id,
    token,
    input.role ?? "member",
    input.created_by,
    input.expires_at ?? null,
    input.max_uses ?? null,
    JSON.stringify(starterSpaceIds),
    link,
    now,
    now,
  );

  const invitation = requireInvitationByToken(token);
  organizationsEvents.emit("org:invitation_created", invitation);
  return { invitation, link };
}

export function revokeInvitation(orgRef: string, invitationId: string): OrganizationInvitation {
  initOrganizations();
  const db = getDb();
  const org = requireOrganization(orgRef);
  db.prepare(
    `UPDATE organization_invitations
        SET revoked = 1, updated_at = ?
      WHERE organization_id = ? AND id = ?`,
  ).run(nowIso(), org.id, invitationId);
  const row = db
    .prepare(
      "SELECT * FROM organization_invitations WHERE organization_id = ? AND id = ? LIMIT 1",
    )
    .get(org.id, invitationId) as DbRow | undefined;
  const invitation = mapInvitationRow(row);
  if (!invitation) throw new InvitationNotFoundError(invitationId);
  organizationsEvents.emit("org:invitation_revoked", invitation);
  return invitation;
}

function ensureInvitationUsable(invitation: OrganizationInvitation): void {
  if (invitation.revoked) throw new InvitationInvalidError("invitation_revoked");
  if (invitation.expires_at && new Date(invitation.expires_at).getTime() < Date.now()) {
    throw new InvitationInvalidError("invitation_expired");
  }
  const maxUses = invitation.max_uses ?? null;
  if (maxUses !== null && invitation.use_count >= maxUses) {
    throw new InvitationInvalidError("invitation_exhausted");
  }
}

export function previewInvitation(token: string): {
  org: Organization;
  invitation: OrganizationInvitation;
} {
  initOrganizations();
  const invitation = requireInvitationByToken(token);
  const org = requireOrganization(invitation.organization_id);
  ensureInvitationUsable(invitation);
  return { org, invitation };
}

function attachStarterSpaces(actorId: string, starterSpaceIds: string[]): void {
  const db = getDb();
  for (const spaceId of starterSpaceIds) {
    const row = db
      .prepare("SELECT members FROM spaces WHERE id = ? LIMIT 1")
      .get(spaceId) as DbRow | undefined;
    if (!row) continue;
    const members = decode<Array<{ actor_id: string; role: string }>>(row.members, []);
    if (members.some((member) => member.actor_id === actorId)) continue;
    const next = [...members, spaceMemberSchema.parse({ actor_id: actorId, role: "member" })];
    db.prepare("UPDATE spaces SET members = ? WHERE id = ?").run(JSON.stringify(next), spaceId);
  }
}

export function acceptInvitation(token: string, request: JoinRequest): {
  org: Organization;
  member: OrganizationMember;
  receipt: MembershipReceipt;
} {
  initOrganizations();
  const db = getDb();
  const invitation = requireInvitationByToken(token);
  ensureInvitationUsable(invitation);
  const org = requireOrganization(invitation.organization_id);
  const now = nowIso();
  const actorId = request.actor_id ?? `actor:local:${nanoid(10)}`;

  const existing = db
    .prepare(
      `SELECT * FROM organization_members
        WHERE organization_id = ? AND actor_id = ? LIMIT 1`,
    )
    .get(org.id, actorId) as DbRow | undefined;
  let member = mapMemberRow(existing);

  if (!member) {
    const memberId = `orgm_${nanoid(12)}`;
    db.prepare(
      `INSERT INTO organization_members (
        id, organization_id, actor_id, display_name, email, role, status, identity_pubkey, joined_at, invited_by, inserted_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, 'active', NULL, ?, ?, ?, ?)`,
    ).run(
      memberId,
      org.id,
      actorId,
      request.display_name,
      request.email ?? null,
      invitation.role,
      now,
      invitation.created_by,
      now,
      now,
    );
    member = requireMember(org.id, memberId);
  }

  const usedBy = Array.from(new Set([...(invitation.used_by ?? []), member.id]));
  db.prepare(
    `UPDATE organization_invitations
        SET use_count = use_count + 1,
            used_by = ?,
            updated_at = ?
      WHERE id = ?`,
  ).run(JSON.stringify(usedBy), now, invitation.id);

  const receiptId = `orgrec_${nanoid(12)}`;
  db.prepare(
    `INSERT INTO membership_receipts (
      id, organization_id, organization_member_id, source_kind, source_ref, granted_role, starter_space_ids, accepted_at, revoked_at, inserted_at, updated_at
    ) VALUES (?, ?, ?, 'invite', ?, ?, ?, ?, NULL, ?, ?)`,
  ).run(
    receiptId,
    org.id,
    member.id,
    invitation.id,
    member.role,
    JSON.stringify(invitation.starter_space_ids),
    now,
    now,
    now,
  );

  attachStarterSpaces(actorId, invitation.starter_space_ids);
  const receiptRow = db
    .prepare("SELECT * FROM membership_receipts WHERE id = ? LIMIT 1")
    .get(receiptId) as DbRow | undefined;
  const receipt = mapReceiptRow(receiptRow);
  if (!receipt) throw new InvitationInvalidError("receipt_write_failed");
  organizationsEvents.emit("org:member_joined", member);
  return { org, member, receipt };
}

export function removeOrganizationMember(orgRef: string, memberId: string): { removed: true; id: string } {
  initOrganizations();
  const db = getDb();
  const org = requireOrganization(orgRef);
  const member = requireMember(org.id, memberId);
  db.prepare("DELETE FROM organization_members WHERE id = ?").run(member.id);
  db.prepare(
    `UPDATE membership_receipts
        SET revoked_at = COALESCE(revoked_at, ?), updated_at = ?
      WHERE organization_member_id = ?`,
  ).run(nowIso(), nowIso(), member.id);
  organizationsEvents.emit("org:member_removed", { id: member.id, organization_id: org.id });
  return { removed: true, id: member.id };
}

export function updateOrganizationMemberRole(orgRef: string, memberId: string, role: OrgRole): OrganizationMember {
  initOrganizations();
  const db = getDb();
  const org = requireOrganization(orgRef);
  requireMember(org.id, memberId);
  db.prepare(
    `UPDATE organization_members SET role = ?, updated_at = ? WHERE id = ?`,
  ).run(role, nowIso(), memberId);
  const updated = requireMember(org.id, memberId);
  organizationsEvents.emit("org:member_updated", updated);
  return updated;
}
