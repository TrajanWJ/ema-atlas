import { MatchesScreen } from '@/components/client/screens';

export default async function ClientMatchesPage({
  params,
}: {
  params: Promise<{ jobId: string }>;
}) {
  const { jobId } = await params;

  return <MatchesScreen jobId={jobId} />;
}
