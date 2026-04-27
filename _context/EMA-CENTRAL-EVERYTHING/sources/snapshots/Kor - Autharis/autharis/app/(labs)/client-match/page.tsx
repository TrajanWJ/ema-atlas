import { ClientMatchLab } from '@/components/client-match/client-match-lab';
import { getClientMatchLab, getDefaultClientMatchLabJobId } from '@/lib/client-match/data';

export default function ClientMatchLabIndexPage() {
  return <ClientMatchLab lab={getClientMatchLab(getDefaultClientMatchLabJobId())} />;
}
