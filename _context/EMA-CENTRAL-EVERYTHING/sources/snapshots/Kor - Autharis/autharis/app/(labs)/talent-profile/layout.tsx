import type { Metadata } from "next";

import "@/styles/talent-profile.css";

export const metadata: Metadata = {
  title: "Autharis Talent Public Profile Lab",
  description:
    "A shareable talent dossier lab route that previews a public-facing version of the Autharis talent profile.",
};

export default function TalentProfileLabLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

