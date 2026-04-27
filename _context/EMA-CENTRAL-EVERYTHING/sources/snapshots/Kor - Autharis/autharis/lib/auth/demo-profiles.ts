import type { AuthSession, DemoProfile } from "@/lib/auth/types";

export const demoProfiles: DemoProfile[] = [
  {
    id: "client-meridian-ops",
    role: "client",
    name: "Olivia Mercer",
    email: "olivia.mercer@meridian-health.example",
    title: "Client Operations Lead",
    organization: "Meridian Health",
    userId: "client_olivia_mercer",
    defaultPath: "/client",
    notes: "Owns briefs, reviews match packets, and tracks operating outcomes.",
  },
  {
    id: "talent-amara-okafor",
    role: "talent",
    name: "Amara Okafor",
    email: "amara.okafor@talent-autharis.example",
    title: "Care Operations Specialist",
    organization: "Independent Talent",
    userId: "talent_amara_okafor",
    defaultPath: "/talent",
    notes: "Reviews opportunities, accepts engagements, and manages payout steps.",
  },
  {
    id: "admin-jordan-vale",
    role: "admin",
    name: "Jordan Vale",
    email: "jordan.vale@autharis.example",
    title: "Market Operator",
    organization: "Autharis HQ",
    userId: "admin_jordan_vale",
    defaultPath: "/admin",
    notes: "Runs queue triage, matching oversight, and dispute resolution.",
  },
];

export function getDemoProfiles() {
  return demoProfiles;
}

export function getDemoProfileById(profileId: string) {
  return demoProfiles.find((profile) => profile.id === profileId) ?? null;
}

export function createSessionFromDemoProfile(profileId: string): AuthSession | null {
  const profile = getDemoProfileById(profileId);

  if (!profile) {
    return null;
  }

  return {
    version: 1,
    profileId: profile.id,
    userId: profile.userId,
    name: profile.name,
    email: profile.email,
    role: profile.role,
    title: profile.title,
    organization: profile.organization,
    issuedAt: new Date().toISOString(),
    impersonationMode: "dev",
  };
}
