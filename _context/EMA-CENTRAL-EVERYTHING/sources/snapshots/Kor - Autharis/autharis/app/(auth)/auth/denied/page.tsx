import type { Metadata } from "next";

import { AuthConsole } from "@/components/auth/AuthConsole";
import { getSession, isUserRole, type UserRole } from "@/lib/auth";

type AuthDeniedPageProps = {
  searchParams: Promise<{
    next?: string | string[];
    required?: string | string[];
  }>;
};

export const metadata: Metadata = {
  title: "Autharis Access Denied",
  description: "Role mismatch handoff for isolated Autharis surfaces.",
};

function takeFirst(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value ?? null;
}

function parseRequiredRole(value: string | null): UserRole | null {
  return isUserRole(value) ? value : null;
}

export default async function AuthDeniedPage({ searchParams }: AuthDeniedPageProps) {
  const [{ next, required }, currentSession] = await Promise.all([searchParams, getSession()]);

  return (
    <AuthConsole
      currentSession={currentSession}
      nextPath={takeFirst(next)}
      requiredRole={parseRequiredRole(takeFirst(required))}
    />
  );
}
