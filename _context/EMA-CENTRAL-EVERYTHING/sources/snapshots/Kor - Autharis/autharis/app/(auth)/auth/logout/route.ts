import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { clearSessionCookie } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const response = NextResponse.redirect(new URL("/auth", request.url));
  return clearSessionCookie(response);
}
