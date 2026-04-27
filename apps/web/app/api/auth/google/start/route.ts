import { createHash } from "node:crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { randomToken, requiredEnv, secureCookie, signJson } from "../../_lib/auth-core";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const clientId = requiredEnv("EMA_GOOGLE_CLIENT_ID");
    requiredEnv("EMA_GOOGLE_CLIENT_SECRET");
    const url = new URL(request.url);
    const redirectUri = process.env.EMA_GOOGLE_REDIRECT_URI?.trim() || new URL("/api/auth/google/callback", url.origin).toString();
    const state = randomToken(24);
    const nonce = randomToken(24);
    const verifier = randomToken(64);
    const challenge = createHash("sha256").update(verifier).digest("base64url");

    const cookieStore = await cookies();
    cookieStore.set("ema_google_oauth", signJson({ state, nonce, verifier, redirectUri }, 600), {
      httpOnly: true,
      sameSite: "lax",
      secure: secureCookie(),
      path: "/",
      maxAge: 600,
    });

    const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
    authUrl.searchParams.set("client_id", clientId);
    authUrl.searchParams.set("redirect_uri", redirectUri);
    authUrl.searchParams.set("response_type", "code");
    authUrl.searchParams.set("scope", "openid email profile");
    authUrl.searchParams.set("state", state);
    authUrl.searchParams.set("nonce", nonce);
    authUrl.searchParams.set("code_challenge", challenge);
    authUrl.searchParams.set("code_challenge_method", "S256");
    authUrl.searchParams.set("prompt", "select_account");

    return NextResponse.redirect(authUrl);
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Google OAuth is not configured" }, { status: 500 });
  }
}
