import { disputes, type DisputeCase } from "@/lib/admin/data";

export type DisputeStepStatus = "complete" | "current" | "upcoming";

export type DisputeMetric = {
  label: string;
  value: string;
  note: string;
};

export type DisputeParticipant = {
  role: string;
  name: string;
  stance: string;
  nextResponse: string;
};

export type DisputeEvidence = {
  title: string;
  detail: string;
  source: string;
};

export type DisputeStep = {
  label: string;
  owner: string;
  eta: string;
  status: DisputeStepStatus;
  detail: string;
};

export type DisputeResolutionPath = {
  title: string;
  payout: string;
  risk: string;
  rationale: string;
  recommended?: boolean;
};

export type DisputeCaseDetail = DisputeCase & {
  summary: string;
  engagement: {
    id: string;
    role: string;
    period: string;
    rate: string;
    timezone: string;
  };
  policyStatus: string;
  serviceWindow: string;
  metrics: DisputeMetric[];
  participants: DisputeParticipant[];
  evidence: DisputeEvidence[];
  steps: DisputeStep[];
  nextActions: string[];
  resolutionPaths: DisputeResolutionPath[];
};

type DisputeSupplement = Omit<
  DisputeCaseDetail,
  | "id"
  | "severity"
  | "client"
  | "talent"
  | "issue"
  | "amountAtRisk"
  | "openedAt"
  | "nextCheckpoint"
  | "owner"
  | "updates"
>;

const disputeSupplements: Record<string, DisputeSupplement> = {
  "DC-017": {
    summary:
      "Prep and launch coverage were logged before a client handoff. The client wants four hours shifted to next week, while the talent is asking for same-cycle payout on deadline support work.",
    engagement: {
      id: "ENG-204",
      role: "Executive assistant / launch coordination",
      period: "Week of Apr 20",
      rate: "$40/hr",
      timezone: "ET overlap",
    },
    policyStatus: "Needs operator ruling before payout lock",
    serviceWindow: "Same-day resolution target",
    metrics: [
      {
        label: "Hours claimed",
        value: "22 hrs",
        note: "Submitted on TS-00017",
      },
      {
        label: "Hours approved",
        value: "18 hrs",
        note: "Client accepted live support only",
      },
      {
        label: "Rate basis",
        value: "$40/hr",
        note: "$960 disputed value",
      },
      {
        label: "Payout lock",
        value: "2:30 PM ET",
        note: "Finance needs a final instruction",
      },
    ],
    participants: [
      {
        role: "Client lead",
        name: "Cedar Health Co-op",
        stance: "Wants four prep hours moved to the following weekly cycle after launch attribution review.",
        nextResponse: "11:30 AM ET",
      },
      {
        role: "Talent",
        name: "Nia Thompson",
        stance: "Argues prep work was requested before deadline and directly enabled the launch window.",
        nextResponse: "Ready now",
      },
      {
        role: "Internal owner",
        name: "Case desk",
        stance: "Leaning toward split treatment to protect payout while preserving client trust.",
        nextResponse: "Before finance packet",
      },
    ],
    evidence: [
      {
        title: "Launch prep notes",
        detail: "Task log shows inbox cleanup, calendar triage, and launch checklist prep completed before the live handoff.",
        source: "Talent notes attachment",
      },
      {
        title: "Client approval comment",
        detail: "Client approved 18 hours and marked four hours as post-launch follow-up that should move into the next billing period.",
        source: "Timesheet approval thread",
      },
      {
        title: "Slack deadline thread",
        detail: "Internal transcript confirms the prep work was used to hit the Monday morning launch cutoff.",
        source: "Ops escalation thread",
      },
    ],
    steps: [
      {
        label: "Intake triage",
        owner: "Case desk",
        eta: "Completed",
        status: "complete",
        detail: "Evidence bundle assembled and dispute severity raised to critical because finance freeze is today.",
      },
      {
        label: "Human ruling",
        owner: "Maya Chen",
        eta: "Due by 11:30 AM ET",
        status: "current",
        detail: "Decide whether to approve all 22 hours, split the disputed block, or defer four hours into next cycle.",
      },
      {
        label: "Finance instruction",
        owner: "RevOps",
        eta: "2:30 PM ET",
        status: "upcoming",
        detail: "Push a payout note so payroll and invoice copy stay aligned once the ruling is final.",
      },
    ],
    nextActions: [
      "Confirm whether the client explicitly requested pre-launch prep inside the original scope note.",
      "Lock the operator ruling before the 2:30 PM ET finance packet freeze.",
      "Send mirrored resolution copy to client and talent to avoid a second escalation cycle.",
    ],
    resolutionPaths: [
      {
        title: "Approve 20 hours now, move 2 hours forward",
        payout: "$800 this cycle, $80 next cycle",
        risk: "Low client friction, moderate talent disappointment",
        rationale: "Matches the current operator recommendation and acknowledges that some prep work directly supported the launch deadline.",
        recommended: true,
      },
      {
        title: "Approve all 22 hours this cycle",
        payout: "$880 this cycle",
        risk: "Higher client pushback if they believe prep was out of scope",
        rationale: "Best if the original request clearly included launch prep and calendar cleanup before go-live.",
      },
      {
        title: "Hold four hours until next cycle",
        payout: "$720 now, $160 next cycle",
        risk: "Highest talent trust risk and likely follow-up appeal",
        rationale: "Only viable if the client can show the prep block was expressly excluded from same-cycle billing.",
      },
    ],
  },
  "DC-014": {
    summary:
      "The work itself is approved in principle, but leadership sign-off stalled the billing handoff. The risk is aging invoice value rather than disputed labor quality.",
    engagement: {
      id: "ENG-188",
      role: "AI support QA specialist",
      period: "Apr 14 to Apr 20",
      rate: "$58/hr",
      timezone: "CET / ET overlap",
    },
    policyStatus: "Waiting on client-side approval confirmation",
    serviceWindow: "48-hour approval SLA breached",
    metrics: [
      {
        label: "Hours pending",
        value: "43.4 hrs",
        note: "QA batch already delivered",
      },
      {
        label: "Invoice value",
        value: "$2,520",
        note: "Ready once approval lands",
      },
      {
        label: "SLA breach",
        value: "18 hrs",
        note: "Past target window",
      },
      {
        label: "Escalation window",
        value: "2:00 PM ET",
        note: "Next leadership follow-up",
      },
    ],
    participants: [
      {
        role: "Client ops",
        name: "Lumen AI",
        stance: "Says the batch looks good but wants leadership confirmation before releasing approval.",
        nextResponse: "2:00 PM ET",
      },
      {
        role: "Talent",
        name: "Jakob Lindqvist",
        stance: "Primarily wants visibility into when the approved work will move into invoicing.",
        nextResponse: "Asynchronously",
      },
      {
        role: "Internal owner",
        name: "Maya Chen",
        stance: "Monitoring for escalation and prepared to call if the follow-up email stalls again.",
        nextResponse: "1:30 PM ET",
      },
    ],
    evidence: [
      {
        title: "Delivery confirmation",
        detail: "QA batch and rubric notes were delivered on time with no reported defects.",
        source: "Submission record",
      },
      {
        title: "Client acknowledgment",
        detail: "Operations contact replied that sign-off will come after a leadership sync later today.",
        source: "Email follow-up",
      },
      {
        title: "SLA monitor",
        detail: "The approval timer crossed the 48-hour threshold and triggered the dispute desk aging alert.",
        source: "Admin queue monitor",
      },
    ],
    steps: [
      {
        label: "Aging alert",
        owner: "System",
        eta: "Completed",
        status: "complete",
        detail: "The case auto-routed into disputes when approval lag crossed the configured threshold.",
      },
      {
        label: "Client confirmation chase",
        owner: "Maya Chen",
        eta: "Due by 2:00 PM ET",
        status: "current",
        detail: "Hold the invoice in ready state while waiting for client leadership to confirm sign-off.",
      },
      {
        label: "Escalate or clear",
        owner: "Case desk",
        eta: "After 2:00 PM ET",
        status: "upcoming",
        detail: "If approval still stalls, move to phone escalation and add a finance hold note for the daily packet.",
      },
    ],
    nextActions: [
      "Check the 2:00 PM ET leadership sync outcome before triggering a higher-touch escalation.",
      "Prepare a finance note that keeps the invoice in ready state instead of disputing labor quality.",
      "Send Jakob a same-day status note if client confirmation slips again.",
    ],
    resolutionPaths: [
      {
        title: "Clear immediately after leadership sign-off",
        payout: "$2,520 invoiced this cycle",
        risk: "Lowest risk if client confirms today",
        rationale: "Preferred path because the work quality is not in dispute and only approval timing is blocked.",
        recommended: true,
      },
      {
        title: "Escalate to live approval call",
        payout: "$2,520 invoiced after verbal sign-off",
        risk: "Adds client friction but preserves same-cycle billing",
        rationale: "Use if the email thread stalls beyond the stated sync time and the invoice must land today.",
      },
      {
        title: "Carry invoice into next cycle",
        payout: "$0 this cycle, full amount next cycle",
        risk: "Creates avoidable aging and talent trust issues",
        rationale: "Only use if the client cannot provide any approver today.",
      },
    ],
  },
};

export function getAdminDisputeCase(caseId: string) {
  const dispute = disputes.find((entry) => entry.id === caseId);
  const supplement = disputeSupplements[caseId];

  if (!dispute || !supplement) {
    return null;
  }

  return {
    ...dispute,
    ...supplement,
  } satisfies DisputeCaseDetail;
}

export function getAdminDisputeCaseIds() {
  return Object.keys(disputeSupplements);
}

