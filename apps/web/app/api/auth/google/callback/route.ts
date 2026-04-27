import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { upsertGoogleUser } from "../../_lib/auth-store";
import { readSignedJson, requiredEnv, secureCookie, signJson, verifyGoogleIdToken } from "../../_lib/auth-core";

export const runtime = "nodejs";

type OAuthCookie = {
  state: string;
  nonce: string;
  verifier: string;
  redirectUri: string;
};

type GoogleTokenResponse = {
  id_token?: string;
  error?: string;
  error_description?: string;
};

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const cookieStore = await cookies();
  const oauth = readSignedJson<OAuthCookie>(cookieStore.get("ema_google_oauth")?.value);

  if (!code || !state || !oauth || oauth.state !== state) {
    return NextResponse.redirect(new URL("/?auth_error=google_state", url.origin));
  }

  try {
    const body = new URLSearchParams({
      code,
      client_id: requiredEnv("EMA_GOOGLE_CLIENT_ID"),
      client_secret: requiredEnv("EMA_GOOGLE_CLIENT_SECRET"),
      redirect_uri: oauth.redirectUri,
      grant_type: "authorization_code",
      code_verifier: oauth.verifier,
    });
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body,
    });
    const tokenJson = (await tokenResponse.json()) as GoogleTokenResponse;
    if (!tokenResponse.ok || !tokenJson.id_token) {
      throw new Error(tokenJson.error_description || tokenJson.error || "Google token exchange failed");
    }

    const session = await verifyGoogleIdToken(tokenJson.id_token, oauth.nonce);
    await upsertGoogleUser(session);
    cookieStore.set("ema_google_session", signJson(session, 60 * 60 * 8), {
      httpOnly: true,
      sameSite: "lax",
      secure: secureCookie(),
      path: "/",
      maxAge: 60 * 60 * 8,
    });
    cookieStore.delete("ema_google_oauth");
    return NextResponse.redirect(new URL("/?auth=google", url.origin));
  } catch (error) {
    const next = new URL("/?auth_error=google_callback", url.origin);
    next.searchParams.set("reason", error instanceof Error ? error.message : "unknown");
    return NextResponse.redirect(next);
  }
}
