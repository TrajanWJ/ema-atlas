import { notFound } from 'next/navigation';

import { InvoicePacketLab } from '@/components/client-finance/invoice-packet-lab';
import { getClientFinancePacket } from '@/lib/client-finance/data';

export default async function ClientFinancePacketPage({
  params,
}: {
  params: Promise<{ packetId: string }>;
}) {
  const { packetId } = await params;
  const packet = getClientFinancePacket(packetId);

  if (!packet) {
    notFound();
  }

  return <InvoicePacketLab packet={packet} />;
}
