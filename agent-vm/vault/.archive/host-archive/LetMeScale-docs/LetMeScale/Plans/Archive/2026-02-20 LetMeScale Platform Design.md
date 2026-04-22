> See also: [[LetMeScale]]

# LetMeScale Platform Design

**Date:** 2026-02-20
**Status:** Approved
**Type:** Full Platform — Marketing Site + Application Funnel + Admin Dashboard + Client Portal

---

## 1. Overview

LetMeScale is a content distribution and personal brand scaling service for operators, founders, and established business owners. This design covers the complete platform: a public marketing website, an application/intake funnel, an admin dashboard for managing leads and clients, and a client collaboration portal with content scheduling, DM management, and metrics.

**Brand identity:** BLACK (#000, #0a0a0a), RED (#DC2626, #EF4444), WHITE (#FFFFFF, #F5F5F5)
**Tagline:** "Attention Is Leverage. We Control Leverage."
**Tone:** Blunt, exclusive, premium, no-fluff. Not a content agency — a leverage control system.

---

## 2. Tech Stack

| Layer | Technology |
|-------|------------|
| **Monorepo** | Turborepo |
| **Framework** | Next.js 15 (App Router) |
| **Styling** | Tailwind CSS v4 |
| **Animation** | Framer Motion |
| **Database** | Drizzle ORM + SQLite (local, swap to Postgres later) |
| **Auth** | NextAuth.js (email/password + invite codes) |
| **Realtime** | Socket.io |
| **Language** | TypeScript throughout |
| **Deployment** | Local dev now, Vercel-ready |

---

## 3. Monorepo Structure

```
letmescale/
├── apps/
│   ├── marketing/              # Public site + application funnel
│   │   ├── app/
│   │   │   ├── (site)/         # Landing page sections
│   │   │   │   ├── page.tsx
│   │   │   │   └── layout.tsx
│   │   │   ├── apply/          # Multi-step application funnel
│   │   │   │   └── page.tsx
│   │   │   ├── results/        # Testimonial gallery (optional page)
│   │   │   │   └── page.tsx
│   │   │   └── layout.tsx
│   │   ├── components/         # Marketing-specific components
│   │   ├── public/
│   │   │   └── testimonials/   # Optimized proof asset images
│   │   └── next.config.ts
│   │
│   └── dashboard/              # Admin + client portal
│       ├── app/
│       │   ├── login/          # Auth page with dev quick-login
│       │   ├── admin/          # Admin dashboard
│       │   │   ├── page.tsx            # Overview
│       │   │   ├── leads/              # Application management
│       │   │   ├── clients/            # Client management
│       │   │   │   └── [id]/           # Client detail (tabs)
│       │   │   ├── team/               # Team management
│       │   │   └── settings/           # Platform settings
│       │   ├── portal/         # Client collaboration hub
│       │   │   ├── page.tsx            # Client home
│       │   │   ├── deliverables/       # Content deliverables
│       │   │   ├── metrics/            # Performance metrics
│       │   │   ├── accounts/           # Instagram accounts
│       │   │   ├── scheduling/         # Upload scheduling
│       │   │   ├── dm-center/          # ManyChat/DM hub
│       │   │   └── messages/           # Team messaging
│       │   └── layout.tsx
│       ├── components/
│       └── next.config.ts
│
├── packages/
│   ├── ui/                     # Shared design system
│   │   ├── components/
│   │   ├── theme/
│   │   └── animations/
│   ├── db/                     # Database layer
│   │   ├── schema/
│   │   ├── seed/
│   │   ├── migrations/
│   │   └── index.ts
│   ├── auth/                   # Shared auth
│   │   ├── providers/
│   │   ├── invite-codes/
│   │   └── roles.ts
│   └── config/                 # Shared types, constants, validation
│
├── turbo.json
├── package.json
└── tsconfig.json
```

---

## 4. Marketing Site — Page-by-Page Design

### 4.1 Landing Page (`/`)

Single-page scroll experience. All content derived from LETMESCALE.md. All proof assets from `letmescale_resources/Testimonials/` integrated.

#### Section 1: Hero (Above the Fold)
- Full-viewport dark section, subtle particle/grain animation background
- **Headline:** "We Turn Attention Into Control."
- **Subtext:** "Not views. Not followers. Not vanity metrics. **Control.**"
- **Body:** "If you already have an offer, a business, or revenue — we help you dominate distribution and turn attention into predictable upside. If you don't, this isn't for you."
- **Subline:** "LetMeScale operates behind the scenes for people who already understand money."
- **CTA:** "Request Access" button — red with glow pulse animation → navigates to `/apply`
- **VSL:** Adaptio VSL video as background element or floating card. Click opens fullscreen video modal.
- **Sticky nav:** Transparent → solid black on scroll. Links: What We Do | Results | Philosophy | "Request Access" button (always visible, red)
- **Scroll progress:** Thin red line at top of viewport
- **Animations:** Logo reveal on load, text stagger-in, parallax depth

#### Section 2: Disqualifier
- Red horizontal rule divider
- Lines appear sequentially on scroll with sharp cut animation:
  - "This is not a content agency."
  - "This is not a branding studio."
  - "This is not for beginners."
- Three qualification bullets (red check marks):
  - "Already make money"
  - "Already understand leverage"
  - "Already know attention is the highest ROI asset available"
- Closing: "We are not here to teach you why content matters. If you're here, you already know."

#### Section 3: What We Actually Do (3 Pillars)
Three cards with hover flip/expand effect:

1. **"We Engineer Distribution"**
   - Content repackaged for maximum exposure
   - Deployed with intent, not randomness
   - Compounds instead of spiking and dying
   - "Attention is treated like capital. Allocated, tested, scaled, and redeployed."

2. **"We Control Narrative at Scale"**
   - What people associate your name with
   - Why you're trusted
   - Why inbound interest feels inevitable
   - "Positioning done quietly — through repetition and signal, not branding language."

3. **"We Convert Attention Into Inbound Pressure"**
   - DMs, conversations, inbound interest, opportunities
   - "We manage that pressure so it doesn't leak."
   - "You don't chase. You respond."

- Red accent glow under active card. Cards expand on hover/tap to reveal full detail.

#### Section 4: Why This Works
Split layout:
- Left: "We sell **control**. Not output." / "Output is easy to buy. Leverage is not."
- Right — contrast list:
  - ~~Pretty edits~~ → strikethrough in red
  - ~~Brand vibes~~ → strikethrough in red
  - ~~Viral screenshots~~ → strikethrough in red
  - **Attention density** → glow in white
  - **Audience quality** → glow in white
  - **Downstream monetization power** → glow in white
- "That's why our clients don't look like creators. They look like operators with gravity."

#### Section 5: Results / Social Proof

**5a. Headline metrics bar** (animated counters, scroll-triggered):
| $83K+ in 6 days | 14.2M views in 90 days | $90K+ cash collected | 2.3M reach from 1 reel |

**5b. Case study carousel** — horizontal scroll with drag:

| Case Study | Proof Assets | Modal Content |
|-----------|--------------|---------------|
| **Trell — "$83K in 6 Days"** | `Trell 83K in 6 days/WhatsApp Image...jpeg` (hero), Before images (3), After images (3) | Revenue dashboard, before/after comparison, revenue chart |
| **Daniel — "14.2M Views in 90 Days"** | `Daniel/DecemberResult.jpeg` (hero), all 10 images | Monthly analytics, single reel reach (2.3M), audience demographics, reel insights |
| **Mark Shapiro — "$90K Cash Collected"** | `Mark Shapiro capital REV./` all 7 images | Sales dashboard, booked calls, conversion metrics, deal breakdown |
| **Chetha — "6.5M Views Generated"** | `Chetha/Results/IMG_9791.PNG` (hero), all analytics + 11 videos | Content rewards platform, Maaz results (3M views), video testimonials |

Each card: thumbnail screenshot, metric headline, "View Results →" link.
Click → **fullscreen case study modal** with image gallery (prev/next navigation, zoom), embedded video player for video testimonials, narrative text.

**5c. Disclaimer:** "We don't publish everything. People at this level don't need public proof — they ask better questions."

#### Section 6: How We Work
- Minimal, mysterious. Dark section with red accent.
- "We do not onboard everyone. We do not run generic processes. We do not explain internal execution publicly."
- Three steps with **blur-to-sharp** reveal animation:
  1. "Where your attention currently sits"
  2. "How monetization pressure is created"
  3. "How scale is maintained without dilution"
- "Details are discussed privately."

#### Section 7: Who This Is For
Two-column layout:

| FOR (white/red, ✓) | NOT FOR (dimmed, ✗) |
|---------------------|---------------------|
| Founders | Beginners |
| Operators | People "trying content" |
| High-ticket sellers | Anyone asking how long it takes |
| Investors | Anyone focused on views instead of leverage |
| Personal brands with real backend monetization | |

- "If you're counting followers, this isn't your room."
- Interactive: "For" items glow red on hover, "Not for" items fade further on hover.

#### Section 8: Philosophy
- Full-bleed centered section, large typography
- Typewriter/cascade reveal on scroll:
  - "Money follows leverage."
  - "Leverage follows attention."
  - "Attention follows distribution."
- "Most people never control distribution. They rent it."
- "We don't rent. We build machines that attract attention continuously and redirect it where it creates the most upside."

#### Section 9: Final CTA
- "If you're already making money and you want more control over how opportunity flows toward you —"
- "You don't need convincing. You need alignment."
- **"Request Access"** — large red button, glowing pulse animation → `/apply`
- Below: "We review selectively. Not everyone gets a response."

---

### 4.2 Application Page (`/apply`)

Dedicated, immersive multi-step form experience.

**Progress flow at top:** Horizontal stepper — Qualification → Details → Schedule → Confirm

**Step 1 — Qualification:**
- "Before we go further..."
- Card-select questions:
  - "Do you currently generate revenue?" → Yes / No (No → polite rejection screen)
  - "Monthly revenue range?" → $10K-50K / $50K-250K / $250K-1M / $1M+
  - "Which describes you?" → Founder / Operator / High-ticket seller / Investor / Personal brand
- Cards highlight red on select, smooth transitions

**Step 2 — Details:**
- Name, email, business name, website/social link
- "What's your primary goal with distribution?" (text area)
- "How did you hear about LetMeScale?" (dropdown)
- Red focus glow on fields, real-time validation

**Step 3 — Schedule:**
- Calendly embed (dark-themed) directly on page
- "Select a time that works. This isn't a sales call — it's an alignment check."

**Step 4 — Confirmation:**
- "We've received your application."
- "If there's alignment, you'll hear from us. If not, you won't."
- Clean, confident. No celebration. Red check mark animation.

---

### 4.3 Results Gallery (`/results`) — Optional

Full gallery of all proof assets. Masonry grid layout.
Filterable by: Revenue proof | View metrics | Before/After | Video testimonials
Each item opens detail modal with gallery navigation.

---

## 5. Dashboard App — Page-by-Page Design

### 5.1 Login (`/login`)

- Dark, minimal. LetMeScale logo centered.
- Email + password form
- "Have an invite code?" → expandable section revealing invite code field
- **Big green DEV LOGIN button** (bottom of page):
  - Opens dropdown/popup with seeded account cards
  - Each card: role badge + name + email
  - Accounts: Admin, Client (Trell), Client (Daniel), Editor, DM Setter, VA
  - Click → instant login as that role
- Green glow on dev button, popup slides up

---

### 5.2 Admin Dashboard (`/admin/*`)

Accessible via **Big Red ADMIN button** — visible from anywhere in dashboard for admin-role users.

#### `/admin` — Overview
- KPI cards: Total leads | Active clients | Pending applications | Revenue this month
- Recent applications table (name, revenue range, status badge, date)
- Quick actions: Review Applications | Manage Clients | Team
- Cards have hover-lift, table rows expandable inline

#### `/admin/leads` — Application Management
- Table: Name | Revenue range | Business type | Date | Status (New/Reviewed/Accepted/Rejected)
- Click row → **slide-out panel** from right with full application details
- Actions: Accept (generates & sends invite code) | Reject | Flag
- Search/filter bar, bulk actions, inline status dropdown

#### `/admin/clients` — Client Management
- Card grid of active clients
- Each card: Avatar, name, business, plan, assigned team, key metrics, status (active/paused)
- Click → client detail page

#### `/admin/clients/[id]` — Client Detail
Tabbed layout:
- **Overview:** Business info, revenue, onboarding date, notes (inline editable)
- **Team:** Assigned editors, DM setters, VAs. Drag-to-assign from team pool. Role badges.
- **Accounts:** Instagram accounts being managed. Metrics per account. Link to portal view.
- **Metrics:** Aggregated performance charts with date range picker
- **Activity:** Timeline of all actions, uploads, messages

#### `/admin/team` — Team Management
- Table: Name | Role | Assigned clients | Status | Last active
- Role filter tabs (All / Editors / DM Setters / VAs)
- **"Invite Team Member" button** → modal: name, email, role selector, generates invite code with copy button
- Click member → detail slide-out panel

#### `/admin/settings` — Platform Settings
- Collapsible sections:
  - Invite codes (generate, revoke, view usage history)
  - Integrations (ManyChat API key, Instagram app credentials — placeholders)
  - General (company info, notification preferences)
- Toggle switches, save confirmation toasts

---

### 5.3 Client Portal (`/portal/*`)

What clients see when logged in.

#### `/portal` — Client Home
- Welcome card with client name, account manager
- Quick stats: Total views this week | Scheduled posts | Pending approvals | Messages
- Stat cards with sparkline mini-charts
- Recent activity feed with timestamps and avatars

#### `/portal/deliverables` — Content Deliverables
- Grid of content pieces. Each card: thumbnail, title, status (Draft/In Review/Approved/Published), date
- Click → **content detail modal**: video preview, caption, scheduled date, approval buttons
- Client can: Approve | Request changes (with comment) | Download
- Filter by status/date, comment thread in slide-out panel

#### `/portal/metrics` — Performance Metrics
- Per-account dashboard view
- Metrics: Views, Reach, Engagement rate, Follower growth, Top performing content
- Charts (line, bar) with hover tooltips
- Date range picker, comparison mode (this week vs last week)
- Account switcher dropdown, export button (mock)

#### `/portal/accounts` — Managed Accounts
- List of Instagram accounts under management
- Per account: Profile preview, follower count, recent performance, assigned editor
- Click → account detail page with full metrics + content history
- Status indicators (trending up/down performance badges)

#### `/portal/scheduling` — Upload Scheduling
- Calendar view (week/month toggle) with scheduled + published content
- Drag-and-drop content onto calendar slots
- Content types: Trial reel | Normal reel | Story
- Click slot → **scheduling modal**: content selector, caption, time, account selector, Trial/Normal toggle
- "Promote trial reel" → confirmation modal
- Full calendar component with drag-and-drop, time picker, preview

#### `/portal/dm-center` — DM Management Hub (ManyChat scaffold)
- Unified inbox across managed accounts
- Split layout: Conversation list (left) + Message thread (right)
- Account filter at top
- ManyChat automation badges on auto-responses
- Quick reply templates dropdown
- Conversation search, account multi-select
- Mock real-time updates via websocket

#### `/portal/messages` — Team Messages
- Internal messaging between client and LetMeScale team
- Thread-based conversation UI
- File sharing (drag-to-upload, inline preview)
- Chat-style UI with typing indicators (mock), @ mentions

---

## 6. Shared Packages

### 6.1 `packages/ui` — Design System

**Theme tokens:**
- Background: #000000, #0A0A0A, #111111
- Primary (Red): #DC2626, #EF4444, #FCA5A5
- Text: #FFFFFF, #F5F5F5, #A3A3A3
- Accent: Red glow (`0 0 20px rgba(220, 38, 38, 0.5)`)
- Surface: rgba(255,255,255,0.05) with backdrop blur (glassmorphic)

**Components:**
- Button (solid red, outlined, ghost, dev-green)
- Card (dark glass, hover-lift, expandable)
- Modal (slide-in-right, centered, fullscreen gallery)
- Form inputs (dark theme, red focus glow, validation states)
- Table (dark, expandable rows, sortable, filterable)
- Badge (status colors, role colors)
- Avatar (with status indicator)
- Progress stepper (horizontal, red active state)
- Tabs (underline style, red active)
- Calendar (dark themed, drag-and-drop slots)
- Chart wrappers (for metrics — line, bar, sparkline)
- Toast notifications (dark with colored accent)
- Dropdown/Popup (for dev login, quick actions)

**Framer Motion animation presets:**
- `fadeIn`, `slideInRight`, `slideInUp`
- `staggerChildren` (for lists/grids)
- `countUp` (for metric numbers)
- `blurReveal` (for "How We Work" section)
- `typewriter` (for Philosophy section)
- `strikethrough` (for "Why This Works" contrast)
- `glowPulse` (for CTA buttons)

### 6.2 `packages/db` — Database

**Drizzle ORM + SQLite** (file-based, local)

**Schema tables:**
- `users` (id, email, password_hash, name, role, avatar_url, created_at, last_login)
- `invite_codes` (id, code, role, created_by, used_by, expires_at, created_at)
- `applications` (id, name, email, business_name, website, revenue_range, business_type, goal, referral_source, status, calendly_event_id, created_at)
- `clients` (id, user_id, business_name, plan, status, onboarded_at, notes)
- `team_assignments` (id, team_member_id, client_id, role, assigned_at)
- `instagram_accounts` (id, client_id, username, profile_url, follower_count, status)
- `content_pieces` (id, client_id, account_id, title, type, caption, media_url, status, scheduled_at, published_at, created_by)
- `schedules` (id, content_id, account_id, scheduled_at, type, status)
- `messages` (id, thread_id, sender_id, content, attachments, created_at)
- `message_threads` (id, client_id, subject, participants, created_at)
- `dm_conversations` (id, account_id, contact_name, platform, is_automated, last_message_at)
- `dm_messages` (id, conversation_id, direction, content, is_automated, created_at)
- `metrics_snapshots` (id, account_id, date, views, reach, engagement_rate, follower_count, top_content_id)

**Seed data:**
- Admin account: admin@letmescale.com
- Client accounts: Trell (trell@test.com), Daniel (daniel@test.com), Mark Shapiro (mark@test.com), Chetha (chetha@test.com)
- Team accounts: editor@test.com (Editor), dmsetter@test.com (DM Setter), va@test.com (VA)
- Mock Instagram accounts per client with realistic metrics matching the real proof assets
- Mock content pieces, schedules, messages, DM conversations
- Mock metrics data reflecting the real numbers (14.2M views, $83K revenue, etc.)

### 6.3 `packages/auth` — Authentication

- NextAuth.js credentials provider
- Role enum: `ADMIN | CLIENT | EDITOR | DM_SETTER | VA`
- Invite code validation (check code exists, not expired, not used → create user with assigned role)
- Role-based route protection middleware
- Dev quick-login bypass (NODE_ENV === 'development' only)

### 6.4 `packages/config` — Shared Configuration

- TypeScript types and interfaces
- Zod validation schemas
- Role permission matrix (which roles can access which routes/actions)
- Status enums (application statuses, content statuses, etc.)
- Environment variable validation

---

## 7. Proof Assets — Integration Plan

All real testimonial assets from `letmescale_resources/Testimonials/` will be:
1. Copied to `apps/marketing/public/testimonials/` with optimized filenames
2. Images optimized (WebP conversion, responsive sizes via Next.js Image)
3. Videos hosted locally with lazy-loading
4. Organized by client for the case study carousel and modals

**Asset mapping:**

| Client | Files | Placement |
|--------|-------|-----------|
| Trell — $83K | 1 revenue screenshot | Hero metrics bar, case study card |
| Trell — Before (3) | 3 before-state dashboards | Case study modal (before/after comparison) |
| Trell — After (3) | 3 after-state dashboards | Case study modal (before/after comparison) |
| Daniel (10) | Analytics screenshots | Case study card + modal gallery |
| Mark Shapiro (7) | Sales dashboards | Case study card + modal gallery |
| Chetha — Main (3 videos) | Video testimonials | Case study modal video section |
| Chetha — Results (11 images) | Analytics screenshots | Case study modal gallery |
| Chetha — Results/New (4 images) | Recent analytics | Case study modal gallery |
| Chetha — Maaz (8 images, 9 videos) | Analytics + video demos | Case study modal gallery + video section |

**VSL video** (`Adaptio - VSL.mp4`, 775MB): Will need to be hosted externally (too large for static serving) or compressed. For local dev, serve from public directory with lazy loading.

---

## 8. Design Reference Sites

Inspiration drawn from (per client instruction "steal these for inspo"):

| Site | What to Take |
|------|-------------|
| **theroimedia.com** | Dark + gradient aesthetic, glassmorphic elements, clean scroll experience, Framer-quality animations |
| **puppetsmaster.com** | Dark luxury feel, premium positioning, gold → replace with RED accent |
| **clippingstars.com** | Results-heavy layout, metric showcasing, "Apply Now" selective CTAs, client logos/proof organization |

**LetMeScale differentiation:** More blunt/aggressive tone, no gold/purple — strictly BLACK/RED/WHITE, even more exclusive positioning, less "agency" more "system".

---

## 9. Key Design Decisions

1. **Monorepo over monolith** — Client chose Turborepo for clean separation and long-term scalability
2. **SQLite for V1** — Local, file-based, zero setup. Drizzle ORM ensures painless migration to Postgres later
3. **Mock data for integrations** — Instagram/ManyChat UI fully built but with seeded/mock data. Real API connections come later
4. **Dev quick-login** — Green button on login page for fast role switching during development
5. **Admin access** — Big red ADMIN button visible to admin-role users from anywhere in dashboard
6. **No public sign-up** — Invite-code-only access. Matches the exclusive brand positioning
7. **Application funnel qualification** — Step 1 filters out non-revenue businesses immediately

#letmescale #plans #archive
