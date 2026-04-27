import { notFound } from "next/navigation";

import { QueueDetailView } from "@/components/admin/queue/QueueDetailView";
import { getAdminQueueDetail, getAdminQueueIds } from "@/lib/admin/queue";

export function generateStaticParams() {
  return getAdminQueueIds().map((queueId) => ({ queueId }));
}

export default async function AdminQueueDetailPage({
  params,
}: {
  params: Promise<{ queueId: string }>;
}) {
  const { queueId } = await params;
  const queue = getAdminQueueDetail(queueId);

  if (!queue) {
    notFound();
  }

  return <QueueDetailView queue={queue} />;
}
