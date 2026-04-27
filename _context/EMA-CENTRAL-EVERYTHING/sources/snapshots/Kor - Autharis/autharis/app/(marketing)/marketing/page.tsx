import type { Metadata } from "next";
import { MarketingExperience } from "@/components/marketing/MarketingExperience";

export const metadata: Metadata = {
  title: "Autharis | Marketing Preview",
  description:
    "Editorial marketing preview for Autharis, focused on the timecard-led hero and human-in-the-loop operator model.",
};

export default function MarketingPreviewPage() {
  return <MarketingExperience />;
}
