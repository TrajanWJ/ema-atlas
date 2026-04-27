import type { Metadata } from 'next';

import '@/styles/client-finance.css';

export const metadata: Metadata = {
  title: 'Autharis Client Finance Lab',
  description: 'A client-adjacent finance packet lab for release gating, invoice review, and payer visibility.',
};

export default function ClientFinanceLabLayout({ children }: { children: React.ReactNode }) {
  return children;
}
