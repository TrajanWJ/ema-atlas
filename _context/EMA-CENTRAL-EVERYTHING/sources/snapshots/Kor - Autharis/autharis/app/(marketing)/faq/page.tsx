import type { Metadata } from "next";
import { FaqExperience } from "@/components/marketing/faq/FaqExperience";

export const metadata: Metadata = {
  title: "Autharis | FAQ",
  description:
    "A buyer-trust FAQ and objections rail explaining how Autharis scopes, matches, and reviews hourly operator coverage for human-in-the-loop workflows.",
};

export default function FaqPage() {
  return <FaqExperience />;
}
