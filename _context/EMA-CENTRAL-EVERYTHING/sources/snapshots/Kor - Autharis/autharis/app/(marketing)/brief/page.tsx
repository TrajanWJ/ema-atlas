import type { Metadata } from "next";
import { BriefIntakeExperience } from "@/components/marketing/brief/BriefIntakeExperience";

export const metadata: Metadata = {
  title: "Autharis | Start a Brief",
  description:
    "An isolated marketing demo showing how Autharis can turn a nuanced workflow into a scoped, trustworthy operator brief.",
};

export default function BriefPage() {
  return <BriefIntakeExperience />;
}
