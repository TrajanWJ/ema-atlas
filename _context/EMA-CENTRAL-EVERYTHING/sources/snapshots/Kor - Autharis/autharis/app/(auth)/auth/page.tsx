import type { Metadata } from "next";

import { AuthConsole } from "@/components/auth/AuthConsole";
import { getSession } from "@/lib/auth";

type AuthPageProps = {
  searchParams: Promise<{
    error?: string | string[];
    next?: string | string[];
  }>;
};

export const metadata: Metadata = {
  title: "Autharis Access",
  description: "Dev-only auth and role impersonation for isolated Autharis surfaces.",
};

function takeFirst(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value ?? null;
}

export default async function AuthPage({ searchParams }: AuthPageProps) {
  const [{ error, next }, currentSession] = await Promise.all([searchParams, getSession()]);

  return (
    <AuthConsole
      currentSession={currentSession}
      errorCode={takeFirst(error)}
      nextPath={takeFirst(next)}
    />
  );
}
