import {
  activationQueue,
  disputes,
  matchReviewRuns,
  regionMix,
  reportMetrics,
  rosterMembers,
  throughput,
  type MetricCard,
} from "@/lib/admin/data";

export type WorkbookTone = MetricCard["tone"] | "critical";

export type WorkbookMetric = {
  label: string;
  value: string;
  delta: string;
  note: string;
  tone: WorkbookTone;
};

export type WorkbookHighlight = {
  title: string;
  detail: string;
};

export type WorkbookCadenceRow = {
  day: string;
  queue: number;
  disputes: number;
  placements: number;
  margin: string;
  note: string;
};

export type WorkbookCoverageRegion = {
  label: string;
  talentShare: number;
  fillRate: string;
  pressure: string;
  signal: string;
};

export type WorkbookFinanceGuardrail = {
  label: string;
  value: string;
  note: string;
};

export type WorkbookAction = {
  title: string;
  owner: string;
  due: string;
  detail: string;
  status: "active" | "watch" | "queued";
};

export type WorkbookRisk = {
  title: string;
  severity: "critical" | "elevated" | "moderate";
  detail: string;
  mitigation: string;
};

export type WorkbookSnapshot = {
  label: string;
  value: string;
  note: string;
};

export type WeeklyWorkbook = {
  reportingWindow: string;
  generatedAt: string;
  owner: string;
  boardVersion: string;
  summary: string;
  metrics: WorkbookMetric[];
  highlights: WorkbookHighlight[];
  cadence: WorkbookCadenceRow[];
  coverage: WorkbookCoverageRegion[];
  finance: WorkbookFinanceGuardrail[];
  actions: WorkbookAction[];
  risks: WorkbookRisk[];
  snapshots: WorkbookSnapshot[];
};

const metricNotes: Record<string, string> = {
  "Gross margin": "Mix improved as higher-rate QA and care-navigation shifts displaced lower-margin overflow coverage.",
  "Median fill time": "Lower time-to-fill came from pre-cleared roster supply in ET and CET, not from relaxed review thresholds.",
  "Approval lag": "Two client-side sign-off bottlenecks are still inflating payout readiness even after same-day operator follow-up.",
  "Activation pass rate": "Human review changes were concentrated in title-history cleanup rather than reference failures.",
};

const placementsByDay = [3, 4, 2, 3, 2];
const marginByDay = ["28.8%", "29.9%", "27.6%", "30.4%", "29.7%"];
const cadenceNotes = [
  "Front-loaded activation work after the weekend backlog cleared.",
  "Highest queue load came from matching review and finance commentary prep.",
  "Midweek dip reflects fewer new briefs and cleaner same-day approvals.",
  "Dispute volume spiked when Cedar Health and Lumen AI both required operator handling.",
  "Friday stabilized after queue triage and publication holds were resolved.",
];

const regionSignals: Record<string, { fillRate: string; pressure: string; signal: string }> = {
  "North America": {
    fillRate: "91%",
    pressure: "High demand, healthy supply",
    signal: "Best executive-assistant and care-navigation coverage for ET-heavy briefs.",
  },
  Europe: {
    fillRate: "87%",
    pressure: "Stable",
    signal: "Strong QA and support capacity, but live escalation overlap still needs review.",
  },
  Africa: {
    fillRate: "83%",
    pressure: "Expanding",
    signal: "Coverage quality is strong; the constraint is volume of approved finance and launch-ops specialists.",
  },
  LATAM: {
    fillRate: "79%",
    pressure: "Tight",
    signal: "Useful swing coverage for outbound and admin operations, but activation throughput is still uneven.",
  },
};

function mapMetric(metric: MetricCard): WorkbookMetric {
  return {
    ...metric,
    note: metricNotes[metric.label] ?? "Operator commentary pending for this metric.",
  };
}

function buildCadence(): WorkbookCadenceRow[] {
  return throughput.map((point, index) => ({
    day: point.label,
    queue: point.queue,
    disputes: point.disputes,
    placements: placementsByDay[index] ?? 0,
    margin: marginByDay[index] ?? reportMetrics[0]?.value ?? "29%",
    note: cadenceNotes[index] ?? "Normal operating cadence.",
  }));
}

function buildCoverage(): WorkbookCoverageRegion[] {
  return regionMix.map((region) => ({
    label: region.label,
    talentShare: region.value,
    fillRate: regionSignals[region.label]?.fillRate ?? "80%",
    pressure: regionSignals[region.label]?.pressure ?? "Stable",
    signal: regionSignals[region.label]?.signal ?? "Coverage mix is within target range.",
  }));
}

function buildFinance(): WorkbookFinanceGuardrail[] {
  const queueTotal = throughput.reduce((sum, point) => sum + point.queue, 0);
  const disputeExposure = disputes.reduce((sum, dispute) => {
    const amount = Number(dispute.amountAtRisk.replace(/[^0-9.]/g, ""));
    return sum + amount;
  }, 0);
  const activeReviewCount = activationQueue.filter((item) => item.priority !== "routine").length;

  return [
    {
      label: "Queue touched",
      value: `${queueTotal} reviews`,
      note: `${activationQueue.length} live queue items still visible in the operator board snapshot.`,
    },
    {
      label: "Dispute exposure",
      value: `$${disputeExposure.toLocaleString()}`,
      note: `${disputes.length} active dispute cases require mirrored finance and client communication.`,
    },
    {
      label: "High-attention reviews",
      value: `${activeReviewCount} items`,
      note: "Critical and elevated queue items are concentrated in activation and matching review.",
    },
  ];
}

function buildActions(): WorkbookAction[] {
  const leadMatchRun = matchReviewRuns[0];
  const leadDispute = disputes[0];

  return [
    {
      title: "Close the Cedar Health payout ruling",
      owner: leadDispute?.owner ?? "Case desk",
      due: leadDispute?.nextCheckpoint ?? "Today",
      detail: "Land the operator decision before the finance packet freeze so invoice and payout copy stay aligned.",
      status: "active",
    },
    {
      title: "Release the overflow QA shortlist",
      owner: leadMatchRun?.reviewer ?? "Matching review",
      due: "Today, 1:00 PM ET",
      detail: "Confirm timezone overlap and publish the Lumen AI shortlist with a final operator note.",
      status: "active",
    },
    {
      title: "Add commentary to the board packet export",
      owner: "RevOps",
      due: "Today, 3:00 PM ET",
      detail: "Summarize the margin lift, approval lag drag, and regional supply balance for the weekly board packet.",
      status: "watch",
    },
    {
      title: "Prepare LATAM activation cleanup pass",
      owner: "Launch pod",
      due: "Tomorrow morning",
      detail: "Target title-history and resume-parser issues before next week's outbound-heavy briefs open.",
      status: "queued",
    },
  ];
}

function buildRisks(): WorkbookRisk[] {
  return [
    {
      title: "Finance packet depends on same-day dispute resolution",
      severity: "critical",
      detail: "The Cedar Health dispute is still within the payout lock window, so delay would spill directly into finance commentary.",
      mitigation: "Escalate the ruling before 2:30 PM ET and mirror the outcome across payroll and invoice notes.",
    },
    {
      title: "Approval lag remains above target",
      severity: "elevated",
      detail: "Lumen AI approval drift is still distorting payout readiness despite healthy delivery quality.",
      mitigation: "Use operator-owned escalation copy and tighten the client follow-up sequence before Monday.",
    },
    {
      title: "LATAM supply is useful but not yet resilient",
      severity: "moderate",
      detail: "The region can support outbound and admin workflows, but activation cleanup still slows publish-ready inventory.",
      mitigation: "Run a focused activation audit and pre-tag stronger operator-ready profiles ahead of new demand.",
    },
  ];
}

function buildSnapshots(): WorkbookSnapshot[] {
  const activeSpecialists = rosterMembers.filter((member) => member.status === "active").length;
  const rampingSpecialists = rosterMembers.filter((member) => member.status !== "active").length;
  const leadQueueItem = activationQueue[0];

  return [
    {
      label: "Reporting window",
      value: "Week of Apr 20",
      note: "Five-day operating readout for board and operator packet alignment.",
    },
    {
      label: "Generated",
      value: "Fri, 11:18 AM ET",
      note: "Refreshed after queue triage and before finance packet commentary is exported.",
    },
    {
      label: "Active specialist core",
      value: `${activeSpecialists} live / ${rampingSpecialists} in review`,
      note: "Healthy depth in ET and CET, with activation cleanup still required for ramping talent.",
    },
    {
      label: "Highest-priority queue item",
      value: leadQueueItem?.id ?? "AQ-0000",
      note: leadQueueItem?.title ?? "Operator triage item pending.",
    },
  ];
}

export function getWeeklyWorkbook(): WeeklyWorkbook {
  return {
    reportingWindow: "Week of Apr 20",
    generatedAt: "Fri, 11:18 AM ET",
    owner: "Maya Chen · Admin operations",
    boardVersion: "Workbook v0.3",
    summary:
      "Autharis closed the week with faster fills, improving gross margin, and a manageable queue, but the board packet still needs explicit commentary on approval lag and same-day dispute exposure.",
    metrics: reportMetrics.map(mapMetric),
    highlights: [
      {
        title: "Fill speed improved without softening review",
        detail: "Median fill time dropped to 26 hours because pre-cleared supply handled more executive-assistant and QA demand.",
      },
      {
        title: "Margin lift came from better request mix",
        detail: "Higher-rate placements in care navigation and QA offset lower-yield overflow coverage.",
      },
      {
        title: "The remaining drag is approvals, not demand",
        detail: "Operator teams are still chasing client-side sign-off, which keeps payout readiness behind service delivery.",
      },
    ],
    cadence: buildCadence(),
    coverage: buildCoverage(),
    finance: buildFinance(),
    actions: buildActions(),
    risks: buildRisks(),
    snapshots: buildSnapshots(),
  };
}
