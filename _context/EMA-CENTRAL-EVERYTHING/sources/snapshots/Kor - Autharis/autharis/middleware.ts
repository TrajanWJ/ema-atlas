import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import {
  AUTH_SESSION_COOKIE,
  clearSessionCookie,
  getRequiredRoleForPath,
  readSessionFromCookieStore,
} from "@/lib/auth";

function buildRequestedPath(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  return `${pathname}${search}`;
}

export async function middleware(request: NextRequest) {
  const requiredRole = getRequiredRoleForPath(request.nextUrl.pathname);

  if (!requiredRole) {
    return NextResponse.next();
  }

  const session = await readSessionFromCookieStore(request.cookies);

  if (!session) {
    const redirectUrl = new URL("/auth", request.url);
    redirectUrl.searchParams.set("next", buildRequestedPath(request));

    if (request.cookies.get(AUTH_SESSION_COOKIE)) {
      redirectUrl.searchParams.set("error", "invalid-session");
      return clearSessionCookie(NextResponse.redirect(redirectUrl));
    }

    return NextResponse.redirect(redirectUrl);
  }

  if (session.role !== requiredRole) {
    const redirectUrl = new URL("/auth/denied", request.url);
    redirectUrl.searchParams.set("next", buildRequestedPath(request));
    redirectUrl.searchParams.set("required", requiredRole);
    return NextResponse.redirect(redirectUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/client/:path*", "/talent/:path*", "/admin/:path*"],
};
