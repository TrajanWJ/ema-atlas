export const ORGANIZATIONS_DDL = `
  CREATE TABLE IF NOT EXISTS organizations (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    description TEXT,
    avatar_url TEXT,
    owner_id TEXT NOT NULL,
    settings TEXT NOT NULL DEFAULT '{}',
    inserted_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE UNIQUE INDEX IF NOT EXISTS organizations_slug_idx ON organizations(slug);

  CREATE TABLE IF NOT EXISTS organization_members (
    id TEXT PRIMARY KEY,
    organization_id TEXT NOT NULL,
    actor_id TEXT,
    display_name TEXT NOT NULL,
    email TEXT,
    role TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active',
    identity_pubkey TEXT,
    joined_at TEXT,
    invited_by TEXT,
    inserted_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE INDEX IF NOT EXISTS organization_members_org_idx
    ON organization_members(organization_id, status, role);
  CREATE UNIQUE INDEX IF NOT EXISTS organization_members_actor_unique_idx
    ON organization_members(organization_id, actor_id)
    WHERE actor_id IS NOT NULL;

  CREATE TABLE IF NOT EXISTS organization_invitations (
    id TEXT PRIMARY KEY,
    organization_id TEXT NOT NULL,
    token TEXT NOT NULL,
    role TEXT NOT NULL,
    created_by TEXT NOT NULL,
    expires_at TEXT,
    max_uses INTEGER,
    use_count INTEGER NOT NULL DEFAULT 0,
    used_by TEXT NOT NULL DEFAULT '[]',
    starter_space_ids TEXT NOT NULL DEFAULT '[]',
    revoked INTEGER NOT NULL DEFAULT 0,
    link TEXT,
    inserted_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE UNIQUE INDEX IF NOT EXISTS organization_invitations_token_idx
    ON organization_invitations(token);
  CREATE INDEX IF NOT EXISTS organization_invitations_org_idx
    ON organization_invitations(organization_id, revoked);

  CREATE TABLE IF NOT EXISTS membership_receipts (
    id TEXT PRIMARY KEY,
    organization_id TEXT NOT NULL,
    organization_member_id TEXT NOT NULL,
    source_kind TEXT NOT NULL,
    source_ref TEXT,
    granted_role TEXT NOT NULL,
    starter_space_ids TEXT NOT NULL DEFAULT '[]',
    accepted_at TEXT,
    revoked_at TEXT,
    inserted_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE INDEX IF NOT EXISTS membership_receipts_org_idx
    ON membership_receipts(organization_id, organization_member_id);
`;

export function applyOrganizationsDdl(db: { exec: (sql: string) => unknown }): void {
  db.exec(ORGANIZATIONS_DDL);
  try {
    db.exec("ALTER TABLE spaces ADD COLUMN organization_id TEXT");
  } catch {
    // additive migration; ignore when already present or spaces not bootstrapped yet
  }
  try {
    db.exec(
      "CREATE INDEX IF NOT EXISTS spaces_organization_id_idx ON spaces(organization_id)",
    );
  } catch {
    // spaces table may not be bootstrapped yet
  }
}
