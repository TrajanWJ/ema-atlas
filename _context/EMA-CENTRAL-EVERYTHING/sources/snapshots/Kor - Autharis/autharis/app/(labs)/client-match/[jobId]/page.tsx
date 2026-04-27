import { ClientMatchLab } from '@/components/client-match/client-match-lab';
import { getClientMatchLab } from '@/lib/client-match/data';

export default async function ClientMatchLabJobPage({
  params,
}: {
  params: Promise<{ jobId: string }>;
}) {
  const { jobId } = await params;

  return <ClientMatchLab lab={getClientMatchLab(jobId)} />;
}
