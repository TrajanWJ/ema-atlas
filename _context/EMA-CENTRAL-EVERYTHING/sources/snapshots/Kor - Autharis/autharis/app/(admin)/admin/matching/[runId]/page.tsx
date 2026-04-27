import { notFound } from "next/navigation";

import { MatchingRunDetailView } from "@/components/admin/matching-detail/MatchingRunDetailView";
import { getAdminMatchingRun, getAdminMatchingRunIds } from "@/lib/admin/matching";

export function generateStaticParams() {
  return getAdminMatchingRunIds().map((runId) => ({ runId }));
}

export default async function AdminMatchingDetailPage({
  params,
}: {
  params: Promise<{ runId: string }>;
}) {
  const { runId } = await params;
  const run = getAdminMatchingRun(runId);

  if (!run) {
    notFound();
  }

  return <MatchingRunDetailView run={run} />;
}
