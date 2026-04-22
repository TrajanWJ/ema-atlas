import type { Metadata } from 'next';
import { PortfolioShell } from './components/PortfolioShell';

export const metadata: Metadata = {
  title: 'Trajan — Portfolio',
  description: 'Trajan — keeping everything in the air.',
};

export default function PortfolioPage() {
  return <PortfolioShell />;
}
