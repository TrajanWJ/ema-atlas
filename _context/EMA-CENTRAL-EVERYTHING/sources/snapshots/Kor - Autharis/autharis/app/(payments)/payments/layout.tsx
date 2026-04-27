import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Autharis Payments Simulation",
  description: "Lane-local payments and invoicing simulation with invoice state transitions and a webhook stub.",
};

export default function PaymentsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
