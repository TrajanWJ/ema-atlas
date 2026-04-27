import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "Autharis — Status",
  description: "Uptime + incident history for every Autharis service.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="shell">
          <nav className="top">
            <a href="/">Overview</a>
            <a href="/incidents">Incidents</a>
          </nav>
          {children}
        </div>
      </body>
    </html>
  );
}
