import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import {
  createSessionFromDemoProfile,
  resolveAuthorizedPath,
  setSessionCookie,
} from "@/lib/auth";

// Dev-only URL-parameter login for agent/E2E testing.
// Usage: GET /auth/session/login?profile=talent-amara-okafor&next=/talent
// Disabled when NODE_ENV === "production".
export async function GET(request: NextRequest) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "disabled-in-production" }, { status: 404 });
  }

  const url = request.nextUrl;
  const profileId = url.searchParams.get("profile");
  const next = url.searchParams.get("next");

  if (!profileId) {
    return NextResponse.json(
      {
        error: "missing-profile",
        hint: "Pass ?profile=<id>&next=<path>. Known ids: client-meridian-ops, talent-amara-okafor, admin-jordan-vale.",
      },
      { status: 400 },
    );
  }

  const session = createSessionFromDemoProfile(profileId);

  if (!session) {
    return NextResponse.json({ error: "unknown-profile", profileId }, { status: 404 });
  }

  const targetPath = resolveAuthorizedPath(next, session.role);
  const response = NextResponse.redirect(new URL(targetPath, request.url));
  return setSessionCookie(response, session);
}
