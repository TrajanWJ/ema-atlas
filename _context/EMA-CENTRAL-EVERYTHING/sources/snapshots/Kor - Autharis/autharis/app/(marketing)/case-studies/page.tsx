import type { Metadata } from "next";
import { CaseStudiesIndex } from "@/components/marketing/case-studies/CaseStudiesIndex";

export const metadata: Metadata = {
  title: "Autharis | Case Studies",
  description:
    "Editorial case studies showing how Autharis deploys vetted remote operators into care coordination, logistics, intake, and human-in-the-loop workflows.",
};

export default function CaseStudiesPage() {
  return <CaseStudiesIndex />;
}
