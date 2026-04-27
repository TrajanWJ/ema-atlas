import type { Metadata } from "next";
import { TalentJoinExperience } from "@/components/marketing/talent-join/TalentJoinExperience";

export const metadata: Metadata = {
  title: "Autharis | Join the Talent Network",
  description:
    "A talent-facing marketing route showing how Autharis positions skilled remote operators for hourly, trust-first engagements.",
};

export default function TalentJoinPage() {
  return <TalentJoinExperience />;
}
