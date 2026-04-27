import type { Metadata } from "next";
import "@ema/design-system/tokens.css";
import "../src/app/styles.css";
import "./globals.css";
import "./donor-tailwind-subset.css";

export const metadata: Metadata = {
  title: "EMA vDesktop",
  description: "EMA browser vDesktop reflected from the place.org stack.",
};

export const viewport = {
  themeColor: "#060610",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
