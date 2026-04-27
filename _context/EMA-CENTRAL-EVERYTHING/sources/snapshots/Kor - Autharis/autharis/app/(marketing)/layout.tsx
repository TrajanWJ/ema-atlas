import type { ReactNode } from "react";
import {
  IBM_Plex_Mono,
  Newsreader,
  Public_Sans,
} from "next/font/google";

const display = Newsreader({
  subsets: ["latin"],
  variable: "--font-marketing-display",
});

const body = Public_Sans({
  subsets: ["latin"],
  variable: "--font-marketing-body",
});

const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-marketing-mono",
});

export default function MarketingLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className={`${display.variable} ${body.variable} ${mono.variable}`}>
      {children}
    </div>
  );
}
