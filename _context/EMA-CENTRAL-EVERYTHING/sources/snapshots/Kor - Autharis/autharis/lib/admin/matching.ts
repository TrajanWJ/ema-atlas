import { matchReviewRuns, type CandidateReview, type MatchReviewRun } from "@/lib/admin/data";

export type MatchingDossierTone = "healthy" | "watch" | "critical";

export type MatchingMetric = {
  label: string;
  value: string;
  note: string;
  tone: MatchingDossierTone;
};

export type MatchingSnapshot = {
  label: string;
  value: string;
  note: string;
};

export type MatchingChecklistItem = {
  label: string;
  owner: string;
  due: string;
  status: "complete" | "active" | "queued";
};

export type MatchingCalibrationSignal = {
  label: string;
  value: string;
  note: string;
};

export type MatchingConcern = {
  title: string;
  detail: string;
  severity: "critical" | "elevated" | "moderate";
};

export type MatchingReleaseStep = {
  label: string;
  owner: string;
  status: "complete" | "current" | "upcoming";
  detail: string;
};

export type MatchingTimelineEvent = {
  label: string;
  detail: string;
  at: string;
};

export type MatchingCandidateDossier = CandidateReview & {
  rank: number;
  panelVerdict: string;
  alignment: string;
  evidence: string[];
  interviewFocus: string[];
};

export type MatchingRunDossier = Omit<MatchReviewRun, "candidates"> & {
  requestId: string;
  accountOwner: string;
  clientPriority: string;
  serviceLine: string;
  coverageWindow: string;
  budgetRange: string;
  shiftPattern: string;
  decisionDeadline: string;
  summary: string;
  operatorRecommendation: string;
  releaseInstruction: string;
  snapshots: MatchingSnapshot[];
  metrics: MatchingMetric[];
  checklist: MatchingChecklistItem[];
  calibrationSignals: MatchingCalibrationSignal[];
  concerns: MatchingConcern[];
  releaseSteps: MatchingReleaseStep[];
  timeline: MatchingTimelineEvent[];
  panelNotes: string[];
  candidates: MatchingCandidateDossier[];
};

type MatchingRunDossierSupplement = Omit<
  MatchingRunDossier,
  | "id"
  | "requestTitle"
  | "client"
  | "stage"
  | "generatedAt"
  | "reviewer"
  | "fitSummary"
  | "candidateCount"
  | "recommendedAction"
  | "candidates"
>;

type CandidateDossierSupplement = Omit<
  MatchingCandidateDossier,
  "id" | "name" | "initials" | "score" | "rate" | "availability" | "strengths" | "risks"
>;

const candidateSupplements: Record<string, CandidateDossierSupplement> = {
  "c-1": {
    rank: 1,
    panelVerdict: "Ready to release",
    alignment: "Best technical QA depth and strongest evaluator calibration across prior Lumen workflows.",
    evidence: [
      "Scored highest on rubric consistency during the last three QA batches.",
      "Already works inside the same escalation taxonomy the client uses.",
      "Operator notes show clear defect summarization with minimal editing.",
    ],
    interviewFocus: [
      "Confirm live escalation hours that overlap with the client's ET leadership standup.",
      "Validate whether 12 hours weekly can flex upward during launch spikes.",
    ],
  },
  "c-2": {
    rank: 2,
    panelVerdict: "Release with coaching note",
    alignment: "Strong customer-writing quality and flexible scheduling make this the safest secondary finalist.",
    evidence: [
      "Prior Zendesk work maps cleanly to the client's overflow queue.",
      "Interview transcript highlighted calm escalation handling and tidy handoffs.",
      "Availability can absorb weekend QA bursts without budget drift.",
    ],
    interviewFocus: [
      "Pressure-test RAG evaluation depth against the client's latest annotation rubric.",
      "Share one calibration example so reviewers know how to compare answers.",
    ],
  },
  "c-3": {
    rank: 3,
    panelVerdict: "Hold pending timezone mitigation",
    alignment: "Documentation and research quality are strong, but live support overlap is the gating risk.",
    evidence: [
      "Written handoff samples are the cleanest in the pool.",
      "Research synthesis suggests solid async QA judgment.",
      "The route to approval depends on a concrete escalation coverage plan.",
    ],
    interviewFocus: [
      "Ask whether evening coverage can create at least two ET overlap hours.",
      "Clarify how quickly QA ramp can happen inside a live support environment.",
    ],
  },
  "c-4": {
    rank: 1,
    panelVerdict: "Conditional release",
    alignment: "Strongest founder-support fit in the pool if the dispute closes before publish.",
    evidence: [
      "Best travel, calendar, and inbox depth among seeded candidates.",
      "Direct ET overlap reduces executive handoff risk.",
      "Client-style communication samples already match the request tone.",
    ],
    interviewFocus: [
      "Confirm dispute resolution timing before sending to the client.",
      "Validate appetite for founder-adjacent after-hours coverage during board weeks.",
    ],
  },
  "c-5": {
    rank: 2,
    panelVerdict: "Benchmark only",
    alignment: "Good operating discipline, but activation status and calendar depth keep this out of the first client packet.",
    evidence: [
      "Documentation hygiene is excellent.",
      "Activation is still pending final sign-off, so the shortlist cannot be released yet.",
      "Better fit as a structured backup if the budget floor widens.",
    ],
    interviewFocus: [
      "Reassess once activation completes and the budget range expands.",
      "Probe executive assistant depth beyond outbound and CRM-heavy workflows.",
    ],
  },
};

const matchingRunSupplements: Record<string, MatchingRunDossierSupplement> = {
  "MR-880": {
    requestId: "REQ-221",
    accountOwner: "Maya Chen",
    clientPriority: "Overflow QA launch coverage",
    serviceLine: "AI support quality review",
    coverageWindow: "Mon-Fri, 9 AM to 5 PM ET with launch-day surge coverage",
    budgetRange: "$38-$60/hr",
    shiftPattern: "12 to 25 hrs / week",
    decisionDeadline: "Today, 11:00 AM ET",
    summary:
      "This run is already packaged for client release, but the operator still needs to lock the final coverage story before the shortlist leaves the admin desk.",
    operatorRecommendation:
      "Release Jakob and Daniel in the first packet, hold Priya behind a timezone mitigation note, and tell the client why the shortlist order changed from pure score rank.",
    releaseInstruction:
      "Send a two-name shortlist with Priya retained as an alternate if the client accepts asynchronous coverage for research-heavy QA.",
    snapshots: [
      {
        label: "Client request",
        value: "Lumen AI overflow QA",
        note: "AI support team asked for a same-day human sanity check before shortlist release.",
      },
      {
        label: "Operator posture",
        value: "Release after one manual pass",
        note: "The engine looks directionally right; the risk is narrative clarity rather than candidate scarcity.",
      },
      {
        label: "Coverage risk",
        value: "Timezone mismatch on finalist #3",
        note: "Priya's async strength is real, but live ET escalations still need a cleaner plan.",
      },
      {
        label: "Client packet timing",
        value: "11:30 AM ET",
        note: "Sales wants the shortlist in the client's inbox before the noon calibration meeting.",
      },
    ],
    metrics: [
      {
        label: "Top score spread",
        value: "11 pts",
        note: "Jakob leads Priya by 11 fit points once human QA weighting is applied.",
        tone: "healthy",
      },
      {
        label: "ET overlap risk",
        value: "1 finalist",
        note: "One shortlisted candidate lacks enough live escalation overlap without schedule adjustment.",
        tone: "watch",
      },
      {
        label: "Budget fit",
        value: "3 / 3 in range",
        note: "Every finalist lands inside the client's approved range.",
        tone: "healthy",
      },
      {
        label: "Decision clock",
        value: "3 hr 46 min",
        note: "Manual sign-off is due before the client sync prep begins.",
        tone: "critical",
      },
    ],
    checklist: [
      {
        label: "Confirm ET overlap note for Priya",
        owner: "Maya Chen",
        due: "9:45 AM ET",
        status: "active",
      },
      {
        label: "Attach client-facing rationale to shortlist email",
        owner: "Ops desk",
        due: "10:15 AM ET",
        status: "queued",
      },
      {
        label: "Approve release packet in admin",
        owner: "Jordan Lee",
        due: "11:00 AM ET",
        status: "queued",
      },
    ],
    calibrationSignals: [
      {
        label: "Rubric confidence",
        value: "High",
        note: "Three prior QA calibrations align with the current Lumen score weights.",
      },
      {
        label: "Talent supply",
        value: "Healthy",
        note: "The pool is strong enough that the team can withhold a finalist without starving the client packet.",
      },
      {
        label: "Operator intervention",
        value: "Narrative-only",
        note: "No candidate was manually promoted beyond the seeded model rank; the human change is release ordering and commentary.",
      },
    ],
    concerns: [
      {
        title: "Timezone escalation coverage",
        detail: "Priya's score remains strong, but live incident coverage could miss Lumen's morning standup without explicit schedule adjustments.",
        severity: "elevated",
      },
      {
        title: "Client perception of shortlist rank",
        detail: "If the first packet does not explain why Jakob outranks Daniel on calibration depth, the client may assume the list is arbitrary.",
        severity: "moderate",
      },
      {
        title: "Decision deadline pressure",
        detail: "The noon calibration session means the release note and approval need to land in sequence, not in parallel guesses.",
        severity: "critical",
      },
    ],
    releaseSteps: [
      {
        label: "Engine run reviewed",
        owner: "Matching engine",
        status: "complete",
        detail: "Base shortlist generated and risk flags surfaced for timezone and evaluation depth.",
      },
      {
        label: "Operator narrative lock",
        owner: "Maya Chen",
        status: "current",
        detail: "Decide whether Priya stays in the packet or moves to alternate status with an async coverage note.",
      },
      {
        label: "Client send + CRM log",
        owner: "Ops desk",
        status: "upcoming",
        detail: "Release packet and mirror the rationale into the client record before the noon sync.",
      },
    ],
    timeline: [
      {
        label: "Engine completed",
        detail: "Run scored three finalists and flagged one timezone watchout.",
        at: "7:14 AM ET",
      },
      {
        label: "Operator review opened",
        detail: "Maya began a manual pass to confirm escalation-writing quality.",
        at: "7:42 AM ET",
      },
      {
        label: "Client send requested",
        detail: "Sales asked for final shortlist copy before the noon calibration session.",
        at: "8:09 AM ET",
      },
    ],
    panelNotes: [
      "Keep the client narrative centered on calibration quality, not only raw score rank.",
      "Priya should remain visible as an alternate because async QA coverage may still matter next week.",
      "Daniel's lower RAG depth is acceptable if the release note frames him as the flexible overflow option.",
    ],
  },
  "MR-874": {
    requestId: "REQ-214",
    accountOwner: "Jordan Lee",
    clientPriority: "Founder EA launch support",
    serviceLine: "Executive support matching",
    coverageWindow: "Mon-Fri core ET hours plus board-week flexibility",
    budgetRange: "$38-$55/hr",
    shiftPattern: "20 to 30 hrs / week",
    decisionDeadline: "Tomorrow, 9:30 AM ET",
    summary:
      "This run is less about ranking candidates and more about deciding whether the request is publishable at all with the current budget and activation state.",
    operatorRecommendation:
      "Widen the budget floor, hold Nia until the dispute closes, and use the current run as an internal benchmark instead of releasing it directly to the client.",
    releaseInstruction:
      "Do not publish yet. Update budget guidance first, then rerun once Nia's dispute and Miguel's activation status are cleared or explicitly waived.",
    snapshots: [
      {
        label: "Client request",
        value: "Ladder Fintech founder EA coverage",
        note: "High-trust executive support role with board-week surge expectations.",
      },
      {
        label: "Operator posture",
        value: "Pre-publish hold",
        note: "The shortlist is informative internally but not ready for direct client release.",
      },
      {
        label: "Primary blocker",
        value: "Budget floor too narrow",
        note: "The current range suppresses the pool before publish and makes the shortlist look artificially thin.",
      },
      {
        label: "Secondary blocker",
        value: "Talent readiness mismatch",
        note: "Nia has an open dispute and Miguel is not fully activated.",
      },
    ],
    metrics: [
      {
        label: "Ready-to-send finalists",
        value: "0",
        note: "Both seeded candidates have gating issues even though the fit signal is directionally useful.",
        tone: "critical",
      },
      {
        label: "Budget lift needed",
        value: "+$17/hr ceiling",
        note: "The current operator advice is to widen the budget to improve supply quality.",
        tone: "watch",
      },
      {
        label: "Talent readiness",
        value: "2 blockers",
        note: "One dispute and one activation hold prevent a clean release packet today.",
        tone: "critical",
      },
      {
        label: "Coverage alignment",
        value: "Strong",
        note: "The request brief itself is solid and worth rerunning after the blockers clear.",
        tone: "healthy",
      },
    ],
    checklist: [
      {
        label: "Align revised budget range with sales",
        owner: "Jordan Lee",
        due: "Today, 3:00 PM ET",
        status: "active",
      },
      {
        label: "Check dispute status on Nia",
        owner: "Case desk",
        due: "Today, 4:00 PM ET",
        status: "queued",
      },
      {
        label: "Rerun shortlist after readiness clears",
        owner: "Matching ops",
        due: "Tomorrow, 9:00 AM ET",
        status: "queued",
      },
    ],
    calibrationSignals: [
      {
        label: "Role clarity",
        value: "High",
        note: "The brief is specific enough that a rerun should produce a richer pool once the budget moves.",
      },
      {
        label: "Budget pressure",
        value: "Tight",
        note: "Current pay range is screening out senior founder-support operators too early.",
      },
      {
        label: "Human override",
        value: "Hold publish",
        note: "The operator changed the workflow stage, not the candidate ordering, because the packet is not release-safe.",
      },
    ],
    concerns: [
      {
        title: "False scarcity in the pool",
        detail: "Publishing with the current budget would imply the marketplace is thin when the real issue is the rate band.",
        severity: "elevated",
      },
      {
        title: "Trust risk from dispute carryover",
        detail: "Sending Nia before the dispute closes could force immediate client explanation if the case re-escalates.",
        severity: "critical",
      },
      {
        title: "Activation dependency",
        detail: "Miguel remains useful as an internal benchmark, but incomplete activation prevents a clean launch packet.",
        severity: "moderate",
      },
    ],
    releaseSteps: [
      {
        label: "Initial engine review",
        owner: "Matching engine",
        status: "complete",
        detail: "Generated a thin shortlist that surfaced budget pressure and talent readiness blockers.",
      },
      {
        label: "Publishability decision",
        owner: "Jordan Lee",
        status: "current",
        detail: "Decide whether to widen the budget before the client sees the current pool composition.",
      },
      {
        label: "Rerun + publish",
        owner: "Matching ops",
        status: "upcoming",
        detail: "Re-score the request and only then send the revised shortlist if the blockers clear.",
      },
    ],
    timeline: [
      {
        label: "Engine completed",
        detail: "Initial shortlist returned with only two viable internal benchmark profiles.",
        at: "Yesterday, 4:52 PM ET",
      },
      {
        label: "Operator hold applied",
        detail: "Jordan prevented auto-publish because the budget band looked too narrow.",
        at: "Yesterday, 5:11 PM ET",
      },
      {
        label: "Budget escalation drafted",
        detail: "Sales received a note recommending a wider rate range before client release.",
        at: "Today, 8:05 AM ET",
      },
    ],
    panelNotes: [
      "This run is valuable as an internal benchmark packet even though it is not client-ready.",
      "Nia remains the best fit signal, but dispute status should stay attached to the dossier until it closes.",
      "A rerun after the budget widens is more honest than shipping a thin shortlist today.",
    ],
  },
};

function enrichCandidate(candidate: CandidateReview): MatchingCandidateDossier {
  const supplement = candidateSupplements[candidate.id];

  return {
    ...candidate,
    rank: supplement?.rank ?? 0,
    panelVerdict: supplement?.panelVerdict ?? "Needs review",
    alignment: supplement?.alignment ?? "Awaiting additional operator context.",
    evidence: supplement?.evidence ?? [],
    interviewFocus: supplement?.interviewFocus ?? [],
  };
}

function enrichMatchingRun(run: MatchReviewRun): MatchingRunDossier {
  const supplement = matchingRunSupplements[run.id];

  return {
    ...run,
    requestId: supplement?.requestId ?? "REQ-unknown",
    accountOwner: supplement?.accountOwner ?? run.reviewer,
    clientPriority: supplement?.clientPriority ?? run.requestTitle,
    serviceLine: supplement?.serviceLine ?? "Matching review",
    coverageWindow: supplement?.coverageWindow ?? "Operator review pending",
    budgetRange: supplement?.budgetRange ?? "Pending budget guidance",
    shiftPattern: supplement?.shiftPattern ?? "Pending schedule guidance",
    decisionDeadline: supplement?.decisionDeadline ?? "Pending operator sign-off",
    summary: supplement?.summary ?? run.fitSummary,
    operatorRecommendation: supplement?.operatorRecommendation ?? run.recommendedAction,
    releaseInstruction: supplement?.releaseInstruction ?? run.recommendedAction,
    snapshots: supplement?.snapshots ?? [],
    metrics: supplement?.metrics ?? [],
    checklist: supplement?.checklist ?? [],
    calibrationSignals: supplement?.calibrationSignals ?? [],
    concerns: supplement?.concerns ?? [],
    releaseSteps: supplement?.releaseSteps ?? [],
    timeline: supplement?.timeline ?? [],
    panelNotes: supplement?.panelNotes ?? [],
    candidates: run.candidates.map(enrichCandidate),
  };
}

const matchingRunDossiers = matchReviewRuns.map(enrichMatchingRun);

export function getAdminMatchingRunIds() {
  return matchingRunDossiers.map((run) => run.id);
}

export function getAdminMatchingRun(runId: string) {
  return matchingRunDossiers.find((run) => run.id === runId);
}
