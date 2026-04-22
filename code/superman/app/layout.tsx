import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'CodeVault',
  description: 'AI-powered code intelligence',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-[#0f1117] antialiased">{children}</body>
    </html>
  );
}
