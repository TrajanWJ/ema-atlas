import type { Metadata } from 'next';

import { ClientShell } from '@/components/client/client-shell';
import '@/styles/client.css';

export const metadata: Metadata = {
  title: 'Autharis Client Surface',
  description: 'Isolated client dashboard, requests, matches, engagements, timesheets, and invoices.',
};

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return <ClientShell>{children}</ClientShell>;
}
