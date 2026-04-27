import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import {
  createSessionFromDemoProfile,
  getSession,
  resolveAuthorizedPath,
  setSessionCookie,
} from "@/lib/auth";

function redirectWithError(request: NextRequest, errorCode: string) {
  const url = new URL("/auth", request.url);
  url.searchParams.set("error", errorCode);
  return NextResponse.redirect(url);
}

export async function GET(request: NextRequest) {
  const session = await getSession();
  return NextResponse.json({ session, requestedAt: new Date().toISOString(), path: request.nextUrl.pathname });
}

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const profileId = formData.get("profileId");
  const redirectTo = formData.get("redirectTo");

  if (typeof profileId !== "string") {
    return redirectWithError(request, "unknown-profile");
  }

  const session = createSessionFromDemoProfile(profileId);

  if (!session) {
    return redirectWithError(request, "unknown-profile");
  }

  const targetPath = resolveAuthorizedPath(
    typeof redirectTo === "string" ? redirectTo : null,
    session.role,
  );

  const response = NextResponse.redirect(new URL(targetPath, request.url));
  return setSessionCookie(response, session);
}
