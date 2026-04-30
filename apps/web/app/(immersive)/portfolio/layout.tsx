import type { ReactNode } from 'react';
import './portfolio.css';

/**
 * Portfolio layout — overrides the parent immersive layout's styles.
 * The portfolio is a full-screen scroll experience that needs its own
 * scroll container without the shared nav padding.
 */
export default function PortfolioLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <div className="portfolio-root">{children}</div>;
}
