export const userRoles = ["client", "talent", "admin"] as const;

export type UserRole = (typeof userRoles)[number];

export type AuthSession = {
  version: 1;
  profileId: string;
  userId: string;
  name: string;
  email: string;
  role: UserRole;
  title: string;
  organization: string;
  issuedAt: string;
  impersonationMode: "dev";
};

export type DemoProfile = {
  id: string;
  role: UserRole;
  name: string;
  email: string;
  title: string;
  organization: string;
  userId: string;
  defaultPath: string;
  notes: string;
};
