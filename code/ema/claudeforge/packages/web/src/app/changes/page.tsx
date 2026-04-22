"use client";

import { Rocket } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { OperatorPagePlaceholder } from "@/components/layout/OperatorPagePlaceholder";

export default function ChangesPage() {
  return (
    <Layout>
      <OperatorPagePlaceholder
        icon={<Rocket size={20} strokeWidth={1.5} />}
        title="Changes"
        description="Proposal and change-control surface for operator-reviewed actions. This route is where EMA should eventually separate intent, approval, execution chain, verification, and rollback posture."
        bullets={[
          "Separate current health from last execution, verification state, and risk state.",
          "Show blast radius, schedule window, required approvals, and rollback plan as first-class properties.",
          "Link directly into executions, artifacts, and evidence rather than trapping state in prose.",
          "This is the future home of the Argo/Spinnaker-inspired status panel work.",
        ]}
      />
    </Layout>
  );
}
