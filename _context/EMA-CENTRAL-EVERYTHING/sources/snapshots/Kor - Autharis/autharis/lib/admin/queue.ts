import {
  activationQueue,
  disputes,
  matchReviewRuns,
  rosterMembers,
  type ActivationQueueItem,
} from "@/lib/admin/data";

export type QueueStepStatus = "complete" | "current" | "upcoming";

export type QueueMetric = {
  label: string;
  value: string;
  note: string;
};

export type QueueStakeholder = {
  role: string;
  name: string;
  detail: string;
  responseWindow: string;
};

export type QueueEvidence = {
  title: string;
  detail: string;
  source: string;
};

export type QueueStep = {
  label: string;
  owner: string;
  timing: string;
  status: QueueStepStatus;
  detail: string;
};

export type QueueDecisionPath = {
  title: string;
  outcome: string;
  risk: string;
  rationale: string;
  recommended?: boolean;
};

export type QueueRelatedRecord = {
  label: string;
  value: string;
  href?: string;
};

export type QueueActivity = {
  label: string;
  detail: string;
  at: string;
};

export type ActivationQueueDetail = ActivationQueueItem & {
  subject: {
    name: string;
    initials: string;
    role: string;
    coverage: string;
    status: string;
  };
  reviewLead: string;
  reviewWindow: string;
  operatorBrief: string;
  recommendedCall: string;
  policyNote: string;
  metrics: QueueMetric[];
  stakeholders: QueueStakeholder[];
  evidence: QueueEvidence[];
  timeline: QueueStep[];
  decisionPaths: QueueDecisionPath[];
  relatedRecords: QueueRelatedRecord[];
  nextMoves: string[];
  activity: QueueActivity[];
};

type QueueSupplement = Omit<
  ActivationQueueDetail,
  "id" | "category" | "priority" | "title" | "summary" | "owner" | "receivedAt" | "sla" | "status"
>;

const miguel = rosterMembers.find((member) => member.name === "Miguel Alvarez");
const overflowRun = matchReviewRuns.find((run) => run.id === "MR-880");
const launchDispute = disputes.find((caseItem) => caseItem.id === "DC-017");

const queueSupplements: Record<string, QueueSupplement> = {
  "AQ-1042": {
    subject: {
      name: miguel?.name ?? "Miguel Alvarez",
      initials: miguel?.initials ?? "MA",
      role: miguel?.title ?? "Outbound SDR support",
      coverage: `${miguel?.region ?? "ART / Buenos Aires"} · ${miguel?.hoursAvailable ?? "20 hrs / week"}`,
      status: miguel?.blocker ?? "Pending final activation review",
    },
    reviewLead: "Maya Chen",
    reviewWindow: "Decision hold expires at 9:00 AM ET",
    operatorBrief:
      "Identity and resume parsing are already clear. The blocking issue is that Miguel's references describe a short AE transition that does not appear in the current profile draft, so finance-adjacent requests are still gated behind human sign-off.",
    recommendedCall: "Approve activation after a live reference callback confirms the title sequence and CRM scope.",
    policyNote: "Activation stays manual whenever references and resume chronology disagree on title history.",
    metrics: [
      {
        label: "Audit score",
        value: `${miguel?.auditScore ?? 76}`,
        note: "Current roster calibration score",
      },
      {
        label: "Open discrepancy",
        value: "2 title notes",
        note: "Reference wording conflicts with resume summary",
      },
      {
        label: "Coverage",
        value: miguel?.hoursAvailable ?? "20 hrs / week",
        note: "Enough capacity for the next outbound release",
      },
      {
        label: "Queue age",
        value: "1 hr 13 min",
        note: "Still inside the activation target window",
      },
    ],
    stakeholders: [
      {
        role: "Talent",
        name: miguel?.name ?? "Miguel Alvarez",
        detail: "Confirmed the AE experiment was temporary and wants the profile published with outbound-specialist positioning.",
        responseWindow: "Available now",
      },
      {
        role: "Ops desk",
        name: "Activation queue",
        detail: "Needs a final operator instruction before the candidate can flow into finance-heavy briefs.",
        responseWindow: "Before 9:00 AM ET",
      },
      {
        role: "Matching partner",
        name: "Jordan Lee",
        detail: "Has a founder-support benchmark run waiting on activation clearance for comparison only.",
        responseWindow: "Asynchronous",
      },
    ],
    evidence: [
      {
        title: "Identity verification",
        detail: "Government ID and compliance screens passed with no issues.",
        source: "Activation intake packet",
      },
      {
        title: "Resume chronology",
        detail: "Current draft positions Miguel as outbound SDR support with no formal AE interval listed.",
        source: "Resume parser output",
      },
      {
        title: "Reference callback notes",
        detail: "Two references mentioned a short AE-style pilot before Miguel returned to SDR-heavy work.",
        source: "Ops desk call log",
      },
    ],
    timeline: [
      {
        label: "Automated checks",
        owner: "System",
        timing: "Completed",
        status: "complete",
        detail: "Identity, location, and sanctions screens all cleared on first pass.",
      },
      {
        label: "Reference reconciliation",
        owner: "Maya Chen",
        timing: "Current",
        status: "current",
        detail: "Confirm whether the AE mention reflects title inflation or a legitimate short-term scope shift.",
      },
      {
        label: "Profile publish",
        owner: "Launch pod",
        timing: "Next",
        status: "upcoming",
        detail: "Release the profile into outbound and finance-heavy pools once the operator ruling is logged.",
      },
    ],
    decisionPaths: [
      {
        title: "Approve after live callback",
        outcome: "Publish today with no role restrictions",
        risk: "Low, if the callback confirms the short AE interval and CRM depth.",
        rationale: "Fastest clean path because all other controls have already passed and the mismatch appears explainable.",
        recommended: true,
      },
      {
        title: "Publish with finance-heavy hold",
        outcome: "Allow general outbound briefs only",
        risk: "Lower compliance risk, but matching loses flexibility for premium requests.",
        rationale: "Useful if the callback is delayed but the team still wants Miguel searchable for lower-risk work.",
      },
      {
        title: "Hold activation",
        outcome: "Keep the profile out of circulation",
        risk: "Highest supply loss and likely unnecessary queue churn.",
        rationale: "Only worth taking if the references cannot support the stated experience at all.",
      },
    ],
    relatedRecords: [
      {
        label: "Roster profile",
        value: `${miguel?.id ?? "TR-209"} · ${miguel?.name ?? "Miguel Alvarez"}`,
        href: "/admin/roster",
      },
      {
        label: "Benchmark run",
        value: "MR-874 · Founder EA coverage",
        href: "/admin/matching",
      },
      {
        label: "Queue owner",
        value: "Ops desk",
      },
    ],
    nextMoves: [
      "Call the highest-signal reference and confirm the title sequence on the profile draft.",
      "If the callback lands cleanly, publish Miguel before the 11 AM queue sweep.",
      "Mirror the final instruction into matching so benchmark runs stop treating activation as blocked.",
    ],
    activity: [
      {
        label: "Queue intake",
        detail: "Activation routed into manual review after reference wording disagreed with the current role history.",
        at: "8:12 AM ET",
      },
      {
        label: "Roster context pulled",
        detail: "Existing roster notes confirmed Miguel is already in ramp status with capacity this week.",
        at: "8:24 AM ET",
      },
      {
        label: "Operator recommendation",
        detail: "Prep a publish-ready decision once the live reference callback lands.",
        at: "8:37 AM ET",
      },
    ],
  },
  "AQ-1041": {
    subject: {
      name: overflowRun?.client ?? "Lumen AI",
      initials: "LA",
      role: overflowRun?.requestTitle ?? "AI support review - overflow QA",
      coverage: `${overflowRun?.candidateCount ?? 3} finalists · ${overflowRun?.stage ?? "Client-ready shortlist"}`,
      status: overflowRun?.recommendedAction ?? "Needs approval",
    },
    reviewLead: overflowRun?.reviewer ?? "Maya Chen",
    reviewWindow: "Client send is blocked until 10:15 AM ET",
    operatorBrief:
      "The shortlist is strong, but one finalist has weaker ET overlap than the client requested. This drilldown packages the human release decision so the team can either send now or swap the lower-overlap candidate before client delivery.",
    recommendedCall: "Approve Jakob and Daniel now, then re-benchmark Priya if the client needs a third finalist with better ET overlap.",
    policyNote: "Enterprise shortlist packets require human release before they can be shared with the client.",
    metrics: [
      {
        label: "Finalists",
        value: `${overflowRun?.candidateCount ?? 3}`,
        note: "Human review requested on the top batch",
      },
      {
        label: "Top score",
        value: "92",
        note: "Jakob remains the strongest QA fit",
      },
      {
        label: "Timezone risk",
        value: "1 candidate",
        note: "Priya needs overlap follow-up",
      },
      {
        label: "Queue age",
        value: "2 hrs 41 min",
        note: "Still inside the two-hour matching escalations window",
      },
    ],
    stakeholders: [
      {
        role: "Client",
        name: overflowRun?.client ?? "Lumen AI",
        detail: "Needs a clean shortlist packet before the team's overflow review block begins late morning.",
        responseWindow: "10:15 AM ET",
      },
      {
        role: "Reviewer",
        name: overflowRun?.reviewer ?? "Maya Chen",
        detail: "Wants human confirmation on timezone overlap before the shortlist leaves the admin console.",
        responseWindow: "Now",
      },
      {
        role: "Talent ops",
        name: "Matching desk",
        detail: "Prepared to swap a candidate if the client insists on deeper ET overlap.",
        responseWindow: "Asynchronous",
      },
    ],
    evidence: [
      {
        title: "Autogenerated fit summary",
        detail: overflowRun?.fitSummary ?? "Three strong finalists surfaced with one overlap concern.",
        source: overflowRun?.id ?? "MR-880",
      },
      {
        title: "Recommended action",
        detail:
          overflowRun?.recommendedAction ??
          "Approve Jakob and Daniel, hold Priya for timezone mismatch follow-up.",
        source: "Matching review output",
      },
      {
        title: "Coverage read",
        detail: "Two finalists can work in the client's preferred window immediately; the third needs explicit overlap confirmation.",
        source: "Operator notes",
      },
    ],
    timeline: [
      {
        label: "Model shortlist",
        owner: "Matching engine",
        timing: "Completed",
        status: "complete",
        detail: "Scoring and QA notes were generated for the top batch before the desk opened.",
      },
      {
        label: "Human release",
        owner: overflowRun?.reviewer ?? "Maya Chen",
        timing: "Current",
        status: "current",
        detail: "Decide whether to ship the current top two now or hold the packet for a third-candidate swap.",
      },
      {
        label: "Client packet send",
        owner: "Matching desk",
        timing: "Next",
        status: "upcoming",
        detail: "Send the shortlist with operator notes once the release instruction is finalized.",
      },
    ],
    decisionPaths: [
      {
        title: "Release top two now",
        outcome: "Client gets the strongest ET-ready candidates immediately",
        risk: "Medium if the client expected a three-person packet.",
        rationale: "Fastest path that preserves quality and avoids timezone risk in the first send.",
        recommended: true,
      },
      {
        title: "Hold for a third-candidate swap",
        outcome: "Three-person packet with tighter overlap",
        risk: "Adds delay to a request already in active review.",
        rationale: "Best if the client explicitly requested three finalists and can tolerate a slightly later send.",
      },
      {
        title: "Release all three as-is",
        outcome: "Full packet goes out now",
        risk: "Highest chance of immediate client feedback on timezone mismatch.",
        rationale: "Only use if the client has already shown flexibility on overlap windows.",
      },
    ],
    relatedRecords: [
      {
        label: "Matching run",
        value: `${overflowRun?.id ?? "MR-880"} · ${overflowRun?.stage ?? "Client-ready shortlist"}`,
        href: "/admin/matching",
      },
      {
        label: "Top candidate",
        value: "TR-204 · Jakob Lindqvist",
        href: "/admin/roster",
      },
      {
        label: "Queue owner",
        value: overflowRun?.reviewer ?? "Maya Chen",
      },
    ],
    nextMoves: [
      "Choose whether the first send can be two candidates or whether the client needs a third finalist immediately.",
      "If the packet pauses, ask matching to refresh the third slot for stronger ET coverage.",
      "Stamp the human release note into the run record before the client handoff goes out.",
    ],
    activity: [
      {
        label: "Run generated",
        detail: "Matching review batch completed and auto-routed into the admin queue.",
        at: overflowRun?.generatedAt ?? "Today, 7:14 AM ET",
      },
      {
        label: "Timezone risk flagged",
        detail: "Priya was called out for weaker live escalation overlap despite solid written quality.",
        at: "7:31 AM ET",
      },
      {
        label: "Human review requested",
        detail: "Queue owner paused the client send until a release instruction is logged.",
        at: "7:34 AM ET",
      },
    ],
  },
  "AQ-1038": {
    subject: {
      name: launchDispute?.client ?? "Cedar Health Co-op",
      initials: "CH",
      role: launchDispute?.issue ?? "Hours mismatch on TS-00017",
      coverage: `${launchDispute?.talent ?? "Nia Thompson"} · ${launchDispute?.amountAtRisk ?? "$960"} at risk`,
      status: launchDispute?.nextCheckpoint ?? "Same-day resolution target",
    },
    reviewLead: launchDispute?.owner ?? "Case desk",
    reviewWindow: `Finance packet sync by ${launchDispute?.nextCheckpoint ?? "11:30 AM ET"}`,
    operatorBrief:
      "This dispute already has a seeded case drilldown, but the queue entry is where the case is triaged for same-day action. The key question is whether to push a payout instruction now or wait for one more client clarification on the disputed prep hours.",
    recommendedCall: "Use the dispute desk's split-treatment recommendation and move the case into finance before the packet freeze.",
    policyNote: "Any finance-risk dispute above $750 stays in same-day operator review until a payout instruction is logged.",
    metrics: [
      {
        label: "Amount at risk",
        value: launchDispute?.amountAtRisk ?? "$960",
        note: "Above the noon escalation threshold",
      },
      {
        label: "Updates logged",
        value: `${launchDispute?.updates.length ?? 3}`,
        note: "Client, talent, and operator notes are already attached",
      },
      {
        label: "Service level",
        value: "Due today",
        note: "Finance wants a same-day instruction",
      },
      {
        label: "Queue age",
        value: "18 hrs",
        note: "Escalated from the original queue into disputes",
      },
    ],
    stakeholders: [
      {
        role: "Client",
        name: launchDispute?.client ?? "Cedar Health Co-op",
        detail: "Wants four prep hours shifted into the following cycle after launch attribution review.",
        responseWindow: launchDispute?.nextCheckpoint ?? "11:30 AM ET",
      },
      {
        role: "Talent",
        name: launchDispute?.talent ?? "Nia Thompson",
        detail: "Argues the prep work directly enabled the launch deadline and should be paid now.",
        responseWindow: "Available now",
      },
      {
        role: "Finance",
        name: "RevOps",
        detail: "Needs a final payout instruction before today's finance packet is exported.",
        responseWindow: "2:30 PM ET",
      },
    ],
    evidence: [
      {
        title: "Client note received",
        detail: launchDispute?.updates[0]?.detail ?? "Client approved 18 of 22 hours and disputed four.",
        source: "Dispute activity log",
      },
      {
        title: "Talent response logged",
        detail: launchDispute?.updates[1]?.detail ?? "Talent shared notes supporting the disputed prep work.",
        source: "Dispute activity log",
      },
      {
        title: "Operator action",
        detail: launchDispute?.updates[2]?.detail ?? "Human review recommended a split treatment.",
        source: "Dispute activity log",
      },
    ],
    timeline: [
      {
        label: "Queue escalation",
        owner: "System",
        timing: "Completed",
        status: "complete",
        detail: "The queue item auto-routed into disputes once the amount at risk crossed the escalation bar.",
      },
      {
        label: "Operator ruling",
        owner: launchDispute?.owner ?? "Case desk",
        timing: "Current",
        status: "current",
        detail: "Choose whether to adopt the split recommendation or wait for another round of client clarification.",
      },
      {
        label: "Finance handoff",
        owner: "RevOps",
        timing: "Next",
        status: "upcoming",
        detail: "Move the case out of the queue once the final payout instruction is mirrored into finance.",
      },
    ],
    decisionPaths: [
      {
        title: "Apply split treatment",
        outcome: "Close the queue item and unblock finance with a balanced instruction",
        risk: "Moderate follow-up from either side, but lowest operational risk.",
        rationale: "Matches the current dispute desk recommendation and protects same-day resolution.",
        recommended: true,
      },
      {
        title: "Approve all hours now",
        outcome: "Highest talent-trust outcome",
        risk: "Client pushback is more likely if prep work was not clearly scoped.",
        rationale: "Best only if the scope note or launch thread clearly included the disputed prep block.",
      },
      {
        title: "Hold for more client clarification",
        outcome: "Potentially cleaner evidence record",
        risk: "Breaks the same-day finance service target and prolongs the queue item.",
        rationale: "Only worth it if the client says they can clarify before the packet freeze.",
      },
    ],
    relatedRecords: [
      {
        label: "Dispute case",
        value: `${launchDispute?.id ?? "DC-017"} · ${launchDispute?.issue ?? "Hours mismatch on TS-00017"}`,
        href: `/admin/disputes/${launchDispute?.id ?? "DC-017"}`,
      },
      {
        label: "Talent profile",
        value: "TR-205 · Nia Thompson",
        href: "/admin/roster",
      },
      {
        label: "Queue owner",
        value: launchDispute?.owner ?? "Case desk",
      },
    ],
    nextMoves: [
      "Adopt or override the split recommendation before the finance packet freeze.",
      "Use the dispute drilldown for full evidence if the operator needs deeper context.",
      "Once the ruling lands, remove the item from the queue and mirror the copy to both sides.",
    ],
    activity: launchDispute?.updates ?? [
      {
        label: "Client note received",
        detail: "Client approved 18 of 22 hours and requested 4 hours be moved to next week.",
        at: "6:20 AM",
      },
      {
        label: "Talent response logged",
        detail: "Talent shared task notes showing prep work happened before the launch deadline.",
        at: "7:02 AM",
      },
      {
        label: "Operator action",
        detail: "Escalated to human review with recommendation to split the disputed block.",
        at: "8:11 AM",
      },
    ],
  },
  "AQ-1035": {
    subject: {
      name: "Weekly board packet",
      initials: "WB",
      role: "Finance commentary handoff",
      coverage: "Board export draft · Due by 3 PM ET",
      status: "Margin commentary still missing",
    },
    reviewLead: "RevOps",
    reviewWindow: "Board packet exports at 3:00 PM ET",
    operatorBrief:
      "The workbook route has the operating data, but this queue item tracks the narrative layer that still needs a human finance read. The goal is to add concise margin commentary so the export is board-ready instead of just data-complete.",
    recommendedCall: "Use the weekly workbook as source material and add a short finance commentary before export.",
    policyNote: "Reporting items stay in queue until the narrative owner signs off on board-facing language.",
    metrics: [
      {
        label: "Narrative gap",
        value: "1 section",
        note: "Finance commentary still missing from the weekly packet",
      },
      {
        label: "Export deadline",
        value: "3:00 PM ET",
        note: "Packet ships to the board lead this afternoon",
      },
      {
        label: "Open risk",
        value: "Margin framing",
        note: "Needs a human explanation, not just the raw delta",
      },
      {
        label: "Queue age",
        value: "19 hrs",
        note: "Draft is ready, commentary is the only blocker",
      },
    ],
    stakeholders: [
      {
        role: "RevOps",
        name: "Finance commentary owner",
        detail: "Needs to translate the workbook's placement and margin movement into board-ready language.",
        responseWindow: "Before 1:30 PM ET",
      },
      {
        role: "Board lead",
        name: "Exec packet desk",
        detail: "Wants an export that explains why margin moved, not just the numbers themselves.",
        responseWindow: "3:00 PM ET",
      },
      {
        role: "Admin reporting",
        name: "Weekly workbook",
        detail: "Already holds the data and the risk/action context needed for the commentary draft.",
        responseWindow: "Ready now",
      },
    ],
    evidence: [
      {
        title: "Workbook summary",
        detail: "The seeded reporting workbook already captures cadence, coverage, finance guardrails, and risks.",
        source: "Weekly workbook route",
      },
      {
        title: "Queue note",
        detail: "Reporting rollup is complete, but placement margin notes still need an operator summary before export.",
        source: "Activation queue item",
      },
      {
        title: "Export requirement",
        detail: "Board packet should explain both operational rhythm and the finance implication in one short narrative block.",
        source: "RevOps handoff",
      },
    ],
    timeline: [
      {
        label: "Workbook generated",
        owner: "Reporting desk",
        timing: "Completed",
        status: "complete",
        detail: "The operating data packet is already prepared in the weekly workbook view.",
      },
      {
        label: "Finance commentary",
        owner: "RevOps",
        timing: "Current",
        status: "current",
        detail: "Write the short board-facing margin read and attach it to the export packet.",
      },
      {
        label: "Board export",
        owner: "Exec packet desk",
        timing: "Next",
        status: "upcoming",
        detail: "Release the completed packet once the commentary note is signed off.",
      },
    ],
    decisionPaths: [
      {
        title: "Add concise margin note",
        outcome: "Packet becomes board-ready on time",
        risk: "Low, because the underlying workbook is already complete.",
        rationale: "Fastest path with the least churn: use the existing workbook and add only the missing narrative.",
        recommended: true,
      },
      {
        title: "Delay export for fuller write-up",
        outcome: "More complete analysis",
        risk: "Misses the current export window for relatively low added value.",
        rationale: "Only worth it if the board lead specifically asks for a more detailed packet.",
      },
      {
        title: "Export without commentary",
        outcome: "Board gets the data today",
        risk: "Highest chance of follow-up questions and avoidable confusion.",
        rationale: "Should be avoided unless timing becomes more important than clarity.",
      },
    ],
    relatedRecords: [
      {
        label: "Weekly workbook",
        value: "Board packet source",
        href: "/admin/reports/weekly",
      },
      {
        label: "Reporting dashboard",
        value: "Admin reports overview",
        href: "/admin/reports",
      },
      {
        label: "Queue owner",
        value: "RevOps",
      },
    ],
    nextMoves: [
      "Open the weekly workbook and pull the two or three strongest finance signals into a short commentary block.",
      "Attach the final note before the 3 PM ET export deadline.",
      "Close the queue item once the board packet is exported with the commentary included.",
    ],
    activity: [
      {
        label: "Draft ready",
        detail: "Weekly reporting rollup completed and queued for operator commentary.",
        at: "Yesterday",
      },
      {
        label: "Finance note requested",
        detail: "RevOps asked for board-facing margin framing before export.",
        at: "8:06 AM ET",
      },
      {
        label: "Queue watch",
        detail: "Item stays routine priority because only narrative polish remains.",
        at: "8:28 AM ET",
      },
    ],
  },
  "AQ-1032": {
    subject: {
      name: "Sarah Choi",
      initials: "SC",
      role: "Resume parser recovery",
      coverage: "18-page PDF · Manual skill tagging needed",
      status: "Profile still unpublished",
    },
    reviewLead: "Launch pod",
    reviewWindow: "Manual publish target is tomorrow morning",
    operatorBrief:
      "The blocker is not compliance; it is document complexity. Sarah's resume packed several contract experiences into a dense portfolio PDF, so the parser fell back and the launch pod needs a manual pass to recover the skill tags before publication.",
    recommendedCall: "Run a manual skill-tagging pass and publish once the profile summary is compressed into the standard launch template.",
    policyNote: "When resume parsing falls back on layout complexity, a human can publish after manual tagging if the source material is otherwise clean.",
    metrics: [
      {
        label: "Resume length",
        value: "18 pages",
        note: "Dense portfolio formatting caused the parser miss",
      },
      {
        label: "Manual tags needed",
        value: "6 core skills",
        note: "Enough to seed the profile for search and matching",
      },
      {
        label: "Compliance status",
        value: "Clear",
        note: "No identity or sanctions blockers attached",
      },
      {
        label: "Queue age",
        value: "19 hrs",
        note: "Routine priority because there is no active client dependency",
      },
    ],
    stakeholders: [
      {
        role: "Talent",
        name: "Sarah Choi",
        detail: "Waiting for the profile to publish so her admin and project-ops background becomes searchable.",
        responseWindow: "Async",
      },
      {
        role: "Launch pod",
        name: "Activation editor",
        detail: "Needs a compact summary plus six manual tags before the launch template can render cleanly.",
        responseWindow: "Tomorrow morning",
      },
      {
        role: "Matching desk",
        name: "Search coverage",
        detail: "Would benefit from the profile once the manual tags unblock discoverability.",
        responseWindow: "Optional",
      },
    ],
    evidence: [
      {
        title: "Parser fallback",
        detail: "The ingestion service flagged layout complexity and stopped after partial extraction.",
        source: "Resume parser monitor",
      },
      {
        title: "Portfolio structure",
        detail: "The source PDF mixes project screenshots, long-form case notes, and standard resume sections.",
        source: "Launch pod preview",
      },
      {
        title: "Manual publish path",
        detail: "No compliance blockers remain, so the profile can publish once the tags and summary are entered manually.",
        source: "Activation policy note",
      },
    ],
    timeline: [
      {
        label: "Automated parse attempt",
        owner: "System",
        timing: "Completed",
        status: "complete",
        detail: "The parser failed due to layout complexity, but saved the raw document for manual review.",
      },
      {
        label: "Manual skill tagging",
        owner: "Launch pod",
        timing: "Current",
        status: "current",
        detail: "Extract six search-worthy skills and compress the profile summary into the standard template.",
      },
      {
        label: "Profile publish",
        owner: "Activation editor",
        timing: "Next",
        status: "upcoming",
        detail: "Publish the searchable profile after the manual pass is complete.",
      },
    ],
    decisionPaths: [
      {
        title: "Manual recovery and publish",
        outcome: "Profile becomes searchable without another parse attempt",
        risk: "Low; only requires editorial time.",
        rationale: "Best route when the content is valid but the source document is too visually complex for the parser.",
        recommended: true,
      },
      {
        title: "Ask for a simplified resume",
        outcome: "Cleaner machine-readable source for later",
        risk: "Adds back-and-forth and delays publication unnecessarily.",
        rationale: "Useful only if the current document is too ambiguous for manual extraction.",
      },
      {
        title: "Leave queued",
        outcome: "No editorial work now",
        risk: "Search coverage stays lower and the candidate waits longer for publication.",
        rationale: "Only reasonable if launch pod capacity is fully consumed by higher-priority activations.",
      },
    ],
    relatedRecords: [
      {
        label: "Queue owner",
        value: "Launch pod",
      },
      {
        label: "Admin roster",
        value: "Compare manual tags to active profile taxonomy",
        href: "/admin/roster",
      },
      {
        label: "Activation board",
        value: "Return to queue",
        href: "/admin",
      },
    ],
    nextMoves: [
      "Tag the six highest-signal skills from the existing portfolio document.",
      "Compress the intro paragraph into the standard launch summary format.",
      "Publish the profile once the manual editor pass is complete.",
    ],
    activity: [
      {
        label: "Fallback detected",
        detail: "Parser stopped after hitting dense multi-column sections in the source PDF.",
        at: "Yesterday",
      },
      {
        label: "Manual lane assigned",
        detail: "Launch pod queued the record for human skill tagging and summary cleanup.",
        at: "7:55 AM ET",
      },
      {
        label: "Routine review",
        detail: "No active client dependency, so the record remained routine priority.",
        at: "8:19 AM ET",
      },
    ],
  },
};

export function getAdminQueueIds() {
  return activationQueue.map((item) => item.id);
}

export function getAdminQueueDetail(queueId: string) {
  const item = activationQueue.find((entry) => entry.id === queueId);

  if (!item) {
    return null;
  }

  const supplement = queueSupplements[queueId];

  if (!supplement) {
    return null;
  }

  return {
    ...item,
    ...supplement,
  } satisfies ActivationQueueDetail;
}
