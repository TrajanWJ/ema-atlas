import type { Metadata } from 'next';

import '@/styles/client-match.css';

export const metadata: Metadata = {
  title: 'Autharis Client Match Lab',
  description: 'A client-adjacent match review lab with richer comparison, interview, and launch moments.',
};

export default function ClientMatchLabLayout({ children }: { children: React.ReactNode }) {
  return children;
}
