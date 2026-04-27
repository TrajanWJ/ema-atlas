import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { hasTotpEnabled } from "../_lib/auth-store";
import { type GoogleSession, type TotpSession, readSignedJson } from "../_lib/auth-core";

export const runtime = "nodejs";

export async function GET() {
  const cookieStore = await cookies();
  const google = readSignedJson<GoogleSession>(cookieStore.get("ema_google_session")?.value);
  const totp = readSignedJson<TotpSession>(cookieStore.get("ema_totp_session")?.value);
  const authenticatorEnabled = google ? await hasTotpEnabled(google.googleSub) : false;
  return NextResponse.json({
    ok: true,
    google,
    authenticator: Boolean(google && totp && totp.googleSub === google.googleSub),
    authenticatorEnabled,
    machinePeer: false,
    sessionKind: google ? "browser_access" : "anonymous_browser",
  });
}
