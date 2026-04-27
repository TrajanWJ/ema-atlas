import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "EMA Atlas",
  description:
    "An evolving Next.js atlas for the EMA project: futures, graphs, slides, canvas boards, docs, and desktop surface."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
