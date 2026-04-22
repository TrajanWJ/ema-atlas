import type { Metadata } from "next";
import "./globals.css";
import ToastProvider from "@/components/ToastProvider";
import GatewayProvider from "@/components/GatewayProvider";

export const metadata: Metadata = {
  title: "OpenClaw Observer",
  description: "System observer for the OpenClaw agent platform",
  icons: {
    icon: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased min-h-screen">
        <ToastProvider>
          <GatewayProvider />
          {children}
        </ToastProvider>
      </body>
    </html>
  );
}
