import Link from "next/link";
import { ReactNode } from "react";

import { topLevelRoutes } from "@/lib/ema-atlas";

type SiteShellProps = {
  children: ReactNode;
  eyebrow?: string;
  title?: string;
  intro?: string;
};

export function SiteShell({ children, eyebrow, title, intro }: SiteShellProps) {
  return (
    <div className="shell">
      <div className="shell__backdrop" />
      <header className="masthead">
        <div className="masthead__topline">
          <span className="masthead__stamp">EMA 0.0.3 / Atlas Stage</span>
          <nav className="nav">
            {topLevelRoutes.map((route) => (
              <Link key={route.href} className="nav__link" href={route.href}>
                {route.label}
              </Link>
            ))}
          </nav>
        </div>
        {(eyebrow || title || intro) && (
          <div className="hero">
            {eyebrow ? <p className="hero__eyebrow">{eyebrow}</p> : null}
            {title ? <h1 className="hero__title">{title}</h1> : null}
            {intro ? <p className="hero__intro">{intro}</p> : null}
          </div>
        )}
      </header>
      <main className="content">{children}</main>
    </div>
  );
}
