import type { Metadata } from 'next';

import '@/styles/client-request.css';

export const metadata: Metadata = {
  title: 'Autharis Client Request Lab',
  description: 'A client-adjacent lab for composing, pressure-testing, and previewing a request brief.',
};

export default function ClientRequestLabLayout({ children }: { children: React.ReactNode }) {
  return children;
}
