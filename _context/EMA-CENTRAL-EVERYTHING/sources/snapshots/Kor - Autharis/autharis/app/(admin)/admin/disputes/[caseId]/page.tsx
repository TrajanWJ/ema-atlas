import { notFound } from "next/navigation";

import { DisputeDetailView } from "@/components/admin/disputes/DisputeDetailView";
import { getAdminDisputeCase, getAdminDisputeCaseIds } from "@/lib/admin/disputes";

export function generateStaticParams() {
  return getAdminDisputeCaseIds().map((caseId) => ({ caseId }));
}

export default async function AdminDisputeDetailPage({
  params,
}: {
  params: Promise<{ caseId: string }>;
}) {
  const { caseId } = await params;
  const dispute = getAdminDisputeCase(caseId);

  if (!dispute) {
    notFound();
  }

  return <DisputeDetailView dispute={dispute} />;
}
