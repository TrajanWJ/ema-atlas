import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";

import { orgRoleSchema } from "@ema/shared/schemas";
import {
  acceptInvitation,
  createInvitation,
  createOrganization,
  deleteOrganization,
  getOrganization,
  InvitationInvalidError,
  InvitationNotFoundError,
  listMembershipReceipts,
  listOrganizationInvitations,
  listOrganizationMembers,
  listOrganizations,
  OrganizationMemberNotFoundError,
  OrganizationNotFoundError,
  OrganizationSlugTakenError,
  previewInvitation,
  removeOrganizationMember,
  revokeInvitation,
  updateOrganization,
  updateOrganizationMemberRole,
} from "./service.js";

const orgRefParamsSchema = z.object({ orgRef: z.string().min(1) });
const invitationParamsSchema = z.object({ orgRef: z.string().min(1), invitationId: z.string().min(1) });
const memberParamsSchema = z.object({ orgRef: z.string().min(1), memberId: z.string().min(1) });
const tokenParamsSchema = z.object({ token: z.string().min(1) });

const createOrgSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  avatar_url: z.string().url().nullable().optional(),
  owner_id: z.string().min(1).optional(),
  owner_display_name: z.string().min(1).optional(),
  owner_email: z.string().email().nullable().optional(),
  settings: z.record(z.unknown()).optional(),
  actor: z.string().min(1).optional(),
});

const updateOrgSchema = createOrgSchema.partial().refine((value) => Object.keys(value).length > 0, {
  message: "update requires at least one field",
});

const createInvitationSchema = z.object({
  created_by: z.string().min(1),
  role: orgRoleSchema.optional(),
  expires_at: z.string().datetime().nullable().optional(),
  max_uses: z.number().int().positive().nullable().optional(),
  starter_space_ids: z.array(z.string().min(1)).optional(),
});

const joinSchema = z.object({
  display_name: z.string().min(1),
  email: z.string().email().nullable().optional(),
  actor_id: z.string().min(1).nullable().optional(),
});

const roleUpdateSchema = z.object({ role: orgRoleSchema });

function handleError(reply: FastifyReply, err: unknown): FastifyReply {
  if (err instanceof OrganizationNotFoundError) {
    return reply.code(404).send({ error: err.code, ref: err.ref });
  }
  if (err instanceof OrganizationSlugTakenError) {
    return reply.code(409).send({ error: err.code, slug: err.slug });
  }
  if (err instanceof InvitationNotFoundError) {
    return reply.code(404).send({ error: err.code, ref: err.ref });
  }
  if (err instanceof InvitationInvalidError) {
    return reply.code(409).send({ error: err.code, detail: err.message });
  }
  if (err instanceof OrganizationMemberNotFoundError) {
    return reply.code(404).send({ error: err.code, member_id: err.memberId });
  }
  if (err instanceof z.ZodError) {
    return reply.code(422).send({ error: "invalid_input", issues: err.issues });
  }
  const detail = err instanceof Error ? err.message : "internal_error";
  return reply.code(500).send({ error: "internal_error", detail });
}

export function registerOrganizationsRoutes(app: FastifyInstance): void {
  app.get("/orgs", async (_request, reply) => {
    try {
      return { orgs: listOrganizations() };
    } catch (err) {
      return handleError(reply, err);
    }
  });

  app.post("/orgs", async (request: FastifyRequest<{ Body: unknown }>, reply) => {
    try {
      const body = createOrgSchema.parse(request.body);
      return reply.code(201).send(createOrganization(body));
    } catch (err) {
      return handleError(reply, err);
    }
  });

  app.get("/orgs/:orgRef", async (request: FastifyRequest<{ Params: { orgRef: string } }>, reply) => {
    try {
      const { orgRef } = orgRefParamsSchema.parse(request.params);
      const org = getOrganization(orgRef);
      if (!org) return reply.code(404).send({ error: "organization_not_found", ref: orgRef });
      return {
        org,
        members: listOrganizationMembers(org.id),
        invitations: listOrganizationInvitations(org.id),
        receipts: listMembershipReceipts(org.id),
      };
    } catch (err) {
      return handleError(reply, err);
    }
  });

  app.put("/orgs/:orgRef", async (request: FastifyRequest<{ Params: { orgRef: string }; Body: unknown }>, reply) => {
    try {
      const { orgRef } = orgRefParamsSchema.parse(request.params);
      const body = updateOrgSchema.parse(request.body);
      return { org: updateOrganization(orgRef, body) };
    } catch (err) {
      return handleError(reply, err);
    }
  });

  app.delete("/orgs/:orgRef", async (request: FastifyRequest<{ Params: { orgRef: string } }>, reply) => {
    try {
      const { orgRef } = orgRefParamsSchema.parse(request.params);
      return deleteOrganization(orgRef);
    } catch (err) {
      return handleError(reply, err);
    }
  });

  app.post("/orgs/:orgRef/invitations", async (request: FastifyRequest<{ Params: { orgRef: string }; Body: unknown }>, reply) => {
    try {
      const { orgRef } = orgRefParamsSchema.parse(request.params);
      const body = createInvitationSchema.parse(request.body);
      return reply.code(201).send(createInvitation(orgRef, body));
    } catch (err) {
      return handleError(reply, err);
    }
  });

  app.delete("/orgs/:orgRef/invitations/:invitationId", async (request: FastifyRequest<{ Params: { orgRef: string; invitationId: string } }>, reply) => {
    try {
      const { orgRef, invitationId } = invitationParamsSchema.parse(request.params);
      return { invitation: revokeInvitation(orgRef, invitationId) };
    } catch (err) {
      return handleError(reply, err);
    }
  });

  app.delete("/orgs/:orgRef/members/:memberId", async (request: FastifyRequest<{ Params: { orgRef: string; memberId: string } }>, reply) => {
    try {
      const { orgRef, memberId } = memberParamsSchema.parse(request.params);
      return removeOrganizationMember(orgRef, memberId);
    } catch (err) {
      return handleError(reply, err);
    }
  });

  app.put("/orgs/:orgRef/members/:memberId/role", async (request: FastifyRequest<{ Params: { orgRef: string; memberId: string }; Body: unknown }>, reply) => {
    try {
      const { orgRef, memberId } = memberParamsSchema.parse(request.params);
      const body = roleUpdateSchema.parse(request.body);
      return { member: updateOrganizationMemberRole(orgRef, memberId, body.role) };
    } catch (err) {
      return handleError(reply, err);
    }
  });

  app.get("/join/:token/preview", async (request: FastifyRequest<{ Params: { token: string } }>, reply) => {
    try {
      const { token } = tokenParamsSchema.parse(request.params);
      const { org, invitation } = previewInvitation(token);
      return {
        org_name: org.name,
        org_description: org.description,
        role: invitation.role,
        expires_at: invitation.expires_at,
        starter_space_ids: invitation.starter_space_ids,
      };
    } catch (err) {
      return handleError(reply, err);
    }
  });

  app.post("/join/:token", async (request: FastifyRequest<{ Params: { token: string }; Body: unknown }>, reply) => {
    try {
      const { token } = tokenParamsSchema.parse(request.params);
      const body = joinSchema.parse(request.body);
      return reply.code(201).send(acceptInvitation(token, body));
    } catch (err) {
      return handleError(reply, err);
    }
  });
}
