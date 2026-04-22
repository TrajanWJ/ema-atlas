import Database from "better-sqlite3";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

const memoryDb = new Database(":memory:");
memoryDb.pragma("journal_mode = MEMORY");
memoryDb.pragma("foreign_keys = ON");

vi.mock("../../persistence/db.js", () => ({
  getDb: () => memoryDb,
  closeDb: () => memoryDb.close(),
}));

const {
  acceptInvitation,
  createInvitation,
  createOrganization,
  initOrganizations,
  listMembershipReceipts,
  listOrganizationMembers,
  previewInvitation,
  removeOrganizationMember,
  revokeInvitation,
  updateOrganizationMemberRole,
} = await import("./service.js");
const { createSpace, initSpaces, seedDefaultSpace, getSpace } = await import("../spaces/service.js");

function resetDb(): void {
  memoryDb.exec(`
    DELETE FROM membership_receipts;
    DELETE FROM organization_invitations;
    DELETE FROM organization_members;
    DELETE FROM organizations;
    DELETE FROM space_transitions;
    DELETE FROM spaces;
  `);
}

beforeAll(() => {
  initSpaces();
  initOrganizations();
});

beforeEach(() => {
  resetDb();
  seedDefaultSpace();
});

describe("organizations backend foothold", () => {
  it("creates an org with an owner membership", () => {
    const org = createOrganization({
      name: "Acme Collective",
      owner_id: "actor:trajan",
      owner_display_name: "Trajan",
    });

    expect(org.slug).toBe("acme-collective");
    const members = listOrganizationMembers(org.id);
    expect(members).toHaveLength(1);
    expect(members[0]?.role).toBe("owner");
    expect(members[0]?.actor_id).toBe("actor:trajan");
  });

  it("accepts an invite, creates a membership receipt, and adds starter space membership", () => {
    const org = createOrganization({
      name: "EMA Lab",
      owner_id: "actor:owner",
      owner_display_name: "Owner",
    });
    const starter = createSpace({ slug: "lab", name: "Lab", actor: "actor:owner" });

    const { invitation } = createInvitation(org.id, {
      created_by: "actor:owner",
      role: "member",
      starter_space_ids: [starter.id],
      max_uses: 2,
    });

    const preview = previewInvitation(invitation.token);
    expect(preview.org.name).toBe("EMA Lab");
    expect(preview.invitation.starter_space_ids).toEqual([starter.id]);

    const joined = acceptInvitation(invitation.token, {
      display_name: "Alice",
      email: "alice@example.com",
      actor_id: "actor:alice",
    });

    expect(joined.member.role).toBe("member");
    expect(listMembershipReceipts(org.id)).toHaveLength(1);

    const hydratedSpace = getSpace(starter.id);
    expect(hydratedSpace?.members.some((member) => member.actor_id === "actor:alice")).toBe(true);
  });

  it("supports role updates, member removal, and invitation revocation", () => {
    const org = createOrganization({ name: "Ops", owner_id: "actor:o", owner_display_name: "Owner" });
    const { invitation } = createInvitation(org.id, {
      created_by: "actor:o",
      role: "guest",
    });

    const joined = acceptInvitation(invitation.token, {
      display_name: "Bob",
      actor_id: "actor:bob",
    });

    const updated = updateOrganizationMemberRole(org.id, joined.member.id, "admin");
    expect(updated.role).toBe("admin");

    const removed = removeOrganizationMember(org.id, joined.member.id);
    expect(removed.removed).toBe(true);

    const revoked = revokeInvitation(org.id, invitation.id);
    expect(revoked.revoked).toBe(true);
  });
});
