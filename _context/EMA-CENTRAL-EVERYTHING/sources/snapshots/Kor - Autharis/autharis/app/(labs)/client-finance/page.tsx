import { ClientFinanceLab } from '@/components/client-finance/client-finance-lab';
import { getClientFinanceOverview, getClientFinancePackets } from '@/lib/client-finance/data';

export default function ClientFinanceLabPage() {
  return <ClientFinanceLab overview={getClientFinanceOverview()} packets={getClientFinancePackets()} />;
}
