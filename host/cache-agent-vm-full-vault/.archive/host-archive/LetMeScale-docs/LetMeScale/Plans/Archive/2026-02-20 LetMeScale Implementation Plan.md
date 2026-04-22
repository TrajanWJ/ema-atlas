> See also: [[LetMeScale]]

# LetMeScale Platform Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build the full LetMeScale platform — marketing site, application funnel, admin dashboard, and client collaboration portal — as a Turborepo monorepo with Next.js, Tailwind CSS v4, Drizzle ORM + SQLite, and NextAuth.js.

**Architecture:** Turborepo monorepo with two Next.js 15 apps (`marketing` and `dashboard`) sharing four packages (`ui`, `db`, `auth`, `config`). Marketing site is a public-facing scroll experience with proof assets. Dashboard handles both admin and client portal via role-based routing. SQLite database with Drizzle ORM, seeded with mock data matching real client testimonials.

**Tech Stack:** Turborepo, Next.js 15 (App Router), Tailwind CSS v4, Framer Motion, Drizzle ORM + better-sqlite3, NextAuth.js v5, Socket.io, TypeScript, Zod

**Design Doc:** `docs/plans/2026-02-20-letmescale-platform-design.md`

---

## Phase 1: Monorepo Foundation

### Task 1: Initialize Turborepo Monorepo

**Files:**
- Create: `package.json` (root)
- Create: `turbo.json`
- Create: `tsconfig.json` (root)
- Create: `.gitignore`
- Create: `pnpm-workspace.yaml`

**Step 1: Initialize git repo and root package.json**

```bash
cd /home/trajan/Desktop/Coding/Projects/letmescale
git init
```

```json
// package.json
{
  "name": "letmescale",
  "private": true,
  "scripts": {
    "dev": "turbo dev",
    "build": "turbo build",
    "lint": "turbo lint",
    "db:seed": "turbo db:seed",
    "db:push": "turbo db:push"
  },
  "devDependencies": {
    "turbo": "^2"
  },
  "packageManager": "pnpm@9.15.0"
}
```

**Step 2: Create turbo.json**

```json
// turbo.json
{
  "$schema": "https://turborepo.dev/schema.json",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "!.next/cache/**", "dist/**"]
    },
    "dev": {
      "persistent": true,
      "cache": false
    },
    "lint": {
      "dependsOn": ["^build"]
    },
    "db:seed": {
      "cache": false
    },
    "db:push": {
      "cache": false
    }
  }
}
```

**Step 3: Create pnpm-workspace.yaml**

```yaml
# pnpm-workspace.yaml
packages:
  - "apps/*"
  - "packages/*"
```

**Step 4: Create root tsconfig.json**

```json
// tsconfig.json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "allowJs": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "isolatedModules": true,
    "jsx": "react-jsx",
    "incremental": true
  },
  "exclude": ["node_modules"]
}
```

**Step 5: Create .gitignore**

```
node_modules/
.next/
dist/
.turbo/
*.db
*.sqlite
.env
.env.local
.DS_Store
```

**Step 6: Install turbo and verify**

```bash
pnpm install
pnpm turbo --version
```

Expected: Turbo version prints successfully.

**Step 7: Commit**

```bash
git add package.json turbo.json tsconfig.json pnpm-workspace.yaml .gitignore pnpm-lock.yaml
git commit -m "feat: initialize Turborepo monorepo"
```

---

### Task 2: Create Shared Config Package

**Files:**
- Create: `packages/config/package.json`
- Create: `packages/config/tsconfig.json`
- Create: `packages/config/src/index.ts`
- Create: `packages/config/src/roles.ts`
- Create: `packages/config/src/statuses.ts`
- Create: `packages/config/src/types.ts`
- Create: `packages/config/src/permissions.ts`

**Step 1: Create package.json for config**

```json
// packages/config/package.json
{
  "name": "@letmescale/config",
  "version": "0.0.1",
  "private": true,
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "dependencies": {
    "zod": "^3.23"
  }
}
```

**Step 2: Create tsconfig.json**

```json
// packages/config/tsconfig.json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "outDir": "dist"
  },
  "include": ["src"]
}
```

**Step 3: Create roles.ts**

```typescript
// packages/config/src/roles.ts
export const ROLES = {
  ADMIN: "admin",
  CLIENT: "client",
  EDITOR: "editor",
  DM_SETTER: "dm_setter",
  VA: "va",
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

export const ROLE_LABELS: Record<Role, string> = {
  admin: "Admin",
  client: "Client",
  editor: "Editor",
  dm_setter: "DM Setter",
  va: "VA",
};
```

**Step 4: Create statuses.ts**

```typescript
// packages/config/src/statuses.ts
export const APPLICATION_STATUS = {
  NEW: "new",
  REVIEWED: "reviewed",
  ACCEPTED: "accepted",
  REJECTED: "rejected",
  FLAGGED: "flagged",
} as const;

export type ApplicationStatus =
  (typeof APPLICATION_STATUS)[keyof typeof APPLICATION_STATUS];

export const CLIENT_STATUS = {
  ACTIVE: "active",
  PAUSED: "paused",
  CHURNED: "churned",
} as const;

export type ClientStatus =
  (typeof CLIENT_STATUS)[keyof typeof CLIENT_STATUS];

export const CONTENT_STATUS = {
  DRAFT: "draft",
  IN_REVIEW: "in_review",
  APPROVED: "approved",
  PUBLISHED: "published",
  REJECTED: "rejected",
} as const;

export type ContentStatus =
  (typeof CONTENT_STATUS)[keyof typeof CONTENT_STATUS];

export const CONTENT_TYPE = {
  TRIAL_REEL: "trial_reel",
  NORMAL_REEL: "normal_reel",
  STORY: "story",
} as const;

export type ContentType =
  (typeof CONTENT_TYPE)[keyof typeof CONTENT_TYPE];

export const REVENUE_RANGE = {
  "10K_50K": "$10K-$50K",
  "50K_250K": "$50K-$250K",
  "250K_1M": "$250K-$1M",
  "1M_PLUS": "$1M+",
} as const;

export type RevenueRange =
  (typeof REVENUE_RANGE)[keyof typeof REVENUE_RANGE];

export const BUSINESS_TYPE = {
  FOUNDER: "founder",
  OPERATOR: "operator",
  HIGH_TICKET: "high_ticket_seller",
  INVESTOR: "investor",
  PERSONAL_BRAND: "personal_brand",
} as const;

export type BusinessType =
  (typeof BUSINESS_TYPE)[keyof typeof BUSINESS_TYPE];
```

**Step 5: Create types.ts with Zod schemas**

```typescript
// packages/config/src/types.ts
import { z } from "zod";

export const applicationSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Valid email required"),
  businessName: z.string().min(1, "Business name is required"),
  website: z.string().url().optional().or(z.literal("")),
  revenueRange: z.enum(["$10K-$50K", "$50K-$250K", "$250K-$1M", "$1M+"]),
  businessType: z.enum([
    "founder",
    "operator",
    "high_ticket_seller",
    "investor",
    "personal_brand",
  ]),
  goal: z.string().min(10, "Tell us more about your goal"),
  referralSource: z.string().optional(),
  generatesRevenue: z.boolean(),
});

export type ApplicationInput = z.infer<typeof applicationSchema>;

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const inviteCodeSchema = z.object({
  code: z.string().min(8),
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(1),
});

export type InviteCodeInput = z.infer<typeof inviteCodeSchema>;
```

**Step 6: Create permissions.ts**

```typescript
// packages/config/src/permissions.ts
import type { Role } from "./roles";

export const ROUTE_PERMISSIONS: Record<string, Role[]> = {
  "/admin": ["admin"],
  "/admin/leads": ["admin"],
  "/admin/clients": ["admin"],
  "/admin/team": ["admin"],
  "/admin/settings": ["admin"],
  "/portal": ["client", "admin"],
  "/portal/deliverables": ["client", "editor", "admin"],
  "/portal/metrics": ["client", "admin"],
  "/portal/accounts": ["client", "editor", "admin"],
  "/portal/scheduling": ["client", "editor", "admin"],
  "/portal/dm-center": ["client", "dm_setter", "admin"],
  "/portal/messages": ["client", "editor", "dm_setter", "va", "admin"],
};

export function canAccessRoute(role: Role, route: string): boolean {
  const permissions = ROUTE_PERMISSIONS[route];
  if (!permissions) return true;
  return permissions.includes(role);
}
```

**Step 7: Create index.ts barrel export**

```typescript
// packages/config/src/index.ts
export * from "./roles";
export * from "./statuses";
export * from "./types";
export * from "./permissions";
```

**Step 8: Install dependencies and commit**

```bash
cd /home/trajan/Desktop/Coding/Projects/letmescale
pnpm install
git add packages/config/
git commit -m "feat: add shared config package with roles, statuses, types, permissions"
```

---

### Task 3: Create Database Package (Drizzle + SQLite)

**Files:**
- Create: `packages/db/package.json`
- Create: `packages/db/tsconfig.json`
- Create: `packages/db/src/index.ts`
- Create: `packages/db/src/schema.ts`
- Create: `packages/db/src/seed.ts`
- Create: `packages/db/drizzle.config.ts`

**Step 1: Create package.json**

```json
// packages/db/package.json
{
  "name": "@letmescale/db",
  "version": "0.0.1",
  "private": true,
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "scripts": {
    "db:push": "drizzle-kit push",
    "db:seed": "tsx src/seed.ts",
    "db:studio": "drizzle-kit studio"
  },
  "dependencies": {
    "drizzle-orm": "^0.38",
    "better-sqlite3": "^11",
    "@letmescale/config": "workspace:*"
  },
  "devDependencies": {
    "drizzle-kit": "^0.30",
    "@types/better-sqlite3": "^7",
    "tsx": "^4"
  }
}
```

**Step 2: Create tsconfig.json**

```json
// packages/db/tsconfig.json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "outDir": "dist"
  },
  "include": ["src"]
}
```

**Step 3: Create drizzle.config.ts**

```typescript
// packages/db/drizzle.config.ts
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/schema.ts",
  out: "./migrations",
  dialect: "sqlite",
  dbCredentials: {
    url: "./letmescale.db",
  },
});
```

**Step 4: Create schema.ts — full database schema**

```typescript
// packages/db/src/schema.ts
import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { relations } from "drizzle-orm";

// ==================== USERS ====================
export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  name: text("name").notNull(),
  role: text("role", {
    enum: ["admin", "client", "editor", "dm_setter", "va"],
  }).notNull(),
  avatarUrl: text("avatar_url"),
  createdAt: text("created_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
  lastLogin: text("last_login"),
});

// ==================== INVITE CODES ====================
export const inviteCodes = sqliteTable("invite_codes", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  code: text("code").notNull().unique(),
  role: text("role", {
    enum: ["admin", "client", "editor", "dm_setter", "va"],
  }).notNull(),
  createdBy: integer("created_by").references(() => users.id),
  usedBy: integer("used_by").references(() => users.id),
  expiresAt: text("expires_at"),
  createdAt: text("created_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});

// ==================== APPLICATIONS ====================
export const applications = sqliteTable("applications", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  email: text("email").notNull(),
  businessName: text("business_name").notNull(),
  website: text("website"),
  revenueRange: text("revenue_range").notNull(),
  businessType: text("business_type").notNull(),
  goal: text("goal").notNull(),
  referralSource: text("referral_source"),
  status: text("status", {
    enum: ["new", "reviewed", "accepted", "rejected", "flagged"],
  })
    .notNull()
    .default("new"),
  calendlyEventId: text("calendly_event_id"),
  createdAt: text("created_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});

// ==================== CLIENTS ====================
export const clients = sqliteTable("clients", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id),
  businessName: text("business_name").notNull(),
  plan: text("plan"),
  status: text("status", {
    enum: ["active", "paused", "churned"],
  })
    .notNull()
    .default("active"),
  onboardedAt: text("onboarded_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
  notes: text("notes"),
});

// ==================== TEAM ASSIGNMENTS ====================
export const teamAssignments = sqliteTable("team_assignments", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  teamMemberId: integer("team_member_id")
    .notNull()
    .references(() => users.id),
  clientId: integer("client_id")
    .notNull()
    .references(() => clients.id),
  role: text("role", {
    enum: ["editor", "dm_setter", "va"],
  }).notNull(),
  assignedAt: text("assigned_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});

// ==================== INSTAGRAM ACCOUNTS ====================
export const instagramAccounts = sqliteTable("instagram_accounts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  clientId: integer("client_id")
    .notNull()
    .references(() => clients.id),
  username: text("username").notNull(),
  profileUrl: text("profile_url"),
  followerCount: integer("follower_count").default(0),
  status: text("status", {
    enum: ["active", "paused", "disconnected"],
  })
    .notNull()
    .default("active"),
});

// ==================== CONTENT PIECES ====================
export const contentPieces = sqliteTable("content_pieces", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  clientId: integer("client_id")
    .notNull()
    .references(() => clients.id),
  accountId: integer("account_id").references(() => instagramAccounts.id),
  title: text("title").notNull(),
  type: text("type", {
    enum: ["trial_reel", "normal_reel", "story"],
  }).notNull(),
  caption: text("caption"),
  mediaUrl: text("media_url"),
  status: text("status", {
    enum: ["draft", "in_review", "approved", "published", "rejected"],
  })
    .notNull()
    .default("draft"),
  scheduledAt: text("scheduled_at"),
  publishedAt: text("published_at"),
  createdBy: integer("created_by").references(() => users.id),
  createdAt: text("created_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});

// ==================== MESSAGES ====================
export const messageThreads = sqliteTable("message_threads", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  clientId: integer("client_id")
    .notNull()
    .references(() => clients.id),
  subject: text("subject").notNull(),
  createdAt: text("created_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});

export const messages = sqliteTable("messages", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  threadId: integer("thread_id")
    .notNull()
    .references(() => messageThreads.id),
  senderId: integer("sender_id")
    .notNull()
    .references(() => users.id),
  content: text("content").notNull(),
  attachments: text("attachments"), // JSON string of attachment URLs
  createdAt: text("created_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});

// ==================== DM CONVERSATIONS ====================
export const dmConversations = sqliteTable("dm_conversations", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  accountId: integer("account_id")
    .notNull()
    .references(() => instagramAccounts.id),
  contactName: text("contact_name").notNull(),
  contactUsername: text("contact_username"),
  platform: text("platform").notNull().default("instagram"),
  isAutomated: integer("is_automated", { mode: "boolean" }).default(false),
  lastMessageAt: text("last_message_at"),
});

export const dmMessages = sqliteTable("dm_messages", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  conversationId: integer("conversation_id")
    .notNull()
    .references(() => dmConversations.id),
  direction: text("direction", { enum: ["inbound", "outbound"] }).notNull(),
  content: text("content").notNull(),
  isAutomated: integer("is_automated", { mode: "boolean" }).default(false),
  createdAt: text("created_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});

// ==================== METRICS ====================
export const metricsSnapshots = sqliteTable("metrics_snapshots", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  accountId: integer("account_id")
    .notNull()
    .references(() => instagramAccounts.id),
  date: text("date").notNull(),
  views: integer("views").default(0),
  reach: integer("reach").default(0),
  engagementRate: real("engagement_rate").default(0),
  followerCount: integer("follower_count").default(0),
  topContentId: integer("top_content_id"),
});

// ==================== RELATIONS ====================
export const usersRelations = relations(users, ({ many, one }) => ({
  clients: many(clients),
  sentMessages: many(messages),
  teamAssignments: many(teamAssignments),
}));

export const clientsRelations = relations(clients, ({ one, many }) => ({
  user: one(users, { fields: [clients.userId], references: [users.id] }),
  instagramAccounts: many(instagramAccounts),
  contentPieces: many(contentPieces),
  teamAssignments: many(teamAssignments),
  messageThreads: many(messageThreads),
}));

export const instagramAccountsRelations = relations(
  instagramAccounts,
  ({ one, many }) => ({
    client: one(clients, {
      fields: [instagramAccounts.clientId],
      references: [clients.id],
    }),
    contentPieces: many(contentPieces),
    metricsSnapshots: many(metricsSnapshots),
    dmConversations: many(dmConversations),
  })
);
```

**Step 5: Create index.ts — database connection and exports**

```typescript
// packages/db/src/index.ts
import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import * as schema from "./schema";
import path from "path";

const DB_PATH = process.env.DATABASE_URL || path.join(__dirname, "../letmescale.db");

const sqlite = new Database(DB_PATH);
sqlite.pragma("journal_mode = WAL");

export const db = drizzle(sqlite, { schema });
export * from "./schema";
export type DB = typeof db;
```

**Step 6: Create seed.ts — realistic mock data matching real proof assets**

This file seeds the database with mock data that matches the real testimonial metrics (Trell $83K, Daniel 14.2M views, Mark Shapiro $90K, Chetha 6.5M views). Write a complete seed file with:
- 7 user accounts (admin, 4 clients, editor, DM setter, VA)
- 4 client profiles matching testimonial names
- Instagram accounts per client with realistic follower counts
- Mock content pieces, schedules, metrics snapshots
- Mock message threads and DM conversations
- 3 unused invite codes for testing
- 5 sample applications in various statuses

Password for all seeded accounts: `"password123"` hashed with a simple hash function (bcrypt in production, but for local dev use a basic hash).

```typescript
// packages/db/src/seed.ts
import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import * as schema from "./schema";
import path from "path";
import crypto from "crypto";

const DB_PATH = path.join(__dirname, "../letmescale.db");
const sqlite = new Database(DB_PATH);
const db = drizzle(sqlite, { schema });

// Simple hash for dev (use bcrypt in production)
function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex");
}

function randomDate(daysAgo: number): string {
  const d = new Date();
  d.setDate(d.getDate() - Math.floor(Math.random() * daysAgo));
  return d.toISOString();
}

async function seed() {
  console.log("🌱 Seeding database...");

  // Clear existing data
  sqlite.exec("DELETE FROM dm_messages");
  sqlite.exec("DELETE FROM dm_conversations");
  sqlite.exec("DELETE FROM messages");
  sqlite.exec("DELETE FROM message_threads");
  sqlite.exec("DELETE FROM metrics_snapshots");
  sqlite.exec("DELETE FROM content_pieces");
  sqlite.exec("DELETE FROM team_assignments");
  sqlite.exec("DELETE FROM instagram_accounts");
  sqlite.exec("DELETE FROM clients");
  sqlite.exec("DELETE FROM invite_codes");
  sqlite.exec("DELETE FROM applications");
  sqlite.exec("DELETE FROM users");

  const pwHash = hashPassword("password123");

  // ==================== USERS ====================
  const [admin] = db
    .insert(schema.users)
    .values({
      email: "admin@letmescale.com",
      passwordHash: pwHash,
      name: "LetMeScale Admin",
      role: "admin",
    })
    .returning();

  const [trellUser] = db
    .insert(schema.users)
    .values({
      email: "trell@test.com",
      passwordHash: pwHash,
      name: "Trell The Trainer",
      role: "client",
    })
    .returning();

  const [danielUser] = db
    .insert(schema.users)
    .values({
      email: "daniel@test.com",
      passwordHash: pwHash,
      name: "Daniel",
      role: "client",
    })
    .returning();

  const [markUser] = db
    .insert(schema.users)
    .values({
      email: "mark@test.com",
      passwordHash: pwHash,
      name: "Mark Shapiro",
      role: "client",
    })
    .returning();

  const [chethaUser] = db
    .insert(schema.users)
    .values({
      email: "chetha@test.com",
      passwordHash: pwHash,
      name: "Chetha",
      role: "client",
    })
    .returning();

  const [editorUser] = db
    .insert(schema.users)
    .values({
      email: "editor@test.com",
      passwordHash: pwHash,
      name: "Alex Editor",
      role: "editor",
    })
    .returning();

  const [dmSetterUser] = db
    .insert(schema.users)
    .values({
      email: "dmsetter@test.com",
      passwordHash: pwHash,
      name: "Jordan DM",
      role: "dm_setter",
    })
    .returning();

  const [vaUser] = db
    .insert(schema.users)
    .values({
      email: "va@test.com",
      passwordHash: pwHash,
      name: "Sam VA",
      role: "va",
    })
    .returning();

  // ==================== CLIENTS ====================
  const [trellClient] = db
    .insert(schema.clients)
    .values({
      userId: trellUser.id,
      businessName: "Trell The Trainer",
      plan: "Scale",
      status: "active",
      notes: "High-ticket fitness coaching. $83K revenue in 6 days with our system.",
    })
    .returning();

  const [danielClient] = db
    .insert(schema.clients)
    .values({
      userId: danielUser.id,
      businessName: "Daniel Media",
      plan: "Scale",
      status: "active",
      notes: "Content creator scaling. 14.2M views in 90 days.",
    })
    .returning();

  const [markClient] = db
    .insert(schema.clients)
    .values({
      userId: markUser.id,
      businessName: "Mark Shapiro Capital",
      plan: "Growth",
      status: "active",
      notes: "Investment/capital firm. $90K cash collected, 69% show rate.",
    })
    .returning();

  const [chethaClient] = db
    .insert(schema.clients)
    .values({
      userId: chethaUser.id,
      businessName: "Chetha Media",
      plan: "Scale",
      status: "active",
      notes: "Content distribution. 6.5M total views generated.",
    })
    .returning();

  // ==================== INSTAGRAM ACCOUNTS ====================
  const [trellIG] = db
    .insert(schema.instagramAccounts)
    .values({
      clientId: trellClient.id,
      username: "@trellthetrainer",
      profileUrl: "https://instagram.com/trellthetrainer",
      followerCount: 85000,
    })
    .returning();

  const [danielIG] = db
    .insert(schema.instagramAccounts)
    .values({
      clientId: danielClient.id,
      username: "@daniel.media",
      profileUrl: "https://instagram.com/daniel.media",
      followerCount: 250000,
    })
    .returning();

  const [markIG] = db
    .insert(schema.instagramAccounts)
    .values({
      clientId: markClient.id,
      username: "@markshapiro",
      profileUrl: "https://instagram.com/markshapiro",
      followerCount: 45000,
    })
    .returning();

  const [chethaIG] = db
    .insert(schema.instagramAccounts)
    .values({
      clientId: chethaClient.id,
      username: "@chetha",
      profileUrl: "https://instagram.com/chetha",
      followerCount: 120000,
    })
    .returning();

  // ==================== TEAM ASSIGNMENTS ====================
  db.insert(schema.teamAssignments).values([
    { teamMemberId: editorUser.id, clientId: trellClient.id, role: "editor" },
    { teamMemberId: editorUser.id, clientId: danielClient.id, role: "editor" },
    { teamMemberId: dmSetterUser.id, clientId: trellClient.id, role: "dm_setter" },
    { teamMemberId: dmSetterUser.id, clientId: markClient.id, role: "dm_setter" },
    { teamMemberId: vaUser.id, clientId: chethaClient.id, role: "va" },
  ]).run();

  // ==================== METRICS SNAPSHOTS ====================
  // Generate 30 days of metrics per account matching real proof numbers
  const accountMetrics = [
    { account: trellIG, baseViews: 150000, baseReach: 120000, baseFollowers: 85000 },
    { account: danielIG, baseViews: 470000, baseReach: 330000, baseFollowers: 250000 },
    { account: markIG, baseViews: 50000, baseReach: 35000, baseFollowers: 45000 },
    { account: chethaIG, baseViews: 216000, baseReach: 180000, baseFollowers: 120000 },
  ];

  for (const { account, baseViews, baseReach, baseFollowers } of accountMetrics) {
    for (let i = 0; i < 30; i++) {
      const date = new Date();
      date.setDate(date.getDate() - (29 - i));
      const variance = 0.7 + Math.random() * 0.6; // 0.7x to 1.3x
      db.insert(schema.metricsSnapshots).values({
        accountId: account.id,
        date: date.toISOString().split("T")[0],
        views: Math.round(baseViews * variance),
        reach: Math.round(baseReach * variance),
        engagementRate: +(3 + Math.random() * 4).toFixed(2),
        followerCount: baseFollowers + i * Math.round(baseFollowers * 0.003),
      }).run();
    }
  }

  // ==================== CONTENT PIECES ====================
  const contentData = [
    { clientId: trellClient.id, accountId: trellIG.id, title: "Morning Routine Reel", type: "normal_reel" as const, status: "published" as const, caption: "The 5AM routine that changed everything..." },
    { clientId: trellClient.id, accountId: trellIG.id, title: "Client Transformation", type: "trial_reel" as const, status: "in_review" as const, caption: "Watch this transformation..." },
    { clientId: danielClient.id, accountId: danielIG.id, title: "Viral Hook Breakdown", type: "normal_reel" as const, status: "published" as const, caption: "This hook got 2.3M views..." },
    { clientId: danielClient.id, accountId: danielIG.id, title: "Behind the Scenes", type: "story" as const, status: "approved" as const, caption: "Day in the life..." },
    { clientId: markClient.id, accountId: markIG.id, title: "Investment Thesis", type: "normal_reel" as const, status: "published" as const, caption: "Why this market is about to shift..." },
    { clientId: chethaClient.id, accountId: chethaIG.id, title: "Clipping Strategy", type: "normal_reel" as const, status: "draft" as const, caption: "How we generate millions of views..." },
  ];

  for (const content of contentData) {
    db.insert(schema.contentPieces).values({
      ...content,
      scheduledAt: randomDate(7),
      publishedAt: content.status === "published" ? randomDate(14) : undefined,
      createdBy: editorUser.id,
    }).run();
  }

  // ==================== APPLICATIONS ====================
  db.insert(schema.applications).values([
    { name: "Sarah Chen", email: "sarah@example.com", businessName: "Chen Consulting", website: "https://chenco.io", revenueRange: "$250K-$1M", businessType: "founder", goal: "Scale organic reach to reduce CAC on paid ads", status: "new" },
    { name: "Mike Torres", email: "mike@example.com", businessName: "Torres Fitness", website: "https://torresfitness.com", revenueRange: "$50K-$250K", businessType: "personal_brand", goal: "Build inbound pipeline for high-ticket coaching", status: "reviewed" },
    { name: "Aisha Patel", email: "aisha@example.com", businessName: "Patel Ventures", website: "https://patelvc.com", revenueRange: "$1M+", businessType: "investor", goal: "Position as thought leader in VC space", status: "accepted" },
    { name: "James Wilson", email: "james@example.com", businessName: "Wilson Agency", website: "", revenueRange: "$10K-$50K", businessType: "operator", goal: "Get more clients for my agency", status: "rejected" },
    { name: "Lisa Park", email: "lisa@example.com", businessName: "Park Media Group", website: "https://parkmedia.co", revenueRange: "$250K-$1M", businessType: "high_ticket_seller", goal: "Dominate distribution in the coaching space", status: "flagged" },
  ]).run();

  // ==================== INVITE CODES ====================
  db.insert(schema.inviteCodes).values([
    { code: "LMS-ALPHA-001", role: "client", createdBy: admin.id },
    { code: "LMS-TEAM-EDIT", role: "editor", createdBy: admin.id },
    { code: "LMS-TEAM-DM01", role: "dm_setter", createdBy: admin.id },
  ]).run();

  // ==================== MESSAGE THREADS ====================
  const [thread1] = db
    .insert(schema.messageThreads)
    .values({ clientId: trellClient.id, subject: "Content Strategy Q1" })
    .returning();

  db.insert(schema.messages).values([
    { threadId: thread1.id, senderId: admin.id, content: "Hey Trell, let's map out the Q1 content strategy. I'm seeing strong momentum from the last batch." },
    { threadId: thread1.id, senderId: trellUser.id, content: "Absolutely. The fitness transformation series is crushing it. Let's double down on that format." },
    { threadId: thread1.id, senderId: editorUser.id, content: "I've got 5 new clips ready from the last shoot. Sending for review today." },
  ]).run();

  // ==================== DM CONVERSATIONS ====================
  const [dmConvo1] = db
    .insert(schema.dmConversations)
    .values({
      accountId: trellIG.id,
      contactName: "Interested Lead",
      contactUsername: "@fitnessfreak",
      isAutomated: true,
    })
    .returning();

  db.insert(schema.dmMessages).values([
    { conversationId: dmConvo1.id, direction: "inbound", content: "Hey, I saw your transformation reel. How do I sign up for coaching?", isAutomated: false },
    { conversationId: dmConvo1.id, direction: "outbound", content: "Thanks for reaching out! Here's a link to book a call with our team:", isAutomated: true },
  ]).run();

  console.log("✅ Database seeded successfully!");
  console.log("   - 8 users (1 admin, 4 clients, 1 editor, 1 DM setter, 1 VA)");
  console.log("   - 4 clients with Instagram accounts");
  console.log("   - 30 days of metrics per account");
  console.log("   - 6 content pieces");
  console.log("   - 5 applications");
  console.log("   - 3 invite codes");
  console.log("   - Message threads and DM conversations");
}

seed().catch(console.error);
```

**Step 7: Install dependencies, push schema, run seed**

```bash
cd /home/trajan/Desktop/Coding/Projects/letmescale
pnpm install
cd packages/db
pnpm db:push
pnpm db:seed
```

Expected: "Database seeded successfully!" with item counts.

**Step 8: Commit**

```bash
cd /home/trajan/Desktop/Coding/Projects/letmescale
git add packages/db/
git commit -m "feat: add database package with Drizzle schema, SQLite, and seed data"
```

---

### Task 4: Create Auth Package

**Files:**
- Create: `packages/auth/package.json`
- Create: `packages/auth/tsconfig.json`
- Create: `packages/auth/src/index.ts`
- Create: `packages/auth/src/auth-config.ts`
- Create: `packages/auth/src/dev-accounts.ts`

**Step 1: Create package.json**

```json
// packages/auth/package.json
{
  "name": "@letmescale/auth",
  "version": "0.0.1",
  "private": true,
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "dependencies": {
    "next-auth": "^5",
    "@letmescale/db": "workspace:*",
    "@letmescale/config": "workspace:*"
  }
}
```

**Step 2: Create auth-config.ts — NextAuth configuration**

```typescript
// packages/auth/src/auth-config.ts
import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import crypto from "crypto";
import { db, users, inviteCodes } from "@letmescale/db";
import { eq } from "drizzle-orm";
import type { Role } from "@letmescale/config";

function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex");
}

export const authConfig: NextAuthConfig = {
  providers: [
    Credentials({
      id: "credentials",
      name: "Email & Password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const email = credentials.email as string;
        const password = credentials.password as string;
        const pwHash = hashPassword(password);

        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.email, email))
          .limit(1);

        if (!user || user.passwordHash !== pwHash) return null;

        // Update last login
        await db
          .update(users)
          .set({ lastLogin: new Date().toISOString() })
          .where(eq(users.id, user.id));

        return {
          id: String(user.id),
          email: user.email,
          name: user.name,
          role: user.role,
          image: user.avatarUrl,
        };
      },
    }),
    Credentials({
      id: "invite-code",
      name: "Invite Code",
      credentials: {
        code: { label: "Invite Code", type: "text" },
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        name: { label: "Name", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.code || !credentials?.email || !credentials?.password || !credentials?.name) {
          return null;
        }

        const code = credentials.code as string;
        const email = credentials.email as string;
        const password = credentials.password as string;
        const name = credentials.name as string;

        // Find valid invite code
        const [invite] = await db
          .select()
          .from(inviteCodes)
          .where(eq(inviteCodes.code, code))
          .limit(1);

        if (!invite || invite.usedBy) return null;
        if (invite.expiresAt && new Date(invite.expiresAt) < new Date()) return null;

        // Create user
        const [newUser] = await db
          .insert(users)
          .values({
            email,
            passwordHash: hashPassword(password),
            name,
            role: invite.role,
          })
          .returning();

        // Mark invite as used
        await db
          .update(inviteCodes)
          .set({ usedBy: newUser.id })
          .where(eq(inviteCodes.id, invite.id));

        return {
          id: String(newUser.id),
          email: newUser.email,
          name: newUser.name,
          role: newUser.role,
        };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        (session.user as any).role = token.role as Role;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
};
```

**Step 3: Create dev-accounts.ts**

```typescript
// packages/auth/src/dev-accounts.ts
export const DEV_ACCOUNTS = [
  { email: "admin@letmescale.com", name: "LetMeScale Admin", role: "admin" as const, color: "#DC2626" },
  { email: "trell@test.com", name: "Trell The Trainer", role: "client" as const, color: "#3B82F6" },
  { email: "daniel@test.com", name: "Daniel", role: "client" as const, color: "#3B82F6" },
  { email: "mark@test.com", name: "Mark Shapiro", role: "client" as const, color: "#3B82F6" },
  { email: "chetha@test.com", name: "Chetha", role: "client" as const, color: "#3B82F6" },
  { email: "editor@test.com", name: "Alex Editor", role: "editor" as const, color: "#8B5CF6" },
  { email: "dmsetter@test.com", name: "Jordan DM", role: "dm_setter" as const, color: "#F59E0B" },
  { email: "va@test.com", name: "Sam VA", role: "va" as const, color: "#10B981" },
] as const;

export const DEV_PASSWORD = "password123";
```

**Step 4: Create index.ts barrel export**

```typescript
// packages/auth/src/index.ts
export { authConfig } from "./auth-config";
export { DEV_ACCOUNTS, DEV_PASSWORD } from "./dev-accounts";
```

**Step 5: Create tsconfig.json and install deps**

```json
// packages/auth/tsconfig.json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "outDir": "dist"
  },
  "include": ["src"]
}
```

```bash
cd /home/trajan/Desktop/Coding/Projects/letmescale
pnpm install
```

**Step 6: Commit**

```bash
git add packages/auth/
git commit -m "feat: add auth package with NextAuth credentials + invite code providers"
```

---

### Task 5: Create UI Package — Theme and Core Components

**Files:**
- Create: `packages/ui/package.json`
- Create: `packages/ui/tsconfig.json`
- Create: `packages/ui/src/index.ts`
- Create: `packages/ui/src/theme.ts`
- Create: `packages/ui/src/animations.ts`
- Create: `packages/ui/src/components/button.tsx`
- Create: `packages/ui/src/components/card.tsx`
- Create: `packages/ui/src/components/modal.tsx`
- Create: `packages/ui/src/components/badge.tsx`
- Create: `packages/ui/src/components/input.tsx`
- Create: `packages/ui/src/components/table.tsx`
- Create: `packages/ui/src/components/tabs.tsx`
- Create: `packages/ui/src/components/stepper.tsx`
- Create: `packages/ui/src/components/toast.tsx`
- Create: `packages/ui/src/components/avatar.tsx`
- Create: `packages/ui/src/components/dropdown.tsx`

**Step 1: Create package.json**

```json
// packages/ui/package.json
{
  "name": "@letmescale/ui",
  "version": "0.0.1",
  "private": true,
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "dependencies": {
    "framer-motion": "^11",
    "clsx": "^2",
    "tailwind-merge": "^2"
  },
  "peerDependencies": {
    "react": "^19",
    "react-dom": "^19"
  }
}
```

This task is large — implement each component one at a time. Each component should:
- Use the theme tokens from `theme.ts`
- Support dark theme natively (everything is dark-first)
- Use `clsx` + `tailwind-merge` for className merging
- Use Framer Motion for animations
- Export from `index.ts`

Theme tokens in `theme.ts`:
```typescript
export const theme = {
  colors: {
    bg: { DEFAULT: "#000000", secondary: "#0A0A0A", tertiary: "#111111" },
    primary: { DEFAULT: "#DC2626", light: "#EF4444", lighter: "#FCA5A5" },
    text: { DEFAULT: "#FFFFFF", secondary: "#F5F5F5", muted: "#A3A3A3" },
    surface: "rgba(255,255,255,0.05)",
    success: "#10B981",
    warning: "#F59E0B",
    dev: "#22C55E",
  },
  glow: {
    red: "0 0 20px rgba(220, 38, 38, 0.5)",
    green: "0 0 20px rgba(34, 197, 94, 0.5)",
  },
} as const;
```

Animation presets in `animations.ts`:
```typescript
export const fadeIn = { initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { duration: 0.5 } };
export const slideInRight = { initial: { x: "100%" }, animate: { x: 0 }, exit: { x: "100%" }, transition: { type: "spring", damping: 25 } };
// ... etc for all presets from the design doc
```

Implement all components listed above. Each should be a focused, reusable component. Complete code for each component should be written.

**Step 2: Install deps and commit**

```bash
cd /home/trajan/Desktop/Coding/Projects/letmescale
pnpm install
git add packages/ui/
git commit -m "feat: add UI package with theme, animations, and core components"
```

---

## Phase 2: Marketing Site

### Task 6: Scaffold Marketing App

**Files:**
- Create: `apps/marketing/package.json`
- Create: `apps/marketing/next.config.ts`
- Create: `apps/marketing/tsconfig.json`
- Create: `apps/marketing/tailwind.config.ts` (or CSS config for v4)
- Create: `apps/marketing/app/layout.tsx`
- Create: `apps/marketing/app/globals.css`
- Create: `apps/marketing/app/(site)/layout.tsx`
- Create: `apps/marketing/app/(site)/page.tsx` (placeholder)

**Step 1: Create package.json**

```json
// apps/marketing/package.json
{
  "name": "@letmescale/marketing",
  "version": "0.0.1",
  "private": true,
  "scripts": {
    "dev": "next dev --port 3000",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "next": "^15",
    "react": "^19",
    "react-dom": "^19",
    "@letmescale/ui": "workspace:*",
    "@letmescale/config": "workspace:*",
    "@letmescale/db": "workspace:*",
    "framer-motion": "^11"
  },
  "devDependencies": {
    "typescript": "^5",
    "@types/react": "^19",
    "@types/react-dom": "^19",
    "tailwindcss": "^4",
    "@tailwindcss/postcss": "^4",
    "postcss": "^8"
  }
}
```

**Step 2: Create next.config.ts with transpile packages**

```typescript
// apps/marketing/next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@letmescale/ui", "@letmescale/config"],
};

export default nextConfig;
```

**Step 3: Create app/globals.css with Tailwind v4 + custom theme**

```css
/* apps/marketing/app/globals.css */
@import "tailwindcss";

@theme {
  --color-bg: #000000;
  --color-bg-secondary: #0A0A0A;
  --color-bg-tertiary: #111111;
  --color-primary: #DC2626;
  --color-primary-light: #EF4444;
  --color-primary-lighter: #FCA5A5;
  --color-text: #FFFFFF;
  --color-text-secondary: #F5F5F5;
  --color-text-muted: #A3A3A3;
  --color-surface: rgba(255, 255, 255, 0.05);
}

body {
  background-color: var(--color-bg);
  color: var(--color-text);
}
```

**Step 4: Create root layout.tsx**

```tsx
// apps/marketing/app/layout.tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "LetMeScale — Attention Is Leverage. We Control Leverage.",
  description: "We turn attention into control. Not views. Not followers. Not vanity metrics. Control.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className={`${inter.className} antialiased`}>{children}</body>
    </html>
  );
}
```

**Step 5: Create placeholder page and verify it runs**

```tsx
// apps/marketing/app/(site)/page.tsx
export default function HomePage() {
  return (
    <main className="min-h-screen bg-bg text-text flex items-center justify-center">
      <h1 className="text-5xl font-bold">LetMeScale</h1>
    </main>
  );
}
```

```bash
cd /home/trajan/Desktop/Coding/Projects/letmescale
pnpm install
pnpm --filter @letmescale/marketing dev
```

Expected: Site running on localhost:3000 with "LetMeScale" displayed.

**Step 6: Commit**

```bash
git add apps/marketing/
git commit -m "feat: scaffold marketing app with Next.js 15 + Tailwind v4"
```

---

### Task 7: Prepare Proof Assets

**Files:**
- Create: `apps/marketing/public/testimonials/trell/` (copy + rename images)
- Create: `apps/marketing/public/testimonials/daniel/` (copy + rename images)
- Create: `apps/marketing/public/testimonials/mark-shapiro/` (copy + rename images)
- Create: `apps/marketing/public/testimonials/chetha/` (copy + rename images)
- Create: `apps/marketing/lib/testimonials.ts` (data mapping)

**Step 1: Copy and organize testimonial images**

Copy all image assets from `letmescale_resources/Testimonials/` to `apps/marketing/public/testimonials/` with clean filenames. Use a script:

```bash
#!/bin/bash
# Run from project root
BASE="apps/marketing/public/testimonials"
SRC="letmescale_resources/Testimonials"

mkdir -p "$BASE/trell" "$BASE/daniel" "$BASE/mark-shapiro" "$BASE/chetha"

# Trell
cp "$SRC/Trell 83K in 6 days/"*.jpeg "$BASE/trell/revenue-83k.jpeg"
cp "$SRC/Trellthetrainer before working with us REV./"*"(1).jpeg" "$BASE/trell/before-1.jpeg"
cp "$SRC/Trellthetrainer before working with us REV./"*"15.01.09.jpeg" "$BASE/trell/before-2.jpeg"
cp "$SRC/Trellthetrainer before working with us REV./"*"15.01.40.jpeg" "$BASE/trell/before-3.jpeg"
cp "$SRC/Trellthetrainer REV. After/"*"15.00.33.jpeg" "$BASE/trell/after-1.jpeg"
cp "$SRC/Trellthetrainer REV. After/"*"15.03.02.jpeg" "$BASE/trell/after-2.jpeg"
cp "$SRC/Trellthetrainer REV. After/"*"14.59.36.jpeg" "$BASE/trell/after-3.jpeg"

# Daniel
cp "$SRC/Daniel/DecemberResult.jpeg" "$BASE/daniel/december-9m-views.jpeg"
cp "$SRC/Daniel/Last4months.PNG" "$BASE/daniel/90-day-14m-views.png"
cp "$SRC/Daniel/Acc_reach_oneReel.png" "$BASE/daniel/single-reel-2.3m-reach.png"
cp "$SRC/Daniel/Last_90_days.PNG" "$BASE/daniel/90-day-summary.png"
cp "$SRC/Daniel/ReelInsight(1).PNG" "$BASE/daniel/reel-insight-7.9m.png"
cp "$SRC/Daniel/ReelInsight(2).jpeg" "$BASE/daniel/reel-insight-2.jpeg"
cp "$SRC/Daniel/Audience(USAtalking1).PNG" "$BASE/daniel/audience-usa-1.png"
cp "$SRC/Daniel/Audience(USAtalking2).PNG" "$BASE/daniel/audience-usa-2.png"
cp "$SRC/Daniel/Audience(USAviral1).PNG" "$BASE/daniel/audience-viral.png"
cp "$SRC/Daniel/IMG_3813.PNG" "$BASE/daniel/full-dashboard.png"

# Mark Shapiro - copy all 7 images
i=1; for f in "$SRC/Mark Shapiro capital REV./"*.jpeg; do cp "$f" "$BASE/mark-shapiro/dashboard-$i.jpeg"; ((i++)); done

# Chetha results (images only, skip videos for now)
i=1; for f in "$SRC/Chetha/Results/"*.PNG; do cp "$f" "$BASE/chetha/results-$i.png"; ((i++)); done
i=1; for f in "$SRC/Chetha/Results/New/"*; do cp "$f" "$BASE/chetha/results-new-$i.${f##*.}"; ((i++)); done
i=1; for f in "$SRC/Chetha/Results/Maaz results/"*.PNG; do cp "$f" "$BASE/chetha/maaz-$i.png"; ((i++)); done
```

**Step 2: Create testimonials.ts data mapping**

```typescript
// apps/marketing/lib/testimonials.ts
export interface CaseStudy {
  id: string;
  client: string;
  headline: string;
  metric: string;
  metricLabel: string;
  heroImage: string;
  images: string[];
  videos?: string[];
  description: string;
}

export const HERO_METRICS = [
  { value: 83212, prefix: "$", suffix: "+", label: "in 6 days", duration: 2 },
  { value: 14.2, suffix: "M", label: "views in 90 days", duration: 2.5 },
  { value: 90300, prefix: "$", suffix: "+", label: "cash collected", duration: 2 },
  { value: 2.3, suffix: "M", label: "reach from 1 reel", duration: 1.5 },
];

export const CASE_STUDIES: CaseStudy[] = [
  {
    id: "trell",
    client: "Trell The Trainer",
    headline: "$83K in 6 Days",
    metric: "$83,212",
    metricLabel: "Revenue in 6 Days",
    heroImage: "/testimonials/trell/revenue-83k.jpeg",
    images: [
      "/testimonials/trell/revenue-83k.jpeg",
      "/testimonials/trell/before-1.jpeg",
      "/testimonials/trell/before-2.jpeg",
      "/testimonials/trell/before-3.jpeg",
      "/testimonials/trell/after-1.jpeg",
      "/testimonials/trell/after-2.jpeg",
      "/testimonials/trell/after-3.jpeg",
    ],
    description: "From $31K with declining revenue to $77K+ with sustained growth. $83K generated in just 6 days after implementing our distribution system.",
  },
  {
    id: "daniel",
    client: "Daniel",
    headline: "14.2M Views in 90 Days",
    metric: "14.2M",
    metricLabel: "Views in 90 Days",
    heroImage: "/testimonials/daniel/december-9m-views.jpeg",
    images: [
      "/testimonials/daniel/december-9m-views.jpeg",
      "/testimonials/daniel/90-day-14m-views.png",
      "/testimonials/daniel/single-reel-2.3m-reach.png",
      "/testimonials/daniel/90-day-summary.png",
      "/testimonials/daniel/reel-insight-7.9m.png",
      "/testimonials/daniel/reel-insight-2.jpeg",
      "/testimonials/daniel/audience-usa-1.png",
      "/testimonials/daniel/audience-usa-2.png",
      "/testimonials/daniel/audience-viral.png",
      "/testimonials/daniel/full-dashboard.png",
    ],
    description: "9.2M views in December alone. 2.3M accounts reached from a single reel. 99.1% non-follower reach. +897% growth.",
  },
  {
    id: "mark-shapiro",
    client: "Mark Shapiro Capital",
    headline: "$90K Cash Collected",
    metric: "$90,300",
    metricLabel: "Cash Collected",
    heroImage: "/testimonials/mark-shapiro/dashboard-1.jpeg",
    images: [
      "/testimonials/mark-shapiro/dashboard-1.jpeg",
      "/testimonials/mark-shapiro/dashboard-2.jpeg",
      "/testimonials/mark-shapiro/dashboard-3.jpeg",
      "/testimonials/mark-shapiro/dashboard-4.jpeg",
      "/testimonials/mark-shapiro/dashboard-5.jpeg",
      "/testimonials/mark-shapiro/dashboard-6.jpeg",
      "/testimonials/mark-shapiro/dashboard-7.jpeg",
    ],
    description: "146 booked calls. 69% show-up rate. $90,300 cash collected. +111% average order value. 32 new deals.",
  },
  {
    id: "chetha",
    client: "Chetha",
    headline: "6.5M Views Generated",
    metric: "6.5M",
    metricLabel: "Total Views Generated",
    heroImage: "/testimonials/chetha/results-1.png",
    images: [
      "/testimonials/chetha/results-1.png",
      "/testimonials/chetha/results-2.png",
      "/testimonials/chetha/results-3.png",
      "/testimonials/chetha/maaz-1.png",
      "/testimonials/chetha/maaz-2.png",
      "/testimonials/chetha/maaz-3.png",
    ],
    description: "6.5M total views generated. 3M views through Maaz results. Content rewards monetization at scale with $0.31 CPM.",
  },
];
```

**Step 3: Commit**

```bash
git add apps/marketing/public/testimonials/ apps/marketing/lib/
git commit -m "feat: add organized proof assets and testimonial data mapping"
```

---

### Task 8: Build Landing Page — All 9 Sections

**Files:**
- Create: `apps/marketing/components/nav.tsx` — Sticky nav with scroll-aware transparency
- Create: `apps/marketing/components/scroll-progress.tsx` — Red progress line
- Create: `apps/marketing/components/sections/hero.tsx` — Section 1
- Create: `apps/marketing/components/sections/disqualifier.tsx` — Section 2
- Create: `apps/marketing/components/sections/what-we-do.tsx` — Section 3 (3 pillars)
- Create: `apps/marketing/components/sections/why-this-works.tsx` — Section 4
- Create: `apps/marketing/components/sections/results.tsx` — Section 5 (metrics bar + carousel)
- Create: `apps/marketing/components/sections/how-we-work.tsx` — Section 6
- Create: `apps/marketing/components/sections/who-is-for.tsx` — Section 7
- Create: `apps/marketing/components/sections/philosophy.tsx` — Section 8
- Create: `apps/marketing/components/sections/final-cta.tsx` — Section 9
- Create: `apps/marketing/components/case-study-modal.tsx` — Fullscreen gallery modal
- Create: `apps/marketing/components/video-modal.tsx` — VSL video modal
- Create: `apps/marketing/components/counter.tsx` — Animated counting number
- Modify: `apps/marketing/app/(site)/page.tsx` — Compose all sections

Build each section component following the exact copy and layout from the design doc (Section 4.1). Reference `LETMESCALE.md` for all copy. Use `@letmescale/ui` components where applicable. Add Framer Motion animations:
- Hero: stagger-in text, parallax, glow pulse CTA
- Disqualifier: sharp cut sequential reveal on scroll
- What We Do: card hover flip/expand
- Why This Works: strikethrough + glow animations
- Results: countUp numbers, horizontal drag carousel
- How We Work: blur-to-sharp reveal
- Philosophy: typewriter cascade
- Final CTA: glow pulse

The case study modal should support: image gallery with prev/next, image zoom, video player, narrative text. Use the `CASE_STUDIES` data from `testimonials.ts`.

**Step 1: Build each component one at a time, top to bottom**

Implement all components with full code. Each section is a self-contained React component receiving no props (data comes from constants/lib files).

**Step 2: Compose in page.tsx**

```tsx
// apps/marketing/app/(site)/page.tsx
import { Nav } from "@/components/nav";
import { ScrollProgress } from "@/components/scroll-progress";
import { Hero } from "@/components/sections/hero";
import { Disqualifier } from "@/components/sections/disqualifier";
import { WhatWeDo } from "@/components/sections/what-we-do";
import { WhyThisWorks } from "@/components/sections/why-this-works";
import { Results } from "@/components/sections/results";
import { HowWeWork } from "@/components/sections/how-we-work";
import { WhoIsFor } from "@/components/sections/who-is-for";
import { Philosophy } from "@/components/sections/philosophy";
import { FinalCTA } from "@/components/sections/final-cta";

export default function HomePage() {
  return (
    <>
      <Nav />
      <ScrollProgress />
      <main>
        <Hero />
        <Disqualifier />
        <WhatWeDo />
        <WhyThisWorks />
        <Results />
        <HowWeWork />
        <WhoIsFor />
        <Philosophy />
        <FinalCTA />
      </main>
    </>
  );
}
```

**Step 3: Verify visually — run dev server and check each section**

```bash
pnpm --filter @letmescale/marketing dev
```

Open localhost:3000 and verify all 9 sections render with correct copy, proof assets load, modals work, animations fire on scroll.

**Step 4: Commit**

```bash
git add apps/marketing/
git commit -m "feat: build complete landing page with all 9 sections, proof assets, and animations"
```

---

### Task 9: Build Application Page (`/apply`)

**Files:**
- Create: `apps/marketing/app/apply/page.tsx`
- Create: `apps/marketing/components/apply/stepper.tsx` — Progress flow
- Create: `apps/marketing/components/apply/step-qualification.tsx` — Step 1
- Create: `apps/marketing/components/apply/step-details.tsx` — Step 2
- Create: `apps/marketing/components/apply/step-schedule.tsx` — Step 3 (Calendly)
- Create: `apps/marketing/components/apply/step-confirmation.tsx` — Step 4
- Create: `apps/marketing/components/apply/rejection-screen.tsx` — Disqualified view

Build multi-step form following design doc Section 4.2:
- Horizontal progress stepper at top (4 steps, red active state)
- Step 1: Card-select for qualification questions. "No" to revenue → rejection screen
- Step 2: Form fields with red focus glow, Zod validation using `applicationSchema` from `@letmescale/config`
- Step 3: Calendly embed (use iframe with dark theme URL param, or placeholder if no Calendly URL)
- Step 4: Confirmation with red check mark animation
- Form state management with React useState, step transitions with Framer Motion
- On submit: POST to `/api/apply` which inserts into applications table

**Step 1: Build the page and all step components**

Write complete code for each component.

**Step 2: Create API route for form submission**

```typescript
// apps/marketing/app/api/apply/route.ts
import { db, applications } from "@letmescale/db";
import { applicationSchema } from "@letmescale/config";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const body = await req.json();
  const parsed = applicationSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const [application] = await db
    .insert(applications)
    .values({
      name: parsed.data.name,
      email: parsed.data.email,
      businessName: parsed.data.businessName,
      website: parsed.data.website || null,
      revenueRange: parsed.data.revenueRange,
      businessType: parsed.data.businessType,
      goal: parsed.data.goal,
      referralSource: parsed.data.referralSource || null,
    })
    .returning();

  return NextResponse.json({ id: application.id }, { status: 201 });
}
```

**Step 3: Verify — navigate to /apply, complete each step, submit**

**Step 4: Commit**

```bash
git add apps/marketing/
git commit -m "feat: build multi-step application funnel with validation and API submission"
```

---

## Phase 3: Dashboard App

### Task 10: Scaffold Dashboard App

**Files:**
- Create: `apps/dashboard/package.json`
- Create: `apps/dashboard/next.config.ts`
- Create: `apps/dashboard/tsconfig.json`
- Create: `apps/dashboard/app/layout.tsx`
- Create: `apps/dashboard/app/globals.css`
- Create: `apps/dashboard/auth.ts` — NextAuth instance
- Create: `apps/dashboard/middleware.ts` — Route protection

**Step 1: Create package.json**

```json
// apps/dashboard/package.json
{
  "name": "@letmescale/dashboard",
  "version": "0.0.1",
  "private": true,
  "scripts": {
    "dev": "next dev --port 3001",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "next": "^15",
    "react": "^19",
    "react-dom": "^19",
    "@letmescale/ui": "workspace:*",
    "@letmescale/config": "workspace:*",
    "@letmescale/db": "workspace:*",
    "@letmescale/auth": "workspace:*",
    "next-auth": "^5",
    "framer-motion": "^11"
  },
  "devDependencies": {
    "typescript": "^5",
    "@types/react": "^19",
    "@types/react-dom": "^19",
    "tailwindcss": "^4",
    "@tailwindcss/postcss": "^4",
    "postcss": "^8"
  }
}
```

**Step 2: Create auth.ts for NextAuth instance**

```typescript
// apps/dashboard/auth.ts
import NextAuth from "next-auth";
import { authConfig } from "@letmescale/auth";

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
```

**Step 3: Create middleware.ts for route protection**

```typescript
// apps/dashboard/middleware.ts
import { auth } from "./auth";
import { canAccessRoute } from "@letmescale/config";
import type { Role } from "@letmescale/config";

export default auth((req) => {
  const { pathname } = req.nextUrl;

  // Allow login page
  if (pathname.startsWith("/login")) return;

  // Require auth for everything else
  if (!req.auth) {
    return Response.redirect(new URL("/login", req.url));
  }

  const role = (req.auth.user as any)?.role as Role;
  if (!canAccessRoute(role, pathname)) {
    return Response.redirect(new URL("/unauthorized", req.url));
  }
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
```

**Step 4: Create layout, globals.css (same theme as marketing), API route handlers**

**Step 5: Verify — run on port 3001, confirm redirect to /login**

```bash
pnpm --filter @letmescale/dashboard dev
```

**Step 6: Commit**

```bash
git add apps/dashboard/
git commit -m "feat: scaffold dashboard app with NextAuth and route protection middleware"
```

---

### Task 11: Build Login Page

**Files:**
- Create: `apps/dashboard/app/login/page.tsx`
- Create: `apps/dashboard/components/login-form.tsx`
- Create: `apps/dashboard/components/dev-login.tsx` — Big green button + dropdown
- Create: `apps/dashboard/components/invite-code-form.tsx`

Build following design doc Section 5.1:
- Dark, minimal. Logo centered at top.
- Email/password form using `@letmescale/ui` Input + Button
- "Have an invite code?" expandable section (click to toggle)
- **Big green DEV LOGIN button** at bottom:
  - Only visible when `NODE_ENV === 'development'`
  - Green glow effect
  - Click opens popup/dropdown with seeded account cards from `DEV_ACCOUNTS`
  - Each card shows: role badge (colored), name, email
  - Click card → calls signIn with that account's credentials
- Use NextAuth `signIn("credentials", { email, password })` for login
- On success → redirect to `/admin` (if admin) or `/portal` (if client/team)

**Step 1: Build all components with complete code**

**Step 2: Verify — log in as admin via dev button, verify redirect to /admin**

**Step 3: Commit**

```bash
git add apps/dashboard/
git commit -m "feat: build login page with dev quick-login and invite code support"
```

---

### Task 12: Build Dashboard Layout and Navigation

**Files:**
- Create: `apps/dashboard/components/sidebar.tsx` — Main sidebar nav
- Create: `apps/dashboard/components/admin-button.tsx` — Big red ADMIN button
- Create: `apps/dashboard/components/header.tsx` — Top bar with user info
- Create: `apps/dashboard/app/(dashboard)/layout.tsx` — Shared dashboard layout
- Create: `apps/dashboard/app/admin/layout.tsx` — Admin layout wrapper
- Create: `apps/dashboard/app/portal/layout.tsx` — Portal layout wrapper

Build the shared dashboard shell:
- Left sidebar with navigation links (different links for admin vs portal based on role)
- Top header bar with user name, role badge, avatar, logout button
- **Big Red ADMIN button** — fixed position, visible only to admin-role users, glowing red. Click navigates to `/admin`.
- Portal sidebar links: Home | Deliverables | Metrics | Accounts | Scheduling | DM Center | Messages
- Admin sidebar links: Overview | Leads | Clients | Team | Settings
- Active link indicator (red accent)
- Responsive: sidebar collapses on mobile

**Step 1: Build all layout components**

**Step 2: Verify — log in as admin, see admin nav. Log in as client, see portal nav.**

**Step 3: Commit**

```bash
git add apps/dashboard/
git commit -m "feat: build dashboard layout with sidebar, header, and role-based navigation"
```

---

### Task 13: Build Admin Overview Page

**Files:**
- Create: `apps/dashboard/app/admin/page.tsx`
- Create: `apps/dashboard/components/admin/kpi-cards.tsx`
- Create: `apps/dashboard/components/admin/recent-applications.tsx`
- Create: `apps/dashboard/components/admin/quick-actions.tsx`

Build following design doc — `/admin` Overview:
- KPI cards across top (Total leads, Active clients, Pending applications, Revenue this month)
- Query from DB for real counts
- Recent applications table (last 10, from applications table)
- Quick action buttons that navigate to sub-pages
- Cards have hover-lift animation

**Step 1: Build components, query DB in server components**

**Step 2: Verify — log in as admin, check KPI numbers match seed data**

**Step 3: Commit**

```bash
git add apps/dashboard/
git commit -m "feat: build admin overview with KPI cards and recent applications"
```

---

### Task 14: Build Admin Leads Page

**Files:**
- Create: `apps/dashboard/app/admin/leads/page.tsx`
- Create: `apps/dashboard/components/admin/leads-table.tsx`
- Create: `apps/dashboard/components/admin/lead-detail-panel.tsx` — Slide-out panel
- Create: `apps/dashboard/app/api/admin/leads/[id]/route.ts` — Update status API

Build following design doc — `/admin/leads`:
- Full table of applications with columns: Name, Revenue range, Business type, Date, Status
- Status badge (colored by status)
- Click row → slide-out panel from right (using `@letmescale/ui` Modal slideInRight variant)
- Panel shows full application details
- Action buttons: Accept (creates invite code) | Reject | Flag
- Search bar + status filter dropdown
- Use server component for initial data, client components for interactivity

**Step 1: Build components**

**Step 2: Verify — view leads, click to open panel, change status**

**Step 3: Commit**

```bash
git add apps/dashboard/
git commit -m "feat: build admin leads management with detail panel and status actions"
```

---

### Task 15: Build Admin Clients Page

**Files:**
- Create: `apps/dashboard/app/admin/clients/page.tsx`
- Create: `apps/dashboard/components/admin/client-card.tsx`
- Create: `apps/dashboard/app/admin/clients/[id]/page.tsx`
- Create: `apps/dashboard/components/admin/client-detail-tabs.tsx`
  - Overview tab, Team tab, Accounts tab, Metrics tab, Activity tab

Build following design doc — `/admin/clients` and `/admin/clients/[id]`:
- Card grid of active clients with avatar, name, business, assigned team, metrics, status
- Click card → navigate to `/admin/clients/[id]`
- Detail page with tabbed layout (5 tabs)
- Team tab: list of assigned members, "Assign" button to add from team pool
- Accounts tab: Instagram accounts with metrics
- Metrics tab: charts with mock data (use a simple chart library or SVG)
- Activity tab: timeline view

**Step 1: Build all components**

**Step 2: Verify — view client cards, click through to detail, switch tabs**

**Step 3: Commit**

```bash
git add apps/dashboard/
git commit -m "feat: build admin client management with detail page and tabbed layout"
```

---

### Task 16: Build Admin Team Page

**Files:**
- Create: `apps/dashboard/app/admin/team/page.tsx`
- Create: `apps/dashboard/components/admin/team-table.tsx`
- Create: `apps/dashboard/components/admin/invite-member-modal.tsx`
- Create: `apps/dashboard/app/api/admin/team/invite/route.ts` — Generate invite code API

Build following design doc — `/admin/team`:
- Table of team members: Name, Role, Assigned clients, Status, Last active
- Role filter tabs (All / Editors / DM Setters / VAs)
- "Invite Team Member" button → modal with name, email, role selector
- On invite: generate random invite code, insert into invite_codes table, show code with copy button
- Click member row → slide-out detail panel

**Step 1: Build components**

**Step 2: Verify — view team, filter by role, invite new member**

**Step 3: Commit**

```bash
git add apps/dashboard/
git commit -m "feat: build admin team management with invite system"
```

---

### Task 17: Build Admin Settings Page

**Files:**
- Create: `apps/dashboard/app/admin/settings/page.tsx`
- Create: `apps/dashboard/components/admin/settings-sections.tsx`

Build following design doc — `/admin/settings`:
- Collapsible sections: Invite Codes, Integrations, General
- Invite codes: table of all codes, generate new, revoke
- Integrations: placeholder fields for ManyChat API key, Instagram app credentials
- General: company info, notification preferences
- Toggle switches, save button with toast confirmation

**Step 1: Build components**

**Step 2: Verify — toggle sections, generate invite code, save settings**

**Step 3: Commit**

```bash
git add apps/dashboard/
git commit -m "feat: build admin settings with invite codes and integration placeholders"
```

---

## Phase 4: Client Portal

### Task 18: Build Portal Home Page

**Files:**
- Create: `apps/dashboard/app/portal/page.tsx`
- Create: `apps/dashboard/components/portal/welcome-card.tsx`
- Create: `apps/dashboard/components/portal/quick-stats.tsx`
- Create: `apps/dashboard/components/portal/activity-feed.tsx`

Build following design doc — `/portal`:
- Welcome card with client name + account manager
- 4 stat cards: Total views this week, Scheduled posts, Pending approvals, Messages
- Sparkline mini-charts in stat cards (simple SVG or inline chart)
- Recent activity feed with timestamps and avatars
- Data from DB based on logged-in client's ID

**Step 1: Build components, query DB for client-specific data**

**Step 2: Verify — log in as Trell, see Trell's data**

**Step 3: Commit**

```bash
git add apps/dashboard/
git commit -m "feat: build client portal home with stats and activity feed"
```

---

### Task 19: Build Portal Deliverables Page

**Files:**
- Create: `apps/dashboard/app/portal/deliverables/page.tsx`
- Create: `apps/dashboard/components/portal/content-grid.tsx`
- Create: `apps/dashboard/components/portal/content-detail-modal.tsx`
- Create: `apps/dashboard/app/api/portal/deliverables/[id]/route.ts` — Approve/reject API

Build following design doc — `/portal/deliverables`:
- Grid of content pieces (cards with thumbnail, title, status badge, date)
- Filter bar: status filter, date sort
- Click card → content detail modal with preview, caption, approval buttons
- Approve / Request Changes (with comment) / Download actions
- Comment thread in slide-out panel

**Step 1: Build components**

**Step 2: Verify — view content grid, open modal, approve content**

**Step 3: Commit**

```bash
git add apps/dashboard/
git commit -m "feat: build portal deliverables with content grid and approval workflow"
```

---

### Task 20: Build Portal Metrics Page

**Files:**
- Create: `apps/dashboard/app/portal/metrics/page.tsx`
- Create: `apps/dashboard/components/portal/metrics-dashboard.tsx`
- Create: `apps/dashboard/components/portal/metric-chart.tsx` — Simple SVG chart
- Create: `apps/dashboard/components/portal/date-range-picker.tsx`
- Create: `apps/dashboard/components/portal/account-switcher.tsx`

Build following design doc — `/portal/metrics`:
- Per-account dashboard
- Metrics: Views, Reach, Engagement rate, Follower growth, Top content
- Line and bar charts (use simple SVG paths or a lightweight lib like recharts)
- Date range picker (last 7d / 30d / 90d / custom)
- Account switcher dropdown (for clients with multiple accounts)
- Comparison toggle (this week vs last week)
- Data from metrics_snapshots table

**Step 1: Build components with chart rendering**

**Step 2: Verify — switch accounts, change date range, see charts update**

**Step 3: Commit**

```bash
git add apps/dashboard/
git commit -m "feat: build portal metrics dashboard with charts and date filtering"
```

---

### Task 21: Build Portal Accounts Page

**Files:**
- Create: `apps/dashboard/app/portal/accounts/page.tsx`
- Create: `apps/dashboard/components/portal/account-card.tsx`
- Create: `apps/dashboard/app/portal/accounts/[id]/page.tsx`
- Create: `apps/dashboard/components/portal/account-detail.tsx`

Build following design doc — `/portal/accounts`:
- List of Instagram accounts with profile preview, follower count, performance, assigned editor
- Performance badges (trending up/down)
- Click → account detail page with full metrics + content history
- Status indicators

**Step 1: Build components**

**Step 2: Verify — view accounts, click through to detail**

**Step 3: Commit**

```bash
git add apps/dashboard/
git commit -m "feat: build portal accounts management with detail view"
```

---

### Task 22: Build Portal Scheduling Page

**Files:**
- Create: `apps/dashboard/app/portal/scheduling/page.tsx`
- Create: `apps/dashboard/components/portal/calendar.tsx` — Week/month calendar
- Create: `apps/dashboard/components/portal/schedule-modal.tsx` — Create/edit schedule
- Create: `apps/dashboard/components/portal/promote-modal.tsx` — Trial → Normal confirm
- Create: `apps/dashboard/app/api/portal/scheduling/route.ts` — CRUD API

Build following design doc — `/portal/scheduling`:
- Calendar view (week/month toggle)
- Scheduled + published content shown on calendar
- Click empty slot → scheduling modal (content selector, caption, time, account, type toggle)
- Content type: Trial reel / Normal reel / Story
- "Promote trial reel" button → confirmation modal
- Data from content_pieces + schedules tables

**Step 1: Build calendar component (custom, using CSS grid for week/month layout)**

**Step 2: Build modals and API**

**Step 3: Verify — view calendar, create schedule, promote trial reel**

**Step 4: Commit**

```bash
git add apps/dashboard/
git commit -m "feat: build portal scheduling with calendar and content type management"
```

---

### Task 23: Build Portal DM Center Page

**Files:**
- Create: `apps/dashboard/app/portal/dm-center/page.tsx`
- Create: `apps/dashboard/components/portal/dm-inbox.tsx` — Split layout
- Create: `apps/dashboard/components/portal/dm-conversation-list.tsx`
- Create: `apps/dashboard/components/portal/dm-message-thread.tsx`
- Create: `apps/dashboard/components/portal/dm-quick-reply.tsx`

Build following design doc — `/portal/dm-center`:
- Split layout: conversation list (left, ~300px) + message thread (right)
- Account filter dropdown at top
- Conversation list: contact name, last message preview, timestamp, automation badge
- Message thread: chat bubbles (inbound left, outbound right), timestamps
- ManyChat automation badge on auto-responses
- Quick reply templates dropdown
- Search conversations
- Mock real-time feel (data from seed)

**Step 1: Build all components**

**Step 2: Verify — view conversations, click to read, use quick reply**

**Step 3: Commit**

```bash
git add apps/dashboard/
git commit -m "feat: build portal DM center with split inbox and automation badges"
```

---

### Task 24: Build Portal Messages Page

**Files:**
- Create: `apps/dashboard/app/portal/messages/page.tsx`
- Create: `apps/dashboard/components/portal/message-threads.tsx`
- Create: `apps/dashboard/components/portal/message-thread-view.tsx`
- Create: `apps/dashboard/components/portal/message-composer.tsx`
- Create: `apps/dashboard/app/api/portal/messages/route.ts`

Build following design doc — `/portal/messages`:
- Thread list (left) + active thread (right)
- Chat-style message bubbles with sender avatar and name
- Message composer with text input + file upload button (drag-to-upload zone)
- File preview inline (images render as thumbnails)
- Typing indicator (mock animation)
- Data from message_threads + messages tables

**Step 1: Build components**

**Step 2: Verify — view threads, send message, see it appear**

**Step 3: Commit**

```bash
git add apps/dashboard/
git commit -m "feat: build portal team messaging with thread UI and file sharing"
```

---

## Phase 5: Polish and Integration

### Task 25: Add Results Gallery Page

**Files:**
- Create: `apps/marketing/app/results/page.tsx`
- Create: `apps/marketing/components/results-gallery.tsx`
- Create: `apps/marketing/components/gallery-filter.tsx`

Build following design doc Section 4.3:
- Full gallery of all proof assets in masonry grid
- Filter tabs: All | Revenue Proof | View Metrics | Before/After | Video Testimonials
- Each item opens case study modal (reuse from Task 8)
- Smooth filter animation (Framer Motion layout transitions)

**Step 1: Build components**

**Step 2: Verify — navigate to /results, filter, open modals**

**Step 3: Commit**

```bash
git add apps/marketing/
git commit -m "feat: add results gallery page with masonry grid and filtering"
```

---

### Task 26: Final Visual Polish and Animation Pass

**Files:**
- Modify: Various component files across marketing and dashboard apps

Final pass to ensure:
- All Framer Motion animations work on scroll (IntersectionObserver-based)
- Red glow effects consistent across all CTA buttons
- Glassmorphic surface effects on dashboard cards
- Hover-lift on all cards (marketing and dashboard)
- Smooth page transitions in dashboard (Framer Motion AnimatePresence)
- Loading states/skeletons for all data-fetching pages
- Mobile responsiveness across all pages
- Consistent use of theme tokens everywhere
- Scroll-to-section links work in nav

**Step 1: Audit and fix each app**

**Step 2: Verify — full manual walkthrough of both apps**

**Step 3: Commit**

```bash
git add .
git commit -m "feat: final visual polish, animations, responsive fixes"
```

---

### Task 27: Verify Full Platform End-to-End

**No files to create — verification only.**

Run both apps simultaneously:
```bash
pnpm dev
```

Walk through the entire platform:

**Marketing site (localhost:3000):**
1. Landing page loads with all 9 sections
2. Scroll animations fire correctly
3. All proof asset images load in Results section
4. Case study modals open with gallery navigation
5. VSL video modal plays
6. "Request Access" navigates to /apply
7. Complete application form through all 4 steps
8. /results gallery loads and filters work

**Dashboard (localhost:3001):**
1. Login page shows with dev quick-login button
2. Click dev login → popup with all seeded accounts
3. Log in as Admin → see admin dashboard
4. Admin overview shows correct KPI counts
5. Leads page shows 5 seeded applications, slide-out panel works
6. Clients page shows 4 clients, detail page tabs work
7. Team page shows 3 team members, invite modal works
8. Settings page sections expand/collapse
9. Log in as Trell (client) → see portal
10. Portal home shows Trell's stats
11. Deliverables grid shows Trell's content
12. Metrics charts render with Trell's data
13. Accounts page shows @trellthetrainer
14. Scheduling calendar renders
15. DM Center shows conversations
16. Messages shows team threads

**Step 1: Run through entire checklist**

**Step 2: Fix any issues found**

**Step 3: Final commit**

```bash
git add .
git commit -m "chore: end-to-end verification and fixes"
```

---

## Summary

| Phase | Tasks | Description |
|-------|-------|-------------|
| **Phase 1** | Tasks 1-5 | Monorepo foundation: Turborepo, config, DB, auth, UI packages |
| **Phase 2** | Tasks 6-9 | Marketing site: scaffold, proof assets, landing page, apply page |
| **Phase 3** | Tasks 10-17 | Dashboard: scaffold, login, layout, admin pages (overview, leads, clients, team, settings) |
| **Phase 4** | Tasks 18-24 | Client portal: home, deliverables, metrics, accounts, scheduling, DM center, messages |
| **Phase 5** | Tasks 25-27 | Polish: results gallery, animations, E2E verification |

**Total: 27 tasks across 5 phases.**

#letmescale #plans #archive
