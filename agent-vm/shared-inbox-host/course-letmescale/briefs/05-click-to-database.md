# Module 5: From Click to Database

## Teaching Arc
**Metaphor:** Airport security. When you click "Request Access," your application goes through checkpoints. First checkpoint: the qualification questions (are you already making money?). Second: the contact form. Third: the API route validates your data with Zod (like a scanner checking your passport). Fourth: the database stores your application (like the airline's system recording your booking). If you fail any checkpoint, you're turned away with a clear message.

**Opening hook:** "You click 'Request Access' and a dark modal slides in. Two questions. A form. Submit. Behind that simple experience is a full-stack pipeline: React state machines, context providers, API routes, input validation, and database writes. Let's trace every step from click to stored row."

**Key insight:** Every form on every website follows this pattern: UI state management → validation → API call → server-side validation → database write → response. Understanding this pipeline lets you debug any form issue ("Is the problem in the frontend state? The validation? The API? The database?") and gives you the vocabulary to describe it precisely to AI.

## Screens (6)

### Screen 1: "The Modal Opens — React Context"
Code↔English of the context provider:

```typescript
// From: apps/landing/components/apply-modal.tsx (lines 14-41)
interface ApplyModalContextValue {
  openApplyModal: () => void;
  closeApplyModal: () => void;
}

const ApplyModalContext = createContext<ApplyModalContextValue | null>(null);

export function useApplyModal() {
  const ctx = useContext(ApplyModalContext);
  if (!ctx) throw new Error("useApplyModal must be used within ApplyModalProvider");
  return ctx;
}

export function ApplyModalProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const openApplyModal = useCallback(() => setIsOpen(true), []);
  const closeApplyModal = useCallback(() => setIsOpen(false), []);

  return (
    <ApplyModalContext.Provider value={{ openApplyModal, closeApplyModal }}>
      {children}
      <ApplyModal isOpen={isOpen} onClose={closeApplyModal} />
    </ApplyModalContext.Provider>
  );
}
```

English: "The ApplyModalProvider wraps the entire app (set up in layout.tsx). It holds one piece of state: is the modal open or closed? Any component anywhere on the site can call openApplyModal() through the useApplyModal hook — the Nav button, the hero CTA, any future button. They don't need to know about the modal's internals; they just call the function and it appears."

### Screen 2: "The State Machine — Questions → Contact → Result"
Code↔English of the step flow:

```typescript
// From: apps/landing/components/apply-modal.tsx (lines 45-81)
type Step = "questions" | "contact" | "success" | "rejected";

function ApplyModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [step, setStep] = useState<Step>("questions");
  const [q1, setQ1] = useState<boolean | null>(null);
  const [q2, setQ2] = useState<boolean | null>(null);

  const handleQ1 = (answer: boolean) => {
    setQ1(answer);
    if (!answer) setStep("rejected");
  };

  const handleQ2 = (answer: boolean) => {
    setQ2(answer);
    if (!answer) setStep("rejected");
    else setStep("contact");
  };
```

English: "A four-step state machine. Start at 'questions.' Q1: 'Do you currently generate revenue?' If no → rejected. If yes → show Q2: 'Do you want more money?' If no → rejected. If yes → advance to 'contact' step. This is deliberate disqualification — LetMeScale only wants revenue-generating clients, and the modal enforces that before collecting any contact info."

**Interactive element:** MESSAGE FLOW ANIMATION
Actors: User, Modal UI, React State, API Route, Database
Steps:
1. User clicks "Request Access" → Modal UI appears (isOpen: true)
2. Modal UI shows Q1 → User answers "Yes" → React State updates (q1: true)
3. Modal UI shows Q2 → User answers "Yes" → React State updates (step: "contact")
4. User fills form, clicks Submit → Modal UI sends fetch POST to /api/apply
5. API Route validates with Zod schema → passes
6. API Route inserts into Database → returns ID
7. Database confirms → API Route sends 201 response
8. Modal UI receives success → React State updates (step: "success")

### Screen 3: "The API Route — Server-Side Validation"
Code↔English:

```typescript
// From: apps/landing/app/api/apply/route.ts (lines 1-52)
import { NextRequest, NextResponse } from "next/server";
import { db, applications } from "@letmescale/db";
import { applicationSchema } from "@letmescale/config";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const parsed = applicationSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid data", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const data = parsed.data;

    if (!data.generatesRevenue) {
      return NextResponse.json(
        { error: "This service is for revenue-generating businesses only." },
        { status: 400 }
      );
    }

    const result = db
      .insert(applications)
      .values({
        name: data.name,
        email: data.email,
        businessName: data.businessName,
        website: data.website || null,
        revenueRange: data.revenueRange,
        businessType: data.businessType,
        goal: data.goal,
        referralSource: data.referralSource || null,
      })
      .returning()
      .get();

    return NextResponse.json(
      { success: true, id: result.id },
      { status: 201 }
    );
  } catch (err) {
    console.error("Application submission error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
```

English: "This is the server-side handler. Step 1: Parse the incoming JSON body. Step 2: Validate it against a Zod schema (applicationSchema from the config package) — if invalid, return 400 with specific field errors. Step 3: Double-check the revenue qualification server-side (never trust the client). Step 4: Insert into the database using Drizzle ORM. Step 5: Return the new application ID with a 201 status. The try/catch wraps everything — if anything unexpected fails, return a generic 500 error."

**Callout box (aha!):** "Notice the double validation: the modal already checked qualification questions in the browser, but the API checks AGAIN server-side. This is the #1 security rule in web development — never trust the client. Someone could skip the modal entirely and send a POST request directly. The server must always validate independently."

### Screen 4: "The Database Schema"
Code↔English:

```typescript
// From: packages/db/src/schema.ts (lines 36-55)
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
```

English: "This defines the applications table in SQLite. Each field maps to a column. notNull() means the field is required — the database will reject any insert without it. The status field has five possible values and defaults to 'new.' createdAt auto-fills with the current timestamp. website and referralSource don't have notNull() — they are optional. This is Drizzle ORM — it lets you define database tables in TypeScript instead of raw SQL."

Show a few other tables briefly to illustrate the full system:
```typescript
// From: packages/db/src/schema.ts (lines 58-74)
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
});
```

English: "Once an application is accepted, they become a client. The clients table links to users via userId with a foreign key reference. Status tracks their lifecycle: active, paused, or churned. This is how the application pipeline flows: applications table → review → accepted → clients table."

### Screen 5: GROUP CHAT ANIMATION — "The Full Pipeline Conversation"
Actors: CTA Button (B), React State (R), Fetch API (F), API Route (A), Zod Validator (Z), Drizzle ORM (D)

Messages:
1. B: "User clicked me! Opening the apply modal."
2. R: "Got it. Setting isOpen to true, starting at step 'questions'."
3. R: "User passed both qualification questions. Moving to step 'contact'."
4. R: "Form submitted with name, email, phone. Calling fetch POST to /api/apply."
5. F: "Sending the JSON payload to the server..."
6. A: "Received the request. Let me validate this data first."
7. Z: "Checking... email format valid, business name present, revenue range set. All clear."
8. A: "Validation passed. Now let me check — do they generate revenue? Yes. Inserting into database."
9. D: "Row inserted! Application ID: 42. Returning the result."
10. A: "Sending back { success: true, id: 42 } with status 201."
11. F: "Server responded with success! Passing back to React."
12. R: "Setting step to 'success'. Showing the confirmation screen."

### Screen 6: Quiz
3 questions:
1. "A user reports that the apply modal opens but nothing happens when they click Submit. Where would you look first to debug this?" (Answer: The browser's Network tab — check if the POST request to /api/apply is being sent and what response comes back. If no request fires, the issue is in the frontend form handler. If the request fails, check the API route.)
2. "The API route validates with Zod even though the modal already checks qualification. Someone says 'that is redundant, remove the server check.' Why is this wrong?" (Answer: Never trust the client. Someone could bypass the modal and send a POST request directly via curl or a script. Server-side validation is the real security boundary — client-side is just UX convenience.)
3. "You want to add an 'industry' field to the application form. What files would you need to change?" (Answer: At minimum three: the Zod schema in packages/config (add the field), the database schema in packages/db/src/schema.ts (add the column), and the API route to include it in the insert. Plus the modal UI to add the input field.)

## Previous Module: "Engineering the Cinematic Feel" — animations and canvas
## Next Module: None (this is the final module)
